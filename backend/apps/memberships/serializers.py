from rest_framework import serializers
from api.base_serializers import BaseSerializer
from apps.users.serializers import UserSerializer
from apps.clubs.serializers import ClubSerializer
from .models import Membership


class MembershipSerializer(BaseSerializer):
    """
    OOP Principle: Inheritance
    Read-only serializer with nested data
    """
    student = UserSerializer(read_only=True)
    club = ClubSerializer(read_only=True)
    status_display = serializers.SerializerMethodField()

    class Meta:
        model = Membership
        fields = (
            'id', 'student', 'club', 'status',
            'status_display', 'rejection_reason',
            'created_at', 'updated_at'
        )
        read_only_fields = fields

    def get_status_display(self, obj):
        """Encapsulated display logic using model methods"""
        if obj.is_approved():
            return '✅ Approved'
        elif obj.is_rejected():
            return '❌ Rejected'
        return '⏳ Pending'


class MembershipApplySerializer(BaseSerializer):
    """
    OOP Principle: Inheritance + Encapsulation
    Handles membership application with full validation
    """
    class Meta:
        model = Membership
        fields = ('id', 'club', 'status', 'created_at')
        read_only_fields = ('id', 'status', 'created_at')

    def validate_club(self, club):
        """
        Encapsulated club validation
        Checks active status and capacity
        """
        if not club.is_active:
            raise serializers.ValidationError(
                'This club is not currently active.'
            )
        if club.is_full():
            raise serializers.ValidationError(
                f'This club has reached its maximum '
                f'capacity of {club.max_members} members.'
            )
        return club

    def validate(self, data):
        """
        Encapsulated cross-field validation
        Checks for duplicate applications
        """
        user = self.get_requesting_user()
        club = data.get('club')

        already_applied = Membership.objects.filter(
            student=user,
            club=club
        ).exists()

        if already_applied:
            raise serializers.ValidationError(
                'You have already applied to this club.'
            )
        return data

    def create(self, validated_data):
        """Encapsulated creation — auto sets student"""
        user = self.get_requesting_user()
        return Membership.objects.create(
            student=user,
            **validated_data
        )


class MembershipStatusSerializer(BaseSerializer):
    """
    OOP Principle: Inheritance + Encapsulation
    Admin serializer for approving or rejecting
    Uses model's encapsulated state transition methods
    """
    class Meta:
        model = Membership
        fields = ('id', 'status', 'rejection_reason')

    def validate_status(self, value):
        """Encapsulated status validation"""
        allowed = ('APPROVED', 'REJECTED')
        if value not in allowed:
            raise serializers.ValidationError(
                f'Status must be one of: {", ".join(allowed)}'
            )
        return value

    def validate(self, data):
        """Encapsulated business rule validation"""
        if not self.instance.is_pending():
            raise serializers.ValidationError(
                'Only pending applications can be updated.'
            )
        if data.get('status') == 'REJECTED':
            if not data.get('rejection_reason'):
                raise serializers.ValidationError(
                    {'rejection_reason': 'Please provide a reason for rejection.'}
                )
        return data

    def update(self, instance, validated_data):
        """
        OOP: Uses model's encapsulated state transition methods
        instead of directly setting status field
        """
        new_status = validated_data.get('status')
        reason = validated_data.get('rejection_reason')

        if new_status == 'APPROVED':
            instance.approve()
        elif new_status == 'REJECTED':
            instance.reject(reason=reason)

        return instance