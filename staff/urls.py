from django.urls import path
from . import views
from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    path('', views.staffs, name='staffs'),

    path('hospital/doctors/save/', views.save_hospital_doctor, name='save_hospital_doctor'),
    path('hospital/doctors/list/', views.get_hospital_doctors, name='get_hospital_doctors'),
    path('add-technician/', views.add_technician, name='add_technician'),
    path('get-technicians/', views.get_technicians),
]
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)