from rest_framework import serializers
from api.base_serializers import BaseSerializer
from .models import Event, EventRegistration
from apps.clubs.serializers import ClubSerializer


class EventSerializer(BaseSerializer):
    club = ClubSerializer(read_only=True)

    class Meta:
        model = Event
        fields = '__all__'


class EventCreateSerializer(BaseSerializer):
    class Meta:
        model = Event
        fields = (
            'id', 'club', 'title', 'description',
            'date', 'location', 'capacity', 'created_by'
        )
        read_only_fields = ('id', 'created_by')

    def validate_club(self, value):
        """Validate club is active"""
        if not value.is_active:
            raise serializers.ValidationError(
                'Cannot create event for inactive club'
            )
        return value

    def validate(self, data):
        capacity = data.get('capacity')
        if capacity is None:
            raise serializers.ValidationError(
                {'capacity': 'Capacity is required.'}
            )
        if capacity <= 0:
            raise serializers.ValidationError(
                {'capacity': 'Capacity must be greater than 0.'}
            )
        return data

    def validate_date(self, value):
        from django.utils import timezone

        if value <= timezone.now():
            raise serializers.ValidationError(
                'Event date must be in the future.'
            )
        return value

    def create(self, validated_data):
        """Set created_by to current user"""
        request = self.context.get('request')
        if request and request.user:
            validated_data['created_by'] = request.user
        return super().create(validated_data)


class EventRegisterSerializer(BaseSerializer):
    class Meta:
        model = EventRegistration
        fields = ('id', 'event')

    def validate(self, data):
        user = self.get_requesting_user()
        event = data.get('event')

        if event.is_full():
            raise serializers.ValidationError(
                'This event is full.'
            )

        already_registered = EventRegistration.objects.filter(
            student=user,
            event=event
        ).exists()

        if already_registered:
            raise serializers.ValidationError(
                'You are already registered.'
            )

        return data

    def create(self, validated_data):
        user = self.get_requesting_user()
        return EventRegistration.objects.create(
            student=user,
            **validated_data
        )