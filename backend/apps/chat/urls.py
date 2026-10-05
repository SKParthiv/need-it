from django.urls import path
from . import views
urlpatterns = [path("orders/<int:order_id>/messages/", views.messages)]
