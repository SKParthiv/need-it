from django.conf import settings

from apps.payments.providers import get_provider

from .models import ChatMessage

PAYMENT_CARD_TYPE = "payment_card"


def _approved_item_cost(order):
    unavailable = order.items.model.ItemStatus.UNAVAILABLE
    return sum(item.actual_price or 0
               for item in order.items.exclude(status=unavailable))


def post_payment_card(order, actor):
    """Post the payment card into the order chat when prices are approved.

    Two pay modes, driven by the active payment provider (decisions.md D9):

    - gateway (merchant of record): the customer pays a Razorpay link into
      the PLATFORM's account. The card carries no UPI ID — the link is
      created per charge at pay time (POST /orders/<id>/pay/), so clients
      render a "Pay securely" button and open the returned payment_url.
    - upi (manual pilot): the customer pays the HELPER directly, so the
      card carries the helper's live upi_id; clients render the QR and
      compose the upi:// deep link themselves.

    The fee is customer-chosen at pay time within
    [HELPER_FEE_MIN, HELPER_FEE_MAX]. Latest card wins: a re-approval with
    the same item cost posts nothing; a changed cost posts a fresh card
    that supersedes the old one.
    """
    helper = order.helper
    if helper is None:
        return None
    provider = get_provider()
    pay_mode = "gateway" if provider.settles_via_platform else "upi"
    upi_id = (helper.upi_id or "").strip()
    if pay_mode == "upi" and not upi_id:
        notice = "The helper hasn't added a UPI ID yet — ask them to set it in their profile before paying."
        if not order.messages.filter(is_system_notice=True, text=notice).exists():
            return ChatMessage.objects.create(
                request=order, sender=actor, is_system_notice=True, text=notice)
        return None
    item_cost = _approved_item_cost(order)
    latest = (order.messages.filter(is_system_notice=True)
              .exclude(card__isnull=True).order_by("-created_at").first())
    if latest and latest.card.get("type") == PAYMENT_CARD_TYPE \
            and latest.card.get("itemCost") == item_cost \
            and latest.card.get("payMode") == pay_mode \
            and (pay_mode == "gateway" or latest.card.get("upiId") == upi_id):
        return latest  # nothing changed — no duplicate card
    card = {
        "type": PAYMENT_CARD_TYPE,
        "orderId": order.pk,
        "payMode": pay_mode,
        "itemCost": item_cost,
        "feeMin": settings.HELPER_FEE_MIN,
        "feeMax": settings.HELPER_FEE_MAX,
        "suggestedFee": settings.HELPER_FEE_MIN,
        "currency": "INR",
        "note": f"Need It order #{order.pk}",
    }
    if pay_mode == "upi":
        card["upiId"] = upi_id
        text = "Payment card — pay the helper directly via UPI, then tap \"I've paid\"."
    else:
        text = ("Payment card — pay securely via the link. The platform holds "
                "the money and releases it to the helper after the handover OTP.")
    return ChatMessage.objects.create(
        request=order, sender=actor, is_system_notice=True,
        text=text, card=card)
