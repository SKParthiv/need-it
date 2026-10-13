from datetime import timedelta

from django.test import TestCase
from django.utils import timezone
from rest_framework.test import APIClient

from apps.orders import services
from apps.orders.models import OrderStatus, Request, RequestItem
from apps.reports.models import Report
from apps.users.models import User

from .models import ProblemEvent, Rating, TrustPolicy
from .services import block_reason, problem_count, record_problem


def _user(name, role="customer"):
    return User.objects.create_user(f"{name}@sastra.ac.in", password="x",
                                    role=role, is_verified_student=True)


def _order(customer, helper=None, status=OrderStatus.ACCEPTED):
    req = Request.objects.create(
        customer=customer, helper=helper, status=status,
        needed_by=timezone.now(), pickup_point="Gate", expected_total=100)
    RequestItem.objects.create(request=req, name="Bread", expected_price=50,
                               actual_price=50, price_approved=True)
    return req


class RatingTests(TestCase):
    def setUp(self):
        self.cust, self.helper = _user("rc"), _user("rh", "helper")
        self.order = _order(self.cust, self.helper, OrderStatus.COMPLETED)
        self.client = APIClient()

    def test_both_participants_rate(self):
        self.client.force_authenticate(self.cust)
        resp = self.client.post(f"/api/orders/{self.order.id}/rate/", {"stars": 5}, format="json")
        self.assertEqual(resp.status_code, 201)
        self.client.force_authenticate(self.helper)
        resp = self.client.post(f"/api/orders/{self.order.id}/rate/", {"stars": 4}, format="json")
        self.assertEqual(resp.status_code, 201)
        self.assertEqual(Rating.objects.filter(order=self.order).count(), 2)

    def test_duplicate_rating_409(self):
        self.client.force_authenticate(self.cust)
        self.client.post(f"/api/orders/{self.order.id}/rate/", {"stars": 5}, format="json")
        resp = self.client.post(f"/api/orders/{self.order.id}/rate/", {"stars": 1}, format="json")
        self.assertEqual(resp.status_code, 409)

    def test_outsider_cannot_rate(self):
        self.client.force_authenticate(_user("outsider"))
        resp = self.client.post(f"/api/orders/{self.order.id}/rate/", {"stars": 5}, format="json")
        self.assertEqual(resp.status_code, 403)

    def test_cannot_rate_unfinished_order(self):
        self.order.status = OrderStatus.ACCEPTED
        self.order.save(update_fields=("status",))
        self.client.force_authenticate(self.cust)
        resp = self.client.post(f"/api/orders/{self.order.id}/rate/", {"stars": 5}, format="json")
        self.assertEqual(resp.status_code, 400)

    def test_stars_must_be_1_to_5(self):
        self.client.force_authenticate(self.cust)
        resp = self.client.post(f"/api/orders/{self.order.id}/rate/", {"stars": 9}, format="json")
        self.assertEqual(resp.status_code, 400)


class BlockTests(TestCase):
    def setUp(self):
        policy = TrustPolicy.get()  # create the singleton, THEN tune it
        policy.helper_max_problems = 2
        policy.customer_max_problems = 2
        policy.save()
        self.client = APIClient()

    def _payload(self):
        return {"neededBy": timezone.now().isoformat(), "pickupPoint": "Gate",
                "expectedTotal": 100,
                "items": [{"name": "Bread", "quantity": 1, "expectedPrice": 50}]}

    def test_customer_at_threshold_cannot_post(self):
        cust = _user("bc")
        order = _order(cust)
        record_problem(cust, ProblemEvent.Kind.FLAKE, order=order)
        record_problem(cust, ProblemEvent.Kind.FLAKE)  # order-less problems count too
        self.client.force_authenticate(cust)
        resp = self.client.post("/api/requests/create/", self._payload(), format="json")
        self.assertEqual(resp.status_code, 403)
        self.assertIn("blocked", resp.json()["detail"])

    def test_customer_under_threshold_can_post(self):
        cust = _user("uc")
        record_problem(cust, ProblemEvent.Kind.FLAKE)
        self.client.force_authenticate(cust)
        resp = self.client.post("/api/requests/create/", self._payload(), format="json")
        self.assertEqual(resp.status_code, 201)

    def test_helper_at_threshold_cannot_accept(self):
        helper = _user("bh", "helper")
        # Two DISTINCT problems (same order+kind dedupes by design).
        record_problem(helper, ProblemEvent.Kind.FLAKE)
        record_problem(helper, ProblemEvent.Kind.FLAKE, order=_order(_user("bh-c")))
        order = _order(_user("bc2"), status=OrderStatus.OPEN)
        self.client.force_authenticate(helper)
        resp = self.client.post(f"/api/requests/{order.id}/accept/")
        self.assertEqual(resp.status_code, 403)
        self.assertIn("blocked", resp.json()["detail"])

    def test_threshold_tuning_takes_effect_immediately(self):
        helper = _user("th", "helper")
        record_problem(helper, ProblemEvent.Kind.FLAKE)
        record_problem(helper, ProblemEvent.Kind.FLAKE, order=_order(_user("th-c")))
        self.assertIsNotNone(block_reason(helper, "helper"))
        policy = TrustPolicy.get()
        policy.helper_max_problems = 5
        policy.save()
        self.assertIsNone(block_reason(helper, "helper"))  # admin found the sweet spot

    def test_me_exposes_trust_summary(self):
        cust = _user("mc")
        record_problem(cust, ProblemEvent.Kind.FLAKE)
        self.client.force_authenticate(cust)
        data = self.client.get("/api/me/").json()
        self.assertEqual(data["problems"], 1)
        self.assertEqual(data["blocked"], False)


class FlakeTests(TestCase):
    def test_helper_cancel_after_accept_counts_one_flake(self):
        cust, helper = _user("fc"), _user("fh", "helper")
        order = _order(cust, helper, OrderStatus.ACCEPTED)
        services.cancel(order.id, helper)
        self.assertEqual(problem_count(helper), 1)
        # The same flake can't double-count even if re-recorded.
        record_problem(helper, ProblemEvent.Kind.FLAKE, order=order)
        self.assertEqual(problem_count(helper), 1)

    def test_customer_cancel_counts_nothing(self):
        cust, helper = _user("fc2"), _user("fh2", "helper")
        order = _order(cust, helper, OrderStatus.ACCEPTED)
        services.cancel(order.id, cust)
        self.assertEqual(problem_count(helper), 0)
        self.assertEqual(problem_count(cust), 0)

    def test_stale_accept_sweep_counts_a_flake(self):
        cust, helper = _user("fc3"), _user("fh3", "helper")
        order = _order(cust, helper, OrderStatus.OPEN)
        services.accept(order.id, helper)
        Request.objects.filter(pk=order.id).update(
            updated_at=timezone.now() - timedelta(minutes=60))
        released = services.sweep_stale_accepted()
        self.assertEqual(released, 1)
        self.assertEqual(problem_count(helper), 1)


class ReportBlameTests(TestCase):
    def test_resolve_against_helper_counts_once(self):
        from django.contrib.admin.sites import AdminSite
        from apps.reports.admin import ReportAdmin
        cust, helper = _user("qc"), _user("qh", "helper")
        order = _order(cust, helper, OrderStatus.COMPLETED)
        report = Report.objects.create(
            order=order, reporter=cust, reporter_role="customer",
            issue_type=Report.IssueType.NO_SHOW, details="never showed")
        site_admin = ReportAdmin(Report, AdminSite())
        qs = Report.objects.filter(pk=report.pk)
        site_admin.resolve_against_helper(None, qs)
        report.refresh_from_db()
        self.assertEqual(report.status, Report.Status.RESOLVED)
        self.assertEqual(problem_count(helper), 1)
        site_admin.resolve_against_helper(None, qs)  # idempotent
        self.assertEqual(problem_count(helper), 1)

    def test_plain_resolve_counts_nothing(self):
        cust, helper = _user("nc"), _user("nh", "helper")
        order = _order(cust, helper, OrderStatus.COMPLETED)
        report = Report.objects.create(
            order=order, reporter=cust, reporter_role="customer",
            issue_type=Report.IssueType.OTHER, details="misunderstanding")
        report.status = Report.Status.RESOLVED  # admin resolves without blame
        report.save(update_fields=("status",))
        self.assertEqual(problem_count(helper), 0)
