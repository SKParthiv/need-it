from django.urls import path
from . import views
urlpatterns = [
    path("feed/", views.feed, name="feed"),
    path("requests/", views.my_requests, name="my-requests"),
    path("requests/create/", views.create_request, name="create-request"),
    path("requests/<int:pk>/", views.get_request, name="get-request"),
    path("requests/<int:pk>/accept/", views.accept, name="accept"),
    path("requests/<int:pk>/mark-purchased/", views.mark_purchased, name="mark-purchased"),
    path("requests/<int:pk>/release/", views.release, name="release"),
    path("requests/<int:pk>/cancel/", views.cancel, name="cancel"),
    path("requests/<int:pk>/items/<int:item_id>/propose-price/", views.propose_price),
    path("requests/<int:pk>/approve-price/", views.approve_price),
    path("requests/<int:pk>/items/<int:item_id>/unavailable/", views.mark_unavailable),
    path("requests/<int:pk>/items/<int:item_id>/replacement/", views.propose_replacement),
    path("requests/<int:pk>/items/<int:item_id>/approve-replacement/", views.approve_replacement),
    path("requests/<int:pk>/confirm-handover/", views.confirm_handover),
]
