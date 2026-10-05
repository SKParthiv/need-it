from rest_framework.decorators import api_view
from rest_framework.response import Response

# TODO: list messages (polling), post text+photo, read-only after completion.
@api_view(["GET"])
def messages(request, order_id):
    return Response([])
