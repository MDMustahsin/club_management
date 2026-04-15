from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.views import APIView
from .models import Event, EventRegistration
from .serializers import (
    EventSerializer,
    EventCreateSerializer,
    EventRegisterSerializer
)
from api.permissions.base_permissions import IsAdminRole, IsAdminOrClubAdmin


class EventListView(generics.ListAPIView):
    queryset = Event.objects.filter(is_active=True)
    serializer_class = EventSerializer


class EventDetailView(generics.RetrieveAPIView):
    queryset = Event.objects.filter(is_active=True)
    serializer_class = EventSerializer


class EventCreateView(generics.CreateAPIView):
    serializer_class = EventCreateSerializer
    permission_classes = [IsAdminOrClubAdmin]

    def get_serializer_context(self):
        context = super().get_serializer_context()
        context['request'] = self.request
        return context

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        if request.user.role == 'CLUB_ADMIN':
            club = serializer.validated_data.get('club')
            if club.admin != request.user:
                return Response(
                    {'error': 'You can only create events for clubs you admin.'},
                    status=status.HTTP_403_FORBIDDEN
                )
        
        event = serializer.save()
        return Response({
            'message': f'Event "{event.title}" created successfully.',
            'event': EventSerializer(event).data
        }, status=status.HTTP_201_CREATED)


class EventUpdateView(generics.UpdateAPIView):
    queryset = Event.objects.filter(is_active=True)
    serializer_class = EventCreateSerializer
    permission_classes = [IsAdminOrClubAdmin]
    http_method_names = ['patch']

    def get_serializer_context(self):
        context = super().get_serializer_context()
        context['request'] = self.request
        return context

    def update(self, request, *args, **kwargs):
        instance = self.get_object()
        
        if request.user.role == 'CLUB_ADMIN':
            if instance.club.admin != request.user:
                return Response(
                    {'error': 'You can only update events for your club.'},
                    status=status.HTTP_403_FORBIDDEN
                )
        
        serializer = self.get_serializer(instance, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        event = serializer.save()
        return Response({
            'message': f'Event "{event.title}" updated successfully.',
            'event': EventSerializer(event).data
        })


class EventDeleteView(generics.DestroyAPIView):
    queryset = Event.objects.filter(is_active=True)
    permission_classes = [IsAdminOrClubAdmin]

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        
        if request.user.role == 'CLUB_ADMIN':
            if instance.club.admin != request.user:
                return Response(
                    {'error': 'You can only delete events for your club.'},
                    status=status.HTTP_403_FORBIDDEN
                )
        
        instance.soft_delete()
        return Response({
            'message': f'Event "{instance.title}" has been deleted.'
        }, status=status.HTTP_200_OK)


class RegisterEventView(generics.CreateAPIView):
    serializer_class = EventRegisterSerializer
    permission_classes = [IsAuthenticated]

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        registration = serializer.save()

        return Response({
            'message': f'Registered for {registration.event.title}'
        }, status=status.HTTP_201_CREATED)


class MyEventsView(generics.ListAPIView):
    serializer_class = EventSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Event.objects.filter(
            registrations__student=self.request.user
        )