from django.contrib import admin
from .models import Donation


@admin.register(Donation)
class DonationAdmin(admin.ModelAdmin):

    list_display = (
        'donor', 'club', 'amount',
        'status', 'created_at'
    )

    list_filter = ('status', 'club')

    search_fields = (
        'donor__username',
        'club__name',
        'transaction_id'
    )

    readonly_fields = ('created_at', 'updated_at')

    actions = ['mark_as_completed', 'mark_as_failed']

    def mark_as_completed(self, request, queryset):
        count = 0
        for donation in queryset.filter(status='PENDING'):
            try:
                donation.mark_completed(transaction_id='ADMIN')
                count += 1
            except ValueError:
                pass

        self.message_user(request, f'{count} donation(s) marked completed.')

    def mark_as_failed(self, request, queryset):
        count = 0
        for donation in queryset.filter(status='PENDING'):
            try:
                donation.mark_failed()
                count += 1
            except ValueError:
                pass

        self.message_user(request, f'{count} donation(s) marked failed.')