from django.core.paginator import Paginator
from appointments.models import LabAppointments, HospitalAppointments
from django.db.models import Prefetch, Q
from django.http import JsonResponse
from django.shortcuts import render
from django.template.loader import render_to_string

from appointments.models import DoctorAppointment, LabAppointments
from dashboard.utils import dashboard_login_required, get_common_context, get_theme_colors
from orders.models import OrderStatusChoices, PurchaseMedicine, UserPurchase
from registration.models import PharmacyProfile
from registration.models import DoctorProfile
from django.views.decorators.http import require_POST
from django.views.decorators.csrf import csrf_exempt
from registration.models import HospitalProfile
from services.models import HospitalRoomRateCard
from appointments.models import LabAppointments, AppointmentStatus


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
            "completed_orders": base_orders.filter(order_status=OrderStatusChoices.DELIVERED),
            "cancelled_orders": base_orders.filter(order_status=OrderStatusChoices.CANCELLED),
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
    status = request.GET.get("status", "accepted").strip().lower()
    page_number = request.GET.get("page", 1)

    if status == "canceled":
        status = "cancelled"

    qs = DoctorAppointment.objects.select_related(
        "user__userprofile",
        "address",
        "user",
    )

    if status != "all":
        if status == "missed":
            qs = qs.none()
        else:
            qs = qs.filter(status__iexact=status)

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

    qs = LabAppointments.objects.select_related(
        "user__userprofile",
        "test_package",
        "test_type",
        "test_description",
        "address",
        "user",
    )

    if status != "all":
        if status == "missed":
            qs = qs.none()
        else:
            qs = qs.filter(status__iexact=status)

    qs = qs.order_by("-created_at")

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
    status = request.GET.get("status", "accepted").strip().lower()
    page_number = request.GET.get("page", 1)

    if status == "canceled":
        status = "cancelled"

    qs = HospitalAppointments.objects.select_related(
        "user__userprofile",
        "address",
        "user",
    )

    if status != "all":
        if status == "missed":
            qs = qs.none()
        else:
            qs = qs.filter(status__iexact=status)

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
def complete_lab_appointment(request):

    appointment_id = request.POST.get("id")

    appointment = LabAppointments.objects.get(id=appointment_id)

    appointment.status = AppointmentStatus.COMPLETED

    appointment.save()

    return JsonResponse({
        "success": True
    })


@require_POST
def cancel_lab_appointment(request):

    appointment_id = request.POST.get("id")

    appointment = LabAppointments.objects.get(id=appointment_id)

    appointment.status = AppointmentStatus.CANCELLED

    appointment.save()

    return JsonResponse({
        "success": True
    })