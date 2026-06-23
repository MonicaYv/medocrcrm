from django.urls import path
from . import views

urlpatterns = [
    path('', views.history, name='history'),
    path("doctor/history/ajax/", views.ajax_doctor_history, name="ajax_doctor_history"),
    path("lab/history/ajax/", views.ajax_lab_history, name="ajax_lab_history"),
    path("hospital/history/ajax/", views.ajax_hospital_history, name="ajax_hospital_history"),
    path("cancel-bid/", views.cancel_bid, name="cancel_bid"),
    path("complete-appointment/", views.complete_appointment, name="complete-appointment"),
    path("no-show-appointment/", views.no_show_appointment, name="no-show-appointment"),
]
