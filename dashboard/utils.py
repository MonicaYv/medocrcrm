from django.shortcuts import redirect
from functools import wraps
from django.http import JsonResponse
from django.shortcuts import render
from registration.models import User
from points.models import PointsActionType, PointsHistory, PointsBadge
from .models import SettingMenu
from django.db.models import Sum, Q
from settings.models import UserColorScheme
from django.core.exceptions import PermissionDenied, ValidationError
from django.shortcuts import get_object_or_404
import datetime
from registration.models import (
    User,
    HospitalProfile,
    PharmacyProfile,
    LabProfile,
    DoctorProfile,
    AdvertiserProfile,
    ClientProfile,
    NGOProfile
)

POINTS_ACTION_ALIASES = {
    "Donate": ["Donate", "Donation"],
    "Coupon": ["Coupon", "Coupons", "Coupon Created", "Coupon Creation"],
    "Map": ["Map", "Maps"],
    "Orders": ["Orders", "Order"],
    "Post": ["Post", "Posts"],
    "Share": ["Share", "Shares"],
}


def build_points_action_query(action_type):
    names = POINTS_ACTION_ALIASES.get(action_type, [action_type])
    query = Q()
    for name in names:
        query |= Q(action_type__iexact=name)
    return query


def get_points_chart_data(user, chart_action_types):
    today = datetime.date.today()
    last_7_days = [today - datetime.timedelta(days=6 - index) for index in range(7)]
    chart_data = {action_type: [0] * 7 for action_type in chart_action_types}

    for action_type in chart_action_types:
        action_ids = list(
            PointsActionType.objects
            .filter(build_points_action_query(action_type))
            .values_list("id", flat=True)
        )
        if not action_ids:
            continue

        points_by_day = (
            PointsHistory.objects
            .filter(user=user, action_type_id__in=action_ids, timestamp__date__in=last_7_days)
            .values("timestamp__date")
            .annotate(total=Sum("points"))
        )
        totals = {row["timestamp__date"]: row["total"] or 0 for row in points_by_day}

        for day_index, day in enumerate(last_7_days):
            chart_data[action_type][day_index] = totals.get(day, 0)

    return {
        "chart_labels": [day.strftime("%d/%m") for day in last_7_days],
        "chart_data": chart_data,
    }

def dashboard_login_required(view_func):
    @wraps(view_func)
    def _wrapped_view(request, *args, **kwargs):
        user_id = request.session.get('user_id')
        if not user_id:
            return redirect('/login')
        # Optionally: attach the user object
        request.user_obj = User.objects.filter(id=user_id).first()
        if not request.user_obj:
            return redirect('/login')
        return view_func(request, *args, **kwargs)
    return _wrapped_view

def get_common_context(request, user):
    user = request.user_obj
    user_type = user.user_type
    menu_items = SettingMenu.objects.filter(
        is_active=True, user_types__contains=[user_type]
    ).order_by("order")

    # Badge calculation
    if user_type == "ngo":
        chart_action_types = ["Map", "Referral", "Post"]
        user_profile = NGOProfile.objects.filter(user=user).first()
    elif user_type == "client":
        chart_action_types = ["Map", "Referral", "Subscription", "Donate"]
        user_profile = ClientProfile.objects.filter(user=user).first()
    elif user_type == "advertiser":
        chart_action_types = ["Map", "Referral", "Coupon", "Donate"]
        user_profile = AdvertiserProfile.objects.filter(user=user).first()
    elif user_type == "pharmacy":
        chart_action_types = ["Referral", "Share", "Donate", "Orders"]
        user_profile = PharmacyProfile.objects.filter(user=user).first()
    elif user_type == "lab":
        chart_action_types = ["Referral", "Appointment", "Donate"]
        user_profile = LabProfile.objects.filter(user=user).first()
    elif user_type == "doctor":
        chart_action_types = ["Referral", "Appointment", "Donate"]
        user_profile = DoctorProfile.objects.filter(user=user).first()
    elif user_type == "hospital":
        chart_action_types = ["Referral", "Appointment", "Donate"]
        user_profile = HospitalProfile.objects.filter(user=user).first()
    else:
        chart_action_types = []
        user_profile = None

    action_ids_by_type = {
        action_type: list(
            PointsActionType.objects
            .filter(build_points_action_query(action_type))
            .values_list("id", flat=True)
        )
        for action_type in chart_action_types
    }
    action_points = {
        action_type: (
            PointsHistory.objects.filter(user_id=user.id, action_type_id__in=action_ids)
            .aggregate(total=Sum("points"))["total"]
            or 0
        ) if action_ids else 0
        for action_type, action_ids in action_ids_by_type.items()
    }

    total_points = sum(action_points.values())
    badge = (
        PointsBadge.objects.filter(min_points__lte=total_points)
        .filter(Q(max_points__gte=total_points) | Q(max_points__isnull=True))
        .order_by("min_points")
        .first()
    )

    if user_type == "ngo":
        user_display_name = user_profile.ngo_name if user_profile else "Unknown"
    elif user_type == "doctor":
        user_display_name = (user_profile.clinic_name if user_profile else "Unknown")
    elif user_type == "hospital":
        user_display_name = (user_profile.hospital_name if user_profile else "Unknown")
    elif user_type == "lab":
        user_display_name = (user_profile.lab_name if user_profile else "Unknown")
    elif user_type == "pharmacy":
        user_display_name = (user_profile.company_name if user_profile else "Unknown")
    else:
        user_display_name = (
            user_profile.company_name if user_profile else "Unknown"
        )
    trophy = None
    if user_type == "ngo":
        trophy = "trophy-ngo.svg"
    elif user_type == "client":
        trophy = "trophy-client.svg"
    elif user_type == "advertiser":
        trophy = "trophy-advertiser.svg"
    elif user_type == "pharmacy":
        trophy = "trophy-pharmacy.svg"
    elif user_type == "lab":
        trophy = "trophy-hospital.svg"
    elif user_type == "doctor":
        trophy = "trophy-hospital.svg"
    elif user_type == "hospital":
        trophy = "trophy-hospital.svg"
    tab_class_map = {
    "advertiser": "tab-btn-advertiser",
    "client": "tab-btn-client",
    "pharmacy": "tab-btn-hospital",
    "ngo": "tab-btn-ngo",
    "lab": "tab-btn-hospital",
    "doctor": "tab-btn-hospital",
    "hospital": "tab-btn-hospital",
    }
    logo_map = {
    "ngo": "/static/images/ngo.svg",
    "client": "/static/images/client-company.svg",
    "advertiser": "/static/images/Advertiser.svg",
    "pharmacy": "/static/images/hospital-logo.svg",
    "lab": "/static/images/hospital-logo.svg",
    "doctor": "/static/images/hospital-logo.svg",
    "hospital": "/static/images/hospital-logo.svg",
    }
    active_tab_class_map = {
        "advertiser": "active-tab-advertiser",
        "client": "active-tab-client",
        "pharmacy": "active-tab-hospital",
        "ngo": "active-tab-ngo",
        "lab": "active-tab-hospital",
        "doctor": "active-tab-hospital",
        "hospital": "active-tab-hospital",
    }
    main_tab_class_map = {
        "pharmacy": "main-tab",
        "doctor": "main-tab",
        "lab": "main-tab",
        "hospital": "main-tab",
    }
    active_main_tab_class_map = {
        "pharmacy": "active-tab-main",
        "doctor": "active-tab-main",
        "lab": "active-tab-main",
        "hospital": "active-tab-main",
    }
    context = {
        "user_profile": user,
        "sidebar_menu": menu_items,
        "badge": badge,
        "user": user,
        "user_display_name": user_display_name,
        "total_points": total_points,
        "action_points": action_points,
        "chart_action_types": chart_action_types,
        "trophy": trophy,
        "all_badges": PointsBadge.objects.all(),
        "logo": logo_map.get(user_type),
    }
    context.update(get_points_chart_data(user, chart_action_types))
    context["tab_class"] = tab_class_map.get(user_type)
    context["active_tab_class"] = active_tab_class_map.get(user_type)
    context["main_tab_class"] = main_tab_class_map.get(user_type)
    context["active_main_tab_class"] = active_main_tab_class_map.get(user_type)
    context.update(get_theme_colors(user_type))
    return context

def get_theme_colors(user_type: str) -> dict:
    try:
        color_scheme_obj = UserColorScheme.objects.get(user_type=user_type, is_active=True)
        return color_scheme_obj.color_data

    except Exception as e:   
        return e
    


def check_seller_verified(user_id: int, user_type: str):
    """
    Validates if seller profile exists and is verified.
    Raises PermissionDenied or ValidationError if invalid.
    Returns True if seller is verified.
    """

    user = get_object_or_404(User, id=user_id)

    profile_model_map = {
        "hospital": HospitalProfile,
        "pharmacy": PharmacyProfile,
        "lab": LabProfile,
        "doctor": DoctorProfile,
    }

    if user_type not in profile_model_map:
        raise ValidationError("Invalid seller type")

    ProfileModel = profile_model_map[user_type]

    try:
        profile = ProfileModel.objects.get(user_id=user_id)
    except ProfileModel.DoesNotExist:
        raise PermissionDenied(
            "Please complete your profile and submit it for verification before performing this action."
        )

    if not profile.is_verified:
        raise PermissionDenied(
            "Seller profile is not verified yet. Please wait for admin approval."
        )

    return True

def seller_verified_required(view_func):
    @wraps(view_func)
    def _wrapped_view(request, *args, **kwargs):
        user = request.user_obj
        
        # Skip verification for non-seller types (ngo, advertiser, client)
        unverified_allowed = ["ngo", "advertiser", "client"]
        if user.user_type not in unverified_allowed:
            try:
                check_seller_verified(user.id, user.user_type)
            except (PermissionDenied, ValidationError) as e:
                # For AJAX views return JSON instead of redirect
                if request.headers.get("x-requested-with") == "XMLHttpRequest":
                    return JsonResponse({"success": False, "error": str(e)}, status=403)

                # Normal page request → show message or redirect
                return render(request, "errors/not-verified.html", {"message": str(e)})

        return view_func(request, *args, **kwargs)

    return _wrapped_view
