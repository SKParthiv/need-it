from django.contrib import admin
from django.urls import include, path
from django.http import JsonResponse

def root_view(request):
    return JsonResponse({
        "status": "online",
        "service": "Need It Backend API",
        "message": "The web application frontend is running on port 3000.",
        "website_url": "http://localhost:3000",
        "network_url": "http://172.22.17.13:3000",
        "admin_url": "/admin/",
    })

urlpatterns = [
    path("", root_view),
    path("admin/", admin.site.urls),
    path("api/", include("apps.orders.urls")),
    path("api/", include("apps.payments.urls")),
    path("api/", include("apps.users.urls")),
    path("api/", include("apps.chat.urls")),
]
