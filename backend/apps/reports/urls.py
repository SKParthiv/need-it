from django.urls import path

from . import views

urlpatterns = [
    path("reports/", views.my_reports),
    path("reports/file/", views.file_report),
]
