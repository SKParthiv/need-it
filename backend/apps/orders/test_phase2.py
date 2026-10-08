from datetime import timedelta
from django.conf import settings
from django.utils import timezone
from rest_framework.test import APITestCase
from .models import Request, RequestItem
from apps.users.models import User


class RequestApiTests(APITestCase):
    def setUp(self):
        self.customer = User.objects.create_user(
            username="customer", email="customer@campus.edu",
            password="safe-password", is_verified_student=True,
        )
        self.helper = User.objects.create_user(
            username="helper", email="helper@campus.edu",
            password="safe-password", is_verified_student=True,
        )

    def payload(self, name="Notebook", needed_by=None):
        return {
            "neededBy": needed_by or (timezone.now() + timedelta(days=1)).isoformat(),
            "isUrgent": False,
            "pickupPoint": "Main Gate",
            "expectedTotal": 100,
            "items": [{"name": name, "quantity": 1, "expectedPrice": 100}],
        }

    def test_create_and_read_request_with_nested_items(self):
        self.client.force_authenticate(self.customer)
        response = self.client.post("/api/requests/create/", self.payload(), format="json")
        self.assertEqual(response.status_code, 201)
        self.assertEqual(Request.objects.count(), 1)
        self.assertEqual(RequestItem.objects.count(), 1)
        self.assertEqual(response.data["items"][0]["expectedPrice"], 100)
        self.assertEqual(response.data["status"], "open")
        self.assertIn("createdAt", response.data)

    def test_prohibited_item_is_rejected_atomically(self):
        self.client.force_authenticate(self.customer)
        previous = list(getattr(settings, "PROHIBITED_ITEMS", []))
        settings.PROHIBITED_ITEMS = ["weapon"]
        try:
            response = self.client.post(
                "/api/requests/create/", self.payload("Weapon"), format="json"
            )
        finally:
            settings.PROHIBITED_ITEMS = previous
        self.assertEqual(response.status_code, 400)
        self.assertEqual(Request.objects.count(), 0)
        self.assertEqual(RequestItem.objects.count(), 0)

    def test_feed_hides_non_open_and_orders_by_needed_by(self):
        first = Request.objects.create(
            customer=self.customer, needed_by=timezone.now() + timedelta(hours=1),
            pickup_point="Gate", expected_total=20,
        )
        Request.objects.create(
            customer=self.customer, needed_by=timezone.now() + timedelta(hours=2),
            pickup_point="Gate", expected_total=20, status="accepted",
        )
        self.client.force_authenticate(self.helper)
        response = self.client.get("/api/feed/")
        self.assertEqual(response.status_code, 200)
        self.assertEqual([item["id"] for item in response.data], [first.id])

    def test_unverified_user_cannot_create_request(self):
        self.customer.is_verified_student = False
        self.customer.save(update_fields=("is_verified_student",))
        self.client.force_authenticate(self.customer)
        response = self.client.post("/api/requests/create/", self.payload(), format="json")
        self.assertEqual(response.status_code, 403)
