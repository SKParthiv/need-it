"""
The escrow provider abstraction. The order state machine never talks to a
gateway directly — it calls this interface, and the active provider is chosen
by PAYMENT_PROVIDER in settings. Pilot runs on ManualUPIProvider; when Razorpay
Route KYC clears, flip one env var and the machine behaves identically.
"""
from django.conf import settings
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


def get_provider() -> PaymentProvider:
    return {
        "manual": ManualUPIProvider,
        "razorpay": RazorpayRouteProvider,
    }[settings.PAYMENT_PROVIDER]()
