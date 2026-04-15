from rest_framework.permissions import BasePermission

SAFE_METHODS = ('GET', 'HEAD', 'OPTIONS')


class IsAdminRole(BasePermission):
    """Global admin role required"""
    message = 'Only admin users can perform this action.'

    def has_permission(self, request, view):
        return (
            request.user and
            request.user.is_authenticated and
            request.user.role == 'ADMIN'
        )


class IsAdminOrClubAdmin(BasePermission):
    """Global admin or club admin role required"""
    message = 'Only admin or club admin users can perform this action.'

    def has_permission(self, request, view):
        return (
            request.user and
            request.user.is_authenticated and
            request.user.role in ('ADMIN', 'CLUB_ADMIN')
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
    """Authenticated users (member, club_admin, or admin)"""
    message = 'You must be logged in.'

    def has_permission(self, request, view):
        return (
            request.user and
            request.user.is_authenticated and
            request.user.role in ('MEMBER', 'CLUB_ADMIN', 'ADMIN', 'STUDENT')
        )


class IsOwnerOrAdmin(BasePermission):
    """Object owner, club admin, or global admin only"""
    message = 'You do not have permission to access this.'

    def has_object_permission(self, request, view, obj):
        if request.user.role == 'ADMIN':
            return True
        
        # Check if user is club admin for this object's club
        if request.user.role == 'CLUB_ADMIN':
            club = getattr(obj, 'club', None)
            if club and club.admin == request.user:
                return True
        
        owner = getattr(obj, 'student', None) or getattr(obj, 'user', None)
        return owner == request.user
