from datetime import timedelta

from django.core.paginator import Paginator
from django.db import transaction
from django.db.models import Prefetch, Q
from django.http import JsonResponse
from django.shortcuts import render
from django.template.loader import render_to_string
from django.utils import timezone
from dashboard.utils import dashboard_login_required, get_common_context, get_theme_colors
from orders.models import OrderStatusChoices, PurchaseMedicine, UserPurchase
from django.views.decorators.http import require_POST
from appointments.models import LabAppointments, AppointmentStatus, DoctorAppointment, HospitalAppointments, HospitalAppointmentStatus
from appointments.utils import apply_appointment_date_filter
from registration.models import LabProfile, HospitalProfile, DoctorProfile, PharmacyProfile
from services.models import (
    HospitalBidStatus,
    HospitalBidding,
    HospitalRoomRateCard,
    DoctorBidding,
    DoctorBidStatus,
    LabBidding,
    LabBidStatus,
)
from datetime import datetime, timedelta
from django.utils import timezone

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
        return render(request, 'history/pharmacy/history.html', context)
    elif user.user_type == 'lab':
        return render(request, 'history/lab/history.html', context)
    elif user.user_type == 'hospital':

        hospital = HospitalProfile.objects.filter(
            user=user
        ).first()

        bed_inventory = HospitalRoomRateCard.objects.filter(
            hospital=hospital,
            is_active=True,
        ).select_related(
            "bed_room"
        )

        occupied_bed_room_ids = set(
            HospitalAppointments.objects.filter(
                accepted_hospital=hospital,
                status=HospitalAppointmentStatus.ACCEPTED,
                bed_room__isnull=False,
            ).values_list("bed_room_id", flat=True)
        )
        for bed in bed_inventory:
            bed.is_occupied = bed.bed_room_id in occupied_bed_room_ids

        context.update({
            "bed_inventory": bed_inventory
        })

        return render(
            request,
            'history/hospital/history.html',
            context
        )
    elif user.user_type == 'doctor':
        return render(request, 'history/doctor/history.html', context)
    
    
@dashboard_login_required
def doctor_history_view(request):
    user = request.user_obj

    context = get_common_context(request, user)
    context["theme_colors"] = get_theme_colors("doctor")

    return render(
        request,
        "history/doctor/doctor_history.html",
        context
    )

@dashboard_login_required
def ajax_doctor_history(request):
    user = request.user_obj
    status = request.GET.get("status", "accepted").strip().lower()
    page_number = request.GET.get("page", 1)

    # Date filter - mirrors the contract used by appointments.ajax_appointments.
    date_filter = (
        request.GET.get("date_filter")
        or request.GET.get("filter")
        or ""
    ).strip().lower()
    selected_date = (
        request.GET.get("date", "")
        or request.GET.get("selected_date", "")
        or request.GET.get("filter_date", "")
    ).strip()
    start_date = (
        request.GET.get("start_date", "")
        or request.GET.get("start", "")
    ).strip()
    end_date = (
        request.GET.get("end_date", "")
        or request.GET.get("end", "")
    ).strip()
    if not date_filter and (selected_date or start_date or end_date):
        date_filter = "custom"
    if date_filter in {"month", "year"}:
        window_days = 30 if date_filter == "month" else 365
        today = timezone.localdate()
        start_date = (today - timedelta(days=window_days - 1)).isoformat()
        end_date = today.isoformat()
        date_filter = "custom"

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

        # This tab contains requests the doctor accepted from Appointments
        # and still needs to confirm or cancel. Unclaimed requests remain in
        # the Appointments list.
        qs = qs.filter(
            status=AppointmentStatus.PENDING,
            bids__doctor=doctor,
            bids__bid_status=DoctorBidStatus.PENDING,
            bids__is_active=True,
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
            bids__doctor=doctor,
            bids__bid_status=DoctorBidStatus.CANCELLED,
        ).distinct()

    elif status == "all":

        qs = qs.filter(
            Q(bids__doctor=doctor) |
            Q(doctor=doctor)
        ).distinct()

    else:
        qs = qs.none()

    if date_filter:
        if date_filter == "custom" and not (
            selected_date or start_date or end_date
        ):
            # Custom opened but no date picked yet — don't return an empty list,
            # just show everything until onSelect sends a date.
            pass
        else:
            qs = apply_appointment_date_filter(
                qs, "doctor", date_filter, selected_date,
                start_date=start_date, end_date=end_date,
            ).distinct()

    qs = qs.order_by("-created_at")

    paginator = Paginator(qs, 5)
    page_obj = paginator.get_page(page_number)
    for appointment in page_obj:

        if status == "pending":
            # Prefer this doctor's live pending bid; fall back to their most
            # recent bid so a not-yet-bid appointment still renders a card
            # (the template reads the status from `current_bid`).
            appointment.current_bid = DoctorBidding.objects.filter(
                appointment=appointment,
                doctor=doctor,
                bid_status=DoctorBidStatus.PENDING,
                is_active=True,
            ).first() or DoctorBidding.objects.filter(
                appointment=appointment,
                doctor=doctor,
            ).order_by("-id").first()

        elif status == "accepted":
            appointment.current_bid = DoctorBidding.objects.filter(
                appointment=appointment,
                doctor=doctor,
                bid_status=DoctorBidStatus.ACCEPTED,
            ).first()

        elif status == "completed":
            appointment.current_bid = DoctorBidding.objects.filter(
                appointment=appointment,
                doctor=doctor,
                bid_status=DoctorBidStatus.COMPLETED,
            ).first()

        elif status == "cancelled":
            appointment.current_bid = DoctorBidding.objects.filter(
                appointment=appointment,
                doctor=doctor,
                bid_status=DoctorBidStatus.CANCELLED,
            ).first()

        else:
            appointment.current_bid = DoctorBidding.objects.filter(
                appointment=appointment,
                doctor=doctor,
            ).order_by("-id").first()
    html = render_to_string(
        "history/doctor/doctor-history-cards.html",
        {
            "appointments": page_obj,
            "page_obj": page_obj,
            "current_tab": status,
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
    date_filter = request.GET.get("date_filter", "").strip().lower()
    start_date = (
        request.GET.get("start_date", "")
        or request.GET.get("from_date", "")
    ).strip()
    end_date = (
        request.GET.get("end_date", "")
        or request.GET.get("to_date", "")
    ).strip()

    if status == "canceled":
        status = "cancelled"

    lab = LabProfile.objects.filter(
        user=user
    ).first()
    if not lab:
        return JsonResponse({"error": "Lab profile not found."}, status=403)
    print("LAB =", lab.id)

    bids = LabBidding.objects.filter(lab=lab)

    print("TOTAL BIDS =", bids.count())

    # for b in bids:
    #     print(
    #         "Bid:",
    #         b.id,
    #         "Appointment:", b.appointment_id,
    #         "Status:", b.bid_status,
    #         "Appointment Status:", b.appointment.status,
    #         "Accepted Lab:", b.appointment.accepted_lab_id,
    #         "Accepted Bid:", b.appointment.accepted_bid_id,
    #     )
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
            lab_bids__bid_status=LabBidStatus.PENDING,
            lab_bids__is_active=True,
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
            Q(accepted_lab=lab, status=AppointmentStatus.CANCELLED)
            | Q(lab_bids__lab=lab, lab_bids__bid_status=LabBidStatus.CANCELLED),
        ).distinct()

    elif status == "missed":
        qs = qs.filter(
            accepted_lab=lab,
            status__iexact="No_Show",
        )

    elif status == "all":

        qs = qs.filter(
            Q(lab_bids__lab=lab) |
            Q(accepted_lab=lab)
        ).distinct()

    else:
        qs = qs.none()

    if date_filter:
        qs = apply_appointment_date_filter(
            qs,
            "lab",
            date_filter,
            "",
            start_date=start_date,
            end_date=end_date,
        )

    qs = qs.order_by("-created_at")
    print("STATUS =", status)
    print("COUNT =", qs.count())
    # for a in qs:
    #     print(
    #         a.id,
    #         a.status,
    #         a.accepted_lab_id,
    #         a.accepted_bid_id
    #     )
    paginator = Paginator(qs, 5)
    page_obj = paginator.get_page(page_number)
    for appointment in page_obj:
        if status == "accepted":
            appointment.current_bid = LabBidding.objects.filter(
                appointment=appointment,
                lab=lab,
                bid_status=LabBidStatus.ACCEPTED,
                is_active=True,
            ).first()

        elif status == "cancelled":
            appointment.current_bid = LabBidding.objects.filter(
                appointment=appointment,
                lab=lab,
                bid_status=LabBidStatus.CANCELLED,
            ).first()
            if not appointment.current_bid:
                appointment.current_bid = appointment.accepted_bid

        elif status == "missed":
            appointment.current_bid = LabBidding.objects.filter(
                appointment=appointment,
                lab=lab,
                bid_status=LabBidStatus.ACCEPTED,
            ).first()

        elif status == "pending":
            appointment.current_bid = LabBidding.objects.filter(
                appointment=appointment,
                lab=lab,
                bid_status=LabBidStatus.PENDING,
                is_active=True,
            ).first()

    html = render_to_string(
        "history/lab/lab_history_cards.html",
        {
            "appointments": page_obj,
            "page_obj": page_obj,
            "current_tab": status,
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
        
    date_filter = request.GET.get("date_filter", "").strip().lower()
    from_date = request.GET.get("from_date", "").strip()
    to_date = request.GET.get("to_date", "").strip()
    appointment_status = request.GET.get("appointment_status", "").strip().lower()
    visit_type = request.GET.get("visit_type", "").strip().lower()

    print("HOSPITAL HISTORY FILTERS:", {
        "status": status,
        "date_filter": date_filter,
        "from_date": from_date,
        "to_date": to_date,
        "appointment_status": appointment_status,
        "visit_type": visit_type,
    })


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
            bids__hospital=hospital,
            bids__bid_status=HospitalBidStatus.PENDING,
            bids__is_active=True,
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
            bids__hospital=hospital,
            bids__bid_status=HospitalBidStatus.CANCELLED
        ).distinct()

    elif status == "missed":
        qs = qs.filter(
            accepted_hospital=hospital,
            status=HospitalAppointmentStatus.NO_SHOW,
        )

    elif status == "all":

        qs = qs.filter(
            Q(hospital_bids__hospital=hospital) |
            Q(accepted_hospital=hospital)
        ).distinct()

    else:
        qs = qs.none()

    # Apply filters to the appointment's scheduled date. The history UI sends
    # the custom range as from_date/to_date; accept start_date/end_date too for
    # consistent API callers.
    start_date = from_date or request.GET.get("start_date", "").strip()
    end_date = to_date or request.GET.get("end_date", "").strip()
    if not date_filter and (start_date or end_date):
        date_filter = "custom"
    if date_filter:
        qs = apply_appointment_date_filter(
            qs,
            "hospital",
            date_filter,
            "",
            start_date=start_date,
            end_date=end_date,
        )

    if appointment_status:
        if status == "cancelled":
            if appointment_status in {"accepted", "rejected"}:
                qs = qs.filter(
                    bids__hospital=hospital,
                    bids__bid_status=appointment_status,
                ).distinct()
            elif appointment_status != "all":
                qs = qs.none()
        else:
            status_value = appointment_status.replace("_", " ").strip()
            if status_value == "no show":
                status_value = "No_Show"
            qs = qs.filter(status__iexact=status_value)


    # Apply Visit Type filter
    if visit_type:
        visit_type_value = visit_type.replace("_", "-").strip()

        qs = qs.filter(
            preferred_mode__iexact=visit_type_value
        )
    print("FILTERED APPOINTMENTS COUNT:", qs.count())
    qs = qs.order_by("-created_at")

    paginator = Paginator(qs, 5)
    page_obj = paginator.get_page(page_number)
    for appointment in page_obj:
        bid_qs = HospitalBidding.objects.filter(
            appointment=appointment,
            hospital=hospital,
        )
        if status == "cancelled":
            appointment.current_bid = bid_qs.filter(
                bid_status=HospitalBidStatus.CANCELLED
            ).order_by("-id").first()
        elif status == "pending":
            appointment.current_bid = bid_qs.filter(
                bid_status=HospitalBidStatus.PENDING,
                is_active=True,
            ).order_by("-id").first()
        elif status == "accepted":
            appointment.current_bid = bid_qs.filter(
                bid_status=HospitalBidStatus.ACCEPTED,
                is_active=True,
            ).order_by("-id").first()
        elif status == "completed":
            appointment.current_bid = bid_qs.filter(
                bid_status=HospitalBidStatus.COMPLETED
            ).order_by("-id").first()
        else:
            appointment.current_bid = bid_qs.order_by("-id").first()
    html = render_to_string(
        "history/hospital/hospital_history_cards.html",
        {
            "appointments": page_obj,
            "page_obj": page_obj,
            "current_tab": status,
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
def confirm_appointment(request):
    user = request.user_obj
    user_type = user.user_type
    bid_id = request.POST.get("bid_id")
    requested_appointment_id = request.POST.get("appointment_id")

    if user_type == "lab":
        lab = LabProfile.objects.filter(user=user).first()
        with transaction.atomic():
            bid = LabBidding.objects.filter(
                id=bid_id, lab=lab, bid_status=LabBidStatus.PENDING, is_active=True
            ).first()
            if not bid or (requested_appointment_id and str(bid.appointment_id) != requested_appointment_id):
                return JsonResponse({"success": False, "message": "Pending lab appointment was not found"})
            appointment = LabAppointments.objects.select_for_update().filter(
                id=bid.appointment_id,
                status=AppointmentStatus.PENDING,
                accepted_bid__isnull=True,
                accepted_lab__isnull=True,
            ).first()
            if not appointment:
                return JsonResponse({"success": False, "message": "Appointment was already confirmed or closed"})
            bid = LabBidding.objects.select_for_update().filter(
                id=bid.id, lab=lab, bid_status=LabBidStatus.PENDING, is_active=True
            ).first()
            if not bid:
                return JsonResponse({"success": False, "message": "Pending lab appointment was not found"})

            LabBidding.objects.filter(
                appointment=appointment, bid_status=LabBidStatus.PENDING
            ).exclude(id=bid.id).update(bid_status=LabBidStatus.REJECTED, is_active=False)
            bid.bid_status = LabBidStatus.ACCEPTED
            bid.save(update_fields=["bid_status", "updated_at"])
            appointment.status = AppointmentStatus.ACCEPTED
            appointment.accepted_lab = lab
            appointment.accepted_bid = bid
            appointment.accepted_total_amount = bid.total_amount
            appointment.save(update_fields=[
                "status", "accepted_lab", "accepted_bid", "accepted_total_amount", "updated_at"
            ])

    elif user_type == "hospital":
        hospital = HospitalProfile.objects.filter(user=user).first()
        with transaction.atomic():
            bid = HospitalBidding.objects.filter(
                id=bid_id, hospital=hospital, bid_status=HospitalBidStatus.PENDING, is_active=True
            ).first()
            if not bid or (requested_appointment_id and str(bid.appointment_id) != requested_appointment_id):
                return JsonResponse({"success": False, "message": "Pending hospital appointment was not found"})
            appointment = HospitalAppointments.objects.select_for_update().filter(
                id=bid.appointment_id,
                status=HospitalAppointmentStatus.PENDING,
                accepted_bid__isnull=True,
                accepted_hospital__isnull=True,
            ).first()
            if not appointment:
                return JsonResponse({"success": False, "message": "Appointment was already confirmed or closed"})
            bid = HospitalBidding.objects.select_for_update().filter(
                id=bid.id, hospital=hospital, bid_status=HospitalBidStatus.PENDING, is_active=True
            ).first()
            if not bid:
                return JsonResponse({"success": False, "message": "Pending hospital appointment was not found"})

            HospitalBidding.objects.filter(
                appointment=appointment, bid_status=HospitalBidStatus.PENDING
            ).exclude(id=bid.id).update(bid_status=HospitalBidStatus.REJECTED, is_active=False)
            bid.bid_status = HospitalBidStatus.ACCEPTED
            bid.save(update_fields=["bid_status", "updated_at"])
            appointment.status = HospitalAppointmentStatus.ACCEPTED
            appointment.accepted_hospital = hospital
            appointment.accepted_bid = bid
            appointment.accepted_total_amount = bid.total_bid_amount
            appointment.save(update_fields=[
                "status", "accepted_hospital", "accepted_bid", "accepted_total_amount", "updated_at"
            ])

    elif user_type == "doctor":
        doctor = DoctorProfile.objects.filter(user=user).first()
        with transaction.atomic():
            bid = DoctorBidding.objects.filter(
                id=bid_id, doctor=doctor, bid_status=DoctorBidStatus.PENDING, is_active=True
            ).first()
            if not bid or (requested_appointment_id and str(bid.appointment_id) != requested_appointment_id):
                return JsonResponse({"success": False, "message": "Pending doctor appointment was not found"})
            appointment = DoctorAppointment.objects.select_for_update().filter(
                id=bid.appointment_id, status=AppointmentStatus.PENDING
            ).first()
            if not appointment:
                return JsonResponse({"success": False, "message": "Appointment was already confirmed or closed"})
            bid = DoctorBidding.objects.select_for_update().filter(
                id=bid.id, doctor=doctor, bid_status=DoctorBidStatus.PENDING, is_active=True
            ).first()
            if not bid:
                return JsonResponse({"success": False, "message": "Pending doctor appointment was not found"})

            DoctorBidding.objects.filter(
                appointment=appointment, bid_status=DoctorBidStatus.PENDING
            ).exclude(id=bid.id).update(bid_status=DoctorBidStatus.REJECTED, is_active=False)
            bid.bid_status = DoctorBidStatus.ACCEPTED
            bid.save(update_fields=["bid_status", "updated_at"])
            appointment.status = AppointmentStatus.ACCEPTED
            appointment.doctor = doctor
            appointment.save(update_fields=["status", "doctor"])

    else:
        return JsonResponse({"success": False, "message": "Invalid user type"})

    return JsonResponse({"success": True, "message": "Appointment confirmed and moved to Accepted history"})


@require_POST
@dashboard_login_required
def cancel_bid(request):
    user = request.user_obj
    user_type = user.user_type

    bid_id = request.POST.get("bid_id")
    appointment_id = request.POST.get("appointment_id")

    # ── LAB ───────────────────────────────────────────
    if user_type == "lab":
        lab = LabProfile.objects.filter(user=user).first()
        bid_qs = LabBidding.objects.filter(lab=lab)
        bid = bid_qs.filter(id=bid_id).first() if bid_id else None
        if not bid and appointment_id:
            bid = bid_qs.filter(
                appointment_id=appointment_id,
                bid_status=LabBidStatus.ACCEPTED,
            ).order_by("-id").first()
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
        bid_qs = HospitalBidding.objects.filter(hospital=hospital)
        bid = bid_qs.filter(id=bid_id).first() if bid_id else None
        if not bid and appointment_id:
            bid = bid_qs.filter(
                appointment_id=appointment_id,
                bid_status=HospitalBidStatus.ACCEPTED,
            ).order_by("-id").first()
        if not bid:
            return JsonResponse({"success": False, "message": "Bid not found"})

        was_accepted = bid.bid_status == HospitalBidStatus.ACCEPTED
        bid.bid_status = HospitalBidStatus.CANCELLED
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
        bid_qs = DoctorBidding.objects.filter(doctor=doctor)
        bid = bid_qs.filter(id=bid_id).first() if bid_id else None
        if not bid and appointment_id:
            bid = bid_qs.filter(
                appointment_id=appointment_id,
                bid_status=DoctorBidStatus.ACCEPTED,
            ).order_by("-id").first()
        if not bid:
            return JsonResponse({"success": False, "message": "Bid not found"})

        was_accepted = bid.bid_status == DoctorBidStatus.ACCEPTED
        bid.bid_status = DoctorBidStatus.CANCELLED
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

        bid_id = request.POST.get("bid_id")
        with transaction.atomic():
            bid = LabBidding.objects.select_for_update().filter(
                id=bid_id, lab=lab, bid_status=LabBidStatus.ACCEPTED
            ).first()
            if not bid:
                return JsonResponse({"success": False, "message": "Accepted bid not found"})

            appointment = LabAppointments.objects.select_for_update().filter(
                id=bid.appointment_id,
                accepted_lab=lab,
                accepted_bid=bid,
                status=AppointmentStatus.ACCEPTED,
            ).first()
            if not appointment:
                return JsonResponse({"success": False, "message": "Accepted appointment not found"})

            bid.bid_status = LabBidStatus.COMPLETED
            bid.save(update_fields=["bid_status", "updated_at"])
            appointment.status = AppointmentStatus.COMPLETED
            appointment.save(update_fields=["status", "updated_at"])

        return JsonResponse({
            "success": True,
            "message": "Appointment completed successfully",
            "bid_id": bid.id,
            "appointment_id": bid.appointment_id,
        })

    # ── HOSPITAL ──────────────────────────────────────
    elif user_type == "hospital":
        hospital = HospitalProfile.objects.filter(user=user).first()
        with transaction.atomic():
            appointment = HospitalAppointments.objects.select_for_update().filter(
                id=appointment_id,
                accepted_hospital=hospital,
                status=HospitalAppointmentStatus.ACCEPTED,
            ).first()
            if not appointment:
                return JsonResponse({"success": False, "message": "Accepted appointment not found"})

            appointment.status = HospitalAppointmentStatus.COMPLETED
            appointment.save(update_fields=["status", "updated_at"])

            if appointment.accepted_bid:
                HospitalBidding.objects.filter(
                    id=appointment.accepted_bid_id,
                    hospital=hospital,
                    bid_status=HospitalBidStatus.ACCEPTED,
                ).update(bid_status=HospitalBidStatus.COMPLETED)

        return JsonResponse({"success": True, "message": "Appointment completed successfully"})

    # ── DOCTOR ────────────────────────────────────────
    elif user_type == "doctor":
        doctor = DoctorProfile.objects.filter(user=user).first()
        with transaction.atomic():
            appointment = DoctorAppointment.objects.select_for_update().filter(
                id=appointment_id,
                doctor=doctor,
                status=AppointmentStatus.ACCEPTED,
            ).first()
            if not appointment:
                return JsonResponse({"success": False, "message": "Accepted appointment not found"})

            appointment.status = AppointmentStatus.COMPLETED
            appointment.save(update_fields=["status"])

            DoctorBidding.objects.filter(
                appointment=appointment,
                doctor=doctor,
                bid_status=DoctorBidStatus.ACCEPTED,
            ).update(bid_status=DoctorBidStatus.COMPLETED)

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
