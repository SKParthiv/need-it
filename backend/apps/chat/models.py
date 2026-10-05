from django.conf import settings
from django.db import models


class ChatMessage(models.Model):
    request = models.ForeignKey("orders.Request", on_delete=models.CASCADE, related_name="messages")
    sender = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    text = models.TextField(blank=True)
    photo = models.ImageField(upload_to="chat/", null=True, blank=True)  # -> S3 in prod
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["created_at"]

    # Becomes read-only when the request completes — enforced in the view (PRD §9).
    # Phone numbers are NEVER exposed through chat.
