# appointments/utils.py

from django.db.models import DateField, F
from django.db.models.functions import Cast, Coalesce

from .models import (
    LabAppointments,
    DoctorAppointment,
    HospitalAppointments,
    AppointmentStatus,
    HospitalAppointmentStatus,
)

# Hospital schedules appointments on `preferred_date_from`; doctor/lab on
# `preferred_date_time`.
APPOINTMENT_DATE_FIELDS = {
    "hospital": "preferred_date_from",
    "lab": "preferred_date_time",
    "doctor": "preferred_date_time",
}


def appointment_date_field(user_type):
    """Return the model field holding an appointment's scheduled date."""
    return APPOINTMENT_DATE_FIELDS.get(user_type, "preferred_date_time")


def appointment_date_expression(user_type, fallback_to_created=False):
    """Return a *wall-clock date* expression for an appointment's own date.

    ``doctor_appointments.preferred_date_time``, ``lab_appointments.
    preferred_date_time`` and ``hospital_appointments.preferred_date_from`` are
    PostgreSQL ``timestamp without time zone`` columns holding local (IST)
    wall-clock values, while ``settings.USE_TZ`` is True.

    Django's ``__date`` lookup therefore renders
    ``col AT TIME ZONE 'Asia/Kolkata'::date``, which re-shifts the stored value
    by the UTC offset — e.g. ``05/09/2026 03:30`` was compared as
    ``04/09/2026``, so a date filter never matched a real appointment.

    ``CAST(col AS date)`` simply truncates the stored wall-clock value, which is
    exactly the date the UI displays.

    When ``fallback_to_created`` is True rows without an appointment date fall
    back to ``created_at`` (also a naive column) so legacy rows stay filterable;
    otherwise those rows are simply not date-matched.
    """
    date_field = appointment_date_field(user_type)
    if fallback_to_created:
        return Cast(Coalesce(F(date_field), F("created_at")), DateField())
    return Cast(F(date_field), DateField())


def filter_appointments_between_dates(qs, user_type, start_date, end_date,
                                      fallback_to_created=False):
    """Filter ``qs`` to appointments scheduled between two dates (inclusive)."""
    if start_date and end_date and start_date > end_date:
        start_date, end_date = end_date, start_date
    return qs.annotate(
        _appt_date=appointment_date_expression(user_type, fallback_to_created)
    ).filter(_appt_date__range=(start_date, end_date))

def get_appointment_stats(user_type, user):
    stats = {
        "total": 0,
        "pending": 0,
        "cancelled": 0,
        "completed": 0,
        "accepted": 0,
        "accepted_appointed": 0,
    }

    if user_type == "lab":
        # Lab sees appointments where it is the ACCEPTED lab
        qs = LabAppointments.objects.filter(accepted_lab__user=user)

        stats["total"] = qs.count()
        stats["pending"] = qs.filter(status=AppointmentStatus.PENDING).count()
        stats["cancelled"] = qs.filter(status="Cancelled").count()
        stats["completed"] = qs.filter(status=AppointmentStatus.COMPLETED).count()
        stats["accepted"] = qs.filter(status=AppointmentStatus.ACCEPTED).count()

        # Accepted + having appointment date
        stats["accepted_appointed"] = qs.filter(
            status=AppointmentStatus.ACCEPTED,
            preferred_date_time__isnull=False
        ).count()

    elif user_type == "doctor":
        qs = DoctorAppointment.objects.filter(doctor__user=user)

        stats["total"] = qs.count()
        stats["pending"] = qs.filter(status="Pending").count()
        stats["cancelled"] = qs.filter(status="Cancelled").count()
        stats["completed"] = qs.filter(status="Completed").count()
        stats["accepted"] = qs.filter(status="Accepted").count()
        stats["accepted_appointed"] = qs.filter(
            status="Accepted",
            preferred_date_time__isnull=False
        ).count()

    elif user_type == "hospital":
        qs = HospitalAppointments.objects.filter(accepted_hospital__user=user)

        stats["total"] = qs.count()
        stats["pending"] = qs.filter(status=HospitalAppointmentStatus.PENDING).count()
        stats["cancelled"] = qs.filter(status="Cancelled").count()
        stats["completed"] = qs.filter(status=HospitalAppointmentStatus.COMPLETED).count()
        stats["accepted"] = qs.filter(status=HospitalAppointmentStatus.ACCEPTED).count()
        stats["accepted_appointed"] = qs.filter(
            status=HospitalAppointmentStatus.ACCEPTED,
            preferred_date_from__isnull=False
        ).count()

    return stats
