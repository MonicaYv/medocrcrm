from appointments import views
from django.urls import path
from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    path('', views.appointment_view, name='appointment'),
    path("ajax/appointments/", views.ajax_appointments, name="ajax-appointments"),
    path("update-status/",views.update_appointment_status,name="update_appointment_status"),
    # path('doctor/history/',views.doctor_history_view,name='doctor-history'),
    # path('doctor/history/ajax/',views.ajax_doctor_history,name='ajax-doctor-history'),
    path("update-status/",views.update_appointment_status,name="update-appointment-status",),
    path("appointment-details/<int:appointment_id>/",views.appointment_details,name="appointment_details"),
    path("place-bid/", views.place_bid, name="place_bid"),
    path("no-show-appointment/<int:appointment_id>/",views.no_show_appointment,name="no-show-appointment"),
    path("complete-appointment/<int:appointment_id>/",views.complete_appointment,name="complete-appointment"),
    path("doctor-no-show-appointment/<int:appointment_id>/",views.doctor_no_show_appointment,name="doctor-no-show-appointment"),
    path("doctor-complete-appointment/<int:appointment_id>/",views.doctor_complete_appointment,name="doctor-complete-appointment"),
    path("doctor-cancel-bid/<int:bid_id>/",views.doctor_cancel_bid,name="doctor-cancel-bid"),
    path("doctor-place-bid/", views.doctor_place_bid, name="doctor-place-bid"),
    path("doctor-appointment-details/<int:appointment_id>/",views.doctor_appointment_details,name="doctor_appointment_details"),
]

if settings.DEBUG:
    urlpatterns += static(
        settings.MEDIA_URL,
        document_root=settings.MEDIA_ROOT
    )