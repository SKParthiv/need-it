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
