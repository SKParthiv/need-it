from rest_framework.decorators import api_view
from rest_framework.response import Response

from apps.orders.models import OrderStatus, Request

from .models import Rating


@api_view(["POST"])
def rate(request, order_id):
    """Both participants rate each other 1-5 after completion. One rating per
    side per order; v1 stores data only."""
    order = Request.objects.filter(pk=order_id).first()
    if not order:
        return Response({"detail": "Order not found."}, status=404)
    if request.user.id not in (order.customer_id, order.helper_id):
        return Response({"detail": "Only the order's participants can rate."}, status=403)
    if order.status != OrderStatus.COMPLETED:
        return Response({"detail": "You can rate once the order is completed."}, status=400)
    try:
        stars = int(request.data.get("stars"))
    except (TypeError, ValueError):
        return Response({"detail": "stars must be an integer from 1 to 5."}, status=400)
    if not 1 <= stars <= 5:
        return Response({"detail": "stars must be an integer from 1 to 5."}, status=400)
    ratee_id = order.helper_id if request.user.id == order.customer_id else order.customer_id
    note = (request.data.get("note") or "")[:280].strip()
    rating, created = Rating.objects.get_or_create(
        order=order, rater=request.user,
        defaults={"ratee_id": ratee_id, "stars": stars, "note": note})
    if not created:
        return Response({"detail": "You already rated this order."}, status=409)
    return Response({"id": rating.id, "stars": rating.stars}, status=201)
