from django.test import TestCase
from rest_framework.test import APIClient

from apps.orders import services
from apps.orders.models import OrderStatus, Request, RequestItem
from apps.users.models import User

from .models import Notification


def make_user(email, role, verified=True):
    return User.objects.create_user(
        username=email, email=email, password="pw",
        role=role, is_verified_student=verified,
    )


def make_request(customer):
    from django.utils import timezone
    req = Request.objects.create(
        customer=customer, needed_by=timezone.now(),
        pickup_point="Boys Hostel Area", expected_total=100,
    )
    RequestItem.objects.create(request=req, name="Maggi", quantity=2, expected_price=100)
    return req


class NotificationTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.customer = make_user("c@sastra.ac.in", "customer")
        self.helper = make_user("h@sastra.ac.in", "helper")
        self.req = make_request(self.customer)

    def test_accept_notifies_customer(self):
        services.accept(self.req.id, self.helper)
        n = Notification.objects.get(user=self.customer, type="accepted")
        self.assertEqual(n.order_id, self.req.id)
        self.assertFalse(n.read)

    def test_list_and_mark_read(self):
        services.accept(self.req.id, self.helper)
        self.client.force_authenticate(self.customer)
        resp = self.client.get("/api/notifications/")
        self.assertEqual(resp.status_code, 200)
        self.assertEqual(resp.json()["unreadCount"], 1)
        n_id = resp.json()["notifications"][0]["id"]
        resp = self.client.post(f"/api/notifications/{n_id}/read/")
        self.assertEqual(resp.status_code, 200)
        self.assertEqual(Notification.objects.get(pk=n_id).read, True)

    def test_cannot_read_another_users_notification(self):
        services.accept(self.req.id, self.helper)
        n = Notification.objects.get(user=self.customer)
        self.client.force_authenticate(self.helper)
        resp = self.client.post(f"/api/notifications/{n.id}/read/")
        self.assertEqual(resp.status_code, 404)
        self.assertFalse(Notification.objects.get(pk=n.id).read)

    def test_mark_unavailable_notifies_customer(self):
        services.accept(self.req.id, self.helper)
        self.req.refresh_from_db()
        item = self.req.items.first()
        self.client.force_authenticate(self.helper)
        resp = self.client.post(f"/api/requests/{self.req.id}/items/{item.id}/unavailable/")
        self.assertEqual(resp.status_code, 200)
        self.assertTrue(Notification.objects.filter(
            user=self.customer, type="item_unavailable").exists())
