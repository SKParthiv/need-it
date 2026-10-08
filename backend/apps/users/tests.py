from django.urls import reverse
from rest_framework.test import APITestCase
from .models import User


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
