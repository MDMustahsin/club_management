from django.db import models
from django.conf import settings
from api.base_models import TimeStampedModel
from apps.clubs.models import Club


class Membership(TimeStampedModel):
    """
    OOP Principles:
    - Inheritance: extends TimeStampedModel
      (gets created_at, updated_at for free)
    - Encapsulation: all status logic inside the model
    - Abstraction: hides complex state transitions
    """
    STATUS_CHOICES = (
        ('PENDING', 'Pending'),
        ('APPROVED', 'Approved'),
        ('REJECTED', 'Rejected'),
    )

    student = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='memberships'
    )
    club = models.ForeignKey(
        Club,
        on_delete=models.CASCADE,
        related_name='memberships'
    )
    status = models.CharField(
        max_length=10,
        choices=STATUS_CHOICES,
        default='PENDING'
    )
    rejection_reason = models.TextField(blank=True, null=True)

    class Meta:
        db_table = 'memberships'
        verbose_name = 'Membership'
        verbose_name_plural = 'Memberships'
        ordering = ['-created_at']
        unique_together = ('student', 'club')

    def __str__(self):
        return f"{self.student.username} → {self.club.name} ({self.status})"

    # ── Encapsulated status check methods ──

    def is_pending(self):
        """Encapsulated status check"""
        return self.status == 'PENDING'

    def is_approved(self):
        """Encapsulated status check"""
        return self.status == 'APPROVED'

    def is_rejected(self):
        """Encapsulated status check"""
        return self.status == 'REJECTED'

    # ── Encapsulated state transition methods ──

    def approve(self):
        """
        Encapsulated approval logic
        OOP: hides state transition complexity
        """
        if not self.is_pending():
            raise ValueError('Only pending applications can be approved.')
        self.status = 'APPROVED'
        self.rejection_reason = None
        self.save()

    def reject(self, reason=None):
        """
        Encapsulated rejection logic
        OOP: hides state transition complexity
        """
        if not self.is_pending():
            raise ValueError('Only pending applications can be rejected.')
        self.status = 'REJECTED'
        self.rejection_reason = reason
        self.save()

    def cancel(self):
        """
        Encapsulated cancellation logic
        Only pending memberships can be cancelled
        """
        if not self.is_pending():
            raise ValueError('Only pending applications can be cancelled.')
        self.delete()