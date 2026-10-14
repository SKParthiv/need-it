from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAdminUser
from rest_framework.response import Response
from .models import Payment, Payout, PayoutStatus
from .providers import get_provider
from .services import (confirm_payment, create_payment, mark_paid,
                       PayoutError, PayoutNotFound, PayoutConflict)
from apps.orders.models import OrderStatus, Request, RequestItem
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
        # No charge yet — report the ACTIVE provider so clients know which
        # pay UI to render before the payment row exists.
        return Response({"status": "none", "provider": get_provider().name})
    return Response({"status": p.status, "item_cost": p.item_cost,
                     "helper_fee": p.helper_fee, "total": p.total,
                     "provider": p.provider or get_provider().name})


@api_view(["POST"])
def pay(request, order_id):
    order = Request.objects.filter(pk=order_id, customer=request.user).first()
    if not order:
        return Response({"detail": "Order not found."}, status=404)
    if order.status != OrderStatus.ACCEPTED:
        return Response(
            {"detail": "Payment can start only after a helper accepts the order."},
            status=400)
    unavailable = RequestItem.ItemStatus.UNAVAILABLE
    if RequestItem.objects.filter(request=order).exclude(
        status=unavailable
    ).filter(price_approved=False).exists():
        return Response({"detail": "All item prices must be approved first."}, status=400)
    # Unavailable items are not bought, so they are never charged.
    item_cost = sum(item.actual_price or 0
                    for item in order.items.exclude(status=unavailable))
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
    try:
        payment = create_payment(order, item_cost, helper_fee, str(order.id))
    except RuntimeError:
        # e.g. gateway provider selected but keys not configured — a config
        # error, not a customer error; never surface a bare 500.
        return Response(
            {"detail": "Online payment is not configured yet. Try again later."},
            status=503)
    return Response({"status": payment.status, "total": payment.total,
                     "paymentUrl": payment.payment_url or None}, status=201)


@api_view(["POST"])
def confirm(request, order_id):
    payment = Payment.objects.filter(request_id=order_id).select_related("request").first()
    if not payment:
        return Response({"detail": "Payment not found."}, status=404)
    if payment.provider == "razorpay_base":
        return Response(
            {"detail": "Gateway payments confirm automatically after capture — no manual confirm."},
            status=400)
    try:
        payment = confirm_payment(payment, request.user)
    except ValueError as error:
        return Response({"detail": str(error)}, status=403)
    return Response({"status": payment.status})


# --- Payouts (merchant of record) ------------------------------------------------

def _payout_dict(p):
    """camelCase to match the rest of the API. upiId is the helper's LIVE
    profile value — the account money actually goes to — with the creation-time
    snapshot kept alongside for audit."""
    live_upi = getattr(p.helper, "upi_id", "") or p.upi_id
    return {
        "id": p.id,
        "orderId": p.request_id,
        "helper": {
            "id": p.helper_id,
            "name": p.helper.get_full_name() or p.helper.email,
            "email": p.helper.email,
        },
        "upiId": live_upi,
        "upiIdAtCreation": p.upi_id,
        "itemCost": p.item_cost,
        "helperFee": p.helper_fee,
        "platformCut": p.platform_cut,
        "amount": p.amount,
        "status": p.status,
        "utr": p.utr,
        "paidBy": p.paid_by.email if p.paid_by else None,
        "createdAt": p.created_at.isoformat(),
        "paidAt": p.paid_at.isoformat() if p.paid_at else None,
    }


@api_view(["GET"])
@permission_classes([IsAdminUser])
def admin_payouts(request):
    status_filter = request.GET.get("status", PayoutStatus.DUE)
    payouts = Payout.objects.select_related("helper", "paid_by")
    if status_filter != "all":
        payouts = payouts.filter(status=status_filter)
    newest_first = status_filter != PayoutStatus.DUE
    payouts = payouts.order_by("-paid_at" if newest_first else "created_at")
    return Response([_payout_dict(p) for p in payouts])


@api_view(["POST"])
@permission_classes([IsAdminUser])
def admin_mark_payout_paid(request, payout_id):
    try:
        payout = mark_paid(payout_id, request.user, request.data.get("utr", ""))
    except PayoutNotFound as error:
        return Response({"detail": str(error)}, status=404)
    except PayoutConflict as error:
        return Response({"detail": str(error)}, status=409)
    except PayoutError as error:
        return Response({"detail": str(error)}, status=400)
    return Response(_payout_dict(payout))


@api_view(["GET"])
def earnings(request):
    """The logged-in helper's own settlement view: what's due, what's paid."""
    payouts = (Payout.objects.filter(helper=request.user)
               .select_related("helper", "paid_by").order_by("-created_at"))
    due_total = sum(p.amount for p in payouts if p.status == PayoutStatus.DUE)
    paid_total = sum(p.amount for p in payouts if p.status == PayoutStatus.PAID)
    return Response({
        "dueTotal": due_total,
        "paidTotal": paid_total,
        "payouts": [_payout_dict(p) for p in payouts],
    })
