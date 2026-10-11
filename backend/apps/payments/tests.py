from django.contrib.auth import get_user_model
from django.test import TestCase
from django.utils import timezone
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
