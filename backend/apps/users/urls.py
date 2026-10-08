from django.urls import path
from . import views

urlpatterns = [
    path("auth/register/", views.register),
    path("auth/verify-email/", views.verify_email),
    path("auth/login/", views.login),
    path("auth/logout/", views.logout),
    path("me/", views.me),
]
