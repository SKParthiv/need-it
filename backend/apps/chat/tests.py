from django.test import TestCase
from django.utils import timezone
from rest_framework.test import APIClient
from apps.orders.models import OrderStatus, Request
from apps.users.models import User
from .models import ChatMessage


class ChatApiTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.customer = User.objects.create_user(
            username="customer", email="customer@campus.edu", password="password",
            is_verified_student=True,
        )
        self.helper = User.objects.create_user(
            username="helper", email="helper@campus.edu", password="password",
            role="helper", is_verified_student=True,
        )
        self.order = Request.objects.create(
            customer=self.customer, helper=self.helper, needed_by=timezone.now(),
            pickup_point="Gate", expected_total=10, status=OrderStatus.ACCEPTED,
        )

    def test_send_and_list_message(self):
        self.client.force_authenticate(self.customer)
        response = self.client.post(
            f"/api/orders/{self.order.id}/messages/",
            {"text": "On my way"}, format="json",
        )
        self.assertEqual(response.status_code, 201)
        response = self.client.get(f"/api/orders/{self.order.id}/messages/")
        self.assertEqual(response.data[0]["text"], "On my way")
        self.assertFalse(ChatMessage.objects.get().photo_url)

    def test_completed_chat_is_read_only(self):
        self.order.status = OrderStatus.COMPLETED
        self.order.save(update_fields=("status",))
        self.client.force_authenticate(self.customer)
        response = self.client.post(
            f"/api/orders/{self.order.id}/messages/", {"text": "Late"}, format="json"
        )
        self.assertEqual(response.status_code, 403)
