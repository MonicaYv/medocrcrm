from django.shortcuts import render
from django.db.models import Count
from dashboard.utils import dashboard_login_required, get_common_context
from orders.models import UserPurchase, OrderStatusChoices
from django.http import JsonResponse
from django.views.decorators.http import require_GET

@dashboard_login_required
def orders(request):
    user = request.user_obj
    context = get_common_context(request, user)

    orders_qs = (
        UserPurchase.objects
        .filter(
            order_status__in=[
                OrderStatusChoices.PENDING,
            ]
        )
        .defer(
            "prescriptions",
            "doctor_name",
            "patient_name",
        )
        .select_related(
            "user",
            "assigned_pharmacy",
            "address",
            "address__city",
            "address__state",
        )
        .prefetch_related(
            "medicines",
            "bids",
        )
        .order_by("-created_at")
    )

    status_counts = (
        UserPurchase.objects
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

    print("\n===== ORDER COUNTS =====")
    print(f"Pending   : {total_pending}")
    print(f"Confirmed : {total_confirmed}")
    print(f"Accepted  : {total_accepted}")
    print(f"Cancelled : {total_cancelled}")
    print("========================\n")

    # print("\n===== PENDING & UPCOMING ORDERS =====")
    # for order in orders_qs:
    #     print(
    #         f"Order ID: {order.id} | "
    #         f"Status: {order.order_status} | "
    #         f"Amount: {order.final_amount}"
    #     )
    # print("===== END =====\n")

    context.update({
        "orders": orders_qs
    })

    return render(request, "orders.html", context)

