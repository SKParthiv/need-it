"""
All state changes go through here. The rule that makes the escrow trustworthy:
a transition only succeeds if the DB row is still in the state we think it is.
We do that with a guarded UPDATE that checks rows-affected — so two people
acting at once can never both win, and an illegal transition can never write.
"""
from django.db import transaction
import logging
from .models import OrderStatus, Request, RequestItem, StatusChange, ALLOWED_TRANSITIONS
from config.middleware import get_request_id


logger = logging.getLogger(__name__)


class IllegalTransition(Exception):
    pass


class ConflictLost(Exception):
    """Someone else changed the row first (e.g. two helpers tapped accept)."""
    pass


def _guarded_move(request_id, expect, to, actor, note=""):
    if to not in ALLOWED_TRANSITIONS.get(expect, set()):
        raise IllegalTransition(f"{expect} -> {to} is not allowed")
    with transaction.atomic():
        # The WHERE status=expect is the guard: only one concurrent caller wins.
        rows = (Request.objects
                .filter(pk=request_id, status=expect)
                .update(status=to))
        if rows == 0:
            raise ConflictLost(f"request {request_id} is no longer {expect}")
        StatusChange.objects.create(request_id=request_id, from_status=expect,
                                    to_status=to, actor=actor, note=note)
    logger.info(
        "order transition order_id=%s from=%s to=%s actor=%s request_id=%s",
        request_id,
        expect,
        to,
        getattr(actor, "pk", None) or "-",
        get_request_id(),
    )
    return Request.objects.get(pk=request_id)


def accept(request_id, helper):
    # Conflict check comes FIRST: if the request is no longer open, the guarded
    # move raises ConflictLost (409) regardless of who is asking — this keeps
    # the two-helpers-race semantics the state machine tests rely on.
    req = Request.objects.get(pk=request_id)
    if req.status != OrderStatus.OPEN:
        _guarded_move(request_id, OrderStatus.OPEN, OrderStatus.ACCEPTED, helper, "helper accepted")
    if helper.role != "helper" or not helper.is_verified_student:
        raise IllegalTransition("only a verified helper can accept a request")
    obj = _guarded_move(request_id, OrderStatus.OPEN, OrderStatus.ACCEPTED, helper, "helper accepted")
    Request.objects.filter(pk=request_id).update(helper=helper)
    from apps.notifications.services import notify
    from apps.notifications.models import Notification
    notify(obj.customer, Notification.Type.ACCEPTED,
           "Request accepted", "A helper accepted your request. Chat is now open.", order=obj)
    return obj


def release(request_id, actor):
    """Helper releases before purchase -> back to feed (OPEN), helper cleared."""
    req = Request.objects.get(pk=request_id)
    if req.helper_id != actor.id:
        raise IllegalTransition("only the assigned helper can release a request")
    obj = _guarded_move(request_id, OrderStatus.ACCEPTED, OrderStatus.OPEN, actor, "released to feed")
    Request.objects.filter(pk=request_id).update(helper=None)
    return obj


def mark_purchased(request_id, actor):
    """
    ESCROW GATE: an order can only move to PURCHASED once money is HELD.
    The helper never fronts cash — this is enforced here, not in the UI.
    """
    from apps.payments.models import Payment, PaymentStatus
    request = Request.objects.get(pk=request_id)
    if request.helper_id != actor.id:
        raise IllegalTransition("only the assigned helper can mark a request purchased")
    payment = Payment.objects.filter(request_id=request_id).first()
    if not payment or payment.status != PaymentStatus.HELD:
        raise IllegalTransition("cannot mark purchased: payment is not held")
    if RequestItem.objects.filter(request_id=request_id).exclude(
            status=RequestItem.ItemStatus.UNAVAILABLE,
        ).exclude(price_approved=True).exists():
        raise IllegalTransition("cannot mark purchased: item prices are not approved")
    return _guarded_move(request_id, OrderStatus.ACCEPTED, OrderStatus.PURCHASED, actor, "items purchased")


def confirm_handover(request_id, actor):
    req = Request.objects.get(pk=request_id)
    req.ensure_handover_code()
    if actor.id == req.customer_id:
        req.customer_handover_confirmed = True
    elif actor.id == req.helper_id:
        req.helper_handover_confirmed = True
        from apps.notifications.services import notify
        from apps.notifications.models import Notification
        notify(req.customer, Notification.Type.READY_FOR_PICKUP,
               "Ready for pickup", "Your helper is ready to hand over your items.", order=req)
    else:
        raise IllegalTransition("only the customer or helper can confirm handover")
    req.save(update_fields=("customer_handover_confirmed", "helper_handover_confirmed", "updated_at"))
    if req.customer_handover_confirmed and req.helper_handover_confirmed:
        obj = _guarded_move(request_id, OrderStatus.PURCHASED, OrderStatus.HANDED_OVER,
                            actor, "both sides confirmed handover")
        from apps.payments.services import release_to_helper, create_payout_for_order
        payment = obj.payment
        release_to_helper(payment)
        obj = complete(request_id, actor)
        try:
            # MoR: the platform now owes the helper. Never let a payout hiccup
            # 500 a completed handover — the failure is logged for backfill.
            create_payout_for_order(obj)
        except Exception:
            logger.exception("payout creation failed for order %s — needs backfill", obj.pk)
        return obj
    return req


def complete(request_id, actor=None):
    """Reached from the settlement webhook after funds release — mechanical."""
    obj = _guarded_move(request_id, OrderStatus.HANDED_OVER, OrderStatus.COMPLETED, actor, "completed")
    from apps.notifications.services import notify
    from apps.notifications.models import Notification
    for recipient in (obj.customer, obj.helper):
        notify(recipient, Notification.Type.COMPLETED,
               "Order completed", "Payment settled. Thanks for using Need It!", order=obj)
    return obj


def cancel(request_id, actor, note="", helper_agree=False):
    from apps.payments.services import refund
    from apps.payments.models import Payment, PaymentStatus

    with transaction.atomic():
        req = Request.objects.select_for_update().get(pk=request_id)
        if actor.id == req.customer_id and req.status == OrderStatus.PURCHASED and not helper_agree:
            raise IllegalTransition("post-purchase cancellation requires helper agreement")
        if actor.id not in (req.customer_id, req.helper_id):
            raise IllegalTransition("only the customer or assigned helper can cancel")
        if req.status not in (OrderStatus.OPEN, OrderStatus.ACCEPTED, OrderStatus.PURCHASED):
            raise IllegalTransition(f"cannot cancel from {req.status}")

        payment = Payment.objects.select_for_update().filter(request_id=request_id).first()
        if payment and payment.status in (PaymentStatus.PENDING, PaymentStatus.HELD):
            refund(payment)
        return _guarded_move(request_id, req.status, OrderStatus.CANCELLED, actor, note or "cancelled")


def sweep_stale_accepted(now=None):
    """Free-tier replacement for the Celery timeout job.

    Accepted orders with no HELD payment that have been idle longer than
    PAYMENT_TIMEOUT_MINUTES go back to the feed (helper cleared) so they
    never get stuck invisible to other helpers. Called on every feed read —
    at pilot scale a cron worker is unjustified infrastructure.
    """
    from datetime import timedelta
    from django.conf import settings
    from django.utils import timezone
    from apps.payments.models import Payment, PaymentStatus

    now = now or timezone.now()
    cutoff = now - timedelta(minutes=settings.PAYMENT_TIMEOUT_MINUTES)
    stale = Request.objects.filter(
        status=OrderStatus.ACCEPTED, updated_at__lt=cutoff,
    ).exclude(payment__status=PaymentStatus.HELD)

    released = 0
    for req in stale:
        payment = Payment.objects.filter(request_id=req.id).first()
        if payment and payment.status == PaymentStatus.PENDING:
            continue  # money may be mid-flight; only idle UNPAID orders release
        _guarded_move(req.id, OrderStatus.ACCEPTED, OrderStatus.OPEN,
                      None, "auto-released: no payment within timeout")
        Request.objects.filter(pk=req.id).update(helper=None)
        released += 1
    return released
