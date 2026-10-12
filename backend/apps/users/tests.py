from django.urls import reverse
from django.test import override_settings
from rest_framework.test import APITestCase
from .models import User


@override_settings(COLLEGE_EMAIL_DOMAINS=[])  # don't inherit the local .env allowlist
class AuthFlowTests(APITestCase):
    def test_register_verify_login(self):
        response = self.client.post("/api/auth/register/", {
            "email": "student@campus.edu",
            "password": "safe-password",
            "role": "customer",
            "policy_accept": True,
        }, format="json")
        self.assertEqual(response.status_code, 201)
        verification_token = response.data["verification_token"]
        user = User.objects.get(email="student@campus.edu")
        self.assertFalse(user.is_verified_student)

        response = self.client.post("/api/auth/verify-email/",
                                    {"token": verification_token}, format="json")
        self.assertEqual(response.status_code, 200)
        user.refresh_from_db()
        self.assertTrue(user.is_verified_student)

        response = self.client.post("/api/auth/login/", {
            "email": "student@campus.edu",
            "password": "safe-password",
        }, format="json")
        self.assertEqual(response.status_code, 200)
        self.assertTrue(response.data["token"])

    def test_unverified_user_cannot_write(self):
        response = self.client.post("/api/auth/register/", {
            "email": "student@campus.edu",
            "password": "safe-password",
            "role": "customer",
            "policy_accept": True,
        }, format="json")
        user = User.objects.get(email="student@campus.edu")
        self.client.force_authenticate(user=user)
        response = self.client.post("/api/requests/create/", {}, format="json")
        self.assertEqual(response.status_code, 403)

    @override_settings(COLLEGE_EMAIL_DOMAINS=["sastra.ac.in"])
    def test_domain_allowlist_enforced_when_configured(self):
        response = self.client.post("/api/auth/register/", {
            "email": "student@campus.edu",
            "password": "safe-password",
            "role": "customer",
            "policy_accept": True,
        }, format="json")
        self.assertEqual(response.status_code, 400)
        response = self.client.post("/api/auth/register/", {
            "email": "student@sastra.ac.in",
            "password": "safe-password",
            "role": "customer",
            "policy_accept": True,
        }, format="json")
        self.assertEqual(response.status_code, 201)


class ProductionFlowTests(APITestCase):
    def test_verify_email_link_get(self):
        from django.core import signing
        from apps.users.views import TOKEN_SALT
        user = User.objects.create_user(
            username="link@sastra.ac.in", email="link@sastra.ac.in", password="pw")
        token = signing.dumps({"user_id": user.pk, "email": user.email}, salt=TOKEN_SALT)
        resp = self.client.get(f"/api/auth/verify/?token={token}")
        self.assertEqual(resp.status_code, 200)
        user.refresh_from_db()
        self.assertTrue(user.is_verified_student)

    def test_verify_email_link_rejects_bad_token(self):
        resp = self.client.get("/api/auth/verify/?token=garbage")
        self.assertEqual(resp.status_code, 400)

    def test_register_sends_email_when_configured(self):
        from django.core import mail
        with self.settings(EMAIL_CONFIGURED=True,
                           PUBLIC_API_BASE_URL="https://api.example.com",
                           EMAIL_BACKEND="django.core.mail.backends.locmem.EmailBackend"):
            resp = self.client.post("/api/auth/register/", {
                "email": "newuser@sastra.ac.in", "password": "Passw0rd!x",
                "role": "customer", "policy_accept": True,
            }, format="json")
        self.assertEqual(resp.status_code, 201)
        self.assertNotIn("verification_token", resp.json())
        self.assertEqual(len(mail.outbox), 1)
        self.assertIn("https://api.example.com/api/auth/verify/?token=", mail.outbox[0].body)


class EnsureAdminCommandTests(APITestCase):
    def test_creates_superuser_from_env(self):
        from django.core.management import call_command
        env = {"ADMIN_EMAIL": "boss@sastra.ac.in", "ADMIN_PASSWORD": "Sup3rSecret!"}
        with self.settings(), __import__("unittest").mock.patch.dict("os.environ", env):
            call_command("ensure_admin")
        admin = User.objects.get(email="boss@sastra.ac.in")
        self.assertTrue(admin.is_superuser and admin.is_staff and admin.is_verified_student)
        self.assertTrue(admin.check_password("Sup3rSecret!"))

    def test_noop_without_env(self):
        from django.core.management import call_command
        with __import__("unittest").mock.patch.dict("os.environ", {}, clear=False):
            import os
            os.environ.pop("ADMIN_EMAIL", None)
            os.environ.pop("ADMIN_PASSWORD", None)
            call_command("ensure_admin")
        self.assertEqual(User.objects.filter(is_superuser=True).count(), 0)

    def test_existing_user_not_clobbered(self):
        from django.core.management import call_command
        user = User.objects.create_user(
            username="boss@sastra.ac.in", email="boss@sastra.ac.in", password="original")
        with __import__("unittest").mock.patch.dict(
                "os.environ", {"ADMIN_EMAIL": "boss@sastra.ac.in", "ADMIN_PASSWORD": "new"}):
            call_command("ensure_admin")
        user.refresh_from_db()
        self.assertTrue(user.is_superuser)
        self.assertTrue(user.check_password("original"))  # password untouched


class ProfilePatchTests(APITestCase):
    def test_me_patch_sets_upi_id(self):
        user = User.objects.create_user("p1", password="x")
        self.client.force_authenticate(user=user)
        resp = self.client.patch("/api/me/", {"upi_id": "student@okhdfc"}, format="json")
        self.assertEqual(resp.status_code, 200)
        user.refresh_from_db()
        self.assertEqual(user.upi_id, "student@okhdfc")

    def test_me_patch_rejects_bad_upi_id(self):
        user = User.objects.create_user("p2", password="x")
        self.client.force_authenticate(user=user)
        resp = self.client.patch("/api/me/", {"upi_id": "not-a-upi-id"}, format="json")
        self.assertEqual(resp.status_code, 400)
        user.refresh_from_db()
        self.assertEqual(user.upi_id, "")

    def test_me_patch_cannot_escalate(self):
        user = User.objects.create_user("p3", password="x", role="customer")
        self.client.force_authenticate(user=user)
        resp = self.client.patch("/api/me/", {"role": "helper", "is_staff": True}, format="json")
        user.refresh_from_db()
        self.assertEqual(user.role, "customer")  # whitelist silently drops the rest
        self.assertFalse(user.is_staff)
