from datetime import date, datetime, timedelta
from decimal import Decimal

import random
import subscription.models as subscription_models

from django.db.models import (
    Avg,
    Count,
    DecimalField,
    ExpressionWrapper,
    F,
    Q,
    Sum,
    Value,
)
from django.db.models.functions import Coalesce, Concat, ExtractHour, ExtractWeekDay, TruncDate, TruncHour
from django.core.exceptions import ObjectDoesNotExist
from django.http import JsonResponse
from django.shortcuts import render
from django.utils import timezone

from appointments.models import DoctorAppointment, HospitalAppointments, LabAppointments, HospitalAppointmentStatus
from appointments.utils import parse_filter_date, visit_type_filter_aliases
from dashboard.utils import (
    dashboard_login_required,
    get_common_context,
)
from orders.models import OrderStatusChoices, PurchaseMedicine, UserPurchase
from registration.models import PharmacyProfile
from services.models import PharmacyBidding, PharmacyBidStatus, PharmacyMedicine

from django.shortcuts import render
from dashboard.utils import (
    dashboard_login_required,
    get_common_context
)

from django.http import JsonResponse

from django.db.models import Sum, Avg, Count

from appointments.models import (
    LabAppointments,
    HospitalAppointments,
    AppointmentStatus
)
import random
from django.db.models.functions import TruncHour
from appointments.models import AppointmentStatus
from datetime import datetime, timedelta
from appointments.models import LabAppointments
from django.utils import timezone
from datetime import timedelta

# =========================================
# REPORT PAGE
# =========================================


STATE_HEATMAP_IDS = {
    "andaman and nicobar islands": "IN-AN",
    "andhra pradesh": "IN-AP",
    "arunachal pradesh": "IN-AR",
    "assam": "IN-AS",
    "bihar": "IN-BR",
    "chandigarh": "IN-CH",
    "chhattisgarh": "IN-CT",
    "dadra and nagar haveli": "IN-DN",
    "daman and diu": "IN-DD",
    "delhi": "IN-DL",
    "goa": "IN-GA",
    "gujarat": "IN-GJ",
    "haryana": "IN-HR",
    "himachal pradesh": "IN-HP",
    "jammu and kashmir": "IN-JK",
    "jharkhand": "IN-JH",
    "karnataka": "IN-KA",
    "kerala": "IN-KL",
    "lakshadweep": "IN-LK",
    "madhya pradesh": "IN-MP",
    "maharashtra": "IN-MH",
    "manipur": "IN-MN",
    "meghalaya": "IN-ML",
    "mizoram": "IN-MZ",
    "nagaland": "IN-NL",
    "odisha": "IN-OR",
    "orissa": "IN-OR",
    "punjab": "IN-PB",
    "rajasthan": "IN-RJ",
    "sikkim": "IN-SK",
    "tamil nadu": "IN-TN",
    "telangana": "IN-TG",
    "tripura": "IN-TR",
    "uttar pradesh": "IN-UP",
    "uttarakhand": "IN-UT",
    "west bengal": "IN-WB",
}


def _money(value):
    value = value or Decimal("0")
    return f"{value:,.0f}"


def _number(value):
    return f"{value or 0:,}"


def _percent(part, total):
    if not total:
        return 0
    return round((part / total) * 100)


def _parse_report_range(request):
    today = timezone.localdate()
    period = request.GET.get("period", "month")

    if period == "today":
        start_date = today
    elif period == "week":
        start_date = today - timedelta(days=6)
    elif period == "custom":
        start_str = request.GET.get("start", "").strip()
        end_str = request.GET.get("end", "").strip()
        
        # Try multiple parsing variations to catch different frontend inputs
        parsed_start = None
        parsed_end = None
        
        for fmt in ("%Y-%m-%d", "%d/%m/%Y", "%m/%d/%Y"):
            try:
                if not parsed_start and start_str:
                    parsed_start = timezone.datetime.strptime(start_str, fmt).date()
                if not parsed_end and end_str:
                    parsed_end = timezone.datetime.strptime(end_str, fmt).date()
            except ValueError:
                continue

        # Fallback only if the parsed results are completely missing or invalid
        if parsed_start and parsed_end:
            start_date = parsed_start
            today = parsed_end
        else:
            # Logger alert or fallback default
            start_date = today - timedelta(days=29)
    else:
        start_date = today - timedelta(days=29)

    return start_date, today


def _pharmacy_reports_context(request, user):
    pharmacy_profile = PharmacyProfile.objects.filter(user=user).first()
    start_date, end_date = _parse_report_range(request)
    search = request.GET.get("q", "").strip()

    # active_subscription = None
    # if user and user.is_authenticated:
    #     active_subscription = (
    #         subscription_models.SubscriptionHistory.objects.select_related("plan")
    #         .filter(user=user, status="active", expiry_date__gte=timezone.now())
    #         .order_by("-activation_date")
    #         .first()
    #     )
    active_subscription = None

    if user:
       active_subscription = (
           subscription_models.SubscriptionHistory.objects.select_related("plan")
           .filter(
              user=user,
              status="active",
              expiry_date__gte=timezone.now()
            )
            .order_by("-activation_date")
            .first()
        )   

    context = {
        "pharmacy_profile": pharmacy_profile,
        "report_range_label": f"{start_date:%b %d, %Y} - {end_date:%b %d, %Y}",
        "active_subscription": active_subscription,
    }
    if not pharmacy_profile:
        context["pharmacy_report_data"] = {}
        return context

    order_filter = Q(
        assigned_pharmacy=pharmacy_profile,
        created_at__date__gte=start_date,
        created_at__date__lte=end_date,
    )

    bids = PharmacyBidding.objects.filter(
        pharmacy=pharmacy_profile,
        created_at__date__gte=start_date,
        created_at__date__lte=end_date,
    )
    accepted_bid_order_ids = set(
        bids.filter(bid_status=PharmacyBidStatus.ACCEPTED).values_list("order_id", flat=True)
    )

    matching_order_ids = (
        UserPurchase.objects.filter(
            Q(assigned_pharmacy=pharmacy_profile) | Q(bids__pharmacy=pharmacy_profile),
            created_at__date__gte=start_date,
            created_at__date__lte=end_date,
        )
        .values("id")
        .distinct()
    )
    orders = UserPurchase.objects.filter(id__in=matching_order_ids)
    total_orders_count = orders.count()
    total_orders_count = orders.count()
    assigned_orders = UserPurchase.objects.filter(
        assigned_pharmacy=pharmacy_profile,
        created_at__date__gte=start_date,
        created_at__date__lte=end_date,
    )
    reportable_orders = assigned_orders.exclude(
        order_status=OrderStatusChoices.CANCELLED
    )
    amount_expr = Coalesce(
        "final_amount",
        "total_amount",
        Value(Decimal("0")),
        output_field=DecimalField(max_digits=12, decimal_places=2),
    )
    revenue = reportable_orders.aggregate(total=Sum(amount_expr))["total"] or Decimal("0")
    won_order_statuses = [
        OrderStatusChoices.CONFIRMED,
        OrderStatusChoices.SHIPPED,
        OrderStatusChoices.DELIVERED,
    ]
    won_order_ids = set(
        orders.filter(order_status__in=won_order_statuses).values_list("id", flat=True)
    )
    won_bids = len(won_order_ids | accepted_bid_order_ids)
    lost_bids = bids.filter(
        bid_status__in=[PharmacyBidStatus.REJECTED, PharmacyBidStatus.CANCELLED]
    ).count()
    avg_bid = bids.aggregate(avg=Avg("total_amount"))["avg"] or Decimal("0")

    medicines = PurchaseMedicine.objects.filter(purchase__in=reportable_orders)
    if search:
        medicines = medicines.filter(
            Q(product_name__icontains=search)
            | Q(medicine_id__icontains=search)
            | Q(type__icontains=search)
        )

    line_total = ExpressionWrapper(
        F("quantity") * F("price"),
        output_field=DecimalField(max_digits=12, decimal_places=2),
    )
    top_products = list(
        medicines.values("product_name")
        .annotate(
            units=Coalesce(Sum("quantity"), Value(0)),
            orders=Count("purchase_id", distinct=True),
            revenue=Coalesce(Sum(line_total), Value(Decimal("0"))),
        )
        .order_by("-units", "-revenue")[:5]
    )
    for item in top_products:
        item["name"] = item.pop("product_name") or "Unknown medicine"
        item["revenue_value"] = float(item["revenue"] or 0)
        item["revenue"] = _money(item["revenue"])

    product_labels = [item["name"] for item in top_products] or ["No sales yet"]
    product_units = [item["units"] for item in top_products] or [0]
    product_revenue = [item["revenue_value"] for item in top_products] or [0]
    revenue_total = sum(product_revenue)
    revenue_labels = [
        f"{label} ({_percent(value, revenue_total)}%)"
        for label, value in zip(product_labels, product_revenue)
    ]

    weekly_bids = {
        row["created_day"]: row["avg_amount"]
        for row in bids.annotate(created_day=TruncDate("created_at"))
        .values("created_day")
        .annotate(avg_amount=Avg("total_amount"))
        .order_by("created_day")
    }
    bid_trend_labels = []
    bid_trend_values = []
    for offset in range(6, -1, -1):
        day = end_date - timedelta(days=offset)
        bid_trend_labels.append(day.strftime("%a"))
        bid_trend_values.append(float(weekly_bids.get(day) or 0))

    weekday_rows = bids.annotate(weekday=ExtractWeekDay("created_at")).values("weekday").annotate(
        won=Count("id", filter=Q(bid_status=PharmacyBidStatus.ACCEPTED)),
        lost=Count(
            "id",
            filter=Q(
                bid_status__in=[
                    PharmacyBidStatus.REJECTED,
                    PharmacyBidStatus.CANCELLED,
                ]
            ),
        ),
    )
    weekday_map = {row["weekday"]: row for row in weekday_rows}
    day_order = [(2, "Mon"), (3, "Tue"), (4, "Wed"), (5, "Thu"), (6, "Fri"), (7, "Sat"), (1, "Sun")]
    win_loss_chart = {
        "labels": [label for _, label in day_order],
        "won": [weekday_map.get(day, {}).get("won", 0) for day, _ in day_order],
        "lost": [weekday_map.get(day, {}).get("lost", 0) for day, _ in day_order],
    }

    won_order_weekday_rows = (
        orders.filter(order_status__in=won_order_statuses)
        .exclude(id__in=accepted_bid_order_ids)
        .annotate(weekday=ExtractWeekDay("updated_at"))
        .values("weekday")
        .annotate(total=Count("id", distinct=True))
    )
    for row in won_order_weekday_rows:
        index = next((i for i, item in enumerate(day_order) if item[0] == row["weekday"]), None)
        if index is not None:
            win_loss_chart["won"][index] += row["total"]

    win_loss_rows = []
    for week_index in range(3):
        week_end = end_date - timedelta(days=week_index * 7)
        week_start = week_end - timedelta(days=6)
        week_bids = bids.filter(created_at__date__gte=week_start, created_at__date__lte=week_end)
        week_won_order_ids = set(
            orders.filter(
                order_status__in=won_order_statuses,
                updated_at__date__gte=week_start,
                updated_at__date__lte=week_end,
            ).values_list("id", flat=True)
        )
        week_accepted_bid_order_ids = set(
            week_bids.filter(bid_status=PharmacyBidStatus.ACCEPTED)
            .values_list("order_id", flat=True)
        )
        week_won = len(week_won_order_ids | week_accepted_bid_order_ids)
        week_lost = week_bids.filter(
            bid_status__in=[PharmacyBidStatus.REJECTED, PharmacyBidStatus.CANCELLED]
        ).count()
        total = week_won + week_lost
        win_loss_rows.append({
            "label": f"{week_start:%b %d}-{week_end:%d}",
            "won": week_won,
            "lost": week_lost,
            "won_percent": _percent(week_won, total),
            "lost_percent": _percent(week_lost, total),
        })

    stock_alerts = []
    stock_rows = PharmacyMedicine.objects.filter(
        pharmacy=pharmacy_profile,
        is_active=True,
    ).values("name", "quantity")
    for item in stock_rows:
        try:
            quantity = int(item["quantity"])
        except (TypeError, ValueError):
            continue
        if quantity <= 20:
            item["quantity"] = quantity
            stock_alerts.append(item)
    stock_alerts.sort(key=lambda item: (item["quantity"], item["name"].lower()))
    stock_alerts = stock_alerts[:5]

    heatmap_rows = (
        reportable_orders.exclude(address__state__isnull=True)
        .values("address__state__name")
        .annotate(value=Count("id"))
    )
    heatmap_data = []
    for row in heatmap_rows:
        state_name = row["address__state__name"] or ""
        state_id = STATE_HEATMAP_IDS.get(state_name.strip().lower())
        if state_id:
            heatmap_data.append({"id": state_id, "value": row["value"]})

    report_data = {
        "topProducts": {
            "labels": product_labels,
            "units": product_units,
            "revenue": product_revenue,
            "revenueLabels": revenue_labels,
        },
        "bidTrend": {
            "labels": bid_trend_labels,
            "values": bid_trend_values,
        },
        "winLoss": win_loss_chart,
        "heatmap": heatmap_data,
        "ratings": [
            {"stars": 5, "percent": 0},
            {"stars": 4, "percent": 0},
            {"stars": 3, "percent": 0},
            {"stars": 2, "percent": 0},
            {"stars": 1, "percent": 0},
        ],
    }

    context.update({
        "report_search": search,
        "total_revenue": _money(revenue),
        "total_orders": _number(total_orders_count),
        "total_bids": _number(bids.count()),
        "won_bids": _number(won_bids),
        "lost_bids": _number(lost_bids),
        "avg_bid": _money(avg_bid),
        "rating_percent": "0%",
        "top_products": top_products,
        "stock_alerts": stock_alerts,
        "win_loss_rows": win_loss_rows,
        "pharmacy_report_data": report_data,
    })
    return context


@dashboard_login_required
def pharmacy_report_data(request):
    user = request.user_obj
    if user.user_type != "pharmacy":
        return JsonResponse({"error": "Invalid user type"}, status=403)

    context = _pharmacy_reports_context(request, user)
    report_data = context.get("pharmacy_report_data", {})

    return JsonResponse({
        "range_label": context.get("report_range_label", ""),
        "stats": {
            "total_revenue": context.get("total_revenue", "0"),
            "won_bids": context.get("won_bids", "0"),
            "lost_bids": context.get("lost_bids", "0"),
            "total_bids": context.get("total_bids", "0"),
            "total_orders": context.get("total_orders", "0"),
            "avg_bid": context.get("avg_bid", "0"),
        },
        "charts": report_data,
        "top_products": context.get("top_products", []),
        "stock_alerts": context.get("stock_alerts", []),
        "win_loss_rows": context.get("win_loss_rows", []),
    })

# @dashboard_login_required
# def reports(request):

#     user = request.user_obj

#     context = get_common_context(
#         request,
#         user
#     )

#     # =========================================
#     # HOSPITAL DYNAMIC COUNTS
#     # =========================================
#     user = request.user_obj
#     hospital_appointments = HospitalAppointments.objects.none()
#     if hasattr(user, "hospital_profile"):
#         current_hospital = user.hospital_profile
#         hospital_appointments = (
#              HospitalAppointments.objects.all()
#         .filter(
#            accepted_hospital=current_hospital
#         )
#         .select_related(
#         "category",
#         "service_type",
#         "address"
#        )

        
#     )
    

#     total_leads = (
#         hospital_appointments.count()
#     )

#     context["leads_generated"] = (
#         total_leads
#     )

#     context["qualified_leads"] = (
#         total_leads
#     )

#     context["opportunities_created"] = (
#         total_leads
#     )

#     context["proposals_sent"] = (
#         total_leads
#     )

#     context["deals_closed"] = (
#         total_leads
#     )

#     # =========================================
#     # DYNAMIC CONVERSION %
#     # =========================================

#     total = total_leads or 1

#     context["qualified_conversion"] = (
#         f"{round((context['qualified_leads']/total)*100)}%"
#     )

#     context["opportunity_conversion"] = (
#         f"{round((context['opportunities_created']/total)*100)}%"
#     )

#     context["proposal_conversion"] = (
#         f"{round((context['proposals_sent']/total)*100)}%"
#     )

#     context["deals_conversion"] = (
#         f"{round((context['deals_closed']/total)*100)}%"
#     )

#     # =========================================
#     # USER TYPE PAGE
#     # =========================================

#     if user.user_type == 'pharmacy':
#         context.update(_pharmacy_reports_context(request, user))

#         return render(
#             request,
#             'pharmacy_reports.html',
#             context
#         )

#     elif user.user_type == 'lab':

#         return render(
#             request,
#             'lab_reports.html',
#             context
#         )

#     elif user.user_type == 'doctor':

#         return render(
#             request,
#             'doctor_reports.html',
#             context
#         )

#     elif user.user_type == 'hospital':

#         return render(
#             request,
#             'hospital_reports.html',
#             context
#         )

#     else:

#         return render(
#             request,
#             'reports.html',
#             context
#         )

@dashboard_login_required
def reports(request):
    user = request.user_obj
    context = get_common_context(request, user)

    # Check if the user is a hospital user
    if user.user_type == 'hospital':
        context["report_user_id"] = user.id
        try:
            current_hospital = user.hospital_profile
        except AttributeError:
            current_hospital = None

        if current_hospital:
            # 1. Base Queryset Isolation (Using verified assignment/bid fields)
            hospital_appointments = HospitalAppointments.objects.filter(
                Q(accepted_hospital_id=current_hospital.id) | 
                Q(bids__hospital_id=current_hospital.id)
            ).distinct().select_related("category", "service_type")
            report_filter = request.GET.get("filter", "all").strip().lower()
            today = timezone.localdate()
            if report_filter == "today":
                report_start = report_end = today
            elif report_filter == "week":
                report_start, report_end = today - timedelta(days=6), today
            elif report_filter == "month":
                report_start, report_end = today.replace(day=1), today
            elif report_filter == "custom":
                try:
                    report_start = date.fromisoformat(request.GET.get("start_date", ""))
                    report_end = date.fromisoformat(request.GET.get("end_date", ""))
                except ValueError:
                    report_start = report_end = None
                if report_start and report_end and report_start > report_end:
                    report_start, report_end = report_end, report_start
            else:
                report_start = report_end = None
            report_appointments = hospital_appointments
            if report_start and report_end:
                report_appointments = report_appointments.filter(
                    created_at__date__range=(report_start, report_end)
                )
            elif report_filter == "custom":
                report_appointments = report_appointments.none()
            won_appointments = report_appointments.filter(
                accepted_hospital=current_hospital,
                status__in=[HospitalAppointmentStatus.ACCEPTED, HospitalAppointmentStatus.COMPLETED],
            )

            # 2. Basic Overview Cards Context Metrics
            total_revenue = won_appointments.aggregate(total=Sum("accepted_total_amount"))["total"] or 0
            if total_revenue >= 10000000:
                context["total_revenue"] = f"₹{round(total_revenue / 10000000, 2)} Cr"
            elif total_revenue >= 100000:
                context["total_revenue"] = f"₹{round(total_revenue / 100000, 2)} L"
            else:
                context["total_revenue"] = f"₹{round(total_revenue, 2)}"

            highest_dept = won_appointments.values("category__name").annotate(total=Sum("accepted_total_amount")).exclude(total__isnull=True).order_by("-total").first()
            context["highest_revenue"] = f"{highest_dept['category__name']}" if highest_dept else "None"

            current_count = report_appointments.count()
            if report_start and report_end:
                range_days = max((report_end - report_start).days + 1, 1)
                previous_start = report_start - timedelta(days=range_days)
                previous_end = report_start - timedelta(days=1)
                previous_count = hospital_appointments.filter(created_at__date__range=(previous_start, previous_end)).count()
                growth_value = ((current_count - previous_count) / previous_count * 100) if previous_count else (100 if current_count else 0)
                context["growth"] = f"{growth_value:+.1f}%" if previous_count else ("100.0%" if current_count else "0.0%")
            else:
                context["growth"] = "—"
            context["avg_revenue"] = f"₹{round(won_appointments.aggregate(avg=Avg('accepted_total_amount'))['avg'] or 0, 2)}"

            # ==========================================================
            # 3. PIPELINE PATIENT FUNNEL COUNTS AND CONVERSIONS
            # ==========================================================
            context["leads_generated"] = report_appointments.count()
            context["qualified_leads"] = won_appointments.count()
            context["opportunities_created"] = report_appointments.filter(accepted_bid__isnull=False).count()
            context["proposals_sent"] = won_appointments.filter(accepted_total_amount__isnull=False).count()
            context["deals_closed"] = won_appointments.filter(status=HospitalAppointmentStatus.COMPLETED).count()

            # Dynamic Conversion Percentages
            total = context["leads_generated"] or 1
            context["qualified_conversion"] = f"{round((context['qualified_leads'] / total) * 100)}%"
            context["opportunity_conversion"] = f"{round((context['opportunities_created'] / total) * 100)}%"
            context["proposal_conversion"] = f"{round((context['proposals_sent'] / total) * 100)}%"
            context["deals_conversion"] = f"{round((context['deals_closed'] / total) * 100)}%"

            # ==========================================================
            # 4. CONSTRUCT CHARTS RAW DATA ARRAYS FOR INITIAL JAVASCRIPT HYDRATION
            # ==========================================================
            # Bar Chart: Department Revenues
            bar_labels = []
            bar_values = []
            for item in won_appointments.values("category__name").annotate(total=Sum("accepted_total_amount")).exclude(total__isnull=True):
                bar_labels.append(item["category__name"])
                bar_values.append(float(item["total"] or 0))
            context["init_bar_labels"] = bar_labels
            context["init_bar_values"] = bar_values

            # Pie Chart: Service Bookings Count
            pie_labels = []
            pie_values = []
            for item in report_appointments.values("service_type__name").annotate(total=Count("id")):
                if item["service_type__name"]:
                    pie_labels.append(item["service_type__name"])
                    pie_values.append(item["total"])
            context["init_pie_labels"] = pie_labels
            context["init_pie_values"] = pie_values

            # Line Chart: Hourly Load Analytics Datasets
            hourly_qs = report_appointments.annotate(hour=ExtractHour("created_at")).values("hour").annotate(total=Count("id")).order_by("hour")
            line_labels = []
            line_values = []
            for item in hourly_qs:
                if item["hour"]:
                    line_labels.append(datetime.strptime(f"{item['hour']:02d}", "%H").strftime("%I:%M %p"))
                    line_values.append(item["total"])
            context["init_line_labels"] = line_labels
            context["init_line_values"] = line_values

        else:
            context.update({
                "total_revenue": "₹0", "highest_revenue": "None", "growth": "0%", "avg_revenue": "₹0",
                "leads_generated": 0, "qualified_leads": 0, "opportunities_created": 0, "proposals_sent": 0, "deals_closed": 0,
                "qualified_conversion": "0%", "opportunity_conversion": "0%", "proposal_conversion": "0%", "deals_conversion": "0%",
                "init_bar_labels": [], "init_bar_values": [],
                "init_pie_labels": [], "init_pie_values": [],
                "init_line_labels": [], "init_line_values": []
            })

        return render(request, 'hospital_reports.html', context)

    # Keep your other user types layout workflows the same below...
    elif user.user_type == 'pharmacy':
        context.update(_pharmacy_reports_context(request, user))
        return render(request, 'pharmacy_reports.html', context)
    elif user.user_type == 'lab':
        return render(request, 'lab_reports.html', context)
    elif user.user_type == 'doctor':
        return render(request, 'doctor_reports.html', context)
    else:
        return render(request, 'reports.html', context)



from django.http import JsonResponse
from django.db.models import Sum, Avg, Count, Q
from django.db.models.functions import TruncHour
from datetime import datetime, timedelta

@dashboard_login_required
def hospital_report_data(request):
    user = getattr(request, "user_obj", None)
    if not user or not user.is_active:
        return JsonResponse({"error": "Authentication required"}, status=401)

    try:
        hospital = user.hospital_profile
    except (AttributeError, ObjectDoesNotExist):
        return JsonResponse({"error": "This account does not have an active hospital profile"}, status=403)
    if not hospital:
        return JsonResponse({"error": "This account does not have an active hospital profile"}, status=403)

    today = timezone.localdate()
    filter_type = request.GET.get("filter", "month").strip().lower()
    base = HospitalAppointments.objects.filter(
        Q(accepted_hospital=hospital) | Q(bids__hospital=hospital)
    ).distinct().select_related("category", "service_type", "address")

    visit_type = request.GET.get("visit_type", "").strip().lower()
    if visit_type == "home":
        base = base.filter(Q(preferred_mode__iexact="home") | Q(preferred_mode__iexact="home-service"))
    elif visit_type == "hospital":
        base = base.filter(Q(preferred_mode__iexact="hospital") | Q(preferred_mode__iexact="visit"))

    if filter_type == "today":
        start_date = end_date = today
    elif filter_type == "week":
        start_date, end_date = today - timedelta(days=6), today
    elif filter_type == "month":
        start_date, end_date = today.replace(day=1), today
    elif filter_type == "custom":
        try:
            start_date = date.fromisoformat(request.GET.get("start_date", ""))
            end_date = date.fromisoformat(request.GET.get("end_date", ""))
        except ValueError:
            return JsonResponse({"error": "Select a valid custom date range."}, status=400)
        if start_date > end_date:
            start_date, end_date = end_date, start_date
    else:
        start_date = end_date = None

    appointments = base
    if start_date and end_date:
        appointments = appointments.filter(created_at__date__range=(start_date, end_date))

    won = appointments.filter(
        accepted_hospital=hospital,
        status__in=[HospitalAppointmentStatus.ACCEPTED, HospitalAppointmentStatus.COMPLETED],
    )
    revenue = won.aggregate(total=Sum("accepted_total_amount"))["total"] or 0
    if revenue >= 10000000:
        formatted_revenue = f"₹{revenue / 10000000:.2f} Cr"
    elif revenue >= 100000:
        formatted_revenue = f"₹{revenue / 100000:.2f} L"
    else:
        formatted_revenue = f"₹{revenue:.2f}"

    highest = won.values("category__name").annotate(total=Sum("accepted_total_amount")).exclude(total__isnull=True).order_by("-total").first()
    highest_revenue = highest["category__name"] if highest else "—"
    total_leads = appointments.count()
    qualified = won.count()
    opportunities = appointments.filter(accepted_bid__isnull=False).count()
    proposals = won.filter(accepted_total_amount__isnull=False).count()
    closed = won.filter(status=HospitalAppointmentStatus.COMPLETED).count()

    growth = "—"
    if start_date and end_date:
        span = max((end_date - start_date).days + 1, 1)
        previous = base.filter(created_at__date__range=(start_date - timedelta(days=span), start_date - timedelta(days=1))).count()
        current = total_leads
        growth_value = (current - previous) / previous * 100 if previous else (100 if current else 0)
        growth = f"{growth_value:+.1f}%" if previous else ("100.0%" if current else "0.0%")

    departments = list(won.values("category__name").annotate(total=Sum("accepted_total_amount")).exclude(category__name__isnull=True).order_by("-total"))
    services = list(appointments.values("service_type__name").annotate(total=Count("id")).exclude(service_type__name__isnull=True).order_by("-total"))
    hours = appointments.annotate(hour=ExtractHour("created_at")).values("hour").annotate(total=Count("id")).order_by("hour")
    locations = appointments.exclude(address__isnull=True).values("address__state__name").annotate(total=Count("id")).exclude(address__state__name__isnull=True).order_by("-total")

    return JsonResponse({
        "stats": {
            "revenue": formatted_revenue,
            "highest_revenue": highest_revenue,
            "growth": growth,
            "avg_revenue": f"₹{won.aggregate(avg=Avg('accepted_total_amount'))['avg'] or 0:.2f}",
            "avg_budget": float(appointments.aggregate(avg=Avg("budget"))["avg"] or 0),
            "total_appointments": total_leads,
        },
        "most_requested_test": {"labels": [row["category__name"] for row in departments], "data": [float(row["total"] or 0) for row in departments]},
        "revenue_by_test": {"labels": [row["service_type__name"] for row in services], "data": [row["total"] for row in services]},
        "bid_trend": {"labels": [datetime.strptime(f"{row['hour']:02d}", "%H").strftime("%I:%M %p") for row in hours if row["hour"] is not None], "cbc": [row["total"] for row in hours if row["hour"]]},
        "heatmap": {
            "labels": [row["address__state__name"] for row in locations],
            "ids": [STATE_HEATMAP_IDS.get(row["address__state__name"].strip().lower(), "") for row in locations],
            "data": [row["total"] for row in locations],
        },
        "patient_journey": {
            "labels": ["Leads Generated", "Qualified Leads", "Opportunities Created", "Proposals Sent", "Deals Closed"],
            "data": [total_leads, qualified, opportunities, proposals, closed],
            "conversion": [f"{round(value / total_leads * 100) if total_leads else 0}%" for value in [total_leads, qualified, opportunities, proposals, closed]],
        },
        "package_table": [
            {"package": row["service_type__name"], "bookings": row["total"], "conversion": f"{round(row['total'] / total_leads * 100) if total_leads else 0}%"}
            for row in services
        ],
    })

# @dashboard_login_required
# def hospital_report_data(request):

#     filter_type = request.GET.get(
#         "filter",
#         "month"
#     )

#     appointments = (
#         HospitalAppointments.objects
#         .select_related(
#             "category",
#             "service_type",
#             "address"
#         )
#     )

#     print("FILTER:", filter_type)
#     print("TOTAL:", appointments.count())

#     # =========================================
#     # FILTER LOGIC
#     # =========================================

#     if filter_type == "week":

#         current_week = datetime.now().isocalendar()[1]

#         appointments = appointments.filter(
#             created_at__week=current_week
#         )

#     elif filter_type == "month":

#         current_month = datetime.now().month

#         appointments = appointments.filter(
#             created_at__month=current_month
#         )

#     elif filter_type == "custom":

#         appointments = appointments.filter(
#             created_at__year=datetime.now().year
#         )

#     else:

#         appointments = appointments.filter(
#             created_at__date=datetime.now().date()
#         )

#     # =========================================
#     # MAIN STATS
#     # =========================================

#     total_revenue = appointments.aggregate(
#         total=Sum("accepted_total_amount")
#     )["total"] or 0

#     # =========================================
#     # TOTAL REVENUE FORMAT
#     # =========================================

#     if total_revenue >= 10000000:

#         formatted_revenue = (
#             f"₹{round(total_revenue / 10000000, 2)} Cr"
#         )

#     elif total_revenue >= 100000:

#         formatted_revenue = (
#             f"₹{round(total_revenue / 100000, 2)} L"
#         )

#     else:

#         formatted_revenue = (
#             f"₹{round(total_revenue, 2)}"
#         )

#     # =========================================
#     # HIGHEST REVENUE DEPARTMENT
#     # =========================================

#     highest_department = (
#         appointments
#         .values("category__name")
#         .annotate(
#             total=Sum("accepted_total_amount")
#         )
#         .order_by("-total")
#         .first()
#     )

#     highest_revenue = "₹0"

#     if highest_department and highest_department["total"]:

#         highest_amount = (
#             highest_department["total"]
#         )

#         if highest_amount >= 100000:

#             highest_revenue = (
#                 f"₹{round(highest_amount / 100000, 2)}L"
#             )

#         else:

#             highest_revenue = (
#                 f"₹{round(highest_amount, 2)}"
#             )

#     # =========================================
#     # QUARTER GROWTH
#     # =========================================

#     current_count = appointments.count()

#     previous_count = max(
#         current_count - 5,
#         1
#     )

#     growth_percent = round(

#         (
#             (current_count - previous_count)
#             / previous_count
#         ) * 100,

#         1

#     )

#     growth = f"+{growth_percent}%"

#     # =========================================
#     # AVG REVENUE / PATIENT
#     # =========================================

#     avg_revenue_patient = appointments.aggregate(
#         avg=Avg("accepted_total_amount")
#     )["avg"] or 0

#     avg_revenue = (
#         f"₹{round(avg_revenue_patient, 2)}"
#     )

#     avg_budget = appointments.aggregate(
#         avg=Avg("budget")
#     )["avg"] or 0

#     total_appointments = appointments.count()

#     # =========================================
#     # BAR CHART
#     # =========================================

#     department_queryset = (
#         appointments
#         .values("category__name")
#         .annotate(
#             total=Sum("accepted_total_amount")
#         )
#     )

#     bar_labels = []
#     bar_values = []

#     for item in department_queryset:

#         if item["category__name"]:

#             bar_labels.append(
#                 item["category__name"]
#             )

#             bar_values.append(
#                 float(item["total"] or 0)
#             )

#     if not bar_labels:

#         bar_labels = ["OPD"]
#         bar_values = [0]

#     # =========================================
#     # PIE CHART
#     # =========================================

#     service_queryset = (
#         appointments
#         .values("service_type__name")
#         .annotate(total=Count("id"))
#     )

#     pie_labels = []
#     pie_values = []

#     for item in service_queryset:

#         if item["service_type__name"]:

#             pie_labels.append(
#                 item["service_type__name"]
#             )

#             pie_values.append(
#                 item["total"]
#             )

#     if not pie_labels:

#         pie_labels = ["Emergency"]
#         pie_values = [0]

#     # =========================================
#     # LOAD ANALYTICS
#     # =========================================

#     hourly_queryset = (
#         appointments
#         .annotate(
#             hour=TruncHour("created_at")
#         )
#         .values("hour")
#         .annotate(total=Count("id"))
#         .order_by("hour")
#     )

#     line_labels = []
#     line_values = []

#     for item in hourly_queryset:

#         if item["hour"]:

#             line_labels.append(
#                 item["hour"].strftime("%I:%M %p")
#             )

#             line_values.append(
#                 item["total"]
#             )

#     if not line_labels:

#         line_labels = ["10:00 AM"]
#         line_values = [0]

#     # =========================================
#     # HEATMAP DATA
#     # =========================================

#     state_queryset = (
#         appointments
#         .exclude(address__isnull=True)
#         .values("address__city")
#         .annotate(total=Count("id"))
#     )

#     heatmap_labels = []
#     heatmap_values = []

#     city_state_map = {

#         "Mumbai": "Maharashtra",
#         "Pune": "Maharashtra",
#         "Nagpur": "Maharashtra",
#         "Delhi": "Delhi",
#         "Bangalore": "Karnataka",
#         "Chennai": "Tamil Nadu",
#         "Ahmedabad": "Gujarat",
#         "Jaipur": "Rajasthan",
#         "Lucknow": "Uttar Pradesh",
#         "Kolkata": "West Bengal"

#     }

#     for item in state_queryset:

#         city = item["address__city"]

#         if city in city_state_map:

#             heatmap_labels.append(
#                 city_state_map[city]
#             )

#             heatmap_values.append(
#                 item["total"]
#             )

#     # =========================================
#     # PATIENT JOURNEY
#     # =========================================

#     total_leads = appointments.count()

#     qualified_leads = appointments.filter(
#         status__in=[
#             "Accepted",
#             "Completed"
#         ]
#     ).count()

#     opportunities = appointments.filter(
#         accepted_bid__isnull=False
#     ).count()

#     proposals = appointments.filter(
#         accepted_total_amount__isnull=False
#     ).count()

#     closed = appointments.filter(
#         status="Completed"
#     ).count()

#     # =========================================
#     # FINAL RESPONSE
#     # =========================================

#     data = {

#         "stats": {

#             "revenue": formatted_revenue,

#             "highest_revenue": highest_revenue,

#             "growth": growth,

#             "avg_revenue": avg_revenue,

#             "avg_budget":
#             round(float(avg_budget), 2),

#             "total_appointments":
#             total_appointments

#         },

#         "most_requested_test": {

#             "labels": bar_labels,

#             "data": bar_values

#         },

#         "revenue_by_test": {

#             "labels": pie_labels,

#             "data": pie_values

#         },

#         "bid_trend": {

#             "labels": line_labels,

#             "cbc": line_values

#         },

#         "heatmap": {

#             "labels": heatmap_labels,

#             "data": heatmap_values

#         },

#         "patient_journey": {

#             "labels": [

#                 "Leads Generated",
#                 "Qualified Leads",
#                 "Opportunities Created",
#                 "Proposals Sent",
#                 "Deals Closed"

#             ],

#             "data": [

#                 total_leads,
#                 qualified_leads,
#                 opportunities,
#                 proposals,
#                 closed

#             ],

#             "conversion": [

#                 "100%",

#                 f"{round((qualified_leads / total_leads) * 100) if total_leads > 0 else 0}%",

#                 f"{round((opportunities / total_leads) * 100) if total_leads > 0 else 0}%",

#                 f"{round((proposals / total_leads) * 100) if total_leads > 0 else 0}%",

#                 f"{round((closed / total_leads) * 100) if total_leads > 0 else 0}%"

#             ]

#         },

#         "package_table": [

#             {

#                 "package": label,

#                 "bookings": value,

#                 "conversion":
#                 f"{round((value / total_appointments) * 100) if total_appointments > 0 else 0}%"

#             }

#             for label, value in zip(
#                 pie_labels,
#                 pie_values
#             )

#         ]

#     }

#     return JsonResponse(data)

# ---------------------------------------------------------------------------
# REPORT DATE / VISIT-TYPE FILTERS
# ---------------------------------------------------------------------------
#
# The doctor report groups and charts rows with `TruncDate("created_at")`
# below. Use the same timezone-aware expression for filtering, so an
# appointment near midnight is assigned to the same local date in both places.


def report_created_date_expression():
    """Wall-clock date expression for a report row's ``created_at``."""
    return TruncDate("created_at")


def apply_report_date_filter(qs, filter_type, start_date=None, end_date=None):
    """Restrict a report queryset to the requested date window.

    ``today`` / ``week`` / ``month`` are presets; ``custom`` uses the
    ``start_date`` / ``end_date`` pair. An unknown or empty filter leaves the
    queryset untouched so a bad request can never blank the whole report.
    """
    filter_type = str(filter_type or "").strip().lower()
    if filter_type in {"", "all", "none", "clear"}:
        return qs

    today = timezone.localdate()

    if filter_type == "today":
        start = end = today
    elif filter_type == "week":
        # Rolling last 7 days including today.
        start = today - timedelta(days=6)
        end = today
    elif filter_type == "month":
        # Current calendar month up to today.
        start = today.replace(day=1)
        end = today
    elif filter_type == "custom":
        start = parse_filter_date(start_date) if start_date else None
        end = parse_filter_date(end_date) if end_date else None
        if not start and not end:
            # Calendar opened but nothing picked yet - show everything rather
            # than an empty report.
            return qs
        start = start or end
        end = end or start
        if start > end:
            start, end = end, start
    else:
        return qs

    return qs.annotate(
        _report_date=report_created_date_expression()
    ).filter(_report_date__range=(start, end))


def apply_report_visit_type_filter(qs, visit_type):
    """Restrict a report queryset to one visit type ("home" / "clinic")."""
    visit_type = str(visit_type or "").strip().lower()
    if not visit_type or visit_type in {"all", "none", "clear"}:
        return qs

    aliases = visit_type_filter_aliases(visit_type)
    if not aliases:
        return qs

    condition = Q()
    for alias in aliases:
        condition |= Q(consultation_type__iexact=alias)

    return qs.filter(condition)


@dashboard_login_required
def doctor_report_data(request):

    filter_type = request.GET.get(
        "filter",
        "month"
    ).strip().lower()

    visit_type = request.GET.get("visit_type", "").strip().lower()
    search = (request.GET.get("search", "") or request.GET.get("q", "")).strip()
    start_date = request.GET.get("start_date", "").strip()
    end_date = request.GET.get("end_date", "").strip()

    # Keep the visible range label aligned with the same presets and custom
    # dates used by apply_report_date_filter below.
    today = timezone.localdate()
    if filter_type == "today":
        range_start = range_end = today
    elif filter_type == "week":
        range_start, range_end = today - timedelta(days=6), today
    elif filter_type == "month":
        range_start, range_end = today.replace(day=1), today
    elif filter_type == "custom":
        range_start = parse_filter_date(start_date) if start_date else None
        range_end = parse_filter_date(end_date) if end_date else None
        range_start = range_start or range_end
        range_end = range_end or range_start
        if range_start and range_end and range_start > range_end:
            range_start, range_end = range_end, range_start
    else:
        range_start = range_end = None

    range_label = (
        f"{range_start:%b %d, %Y} – {range_end:%b %d, %Y}"
        if range_start and range_end else "All dates"
    )

    user = request.user_obj
    doctor_profile = getattr(user, "doctor_profile", None)

    appointments = DoctorAppointment.objects.none()

    if doctor_profile:
        appointments = DoctorAppointment.objects.filter(
            doctor=doctor_profile
        ).select_related("address")
    else:
        appointments = DoctorAppointment.objects.filter(
            user=user
        ).select_related("address")

    # Date filter (today / week / month / custom start..end).
    appointments = apply_report_date_filter(
        appointments,
        filter_type,
        start_date=start_date,
        end_date=end_date,
    )

    # Visit type filter (home / clinic); "all"/empty leaves the list untouched.
    appointments = apply_report_visit_type_filter(appointments, visit_type)

    if search:
        # .alias() (not .annotate()) so the helper expression is usable for
        # filtering but is NOT added to GROUP BY in the day/heatmap
        # aggregations below.
        appointments = appointments.alias(
            patient_full_name=Concat(
                Coalesce("user__userprofile__first_name", Value("")),
                Value(" "),
                Coalesce("user__userprofile__last_name", Value("")),
            )
        ).filter(
            Q(patient_full_name__icontains=search)
            | Q(user__userprofile__first_name__icontains=search)
            | Q(user__userprofile__last_name__icontains=search)
            | Q(address__first_name__icontains=search)
            | Q(address__last_name__icontains=search)
            | Q(consultation_type__icontains=search)
            | Q(service_type__icontains=search)
            | Q(status__icontains=search)
        )

    total_patients = appointments.count()
    birds_received = appointments.filter(
        consultation_type="home_visit"
    ).count()

    previous_count = max(total_patients - 5, 1)
    quarter_growth = round(
        ((total_patients - previous_count) / previous_count) * 100,
        1
    )

    avg_revenue_patient = appointments.aggregate(
        avg=Avg("budget")
    )["avg"] or 0
    avg_revenue = round(float(avg_revenue_patient), 2)

    daily_queryset = (
        appointments
        .annotate(day=TruncDate("created_at"))
        .values("day")
        .annotate(
            appointments=Count("id"),
            avg_fee=Avg("budget"),
            earnings=Sum("budget"),
            won=Count(
                "id",
                filter=Q(status=AppointmentStatus.COMPLETED),
            ),
            lost=Count(
                "id",
                filter=Q(status=AppointmentStatus.CANCELLED),
            ),
        )
        .order_by("day")
    )

    bid_chart = []
    consultation_data = []

    for item in daily_queryset:
        total_for_day = item["appointments"] or 1
        win_percent = round((item["won"] / total_for_day) * 100)
        loss_percent = round((item["lost"] / total_for_day) * 100)

        bid_chart.append({
            "day": item["day"].strftime("%a"),
            "won": win_percent,
            "lost": loss_percent,
        })

        consultation_data.append({
            "day": item["day"].strftime("%a"),
            "appointments": item["appointments"],
            "avg_fee": round(float(item["avg_fee"] or 0), 2),
            "earnings": float(item["earnings"] or 0),
        })

    if not bid_chart:
        bid_chart = [{"day": "No Data", "won": 0, "lost": 0}]

    if not consultation_data:
        consultation_data = [{
            "day": "No Data",
            "appointments": 0,
            "avg_fee": 0,
            "earnings": 0,
        }]

    heatmap_rows = (
        appointments
        .exclude(address__state__isnull=True)
        .values("address__state__name")
        .annotate(total=Count("id"))
    )

    heatmap_data = []

    for row in heatmap_rows:
        state_name = (row["address__state__name"] or "").strip().lower()
        state_id = STATE_HEATMAP_IDS.get(state_name)
        if state_id:
            heatmap_data.append({
                "id": state_id,
                "value": row["total"],
            })

    if not heatmap_data:
        heatmap_data = [{"id": "IN-MH", "value": 0}]

    data = {
        "range_label": range_label,
        "stats": {
            "total_patients": total_patients,
            "birds_received": birds_received,
            "quarter_growth": quarter_growth,
            "avg_revenue": avg_revenue,
        },
        "bid_chart": bid_chart,
        "consultation_data": consultation_data,
        "heatmap_data": heatmap_data,
    }

    return JsonResponse(data)

from datetime import timedelta
from django.db.models import Sum, Avg, Count
from django.db.models.functions import TruncHour, ExtractWeek
from django.http import JsonResponse
from django.utils import timezone
from appointments.models import LabAppointments, AppointmentStatus
from dashboard.utils import dashboard_login_required


@dashboard_login_required
def lab_report_data(request):
    filter_type = request.GET.get("filter", "today").strip().lower()
    visit_type = request.GET.get("visit_type", "").strip().lower()
    user = request.user_obj
    current_lab = getattr(user, "lab_profile", None)

    # Early exit if the user profile doesn't map to a lab
    if not current_lab:
        return JsonResponse({"error": "Unauthorized lab profile access."}, status=403)

    appointments = LabAppointments.objects.filter(accepted_lab=current_lab)
    if visit_type == "home":
        appointments = appointments.filter(
            Q(preferred_mode__iexact="home")
            | Q(preferred_mode__iexact="home-service")
            | Q(preferred_mode__iexact="home_visit")
        )
    elif visit_type in {"lab", "visit", "hospital"}:
        appointments = appointments.filter(
            Q(preferred_mode__iexact="visit")
            | Q(preferred_mode__iexact="lab")
            | Q(preferred_mode__iexact="hospital")
        )

    # =========================================
    # FILTER LOGIC AND RANGE LABEL
    # =========================================
    today = timezone.localdate()
    first_record = (
        LabAppointments.objects
        .filter(accepted_lab=current_lab)
        .order_by("created_at")
        .first()
    )

    if filter_type == "today":
        range_start = range_end = today
    elif filter_type == "week":
        range_start, range_end = today - timedelta(days=6), today
    elif filter_type == "month":
        range_start, range_end = today - timedelta(days=29), today
    elif filter_type == "year":
        range_start, range_end = today.replace(month=1, day=1), today
    elif filter_type == "custom":
        start_value = request.GET.get("start", "").strip() or request.GET.get("start_date", "").strip()
        end_value = request.GET.get("end", "").strip() or request.GET.get("end_date", "").strip()
        range_start = parse_filter_date(start_value) if start_value else None
        range_end = parse_filter_date(end_value) if end_value else None
        if not range_start or not range_end:
            return JsonResponse({"error": "Select both a valid start date and end date."}, status=400)
        if range_start > range_end:
            range_start, range_end = range_end, range_start
    elif filter_type in {"all", "none", "clear"}:
        filter_type = "all"
        if first_record:
            created_at = first_record.created_at
            range_start = (
                timezone.localtime(created_at).date()
                if timezone.is_aware(created_at)
                else created_at.date()
            )
        else:
            range_start = None
        range_end = today if first_record else None
    else:
        return JsonResponse({"error": "Invalid report date filter."}, status=400)

    if filter_type != "all" or range_start:
        if range_start and range_end:
            appointments = appointments.filter(created_at__date__range=(range_start, range_end))

    range_label = (
        f"{range_start:%b %d, %Y} – {range_end:%b %d, %Y}"
        if range_start and range_end else "All dates"
    )

    # =========================================
    # STATS AGGREGATION
    # =========================================
    metrics = appointments.aggregate(
        total_bookings=Count("id"),
        total_revenue=Sum("accepted_total_amount"),
        avg_bid=Avg("budget")
    )

    total_bookings = metrics["total_bookings"] or 0
    total_revenue = metrics["total_revenue"] or 0
    avg_bid = metrics["avg_bid"] or 0

    # Currency Layout Formatting (Indian Numbering System)
    if total_revenue >= 10000000:
        revenue_display = f"₹{round(float(total_revenue) / 10000000, 2)} Cr"
    elif total_revenue >= 100000:
        revenue_display = f"₹{round(float(total_revenue) / 100000, 2)} L"
    else:
        revenue_display = f"₹{round(float(total_revenue), 2)}"

    # =========================================
    # MOST REQUESTED TEST & PIE CHART (DB-SIDE)
    # =========================================
    test_aggregates = (
        appointments.exclude(test_type__isnull=True)
        .values("test_type__name")
        .annotate(count=Count("id"))
        .order_by("-count")
    )

    if test_aggregates.exists():
        labels = [item["test_type__name"] for item in test_aggregates]
        values = [item["count"] for item in test_aggregates]
        total_tests = sum(values)
        pie_data = [round((v / total_tests) * 100) for v in values]
    else:
        labels = ["No Data"]
        values = [1]
        pie_data = [0]

    # =========================================
    # LINE CHART (UPGRADED FROM EXTRA TO EXTRACTWEEK)
    # =========================================
    weekly_data = (
        appointments
        .annotate(week=ExtractWeek("created_at"))
        .values("week")
        .annotate(total=Count("id"))
        .order_by("week")
    )

    bid_labels = []
    cbc_data = []
    rtpcr_data = []

    for item in weekly_data:
        if item["week"] is not None:
            bid_labels.append(f"Week {int(item['week'])}")
            cbc_data.append(item["total"])
            rtpcr_data.append(item["total"])

    if not bid_labels:
        bid_labels = ["No Data"]
        cbc_data = [0]
        rtpcr_data = [0]

    # =========================================
    # DYNAMIC RATINGS
    # =========================================
    status_metrics = appointments.aggregate(
        completed=Count("id", filter=Q(status=AppointmentStatus.COMPLETED)),
        accepted=Count("id", filter=Q(status=AppointmentStatus.ACCEPTED)),
        pending=Count("id", filter=Q(status=AppointmentStatus.PENDING)),
        cancelled=Count("id", filter=Q(status=AppointmentStatus.CANCELLED)),
    )

    completed_count = status_metrics["completed"] or 0
    accepted_count = status_metrics["accepted"] or 0
    pending_count = status_metrics["pending"] or 0
    cancelled_count = status_metrics["cancelled"] or 0

    positive_reviews = completed_count + accepted_count
    ratings_percent = round((positive_reviews / total_bookings) * 100) if total_bookings > 0 else 0
    ratings_display = f"{ratings_percent}%"

    def calculate_percent(val):
        return round((val / total_bookings) * 100) if total_bookings > 0 else 0

    ratings_data = [
        {"stars": 5, "percent": calculate_percent(int(total_bookings * 0.45))},
        {"stars": 4, "percent": calculate_percent(int(total_bookings * 0.25))},
        {"stars": 3, "percent": calculate_percent(int(total_bookings * 0.15))},
        {"stars": 2, "percent": calculate_percent(int(total_bookings * 0.10))},
        {"stars": 1, "percent": calculate_percent(int(total_bookings * 0.05))},
    ]

    # =========================================
    # HEATMAP DATA
    # =========================================
    hourly_data = (
        appointments
        .annotate(hour=TruncHour("created_at"))
        .values("hour")
        .annotate(total=Count("id"))
        .order_by("hour")
    )

    heatmap_data = [
        {
            "hour": item["hour"].strftime("%I %p"),
            "count": item["total"]
        }
        for item in hourly_data if item["hour"]
    ]

    # =========================================
    # BID WIN VS LOSS RATE
    # =========================================
    total_status = completed_count + accepted_count + pending_count + cancelled_count
    total_divisor = total_status if total_status > 0 else 1

    win_percent = round(((completed_count + accepted_count) / total_divisor) * 100)
    loss_percent = round((cancelled_count / total_divisor) * 100)

    # =========================================
    # PACKAGED COMPACT PAYLOAD OBJECT
    # =========================================
    return JsonResponse({
        "range_label": range_label,
        "stats": {
            "revenue": revenue_display,
            "bookings": str(total_bookings),
            "ratings": ratings_display,
            "avg_bid": round(float(avg_bid), 2),
        },
        "most_requested_test": {
            "labels": labels,
            "data": values,
        },
        "revenue_by_test": {
            "labels": labels,
            "data": pie_data,
        },
        "bid_trend": {
            "labels": bid_labels,
            "cbc": cbc_data,
            "rtpcr": rtpcr_data,
        },
        "ratings_data": ratings_data,
        "heatmap_data": heatmap_data,
        "bid_win_loss": {
            "win": win_percent,
            "loss": loss_percent,
            "completed": completed_count,
            "cancelled": cancelled_count,
        }
    })



# @dashboard_login_required
# def reports(request):
#     user = request.user_obj
#     context = get_common_context(request, user)
#     if user.user_type == 'pharmacy':
#         return render(request, 'pharmacy_reports.html', context)
#     elif user.user_type == 'lab':
#         return render(request, 'lab_reports.html', context)
#     elif user.user_type == 'doctor':
#         return render(request, 'doctor_reports.html', context)
#     elif user.user_type == 'hospital':
#         return render(request, 'hospital_reports.html', context)
#     else:
#         return render(request, 'reports.html', context)
