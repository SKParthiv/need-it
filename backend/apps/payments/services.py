import logging

from django.conf import settings
from django.db import transaction
from django.utils import timezone

from .models import Payment, PaymentStatus, Payout, PayoutStatus
from .providers import get_provider, provider_by_name

logger = logging.getLogger(__name__)


def create_payment(request, item_cost, helper_fee, idempotency_key):
    """Charge the ACTUAL confirmed amount (cost + fee), never the expected guess.

    Idempotent: re-calling while a payment is PENDING or HELD returns it
    unchanged — a double-tap must never regress status or double-charge.
    After a refund/failure the amounts are re-quoted and charged again.
    Returns the Payment object (callers need .status and .total).
    """
    payment, _ = Payment.objects.get_or_create(
        request=request,
        defaults={"item_cost": item_cost, "helper_fee": helper_fee,
                  "idempotency_key": idempotency_key},
    )
    if payment.status in (PaymentStatus.PENDING, PaymentStatus.HELD):
        return payment
    if payment.item_cost != item_cost or payment.helper_fee != helper_fee:
        payment.item_cost = item_cost
        payment.helper_fee = helper_fee
        payment.save(update_fields=("item_cost", "helper_fee", "updated_at"))
    provider = get_provider()
    provider.create_charge(payment)
    return payment


def release_to_helper(payment):
    """Called after BOTH handover codes confirmed. Idempotent via provider."""
    if payment.status != PaymentStatus.HELD:
        return payment  # already released/refunded — safe no-op
    return get_provider().release(payment)


def refund(payment):
    if payment.status in (PaymentStatus.HELD, PaymentStatus.PENDING):
        return get_provider().refund(payment)
    return payment


def confirm_payment(payment, user):
    if user.id == payment.request.customer_id:
        payment.customer_confirmed = True
    elif user.id == payment.request.helper_id:
        payment.helper_confirmed = True
    else:
        raise ValueError("Only the customer or assigned helper can confirm payment.")
    payment.save(update_fields=("customer_confirmed", "helper_confirmed", "updated_at"))
    if payment.customer_confirmed and payment.helper_confirmed:
        get_provider().confirm(payment)
    return payment


# --- Merchant-of-record payouts -------------------------------------------------

class PayoutError(Exception):
    pass


class PayoutNotFound(PayoutError):
    pass


class PayoutConflict(PayoutError):
    """Already settled — a retry, not a new state."""


def create_payout_for_order(order):
    """Create the helper payout when an order completes AND the platform holds
    the money (merchant of record). One per order via the OneToOne — safe to
    call again after a crash. Manual-mode orders create nothing: that money
    moved customer→helper directly."""
    try:
        payment = order.payment
    except Payment.DoesNotExist:
        return None
    if not provider_by_name(payment.provider).settles_via_platform:
        return None
    # The cut can never exceed the fee — the helper always keeps the item cost.
    cut = min(settings.PLATFORM_CUT_PER_ORDER, payment.helper_fee)
    payout, created = Payout.objects.get_or_create(
        request=order,
        defaults={
            "helper_id": order.helper_id,
            "item_cost": payment.item_cost,
            "helper_fee": payment.helper_fee,
            "platform_cut": cut,
            "amount": payment.item_cost + payment.helper_fee - cut,
            "upi_id": getattr(order.helper, "upi_id", "") if order.helper else "",
        },
    )
    if created:
        logger.info(
            "payout created payout_id=%s order_id=%s helper_id=%s amount=%s cut=%s",
            payout.pk, order.pk, order.helper_id, payout.amount, cut,
        )
    return payout


def mark_paid(payout_id, staff_user, utr):
    """Guarded settle: only a DUE row can become PAID (rows-affected check), so
    a double-click or two founders settling at once can never double-record."""
    utr = (utr or "").strip()
    if not utr or len(utr) > 64:
        raise PayoutError("A UPI transaction reference (UTR) is required.")
    rows = (Payout.objects.filter(pk=payout_id, status=PayoutStatus.DUE)
            .update(status=PayoutStatus.PAID, utr=utr,
                    paid_by=staff_user, paid_at=timezone.now()))
    if rows:
        logger.info("payout settled payout_id=%s by_user=%s utr=%s",
                    payout_id, staff_user.pk, utr)
        return Payout.objects.get(pk=payout_id)
    if not Payout.objects.filter(pk=payout_id).exists():
        raise PayoutNotFound("Payout not found.")
    raise PayoutConflict("Payout is already settled.")
