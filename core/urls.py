from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from registration import views

urlpatterns = [
    path('', views.login_page, name='login_page'),
    path('admin/', admin.site.urls),
    path('register/', include('registration.urls')),
    # ... other apps
]+ static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
