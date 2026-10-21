from django.urls import path
from . import views

urlpatterns = [
    path("auth/register/", views.register),
    path("auth/google/", views.google_auth),
    path("auth/resend-verification/", views.resend_verification),
    path("auth/verify-email/", views.verify_email),
    path("auth/verify/", views.verify_email_link),
    path("auth/login/", views.login),
    path("auth/logout/", views.logout),
    path("me/", views.me),
    path("collateral/", views.collateral_status),
    path("admin/overview/", views.admin_overview),
    path("admin/collateral/<int:user_id>/", views.admin_set_collateral),
    path("admin/reports/", views.admin_reports_list),
    path("admin/reports/<int:report_id>/resolve/", views.admin_resolve_report),
]
