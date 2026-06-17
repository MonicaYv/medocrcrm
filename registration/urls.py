from django.urls import path
from . import views 

urlpatterns = [
    path('register', views.welcome, name='welcome'),
    path('register/<str:role>', views.register_by_role, name='register_by_role'),
    path('save/customer', views.save_user, name='save_user'),
    path('save/ngo', views.save_ngo, name='save_ngo'),
    path('login', views.login_page, name='login_page'),
    path('auth/login', views.login_auth, name='login_auth'),
    path('save/advertiser', views.save_advertiser, name='save_advertiser'),
    path('save/client', views.save_client, name='save_client'),
    path('save/medical_pharmacy', views.save_medical_pharmacy, name='save_pharmacy'),        
    path("otp/send", views.send_otp, name="send_otp"),
    path("otp/verify", views.verify_otp, name="verify_otp"),
    path('forgot-password', views.forgot_password, name='forgot_password'),
    path("reset-password/<str:token>/", views.reset_password, name="reset_password"),
    path("save/lab", views.save_lab, name="save_lab"),
    path("save/doctor", views.save_doctor, name="save_doctor"),
    path("save/hospital", views.save_hospital, name="save_hospital"),
    path('file-scan/',views.file_scan_api,name='file_scan'),
]
