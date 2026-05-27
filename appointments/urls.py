from appointments import views
from django.urls import path

urlpatterns = [
    path('', views.appointment_view, name='appointment'),
    path("ajax/appointments/", views.ajax_appointments, name="ajax-appointments"),
    path(
      "update-status/",
       views.update_appointment_status,
       name="update_appointment_status"
    ),
    # path('doctor/history/',views.doctor_history_view,name='doctor-history'),
    # path('doctor/history/ajax/',views.ajax_doctor_history,name='ajax-doctor-history'),
    
]