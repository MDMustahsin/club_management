from django.contrib import admin
from .models import Club


@admin.register(Club)
class ClubAdmin(admin.ModelAdmin):
    """
    OOP Principle: Inheritance
    Inherits ModelAdmin and overrides display behavior
    """
    list_display = (
        'name', 'admin', 'get_member_count',
        'is_active', 'max_members', 'created_at'
    )
    list_filter = ('is_active',)
    search_fields = ('name', 'description')
    ordering = ('name',)
    readonly_fields = ('created_at', 'updated_at')

    fieldsets = (
        (None, {
            'fields': ('name', 'description', 'profile_image')
        }),
        ('Settings', {
            'fields': ('admin', 'is_active', 'max_members')
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )

    def get_member_count(self, obj):
        """Uses encapsulated model method"""
        return obj.get_member_count()
    get_member_count.short_description = 'Members'