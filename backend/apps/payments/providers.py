"""
The payment provider abstraction. The order state machine never talks to a
gateway directly — it calls this interface, and the active provider is chosen
by PAYMENT_PROVIDER in settings. Demos run on ManualUPIProvider; production
runs the merchant-of-record provider (platform collects, founders settle
payouts). True escrow (Razorpay Route) is RBI turnover-gated — see
docs/decisions.md.
"""
from django.conf import settings
import hashlib
import hmac
import logging
from .models import Payment, PaymentStatus
from config.middleware import get_request_id


logger = logging.getLogger(__name__)


def _set_status(payment, status, update_fields):
    previous = payment.status
    payment.status = status
    payment.save(update_fields=update_fields)
    if previous != status:
        logger.info(
            "payment transition payment_id=%s order_id=%s from=%s to=%s request_id=%s",
            payment.pk,
            payment.request_id,
            previous,
            status,
            get_request_id(),
        )


class PaymentProvider:
    name = "base"
    # True when this provider collects into the PLATFORM's account (merchant of
    # record) — completing an order then creates a Payout owed to the helper.
    # False when money moves customer→helper directly (manual UPI) or is split
    # at the gateway (Route): no platform settlement exists.
    settles_via_platform = False
    def create_charge(self, payment: Payment) -> dict:
        raise NotImplementedError
    def release(self, payment: Payment) -> dict:
        """Move held funds to the helper. MUST be idempotent (idempotency_key)."""
        raise NotImplementedError
    def confirm(self, payment: Payment) -> dict:
        raise NotImplementedError
    def refund(self, payment: Payment) -> dict:
        raise NotImplementedError
    def verify_webhook(self, headers, body: bytes) -> bool:
        raise NotImplementedError


class ManualUPIProvider(PaymentProvider):
    """
    Pilot: no gateway. The app records that both sides confirmed the UPI
    transfer happened out-of-band. Money is 'held' only as a record, which is
    enough to gate the state machine until real escrow lands.
    """
    name = "manual"
    def create_charge(self, payment):
        _set_status(payment, PaymentStatus.PENDING, ["status", "provider", "updated_at"])
        payment.provider = self.name
        payment.save(update_fields=["provider", "updated_at"])
        return {"status": "pending"}
    def confirm(self, payment):
        _set_status(payment, PaymentStatus.HELD, ["status", "updated_at"])
        return {"status": "held"}
    def release(self, payment):
        _set_status(payment, PaymentStatus.RELEASED, ["status", "updated_at"])
        return {"status": "released"}
    def refund(self, payment):
        _set_status(payment, PaymentStatus.REFUNDED, ["status", "updated_at"])
        return {"status": "refunded"}
    def verify_webhook(self, headers, body):  # no external webhooks in pilot
        return False


class RazorpayBaseProvider(PaymentProvider):
    """
    Merchant of record on a BASE Razorpay account (no Route): the customer
    pays a Payment Link into the PLATFORM's account; the platform owes the
    helper a payout (admin console + UPI). True escrow (Route) is RBI
    turnover-gated — this is the legal collection mode until then.

    Trust rules:
    - The ONLY thing that marks a payment HELD is the signed webhook
      (payment_link.paid). The app never takes the customer's word for it.
    - Release is a ledger flip, not a gateway call — the money is already
      in the platform account; founders settle it via the payout console.
    """
    name = "razorpay_base"
    settles_via_platform = True

    def _client(self):
        import razorpay  # imported lazily: tests and manual-mode never need it
        if not (settings.RAZORPAY_KEY_ID and settings.RAZORPAY_KEY_SECRET):
            raise RuntimeError("Razorpay keys are not configured.")
        return razorpay.Client(auth=(settings.RAZORPAY_KEY_ID,
                                     settings.RAZORPAY_KEY_SECRET))

    def create_charge(self, payment):
        import uuid
        link = self._client().payment_link.create({
            "amount": payment.total * 100,  # paise
            "currency": payment.currency,
            "description": f"Need It order #{payment.request_id}",
            # Unique per attempt: Razorpay rejects re-used reference_ids,
            # and a re-charge after refund must be a fresh link.
            "reference_id": f"{payment.idempotency_key}-{uuid.uuid4().hex[:8]}",
            "notes": {"request_id": str(payment.request_id)},
            "reminder_enable": False,
        })
        payment.provider = self.name
        payment.provider_ref = link["id"]
        payment.payment_url = link["short_url"]
        _set_status(payment, PaymentStatus.PENDING,
                    ["status", "provider", "provider_ref", "payment_url", "updated_at"])
        return {"status": "pending", "payment_url": link["short_url"]}

    def confirm(self, payment):
        # The signed webhook is the only honest confirmer — never the app's say-so.
        return payment

    def release(self, payment):
        # MoR: the money is already in the platform account, so handover only
        # flips the ledger; founders settle it from the payout console.
        _set_status(payment, PaymentStatus.RELEASED, ["status", "updated_at"])
        return {"status": "released"}

    def refund(self, payment):
        if payment.status == PaymentStatus.HELD and payment.provider_ref:
            client = self._client()
            link = client.payment_link.fetch(payment.provider_ref)
            paid = (link.get("payments") or [{}])[0].get("id")
            if paid:
                client.payment.refund(paid, {"amount": payment.total * 100})
        _set_status(payment, PaymentStatus.REFUNDED, ["status", "updated_at"])
        return {"status": "refunded"}

    def verify_webhook(self, headers, body):
        secret = settings.RAZORPAY_WEBHOOK_SECRET
        if not secret:
            return False
        signature = headers.get("X-Razorpay-Signature", "")
        expected = hmac.new(secret.encode(), body, hashlib.sha256).hexdigest()
        return hmac.compare_digest(expected, signature)


class RazorpayRouteProvider(PaymentProvider):
    """
    Real escrow via Razorpay Route: customer pays into the gateway, funds are
    HELD, and on handover we call release() to settle to the helper's linked
    account. TODO once KYC clears — everything below is a stub with the exact
    seams the state machine already depends on.
    """
    name = "razorpay"
    def create_charge(self, payment):
        # TODO: razorpay.Order.create(amount=payment.total*100, currency='INR',
        #       transfers=[helper linked account], receipt=payment.idempotency_key)
        raise NotImplementedError("wire up after Razorpay Route KYC")
    def release(self, payment):
        # TODO: POST /v1/payments/{id}/transfers — use payment.idempotency_key
        raise NotImplementedError("wire up after Razorpay Route KYC")
    def refund(self, payment):
        # TODO: razorpay.Payment(payment.provider_ref).refund()
        raise NotImplementedError("wire up after Razorpay Route KYC")
    def verify_webhook(self, headers, body):
        # TODO: HMAC-verify X-Razorpay-Signature with settings.RAZORPAY_WEBHOOK_SECRET
        raise NotImplementedError("wire up after Razorpay Route KYC")


_PROVIDERS = {
    ManualUPIProvider.name: ManualUPIProvider,
    RazorpayBaseProvider.name: RazorpayBaseProvider,
    RazorpayRouteProvider.name: RazorpayRouteProvider,
}


def get_provider() -> PaymentProvider:
    return provider_by_name(settings.PAYMENT_PROVIDER)


def provider_by_name(name: str) -> PaymentProvider:
    return _PROVIDERS[name]()
