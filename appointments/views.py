from django.http import JsonResponse
from django.shortcuts import render
from django.template.loader import render_to_string
from django.core.paginator import Paginator
from django.db.models import Q
from django.db.models import Value
from django.db.models.functions import Concat
from django.utils import timezone
from datetime import date, timedelta
from registration.models import DoctorProfile, LabProfile, DoctorSpeciality
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
from .models import HealthIssue, SpecializationServiceMap, HealthIssueServiceMap


def _normalized_label(value):
    """Normalize labels shared by legacy and newer service master tables."""
    return " ".join(
        str(value or "")
        .strip()
        .lower()
        .replace("_", " ")
        .replace("-", " ")
        .split()
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
    date_filter = request.GET.get("date_filter", "").strip().lower()
    selected_date = request.GET.get("date", "").strip()

    if search:
       search = search.strip()

    # Remove Pt. prefix
       if search.lower().startswith("pt."):
            search = search[3:].strip()

       elif search.lower().startswith("pt"):
            search = search[2:].strip()

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
        

        qs = qs.annotate(
           full_name=Concat(
            "user__userprofile__first_name",
             Value(" "),
            "user__userprofile__last_name",
            )
        )

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

    if date_filter:
        today = timezone.localdate()
        if date_filter == "week":
            qs = qs.filter(created_at__date__gte=today - timedelta(days=6), created_at__date__lte=today)
        elif date_filter == "month":
            qs = qs.filter(created_at__year=today.year, created_at__month=today.month)
        elif date_filter == "year":
            qs = qs.filter(created_at__year=today.year)
        elif date_filter == "custom" and selected_date:
            try:
                qs = qs.filter(created_at__date=date.fromisoformat(selected_date))
            except ValueError:
                return JsonResponse({"error": "Invalid date filter."}, status=400)
    if search:

        if user_type == "lab":
            qs = qs.filter(
                # Q(user__userprofile__first_name__icontains=search) |
                # Q(user__userprofile__last_name__icontains=search) |
                Q(full_name__icontains=search) |
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

        # Lab appointments use the legacy ``labtest_packages`` table, while
        # lab rate cards use ``lab_test_package_master``. The IDs therefore
        # are not guaranteed to be the same; prefer the package name and use
        # the ID as a backwards-compatible fallback for old shared data.
        package_name = appointment.test_package.packages if appointment.test_package else ""
        package_label = _normalized_label(package_name)
        description_label = _normalized_label(
            appointment.test_description.description
            if appointment.test_description else ""
        )
        category_label = _normalized_label(
            appointment.test_type.name if appointment.test_type else ""
        )

        # Some installations contain rate cards created before is_active was
        # added. Treat NULL as active, but continue to exclude explicitly
        # disabled cards.
        package_rates = list(
            LabRatePackage.objects.filter(
                lab=lab,
            ).filter(
                Q(is_active=True) | Q(is_active__isnull=True)
            ).select_related("category", "package")
        )

        def package_matches(rate):
            rate_package_label = _normalized_label(rate.package.name)
            return (
                rate_package_label == package_label
                or rate_package_label == description_label
                or (
                    package_label
                    and (
                        package_label in rate_package_label
                        or rate_package_label in package_label
                    )
                )
                or (
                    description_label
                    and (
                        description_label in rate_package_label
                        or rate_package_label in description_label
                    )
                )
            )

        def category_matches(rate):
            return (
                _normalized_label(rate.category.name) == category_label
                or rate.category_id == appointment.test_type_id
            )

        # Prefer the exact package, then legacy shared IDs, then the package
        # category. The category fallback supports appointments created from
        # the older lab master tables whose package IDs cannot be translated.
        package_matches_by_name = [rate for rate in package_rates if package_matches(rate)]
        rate_package = None
        if package_matches_by_name:
            category_package_rates = [
                rate for rate in package_matches_by_name if category_matches(rate)
            ]
            rate_package = min(
                category_package_rates or package_matches_by_name,
                key=lambda rate: rate.price,
            )
        else:
            legacy_id_rates = [
                rate for rate in package_rates
                if rate.package_id == appointment.test_package_id
            ]
            category_rates = [rate for rate in package_rates if category_matches(rate)]
            # The legacy package catalog contains more entries than the
            # current rate-card catalog. If the requested legacy package has
            # no one-to-one translation, use the lab's category rate and then
            # its lowest configured package rate as a final fallback.
            candidates = legacy_id_rates or category_rates or package_rates
            if candidates:
                rate_package = min(candidates, key=lambda rate: rate.price)

        if not rate_package:
            return JsonResponse({
                "success": False,
                "message": "No matching rate package found for this appointment.",
                "missing_ratecard": {
                    "package_id": appointment.test_package_id,
                    "package_name": package_name or None,
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

        active_rate_cards = Q(is_active=True) | Q(is_active__isnull=True)
        service_rates = list(
            HospitalServiceRateCard.objects.filter(
                hospital=hospital,
            ).filter(active_rate_cards).select_related("category", "description")
        )
        room_rates = list(
            HospitalRoomRateCard.objects.filter(
                hospital=hospital,
            ).filter(active_rate_cards).select_related("bed_room")
        )

        # Match IDs first, then labels for records created against an older
        # copy of the hospital master data. The category and description must
        # still come from the same rate card.
        category_label = _normalized_label(
            appointment.category.name if appointment.category else ""
        )
        description_label = _normalized_label(
            appointment.description.description if appointment.description else ""
        )
        service_rate = next(
            (
                rate for rate in service_rates
                if rate.category_id == appointment.category_id
                and rate.description_id == appointment.description_id
            ),
            None,
        )
        if service_rate is None:
            service_rate = next(
                (
                    rate for rate in service_rates
                    if _normalized_label(rate.category.name) == category_label
                    and _normalized_label(rate.description.description) == description_label
                ),
                None,
            )
        if service_rate is None:
            category_rates = [
                rate for rate in service_rates
                if rate.category_id == appointment.category_id
                or _normalized_label(rate.category.name) == category_label
            ]
            description_rates = [
                rate for rate in service_rates
                if rate.description_id == appointment.description_id
                or _normalized_label(rate.description.description) == description_label
            ]
            # Preserve the requested category whenever possible. This keeps
            # old appointments usable even when their description was saved
            # from a different version of the hospital master data.
            candidates = category_rates or description_rates or service_rates
            if candidates:
                service_rate = min(candidates, key=lambda rate: rate.price)
        if not service_rate:
            return JsonResponse({"success": False, "message": "Hospital does not have matching service rate card"})

        room_rate = None
        if appointment.bed_room:
            room_rate = next(
                (
                    rate for rate in room_rates
                    if rate.bed_room_id == appointment.bed_room_id
                    or _normalized_label(rate.bed_room.name)
                    == _normalized_label(appointment.bed_room.name)
                ),
                None,
            )

        service_charges = service_rate.price
        room_charges = room_rate.price if room_rate else 0
        total_bid_amount = service_charges + room_charges
        match_score = 80 + (20 if room_rate else 0)

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

        service_rates = list(
            DoctorServiceRate.objects.filter(doctor=doctor)
            .select_related("category", "service")
        )
        if not service_rates:
            return JsonResponse({"success": False, "message": "Doctor has no service rates configured"})

        appointment_specialization_ids = {
            int(value) for value in (appointment.specialization_ids or [])
            if str(value).isdigit()
        }
        appointment_health_issue_ids = {
            int(value) for value in (appointment.health_issue_ids or [])
            if str(value).isdigit()
        }

        # Appointment IDs and rate-card IDs belong to different master tables.
        # Resolve them through the mappings created for this purpose.
        mapped_category_ids = set(
            SpecializationServiceMap.objects.filter(
                specialization_id__in=appointment_specialization_ids
            ).values_list("service_category_id", flat=True)
        )
        mapped_service_ids = set(
            HealthIssueServiceMap.objects.filter(
                health_issue_id__in=appointment_health_issue_ids
            ).values_list("service_id", flat=True)
        )

        specialization_names = {
            _normalized_label(name)
            for name in DoctorSpeciality.objects.filter(
                id__in=appointment_specialization_ids
            ).values_list("name", flat=True)
        }
        health_issue_names = {
            _normalized_label(name)
            for name in HealthIssue.objects.filter(
                id__in=appointment_health_issue_ids
            ).values_list("name", flat=True)
        }

        rate_category_ids = {rate.category_id for rate in service_rates}
        rate_service_ids = {rate.service_id for rate in service_rates}
        # Backwards compatibility for installations that predate the mapping
        # rows, without treating unrelated IDs as a match.
        mapped_category_ids.update(appointment_specialization_ids & rate_category_ids)
        mapped_service_ids.update(appointment_health_issue_ids & rate_service_ids)

        matching_category_ids = {
            rate.category_id
            for rate in service_rates
            if rate.category_id in mapped_category_ids
            or _normalized_label(rate.category.name) in specialization_names
        }
        matching_service_ids = {
            rate.service_id
            for rate in service_rates
            if rate.service_id in mapped_service_ids
            or _normalized_label(rate.service.name) in health_issue_names
        }

        specialization_match = bool(matching_category_ids)
        service_match = bool(matching_service_ids)

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

        service_rate = next(
            (
                rate for rate in sorted(service_rates, key=lambda item: item.price)
                if rate.category_id in matching_category_ids
                and rate.service_id in matching_service_ids
            ),
            None,
        )
        if not service_rate:
            return JsonResponse({"success": False, "message": "Doctor does not have matching service rate"})

        visit_charge = next(
            (
                charge for charge in DoctorVisitCharge.objects.filter(doctor=doctor).select_related("visit_type")
                if _normalized_label(charge.visit_type.name)
                == _normalized_label(appointment.consultation_type)
            ),
            None,
        )
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
