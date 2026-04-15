from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from .models import Membership
from .serializers import (
    MembershipSerializer,
    MembershipApplySerializer,
    MembershipStatusSerializer
)
from api.permissions.base_permissions import (
    IsAdminRole,
    IsMemberOrAdmin,
    IsOwnerOrAdmin
)


class ApplyMembershipView(generics.CreateAPIView):
    """
    OOP Principle: Inheritance + Polymorphism
    POST /api/memberships/apply/
    Students apply to join a club
    """
    serializer_class = MembershipApplySerializer
    permission_classes = [IsMemberOrAdmin]

    def get_serializer_context(self):
        """OOP: Overrides parent to pass request"""
        return {'request': self.request}

    def create(self, request, *args, **kwargs):
        """OOP: Overrides parent for custom response"""
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        membership = serializer.save()
        return Response({
            'message': f'Application to "{membership.club.name}" submitted.',
            'membership': MembershipSerializer(membership).data
        }, status=status.HTTP_201_CREATED)


class MyMembershipsView(generics.ListAPIView):
    """
    OOP Principle: Inheritance + Encapsulation
    GET /api/memberships/my/
    Students see only their own applications
    """
    serializer_class = MembershipSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        """OOP: Overrides parent — filters by logged-in user"""
        return Membership.objects.filter(
            student=self.request.user
        )


class PendingMembershipsView(generics.ListAPIView):
    """
    OOP Principle: Inheritance
    GET /api/memberships/pending/
    Admin sees all pending applications
    """
    serializer_class = MembershipSerializer
    permission_classes = [IsAdminRole]

    def get_queryset(self):
        """OOP: Overrides parent — filters by status"""
        queryset = Membership.objects.filter(status='PENDING')
        club_id = self.request.query_params.get('club')
        if club_id:
            queryset = queryset.filter(club_id=club_id)
        return queryset


class AllMembershipsView(generics.ListAPIView):
    """
    OOP Principle: Inheritance
    GET /api/memberships/all/
    Admin sees all memberships with filters
    """
    serializer_class = MembershipSerializer
    permission_classes = [IsAdminRole]

    def get_queryset(self):
        """OOP: Overrides parent — supports multiple filters"""
        queryset = Membership.objects.all()
        club_id = self.request.query_params.get('club')
        status_filter = self.request.query_params.get('status')
        if club_id:
            queryset = queryset.filter(club_id=club_id)
        if status_filter:
            queryset = queryset.filter(status=status_filter)
        return queryset


class UpdateMembershipStatusView(generics.UpdateAPIView):
    """
    OOP Principle: Inheritance + Polymorphism
    PATCH /api/memberships/<id>/status/
    Admin approves or rejects using model's state methods
    """
    queryset = Membership.objects.all()
    serializer_class = MembershipStatusSerializer
    permission_classes = [IsAdminRole]
    http_method_names = ['patch']

    def update(self, request, *args, **kwargs):
        """OOP: Overrides parent for custom response"""
        instance = self.get_object()
        serializer = self.get_serializer(
            instance,
            data=request.data,
            partial=True
        )
        serializer.is_valid(raise_exception=True)
        membership = serializer.save()
        return Response({
            'message': f'Membership status updated to {membership.status}.',
            'membership': MembershipSerializer(membership).data
        })


class CancelMembershipView(generics.DestroyAPIView):
    """
    OOP Principle: Inheritance + Polymorphism
    DELETE /api/memberships/<id>/cancel/
    Student cancels their own pending application
    """
    permission_classes = [IsAuthenticated, IsOwnerOrAdmin]

    def get_queryset(self):
        """OOP: Overrides parent — only own pending memberships"""
        return Membership.objects.filter(
            student=self.request.user,
            status='PENDING'
        )

    def destroy(self, request, *args, **kwargs):
        """
        OOP: Overrides parent destroy()
        Uses model's encapsulated cancel() method
        """
        membership = self.get_object()
        club_name = membership.club.name
        try:
            membership.cancel()
            return Response({
                'message': f'Application to "{club_name}" cancelled.'
            }, status=status.HTTP_200_OK)
        except ValueError as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )


class ClubMembersView(generics.ListAPIView):
    """
    OOP Principle: Inheritance
    GET /api/memberships/club/<club_id>/members/
    View approved members of a specific club
    """
    serializer_class = MembershipSerializer
    permission_classes = [IsAdminRole]

    def get_queryset(self):
        """OOP: Overrides parent — filters by club and status"""
        club_id = self.kwargs.get('club_id')
        return Membership.objects.filter(
            club_id=club_id,
            status='APPROVED'
        )