from django.urls import path
from . import views

urlpatterns = [
    path('', views.reports, name='reports'),
    path("pharmacy-report-data/", views.pharmacy_report_data, name="pharmacy_report_data"),
    path("hospital-report-data/", views.hospital_report_data, name="hospital_report_data"),
    path("doctor-report-data/", views.doctor_report_data, name="doctor_report_data"),
    path("lab-report-data/", views.lab_report_data, name="lab_report_data"),
    
]
