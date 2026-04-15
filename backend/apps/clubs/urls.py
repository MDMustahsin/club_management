from django.urls import path
from .views import (
    ClubListView,
    ClubDetailView,
    ClubCreateView,
    ClubUpdateView,
    ClubDeleteView,
    ClubRestoreView,
    PromoteToClubAdminView,
)

urlpatterns = [
    path('', ClubListView.as_view(), name='club-list'),
    path('<int:pk>/', ClubDetailView.as_view(), name='club-detail'),
    path('create/', ClubCreateView.as_view(), name='club-create'),
    path('<int:pk>/update/', ClubUpdateView.as_view(), name='club-update'),
    path('<int:pk>/delete/', ClubDeleteView.as_view(), name='club-delete'),
    path('<int:pk>/restore/', ClubRestoreView.as_view(), name='club-restore'),
    path('<int:club_id>/promote/', PromoteToClubAdminView.as_view(), name='club-promote'),
]
