"""
Razorpay webhook entry point. Two rules make this safe:
  1. verify the signature before trusting anything;
  2. record provider_event_id with a unique constraint so retries are idempotent.
Pilot (manual provider) accepts nothing here.
"""
import json
import logging
from django.db import IntegrityError, transaction
from django.http import HttpResponse, HttpResponseForbidden
from django.utils import timezone
from django.views.decorators.csrf import csrf_exempt
from .models import Payment, PaymentEvent, PaymentStatus
from .providers import get_provider

logger = logging.getLogger(__name__)


def _handle_payment_link_paid(data, event_row):
    """The ONLY path that marks a gateway payment HELD — the customer's money
    is now in the platform account, which unlocks purchase (the escrow gate)."""
    entity = (data.get("payload", {}).get("payment_link", {}) or {}).get("entity", {})
    link_id = entity.get("id", "")
    if not link_id:
        return
    # Guarded: only a PENDING payment can become HELD. A refunded/cancelled
    # order's late webhook must not resurrect the money.
    rows = (Payment.objects.filter(provider_ref=link_id, status=PaymentStatus.PENDING)
            .update(status=PaymentStatus.HELD, updated_at=timezone.now()))
    if rows:
        payment = Payment.objects.get(provider_ref=link_id)
        event_row.payment = payment
        event_row.save(update_fields=("payment",))
        logger.info("payment held via webhook payment_id=%s order_id=%s link=%s",
                    payment.pk, payment.request_id, link_id)


@csrf_exempt  # gateway posts here; authenticity comes from the signature, not CSRF
def razorpay_webhook(request):
    provider = get_provider()
    body = request.body
    if not provider.verify_webhook(request.headers, body):
        return HttpResponseForbidden("bad signature")
    data = json.loads(body)
    event_id = data.get("id", "")
    try:
        # The savepoint localizes the unique-violation so a duplicate event
        # doesn't poison an enclosing transaction.
        with transaction.atomic():
            event_row = PaymentEvent.objects.create(provider_event_id=event_id,
                                                    kind=data.get("event", ""), payload=data)
    except IntegrityError:
        return HttpResponse("already processed")  # retry — safe to ignore
    if data.get("event") == "payment_link.paid":
        _handle_payment_link_paid(data, event_row)
    return HttpResponse("ok")
