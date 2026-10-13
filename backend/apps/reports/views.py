from rest_framework.decorators import api_view
from rest_framework.response import Response

from apps.orders.models import Request

from .models import Report


def _serialize(r):
    return {
        "id": r.id,
        "orderReference": r.order_id,
        "issueType": r.issue_type,
        "details": r.details,
        "photoUrl": r.photo_url,
        "priority": r.priority,
        "status": r.status,
        "createdAt": r.created_at.isoformat(),
    }


@api_view(["POST"])
def file_report(request):
    order = Request.objects.filter(pk=request.data.get("orderId")).first()
    if not order:
        return Response({"detail": "Order not found."}, status=404)
    if request.user.id not in (order.customer_id, order.helper_id):
        return Response({"detail": "Only the customer or assigned helper can report an order."}, status=403)
    issue_type = request.data.get("issueType")
    details = (request.data.get("details") or "").strip()
    if issue_type not in Report.IssueType.values:
        return Response({"detail": "Invalid issueType."}, status=400)
    if not details:
        return Response({"detail": "details are required."}, status=400)
    role = "customer" if request.user.id == order.customer_id else "helper"
    report = Report.objects.create(
        order=order, reporter=request.user, reporter_role=role,
        issue_type=issue_type, details=details,
        photo_url=request.data.get("photoUrl", ""),
        priority=request.data.get("priority") if request.data.get("priority") in Report.Priority.values else Report.Priority.MEDIUM,
    )
    return Response(_serialize(report), status=201)


@api_view(["GET"])
def my_reports(request):
    qs = Report.objects.filter(reporter=request.user)
    return Response({"reports": [_serialize(r) for r in qs]})
