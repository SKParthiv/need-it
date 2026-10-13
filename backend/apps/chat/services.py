from django.conf import settings

from .models import ChatMessage

PAYMENT_CARD_TYPE = "payment_card"


def _approved_item_cost(order):
    unavailable = order.items.model.ItemStatus.UNAVAILABLE
    return sum(item.actual_price or 0
               for item in order.items.exclude(status=unavailable))


def post_payment_card(order, actor):
    """Post the payment card into the order chat when prices are approved.

    The customer pays the HELPER directly (UPI), so the card carries the
    helper's live upi_id plus the amount components; clients render the QR
    and compose the upi:// deep link themselves (fee is customer-chosen at
    pay time within [HELPER_FEE_MIN, HELPER_FEE_MAX]). Latest card wins:
    a re-approval with the same item cost posts nothing; a changed cost
    posts a fresh card that supersedes the old one.
    """
    helper = order.helper
    if helper is None:
        return None
    upi_id = (helper.upi_id or "").strip()
    if not upi_id:
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
            and latest.card.get("upiId") == upi_id:
        return latest  # nothing changed — no duplicate card
    return ChatMessage.objects.create(
        request=order, sender=actor, is_system_notice=True,
        text="Payment card — pay the helper directly via UPI, then tap \"I've paid\".",
        card={
            "type": PAYMENT_CARD_TYPE,
            "orderId": order.pk,
            "upiId": upi_id,
            "itemCost": item_cost,
            "feeMin": settings.HELPER_FEE_MIN,
            "feeMax": settings.HELPER_FEE_MAX,
            "suggestedFee": settings.HELPER_FEE_MIN,
            "currency": "INR",
            "note": f"Need It order #{order.pk}",
        })
