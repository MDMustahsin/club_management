from django.db import models
from django.conf import settings
from api.base_models import BaseModel
from django.utils import timezone


class Club(BaseModel):
    """
    OOP Principles:
    - Inheritance: extends BaseModel
    - Encapsulation: business logic methods inside the model
    - Abstraction: hides complex query logic behind simple methods
    """
    name = models.CharField(max_length=200, unique=True)
    description = models.TextField(blank=True)
    admin = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='administered_clubs'
    )
    max_members = models.IntegerField(default=100)
    profile_image = models.URLField(blank=True, null=True)

    class Meta:
        db_table = 'clubs'
        verbose_name = 'Club'
        verbose_name_plural = 'Clubs'
        ordering = ['name']

    def __str__(self):
        return self.name

    # ── Encapsulated business logic methods ──

    def get_member_count(self):
        """Encapsulated query — safe if memberships not set up yet"""
        if not hasattr(self, 'memberships'):
            return 0
        return self.memberships.filter(status='APPROVED').count()

    def get_pending_count(self):
        """Encapsulated query — safe if memberships not set up yet"""
        if not hasattr(self, 'memberships'):
            return 0
        return self.memberships.filter(status='PENDING').count()

    def is_full(self):
        """Encapsulated check — is club at capacity?"""
        return self.get_member_count() >= self.max_members


    def get_upcoming_events(self):
        return self.events.filter(
            date__gte=timezone.now(),
            is_active=True
        )

    def get_total_donations(self):
        return self.donations.filter(
            status='COMPLETED'
        ).aggregate(
            total=models.Sum('amount')
        )['total'] or 0
    