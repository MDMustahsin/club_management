from django.db import models
from django.conf import settings
from api.base_models import TimeStampedModel
from apps.clubs.models import Club


class Donation(TimeStampedModel):
    """
    OOP Principles:
    - Inheritance: extends TimeStampedModel
    - Encapsulation: payment & status logic inside model
    - Abstraction: hides transaction handling
    """

    STATUS_CHOICES = (
        ('PENDING', 'Pending'),
        ('COMPLETED', 'Completed'),
        ('FAILED', 'Failed'),
        ('REFUNDED', 'Refunded'),
    )

    donor = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='donations',
        blank=True,
        null=True
    )

    club = models.ForeignKey(
        Club,
        on_delete=models.CASCADE,
        related_name='donations'
    )

    amount = models.DecimalField(
        max_digits=10,
        decimal_places=2
    )

    status = models.CharField(
        max_length=10,
        choices=STATUS_CHOICES,
        default='PENDING'
    )

    transaction_id = models.CharField(
        max_length=255,
        blank=True,
        null=True
    )

    message = models.TextField(blank=True, null=True)

    class Meta:
        db_table = 'donations'
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.donor.username} → {self.club.name} (${self.amount})"

    # ── Encapsulated status check methods ──

    def is_pending(self):
        return self.status == 'PENDING'

    def is_completed(self):
        return self.status == 'COMPLETED'

    def is_failed(self):
        return self.status == 'FAILED'

    def is_refunded(self):
        return self.status == 'REFUNDED'

    # ── Encapsulated state transition methods ──

    def mark_completed(self, transaction_id=None):
        """
        Encapsulated success logic
        """
        if not self.is_pending():
            raise ValueError('Only pending donations can be completed.')

        self.status = 'COMPLETED'
        self.transaction_id = transaction_id
        self.save()

    def mark_failed(self):
        """
        Encapsulated failure logic
        """
        if not self.is_pending():
            raise ValueError('Only pending donations can fail.')

        self.status = 'FAILED'
        self.save()

    def refund(self):
        """
        Encapsulated refund logic
        """
        if not self.is_completed():
            raise ValueError('Only completed donations can be refunded.')

        self.status = 'REFUNDED'
        self.save()