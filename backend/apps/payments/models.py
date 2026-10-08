from django.conf import settings
from django.db import models


class PaymentStatus(models.TextChoices):
    NONE = "none", "None"
    PENDING = "pending", "Pending"
    HELD = "held", "Held"          # money captured, escrowed — unlocks 'purchased'
    RELEASED = "released", "Released"  # settled to helper after handover
    FAILED = "failed", "Failed"
    REFUNDED = "refunded", "Refunded"


class Payment(models.Model):
    request = models.OneToOneField("orders.Request", on_delete=models.CASCADE, related_name="payment")
    status = models.CharField(max_length=20, choices=PaymentStatus.choices,
                              default=PaymentStatus.NONE, db_index=True)
    item_cost = models.PositiveIntegerField(help_text="ACTUAL confirmed price — never the guess")
    helper_fee = models.PositiveIntegerField()
    currency = models.CharField(max_length=3, default="INR")
    provider = models.CharField(max_length=20, default="manual")
    provider_ref = models.CharField(max_length=120, blank=True)  # gateway order/payment id
    customer_confirmed = models.BooleanField(default=False)
    helper_confirmed = models.BooleanField(default=False)
    idempotency_key = models.CharField(max_length=64, unique=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    @property
    def total(self):
        return self.item_cost + self.helper_fee


class PaymentEvent(models.Model):
    """
    Gateway webhook events, stored for idempotency. The unique provider_event_id
    means a webhook retried 10 times is processed once — no double-release.
    """
    provider_event_id = models.CharField(max_length=120, unique=True)
    payment = models.ForeignKey(Payment, null=True, on_delete=models.SET_NULL, related_name="events")
    kind = models.CharField(max_length=60)
    payload = models.JSONField(default=dict)
    received_at = models.DateTimeField(auto_now_add=True)
