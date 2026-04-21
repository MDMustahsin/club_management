from rest_framework import serializers
from api.base_serializers import BaseSerializer
from apps.clubs.serializers import ClubSerializer
from apps.users.serializers import UserSerializer
from .models import Donation


class DonationSerializer(BaseSerializer):
    """
    OOP: Read-only serializer with nested data
    """

    donor = UserSerializer(read_only=True, allow_null=True)
    club = ClubSerializer(read_only=True)
    status_display = serializers.SerializerMethodField()

    class Meta:
        model = Donation
        fields = (
            'id', 'donor', 'guest_name', 'guest_email', 'club', 'amount',
            'status', 'status_display',
            'transaction_id', 'message',
            'created_at', 'updated_at'
        )
        read_only_fields = fields

    def get_status_display(self, obj):
        if obj.is_completed():
            return '✅ Completed'
        elif obj.is_failed():
            return '❌ Failed'
        elif obj.is_refunded():
            return '↩️ Refunded'
        return '⏳ Pending'


# ─────────────────────────────────────────────

class DonationCreateSerializer(BaseSerializer):
    """
    OOP: Handles donation creation
    """

    class Meta:
        model = Donation
        fields = ('id', 'club', 'amount', 'message', 'guest_name', 'guest_email')
        read_only_fields = ('id',)

    def validate(self, data):
        user = self.get_requesting_user()
        is_authenticated = user and getattr(user, 'is_authenticated', False)
        
        if not is_authenticated:
            # For guests, require name and email
            if not data.get('guest_name'):
                raise serializers.ValidationError({'guest_name': 'Name is required for guest donations.'})
            if not data.get('guest_email'):
                raise serializers.ValidationError({'guest_email': 'Email is required for guest donations.'})
        
        return data

    def create(self, validated_data):
        import uuid
        user = self.get_requesting_user()
        if not user or not getattr(user, 'is_authenticated', False):
            user = None

        # Generate unique transaction ID
        transaction_id = str(uuid.uuid4())
        
        return Donation.objects.create(
            donor=user,
            transaction_id=transaction_id,
            **validated_data
        )


# ─────────────────────────────────────────────

class DonationStatusSerializer(BaseSerializer):
    """
    OOP: Admin updates donation status
    Uses model methods (IMPORTANT)
    """

    class Meta:
        model = Donation
        fields = ('id', 'status', 'transaction_id')

    def validate_status(self, value):
        allowed = ('COMPLETED', 'FAILED')
        if value not in allowed:
            raise serializers.ValidationError(
                f'Status must be one of: {", ".join(allowed)}'
            )
        return value

    def validate(self, data):
        if not self.instance.is_pending():
            raise serializers.ValidationError(
                'Only pending donations can be updated.'
            )
        return data

    def update(self, instance, validated_data):
        status_value = validated_data.get('status')
        transaction_id = validated_data.get('transaction_id')

        if status_value == 'COMPLETED':
            instance.mark_completed(transaction_id=transaction_id)
        elif status_value == 'FAILED':
            instance.mark_failed()

        return instance