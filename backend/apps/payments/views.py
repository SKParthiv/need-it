from rest_framework.decorators import api_view
from rest_framework.response import Response
from .models import Payment
from .services import confirm_payment, create_payment
from apps.orders.models import Request, RequestItem
from django.conf import settings


@api_view(["GET"])
def payment_status(request, order_id):
    order = Request.objects.filter(pk=order_id).filter(
        customer=request.user
    ).first()
    if not order:
        order = Request.objects.filter(pk=order_id, helper=request.user).first()
    if not order:
        return Response({"detail": "Order not found."}, status=404)
    p = Payment.objects.filter(request=order).first()
    if not p:
        return Response({"status": "none"})
    return Response({"status": p.status, "item_cost": p.item_cost,
                     "helper_fee": p.helper_fee, "total": p.total})


@api_view(["POST"])
def pay(request, order_id):
    order = Request.objects.filter(pk=order_id, customer=request.user).first()
    if not order:
        return Response({"detail": "Order not found."}, status=404)
    if RequestItem.objects.filter(request=order).exclude(
        status=RequestItem.ItemStatus.UNAVAILABLE
    ).filter(price_approved=False).exists():
        return Response({"detail": "All item prices must be approved first."}, status=400)
    item_cost = sum(item.actual_price or 0 for item in order.items.all())
    raw_helper_fee = request.data.get("helperFee", settings.HELPER_FEE_MIN)
    try:
        helper_fee = int(raw_helper_fee)
    except (TypeError, ValueError):
        return Response({"detail": "helperFee must be an integer."}, status=400)
    if not settings.HELPER_FEE_MIN <= helper_fee <= settings.HELPER_FEE_MAX:
        return Response({
            "detail": (
                f"helperFee must be between {settings.HELPER_FEE_MIN} "
                f"and {settings.HELPER_FEE_MAX}."
            )
        }, status=400)
    payment = create_payment(order, item_cost, helper_fee, str(order.id))
    return Response({"status": payment.status, "total": payment.total}, status=201)


@api_view(["POST"])
def confirm(request, order_id):
    payment = Payment.objects.filter(request_id=order_id).select_related("request").first()
    if not payment:
        return Response({"detail": "Payment not found."}, status=404)
    try:
        payment = confirm_payment(payment, request.user)
    except ValueError as error:
        return Response({"detail": str(error)}, status=403)
    return Response({"status": payment.status})
