from django.contrib import admin
from django.urls import include, path
from django.http import JsonResponse
from django.db import connection
from django.utils import timezone
import os

def root_view(request):
    return JsonResponse({
        "status": "online",
        "service": "Need It Backend API",
        "api": "/api/",
        "admin_url": "/admin/",
        # Points at the web app once it has a public URL (Cloudflare Pages);
        # null until PUBLIC_WEB_URL is set — never a localhost lie in prod.
        "website_url": os.environ.get("PUBLIC_WEB_URL", "").strip() or None,
    })


def health_view(request):
    try:
        with connection.cursor() as cursor:
            cursor.execute("SELECT 1")
            cursor.fetchone()
    except Exception:
        return JsonResponse({
            "status": "error",
            "version": os.environ.get("RENDER_GIT_COMMIT", "unknown"),
            "db": "error",
            "time": timezone.now().isoformat(),
        }, status=503)
    return JsonResponse({
        "status": "ok",
        "version": os.environ.get("RENDER_GIT_COMMIT", "unknown"),
        "db": "ok",
        "time": timezone.now().isoformat(),
    })


urlpatterns = [
    path("", root_view),
    path("api/health/", health_view),
    path("admin/", admin.site.urls),
    path("api/", include("apps.orders.urls")),
    path("api/", include("apps.payments.urls")),
    path("api/", include("apps.users.urls")),
    path("api/", include("apps.chat.urls")),
    path("api/", include("apps.notifications.urls")),
    path("api/", include("apps.availability.urls")),
    path("api/", include("apps.reports.urls")),
    path("api/", include("apps.trust.urls")),
]
