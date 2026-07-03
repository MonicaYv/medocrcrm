from django.http import JsonResponse
from django.shortcuts import render
from django.template.loader import render_to_string
from django.core.paginator import Paginator
from django.db.models import Q
from registration.models import DoctorProfile, LabProfile
from django.views.decorators.http import require_GET, require_POST
from dashboard.models import SettingMenu
from dashboard.utils import (
    dashboard_login_required,
    get_common_context,
    get_theme_colors,
)
from appointments.utils import get_appointment_stats
from .models import (
    DoctorAppointment,
    LabAppointments,
    HospitalAppointments,
    AppointmentStatus,
)
from services.models import HospitalBidding
from registration.models import HospitalProfile
from appointments.models import HospitalAppointments, HospitalAppointmentStatus
from services.models import (
    HospitalBidding,
    HospitalServiceRateCard,
    HospitalRoomRateCard,
    HospitalBidStatus,
    DoctorBidding,
    DoctorBidStatus,
    DoctorServiceRate,
    DoctorVisitCharge,
    LabBidding,
    LabBidStatus,
    LabRatePackage,
)

# ======================================================
# MAIN APPOINTMENT PAGE
# ======================================================

@dashboard_login_required
def appointment_view(request):
    user = request.user_obj
    user_type = user.user_type

    menu_items = SettingMenu.objects.filter(
        is_active=True,
        user_types__contains=[user_type]
    ).order_by("order")

    context = get_common_context(request, user)
    context["theme_colors"] = get_theme_colors(user_type)
    context["sidebar_menu"] = menu_items

    stats = get_appointment_stats(user_type, user)

    context.update({
        "total_appointments": stats.get("total", 0),
        "pending_appointments": stats.get("pending", 0),
        "accepted_appointments": stats.get("accepted", 0),
        "completed_appointments": stats.get("completed", 0),
        "cancelled_appointments": stats.get("cancelled", 0),
        "accepted_appointed_appointments": stats.get("accepted_appointed", 0),
    })

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
# AJAX APPOINTMENTS ENDPOINT
# ======================================================

@dashboard_login_required
def ajax_appointments(request):
    user = request.user_obj
    user_type = user.user_type

    status = request.GET.get("status", "all").strip().lower()
    page_number = request.GET.get("page", 1)
    search = request.GET.get("search", "").strip()

    if status == "canceled":
        status = "cancelled"

    if user_type == "lab":
        lab_profile = LabProfile.objects.filter(user=user).first()

        qs = LabAppointments.objects.select_related(
            "user__userprofile",
            "test_package",
            "test_type",
            "test_description",
            "address",
            "user",
        ).filter(
            status=AppointmentStatus.PENDING
        )

        if lab_profile:
            qs = qs.exclude(
                lab_bids__lab=lab_profile
            ).distinct()

    elif user_type == "doctor":
        doctor_profile = DoctorProfile.objects.filter(user=user).first()
        qs = DoctorAppointment.objects.select_related(
            "user__userprofile",
            "address",
            "user",
        ).filter(status="Pending")
        if doctor_profile:
            qs = qs.exclude(bids__doctor=doctor_profile).distinct()

    elif user_type == "hospital":
        hospital_profile = HospitalProfile.objects.filter(user=user).first()
        qs = HospitalAppointments.objects.select_related(
            "user__userprofile",
            "service_type",
            "description",
            "category",
            "bed_room",
            "address",
            "user",
        ).filter(status=HospitalAppointmentStatus.PENDING)

        if hospital_profile:
            qs = qs.exclude(
                bids__hospital=hospital_profile
            ).distinct()
    else:
        qs = HospitalAppointments.objects.none()

    if status != "all":
        if status == "missed":
            qs = qs.none()
        else:
            qs = qs.filter(status__iexact=status)
    if search:

        if user_type == "lab":
            qs = qs.filter(
                Q(user__userprofile__first_name__icontains=search) |
                Q(user__userprofile__last_name__icontains=search) |
                Q(test_type__name__icontains=search) |
                Q(test_package__packages__icontains=search) |
                Q(service_type__icontains=search) |
                Q(preferred_mode__icontains=search) |
                Q(status__icontains=search)
            )

        elif user_type == "doctor":
            qs = qs.filter(
                Q(user__userprofile__first_name__icontains=search) |
                Q(user__userprofile__last_name__icontains=search) |
                Q(consultation_type__icontains=search) |
                Q(service_type__icontains=search) |
                Q(status__icontains=search)
            )

        elif user_type == "hospital":
            qs = qs.filter(
               Q(user__userprofile__first_name__icontains=search) |
               Q(user__userprofile__last_name__icontains=search) |
               Q(preferred_mode__icontains=search) |
               Q(service_mode__icontains=search) |
               Q(service_type__name__icontains=search) |
               Q(status__icontains=search)
            )

    qs = qs.order_by("-created_at")

    paginator = Paginator(qs, 5)
    page_obj = paginator.get_page(page_number)

    html = render_to_string(
        "partials/appointment-cards-list.html",
        {"appointments": page_obj, "page_obj": page_obj},
        request=request,
    )

    return JsonResponse({
        "html": html,
        "has_next": page_obj.has_next(),
        "has_prev": page_obj.has_previous(),
        "current_page": page_obj.number,
        "total_pages": paginator.num_pages,
    })


# ======================================================
# UNIFIED APPOINTMENT DETAILS
# ======================================================

@require_GET
@dashboard_login_required
def appointment_details(request, appointment_id):
    user = request.user_obj
    user_type = user.user_type

    # ── LAB ───────────────────────────────────────────
    if user_type == "lab":
        appointment = LabAppointments.objects.select_related(
            "user__userprofile",
            "address",
        ).filter(id=appointment_id).first()

        if not appointment:
            return JsonResponse({"success": False, "message": "Appointment not found"})

        profile = appointment.user.userprofile

        return JsonResponse({
            "success": True,
            "appointment": {
                "id": appointment.id,
                "patient_name": f"{profile.first_name} {profile.last_name or ''}",
                "gender": profile.gender,
                "age": profile.age,
                "phone": appointment.user.phone_number,
                "address": appointment.address.address if appointment.address else "",
                "appointment_date": (
                    appointment.preferred_date_time.strftime("%d/%m/%Y, %I:%M %p")
                    if appointment.preferred_date_time else ""
                ),
                "service_type": appointment.service_type,
                "order_id": f"LAB-{appointment.id}",
            }
        })

    # ── DOCTOR ────────────────────────────────────────
    elif user_type == "doctor":
        appointment = DoctorAppointment.objects.select_related(
            "user__userprofile",
            "address",
        ).filter(id=appointment_id).first()

        if not appointment:
            return JsonResponse({"success": False, "message": "Appointment not found"})

        profile = appointment.user.userprofile
        address = appointment.address

        return JsonResponse({
            "success": True,
            "appointment": {
                "id": appointment.id,
                "patient_name": f"{profile.first_name} {profile.last_name or ''}",
                "gender": profile.gender,
                "age": profile.age,
                "phone": appointment.user.phone_number,
                "address": address.address if address else "",
                "consultation_type": appointment.consultation_type,
                "appointment_date": (
                    appointment.preferred_date_time.strftime("%d/%m/%Y, %I:%M %p")
                    if appointment.preferred_date_time else ""
                ),
                "details": appointment.description,
                "budget": float(appointment.budget or 0),
                "order_id": f"DOC-{appointment.id}",
            }
        })

    # ── HOSPITAL ──────────────────────────────────────
    elif user_type == "hospital":
        appointment = HospitalAppointments.objects.select_related(
            "user__userprofile",
            "category",
            "description",
            "bed_room",
            "address",
        ).filter(id=appointment_id).first()

        if not appointment:
            return JsonResponse({"success": False, "message": "Appointment not found"})

        profile = appointment.user.userprofile
        address = appointment.address

        return JsonResponse({
            "success": True,
            "appointment": {
                "id": appointment.id,
                "patient_name": f"{profile.first_name} {profile.last_name or ''}",
                "gender": profile.gender,
                "age": profile.age,
                "phone": appointment.user.phone_number,
                "address": (
                    f"{address.address}, "
                    f"{address.city.name if address.city else ''}, "
                    f"{address.state.name if address.state else ''}, "
                    f"{address.pincode}"
                    if address else ""
                ),
                "visit_type": appointment.preferred_mode.title() if appointment.preferred_mode else "",
                "appointment_date": (
                    appointment.preferred_date_from.strftime("%d/%m/%Y, %I:%M %p")
                    if appointment.preferred_date_from else ""
                ),
                "medical_requirement": appointment.category.name if appointment.category else "",
                "details": appointment.description.description if appointment.description else "",
                "budget": str(appointment.budget if hasattr(appointment, "budget") else "0"),
                "order_id": f"APT-{appointment.id}",
            }
        })

    return JsonResponse({"success": False, "message": "Invalid user type"})


# ======================================================
# UNIFIED BID / APPOINTMENT ACTIONS
# ======================================================

@require_POST
@dashboard_login_required
def place_bid(request):
    user = request.user_obj
    user_type = user.user_type

    appointment_id = request.POST.get("appointment_id")

    # ── LAB ───────────────────────────────────────────
    if user_type == "lab":
        lab = LabProfile.objects.filter(user=user).first()
        if not lab:
            return JsonResponse({"success": False, "message": "Lab profile not found"})

        appointment = LabAppointments.objects.select_related(
            "test_type", "test_package"
        ).filter(id=appointment_id, status="Pending").first()

        if not appointment:
            return JsonResponse({"success": False, "message": "Appointment not found or already closed"})

        if LabBidding.objects.filter(appointment=appointment, lab=lab).exists():
            return JsonResponse({"success": False, "message": "You already placed a bid"})

        # Match rate package by package_id
        rate_package = LabRatePackage.objects.filter(
            lab=lab,
            package_id=appointment.test_package_id,
            is_active=True,
        ).order_by("price").first()

        if not rate_package:
            return JsonResponse({
                "success": False,
                "message": "No matching rate package found for this appointment.",
                "missing_ratecard": {
                    "package_id": appointment.test_package_id,
                    "package_name": appointment.test_package.packages if appointment.test_package else None,
                    "category_id": appointment.test_type_id,
                    "category_name": appointment.test_type.name if appointment.test_type else None,
                },
                "action": "Please add this package in your lab rate cards",
            })

        bid_amount = float(rate_package.price)
        bid_gst = bid_amount * 0.18
        total_amount = bid_amount + bid_gst

        bid = LabBidding.objects.create(
            appointment=appointment,
            lab=lab,
            bid_amount=bid_amount,
            bid_gst=bid_gst,
            total_amount=total_amount,
            delivery_time=24,
            remarks="Auto-generated based on lab rate card",
            bid_status=LabBidStatus.PENDING,
            is_active=True,
        )
        appointment.refresh_from_db()
        print(
            appointment.id,
            appointment.status,
            appointment.accepted_lab_id,
            appointment.accepted_bid_id,
        )
        return JsonResponse({
            "success": True,
            "message": "Bid placed successfully",
            "bid": {
                "bid_id": bid.id,
                "bid_amount": bid_amount,
                "bid_gst": bid_gst,
                "total_amount": total_amount,
                "delivery_time": 24,
            },
        })

    # ── HOSPITAL ──────────────────────────────────────
    elif user_type == "hospital":
        hospital = HospitalProfile.objects.filter(user=user).first()
        if not hospital:
            return JsonResponse({"success": False, "message": "Hospital profile not found"})

        appointment = HospitalAppointments.objects.select_related(
            "category", "description", "bed_room"
        ).filter(id=appointment_id, status=HospitalAppointmentStatus.PENDING).first()

        if not appointment:
            return JsonResponse({"success": False, "message": "Appointment not found or already closed"})

        if HospitalBidding.objects.filter(appointment=appointment, hospital=hospital).exists():
            return JsonResponse({"success": False, "message": "You already placed a bid"})

        service_rates = HospitalServiceRateCard.objects.filter(hospital=hospital, is_active=True)
        room_rates = HospitalRoomRateCard.objects.filter(hospital=hospital, is_active=True)

        service_category_ids = set(service_rates.values_list("category_id", flat=True))
        service_description_ids = set(service_rates.values_list("description_id", flat=True))
        bed_room_ids = set(room_rates.values_list("bed_room_id", flat=True))

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
            return JsonResponse({"success": False, "message": "Hospital does not have matching service rate card"})

        service_rate = service_rates.filter(
            category=appointment.category, description=appointment.description
        ).first()
        if not service_rate:
            return JsonResponse({"success": False, "message": "Matching service rate card not found"})

        room_rate = None
        if appointment.bed_room:
            room_rate = room_rates.filter(bed_room=appointment.bed_room).first()
            if not room_rate:
                return JsonResponse({"success": False, "message": "Room rate card not found"})

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
                "delivery_time": 30,
            },
        })

    # ── DOCTOR ────────────────────────────────────────
    elif user_type == "doctor":
        doctor = DoctorProfile.objects.filter(user=user).first()
        if not doctor:
            return JsonResponse({"success": False, "message": "Doctor profile not found"})

        appointment = DoctorAppointment.objects.filter(id=appointment_id, status="Pending").first()
        if not appointment:
            return JsonResponse({"success": False, "message": "Appointment not found or already closed"})

        if DoctorBidding.objects.filter(appointment=appointment, doctor=doctor).exists():
            return JsonResponse({"success": False, "message": "Bid already placed"})

        service_rates = DoctorServiceRate.objects.filter(doctor=doctor)
        if not service_rates.exists():
            return JsonResponse({"success": False, "message": "Doctor has no service rates configured"})

        doctor_specialization_ids = set(service_rates.values_list("category_id", flat=True))
        doctor_service_ids = set(service_rates.values_list("service_id", flat=True))
        appointment_specializations = set(appointment.specialization_ids or [])
        appointment_health_issues = set(appointment.health_issue_ids or [])

        specialization_match = bool(appointment_specializations.intersection(doctor_specialization_ids))
        service_match = bool(appointment_health_issues.intersection(doctor_service_ids))

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
                "missing": missing,
            })

        service_rate = service_rates.filter(
            category_id__in=appointment.specialization_ids
        ).order_by("price").first()
        if not service_rate:
            return JsonResponse({"success": False, "message": "Doctor does not have matching service rate"})

        visit_charge = DoctorVisitCharge.objects.filter(
            doctor=doctor, visit_type__name__iexact=appointment.consultation_type
        ).first()
        if not visit_charge:
            return JsonResponse({
                "success": False,
                "message": f"No visit charge configured for {appointment.consultation_type}",
            })

        service_charges = service_rate.price
        visit_charges = visit_charge.price
        total_bid_amount = float(service_charges) + float(visit_charges)

        bid = DoctorBidding.objects.create(
            appointment=appointment,
            doctor=doctor,
            service_charges=service_charges,
            visit_charges=visit_charges,
            total_bid_amount=total_bid_amount,
            delivery_time=2,
            remarks="Auto-generated based on rate cards",
            bid_status=DoctorBidStatus.PENDING,
            is_active=True,
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
                "delivery_time": bid.delivery_time,
            },
        })

    return JsonResponse({"success": False, "message": "Invalid user type"})
