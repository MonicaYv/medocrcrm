from django.http import JsonResponse
from django.shortcuts import render
from django.template.loader import render_to_string
from django.core.paginator import Paginator
from registration.models import DoctorProfile
from django.views.decorators.http import require_POST
from dashboard.models import SettingMenu
from dashboard.utils import (
    dashboard_login_required,
    get_common_context,
    get_theme_colors,
)
from django.db import models
from appointments.utils import get_appointment_stats
from .models import (
    DoctorAppointment,
    LabAppointments,
    HospitalAppointments,
)
from django.views.decorators.http import require_POST

# ======================================================
# MAIN APPOINTMENT PAGE
# ======================================================

@dashboard_login_required
def appointment_view(request):
    user = request.user_obj
    user_type = user.user_type

    # Sidebar menu
    menu_items = SettingMenu.objects.filter(
        is_active=True,
        user_types__contains=[user_type]
    ).order_by("order")

    context = get_common_context(request, user)
    context["theme_colors"] = get_theme_colors(user_type)
    context["sidebar_menu"] = menu_items

    # Appointment stats
    stats = get_appointment_stats(user_type, user)

    context.update({
        "total_appointments": stats.get("total", 0),
        "pending_appointments": stats.get("pending", 0),
        "accepted_appointments": stats.get("accepted", 0),
        "completed_appointments": stats.get("completed", 0),
        "cancelled_appointments": stats.get("cancelled", 0),
        "accepted_appointed_appointments": stats.get("accepted_appointed", 0),
    })

    # Role-based template
    if user_type == "lab":
        template = "lab/lab_appointment.html"
    elif user_type == "doctor":
        template = "doctor/doctor_appointment.html"
    elif user_type == "hospital":
        template = "hospital/hospital_appointment.html"
    else:
        template = "dashboard/layout.html"

    return render(request, template, context)


# ======================================================
# AJAX APPOINTMENTS ENDPOINT (FULLY DYNAMIC)
# ======================================================

@dashboard_login_required
def ajax_appointments(request):
    user = request.user_obj
    user_type = user.user_type

    status = request.GET.get("status", "all").strip().lower()
    page_number = request.GET.get("page", 1)

    # Normalize spelling
    if status == "canceled":
        status = "cancelled"

    # --------------------------------------------------
    # BASE QUERYSET (by role)
    # --------------------------------------------------

    if user_type == "lab":
        qs = LabAppointments.objects.select_related(
            "user__userprofile",
            "test_package",
            "test_type",
            "test_description",
            "address",
            "user",
        )

    elif user_type == "doctor":

        doctor_profile = DoctorProfile.objects.filter(user=user).first()

        qs = DoctorAppointment.objects.select_related(
            "user__userprofile",
            "address",
            "user",
            # "doctor",
        )

        # if doctor_profile:
        #     qs = qs.filter(
        #         models.Q(doctor=doctor_profile) |
        #         models.Q(doctor__isnull=True)
        #     )




    elif user_type == "hospital":
        qs = HospitalAppointments.objects.select_related(
            "user__userprofile",
            "service_type",
            "description",
            "category",
            "bed_room",
            "address",
            "user",
        )

    else:
        qs = HospitalAppointments.objects.none()

    # --------------------------------------------------
    # STATUS FILTER (DYNAMIC, NO MAPS)
    # --------------------------------------------------

    if status != "all":
        qs = qs.filter(status__iexact=status.capitalize())

        if status == "missed":
            # Not stored yet
            qs = qs.none()
        else:
            qs = qs.filter(status__iexact=status)

    # --------------------------------------------------
    # ORDER + PAGINATION
    # --------------------------------------------------

    qs = qs.order_by("-created_at")

    paginator = Paginator(qs, 5)
    page_obj = paginator.get_page(page_number)

    html = render_to_string(
        "partials/appointment-cards-list.html",
        {
            "appointments": page_obj,
            "page_obj": page_obj,
        },
        request=request,
    )

    return JsonResponse({
        "html": html,
        "has_next": page_obj.has_next(),
        "has_prev": page_obj.has_previous(),
        "current_page": page_obj.number,
        "total_pages": paginator.num_pages,
    })


@require_POST
@dashboard_login_required
def update_appointment_status(request):

    appointment_id = request.POST.get("appointment_id")
    status = request.POST.get("status")

    try:
        appointment = DoctorAppointment.objects.get(id=appointment_id)

        appointment.status = status
        appointment.save()

        return JsonResponse({
            "success": True,
            "message": f"Appointment {status}"
        })

    except DoctorAppointment.DoesNotExist:
        return JsonResponse({
            "success": False,
            "message": "Appointment not found"
        }, status=404)

@require_POST
@dashboard_login_required
def update_appointment_status(request):

    order_id = request.POST.get("order_id")
    status = request.POST.get("status")

    # REMOVE R FROM R240
    order_id = str(order_id).replace("R", "").strip()

    try:
        order_id = int(order_id)
    except ValueError:
        return JsonResponse({
            "success": False,
            "message": "Invalid Order ID"
        })

    appointment = LabAppointments.objects.filter(
        id=order_id
    ).first()

    if not appointment:
        return JsonResponse({
            "success": False,
            "message": "Appointment not found"
        })

    appointment.status = status
    appointment.save()

    return JsonResponse({
        "success": True
    })