from django.db import models


class TimeStampedModel(models.Model):
    """
    Abstract base model — provides created_at and updated_at.
    OOP: Inheritance + Abstraction
    """
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        abstract = True


class SoftDeleteModel(models.Model):
    """
    Abstract base model — provides soft delete.
    OOP: Abstraction + Encapsulation
    """
    is_active = models.BooleanField(default=True)

    class Meta:
        abstract = True

    def soft_delete(self):
        self.is_active = False
        self.save()

    def restore(self):
        self.is_active = True
        self.save()


class BaseModel(TimeStampedModel, SoftDeleteModel):
    """
    Combined base model — timestamps + soft delete.
    OOP: Multiple Inheritance
    """
    class Meta:
        abstract = True