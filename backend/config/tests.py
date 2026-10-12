from unittest.mock import patch
import json

from django.http import HttpResponse
from django.test import RequestFactory, SimpleTestCase, TestCase

from .middleware import RequestIdMiddleware


class RequestIdMiddlewareTests(SimpleTestCase):
    def test_generates_request_id_and_sets_response_header(self):
        request = RequestFactory().get("/api/health/")
        response = RequestIdMiddleware(
            lambda request: HttpResponse(status=200)
        )(request)
        self.assertTrue(response["X-Request-ID"])

    def test_honors_incoming_request_id(self):
        request = RequestFactory().get(
            "/api/health/", HTTP_X_REQUEST_ID="trace-123"
        )
        response = RequestIdMiddleware(
            lambda request: HttpResponse(status=200)
        )(request)
        self.assertEqual(response["X-Request-ID"], "trace-123")

    def test_api_500_contains_request_id_without_traceback(self):
        request = RequestFactory().get(
            "/api/failing/", HTTP_X_REQUEST_ID="trace-500"
        )

        def fail(request):
            raise RuntimeError("secret implementation detail")

        response = RequestIdMiddleware(fail)(request)
        self.assertEqual(response.status_code, 500)
        self.assertEqual(response["X-Request-ID"], "trace-500")
        self.assertEqual(json.loads(response.content), {
            "detail": "Internal server error.",
            "request_id": "trace-500",
        })
        self.assertNotIn(b"traceback", response.content.lower())
        self.assertNotIn(b"secret implementation detail", response.content)


class HealthEndpointTests(TestCase):
    def test_health_reports_database_ok(self):
        response = self.client.get("/api/health/")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["status"], "ok")
        self.assertEqual(response.json()["db"], "ok")
        self.assertIn("version", response.json())
        self.assertIn("time", response.json())
        self.assertTrue(response["X-Request-ID"])

    @patch("config.urls.connection.cursor")
    def test_health_reports_database_failure(self, cursor):
        cursor.side_effect = RuntimeError("database unavailable")
        response = self.client.get("/api/health/")
        self.assertEqual(response.status_code, 503)
        self.assertEqual(response.json()["db"], "error")
