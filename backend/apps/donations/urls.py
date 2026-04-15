from django.urls import path
from .views import (
    CreateDonationView,
    MyDonationsView,
    AllDonationsView,
    UpdateDonationStatusView
)

urlpatterns = [
    path('create/', CreateDonationView.as_view(), name='donation-create'),
    path('my/', MyDonationsView.as_view(), name='my-donations'),
    path('all/', AllDonationsView.as_view(), name='all-donations'),
    path('<int:pk>/status/', UpdateDonationStatusView.as_view(), name='donation-status'),
]