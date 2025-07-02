from django.urls import path
from . import views

urlpatterns = [
    path('', views.settings_page, name='settings_page'),
    path('update-ngo_profile/', views.update_ngo_profile, name='update_ngo_profile'),
    path('update-advertiser_profile/', views.update_advertiser_profile, name='update_advertiser_profile'),
    path('update_client_profile/', views.update_client_profile, name='update_client_profile'),
    path('update-notification-field/', views.update_notification_field, name='update_notification_field'),
    path('update-document/', views.update_user_document, name='update_document'),
    path('clear-search-history/', views.clear_search_history, name='clear_search_history'),
    path('clear-saved-data/', views.clear_saved_data, name='clear_saved_data'),
    path('delete-account/', views.delete_account, name='delete_account'),
    path('change-password/', views.change_password, name='change_password'),
]
