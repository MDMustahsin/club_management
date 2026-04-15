from django.contrib import admin
from .models import Membership


@admin.register(Membership)
class MembershipAdmin(admin.ModelAdmin):
    """
    OOP Principle: Inheritance
    Inherits ModelAdmin — customizes membership display
    """
    list_display = (
        'student', 'club', 'status',
        'created_at', 'updated_at'
    )
    list_filter = ('status', 'club')
    search_fields = (
        'student__username',
        'student__email',
        'club__name'
    )
    ordering = ('-created_at',)
    readonly_fields = ('created_at', 'updated_at')

    fieldsets = (
        (None, {
            'fields': ('student', 'club', 'status')
        }),
        ('Details', {
            'fields': ('rejection_reason',)
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )

    actions = ['approve_memberships', 'reject_memberships']

    def approve_memberships(self, request, queryset):
        """
        OOP: Uses model's encapsulated approve() method
        Bulk approve from admin panel
        """
        approved_count = 0
        for membership in queryset.filter(status='PENDING'):
            try:
                membership.approve()
                approved_count += 1
            except ValueError:
                pass
        self.message_user(
            request,
            f'{approved_count} membership(s) approved.'
        )
    approve_memberships.short_description = 'Approve selected memberships'

    def reject_memberships(self, request, queryset):
        """
        OOP: Uses model's encapsulated reject() method
        Bulk reject from admin panel
        """
        rejected_count = 0
        for membership in queryset.filter(status='PENDING'):
            try:
                membership.reject(reason='Rejected by admin.')
                rejected_count += 1
            except ValueError:
                pass
        self.message_user(
            request,
            f'{rejected_count} membership(s) rejected.'
        )
    reject_memberships.short_description = 'Reject selected memberships'