from appointments import views
from django.urls import path
from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    path('', views.appointment_view, name='appointment'),
    path("ajax/appointments/", views.ajax_appointments, name="ajax-appointments"),
    path("appointment-details/<int:appointment_id>/", views.appointment_details, name="appointment_details"),
    path("place-bid/", views.place_bid, name="place_bid"),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)