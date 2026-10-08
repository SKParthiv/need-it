from django.utils import timezone
from rest_framework.test import APITestCase
from .models import OrderStatus, Request
from . import services
from apps.users.models import User


class LockingApiTests(APITestCase):
    def setUp(self):
        self.customer = User.objects.create_user(
            username="customer", email="customer@campus.edu", password="safe-password",
            is_verified_student=True, role="customer",
        )
        self.helper = User.objects.create_user(
            username="helper", email="helper@campus.edu", password="safe-password",
            is_verified_student=True, role="helper",
        )
        self.other = User.objects.create_user(
            username="other", email="other@campus.edu", password="safe-password",
            is_verified_student=True, role="helper",
        )
        self.request = Request.objects.create(
            customer=self.customer, needed_by=timezone.now(), pickup_point="Gate",
            expected_total=10,
        )

    def test_only_verified_helper_can_accept_and_only_assignee_can_release(self):
        self.client.force_authenticate(self.customer)
        self.assertEqual(self.client.post(f"/api/requests/{self.request.id}/accept/").status_code, 403)
        self.client.force_authenticate(self.helper)
        response = self.client.post(f"/api/requests/{self.request.id}/accept/")
        self.assertEqual(response.status_code, 200)
        self.client.force_authenticate(self.other)
        self.assertEqual(self.client.post(f"/api/requests/{self.request.id}/release/").status_code, 400)

    def test_customer_post_purchase_cancel_requires_helper_agreement(self):
        self.request.status = OrderStatus.PURCHASED
        self.request.helper = self.helper
        self.request.save(update_fields=("status", "helper"))
        self.client.force_authenticate(self.customer)
        response = self.client.post(f"/api/requests/{self.request.id}/cancel/")
        self.assertEqual(response.status_code, 400)
        response = self.client.post(
            f"/api/requests/{self.request.id}/cancel/",
            {"helperAgree": True, "reason": "No longer needed"},
            format="json",
        )
        self.assertEqual(response.status_code, 200)
        self.request.refresh_from_db()
        self.assertEqual(self.request.status, OrderStatus.CANCELLED)
