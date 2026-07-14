from django.urls import path
from . import views

urlpatterns = [
    ## settings
    path('', views.settings_page, name='settings_page'),
    path('update-ngo-profile/', views.update_ngo_profile, name='update_ngo_profile'),
    path('update-advertiser-profile/', views.update_advertiser_profile, name='update_advertiser_profile'),
    path('update_client-profile/', views.update_client_profile, name='update_client_profile'),
    path('update-pharmacy-profile/', views.update_pharmacy_profile, name='update_pharmacy_profile'),
    path('update-lab-profile', views.update_lab_profile, name='update_lab_profile'),
    path('update-doctor-profile', views.update_doctor_profile, name='update_doctor_profile'),
    path('update-hospital-profile', views.update_hospital_profile, name='update_hospital_profile'),
    path('update-notification-field/', views.update_notification_field, name='update_notification_field'),
    path('update-document/', views.update_user_document, name='update_document'),
    path('clear-search-history/', views.clear_search_history, name='clear_search_history'),
    path('clear-saved-data/', views.clear_saved_data, name='clear_saved_data'),
    path('delete-account/', views.delete_account, name='delete_account'),
    path('change-password/', views.change_password, name='change_password'),
    # path('get_user_theme_api/', views.get_user_theme_api, name='get_user_theme_api'),
    # path('account-details/', views.get_account_details, name='account-details'),
    path("subscription/status/", views.seller_subscription_status, name="seller-subscription-status"),
    path("subscription/cancel/", views.cancel_subscription, name="seller-subscription-cancel"),
    path("subscription/subscribe/",views.subscribe_subscription,name="seller-subscription-subscribe"),
    path('terms-conditions/',views.terms_conditions,name="terms-conditions"),
    path('privacy-policy/',views.privacy_policy,name="privacy-policy"),
    path('disclaimer/',views.disclaimer,name="disclaimer"),
    path("send-change-password-otp/", views.send_change_password_otp, name="send_change_password_otp")
]
