from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from rest_framework.views import APIView
from .models import Club
from .serializers import (
    ClubSerializer,
    ClubCreateSerializer,
    ClubUpdateSerializer
)
from api.permissions.base_permissions import IsAdminRole, IsAdminOrReadOnly


class ClubListView(generics.ListAPIView):
    """
    OOP Principle: Inheritance
    GET /api/clubs/ — public access
    """
    serializer_class = ClubSerializer
    permission_classes = [AllowAny]

    def get_queryset(self):
        """
        OOP: Overrides parent get_queryset()
        Adds filtering capability
        """
        queryset = Club.objects.filter(is_active=True)
        search = self.request.query_params.get('search')
        if search:
            queryset = queryset.filter(
                name__icontains=search
            )
        return queryset


class ClubDetailView(generics.RetrieveAPIView):
    """
    OOP Principle: Inheritance
    GET /api/clubs/<id>/ — public access
    """
    queryset = Club.objects.filter(is_active=True)
    serializer_class = ClubSerializer
    permission_classes = [AllowAny]


class ClubCreateView(generics.CreateAPIView):
    """
    OOP Principle: Inheritance + Polymorphism
    POST /api/clubs/create/ — admin only
    """
    queryset = Club.objects.all()
    serializer_class = ClubCreateSerializer
    permission_classes = [IsAdminRole]

    def get_serializer_context(self):
        """OOP: Overrides parent to pass request to serializer"""
        return {'request': self.request}

    def create(self, request, *args, **kwargs):
        """OOP: Overrides parent create() for custom response"""
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        club = serializer.save()
        return Response({
            'message': f'Club "{club.name}" created successfully.',
            'club': ClubSerializer(
                club,
                context={'request': request}
            ).data
        }, status=status.HTTP_201_CREATED)


class ClubUpdateView(generics.UpdateAPIView):
    """
    OOP Principle: Inheritance + Polymorphism
    PATCH /api/clubs/<id>/update/ — admin only
    """
    queryset = Club.objects.filter(is_active=True)
    serializer_class = ClubUpdateSerializer
    permission_classes = [IsAdminRole]
    http_method_names = ['patch']

    def update(self, request, *args, **kwargs):
        """OOP: Overrides parent update() for custom response"""
        partial = kwargs.pop('partial', True)
        instance = self.get_object()
        serializer = self.get_serializer(
            instance,
            data=request.data,
            partial=partial
        )
        serializer.is_valid(raise_exception=True)
        club = serializer.save()
        return Response({
            'message': f'Club "{club.name}" updated successfully.',
            'club': ClubSerializer(club).data
        })


class ClubDeleteView(generics.DestroyAPIView):
    """
    OOP Principle: Inheritance + Polymorphism
    DELETE /api/clubs/<id>/delete/ — admin only
    Uses soft delete from BaseModel
    """
    queryset = Club.objects.filter(is_active=True)
    permission_classes = [IsAdminRole]

    def destroy(self, request, *args, **kwargs):
        """
        OOP: Overrides destroy() to use
        BaseModel's soft_delete() method
        """
        club = self.get_object()
        club.soft_delete()
        return Response({
            'message': f'Club "{club.name}" has been deactivated.'
        }, status=status.HTTP_200_OK)


class ClubRestoreView(generics.UpdateAPIView):
    """
    OOP Principle: Inheritance
    PATCH /api/clubs/<id>/restore/ — admin only
    Uses restore() from BaseModel
    """
    queryset = Club.objects.filter(is_active=False)
    permission_classes = [IsAdminRole]
    http_method_names = ['patch']

    def patch(self, request, *args, **kwargs):
        """OOP: Uses BaseModel's restore() method"""
        club = self.get_object()
        club.restore()
        return Response({
            'message': f'Club "{club.name}" has been restored.',
            'club': ClubSerializer(club).data
        })


class PromoteToClubAdminView(APIView):
    """
    OOP Principle: Encapsulation
    POST /api/clubs/<club_id>/promote/ — admin only
    Promotes an approved member to be club admin
    """
    permission_classes = [IsAdminRole]

    def post(self, request, club_id):
        user_id = request.data.get('user_id')
        
        if not user_id:
            return Response(
                {'error': 'User ID is required'},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            club = Club.objects.get(id=club_id)
        except Club.DoesNotExist:
            return Response(
                {'error': 'Club not found'},
                status=status.HTTP_404_NOT_FOUND
            )

        try:
            from apps.memberships.models import Membership
            membership = Membership.objects.get(
                club=club,
                student_id=user_id,
                status='APPROVED'
            )
        except Membership.DoesNotExist:
            return Response(
                {'error': 'User is not an approved member of this club'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Update the club's admin
        club.admin = membership.student
        club.save()

        # Update user's role to CLUB_ADMIN if not already
        user = membership.student
        if user.role != 'ADMIN':
            user.role = 'CLUB_ADMIN'
            user.save()

        return Response({
            'message': f'{user.username} is now the admin of {club.name}',
            'club': ClubSerializer(club).data
        })
