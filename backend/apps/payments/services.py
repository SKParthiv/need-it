from django.db import transaction
from .models import Payment, PaymentStatus
from .providers import get_provider


def create_payment(request, item_cost, helper_fee, idempotency_key):
    """Charge the ACTUAL confirmed amount (cost + fee), never the expected guess."""
    payment, _ = Payment.objects.get_or_create(
        request=request,
        defaults={"item_cost": item_cost, "helper_fee": helper_fee,
                  "idempotency_key": idempotency_key},
    )
    provider = get_provider()
    return provider.create_charge(payment)


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
