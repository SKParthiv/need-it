from rest_framework import serializers
from .models import ChatMessage


class ChatMessageSerializer(serializers.ModelSerializer):
    senderRole = serializers.CharField(source="sender.role", read_only=True)
    senderName = serializers.SerializerMethodField()
    photoUrl = serializers.URLField(source="photo_url", required=False, allow_blank=True)
    timestamp = serializers.DateTimeField(source="created_at", read_only=True)
    isSystemNotice = serializers.BooleanField(source="is_system_notice", read_only=True, default=False)

    class Meta:
        model = ChatMessage
        fields = ("id", "senderRole", "senderName", "text", "photoUrl",
                  "timestamp", "isSystemNotice")
        read_only_fields = ("id", "senderRole", "senderName", "timestamp", "isSystemNotice")

    def get_senderName(self, obj):
        return obj.sender.get_full_name() or obj.sender.email
