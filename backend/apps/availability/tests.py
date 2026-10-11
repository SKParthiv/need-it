from django.test import TestCase
from rest_framework.test import APIClient

from apps.users.models import User

from .models import AvailabilityWindow


def make_user(email, role):
    return User.objects.create_user(
        username=email, email=email, password="pw",
        role=role, is_verified_student=True,
    )


class AvailabilityTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.helper = make_user("h@sastra.ac.in", "helper")
        self.other = make_user("h2@sastra.ac.in", "helper")
        self.customer = make_user("c@sastra.ac.in", "customer")

    def test_helper_adds_lists_deletes_own_window(self):
        self.client.force_authenticate(self.helper)
        resp = self.client.post("/api/availability/add/",
                                {"date": "2026-10-12", "timeWindow": "5 PM - 8 PM"},
                                content_type="application/json")
        self.assertEqual(resp.status_code, 201)
        window_id = resp.json()["id"]

        resp = self.client.get("/api/availability/")
        self.assertEqual(len(resp.json()["windows"]), 1)

        resp = self.client.delete(f"/api/availability/{window_id}/")
        self.assertEqual(resp.status_code, 204)
        self.assertEqual(AvailabilityWindow.objects.count(), 0)

    def test_customer_cannot_add_window(self):
        self.client.force_authenticate(self.customer)
        resp = self.client.post("/api/availability/add/",
                                {"date": "2026-10-12", "timeWindow": "5 PM - 8 PM"},
                                content_type="application/json")
        self.assertEqual(resp.status_code, 403)

    def test_cannot_delete_another_helpers_window(self):
        window = AvailabilityWindow.objects.create(
            helper=self.helper, date="2026-10-12", time_window="5 PM - 8 PM")
        self.client.force_authenticate(self.other)
        resp = self.client.delete(f"/api/availability/{window.id}/")
        self.assertEqual(resp.status_code, 404)
        self.assertEqual(AvailabilityWindow.objects.count(), 1)
