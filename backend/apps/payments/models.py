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


class PayoutStatus(models.TextChoices):
    DUE = "due", "Due"
    PAID = "paid", "Paid"
    CANCELLED = "cancelled", "Cancelled"


class Payout(models.Model):
    """
    Merchant-of-record settlement. The platform collected the customer's money,
    so the platform owes the helper: item cost + helper fee - platform cut.
    Created exactly once per completed order (OneToOne is the idempotency
    guarantee). A founder settles it via UPI from the admin console, then marks
    it paid with the UTR. Component fields are snapshots — the record of what
    was owed and why, even if fees/settings change later.
    """
    request = models.OneToOneField("orders.Request", on_delete=models.CASCADE,
                                   related_name="payout")
    helper = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.PROTECT,
                               related_name="payouts")
    item_cost = models.PositiveIntegerField()
    helper_fee = models.PositiveIntegerField()
    platform_cut = models.PositiveIntegerField()
    amount = models.PositiveIntegerField()
    upi_id = models.CharField(max_length=80, blank=True)  # snapshot; live value on helper profile
    status = models.CharField(max_length=20, choices=PayoutStatus.choices,
                              default=PayoutStatus.DUE, db_index=True)
    utr = models.CharField(max_length=64, blank=True)  # UPI reference from the founder's bank app
    paid_by = models.ForeignKey(settings.AUTH_USER_MODEL, null=True, blank=True,
                                on_delete=models.SET_NULL, related_name="settled_payouts")
    created_at = models.DateTimeField(auto_now_add=True)
    paid_at = models.DateTimeField(null=True, blank=True)

    def __str__(self):
        return f"Payout #{self.pk} -> helper {self.helper_id} ({self.status}, ₹{self.amount})"
