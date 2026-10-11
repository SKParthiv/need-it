from django.conf import settings
from django.db import models


class Notification(models.Model):
    """In-app notification. Light on purpose: pruned after 30 days (free-tier DB)."""

    class Type(models.TextChoices):
        ACCEPTED = "accepted", "Accepted"
        ITEM_UNAVAILABLE = "item_unavailable", "Item Unavailable"
        PRICE_CHANGE = "price_change", "Price Change"
        READY_FOR_PICKUP = "ready_for_pickup", "Ready for Pickup"
        COMPLETED = "completed", "Completed"
        BROADCAST = "broadcast", "Broadcast"

    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE,
                             related_name="notifications")
    type = models.CharField(max_length=30, choices=Type.choices, db_index=True)
    title = models.CharField(max_length=120)
    message = models.CharField(max_length=300)
    order = models.ForeignKey("orders.Request", on_delete=models.CASCADE,
                              null=True, blank=True, related_name="notifications")
    read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ("-created_at",)

    def __str__(self):
        return f"[{self.type}] -> {self.user_id}: {self.title}"
