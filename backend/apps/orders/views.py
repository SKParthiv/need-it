from rest_framework.decorators import api_view
from rest_framework.response import Response
from .models import OrderStatus, Request
from . import services


@api_view(["GET"])
def feed(request):
    open_reqs = Request.objects.filter(status=OrderStatus.OPEN).order_by("needed_by")
    data = [{"id": r.id, "pickup_point": r.pickup_point, "needed_by": r.needed_by,
             "is_urgent": r.is_urgent, "expected_total": r.expected_total} for r in open_reqs]
    return Response(data)


@api_view(["GET"])
def my_requests(request):
    reqs = Request.objects.filter(customer=request.user).order_by("-created_at")
    return Response([{"id": r.id, "status": r.status, "pickup_point": r.pickup_point} for r in reqs])


@api_view(["POST"])
def accept(request, pk):
    try:
        obj = services.accept(pk, request.user)
    except services.ConflictLost:
        return Response({"detail": "Already taken by another helper."}, status=409)
    return Response({"id": obj.id, "status": obj.status})


@api_view(["POST"])
def release(request, pk):
    try:
        obj = services.release(pk, request.user)
    except services.IllegalTransition as e:
        return Response({"detail": str(e)}, status=400)
    return Response({"id": obj.id, "status": obj.status})
