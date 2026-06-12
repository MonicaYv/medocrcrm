from django.http import JsonResponse
from django.shortcuts import get_object_or_404, render
from django.template.loader import render_to_string
from django.core.paginator import Paginator
from registration.models import DoctorProfile
from django.views.decorators.http import require_GET, require_POST
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
from django.views.decorators.http import require_POST
from django.http import JsonResponse
from services.models import HospitalBidding
from registration.models import HospitalProfile
from appointments.models import HospitalAppointments, HospitalAppointmentStatus
from services.models import (
    HospitalBidding,
    HospitalServiceRateCard,
    HospitalRoomRateCard,
    HospitalBidStatus,
    HospitalRoomRateCard,
    DoctorBidding,
    DoctorBidStatus,
    DoctorServiceRate,
    DoctorVisitCharge,
)

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

        doctor_profile = DoctorProfile.objects.filter(
            user=user
        ).first()

        qs = DoctorAppointment.objects.select_related(
            "user__userprofile",
            "address",
            "user",
        ).filter(
            status="Pending"
        )

        if doctor_profile:
            qs = qs.exclude(
                bids__doctor=doctor_profile
            ).distinct()




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
def update_lab_appointment_status(request):

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

@require_POST
@dashboard_login_required
def place_bid(request):

    appointment_id = request.POST.get("appointment_id")

    hospital = HospitalProfile.objects.filter(
        user=request.user_obj
    ).first()

    if not hospital:
        return JsonResponse({
            "success": False,
            "message": "Hospital profile not found"
        })

    appointment = HospitalAppointments.objects.select_related(
        "category",
        "description",
        "bed_room"
    ).filter(
        id=appointment_id,
        status=HospitalAppointmentStatus.PENDING
    ).first()

    if not appointment:
        return JsonResponse({
            "success": False,
            "message": "Appointment not found or already closed"
        })

    # Already placed?
    if HospitalBidding.objects.filter(
        appointment=appointment,
        hospital=hospital
    ).exists():
        return JsonResponse({
            "success": False,
            "message": "You already placed a bid"
        })

    service_rates = HospitalServiceRateCard.objects.filter(
        hospital=hospital,
        is_active=True
    )

    room_rates = HospitalRoomRateCard.objects.filter(
        hospital=hospital,
        is_active=True
    )

    service_category_ids = set(
        service_rates.values_list("category_id", flat=True)
    )

    service_description_ids = set(
        service_rates.values_list("description_id", flat=True)
    )

    bed_room_ids = set(
        room_rates.values_list("bed_room_id", flat=True)
    )

    match_score = 0
    missing = []

    if appointment.category_id in service_category_ids:
        match_score += 40
    else:
        missing.append("Service Category")

    if appointment.description_id in service_description_ids:
        match_score += 40
    else:
        missing.append("Service Description")

    if appointment.bed_room_id in bed_room_ids:
        match_score += 20
    else:
        missing.append("Bed Room Rate")

    if match_score < 80:
        return JsonResponse({
            "success": False,
            "message": "Hospital does not have matching service rate card"
        })

    service_rate = service_rates.filter(
        category=appointment.category,
        description=appointment.description
    ).first()

    if not service_rate:
        return JsonResponse({
            "success": False,
            "message": "Matching service rate card not found"
        })

    room_rate = None

    if appointment.bed_room:
        room_rate = room_rates.filter(
            bed_room=appointment.bed_room
        ).first()

        if not room_rate:
            return JsonResponse({
                "success": False,
                "message": "Room rate card not found"
            })

    service_charges = service_rate.price
    room_charges = room_rate.price if room_rate else 0
    total_bid_amount = service_charges + room_charges

    bid = HospitalBidding.objects.create(
        appointment=appointment,
        hospital=hospital,
        service_charges=service_charges,
        room_charges=room_charges,
        total_bid_amount=total_bid_amount,
        delivery_time=30,
        remarks="Auto-generated based on rate cards",
        bid_status=HospitalBidStatus.PENDING,
        is_active=True,
    )

    return JsonResponse({
        "success": True,
        "message": "Bid placed successfully",
        "match_score": match_score,
        "bid": {
            "bid_id": bid.id,
            "service_charges": float(service_charges),
            "room_charges": float(room_charges),
            "total_bid_amount": float(total_bid_amount),
            "delivery_time": 30
        }
    })

@require_POST
@dashboard_login_required
def cancel_bid(request):

    bid_id = request.POST.get("bid_id")

    hospital = HospitalProfile.objects.filter(
        user=request.user_obj
    ).first()

    bid = HospitalBidding.objects.filter(
        id=bid_id,
        hospital=hospital
    ).first()

    if not bid:
        return JsonResponse({
            "success": False,
            "message": "Bid not found"
        })

    was_accepted = bid.bid_status == "Accepted"

    bid.bid_status = "Cancelled"
    bid.is_active = False
    bid.save()

    if was_accepted:

        appointment = bid.appointment

        appointment.status = "Pending"
        appointment.accepted_bid = None
        appointment.accepted_hospital = None
        appointment.accepted_total_amount = None
        appointment.save()

    return JsonResponse({
        "success": True,
        "message": "Bid cancelled successfully"
    })

@require_POST
@dashboard_login_required
def complete_appointment(request):

    appointment_id = request.POST.get("appointment_id")

    hospital = HospitalProfile.objects.filter(
        user=request.user_obj
    ).first()

    appointment = HospitalAppointments.objects.filter(
        id=appointment_id,
        accepted_hospital=hospital
    ).first()

    if not appointment:
        return JsonResponse({
            "success": False,
            "message": "Appointment not found"
        })

    if appointment.status != "Accepted":
        return JsonResponse({
            "success": False,
            "message": "Only accepted appointments can be completed"
        })

    appointment.status = "Completed"
    appointment.save()

    if appointment.accepted_bid:
        appointment.accepted_bid.bid_status = "Completed"
        appointment.accepted_bid.save()

    return JsonResponse({
        "success": True,
        "message": "Appointment completed successfully"
    })

@require_POST
@dashboard_login_required
def no_show_appointment(request):

    appointment_id = request.POST.get("appointment_id")

    hospital = HospitalProfile.objects.filter(
        user=request.user_obj
    ).first()

    appointment = HospitalAppointments.objects.filter(
        id=appointment_id,
        accepted_hospital=hospital
    ).first()

    if not appointment:
        return JsonResponse({
            "success": False,
            "message": "Appointment not found"
        })

    if appointment.status != "Accepted":
        return JsonResponse({
            "success": False,
            "message": "Only accepted appointments can be marked no-show"
        })

    appointment.status = "No_Show"
    appointment.save()

    if appointment.accepted_bid:
        appointment.accepted_bid.bid_status = "No_Show"
        appointment.accepted_bid.save()

    return JsonResponse({
        "success": True,
        "message": "Appointment marked as no-show"
    })

@require_GET
@dashboard_login_required
def appointment_details(request, appointment_id):

    appointment = get_object_or_404(
        HospitalAppointments.objects.select_related(
            "user__userprofile",
            "category",
            "description",
            "bed_room",
        ),
        id=appointment_id
    )

    profile = appointment.user.userprofile

    return JsonResponse({
        "success": True,
        "appointment": {
            "id": appointment.id,
            "patient_name": f"{profile.first_name} {profile.last_name}",
            "gender": profile.gender,
            "phone": f"{appointment.user.phone_country_code or ''} {appointment.user.phone_number or ''}",
            "age": profile.age if hasattr(profile, "age") else "",
            "address": (
                f"{appointment.address.address}, "
                f"{appointment.address.city.name if appointment.address.city else ''}, "
                f"{appointment.address.state.name if appointment.address.state else ''}, "
                f"{appointment.address.pincode}"
                if appointment.address
                else ""
            ),

            "visit_type": appointment.preferred_mode.title(),

            "appointment_date": appointment.preferred_date_from.strftime("%d/%m/%Y, %I:%M %p")
            if appointment.preferred_date_from else "",

            "medical_requirement": (
                appointment.category.name
                if appointment.category else ""
            ),

            "details": (
                appointment.description.description
                if appointment.description else ""
            ),

            "order_id": f"APT-{appointment.id}",

            "budget": str(
                appointment.budget
                if hasattr(appointment, "budget")
                else "0"
            ),
        }
    })

@require_POST
@dashboard_login_required
def doctor_place_bid(request):

    appointment_id = request.POST.get("appointment_id")

    doctor = DoctorProfile.objects.filter(
        user=request.user_obj
    ).first()

    if not doctor:
        return JsonResponse({
            "success": False,
            "message": "Doctor profile not found"
        })

    appointment = DoctorAppointment.objects.filter(
        id=appointment_id,
        status="Pending"
    ).first()

    if not appointment:
        return JsonResponse({
            "success": False,
            "message": "Appointment not found or already closed"
        })

    existing_bid = DoctorBidding.objects.filter(
        appointment=appointment,
        doctor=doctor
    ).exists()

    if existing_bid:
        return JsonResponse({
            "success": False,
            "message": "Bid already placed"
        })

    # --------------------------------------------------
    # Doctor Services
    # --------------------------------------------------

    service_rates = DoctorServiceRate.objects.filter(
        doctor=doctor
    )

    if not service_rates.exists():
        return JsonResponse({
            "success": False,
            "message": "Doctor has no service rates configured"
        })

    doctor_specialization_ids = set(
        service_rates.values_list(
            "category_id",
            flat=True
        )
    )

    doctor_service_ids = set(
        service_rates.values_list(
            "service_id",
            flat=True
        )
    )

    appointment_specializations = set(
        appointment.specialization_ids or []
    )

    appointment_health_issues = set(
        appointment.health_issue_ids or []
    )

    # --------------------------------------------------
    # Match Score
    # --------------------------------------------------

    specialization_match = bool(
        appointment_specializations.intersection(
            doctor_specialization_ids
        )
    )

    service_match = bool(
        appointment_health_issues.intersection(
            doctor_service_ids
        )
    )

    match_score = 0
    missing = []

    if specialization_match:
        match_score += 50
    else:
        missing.append("Specialization")

    if service_match:
        match_score += 50
    else:
        missing.append("Health Issue Service")

    if match_score < 80:
        return JsonResponse({
            "success": False,
            "message": "Match score below 80%",
            "match_score": match_score,
            "missing": missing
        })

    # --------------------------------------------------
    # Service Rate
    # --------------------------------------------------

    service_rate = service_rates.filter(
        category_id__in=appointment.specialization_ids
    ).order_by("price").first()

    if not service_rate:
        return JsonResponse({
            "success": False,
            "message": "Doctor does not have matching service rate"
        })

    # --------------------------------------------------
    # Visit Charges
    # --------------------------------------------------

    visit_charge = DoctorVisitCharge.objects.filter(
        doctor=doctor,
        visit_type__name__iexact=appointment.consultation_type
    ).first()

    if not visit_charge:
        return JsonResponse({
            "success": False,
            "message": f"No visit charge configured for {appointment.consultation_type}"
        })

    service_charges = service_rate.price
    visit_charges = visit_charge.price

    total_bid_amount = (
        float(service_charges)
        + float(visit_charges)
    )

    bid = DoctorBidding.objects.create(
        appointment=appointment,
        doctor=doctor,
        service_charges=service_charges,
        visit_charges=visit_charges,
        total_bid_amount=total_bid_amount,
        delivery_time=2,
        remarks="Auto-generated based on rate cards",
        bid_status=DoctorBidStatus.PENDING,
        is_active=True
    )

    return JsonResponse({
        "success": True,
        "message": "Bid placed successfully",
        "match_score": match_score,
        "bid": {
            "bid_id": bid.id,
            "service_charges": float(service_charges),
            "visit_charges": float(visit_charges),
            "total_bid_amount": float(total_bid_amount),
            "delivery_time": bid.delivery_time
        }
    })

@require_GET
@dashboard_login_required
def doctor_appointment_details(request, appointment_id):

    appointment = DoctorAppointment.objects.select_related(
        "user__userprofile",
        "address"
    ).filter(
        id=appointment_id
    ).first()

    if not appointment:
        return JsonResponse({
            "success": False,
            "message": "Appointment not found"
        })

    profile = appointment.user.userprofile

    address = appointment.address

    return JsonResponse({
        "success": True,
        "appointment": {

            "id": appointment.id,

            "patient_name":
                f"{profile.first_name} {profile.last_name or ''}",

            "gender": profile.gender,

            "age": profile.age,

            "phone":
                appointment.user.phone_number,

            "address":
                address.address if address else "",

            "consultation_type":
                appointment.consultation_type,

            "appointment_date":
                appointment.preferred_date_time.strftime(
                    "%d/%m/%Y, %I:%M %p"
                ) if appointment.preferred_date_time else "",

            "details":
                appointment.description,

            "budget":
                float(appointment.budget or 0),

            "order_id":
                f"DOC-{appointment.id}"
        }
    })

@require_POST
@dashboard_login_required
def doctor_cancel_bid(request):

    bid_id = request.POST.get("bid_id")

    doctor = DoctorProfile.objects.filter(
        user=request.user_obj
    ).first()

    bid = DoctorBidding.objects.filter(
        id=bid_id,
        doctor=doctor
    ).first()

    if not bid:
        return JsonResponse({
            "success": False,
            "message": "Bid not found"
        })

    was_accepted = (
        bid.bid_status == DoctorBidStatus.ACCEPTED
    )

    bid.bid_status = "cancelled"
    bid.is_active = False
    bid.save()

    if was_accepted:

        appointment = bid.appointment

        appointment.status = "Pending"
        appointment.doctor = None
        appointment.save()

    return JsonResponse({
        "success": True,
        "appointment_reset": was_accepted
    })

@require_POST
@dashboard_login_required
def doctor_complete_appointment(request):

    appointment_id = request.POST.get("appointment_id")

    doctor = DoctorProfile.objects.filter(
        user=request.user_obj
    ).first()

    appointment = DoctorAppointment.objects.filter(
        id=appointment_id,
        doctor=doctor,
        status="Accepted"
    ).first()

    if not appointment:
        return JsonResponse({
            "success": False,
            "message": "Appointment not found"
        })

    appointment.status = "Completed"
    appointment.save()

    DoctorBidding.objects.filter(
        appointment=appointment,
        bid_status=DoctorBidStatus.ACCEPTED
    ).update(
        bid_status="completed"
    )

    return JsonResponse({
        "success": True,
        "message": "Appointment marked as completed"
    })

@require_POST
@dashboard_login_required
def doctor_no_show_appointment(request):

    appointment_id = request.POST.get("appointment_id")

    doctor = DoctorProfile.objects.filter(
        user=request.user_obj
    ).first()

    appointment = DoctorAppointment.objects.filter(
        id=appointment_id,
        doctor=doctor,
        status="Accepted"
    ).first()

    if not appointment:
        return JsonResponse({
            "success": False,
            "message": "Appointment not found"
        })

    appointment.status = "No_Show"
    appointment.save()

    DoctorBidding.objects.filter(
        appointment=appointment,
        bid_status=DoctorBidStatus.ACCEPTED
    ).update(
        bid_status="no_show"
    )

    return JsonResponse({
        "success": True,
        "message": "Appointment marked as no-show"
    })

