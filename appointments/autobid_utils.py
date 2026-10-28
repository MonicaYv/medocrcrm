
import json

from django.http import JsonResponse
from django.views.decorators.http import require_http_methods
from django.db import transaction
from django.utils import timezone

from dashboard.utils import dashboard_login_required
from settings.models import SellerSubscription, SellerType


@dashboard_login_required
@require_http_methods(["GET", "POST"])
def toggle_autobid(request):
    # User is authenticated by dashboard_login_required
    user = request.user_obj

    # Ensure the user exists
    if not user:
        return JsonResponse(
            {"detail": "Authentication required"},
            status=401,
        )

    user_type = (getattr(user, "user_type", "") or "").lower()

    profile_relation_by_type = {
        "pharmacy": "pharmacy_profile",
        "lab": "lab_profile",
        "hospital": "hospital_profile",
        "doctor": "doctor_profile",
    }

    profile_relation = profile_relation_by_type.get(user_type)

    if not profile_relation:
        return JsonResponse(
            {"detail": "Invalid seller type"},
            status=403,
        )

    seller_profile = getattr(user, profile_relation, None)

    if not seller_profile:
        return JsonResponse(
            {"detail": f"No {user_type} profile found for this account"},
            status=403,
        )

    # Resolve seller type
    try:
        seller_type_enum = SellerType(user_type)
    except (KeyError, AttributeError):
        return JsonResponse(
            {"detail": "Invalid seller type"},
            status=403,
        )

    # Retrieve latest active subscription
    subscription = (
        SellerSubscription.objects.filter(
            seller_type=seller_type_enum,
            seller_profile_id=seller_profile.id,
            is_active=True,
        )
        .order_by("-created_at")
        .first()
    )

    if not subscription:
        return JsonResponse(
            {"detail": "Upgrade to Premium to use Autobid"},
            status=403,
        )

    # Check subscription expiration safely
    expiry_date = subscription.expiry_date

    if expiry_date:
        if timezone.is_naive(expiry_date):
            expiry_date = timezone.make_aware(
                expiry_date,
                timezone.get_current_timezone(),
            )

        if expiry_date < timezone.now():
            return JsonResponse(
                {"detail": "Subscription expired. Upgrade to Premium"},
                status=403,
            )

    # Premium plan required
    if (
        not subscription.plan_name
        or subscription.plan_name.lower() != "premium"
    ):
        return JsonResponse(
            {"detail": "Autobid is only available for Premium users"},
            status=403,
        )

    # GET: Return current Autobid status
    if request.method == "GET":
        return JsonResponse({
            "success": True,
            "autobid_enabled": subscription.autobid_enabled,
        })

    # POST: Parse request body
    try:
        data = json.loads(request.body or "{}")
    except (json.JSONDecodeError, UnicodeDecodeError):
        return JsonResponse(
            {"detail": "Invalid JSON body"},
            status=400,
        )

    enable = data.get("enable")

    if not isinstance(enable, bool):
        return JsonResponse(
            {"detail": "'enable' must be a boolean"},
            status=400,
        )

    # Update subscription safely
    with transaction.atomic():
        subscription = (
            SellerSubscription.objects.select_for_update()
            .get(pk=subscription.pk)
        )

        subscription.autobid_enabled = enable
        subscription.save(update_fields=["autobid_enabled"])

    return JsonResponse({
        "success": True,
        "autobid_enabled": enable,
        "message": (
            "Autobid enabled" if enable else "Autobid disabled"
        ),
    })
