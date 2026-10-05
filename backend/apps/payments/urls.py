from django.urls import path
from . import views
from .webhooks import razorpay_webhook
urlpatterns = [
    path("orders/<int:order_id>/payment-status/", views.payment_status),
    path("webhooks/payment/", razorpay_webhook),
]
