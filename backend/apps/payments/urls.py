from django.urls import path
from . import views
from .webhooks import razorpay_webhook
urlpatterns = [
    path("orders/<int:order_id>/payment-status/", views.payment_status),
    path("orders/<int:order_id>/pay/", views.pay),
    path("orders/<int:order_id>/confirm-payment/", views.confirm),
    path("webhooks/payment/", razorpay_webhook),
    path("admin/payouts/", views.admin_payouts),
    path("admin/payouts/<int:payout_id>/mark-paid/", views.admin_mark_payout_paid),
    path("earnings/", views.earnings),
]
