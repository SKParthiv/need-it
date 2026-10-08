"""
All state changes go through here. The rule that makes the escrow trustworthy:
a transition only succeeds if the DB row is still in the state we think it is.
We do that with a guarded UPDATE that checks rows-affected — so two people
acting at once can never both win, and an illegal transition can never write.
"""
from django.db import transaction
from .models import OrderStatus, Request, RequestItem, StatusChange, ALLOWED_TRANSITIONS


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
    return Request.objects.get(pk=request_id)


def accept(request_id, helper):
    req = Request.objects.get(pk=request_id)
    if req.status != OrderStatus.OPEN:
        _guarded_move(request_id, OrderStatus.OPEN, OrderStatus.ACCEPTED, helper, "helper accepted")
    if helper.role != "helper" or not helper.is_verified_student:
        raise IllegalTransition("only a verified helper can accept a request")
    obj = _guarded_move(request_id, OrderStatus.OPEN, OrderStatus.ACCEPTED, helper, "helper accepted")
    Request.objects.filter(pk=request_id).update(helper=helper)
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
    else:
        raise IllegalTransition("only the customer or helper can confirm handover")
    req.save(update_fields=("customer_handover_confirmed", "helper_handover_confirmed", "updated_at"))
    if req.customer_handover_confirmed and req.helper_handover_confirmed:
        obj = _guarded_move(request_id, OrderStatus.PURCHASED, OrderStatus.HANDED_OVER,
                            actor, "both sides confirmed handover")
        from apps.payments.services import release_to_helper
        payment = obj.payment
        release_to_helper(payment)
        return complete(request_id, actor)
    return req


def complete(request_id, actor=None):
    """Reached from the settlement webhook after funds release — mechanical."""
    return _guarded_move(request_id, OrderStatus.HANDED_OVER, OrderStatus.COMPLETED, actor, "completed")


def cancel(request_id, actor, note="", helper_agree=False):
    req = Request.objects.get(pk=request_id)
    if actor.id == req.customer_id and req.status == OrderStatus.PURCHASED and not helper_agree:
        raise IllegalTransition("post-purchase cancellation requires helper agreement")
    if actor.id not in (req.customer_id, req.helper_id):
        raise IllegalTransition("only the customer or assigned helper can cancel")
    if req.status in (OrderStatus.OPEN, OrderStatus.ACCEPTED, OrderStatus.PURCHASED):
        return _guarded_move(request_id, req.status, OrderStatus.CANCELLED, actor, note or "cancelled")
    raise IllegalTransition(f"cannot cancel from {req.status}")
