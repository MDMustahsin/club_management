from django.db import models
from django.conf import settings
from api.base_models import TimeStampedModel
from apps.clubs.models import Club


class Event(TimeStampedModel):
    """
    OOP Principles:
    - Inheritance: extends TimeStampedModel
    - Encapsulation: event logic inside model
    - Abstraction: hides capacity & status logic
    """

    club = models.ForeignKey(
        Club,
        on_delete=models.CASCADE,
        related_name='events'
    )

    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='created_events'
    )

    title = models.CharField(max_length=255)
    description = models.TextField()

    date = models.DateTimeField()
    location = models.CharField(max_length=255)

    capacity = models.PositiveIntegerField()
    is_active = models.BooleanField(default=True)

    class Meta:
        db_table = 'events'
        ordering = ['date']

    def __str__(self):
        return f"{self.title} → {self.club.name}"

    # ── Encapsulated logic methods ──

    def is_full(self):
        """Check if event reached capacity"""
        return self.registrations.count() >= self.capacity

    def has_started(self):
        """Check if event already started"""
        from django.utils import timezone
        return timezone.now() >= self.date

    def can_register(self):
        """
        Encapsulated rule:
        Only active + not full + not started
        """
        return (
            self.is_active and
            not self.is_full() and
            not self.has_started()
        )

class EventRegistration(TimeStampedModel):
    """
    OOP Principles:
    - Encapsulation: registration rules inside model
    - Abstraction: hides validation logic
    """

    student = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='event_registrations'
    )

    event = models.ForeignKey(
        Event,
        on_delete=models.CASCADE,
        related_name='registrations'
    )

    class Meta:
        db_table = 'event_registrations'
        unique_together = ('student', 'event')
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.student.username} → {self.event.title}"

    # ── Encapsulated validation methods ──

    def can_cancel(self):
        """Only allow cancel before event starts"""
        return not self.event.has_started()

    # ── Encapsulated state actions ──

    def cancel(self):
        """
        Encapsulated cancellation logic
        """
        if not self.can_cancel():
            raise ValueError('Cannot cancel after event has started.')
        self.delete()