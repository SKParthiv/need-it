from django.contrib.auth import get_user_model
from django.test import TestCase
from django.utils import timezone
from apps.orders.models import OrderStatus, Request
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
