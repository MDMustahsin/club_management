from rest_framework import serializers


class BaseSerializer(serializers.ModelSerializer):
    """
    Abstract base serializer with shared validation logic.
    OOP Principle: Inheritance + Encapsulation
    """

    def validate_positive_amount(self, value):
        """Reusable amount validation"""
        if value <= 0:
            raise serializers.ValidationError(
                'Amount must be greater than 0.'
            )
        return value

    def get_requesting_user(self):
        """Safely get the requesting user from context"""
        request = self.context.get('request')
        if request and hasattr(request, 'user'):
            return request.user
        return None