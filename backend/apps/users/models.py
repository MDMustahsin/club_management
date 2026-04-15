from django.contrib.auth.models import AbstractBaseUser, BaseUserManager, PermissionsMixin
from django.db import models
from api.base_models import TimeStampedModel


class CustomUserManager(BaseUserManager):
    """
    OOP Principle: Encapsulation
    All user creation logic is encapsulated inside this manager class
    """
    def create_user(self, email, username, password=None, **extra_fields):
        if not email:
            raise ValueError('Email is required')
        if not username:
            raise ValueError('Username is required')
        email = self.normalize_email(email)
        user = self.model(email=email, username=username, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email, username, password=None, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        extra_fields.setdefault('role', 'ADMIN')
        return self.create_user(email, username, password, **extra_fields)


class CustomUser(AbstractBaseUser, PermissionsMixin, TimeStampedModel):
    """
    OOP Principles:
    - Inheritance: extends AbstractBaseUser, PermissionsMixin, TimeStampedModel
    - Encapsulation: role check methods hide internal logic
    - Abstraction: hides password hashing complexity
    """
    ROLE_CHOICES = (
        ('ADMIN', 'Admin'),
        ('MEMBER', 'Member'),
    )

    username = models.CharField(max_length=150, unique=True)
    email = models.EmailField(unique=True)
    role = models.CharField(
        max_length=10,
        choices=ROLE_CHOICES,
        default='MEMBER'
    )
    phone_number = models.CharField(max_length=15, blank=True, null=True)
    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)

    objects = CustomUserManager()

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['username']

    class Meta:
        db_table = 'users'
        verbose_name = 'User'
        verbose_name_plural = 'Users'
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.username} ({self.role})"

    def is_admin(self):
        """Encapsulated role check — hides implementation detail"""
        return self.role == 'ADMIN'

    def is_member(self):
        """Encapsulated role check — hides implementation detail"""
        return self.role == 'MEMBER'

    def get_full_info(self):
        """Encapsulated method — returns formatted user info"""
        return {
            'username': self.username,
            'email': self.email,
            'role': self.role,
            'phone': self.phone_number or 'Not provided',
            'joined': self.created_at.strftime('%Y-%m-%d')
        }