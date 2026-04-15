from rest_framework import serializers
from api.base_serializers import BaseSerializer
from apps.users.serializers import UserSerializer
from .models import Club


class ClubSerializer(BaseSerializer):
    """
    OOP Principle: Inheritance + Encapsulation
    Inherits BaseSerializer — read view with computed fields
    """
    admin = UserSerializer(read_only=True)
    member_count = serializers.SerializerMethodField()
    pending_count = serializers.SerializerMethodField()
    is_full = serializers.SerializerMethodField()
    upcoming_events_count = serializers.SerializerMethodField()
    total_donations = serializers.SerializerMethodField()

    class Meta:
        model = Club
        fields = (
            'id', 'name', 'description', 'admin',
            'is_active', 'max_members', 'profile_image',
            'member_count', 'pending_count', 'is_full',
            'upcoming_events_count', 'total_donations',
            'created_at', 'updated_at'
        )
        read_only_fields = ('id', 'created_at', 'updated_at')

    def get_member_count(self, obj):
        """Calls encapsulated model method"""
        return obj.get_member_count()

    def get_pending_count(self, obj):
        """Calls encapsulated model method"""
        return obj.get_pending_count()

    def get_is_full(self, obj):
        """Calls encapsulated model method"""
        return obj.is_full()

    def get_upcoming_events_count(self, obj):
        """Calls encapsulated model method"""
        return obj.get_upcoming_events().count()

    def get_total_donations(self, obj):
        """Calls encapsulated model method"""
        return str(obj.get_total_donations())


class ClubCreateSerializer(BaseSerializer):
    """
    OOP Principle: Inheritance + Encapsulation
    Inherits BaseSerializer — handles create and update
    """
    class Meta:
        model = Club
        fields = (
            'id', 'name', 'description',
            'max_members', 'profile_image'
        )
        read_only_fields = ('id',)

    def validate_name(self, value):
        """Encapsulated name validation"""
        if Club.objects.filter(name__iexact=value).exists():
            raise serializers.ValidationError(
                'A club with this name already exists.'
            )
        return value

    def validate_max_members(self, value):
        """Encapsulated max members validation"""
        if value < 5:
            raise serializers.ValidationError(
                'A club must allow at least 5 members.'
            )
        if value > 500:
            raise serializers.ValidationError(
                'A club cannot have more than 500 members.'
            )
        return value

    def create(self, validated_data):
        """Encapsulated creation — auto assigns admin"""
        request = self.context.get('request')
        club = Club.objects.create(
            admin=request.user,
            **validated_data
        )
        return club


class ClubUpdateSerializer(BaseSerializer):
    """
    OOP Principle: Inheritance
    Separate serializer for updates — allows partial changes
    """
    class Meta:
        model = Club
        fields = (
            'name', 'description',
            'max_members', 'profile_image'
        )

    def validate_name(self, value):
        """Encapsulated validation — excludes current club"""
        if Club.objects.filter(
            name__iexact=value
        ).exclude(id=self.instance.id).exists():
            raise serializers.ValidationError(
                'A club with this name already exists.'
            )
        return value