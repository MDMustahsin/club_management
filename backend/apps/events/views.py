from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from .models import Event, EventRegistration
from .serializers import (
    EventSerializer,
    EventCreateSerializer,
    EventRegisterSerializer
)
from api.permissions.base_permissions import IsAdminRole


class EventListView(generics.ListAPIView):
    queryset = Event.objects.filter(is_active=True)
    serializer_class = EventSerializer


class EventCreateView(generics.CreateAPIView):
    serializer_class = EventCreateSerializer
    permission_classes = [IsAdminRole]


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