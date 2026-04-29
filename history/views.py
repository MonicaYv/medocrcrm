from django.shortcuts import render
from dashboard.utils import dashboard_login_required, get_common_context
from django.http import JsonResponse
from django.template.loader import render_to_string
from django.core.paginator import Paginator
from appointments.models import LabAppointments

# Create your views here.

@dashboard_login_required
def history(request):
    user = request.user_obj
    context = get_common_context(request,user)
    if user.user_type == 'pharmacy':
        return render(request, 'pharmacy/history.html', context)
    elif user.user_type == 'lab':
        return render(request, 'lab/history.html', context)
    elif user.user_type == 'hospital':
        return render(request, 'hospital/history.html', context)
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
    status = request.GET.get("status", "Accepted")
    page = request.GET.get("page", 1)

    qs = DoctorAppointment.objects.filter(
        doctor=user,
        status__iexact=status
    ).select_related(
        "user__userprofile",
        "address"
    ).order_by("-created_at")

    paginator = Paginator(qs, 5)
    page_obj = paginator.get_page(page)

    html = render_to_string(
        "partials/doctor_history_cards.html",
        {
            "appointments": page_obj,
            "page_obj": page_obj,
        },
        request=request
    )

    return JsonResponse({
        "html": html,
        "current_page": page_obj.number,
        "total_pages": paginator.num_pages
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