from django.urls import path
from . import views
urlpatterns = [
    path("feed/", views.feed, name="feed"),
    path("requests/", views.my_requests, name="my-requests"),
    path("requests/<int:pk>/accept/", views.accept, name="accept"),
    path("requests/<int:pk>/release/", views.release, name="release"),
]
