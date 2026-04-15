from django.contrib import admin
from .models import Event, EventRegistration


@admin.register(Event)
class EventAdmin(admin.ModelAdmin):
    list_display = ('title', 'club', 'date', 'capacity', 'is_active')
    list_filter = ('club', 'is_active')
    search_fields = ('title', 'club__name')


@admin.register(EventRegistration)
class EventRegistrationAdmin(admin.ModelAdmin):
    list_display = ('student', 'event', 'created_at')
    search_fields = ('student__username', 'event__title')