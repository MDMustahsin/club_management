from django.urls import path
from .views import (
    ApplyMembershipView,
    MyMembershipsView,
    PendingMembershipsView,
    AllMembershipsView,
    UpdateMembershipStatusView,
    CancelMembershipView,
    ClubMembersView,
)

urlpatterns = [
    path('apply/', ApplyMembershipView.as_view(), name='membership-apply'),
    path('my/', MyMembershipsView.as_view(), name='my-memberships'),
    path('pending/', PendingMembershipsView.as_view(), name='pending-memberships'),
    path('all/', AllMembershipsView.as_view(), name='all-memberships'),
    path('<int:pk>/status/', UpdateMembershipStatusView.as_view(), name='membership-status'),
    path('<int:pk>/cancel/', CancelMembershipView.as_view(), name='membership-cancel'),
    path('club/<int:club_id>/members/', ClubMembersView.as_view(), name='club-members'),
]