from django.shortcuts import get_object_or_404, redirect, render
from django.db.models import Count, Prefetch, Q
from dashboard.utils import dashboard_login_required, get_common_context
from orders.models import PurchaseMedicine, UserPurchase, OrderStatusChoices
from registration.models import PharmacyProfile
from django.views.decorators.http import require_POST
from services.models import PharmacyBidding

@dashboard_login_required
def orders(request):
    user = request.user_obj
    context = get_common_context(request, user)
    pharmacy_profile = PharmacyProfile.objects.filter(user=user).first()
    placed_bid_order_ids = []

    if pharmacy_profile:
        placed_bid_order_ids = PharmacyBidding.objects.filter(
            pharmacy=pharmacy_profile
        ).values_list("order_id", flat=True)

    order_scope = Q()
    if pharmacy_profile:
        order_scope = Q(assigned_pharmacy=pharmacy_profile) | Q(
            assigned_pharmacy__isnull=True,
            order_status=OrderStatusChoices.PENDING,
        )

    orders_qs = (
        UserPurchase.objects
        .filter(
            order_scope,
            order_status=OrderStatusChoices.PENDING,
        )
        .exclude(
            id__in=placed_bid_order_ids
        )
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
            ),
            "bids",
        )
        .order_by("-created_at")
    )
    status_counts = (
        UserPurchase.objects
        .filter(order_scope)
        .values("order_status")
        .annotate(total=Count("id"))
    )

    total_pending = 0
    total_confirmed = 0
    total_cancelled = 0

    for row in status_counts:
        if row["order_status"] == OrderStatusChoices.PENDING:
            total_pending = row["total"]
        elif row["order_status"] == OrderStatusChoices.CONFIRMED:
            total_confirmed = row["total"]
        elif row["order_status"] == OrderStatusChoices.CANCELLED:
            total_cancelled = row["total"]

    total_accepted = total_confirmed

    context.update({
        "orders": orders_qs,
        "total_pending": total_pending,
        "total_confirmed": total_confirmed,
        "total_accepted": total_accepted,
        "total_cancelled": total_cancelled,
    })

    return render(request, "orders.html", context)


@dashboard_login_required
@require_POST
def update_order_status(request, order_id, status):
    allowed_statuses = {
        "confirm": OrderStatusChoices.CONFIRMED,
        "complete": OrderStatusChoices.DELIVERED,
        "cancel": OrderStatusChoices.CANCELLED,
    }

    next_status = allowed_statuses.get(status)
    if not next_status:
        return redirect("orders")

    pharmacy_profile = PharmacyProfile.objects.filter(user=request.user_obj).first()
    order_filter = Q(id=order_id)
    if pharmacy_profile:
        order_filter &= Q(assigned_pharmacy=pharmacy_profile) | Q(
            assigned_pharmacy__isnull=True
        )

    # order = get_object_or_404(
    #     UserPurchase.objects.defer(
    #         "prescriptions",
    #         "doctor_name",
    #         "patient_name",
    #     ),
    #     order_filter,
    # )
    # order.order_status = next_status
    # update_fields = ["order_status", "updated_at"]
    # if (
    #     next_status in [OrderStatusChoices.CONFIRMED, OrderStatusChoices.CANCELLED]
    #     and pharmacy_profile
    #     and not order.assigned_pharmacy_id
    # ):
    #     order.assigned_pharmacy = pharmacy_profile
    #     update_fields.append("assigned_pharmacy")
    # order.save(update_fields=update_fields)

    # return redirect("orders")
    order = get_object_or_404(
        UserPurchase.objects.defer(
            "prescriptions",
            "doctor_name",
            "patient_name",
        ),
        order_filter,
    )

    print("Before:", order.id, order.order_status)

    order.order_status = next_status

    print("After:", order.id, order.order_status)

    update_fields = ["order_status", "updated_at"]

    if (
        next_status in [OrderStatusChoices.CONFIRMED, OrderStatusChoices.CANCELLED]
        and pharmacy_profile
        and not order.assigned_pharmacy_id
    ):
        order.assigned_pharmacy = pharmacy_profile
        update_fields.append("assigned_pharmacy")

    order.save(update_fields=update_fields)

    order.refresh_from_db()

    print("DB Status:", order.id, order.order_status)

    return redirect("orders")

