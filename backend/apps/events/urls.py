from django.urls import path
from .views import (
    EventListView,
    EventDetailView,
    EventCreateView,
    EventUpdateView,
    EventDeleteView,
    RegisterEventView,
    MyEventsView
)

urlpatterns = [
    path('', EventListView.as_view()),
    path('<int:pk>/', EventDetailView.as_view()),
    path('create/', EventCreateView.as_view()),
    path('<int:pk>/update/', EventUpdateView.as_view()),
    path('<int:pk>/delete/', EventDeleteView.as_view()),
    path('register/', RegisterEventView.as_view()),
    path('my/', MyEventsView.as_view()),
]