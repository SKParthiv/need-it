from django.contrib.auth import get_user_model
from django.test import TestCase, override_settings
from django.utils import timezone
from apps.orders.models import OrderStatus, Request, RequestItem
from apps.orders import services
from apps.payments.models import Payment, PaymentStatus

User = get_user_model()


def make_req(customer):
    return Request.objects.create(customer=customer, needed_by=timezone.now(),
                                  pickup_point="Main Gate", expected_total=100)


class StateMachineTests(TestCase):
    def setUp(self):
        self.cust = User.objects.create_user("cust", password="x")
        self.helper = User.objects.create_user("help", password="x")
        self.helper.role = "helper"
        self.helper.is_verified_student = True
        self.helper.save(update_fields=("role", "is_verified_student"))
        self.req = make_req(self.cust)

    def test_two_helpers_cannot_both_accept(self):
        services.accept(self.req.id, self.helper)
        with self.assertRaises(services.ConflictLost):
            services.accept(self.req.id, User.objects.create_user("h2", password="x"))

    def test_illegal_transition_rejected(self):
        with self.assertRaises(services.IllegalTransition):
            services.mark_purchased(self.req.id, self.helper)  # open -> purchased not allowed

    def test_cannot_purchase_without_held_payment(self):
        """THE escrow gate: no held money, no purchase. Helper never fronts cash."""
        services.accept(self.req.id, self.helper)
        with self.assertRaises(services.IllegalTransition):
            services.mark_purchased(self.req.id, self.helper)

    def test_only_assigned_helper_can_mark_purchased(self):
        services.accept(self.req.id, self.helper)
        Payment.objects.create(request=self.req, item_cost=80, helper_fee=20,
                               idempotency_key="k-assigned", status=PaymentStatus.HELD)
        other_helper = User.objects.create_user("other")
        other_helper.role = "helper"
        other_helper.is_verified_student = True
        other_helper.save(update_fields=("role", "is_verified_student"))
        with self.assertRaises(services.IllegalTransition):
            services.mark_purchased(self.req.id, other_helper)

    def test_full_happy_path(self):
        services.accept(self.req.id, self.helper)
        Payment.objects.create(request=self.req, item_cost=80, helper_fee=20,
                               idempotency_key="k1", status=PaymentStatus.HELD)
        services.mark_purchased(self.req.id, self.helper)
        self.req.refresh_from_db()
        obj = services.confirm_handover(self.req.id, self.helper, self.req.handover_code)
        self.assertEqual(obj.status, OrderStatus.COMPLETED)

    def test_release_returns_to_feed(self):
        services.accept(self.req.id, self.helper)
        obj = services.release(self.req.id, self.helper)
        self.assertEqual(obj.status, OrderStatus.OPEN)
        self.assertIsNone(Request.objects.get(id=self.req.id).helper)

    def test_cancel_refunds_held_payment(self):
        services.accept(self.req.id, self.helper)
        payment = Payment.objects.create(
            request=self.req, item_cost=80, helper_fee=20,
            idempotency_key="k-cancel", status=PaymentStatus.HELD,
        )
        obj = services.cancel(self.req.id, self.helper)
        self.assertEqual(obj.status, OrderStatus.CANCELLED)
        payment.refresh_from_db()
        self.assertEqual(payment.status, PaymentStatus.REFUNDED)


class TimeoutSweepTests(TestCase):
    def setUp(self):
        self.customer = User.objects.create_user(
            "sweep-c@sastra.ac.in", password="x", role="customer", is_verified_student=True)
        self.helper = User.objects.create_user(
            "sweep-h@sastra.ac.in", password="x", role="helper", is_verified_student=True)
        from django.utils import timezone
        self.req = Request.objects.create(
            customer=self.customer, needed_by=timezone.now(),
            pickup_point="Boys Hostel Area", expected_total=100)
        RequestItem.objects.create(request=self.req, name="Maggi", quantity=2, expected_price=100)

    def _make_stale(self, minutes=60):
        from django.utils import timezone
        from datetime import timedelta
        services.accept(self.req.id, self.helper)
        Request.objects.filter(pk=self.req.id).update(
            updated_at=timezone.now() - timedelta(minutes=minutes))

    def test_stale_unpaid_accepted_order_returns_to_feed(self):
        self._make_stale()
        released = services.sweep_stale_accepted()
        self.assertEqual(released, 1)
        self.req.refresh_from_db()
        self.assertEqual(self.req.status, OrderStatus.OPEN)
        self.assertIsNone(self.req.helper)

    def test_fresh_accepted_order_is_untouched(self):
        services.accept(self.req.id, self.helper)
        self.assertEqual(services.sweep_stale_accepted(), 0)
        self.req.refresh_from_db()
        self.assertEqual(self.req.status, OrderStatus.ACCEPTED)

    def test_held_payment_never_swept(self):
        self._make_stale()
        from apps.payments.models import Payment, PaymentStatus
        Payment.objects.create(request=self.req, item_cost=100, helper_fee=30,
                               status=PaymentStatus.HELD)
        self.assertEqual(services.sweep_stale_accepted(), 0)
        self.req.refresh_from_db()
        self.assertEqual(self.req.status, OrderStatus.ACCEPTED)

    def test_pending_payment_not_swept(self):
        self._make_stale()
        from apps.payments.models import Payment, PaymentStatus
        Payment.objects.create(request=self.req, item_cost=100, helper_fee=30,
                               status=PaymentStatus.PENDING)
        self.assertEqual(services.sweep_stale_accepted(), 0)


class HandoverOtpTests(TestCase):
    """The OTP is the physical-handover proof: the customer SHOWS it, the
    helper ENTERS it, money moves. It must never leak through the API to
    anyone but the customer, and wrong guesses must run out."""

    def setUp(self):
        from rest_framework.test import APIClient
        from apps.payments.models import Payment, PaymentStatus
        self.cust = User.objects.create_user("hc", password="x", is_verified_student=True)
        self.helper = User.objects.create_user("hh", password="x", role="helper",
                                               is_verified_student=True)
        self.other = User.objects.create_user("hx", password="x", role="helper",
                                              is_verified_student=True)
        self.req = Request.objects.create(
            customer=self.cust, helper=self.helper, status=OrderStatus.ACCEPTED,
            needed_by=timezone.now(), pickup_point="Gate", expected_total=100)
        RequestItem.objects.create(request=self.req, name="Milk", expected_price=50,
                                   actual_price=50, price_approved=True)
        Payment.objects.create(request=self.req, item_cost=50, helper_fee=20,
                               idempotency_key="otp-k", status=PaymentStatus.HELD)
        self.client = APIClient()

    def _purchase(self):
        services.mark_purchased(self.req.id, self.helper)
        self.req.refresh_from_db()

    def test_code_born_at_purchase_four_digits(self):
        self.assertEqual(self.req.handover_code, "")
        self._purchase()
        self.assertRegex(self.req.handover_code, r"^\d{4}$")
        self.assertEqual(self.req.handover_attempts, 0)

    def test_customer_sees_code_helper_never_does(self):
        self._purchase()
        self.client.force_authenticate(self.cust)
        data = self.client.get(f"/api/requests/{self.req.id}/").json()
        self.assertEqual(data["handoverCode"], self.req.handover_code)
        self.client.force_authenticate(self.helper)
        data = self.client.get(f"/api/requests/{self.req.id}/").json()
        self.assertIsNone(data["handoverCode"])  # must arrive physically, not via API

    def test_open_order_has_no_code_for_anyone(self):
        self.client.force_authenticate(self.cust)
        data = self.client.get(f"/api/requests/{self.req.id}/").json()
        self.assertIsNone(data["handoverCode"])

    def test_customer_cannot_confirm(self):
        self._purchase()
        self.client.force_authenticate(self.cust)
        resp = self.client.post(f"/api/requests/{self.req.id}/confirm-handover/",
                                {"code": self.req.handover_code}, format="json")
        self.assertEqual(resp.status_code, 403)
        self.req.refresh_from_db()
        self.assertEqual(self.req.status, OrderStatus.PURCHASED)

    def test_wrong_code_counts_attempts_and_locks(self):
        self._purchase()
        url = f"/api/requests/{self.req.id}/confirm-handover/"
        self.client.force_authenticate(self.helper)
        wrong = "0000" if self.req.handover_code != "0000" else "1111"
        for attempt in range(5):
            resp = self.client.post(url, {"code": wrong}, format="json")
            self.assertEqual(resp.status_code, 400)
            self.assertIn("attempt", resp.json()["detail"])
        self.req.refresh_from_db()
        self.assertEqual(self.req.handover_attempts, 5)
        resp = self.client.post(url, {"code": self.req.handover_code}, format="json")
        self.assertEqual(resp.status_code, 400)  # locked — even the right code
        self.assertIn("support", resp.json()["detail"])
        self.req.refresh_from_db()
        self.assertEqual(self.req.status, OrderStatus.PURCHASED)

    def test_right_code_completes_and_releases_money(self):
        self._purchase()
        self.client.force_authenticate(self.helper)
        resp = self.client.post(f"/api/requests/{self.req.id}/confirm-handover/",
                                {"code": self.req.handover_code}, format="json")
        self.assertEqual(resp.status_code, 200)
        self.assertEqual(resp.json()["status"], "completed")
        from apps.payments.models import PaymentStatus
        self.assertEqual(self.req.payment.status, PaymentStatus.RELEASED)

    def test_non_assigned_helper_rejected(self):
        self._purchase()
        self.client.force_authenticate(self.other)
        resp = self.client.post(f"/api/requests/{self.req.id}/confirm-handover/",
                                {"code": self.req.handover_code}, format="json")
        self.assertEqual(resp.status_code, 400)
        self.req.refresh_from_db()
        self.assertEqual(self.req.status, OrderStatus.PURCHASED)

    def test_cannot_handover_twice(self):
        self._purchase()
        self.client.force_authenticate(self.helper)
        url = f"/api/requests/{self.req.id}/confirm-handover/"
        self.assertEqual(self.client.post(url, {"code": self.req.handover_code},
                                          format="json").status_code, 200)
        resp = self.client.post(url, {"code": self.req.handover_code}, format="json")
        self.assertEqual(resp.status_code, 400)  # completed — not awaiting handover


class PhotoEvidenceTests(TestCase):
    """Price evidence: the helper uploads a shelf/receipt photo straight to
    Cloudinary (signed by us), then attaches the URL when proposing a price.
    The customer approves prices they can SEE."""

    CLOUD = "https://res.cloudinary.com/needit-test/"

    def setUp(self):
        from rest_framework.test import APIClient
        self.cust = User.objects.create_user("ec", password="x", is_verified_student=True)
        self.helper = User.objects.create_user("eh", password="x", role="helper",
                                               is_verified_student=True)
        self.req = Request.objects.create(
            customer=self.cust, helper=self.helper, status=OrderStatus.ACCEPTED,
            needed_by=timezone.now(), pickup_point="Gate", expected_total=100)
        self.item = RequestItem.objects.create(request=self.req, name="Bread",
                                               expected_price=40)
        self.client = APIClient()

    def _propose_url(self):
        return f"/api/requests/{self.req.id}/items/{self.item.id}/propose-price/"

    def test_signature_503_when_unconfigured(self):
        from django.test import override_settings
        self.client.force_authenticate(self.helper)
        # Force unconfigured — dev/prod envs may carry real Cloudinary keys.
        with override_settings(CLOUDINARY_CLOUD_NAME="", CLOUDINARY_API_KEY="",
                               CLOUDINARY_API_SECRET=""):
            resp = self.client.get("/api/uploads/signature/")
        self.assertEqual(resp.status_code, 503)

    def test_signature_shape_when_configured(self):
        import hashlib
        from django.test import override_settings
        self.client.force_authenticate(self.helper)
        with override_settings(CLOUDINARY_CLOUD_NAME="needit-test",
                               CLOUDINARY_API_KEY="key123",
                               CLOUDINARY_API_SECRET="secret",
                               CLOUDINARY_FOLDER="needit-evidence"):
            data = self.client.get("/api/uploads/signature/").json()
        expected = hashlib.sha1(
            f"folder=needit-evidence&timestamp={data['timestamp']}secret".encode()
        ).hexdigest()
        self.assertEqual(data["signature"], expected)
        self.assertEqual(data["cloudName"], "needit-test")
        self.assertEqual(data["apiKey"], "key123")

    def test_propose_price_stores_evidence_and_customer_sees_it(self):
        from django.test import override_settings
        self.client.force_authenticate(self.helper)
        with override_settings(CLOUDINARY_CLOUD_NAME="needit-test"):
            resp = self.client.post(self._propose_url(), {
                "actualPrice": 45,
                "evidencePhotoUrl": self.CLOUD + "needit-evidence/abc.jpg",
            }, format="json")
        self.assertEqual(resp.status_code, 200)
        self.item.refresh_from_db()
        self.assertEqual(self.item.evidence_photo_url, self.CLOUD + "needit-evidence/abc.jpg")
        self.client.force_authenticate(self.cust)
        data = self.client.get(f"/api/requests/{self.req.id}/").json()
        self.assertEqual(data["items"][0]["evidencePhotoUrl"],
                         self.CLOUD + "needit-evidence/abc.jpg")

    def test_propose_price_rejects_foreign_photo_url(self):
        from django.test import override_settings
        self.client.force_authenticate(self.helper)
        with override_settings(CLOUDINARY_CLOUD_NAME="needit-test"):
            resp = self.client.post(self._propose_url(), {
                "actualPrice": 45,
                "evidencePhotoUrl": "https://evil.example.com/fake-receipt.jpg",
            }, format="json")
        self.assertEqual(resp.status_code, 400)  # only our uploads count as evidence

    def test_photo_rejected_when_uploads_unconfigured(self):
        from django.test import override_settings
        self.client.force_authenticate(self.helper)
        with override_settings(CLOUDINARY_CLOUD_NAME="", CLOUDINARY_API_KEY="",
                               CLOUDINARY_API_SECRET=""):
            resp = self.client.post(self._propose_url(), {
                "actualPrice": 45,
                "evidencePhotoUrl": self.CLOUD + "needit-evidence/abc.jpg",
            }, format="json")
        self.assertEqual(resp.status_code, 400)  # no cloud configured → no uploads happened

    def test_propose_price_without_photo_still_works(self):
        self.client.force_authenticate(self.helper)
        resp = self.client.post(self._propose_url(), {"actualPrice": 45}, format="json")
        self.assertEqual(resp.status_code, 200)
        self.item.refresh_from_db()
        self.assertEqual(self.item.evidence_photo_url, "")


class PaymentCardTests(TestCase):
    """The payment card chat message: posted when ALL items are approved,
    carrying the helper's live upi_id + amount components (userflow-v2 §4)."""

    def setUp(self):
        from rest_framework.test import APIClient
        self.cust = User.objects.create_user("pc-c@sastra.ac.in", password="x",
                                             is_verified_student=True)
        self.helper = User.objects.create_user("pc-h@sastra.ac.in", password="x",
                                               role="helper", is_verified_student=True,
                                               upi_id="helper@okhdfc")
        self.req = Request.objects.create(
            customer=self.cust, helper=self.helper, status=OrderStatus.ACCEPTED,
            needed_by=timezone.now(), pickup_point="Gate", expected_total=100)
        self.i1 = RequestItem.objects.create(request=self.req, name="Bread",
                                             expected_price=40, actual_price=40)
        self.i2 = RequestItem.objects.create(request=self.req, name="Milk",
                                             expected_price=60, actual_price=55)
        self.client = APIClient()
        self.client.force_authenticate(self.cust)

    def _cards(self):
        return [m for m in self.req.messages.filter(is_system_notice=True)
                if m.card]

    def _approve(self, **body):
        return self.client.post(f"/api/requests/{self.req.id}/approve-price/",
                                body, format="json")

    def test_full_approval_posts_payment_card(self):
        self.assertEqual(self._approve().status_code, 200)
        cards = self._cards()
        self.assertEqual(len(cards), 1)
        card = cards[0].card
        self.assertEqual(card["type"], "payment_card")
        self.assertEqual(card["upiId"], "helper@okhdfc")
        self.assertEqual(card["itemCost"], 95)  # 40 + 55, unavailable excluded
        self.assertEqual(card["currency"], "INR")
        self.assertIn("feeMin", card)  # client composes the upi:// link

    def test_subset_approval_posts_no_card(self):
        resp = self._approve(itemIds=[self.i1.id])
        self.assertEqual(resp.status_code, 200)
        self.assertEqual(self._cards(), [])

    def test_reapproval_without_change_posts_no_duplicate(self):
        self._approve()
        self._approve()
        self.assertEqual(len(self._cards()), 1)

    def test_repriced_reapproval_posts_fresh_card(self):
        self._approve()
        RequestItem.objects.filter(pk=self.i2.pk).update(actual_price=70,
                                                         price_approved=False)
        self._approve()
        cards = self._cards()
        self.assertEqual(len(cards), 2)
        self.assertEqual(cards[-1].card["itemCost"], 110)  # latest wins

    def test_helper_without_upi_gets_notice_not_card(self):
        User.objects.filter(pk=self.helper.pk).update(upi_id="")
        self._approve()
        msgs = list(self.req.messages.filter(is_system_notice=True))
        self.assertEqual(len(msgs), 1)
        self.assertIsNone(msgs[0].card)
        self.assertIn("UPI ID", msgs[0].text)

    def test_card_serialized_in_messages(self):
        from rest_framework.test import APIClient
        self._approve()
        data = self.client.get(f"/api/orders/{self.req.id}/messages/").json()
        cards = [m for m in data if m.get("card")]
        self.assertEqual(len(cards), 1)
        self.assertEqual(cards[0]["card"]["upiId"], "helper@okhdfc")


@override_settings(PAYMENT_PROVIDER="razorpay_base")
class PaymentCardGatewayModeTests(TestCase):
    """Merchant-of-record mode (D9): the card points at the gateway pay
    flow, NOT the helper's UPI — the customer pays the platform's payment
    link; the helper's own UPI ID is irrelevant to the customer."""

    def setUp(self):
        from rest_framework.test import APIClient
        self.cust = User.objects.create_user("gc-c@sastra.ac.in", password="x",
                                             is_verified_student=True)
        self.helper = User.objects.create_user("gc-h@sastra.ac.in", password="x",
                                               role="helper", is_verified_student=True,
                                               upi_id="helper@okhdfc")
        self.req = Request.objects.create(
            customer=self.cust, helper=self.helper, status=OrderStatus.ACCEPTED,
            needed_by=timezone.now(), pickup_point="Gate", expected_total=100)
        self.i1 = RequestItem.objects.create(request=self.req, name="Bread",
                                             expected_price=40, actual_price=40)
        self.i2 = RequestItem.objects.create(request=self.req, name="Milk",
                                             expected_price=60, actual_price=55)
        self.client = APIClient()
        self.client.force_authenticate(self.cust)

    def _cards(self):
        return [m for m in self.req.messages.filter(is_system_notice=True)
                if m.card]

    def test_gateway_card_has_no_upi_id(self):
        resp = self.client.post(f"/api/requests/{self.req.id}/approve-price/",
                                {}, format="json")
        self.assertEqual(resp.status_code, 200)
        cards = self._cards()
        self.assertEqual(len(cards), 1)
        card = cards[0].card
        self.assertEqual(card["payMode"], "gateway")
        self.assertNotIn("upiId", card)
        self.assertEqual(card["itemCost"], 95)
        self.assertIn("feeMin", card)

    def test_gateway_card_posted_even_without_helper_upi(self):
        # The customer never sees the helper's UPI in gateway mode, so a
        # missing helper upi_id must not block the card (it matters later,
        # at payout time — the payout console validates then).
        User.objects.filter(pk=self.helper.pk).update(upi_id="")
        self.client.post(f"/api/requests/{self.req.id}/approve-price/",
                         {}, format="json")
        cards = self._cards()
        self.assertEqual(len(cards), 1)
        self.assertEqual(cards[0].card["payMode"], "gateway")

    def test_gateway_reapproval_dedupes(self):
        self.client.post(f"/api/requests/{self.req.id}/approve-price/",
                         {}, format="json")
        self.client.post(f"/api/requests/{self.req.id}/approve-price/",
                         {}, format="json")
        self.assertEqual(len(self._cards()), 1)

    def test_payment_status_reports_active_provider(self):
        data = self.client.get(f"/api/orders/{self.req.id}/payment-status/").json()
        self.assertEqual(data["status"], "none")
        self.assertEqual(data["provider"], "razorpay_base")

    def test_pay_returns_503_when_gateway_keys_missing(self):
        # Approve prices first (the pay gate), then attempt the charge with
        # no RAZORPAY_KEY_ID/SECRET configured — clean 503, never a bare 500.
        self.client.post(f"/api/requests/{self.req.id}/approve-price/",
                         {}, format="json")
        resp = self.client.post(f"/api/orders/{self.req.id}/pay/",
                                {"helperFee": 30}, format="json")
        self.assertEqual(resp.status_code, 503)


class HelperCollateralTests(TestCase):
    def setUp(self):
        self.cust = User.objects.create_user("c@sastra.ac.in", password="x")
        self.helper = User.objects.create_user("h@sastra.ac.in", password="x",
                                               role="helper", is_verified_student=True,
                                               collateral_balance=200, upi_id="h@upi")
        self.req = make_req(self.cust)  # expected_total = 100

    def test_helper_sufficient_collateral_can_accept(self):
        obj = services.accept(self.req.id, self.helper)
        self.assertEqual(obj.status, OrderStatus.ACCEPTED)

    def test_helper_insufficient_collateral_cannot_accept(self):
        self.helper.collateral_balance = 50
        self.helper.save(update_fields=["collateral_balance"])
        with self.assertRaises(services.IllegalTransition):
            services.accept(self.req.id, self.helper)

    def test_collateral_commits_across_active_orders(self):
        # D12: the deposit is consumed by active orders — ₹200 collateral,
        # first ₹150 order accepted leaves ₹50 available.
        self.req.expected_total = 150
        self.req.save(update_fields=["expected_total"])
        services.accept(self.req.id, self.helper)
        second = make_req(self.cust)  # expected_total = 100
        with self.assertRaises(services.IllegalTransition):
            services.accept(second.id, self.helper)
        # A ₹50 order still fits in the remaining ₹50.
        second.expected_total = 50
        second.save(update_fields=["expected_total"])
        obj = services.accept(second.id, self.helper)
        self.assertEqual(obj.status, OrderStatus.ACCEPTED)

    def test_manual_mode_card_has_upi_deep_link(self):
        from rest_framework.test import APIClient
        services.accept(self.req.id, self.helper)
        RequestItem.objects.create(request=self.req, name="Item 1", expected_price=50, actual_price=50)
        client = APIClient()
        client.force_authenticate(self.cust)
        client.post(f"/api/requests/{self.req.id}/approve-price/", {}, format="json")
        cards = [m.card for m in self.req.messages.filter(is_system_notice=True) if m.card]
        self.assertEqual(len(cards), 1)
        self.assertIn("upiDeepLink", cards[0])
        self.assertTrue(cards[0]["upiDeepLink"].startswith("upi://pay?"))
        self.assertIn("pa=h%40upi", cards[0]["upiDeepLink"])


