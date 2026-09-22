from decimal import Decimal
from django.shortcuts import get_object_or_404, redirect, render
from django.conf import settings
from django.db.models import Count, Prefetch, Q
from django.http import JsonResponse
from django.core.paginator import Paginator
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

    search_query = request.GET.get("search", "").strip()
    status_filter = request.GET.get("status", "").strip().lower()

    orders_qs = (
        UserPurchase.objects
        .filter(order_scope)
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

    if search_query:
        try:
            order_id = int(search_query)
            orders_qs = orders_qs.filter(id=order_id)
        except ValueError:
            orders_qs = orders_qs.none()

    if status_filter:
        orders_qs = orders_qs.filter(order_status=status_filter)
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

    paginator = Paginator(orders_qs, 5)
    page_number = request.GET.get("page", 1)
    page_obj = paginator.get_page(page_number)

    context.update({
        "orders": page_obj,
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


@dashboard_login_required
def order_invoice(request, order_id):
    """Return invoice data for an order (JSON) to populate the invoice popup."""
    user = request.user_obj
    pharmacy_profile = PharmacyProfile.objects.filter(user=user).first()

    order_filter = Q(id=order_id)
    if pharmacy_profile:
        order_filter &= Q(assigned_pharmacy=pharmacy_profile) | Q(
            assigned_pharmacy__isnull=True,
            order_status=OrderStatusChoices.PENDING,
        )

    order = get_object_or_404(
        UserPurchase.objects.defer(
            "prescriptions",
            "doctor_name",
            "patient_name",
        ).select_related(
            "user",
            "user__userprofile",
            "address",
            "address__city",
            "address__state",
        ).prefetch_related(
            Prefetch(
                "medicines",
                queryset=PurchaseMedicine.objects.defer("mongo_snapshot"),
            )
        ),
        order_filter,
    )

    # Supplier (platform company)
    supplier = {
        "name": getattr(settings, "COMPANY_NAME", "") or "MediConnect Tech Pvt. Ltd.",
        "gstin": getattr(settings, "COMPANY_GSTIN", "") or "N/A",
        "address": getattr(settings, "COMPANY_ADDRESS", "") or "N/A",
        "contact": getattr(settings, "COMPANY_CONTACT", "") or "N/A",
        "email": getattr(settings, "COMPANY_EMAIL", "") or "N/A",
    }

    # Client (customer placing the order)
    profile = getattr(order.user, "userprofile", None)
    address = order.address

    client_name = ""
    if address:
        client_name = f"{address.first_name or ''} {address.last_name or ''}".strip()
    if not client_name and profile:
        client_name = f"{profile.first_name or ''} {profile.last_name or ''}".strip()
    if not client_name:
        client_name = getattr(order.user, "email", None) or "Customer"

    client_address = "N/A"
    if address:
        parts = [
            address.address or "",
            (address.city.name if address.city else ""),
            (address.state.name if address.state else ""),
            str(address.pincode or ""),
        ]
        client_address = ", ".join(p for p in parts if p.strip()) or "N/A"

    client = {
        "name": client_name,
        "gstin": "N/A",
        "address": client_address,
        "contact": (
            (address.phone_number if address and address.phone_number else "")
            or (getattr(order.user, "phone_number", "") or "")
            or "N/A"
        ),
        "email": getattr(order.user, "email", None) or "N/A",
    }

    # Line items (medicines)
    items = []
    med_subtotal = Decimal("0.00")
    for med in order.medicines.all():
        qty = med.quantity or 1
        rate = med.price or Decimal("0.00")
        amount = (rate * qty).quantize(Decimal("0.01"))
        med_subtotal += amount
        items.append({
            "description": med.product_name or med.medicine_id or "Medicine",
            "hsn": "3004",  # HSN chapter 30 - pharmaceutical products
            "quantity": qty,
            "rate": str(rate),
            "amount": str(amount),
            "gst_percent": 0,
        })

    delivery_fee = order.delivery_platform_fee or Decimal("0.00")
    gst_on_med = order.gst_on_medicine or Decimal("0.00")
    gst_on_delivery = order.gst_on_delivery_fee or Decimal("0.00")
    gst_total = gst_on_med + gst_on_delivery
    discount = (order.discount or Decimal("0.00")) + (order.coupon_discount or Decimal("0.00"))

    med_gst_pct = 0
    if med_subtotal > 0:
        med_gst_pct = round(float(gst_on_med) / float(med_subtotal) * 100, 2)
    for item in items:
        item["gst_percent"] = med_gst_pct

    if delivery_fee > 0:
        del_gst_pct = 0
        if gst_on_delivery > 0:
            del_gst_pct = round(float(gst_on_delivery) / float(delivery_fee) * 100, 2)
        items.append({
            "description": "Delivery / Platform Fee",
            "hsn": "9985",  # HSN for transport / delivery services
            "quantity": 1,
            "rate": str(delivery_fee),
            "amount": str(delivery_fee),
            "gst_percent": del_gst_pct,
        })

    subtotal = med_subtotal + delivery_fee

    total = order.final_amount
    if total is None:
        total = order.total_amount
    if total is None:
        total = (subtotal - discount + gst_total).quantize(Decimal("0.01"))

    return JsonResponse({
        "invoice_no": f"INV/ORD/{order.created_at.year}/{order.id:04d}",
        "invoice_date": order.created_at.strftime("%d-%B-%Y"),
        "order_id": order.id,
        "order_status": order.get_order_status_display(),
        "supplier": supplier,
        "client": client,
        "items": items,
        "subtotal": str(subtotal),
        "discount": str(discount),
        "delivery_fee": str(delivery_fee),
        "gst_amount": str(gst_total),
        "gst_percent": med_gst_pct,
        "total": str(total),
        "payment_method": order.payment_method or "N/A",
        "txn_id": "N/A",
    })

