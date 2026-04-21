from rest_framework import generics, status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from .models import Donation
from .serializers import (
    DonationSerializer,
    DonationCreateSerializer,
    DonationStatusSerializer
)
from api.permissions.base_permissions import IsAdminRole, IsAdminOrClubAdmin


class CreateDonationView(generics.CreateAPIView):
    """
    POST /api/donations/create/
    """

    serializer_class = DonationCreateSerializer
    permission_classes = [AllowAny]

    def get_serializer_context(self):
        return {'request': self.request}

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        donation = serializer.save()
        
        # Auto-approve donations (no pending status needed)
        donation.status = 'COMPLETED'
        donation.save()

        return Response({
            'message': f'Donation of {donation.amount} completed successfully!',
            'donation': DonationSerializer(donation).data
        }, status=status.HTTP_201_CREATED)


# ─────────────────────────────────────────────

class MyDonationsView(generics.ListAPIView):
    """
    GET /api/donations/my/
    """

    serializer_class = DonationSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Donation.objects.filter(
            donor=self.request.user
        ).select_related('donor', 'club')


# ─────────────────────────────────────────────

class AllDonationsView(generics.ListAPIView):
    """
    Admin or club admin: View donations
    """

    serializer_class = DonationSerializer
    permission_classes = [IsAdminOrClubAdmin]

    def get_queryset(self):
        user = self.request.user
        if user.role == 'ADMIN':
            queryset = Donation.objects.all()
        else:
            queryset = Donation.objects.filter(club__admin=user)

        club_id = self.request.query_params.get('club')
        status_filter = self.request.query_params.get('status')

        if club_id:
            queryset = queryset.filter(club_id=club_id)

        if status_filter:
            queryset = queryset.filter(status=status_filter)

        return queryset.select_related('donor', 'club')


# ─────────────────────────────────────────────

class UpdateDonationStatusView(generics.UpdateAPIView):
    """
    PATCH /api/donations/<id>/status/
    """

    queryset = Donation.objects.all()
    serializer_class = DonationStatusSerializer
    permission_classes = [IsAdminRole]
    http_method_names = ['patch']

    def update(self, request, *args, **kwargs):
        instance = self.get_object()

        serializer = self.get_serializer(
            instance,
            data=request.data,
            partial=True
        )
        serializer.is_valid(raise_exception=True)

        donation = serializer.save()

        return Response({
            'message': f'Donation marked as {donation.status}.',
            'donation': DonationSerializer(donation).data
        })