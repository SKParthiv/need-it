from django.urls import path

from . import views

urlpatterns = [
    path("availability/", views.list_windows),
    path("availability/add/", views.add_window),
    path("availability/<int:pk>/", views.delete_window),
]
