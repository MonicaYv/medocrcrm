from datetime import timedelta
from collections import defaultdict
import logging
from django.conf import settings

logger = logging.getLogger(__name__)

from django.core.paginator import Paginator
from django.db import transaction
from django.db.models import Count, Prefetch, Q
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
from pymongo.errors import PyMongoError
from datetime import datetime, timedelta
from django.utils import timezone

# Create your views here.


def get_hospital_bed_inventory(hospital, session_assignments=None):
    if not hospital:
        return [], [], ""

    beds = list(
        HospitalRoomRateCard.objects.filter(
            hospital=hospital,
            is_active=True,
        ).select_related("bed_room").order_by("bed_room__name", "bed_no", "id")
    )
    saved_assignments = {}
    beds_by_number = defaultdict(list)
    for bed in beds:
        beds_by_number[str(bed.bed_no)].append(bed)

    ambiguous_assignment_number = [False]

    def save_assignment(assignment):
        if not isinstance(assignment, dict):
            return

        bed_id = assignment.get("bed_id")
        if bed_id:
            saved_assignments.setdefault(str(bed_id), assignment)

        bed_no = assignment.get("bed_no")
        if not bed_no:
            return

        room_id = assignment.get("bed_room_id")
        if room_id:
            saved_assignments.setdefault(f"no_{room_id}_{bed_no}", assignment)
        elif len(beds_by_number[str(bed_no)]) == 1:
            saved_assignments.setdefault(f"no_{bed_no}", assignment)
        else:
            ambiguous_assignment_number[0] = True

    assignment_database_available = False
    mongo_db = getattr(settings, "MONGO_DB", None)
    if mongo_db is not None:
        try:
            assignments = mongo_db["hospital_bed_assignments"].find(
                {
                    "hospital_id": hospital.id,
                    "status": "Occupied",
                },
                {
                    "bed_id": 1,
                    "bed_no": 1,
                    "bed_room_id": 1,
                    "patient_name": 1,
                    "disease": 1,
                },
            )
            for assignment in assignments:
                save_assignment(assignment)
            assignment_database_available = True
        except PyMongoError:
            logger.exception(
                "Unable to load hospital bed assignments for hospital %s",
                hospital.id,
            )

    if isinstance(session_assignments, dict):
        for assignment in session_assignments.values():
            if (
                isinstance(assignment, dict)
                and assignment.get("status") == "Occupied"
            ):
                save_assignment(assignment)

    appointment_counts = dict(
        HospitalAppointments.objects.filter(
            accepted_hospital=hospital,
            status=HospitalAppointmentStatus.ACCEPTED,
            bed_room__isnull=False,
        )
        .values("bed_room_id")
        .annotate(total=Count("id"))
        .values_list("bed_room_id", "total")
    )
    grouped_beds = defaultdict(list)
    for bed in beds:
        assignment = (
            saved_assignments.get(str(bed.id))
            or saved_assignments.get(f"no_{bed.bed_room_id}_{bed.bed_no}")
            or (
                saved_assignments.get(f"no_{bed.bed_no}")
                if len(beds_by_number[str(bed.bed_no)]) == 1
                else None
            )
        )
        bed.assignment = assignment
        bed.is_occupied = bool(assignment)
        bed.assigned_patient = assignment.get("patient_name", "") if assignment else ""
        bed.assigned_disease = assignment.get("disease", "") if assignment else ""
        grouped_beds[bed.bed_room_id].append(bed)

    room_summaries = []
    for bed_room_id, room_beds in grouped_beds.items():
        booked_count = appointment_counts.get(bed_room_id, 0)
        occupied_count = min(
            len(room_beds),
            max(sum(bed.is_occupied for bed in room_beds), booked_count),
        )
        remaining_to_mark = occupied_count - sum(
            bed.is_occupied for bed in room_beds
        )
        for bed in room_beds:
            if remaining_to_mark and not bed.is_occupied:
                bed.is_occupied = True
                remaining_to_mark -= 1

        room = room_beds[0].bed_room
        room_summaries.append({
            "name": room.name,
            "total": len(room_beds),
            "occupied": occupied_count,
            "available": len(room_beds) - occupied_count,
        })

    room_summaries.sort(key=lambda room: room["name"].lower())
    warnings = []
    if not assignment_database_available:
        warnings.append(
            "Manual assignment data may be unavailable; occupancy also includes "
            "confirmed appointments."
        )
    if ambiguous_assignment_number[0]:
        warnings.append(
            "Some manual assignments could not be matched because bed numbers "
            "are shared across room types."
        )
    return beds, room_summaries, " ".join(warnings)


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

        bed_inventory, _, bed_inventory_warning = get_hospital_bed_inventory(
            hospital,
            request.session.get("hospital_bed_assignments", {}),
        )

        context.update({
            "bed_inventory": bed_inventory,
            "bed_inventory_warning": bed_inventory_warning,
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
    bid_status_filter = request.GET.get("bid_status", "").strip().lower()
    visit_type = request.GET.get("visit_type", "").strip().lower()

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

    bid_status_values = {
        "accepted": LabBidStatus.ACCEPTED,
        "rejected": LabBidStatus.REJECTED,
    }
    display_status = (
        bid_status_filter
        if bid_status_filter in bid_status_values or bid_status_filter == "all"
        else status
    )

    # A selected bid status is a report-wide filter. It must be able to show
    # rejected bids, which are intentionally absent from the Pending tab's
    # active-bid query and may belong to an appointment accepted by another lab.
    if bid_status_filter in bid_status_values:
        qs = qs.filter(
            lab_bids__lab=lab,
            lab_bids__bid_status=bid_status_values[bid_status_filter],
        ).distinct()
    elif bid_status_filter == "all":
        qs = qs.filter(Q(lab_bids__lab=lab) | Q(accepted_lab=lab)).distinct()
    elif status == "pending":

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

    if visit_type == "home":
        # Lab appointments store modes such as ``Home_sample``; match the
        # stable mode prefix as well as older home-service values.
        qs = qs.filter(preferred_mode__icontains="home")
    elif visit_type == "hospital":
        # The UI calls this Hospital, while lab rows commonly store
        # ``Visit_lab`` for the in-lab visit mode.
        qs = qs.filter(
            Q(preferred_mode__icontains="visit")
            | Q(preferred_mode__icontains="hospital")
        )

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
    print("STATUS =", display_status)
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
        if display_status == "accepted":
            appointment.current_bid = LabBidding.objects.filter(
                appointment=appointment,
                lab=lab,
                bid_status=LabBidStatus.ACCEPTED,
                is_active=True,
            ).first()

        elif display_status == "cancelled":
            appointment.current_bid = LabBidding.objects.filter(
                appointment=appointment,
                lab=lab,
                bid_status=LabBidStatus.CANCELLED,
            ).first()
            if not appointment.current_bid:
                appointment.current_bid = appointment.accepted_bid

        elif display_status == "missed":
            appointment.current_bid = LabBidding.objects.filter(
                appointment=appointment,
                lab=lab,
                bid_status=LabBidStatus.ACCEPTED,
            ).first()

        elif display_status == "pending":
            appointment.current_bid = LabBidding.objects.filter(
                appointment=appointment,
                lab=lab,
                bid_status=LabBidStatus.PENDING,
                is_active=True,
            ).first()
        elif display_status == "rejected":
            appointment.current_bid = LabBidding.objects.filter(
                appointment=appointment,
                lab=lab,
                bid_status=LabBidStatus.REJECTED,
            ).first()
        elif display_status == "all":
            appointment.current_bid = LabBidding.objects.filter(
                appointment=appointment,
                lab=lab,
            ).order_by("-updated_at").first() or appointment.accepted_bid

    html = render_to_string(
        "history/lab/lab_history_cards.html",
        {
            "appointments": page_obj,
            "page_obj": page_obj,
            "current_tab": "" if display_status == "all" else display_status,
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

@require_POST
@dashboard_login_required
def assign_bed_patient(request):
    user = request.user_obj
    if user.user_type != "hospital":
        return JsonResponse({"success": False, "message": "Unauthorized"}, status=403)

    hospital = HospitalProfile.objects.filter(user=user).first()
    if not hospital:
        return JsonResponse({"success": False, "message": "Hospital profile not found"}, status=404)

    bed_id = request.POST.get("bed_id", "").strip()
    bed_no = request.POST.get("bed_no", "").strip()
    bed_name = request.POST.get("bed_name", "").strip()
    bed_room_id = request.POST.get("bed_room_id", "").strip()
    patient_name = request.POST.get("patient_name", "").strip()
    disease = request.POST.get("disease", "").strip()

    if not patient_name:
        return JsonResponse({"success": False, "message": "Patient name is required"}, status=400)

    saved_in_db = False
    try:
        if hasattr(settings, "MONGO_DB") and settings.MONGO_DB is not None:
            coll = settings.MONGO_DB["hospital_bed_assignments"]
            query_filter = {"hospital_id": hospital.id}
            if bed_id:
                query_filter["bed_id"] = str(bed_id)
            elif bed_no:
                query_filter["bed_no"] = str(bed_no)
            else:
                return JsonResponse({"success": False, "message": "Bed identifier is required"}, status=400)

            update_data = {
                "hospital_id": hospital.id,
                "bed_id": str(bed_id) if bed_id else "",
                "bed_no": str(bed_no) if bed_no else "",
                "bed_name": str(bed_name) if bed_name else "",
                "bed_room_id": str(bed_room_id) if bed_room_id else "",
                "patient_name": patient_name,
                "disease": disease,
                "status": "Occupied",
                "updated_at": timezone.now(),
            }
            coll.update_one(query_filter, {"$set": update_data}, upsert=True)
            saved_in_db = True
    except Exception as e:
        logger.error(f"Error saving bed assignment to MongoDB: {e}")

    session_assignments = request.session.get("hospital_bed_assignments", {})
    if not isinstance(session_assignments, dict):
        session_assignments = {}
    key = str(bed_id) if bed_id else f"no_{bed_no}"
    session_assignments[key] = {
        "bed_id": str(bed_id),
        "bed_no": str(bed_no),
        "bed_name": str(bed_name),
        "bed_room_id": str(bed_room_id),
        "patient_name": patient_name,
        "disease": disease,
        "status": "Occupied",
    }
    request.session["hospital_bed_assignments"] = session_assignments
    request.session.modified = True

    return JsonResponse({
        "success": True,
        "message": "Bed assigned successfully",
        "saved_in_db": saved_in_db,
    })


@require_POST
@dashboard_login_required
def unassign_bed_patient(request):
    user = request.user_obj
    if user.user_type != "hospital":
        return JsonResponse({"success": False, "message": "Unauthorized"}, status=403)

    hospital = HospitalProfile.objects.filter(user=user).first()
    if not hospital:
        return JsonResponse({"success": False, "message": "Hospital profile not found"}, status=404)

    bed_id = request.POST.get("bed_id", "").strip()
    bed_no = request.POST.get("bed_no", "").strip()

    try:
        if hasattr(settings, "MONGO_DB") and settings.MONGO_DB is not None:
            coll = settings.MONGO_DB["hospital_bed_assignments"]
            query_filter = {"hospital_id": hospital.id}
            if bed_id:
                query_filter["bed_id"] = str(bed_id)
            elif bed_no:
                query_filter["bed_no"] = str(bed_no)

            coll.delete_one(query_filter)
    except Exception as e:
        logger.error(f"Error unassigning bed from MongoDB: {e}")

    session_assignments = request.session.get("hospital_bed_assignments", {})
    if isinstance(session_assignments, dict):
        key = str(bed_id) if bed_id else f"no_{bed_no}"
        session_assignments.pop(key, None)
        request.session["hospital_bed_assignments"] = session_assignments
        request.session.modified = True

    return JsonResponse({"success": True, "message": "Bed unassigned successfully"})
