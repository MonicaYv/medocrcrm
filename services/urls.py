from django.urls import path
from . import views

urlpatterns = [
    path('', views.services, name='services'),

    # LAB
    path('add-services', views.save_lab_services, name='add_services'),
    path('get-services/', views.get_lab_services, name='get_lab_services'),
    path('delete-service/<str:service_type>/<int:service_id>/',views.delete_lab_service,name='delete_lab_service'),
    path('update-service/<str:service_type>/<int:service_id>/',views.update_lab_service,name='update_lab_service'),

    # DOCTOR
    path('services/add-doctor-services/', views.save_doctor_services, name='save_doctor_services'),
    path('doctor-services/', views.get_doctor_services, name='get_doctor_services'),

    # PHARMACY
    path('pharmacy/medicines/', views.get_pharmacy_medicines, name='get_pharmacy_medicines'),
    path('pharmacy/medicines/save/', views.save_pharmacy_medicines, name='save_pharmacy_medicines'),
    path('pharmacy/medicines/<int:medicine_id>/delete/', views.delete_pharmacy_medicine, name='delete_pharmacy_medicine'),
    path('pharmacy/dropdowns/', views.pharmacy_dropdowns, name='pharmacy_dropdowns'),
]
