from django.test import TestCase
from rest_framework.test import APIClient

from apps.orders import services
from apps.orders.models import Request, RequestItem
from apps.users.models import User

from .models import Report


def make_user(email, role):
    return User.objects.create_user(
        username=email, email=email, password="pw",
        role=role, is_verified_student=True,
    )


class ReportTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.customer = make_user("c@sastra.ac.in", "customer")
        self.helper = make_user("h@sastra.ac.in", "helper")
        self.outsider = make_user("x@sastra.ac.in", "customer")
        from django.utils import timezone
        self.req = Request.objects.create(
            customer=self.customer, needed_by=timezone.now(),
            pickup_point="Boys Hostel Area", expected_total=100,
        )
        RequestItem.objects.create(request=self.req, name="Maggi", quantity=2, expected_price=100)
        services.accept(self.req.id, self.helper)

    def file(self, user, **extra):
        self.client.force_authenticate(user)
        payload = {"orderId": self.req.id, "issueType": "No-show at handover",
                   "details": "Waited 20 minutes, nobody came."}
        payload.update(extra)
        return self.client.post("/api/reports/file/", payload,
                                content_type="application/json")

    def test_participant_can_report(self):
        resp = self.file(self.customer)
        self.assertEqual(resp.status_code, 201)
        report = Report.objects.get()
        self.assertEqual(report.reporter_role, "customer")
        self.assertEqual(report.status, "Open")
        self.assertEqual(report.priority, "Medium")

    def test_helper_can_report(self):
        resp = self.file(self.helper)
        self.assertEqual(resp.status_code, 201)
        self.assertEqual(Report.objects.get().reporter_role, "helper")

    def test_outsider_cannot_report(self):
        resp = self.file(self.outsider)
        self.assertEqual(resp.status_code, 403)
        self.assertEqual(Report.objects.count(), 0)

    def test_invalid_issue_type_rejected(self):
        resp = self.file(self.customer, issueType="Vibes were off")
        self.assertEqual(resp.status_code, 400)

    def test_my_reports_lists_own_only(self):
        self.file(self.customer)
        self.client.force_authenticate(self.helper)
        resp = self.client.get("/api/reports/")
        self.assertEqual(resp.json()["reports"], [])
