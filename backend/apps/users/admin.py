from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import CustomUser


@admin.register(CustomUser)
class CustomUserAdmin(UserAdmin):
    """
    OOP Principle: Inheritance
    Inherits from UserAdmin and overrides specific behaviors
    """
    model = CustomUser

    list_display = (
        'username', 'email', 'role',
        'is_staff', 'is_active', 'created_at'
    )
    list_filter = ('role', 'is_staff', 'is_active')
    search_fields = ('email', 'username')
    ordering = ('-created_at',)

    fieldsets = (
        (None, {'fields': ('email', 'username', 'password')}),
        ('Personal Info', {'fields': ('phone_number',)}),
        ('Role & Permissions', {
            'fields': (
                'role', 'is_staff',
                'is_active', 'is_superuser'
            )
        }),
    )

    add_fieldsets = (
        (None, {
            'classes': ('wide',),
            'fields': (
                'email', 'username', 'password1', 'password2',
                'role', 'is_staff', 'is_active'
            ),
        }),
    )