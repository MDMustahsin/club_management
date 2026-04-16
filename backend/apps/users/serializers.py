from rest_framework import serializers
from api.base_serializers import BaseSerializer
from .models import CustomUser


class UserSerializer(BaseSerializer):
    """
    OOP Principle: Inheritance
    Inherits from BaseSerializer for shared validation logic
    Read-only serializer for displaying user data
    """
    class Meta:
        model = CustomUser
        fields = (
            'id', 'email', 'username',
            'role', 'phone_number', 'created_at'
        )
        read_only_fields = fields


class RegisterSerializer(BaseSerializer):
    """
    OOP Principle: Encapsulation
    All registration logic and validation encapsulated here
    """
    password = serializers.CharField(
        write_only=True,
        min_length=8,
        style={'input_type': 'password'}
    )
    confirm_password = serializers.CharField(
        write_only=True,
        style={'input_type': 'password'}
    )

    class Meta:
        model = CustomUser
        fields = (
            'id', 'email', 'username',
            'password', 'confirm_password',
            'phone_number'
        )
        read_only_fields = ('id',)

    def validate_email(self, value):
        """Encapsulated email validation"""
        if CustomUser.objects.filter(email=value).exists():
            raise serializers.ValidationError(
                'A user with this email already exists.'
            )
        return value.lower()

    def validate_username(self, value):
        """Encapsulated username validation"""
        if not value.strip():
            raise serializers.ValidationError('Username cannot be empty.')
        if CustomUser.objects.filter(username__iexact=value).exists():
            raise serializers.ValidationError(
                'A user with this username already exists.'
            )
        return value

    def validate(self, data):
        """Encapsulated cross-field validation"""
        if data.get('password') != data.get('confirm_password'):
            raise serializers.ValidationError(
                {'confirm_password': 'Passwords do not match.'}
            )
        return data

    def create(self, validated_data):
        email = validated_data.get('email')
        username = validated_data.pop('username', email)
        password = validated_data.pop('password')
        validated_data.pop('confirm_password', None)
        validated_data['username'] = username

        user = CustomUser.objects.create_user(
            email=email,
            username=username,
            password=password,
            **validated_data
        )
        return user


class LoginSerializer(BaseSerializer):
    """
    OOP Principle: Encapsulation
    Login credentials validation encapsulated here
    """
    email = serializers.EmailField()
    password = serializers.CharField(
        write_only=True,
        style={'input_type': 'password'}
    )

    class Meta:
        model = CustomUser
        fields = ('email', 'password')

    def validate_email(self, value):
        return value.lower()


class UpdateProfileSerializer(BaseSerializer):
    """
    OOP Principle: Encapsulation
    Profile update logic encapsulated — only allows safe fields
    """
    class Meta:
        model = CustomUser
        fields = ('username', 'phone_number')

    def validate_username(self, value):
        """Encapsulated validation — excludes current user"""
        user = self.get_requesting_user()
        if CustomUser.objects.filter(
            username=value
        ).exclude(id=user.id).exists():
            raise serializers.ValidationError(
                'This username is already taken.'
            )
        return value