from rest_framework.permissions import BasePermission

SAFE_METHODS = ('GET', 'HEAD', 'OPTIONS')


class IsAdminRole(BasePermission):
    """Admin role required"""
    message = 'Only admin users can perform this action.'

    def has_permission(self, request, view):
        return (
            request.user and
            request.user.is_authenticated and
            request.user.role == 'ADMIN'
        )


class IsAdminOrReadOnly(BasePermission):
    """Read for all, write for admin only"""
    message = 'Only admin users can modify this.'

    def has_permission(self, request, view):
        if request.method in SAFE_METHODS:
            return True
        return (
            request.user and
            request.user.is_authenticated and
            request.user.role == 'ADMIN'
        )


class IsMemberOrAdmin(BasePermission):
    """Authenticated users only"""
    message = 'You must be logged in.'

    def has_permission(self, request, view):
        return (
            request.user and
            request.user.is_authenticated and
            request.user.role in ('MEMBER', 'ADMIN')
        )


class IsOwnerOrAdmin(BasePermission):
    """Object owner or admin only"""
    message = 'You do not have permission to access this.'

    def has_object_permission(self, request, view, obj):
        if request.user.role == 'ADMIN':
            return True
        owner = getattr(obj, 'student', None) or getattr(obj, 'user', None)
        return owner == request.user