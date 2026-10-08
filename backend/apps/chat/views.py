from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status
from .models import ChatMessage
from .serializers import ChatMessageSerializer
from apps.orders.models import Request, OrderStatus

# TODO: list messages (polling), post text+photo, read-only after completion.
@api_view(["GET", "POST"])
def messages(request, order_id):
    order = Request.objects.filter(pk=order_id).first()
    if not order or request.user.id not in (order.customer_id, order.helper_id):
        return Response({"detail": "Conversation not found."}, status=status.HTTP_404_NOT_FOUND)
    if request.method == "GET":
        queryset = ChatMessage.objects.filter(request_id=order_id).select_related("sender")
        return Response(ChatMessageSerializer(queryset, many=True).data)
    if order.status == OrderStatus.COMPLETED:
        return Response({"detail": "Completed conversations are read-only."},
                        status=status.HTTP_403_FORBIDDEN)
    if request.data.get("photo") and not request.data.get("photoUrl"):
        return Response({"detail": "Configure S3-compatible storage before uploading photos."},
                        status=status.HTTP_503_SERVICE_UNAVAILABLE)
    serializer = ChatMessageSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    serializer.save(request=order, sender=request.user)
    return Response(serializer.data, status=status.HTTP_201_CREATED)
