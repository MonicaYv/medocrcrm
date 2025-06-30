from django.urls import path
from . import views

urlpatterns = [
    path('', views.settings_page, name='settings_page'),
    path('update_ngo_profile/', views.update_ngo_profile, name='update_ngo_profile'),
    path('update-notification-field/', views.update_notification_field, name='update_notification_field'),
]
