from rest_framework.decorators import api_view
from rest_framework.response import Response
from django.utils.dateparse import parse_date

from .models import AvailabilityWindow


def _serialize(w):
    return {
        "id": w.id,
        "date": w.date.isoformat(),
        "timeWindow": w.time_window,
        "status": w.status,
    }


@api_view(["GET"])
def list_windows(request):
    qs = AvailabilityWindow.objects.filter(helper=request.user)
    return Response({"windows": [_serialize(w) for w in qs]})


@api_view(["POST"])
def add_window(request):
    if request.user.role != "helper":
        return Response({"detail": "Only helpers can set availability."}, status=403)
    date = request.data.get("date")
    time_window = (request.data.get("timeWindow") or "").strip()
    if not date or not time_window:
        return Response({"detail": "date and timeWindow are required."}, status=400)
    parsed_date = parse_date(str(date))
    if parsed_date is None:
        return Response({"detail": "date must be YYYY-MM-DD."}, status=400)
    window = AvailabilityWindow.objects.create(
        helper=request.user, date=parsed_date, time_window=time_window,
    )
    return Response(_serialize(window), status=201)


@api_view(["DELETE"])
def delete_window(request, pk):
    deleted, _ = AvailabilityWindow.objects.filter(pk=pk, helper=request.user).delete()
    if not deleted:
        return Response({"detail": "Window not found."}, status=404)
    return Response(status=204)
