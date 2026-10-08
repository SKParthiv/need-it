from django.conf import settings
from django.db import models


class ChatMessage(models.Model):
    request = models.ForeignKey("orders.Request", on_delete=models.CASCADE, related_name="messages")
    sender = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    text = models.TextField(blank=True)
    photo_url = models.URLField(max_length=500, blank=True)
    is_system_notice = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["created_at"]

    # Becomes read-only when the request completes — enforced in the view (PRD §9).
    # Phone numbers are NEVER exposed through chat.
