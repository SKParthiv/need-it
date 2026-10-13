from django.conf import settings
from django.db import models
import secrets


class OrderStatus(models.TextChoices):
    # The fixed vocabulary. Matches docs/ and the mobile app exactly.
    OPEN = "open", "Open"
    ACCEPTED = "accepted", "Accepted"
    PURCHASED = "purchased", "Purchased"
    HANDED_OVER = "handed_over", "Handed Over"
    COMPLETED = "completed", "Completed"
    CANCELLED = "cancelled", "Cancelled"


# Allowed transitions: current -> set of legal next states.
# Anything not listed here is IMPOSSIBLE and rejected before the DB is touched.
ALLOWED_TRANSITIONS = {
    OrderStatus.OPEN: {OrderStatus.ACCEPTED, OrderStatus.CANCELLED},
    OrderStatus.ACCEPTED: {OrderStatus.PURCHASED, OrderStatus.OPEN, OrderStatus.CANCELLED},  # OPEN = release
    OrderStatus.PURCHASED: {OrderStatus.HANDED_OVER, OrderStatus.CANCELLED},
    OrderStatus.HANDED_OVER: {OrderStatus.COMPLETED},
    OrderStatus.COMPLETED: set(),
    OrderStatus.CANCELLED: set(),
}


class Request(models.Model):
    customer = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="requests")
    needed_by = models.DateTimeField()
    is_urgent = models.BooleanField(default=False)
    pickup_point = models.CharField(max_length=120)
    status = models.CharField(max_length=20, choices=OrderStatus.choices, default=OrderStatus.OPEN, db_index=True)
    helper = models.ForeignKey(settings.AUTH_USER_MODEL, null=True, blank=True,
                               on_delete=models.SET_NULL, related_name="accepted_requests")
    expected_total = models.PositiveIntegerField(help_text="Customer's guess. NEVER charged.")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    handover_code = models.CharField(max_length=12, blank=True)
    handover_attempts = models.PositiveSmallIntegerField(default=0)

    def __str__(self):
        return f"Request #{self.pk} ({self.status})"

    def ensure_handover_code(self):
        if not self.handover_code:
            # 4-digit OTP, Rapido-style: the customer SHOWS it, the helper
            # ENTERS it. Money moves on this code, so it only ever renders
            # for the customer (see RequestSerializer.handoverCode).
            self.handover_code = f"{secrets.randbelow(10000):04d}"
            self.save(update_fields=("handover_code",))
        return self.handover_code


class RequestItem(models.Model):
    class ItemStatus(models.TextChoices):
        PENDING = "pending", "Pending"
        FOUND = "found", "Found"
        UNAVAILABLE = "unavailable", "Unavailable"
        REPLACED = "replaced", "Replaced"

    request = models.ForeignKey(Request, on_delete=models.CASCADE, related_name="items")
    name = models.CharField(max_length=160)
    quantity = models.PositiveIntegerField(default=1)
    expected_price = models.PositiveIntegerField()
    actual_price = models.PositiveIntegerField(null=True, blank=True)
    price_approved = models.BooleanField(default=False)
    notes = models.CharField(max_length=300, blank=True)
    alternatives_allowed = models.BooleanField(default=False)
    status = models.CharField(max_length=20, choices=ItemStatus.choices, default=ItemStatus.PENDING)
    replacement_proposal = models.JSONField(null=True, blank=True)
    # Photo the helper took at the shelf/receipt — the customer's price evidence.
    evidence_photo_url = models.URLField(max_length=500, blank=True)


class StatusChange(models.Model):
    """Audit log: every transition, who did it, when. Append-only."""
    request = models.ForeignKey(Request, on_delete=models.CASCADE, related_name="history")
    from_status = models.CharField(max_length=20, choices=OrderStatus.choices)
    to_status = models.CharField(max_length=20, choices=OrderStatus.choices)
    actor = models.ForeignKey(settings.AUTH_USER_MODEL, null=True, on_delete=models.SET_NULL)
    note = models.CharField(max_length=200, blank=True)
    at = models.DateTimeField(auto_now_add=True)
