from django.contrib.auth import get_user_model
from django.test import TestCase
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
        services.confirm_handover(self.req.id, self.cust)
        obj = services.confirm_handover(self.req.id, self.helper)
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
