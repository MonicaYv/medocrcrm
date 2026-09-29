# appointments/utils.py

from datetime import date, datetime, timedelta

from django.db.models import DateField, F
from django.db.models.functions import Cast, Coalesce
from django.utils import timezone

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


def parse_filter_date(value):
    """Parse a date coming from a datepicker/filter UI.

    The frontend sends ISO (yyyy-mm-dd) but be tolerant of common variants
    so a custom date selection never silently fails.
    """
    value = str(value or "").strip()
    if not value:
        return None
    for fmt in ("%Y-%m-%d", "%d/%m/%Y", "%m/%d/%Y", "%d-%m-%Y", "%Y/%m/%d"):
        try:
            return datetime.strptime(value, fmt).date()
        except ValueError:
            continue
    try:
        return date.fromisoformat(value)
    except ValueError:
        return None


def apply_appointment_date_filter(qs, user_type, date_filter, selected_date,
                                  start_date=None, end_date=None):
    """Filter an appointment queryset by *appointment date*.

    Supports the ``today`` / ``week`` / ``month`` / ``year`` presets and a
    ``custom`` range (either a single ``date`` or a ``start_date``/``end_date``
    pair). The comparison happens on a cast (wall-clock) date rather than
    ``__date``; see ``appointment_date_expression`` for why.

    Rows without an appointment date fall back to ``created_at`` so legacy
    records stay visible in the filtered list.
    """
    date_filter = str(date_filter or "").strip().lower()
    if not date_filter or date_filter in {"", "all", "none", "clear"}:
        return qs

    today = timezone.localdate()
    appt_date = appointment_date_expression(user_type, fallback_to_created=True)

    if date_filter == "today":
        start = end = today
    elif date_filter == "week":
        start = today - timedelta(days=6)
        end = today
    elif date_filter == "month":
        start = today.replace(day=1)
        # First day of the next month minus one day = last day of this month.
        end = (start + timedelta(days=31)).replace(day=1) - timedelta(days=1)
    elif date_filter == "year":
        start = today.replace(month=1, day=1)
        end = today.replace(month=12, day=31)
    elif date_filter == "custom":
        parsed_start = parse_filter_date(start_date) if start_date else None
        parsed_end = parse_filter_date(end_date) if end_date else None
        parsed_single = parse_filter_date(selected_date)
        # Single-date selection.
        start = parsed_start or parsed_single
        end = parsed_end or parsed_single
        if not start and not end:
            # Custom opened but no date picked yet — show everything instead
            # of an empty list until a date is sent.
            return qs
        start = start or end
        end = end or start
        if start > end:
            start, end = end, start
    else:
        return qs

    return qs.annotate(_appt_date=appt_date).filter(
        _appt_date__range=(start, end)
    )

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
