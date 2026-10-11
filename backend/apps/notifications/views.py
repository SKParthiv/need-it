from rest_framework.decorators import api_view
from rest_framework.response import Response

from .models import Notification


def _serialize(n):
    return {
        "id": n.id,
        "type": n.type,
        "title": n.title,
        "message": n.message,
        "orderId": n.order_id,
        "read": n.read,
        "timestamp": n.created_at.isoformat(),
    }


@api_view(["GET"])
def list_notifications(request):
    qs = Notification.objects.filter(user=request.user)
    unread = qs.filter(read=False).count()
    return Response({
        "unreadCount": unread,
        "notifications": [_serialize(n) for n in qs[:50]],
    })


@api_view(["POST"])
def mark_read(request, pk):
    updated = Notification.objects.filter(pk=pk, user=request.user).update(read=True)
    if not updated:
        return Response({"detail": "Notification not found."}, status=404)
    return Response({"id": pk, "read": True})


@api_view(["POST"])
def mark_all_read(request):
    count = Notification.objects.filter(user=request.user, read=False).update(read=True)
    return Response({"markedRead": count})
