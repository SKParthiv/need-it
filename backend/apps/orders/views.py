import hashlib
import time
from django.conf import settings
from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status
from .models import OrderStatus, Request, RequestItem
from .serializers import RequestSerializer
from apps.users.permissions import IsVerifiedStudent
from . import services


@api_view(["GET"])
def feed(request):
    services.sweep_stale_accepted()  # lazy timeout job (free tier: no Celery)
    queryset = Request.objects.filter(status=OrderStatus.OPEN).prefetch_related("items").order_by("needed_by")
    return Response(RequestSerializer(queryset, many=True, context={"request": request}).data)


@api_view(["GET"])
def my_requests(request):
    reqs = Request.objects.filter(customer=request.user).prefetch_related("items").order_by("-created_at")
    return Response(RequestSerializer(reqs, many=True, context={"request": request}).data)


@api_view(["POST"])
def create_request(request):
    if not request.user.is_verified_student:
        return Response({"detail": IsVerifiedStudent.message}, status=status.HTTP_403_FORBIDDEN)
    serializer = RequestSerializer(data=request.data, context={"request": request})
    serializer.is_valid(raise_exception=True)
    serializer.save()
    return Response(serializer.data, status=status.HTTP_201_CREATED)


@api_view(["GET"])
def get_request(request, pk):
    obj = Request.objects.prefetch_related("items").filter(pk=pk).first()
    if not obj:
        return Response({"detail": "Request not found."}, status=status.HTTP_404_NOT_FOUND)
    if request.user not in (obj.customer, obj.helper):
        return Response({"detail": "You do not have access to this request."}, status=status.HTTP_403_FORBIDDEN)
    return Response(RequestSerializer(obj, context={"request": request}).data)


@api_view(["POST"])
def accept(request, pk):
    if not request.user.is_verified_student or request.user.role != "helper":
        return Response({"detail": IsVerifiedStudent.message}, status=status.HTTP_403_FORBIDDEN)
    try:
        obj = services.accept(pk, request.user)
    except services.ConflictLost:
        return Response({"detail": "Already taken by another helper."}, status=409)
    except services.IllegalTransition as error:
        return Response({"detail": str(error)}, status=status.HTTP_400_BAD_REQUEST)
    return Response({"id": obj.id, "status": obj.status})


@api_view(["POST"])
def mark_purchased(request, pk):
    if (not request.user.is_verified_student
            or request.user.role != "helper"):
        return Response({"detail": IsVerifiedStudent.message}, status=status.HTTP_403_FORBIDDEN)
    try:
        obj = services.mark_purchased(pk, request.user)
    except services.ConflictLost as error:
        return Response({"detail": str(error)}, status=status.HTTP_409_CONFLICT)
    except services.IllegalTransition as error:
        return Response({"detail": str(error)}, status=status.HTTP_400_BAD_REQUEST)
    return Response({"id": obj.id, "status": obj.status})


@api_view(["POST"])
def release(request, pk):
    if not request.user.is_verified_student:
        return Response({"detail": IsVerifiedStudent.message}, status=status.HTTP_403_FORBIDDEN)
    try:
        obj = services.release(pk, request.user)
    except services.IllegalTransition as e:
        return Response({"detail": str(e)}, status=400)
    return Response({"id": obj.id, "status": obj.status})


@api_view(["POST"])
def cancel(request, pk):
    if not request.user.is_verified_student:
        return Response({"detail": IsVerifiedStudent.message}, status=status.HTTP_403_FORBIDDEN)
    try:
        obj = services.cancel(
            pk, request.user, request.data.get("reason", ""),
            bool(request.data.get("helperAgree", False)),
        )
    except services.IllegalTransition as error:
        return Response({"detail": str(error)}, status=status.HTTP_400_BAD_REQUEST)
    return Response({"id": obj.id, "status": obj.status})


@api_view(["POST"])
def propose_price(request, pk, item_id):
    item = RequestItem.objects.filter(pk=item_id, request_id=pk).select_related("request").first()
    if not item or item.request.helper_id != request.user.id:
        return Response({"detail": "Only the assigned helper can propose a price."}, status=403)
    if item.request.status != OrderStatus.ACCEPTED:
        return Response({"detail": "Prices can only be proposed for accepted requests."}, status=400)
    item.actual_price = request.data.get("actualPrice")
    item.price_approved = False
    photo_url = (request.data.get("evidencePhotoUrl") or "").strip()
    update_fields = ["actual_price", "price_approved"]
    if photo_url:
        cloud = settings.CLOUDINARY_CLOUD_NAME
        allowed_prefix = f"https://res.cloudinary.com/{cloud}/" if cloud else None
        if not allowed_prefix or not photo_url.startswith(allowed_prefix):
            return Response({"detail": "Evidence photo must be a Need It upload."}, status=400)
        item.evidence_photo_url = photo_url
        update_fields.append("evidence_photo_url")
    item.save(update_fields=update_fields)
    from apps.notifications.services import notify
    from apps.notifications.models import Notification
    notify(item.request.customer, Notification.Type.PRICE_CHANGE,
           "Price proposed", f"New price proposed for {item.name}.", order=item.request)
    return Response({"id": item.id, "actualPrice": item.actual_price, "priceApproved": False})


@api_view(["GET"])
def upload_signature(request):
    """Sign one direct browser→Cloudinary upload. The API never proxies photos —
    it just vouches for this upload, so storage and bandwidth stay Cloudinary's
    free-tier problem, not ours."""
    if not (settings.CLOUDINARY_CLOUD_NAME and settings.CLOUDINARY_API_KEY
            and settings.CLOUDINARY_API_SECRET):
        return Response({"detail": "Photo uploads are not configured."}, status=503)
    timestamp = int(time.time())
    folder = settings.CLOUDINARY_FOLDER
    to_sign = f"folder={folder}&timestamp={timestamp}{settings.CLOUDINARY_API_SECRET}"
    return Response({
        "cloudName": settings.CLOUDINARY_CLOUD_NAME,
        "apiKey": settings.CLOUDINARY_API_KEY,
        "timestamp": timestamp,
        "folder": folder,
        "signature": hashlib.sha1(to_sign.encode()).hexdigest(),
    })


@api_view(["POST"])
def approve_price(request, pk):
    obj = Request.objects.filter(pk=pk, customer=request.user).first()
    if not obj:
        return Response({"detail": "Request not found."}, status=404)
    item_ids = request.data.get("itemIds", [])
    items = obj.items.filter(pk__in=item_ids) if item_ids else obj.items.all()
    if items.filter(actual_price__isnull=True).exists():
        return Response({"detail": "Every item needs an actual price first."}, status=400)
    items.update(price_approved=True)
    if obj.helper_id:
        from apps.notifications.services import notify
        from apps.notifications.models import Notification
        notify(obj.helper, Notification.Type.PRICE_CHANGE,
               "Prices approved", "The customer approved the item prices.", order=obj)
        # Fully approved → the payment moment: post the payment card into
        # the order chat (customer pays the helper directly via UPI).
        unavailable = obj.items.model.ItemStatus.UNAVAILABLE
        if not obj.items.exclude(status=unavailable).filter(
                price_approved=False).exists():
            from apps.chat.services import post_payment_card
            post_payment_card(obj, request.user)
    return Response({"approved": list(items.values_list("id", flat=True))})


@api_view(["POST"])
def mark_unavailable(request, pk, item_id):
    item = RequestItem.objects.filter(pk=item_id, request_id=pk).select_related("request").first()
    if not item or item.request.helper_id != request.user.id:
        return Response({"detail": "Only the assigned helper can update this item."}, status=403)
    item.status = RequestItem.ItemStatus.UNAVAILABLE
    item.save(update_fields=("status",))
    from apps.notifications.services import notify
    from apps.notifications.models import Notification
    notify(item.request.customer, Notification.Type.ITEM_UNAVAILABLE,
           "Item unavailable", f"{item.name} is unavailable.", order=item.request)
    return Response({"id": item.id, "status": item.status})


@api_view(["POST"])
def propose_replacement(request, pk, item_id):
    item = RequestItem.objects.filter(pk=item_id, request_id=pk).select_related("request").first()
    if not item or item.request.helper_id != request.user.id:
        return Response({"detail": "Only the assigned helper can propose a replacement."}, status=403)
    item.replacement_proposal = {
        "name": request.data.get("name"),
        "price": request.data.get("price"),
        "photoUrl": request.data.get("photoUrl"),
        "reason": request.data.get("reason"),
        "approved": False,
    }
    item.status = RequestItem.ItemStatus.REPLACED
    item.save(update_fields=("replacement_proposal", "status"))
    return Response({"id": item.id, "replacementProposal": item.replacement_proposal})


@api_view(["POST"])
def approve_replacement(request, pk, item_id):
    item = RequestItem.objects.filter(pk=item_id, request_id=pk, request__customer=request.user).first()
    if not item or not item.replacement_proposal:
        return Response({"detail": "Replacement proposal not found."}, status=404)
    proposal = dict(item.replacement_proposal)
    proposal["approved"] = bool(request.data.get("approved", True))
    item.replacement_proposal = proposal
    item.price_approved = proposal["approved"]
    item.save(update_fields=("replacement_proposal", "price_approved"))
    return Response({"id": item.id, "replacementProposal": proposal})


@api_view(["POST"])
def confirm_handover(request, pk):
    obj = Request.objects.filter(pk=pk).first()
    if not obj:
        return Response({"detail": "Request not found."}, status=404)
    if request.user.role != "helper":
        return Response({"detail": "Only the helper can enter the handover code."}, status=403)
    try:
        obj = services.confirm_handover(pk, request.user, request.data.get("code", ""))
    except services.IllegalTransition as error:
        return Response({"detail": str(error)}, status=400)
    return Response({"id": obj.id, "status": obj.status})
