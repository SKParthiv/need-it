from django.contrib.auth import get_user_model
from django.test import TestCase
from django.utils import timezone
from unittest.mock import patch
from apps.orders.models import Request
from apps.payments.models import Payment, PaymentStatus
from apps.payments import services

User = get_user_model()


class PaymentTests(TestCase):
    def setUp(self):
        self.cust = User.objects.create_user("cust", password="x")
        self.req = Request.objects.create(customer=self.cust, needed_by=timezone.now(),
                                          pickup_point="Main Gate", expected_total=100)

    def test_release_is_idempotent(self):
        """Releasing twice must not double-pay — the retry-safety property."""
        p = Payment.objects.create(request=self.req, item_cost=80, helper_fee=20,
                                   idempotency_key="k1", status=PaymentStatus.HELD)
        services.release_to_helper(p)
        services.release_to_helper(p)  # second call is a safe no-op
        p.refresh_from_db()
        self.assertEqual(p.status, PaymentStatus.RELEASED)

    def test_total_is_cost_plus_fee(self):
        p = Payment(item_cost=80, helper_fee=20)
        self.assertEqual(p.total, 100)


class PaymentHttpFlowTests(TestCase):
    """The /pay + /confirm-payment endpoints end-to-end. The original create_payment
    returned a provider dict instead of the Payment object, 500-ing every /pay call —
    untested code shipped broken. These tests are the regression net."""

    def setUp(self):
        from rest_framework.test import APIClient
        from apps.orders.models import OrderStatus, RequestItem
        self.cust = User.objects.create_user("c1", password="x")
        self.helper = User.objects.create_user("h1", password="x")
        self.outsider = User.objects.create_user("o1", password="x")
        self.order = Request.objects.create(
            customer=self.cust, helper=self.helper, status=OrderStatus.ACCEPTED,
            needed_by=timezone.now(), pickup_point="Main Gate", expected_total=100)
        RequestItem.objects.create(request=self.order, name="Bread", expected_price=40,
                                   actual_price=45, price_approved=True)
        RequestItem.objects.create(request=self.order, name="Milk", expected_price=30,
                                   actual_price=30, price_approved=True,
                                   status=RequestItem.ItemStatus.UNAVAILABLE)
        self.client = APIClient()

    def _pay(self, user=None, fee=20):
        self.client.force_authenticate(user or self.cust)
        return self.client.post(f"/api/orders/{self.order.id}/pay/", {"helperFee": fee}, format="json")

    def test_pay_happy_path_excludes_unavailable_items(self):
        resp = self._pay()
        self.assertEqual(resp.status_code, 201)
        # Milk is unavailable: only Bread (45) + fee (20) is charged.
        self.assertEqual(resp.json()["total"], 65)
        self.assertEqual(resp.json()["status"], "pending")

    def test_pay_requires_accepted_order(self):
        self.order.status = "open"
        self.order.helper = None
        self.order.save()
        resp = self._pay()
        self.assertEqual(resp.status_code, 400)

    def test_pay_twice_never_regresses_held(self):
        self._pay()
        p = Payment.objects.get(request=self.order)
        p.status = PaymentStatus.HELD
        p.save()
        resp = self._pay()
        self.assertEqual(resp.status_code, 201)
        p.refresh_from_db()
        self.assertEqual(p.status, PaymentStatus.HELD)  # not pended again

    def test_pay_rejects_unapproved_prices(self):
        self.order.items.filter(name="Bread").update(price_approved=False)
        resp = self._pay()
        self.assertEqual(resp.status_code, 400)

    def test_pay_fee_bounds(self):
        self.assertEqual(self._pay(fee=5).status_code, 400)
        self.assertEqual(self._pay(fee=500).status_code, 400)

    def test_only_customer_can_pay(self):
        resp = self._pay(user=self.helper)
        self.assertEqual(resp.status_code, 404)

    def test_double_confirm_holds_payment(self):
        self._pay()
        url = f"/api/orders/{self.order.id}/confirm-payment/"
        self.client.force_authenticate(self.cust)
        self.assertEqual(self.client.post(url).status_code, 200)
        self.client.force_authenticate(self.helper)
        resp = self.client.post(url)
        self.assertEqual(resp.json()["status"], "held")

    def test_outsider_cannot_confirm(self):
        self._pay()
        self.client.force_authenticate(self.outsider)
        resp = self.client.post(f"/api/orders/{self.order.id}/confirm-payment/")
        self.assertEqual(resp.status_code, 403)


class PayoutFlowTests(TestCase):
    """Merchant-of-record settlement: the platform collected the customer's
    money, so completing an order creates a Payout owed to the helper —
    exactly once, and only when the provider settles via the platform."""

    def setUp(self):
        from rest_framework.test import APIClient
        from apps.orders.models import OrderStatus, RequestItem
        self.cust = User.objects.create_user("pc", email="pc@sastra.ac.in",
                                             password="x", is_verified_student=True)
        self.helper = User.objects.create_user("ph", email="ph@sastra.ac.in",
                                               password="x", role="helper",
                                               is_verified_student=True,
                                               upi_id="helper@okhdfc")
        self.staff = User.objects.create_user("boss", email="boss@sastra.ac.in",
                                              password="x", is_staff=True)
        self.order = Request.objects.create(
            customer=self.cust, helper=self.helper, status=OrderStatus.ACCEPTED,
            needed_by=timezone.now(), pickup_point="Main Gate", expected_total=100)
        RequestItem.objects.create(request=self.order, name="Bread", expected_price=40,
                                   actual_price=45, price_approved=True)
        self.client = APIClient()

    def _complete_order(self):
        """Drive the order to COMPLETED through the real service path:
        pay -> double-confirm -> escrow gate -> handover double-confirm."""
        from apps.orders import services as order_services
        payment = services.create_payment(self.order, 45, 20, "pk1")
        services.confirm_payment(payment, self.cust)
        payment.refresh_from_db()
        services.confirm_payment(payment, self.helper)  # both confirmed -> HELD
        order_services.mark_purchased(self.order.id, self.helper)
        self.order.refresh_from_db()
        return order_services.confirm_handover(self.order.id, self.helper,
                                               self.order.handover_code)

    def _platform_collected(self):
        """Pretend the payment provider settles into the platform account (MoR)."""
        mock = patch("apps.payments.services.provider_by_name")
        provider = mock.start().return_value
        provider.settles_via_platform = True
        self.addCleanup(mock.stop)

    def test_payout_created_when_platform_collected(self):
        from apps.payments.models import Payout, PayoutStatus
        self._platform_collected()
        order = self._complete_order()
        self.assertEqual(order.status, "completed")
        payout = Payout.objects.get(request=self.order)
        self.assertEqual(payout.helper, self.helper)
        self.assertEqual(payout.item_cost, 45)
        self.assertEqual(payout.helper_fee, 20)
        self.assertEqual(payout.platform_cut, 2)  # PLATFORM_CUT_PER_ORDER default
        self.assertEqual(payout.amount, 63)       # 45 + 20 - 2
        self.assertEqual(payout.upi_id, "helper@okhdfc")
        self.assertEqual(payout.status, PayoutStatus.DUE)

    def test_no_payout_in_manual_mode(self):
        from apps.payments.models import Payout
        self._complete_order()
        self.assertEqual(Payout.objects.count(), 0)  # money went customer→helper

    def test_payout_created_exactly_once(self):
        from apps.payments.models import Payout
        self._platform_collected()
        self._complete_order()
        self.order.refresh_from_db()
        services.create_payout_for_order(self.order)  # crash-retry safe
        self.assertEqual(Payout.objects.count(), 1)

    def test_cut_never_exceeds_fee(self):
        from apps.payments.models import Payout
        self._platform_collected()
        with self.settings(PLATFORM_CUT_PER_ORDER=50):
            self._complete_order()
        payout = Payout.objects.get(request=self.order)
        self.assertEqual(payout.platform_cut, 20)  # clamped to the fee
        self.assertEqual(payout.amount, 45)        # helper always keeps item cost

    def test_mark_paid_flow_and_double_settle_guard(self):
        from apps.payments.models import Payout, PayoutStatus
        self._platform_collected()
        self._complete_order()
        payout = Payout.objects.get(request=self.order)
        self.client.force_authenticate(self.staff)
        url = f"/api/admin/payouts/{payout.id}/mark-paid/"
        resp = self.client.post(url, {"utr": "UTR123456789"}, format="json")
        self.assertEqual(resp.status_code, 200)
        payout.refresh_from_db()
        self.assertEqual(payout.status, PayoutStatus.PAID)
        self.assertEqual(payout.utr, "UTR123456789")
        self.assertEqual(payout.paid_by, self.staff)
        self.assertIsNotNone(payout.paid_at)
        resp = self.client.post(url, {"utr": "UTR999"}, format="json")
        self.assertEqual(resp.status_code, 409)  # already settled — never twice

    def test_mark_paid_requires_staff(self):
        from apps.payments.models import Payout
        self._platform_collected()
        self._complete_order()
        payout = Payout.objects.get(request=self.order)
        url = f"/api/admin/payouts/{payout.id}/mark-paid/"
        self.client.force_authenticate(self.helper)
        self.assertEqual(self.client.post(url, {"utr": "X"}, format="json").status_code, 403)
        self.client.force_authenticate(user=None)
        resp = self.client.post(url, {"utr": "X"}, format="json")
        self.assertIn(resp.status_code, (401, 403))

    def test_mark_paid_requires_utr(self):
        from apps.payments.models import Payout
        self._platform_collected()
        self._complete_order()
        payout = Payout.objects.get(request=self.order)
        self.client.force_authenticate(self.staff)
        resp = self.client.post(f"/api/admin/payouts/{payout.id}/mark-paid/", {}, format="json")
        self.assertEqual(resp.status_code, 400)

    def test_admin_list_shows_live_upi_and_breakdown(self):
        from apps.payments.models import Payout
        self._platform_collected()
        self._complete_order()
        Payout.objects.get(request=self.order)
        self.helper.upi_id = "newhandle@okicici"  # changed after payout creation
        self.helper.save(update_fields=("upi_id",))
        self.client.force_authenticate(self.staff)
        resp = self.client.get("/api/admin/payouts/?status=due")
        self.assertEqual(resp.status_code, 200)
        row = resp.json()[0]
        self.assertEqual(row["upiId"], "newhandle@okicici")          # live value wins
        self.assertEqual(row["upiIdAtCreation"], "helper@okhdfc")    # snapshot kept
        self.assertEqual(row["amount"], 63)
        self.assertEqual(row["platformCut"], 2)
        self.assertEqual(row["helper"]["email"], "ph@sastra.ac.in")

    def test_earnings_shows_helper_own_only(self):
        self._platform_collected()
        self._complete_order()
        self.client.force_authenticate(self.helper)
        resp = self.client.get("/api/earnings/")
        self.assertEqual(resp.status_code, 200)
        self.assertEqual(resp.json()["dueTotal"], 63)
        self.assertEqual(resp.json()["paidTotal"], 0)
        self.assertEqual(len(resp.json()["payouts"]), 1)
        self.client.force_authenticate(self.cust)
        resp = self.client.get("/api/earnings/")
        self.assertEqual(resp.json()["dueTotal"], 0)
        self.assertEqual(resp.json()["payouts"], [])
