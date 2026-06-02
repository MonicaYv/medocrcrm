from django.urls import path
from . import views

urlpatterns = [
    path('', views.history, name='history'),
    path("doctor/history/ajax/", views.ajax_doctor_history, name="ajax_doctor_history"),
    path("lab/history/ajax/", views.ajax_lab_history, name="ajax_lab_history"),
    path("hospital/history/ajax/", views.ajax_hospital_history, name="ajax_hospital_history"),
    path("lab/complete/", views.complete_lab_appointment),
    path("lab/cancel/", views.cancel_lab_appointment),
]
