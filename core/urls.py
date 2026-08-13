from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from registration import views
from dashboard import views as dashboard_views

urlpatterns = [    
    path('', views.new_signin, name='login'),
    path('old-login/', views.login_page, name='login'),
    # path('new-kyc/', views.new_kyc, name='new_kyc'),
    # path('profile-verification/', views.profile_verification, name='profile_verification'),
    # path('profile-review/', views.profile_review, name='profile_review'),
    path('doctor-verification/', views.doctor_verification, name='doctor_verification'),
    path('lab-verification/', views.lab_verification, name='lab_verification'),
    path('pharmacy-verification/', views.pharmacy_verification, name='pharmacy_verification'),
    path('admin/', admin.site.urls),
    path('user/', include('registration.urls')),
    path('dashboard', dashboard_views.dashboard_home, name='dashboard'),
    path('logout', dashboard_views.logout_view, name='logout'),
    path('map/', include('maps.urls')),
    path('help/', include('support.urls')),
    path('settings/', include('settings.urls')),
    path('support/', include('support.urls')),
    path('posts/', include('ngopost.urls')),
    path('donate/', include('donate.urls')),
    path('points/', include('points.urls')),    # ... other apps
    path('coupons/', include('coupon.urls')),
    path('dashboard/', include('dashboard.urls')),
    path('orders/', include('orders.urls')),
    path('shared/', include('shared.urls')),
    path('subscription/', include('subscription.urls')),
    path('reports/', include('reports.urls')),
    path('appointment/', include('appointments.urls')),
    path('services/', include('services.urls')),
    path('staff/', include('staff.urls')),
    path('history/', include('history.urls')),
# ]+ static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
]

if settings.DEBUG:
    # ... existing code ...
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)

# urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)