from django.urls import path
from .views import offers_view

urlpatterns = [
    path('', offers_view, name='offers'),
]