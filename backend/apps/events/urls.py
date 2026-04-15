from django.urls import path
from .views import (
    EventListView,
    EventCreateView,
    RegisterEventView,
    MyEventsView
)

urlpatterns = [
    path('', EventListView.as_view()),
    path('create/', EventCreateView.as_view()),
    path('register/', RegisterEventView.as_view()),
    path('my/', MyEventsView.as_view()),
]