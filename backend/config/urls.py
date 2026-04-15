from django.contrib import admin
from django.urls import path, include

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/auth/', include('apps.users.urls')),
    path('api/clubs/', include('apps.clubs.urls')),
    path('api/memberships/', include('apps.memberships.urls')),
    path('api/events/', include('apps.events.urls')),
    path('api/donations/', include('apps.donations.urls')),
]