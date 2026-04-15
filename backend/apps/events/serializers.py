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
            'date', 'location', 'capacity'
        )

    def validate(self, data):
        if data['capacity'] <= 0:
            raise serializers.ValidationError(
                'Capacity must be greater than 0'
            )
        return data


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