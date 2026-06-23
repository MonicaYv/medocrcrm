from django.core.paginator import Paginator
from django.db.models import Prefetch, Q
from django.http import JsonResponse
from django.shortcuts import render
from django.template.loader import render_to_string
from dashboard.utils import dashboard_login_required, get_common_context, get_theme_colors
from orders.models import OrderStatusChoices, PurchaseMedicine, UserPurchase
from django.views.decorators.http import require_POST
from appointments.models import LabAppointments, AppointmentStatus, DoctorAppointment, LabAppointments, HospitalAppointments
from registration.models import LabProfile, HospitalProfile, DoctorProfile, PharmacyProfile
from services.models import (
    HospitalBidding,
    HospitalRoomRateCard,
    DoctorBidding,
    DoctorBidStatus,
    LabBidding,
    LabBidStatus,
)
# Create your views here.

@dashboard_login_required
def history(request):
    user = request.user_obj
    context = get_common_context(request,user)
    if user.user_type == 'pharmacy':
        pharmacy_profile = PharmacyProfile.objects.filter(user=user).first()
        order_scope = Q(assigned_pharmacy=pharmacy_profile)

        base_orders = (
            UserPurchase.objects
            .filter(order_scope)
            .defer(
                "prescriptions",
                "doctor_name",
                "patient_name",
            )
            .select_related(
                "user",
                "user__userprofile",
                "assigned_pharmacy",
                "address",
                "address__city",
                "address__state",
            )
            .prefetch_related(
                Prefetch(
                    "medicines",
                    queryset=PurchaseMedicine.objects.defer("mongo_snapshot"),
                )
            )
            .order_by("-updated_at", "-created_at")
        )

        context.update({
            "pending_orders": base_orders.filter(
                order_status=OrderStatusChoices.PENDING
            ),

            "accepted_orders": base_orders.filter(
                order_status=OrderStatusChoices.CONFIRMED
            ),

            "completed_orders": base_orders.filter(
                order_status=OrderStatusChoices.DELIVERED
            ),

            "cancelled_orders": base_orders.filter(
                order_status=OrderStatusChoices.CANCELLED
            ),
        })
        return render(request, 'pharmacy/history.html', context)
    elif user.user_type == 'lab':
        return render(request, 'lab/history.html', context)
    elif user.user_type == 'hospital':

        hospital = HospitalProfile.objects.filter(
            user=user
        ).first()

        bed_inventory = HospitalRoomRateCard.objects.filter(
            hospital=hospital,
            is_active=True
        ).select_related(
            "bed_room"
        )

        context.update({
            "bed_inventory": bed_inventory
        })

        return render(
            request,
            'hospital/history.html',
            context
        )
    elif user.user_type == 'doctor':
        return render(request, 'doctor/history.html', context)
    
    
@dashboard_login_required
def doctor_history_view(request):
    user = request.user_obj

    context = get_common_context(request, user)
    context["theme_colors"] = get_theme_colors("doctor")

    return render(
        request,
        "doctor/doctor_history.html",
        context
    )

@dashboard_login_required
def ajax_doctor_history(request):
    user = request.user_obj
    status = request.GET.get("status", "accepted").strip().lower()
    page_number = request.GET.get("page", 1)

    doctor = DoctorProfile.objects.filter(
        user=user
    ).first()
    if status == "canceled":
        status = "cancelled"

    qs = DoctorAppointment.objects.select_related(
        "user__userprofile",
        "address",
        "user",
    )

    if status == "pending":

        qs = qs.filter(
            bids__doctor=doctor,
            doctor__isnull=True,
            status="Pending"
        ).distinct()

    elif status == "accepted":

        qs = qs.filter(
            doctor=doctor,
            status="Accepted"
        )

    elif status == "completed":

        qs = qs.filter(
            doctor=doctor,
            status="Completed"
        )

    elif status == "cancelled":

        qs = qs.filter(
            doctor=doctor,
            status="Cancelled"
        )

    elif status == "all":

        qs = qs.filter(
            Q(bids__doctor=doctor) |
            Q(doctor=doctor)
        ).distinct()

    else:
        qs = qs.none()

    qs = qs.order_by("-created_at")

    paginator = Paginator(qs, 5)
    page_obj = paginator.get_page(page_number)

    html = render_to_string(
        "doctor/doctor-history-cards.html",
        {
            "appointments": page_obj,
            "page_obj": page_obj,
        },
        request=request,
    )

    return JsonResponse({
        "html": html,
        "current_page": page_obj.number,
        "total_pages": paginator.num_pages,
        "has_next": page_obj.has_next(),
        "has_prev": page_obj.has_previous(),
    })

@dashboard_login_required
def ajax_lab_history(request):
    user = request.user_obj

    status = request.GET.get("status", "accepted").strip().lower()
    page_number = request.GET.get("page", 1)

    if status == "canceled":
        status = "cancelled"

    lab = LabProfile.objects.filter(
        user=user
    ).first()

    qs = LabAppointments.objects.select_related(
        "user__userprofile",
        "test_package",
        "test_type",
        "test_description",
        "address",
        "user",
    )

    if status == "pending":

        qs = qs.filter(
            lab_bids__lab=lab,
            status=AppointmentStatus.PENDING,
            accepted_bid__isnull=True,
            accepted_lab__isnull=True,
        ).distinct()

    elif status == "accepted":

        qs = qs.filter(
            accepted_lab=lab,
            status=AppointmentStatus.ACCEPTED
        )

    elif status == "completed":

        qs = qs.filter(
            accepted_lab=lab,
            status=AppointmentStatus.COMPLETED
        )

    elif status == "cancelled":

        qs = qs.filter(
            accepted_lab=lab,
            status=AppointmentStatus.CANCELLED
        )

    elif status == "all":

        qs = qs.filter(
            Q(lab_bids__lab=lab) |
            Q(accepted_lab=lab)
        ).distinct()

    else:
        qs = qs.none()

    qs = qs.order_by("-created_at")
    print("STATUS =", status)
    print("COUNT =", qs.count())
    for a in qs:
        print(
            a.id,
            a.status,
            a.accepted_lab_id,
            a.accepted_bid_id
        )
    paginator = Paginator(qs, 5)
    page_obj = paginator.get_page(page_number)

    html = render_to_string(
        "lab/lab_history_cards.html",
        {
            "appointments": page_obj,
            "page_obj": page_obj,
        },
        request=request,
    )

    return JsonResponse({
        "html": html,
        "current_page": page_obj.number,
        "total_pages": paginator.num_pages,
        "has_next": page_obj.has_next(),
        "has_prev": page_obj.has_previous(),
    })

@dashboard_login_required
def ajax_hospital_history(request):
    user = request.user_obj
    status = request.GET.get("status", "accepted").strip().lower()
    page_number = request.GET.get("page", 1)

    if status == "canceled":
        status = "cancelled"
    hospital = HospitalProfile.objects.filter(
        user=user
    ).first()
    qs = HospitalAppointments.objects.select_related(
        "user__userprofile",
        "address",
        "user",
    )

    if status == "pending":

        qs = qs.filter(
            hospital_bids__hospital=hospital,
            accepted_bid__isnull=True,
            accepted_hospital__isnull=True,
            status="Pending"
        ).distinct()

    elif status == "accepted":

        qs = qs.filter(
            accepted_hospital=hospital,
            status="Accepted"
        )

    elif status == "completed":

        qs = qs.filter(
            accepted_hospital=hospital,
            status="Completed"
        )

    elif status == "cancelled":

        qs = qs.filter(
            accepted_hospital=hospital,
            status="Cancelled"
        )

    elif status == "all":

        qs = qs.filter(
            Q(hospital_bids__hospital=hospital) |
            Q(accepted_hospital=hospital)
        ).distinct()

    else:
        qs = qs.none()

    qs = qs.order_by("-created_at")

    paginator = Paginator(qs, 5)
    page_obj = paginator.get_page(page_number)

    html = render_to_string(
        "hospital/hospital_history_cards.html",
        {
            "appointments": page_obj,
            "page_obj": page_obj,
        },
        request=request,
    )

    return JsonResponse({
        "html": html,
        "current_page": page_obj.number,
        "total_pages": paginator.num_pages,
        "has_next": page_obj.has_next(),
        "has_prev": page_obj.has_previous(),
    })

@require_POST
@dashboard_login_required
def cancel_bid(request):
    user = request.user_obj
    user_type = user.user_type

    bid_id = request.POST.get("bid_id")

    # ── LAB ───────────────────────────────────────────
    if user_type == "lab":
        lab = LabProfile.objects.filter(user=user).first()
        bid = LabBidding.objects.filter(id=bid_id, lab=lab).first()
        if not bid:
            return JsonResponse({"success": False, "message": "Bid not found"})

        if bid.bid_status not in [LabBidStatus.PENDING, LabBidStatus.ACCEPTED]:
            return JsonResponse({"success": False, "message": "Only pending or accepted bids can be cancelled"})

        was_accepted = bid.bid_status == LabBidStatus.ACCEPTED
        bid.bid_status = LabBidStatus.CANCELLED
        bid.is_active = False
        bid.save()

        if was_accepted:
            appointment = bid.appointment
            appointment.status = "Pending"
            appointment.accepted_bid_id = None
            appointment.accepted_lab_id = None
            appointment.accepted_total_amount = None
            appointment.save()

        return JsonResponse({"success": True, "appointment_reset": was_accepted})

    # ── HOSPITAL ──────────────────────────────────────
    elif user_type == "hospital":
        hospital = HospitalProfile.objects.filter(user=user).first()
        bid = HospitalBidding.objects.filter(id=bid_id, hospital=hospital).first()
        if not bid:
            return JsonResponse({"success": False, "message": "Bid not found"})

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

        return JsonResponse({"success": True, "message": "Bid cancelled successfully"})

    # ── DOCTOR ────────────────────────────────────────
    elif user_type == "doctor":
        doctor = DoctorProfile.objects.filter(user=user).first()
        bid = DoctorBidding.objects.filter(id=bid_id, doctor=doctor).first()
        if not bid:
            return JsonResponse({"success": False, "message": "Bid not found"})

        was_accepted = bid.bid_status == DoctorBidStatus.ACCEPTED
        bid.bid_status = "cancelled"
        bid.is_active = False
        bid.save()

        if was_accepted:
            appointment = bid.appointment
            appointment.status = "Pending"
            appointment.doctor = None
            appointment.save()

        return JsonResponse({"success": True, "appointment_reset": was_accepted})

    return JsonResponse({"success": False, "message": "Invalid user type"})


@require_POST
@dashboard_login_required
def complete_appointment(request):
    user = request.user_obj
    user_type = user.user_type

    appointment_id = request.POST.get("appointment_id")

    # ── LAB ───────────────────────────────────────────
    if user_type == "lab":
        lab = LabProfile.objects.filter(user=user).first()

        # Lab completes via bid_id since that's the accepted entity
        bid_id = request.POST.get("bid_id")
        bid = LabBidding.objects.filter(
            id=bid_id, lab=lab, bid_status=LabBidStatus.ACCEPTED
        ).first()

        if not bid:
            return JsonResponse({"success": False, "message": "Accepted bid not found"})

        bid.bid_status = LabBidStatus.COMPLETED
        bid.save()

        appointment = bid.appointment
        if appointment:
            appointment.status = "Completed"
            appointment.save()

        return JsonResponse({
            "success": True,
            "message": "Appointment completed successfully",
            "bid_id": bid.id,
            "appointment_id": bid.appointment_id,
        })

    # ── HOSPITAL ──────────────────────────────────────
    elif user_type == "hospital":
        hospital = HospitalProfile.objects.filter(user=user).first()
        appointment = HospitalAppointments.objects.filter(
            id=appointment_id, accepted_hospital=hospital
        ).first()

        if not appointment:
            return JsonResponse({"success": False, "message": "Appointment not found"})
        if appointment.status != "Accepted":
            return JsonResponse({"success": False, "message": "Only accepted appointments can be completed"})

        appointment.status = "Completed"
        appointment.save()

        if appointment.accepted_bid:
            appointment.accepted_bid.bid_status = "Completed"
            appointment.accepted_bid.save()

        return JsonResponse({"success": True, "message": "Appointment completed successfully"})

    # ── DOCTOR ────────────────────────────────────────
    elif user_type == "doctor":
        doctor = DoctorProfile.objects.filter(user=user).first()
        appointment = DoctorAppointment.objects.filter(
            id=appointment_id, doctor=doctor, status="Accepted"
        ).first()

        if not appointment:
            return JsonResponse({"success": False, "message": "Appointment not found"})

        appointment.status = "Completed"
        appointment.save()

        DoctorBidding.objects.filter(
            appointment=appointment, bid_status=DoctorBidStatus.ACCEPTED
        ).update(bid_status="completed")

        return JsonResponse({"success": True, "message": "Appointment marked as completed"})

    return JsonResponse({"success": False, "message": "Invalid user type"})


@require_POST
@dashboard_login_required
def no_show_appointment(request):
    user = request.user_obj
    user_type = user.user_type

    appointment_id = request.POST.get("appointment_id")

    # ── LAB ───────────────────────────────────────────
    if user_type == "lab":
        lab = LabProfile.objects.filter(user=user).first()

        bid_id = request.POST.get("bid_id")
        bid = LabBidding.objects.filter(
            id=bid_id, lab=lab, bid_status=LabBidStatus.ACCEPTED
        ).first()

        if not bid:
            return JsonResponse({"success": False, "message": "Accepted bid not found"})

        # Per FastAPI logic: bid status stays accepted, only appointment is updated
        appointment = bid.appointment
        if appointment:
            appointment.status = "No_Show"
            appointment.save()

        return JsonResponse({
            "success": True,
            "message": "Appointment marked as no-show",
            "bid_id": bid.id,
            "appointment_id": bid.appointment_id,
        })

    # ── HOSPITAL ──────────────────────────────────────
    elif user_type == "hospital":
        hospital = HospitalProfile.objects.filter(user=user).first()
        appointment = HospitalAppointments.objects.filter(
            id=appointment_id, accepted_hospital=hospital
        ).first()

        if not appointment:
            return JsonResponse({"success": False, "message": "Appointment not found"})
        if appointment.status != "Accepted":
            return JsonResponse({"success": False, "message": "Only accepted appointments can be marked no-show"})

        appointment.status = "No_Show"
        appointment.save()

        if appointment.accepted_bid:
            appointment.accepted_bid.bid_status = "No_Show"
            appointment.accepted_bid.save()

        return JsonResponse({"success": True, "message": "Appointment marked as no-show"})

    # ── DOCTOR ────────────────────────────────────────
    elif user_type == "doctor":
        doctor = DoctorProfile.objects.filter(user=user).first()
        appointment = DoctorAppointment.objects.filter(
            id=appointment_id, doctor=doctor, status="Accepted"
        ).first()

        if not appointment:
            return JsonResponse({"success": False, "message": "Appointment not found"})

        appointment.status = "No_Show"
        appointment.save()

        DoctorBidding.objects.filter(
            appointment=appointment, bid_status=DoctorBidStatus.ACCEPTED
        ).update(bid_status="no_show")

        return JsonResponse({"success": True, "message": "Appointment marked as no-show"})

    return JsonResponse({"success": False, "message": "Invalid user type"})


