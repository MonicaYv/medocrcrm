from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from registration import views
from dashboard import views as dashboard_views
from settings import views as settings_views
from ngopost import views as ngopost_views
from ngopost.views import post_view, post_detail_ajax

urlpatterns = [
    path('', views.login_page, name='login'),
    path('admin/', admin.site.urls),
    path('user/', include('registration.urls')),
    path('dashboard', dashboard_views.dashboard_home, name='dashboard'),
    path('logout', dashboard_views.logout_view, name='logout'),
    path('settings/', include('settings.urls')),
    path('posts/', include('ngopost.urls')),

    # ... other apps
]+ static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)

if settings.DEBUG:
    # ... existing code ...
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)