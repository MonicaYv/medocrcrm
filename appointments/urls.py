from appointments import views
from django.urls import path
from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    path('', views.appointment_view, name='appointment'),
    path("ajax/appointments/", views.ajax_appointments, name="ajax-appointments"),
    path("appointment-details/<int:appointment_id>/", views.appointment_details, name="appointment_details"),
    path("place-bid/", views.place_bid, name="place_bid"),
    path("cancel-bid/", views.cancel_bid, name="cancel_bid"),
    path("complete-appointment/", views.complete_appointment, name="complete-appointment"),
    path("no-show-appointment/", views.no_show_appointment, name="no-show-appointment"),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)