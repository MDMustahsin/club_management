from django.urls import path
from .views import create_admin
from .views import (
    RegisterView,
    LoginView,
    LogoutView,
    ProfileView,
    AllUsersView,
)

urlpatterns = [
    path('register/', RegisterView.as_view(), name='register'),
    path('login/', LoginView.as_view(), name='login'),
    path('logout/', LogoutView.as_view(), name='logout'),
    path('profile/', ProfileView.as_view(), name='profile'),
    path('users/', AllUsersView.as_view(), name='all-users'),
    path('create-admin/', create_admin),
]