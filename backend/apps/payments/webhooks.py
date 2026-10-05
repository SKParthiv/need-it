"""
Razorpay webhook entry point. Two rules make this safe:
  1. verify the signature before trusting anything;
  2. record provider_event_id with a unique constraint so retries are idempotent.
Pilot (manual provider) accepts nothing here.
"""
import json
from django.db import IntegrityError
from django.http import HttpResponse, HttpResponseForbidden
from django.views.decorators.csrf import csrf_exempt
from .models import PaymentEvent
from .providers import get_provider


@csrf_exempt  # gateway posts here; authenticity comes from the signature, not CSRF
def razorpay_webhook(request):
    provider = get_provider()
    body = request.body
    if not provider.verify_webhook(request.headers, body):
        return HttpResponseForbidden("bad signature")
    data = json.loads(body)
    event_id = data.get("id", "")
    try:
        PaymentEvent.objects.create(provider_event_id=event_id,
                                    kind=data.get("event", ""), payload=data)
    except IntegrityError:
        return HttpResponse("already processed")  # retry — safe to ignore
    # TODO: map event -> payment state (held/released/failed) -> order transitions
    return HttpResponse("ok")
