from django.urls import path
from . import views 

urlpatterns = [
    path('register', views.welcome, name='welcome'),
    path('new-welcome', views.new_welcome, name='new_welcome'),
    path('register/<str:role>', views.register_by_role, name='register_by_role'),
    path('save/customer', views.save_user, name='save_user'),
    path('login', views.login_page, name='login_page'),
    path('auth/login', views.login_auth, name='login_auth'),
    path('auth/login-old', views.login_auth_OLD, name='login_auth_old'),

    path('save/medical_pharmacy', views.save_medical_pharmacy, name='save_pharmacy'),        
    path("otp/send", views.send_otp, name="send_otp"),
    path("otp/verify", views.verify_otp, name="verify_otp"),
    path('forgot-password', views.forgot_password, name='forgot_password'),
    path("reset-password/<str:token>/", views.reset_password, name="reset_password"),
    
    # path("save/lab", views.save_lab, name="save_lab"),
    path("save/doctor", views.save_doctor, name="save_doctor"),
    path('file-scan/',views.file_scan_api,name='file_scan'),
    path("send-contact-person-otp/",views.send_contact_person_otp,name="send_contact_person_otp",),
    
    path("new-signin/", views.new_signin, name="new_signin"),
    path("new-otp-verify/", views.new_otp_verify, name="new_otp_verify"),
    path("new-signup/", views.new_signup, name="new_signup"),
    
    path("lab-verification/", views.lab_verification, name="lab_verification"),
    path('check-phone', views.check_phone, name='check_phone'),
    path('auth/verify-login-otp', views.verify_login_otp, name='verify_login_otp'),
    # path("lab-kyc/", views.lab_kyc, name="lab_kyc"),
    # path("lab-profile-verification/", views.lab_profile_verification, name="profile_verification_lab"),
    # path("lab-profile-review/", views.lab_profile_review, name="lab_profile_review"),
    path("save/hospital", views.save_hospital, name="save_hospital"), 
    
    
    # hospitals routes  
    path("hospital-kyc/", views.hospital_kyc, name="hospital_kyc"),
    path("hospital-profile-verification/", views.hospital_profile_verification, name="profile_verification_hospital"),
    path("hospital-profile-verification/get-states/", views.get_states, name="get_states"),
    path("hospital-profile-verification/get-cities/", views.get_cities, name="get_cities"),
    path("hospital-profile-verification/save/", views.save_hospital_profile, name="save_hospital_profile"),
    path("hospital-profile-review/", views.hospital_profile_review, name="hospital_profile_review"),
    
    # doctors routes 
    path("doctor-kyc/", views.doctor_kyc, name="doctor_kyc"),
    path("doctor-profile-verification/", views.doctor_profile_verification, name="doctor_profile_verification"),
    path("doctor-profile-verification/get-states/", views.get_states, name="get_states"),
    path("doctor-profile-verification/get-cities/", views.get_cities, name="get_cities"),
    path("doctor-profile-verification/save/", views.save_doctor_profile, name="save_doctor_profile"),
    
    # labs routes
    path("lab-kyc/", views.lab_kyc, name="lab_kyc"),
    path("lab-profile-verification/",views.lab_profile_verification,name="profile_verification_lab"),
    path("lab-profile-verification/get-states/",views.get_states,name="lab_get_states"),
    path("lab-profile-verification/get-cities/",views.get_cities,name="lab_get_cities"),
    path("lab-profile-verification/save/",views.save_lab_profile,name="save_lab_profile"),
    path("lab-profile-review/",views.lab_profile_review,name="lab_profile_review"),
    
    # pharmacy routes 
    path("pharmacy-kyc/", views.pharmacy_kyc, name="pharmacy_kyc"),
    path("pharmacy-profile-verification/", views.pharmacy_profile_verification, name="pharmacy_profile_verification"),
    path("pharmacy-profile-verification/get-states/", views.get_states, name="get_states"),
    path("pharmacy-profile-verification/get-cities/", views.get_cities, name="get_cities"),
    path("pharmacy-profile-verification/save/", views.save_pharmacy_profile, name="save_pharmacy_profile"),
]
