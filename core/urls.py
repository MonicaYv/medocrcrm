from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from registration import views
from dashboard import views as dashboard_views
from settings import views as settings_views

urlpatterns = [
    path('', views.login_page, name='login'),
    path('admin/', admin.site.urls),
    path('user/', include('registration.urls')),
    path('dashboard', dashboard_views.dashboard_home, name='dashboard'),
    path('logout', dashboard_views.logout_view, name='logout'),
    path('settings/', settings_views.settings_page, name='settings_page'),

    # ... other apps
]+ static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
