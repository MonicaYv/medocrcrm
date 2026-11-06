from django.urls import path
from .views import payout_view

urlpatterns = [
    path('', payout_view, name='payout'),
]