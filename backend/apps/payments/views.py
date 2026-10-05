from rest_framework.decorators import api_view
from rest_framework.response import Response
from .models import Payment


@api_view(["GET"])
def payment_status(request, order_id):
    p = Payment.objects.filter(request_id=order_id).first()
    if not p:
        return Response({"status": "none"})
    return Response({"status": p.status, "item_cost": p.item_cost,
                     "helper_fee": p.helper_fee, "total": p.total})
