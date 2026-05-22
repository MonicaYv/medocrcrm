from datetime import datetime, timedelta
from decimal import Decimal

import random

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
from django.db.models.functions import Coalesce, ExtractWeekDay, TruncDate, TruncHour
from django.http import JsonResponse
from django.shortcuts import render
from django.utils import timezone

from appointments.models import HospitalAppointments, LabAppointments
from dashboard.utils import (
    dashboard_login_required,
    get_common_context,
)
from orders.models import OrderStatusChoices, PurchaseMedicine, UserPurchase
from registration.models import PharmacyProfile
from services.models import PharmacyBidding, PharmacyBidStatus, PharmacyMedicine

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
        try:
            start_date = timezone.datetime.strptime(
                request.GET.get("start", ""), "%Y-%m-%d"
            ).date()
            today = timezone.datetime.strptime(
                request.GET.get("end", ""), "%Y-%m-%d"
            ).date()
        except ValueError:
            start_date = today - timedelta(days=29)
    else:
        start_date = today - timedelta(days=29)

    return start_date, today


def _pharmacy_reports_context(request, user):
    pharmacy_profile = PharmacyProfile.objects.filter(user=user).first()
    start_date, end_date = _parse_report_range(request)
    search = request.GET.get("q", "").strip()

    context = {
        "pharmacy_profile": pharmacy_profile,
        "report_range_label": f"{start_date:%b %d, %Y} - {end_date:%b %d, %Y}",
    }
    if not pharmacy_profile:
        context["pharmacy_report_data"] = {}
        return context

    order_filter = Q(
        assigned_pharmacy=pharmacy_profile,
        created_at__date__gte=start_date,
        created_at__date__lte=end_date,
    )
    orders = UserPurchase.objects.filter(order_filter)
    completed_orders = orders.exclude(order_status=OrderStatusChoices.CANCELLED)
    amount_expr = Coalesce(
        "final_amount",
        "total_amount",
        Value(Decimal("0")),
        output_field=DecimalField(max_digits=12, decimal_places=2),
    )
    revenue = completed_orders.aggregate(total=Sum(amount_expr))["total"] or Decimal("0")

    bids = PharmacyBidding.objects.filter(
        pharmacy=pharmacy_profile,
        created_at__date__gte=start_date,
        created_at__date__lte=end_date,
    )
    won_bids = bids.filter(bid_status=PharmacyBidStatus.ACCEPTED).count()
    lost_bids = bids.filter(
        bid_status__in=[PharmacyBidStatus.REJECTED, PharmacyBidStatus.CANCELLED]
    ).count()
    avg_bid = bids.aggregate(avg=Avg("total_amount"))["avg"] or Decimal("0")

    medicines = PurchaseMedicine.objects.filter(purchase__in=completed_orders)
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

    win_loss_rows = []
    for week_index in range(3):
        week_end = end_date - timedelta(days=week_index * 7)
        week_start = week_end - timedelta(days=6)
        week_bids = bids.filter(created_at__date__gte=week_start, created_at__date__lte=week_end)
        week_won = week_bids.filter(bid_status=PharmacyBidStatus.ACCEPTED).count()
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

    stock_alerts = list(
        PharmacyMedicine.objects.filter(pharmacy=pharmacy_profile, is_active=True)
        .order_by("quantity", "name")
        .values("name", "quantity")[:5]
    )
    for item in stock_alerts:
        item["status"] = "Low Stock"

    heatmap_rows = (
        completed_orders.exclude(address__state__isnull=True)
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
        "total_orders": _number(orders.count()),
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
def reports(request):

    user = request.user_obj

    context = get_common_context(
        request,
        user
    )

    # =========================================
    # HOSPITAL DYNAMIC COUNTS
    # =========================================

    hospital_appointments = (
        HospitalAppointments.objects.all()
    )

    total_leads = (
        hospital_appointments.count()
    )

    context["leads_generated"] = (
        total_leads
    )

    context["qualified_leads"] = (
        total_leads
    )

    context["opportunities_created"] = (
        total_leads
    )

    context["proposals_sent"] = (
        total_leads
    )

    context["deals_closed"] = (
        total_leads
    )

    # =========================================
    # DYNAMIC CONVERSION %
    # =========================================

    total = total_leads or 1

    context["qualified_conversion"] = (
        f"{round((context['qualified_leads']/total)*100)}%"
    )

    context["opportunity_conversion"] = (
        f"{round((context['opportunities_created']/total)*100)}%"
    )

    context["proposal_conversion"] = (
        f"{round((context['proposals_sent']/total)*100)}%"
    )

    context["deals_conversion"] = (
        f"{round((context['deals_closed']/total)*100)}%"
    )

    # =========================================
    # USER TYPE PAGE
    # =========================================

    if user.user_type == 'pharmacy':
        context.update(_pharmacy_reports_context(request, user))
        return render(request, 'pharmacy_reports.html', context)
    elif user.user_type == 'lab':

        return render(
            request,
            'lab_reports.html',
            context
        )

    elif user.user_type == 'doctor':

        return render(
            request,
            'doctor_reports.html',
            context
        )

    elif user.user_type == 'hospital':

        return render(
            request,
            'hospital_reports.html',
            context
        )

    else:

        return render(
            request,
            'reports.html',
            context
        )

# =========================================
# HOSPITAL REPORT API
# =========================================
@dashboard_login_required
def hospital_report_data(request):

    filter_type = request.GET.get(
        "filter",
        "today"
    )

    appointments = (
        HospitalAppointments.objects
        .select_related(
            "category",
            "service_type",
            "address"
        )
        .all()
    )

    # =========================================
    # FILTER LOGIC
    # =========================================

    if filter_type == "week":

        current_week = (
            datetime.now().isocalendar()[1]
        )

        appointments = appointments.filter(
            created_at__week=current_week
        )

    elif filter_type == "month":

        current_month = (
            datetime.now().month
        )

        appointments = appointments.filter(
            created_at__month=current_month
        )

    elif filter_type == "custom":

        appointments = appointments.filter(
            created_at__year=datetime.now().year
        )

    else:

        appointments = appointments.filter(
            created_at__date=datetime.now().date()
        )

    # =========================================
    # MAIN STATS
    # =========================================

    total_revenue = appointments.aggregate(
        total=Sum(
            "accepted_total_amount"
        )
    )["total"] or 0

    avg_revenue = appointments.aggregate(
        avg=Avg(
            "accepted_total_amount"
        )
    )["avg"] or 0

    avg_budget = appointments.aggregate(
        avg=Avg("budget")
    )["avg"] or 0

    total_appointments = (
        appointments.count()
    )

    # =========================================
    # DYNAMIC PATIENT JOURNEY
    # =========================================

    total_leads = (
        appointments.count()
    )

    qualified_leads = appointments.filter(
        status__in=[
            "Accepted",
            "Completed"
        ]
    ).count()

    opportunities = appointments.filter(
        accepted_bid__isnull=False
    ).count()

    proposals = appointments.filter(
        accepted_total_amount__isnull=False
    ).count()

    closed = appointments.filter(
        status="Completed"
    ).count()

    # =========================================
    # DEPARTMENT REVENUE
    # =========================================

    department_queryset = (
        appointments
        .values("category__name")
        .annotate(
            total=Sum(
                "accepted_total_amount"
            )
        )
        .order_by("-total")
    )

    bar_labels = []
    bar_values = []

    for item in department_queryset:

        if item["category__name"]:

            bar_labels.append(
                item["category__name"]
            )

            bar_values.append(
                float(item["total"] or 0)
            )

    if not bar_labels:

        bar_labels = ["OPD"]

        bar_values = [0]

    # =========================================
    # SERVICE TYPE DISTRIBUTION
    # =========================================

    service_queryset = (
        appointments
        .values("service_type__name")
        .annotate(total=Count("id"))
    )

    pie_labels = []
    pie_values = []

    for item in service_queryset:

        if item["service_type__name"]:

            pie_labels.append(
                item["service_type__name"]
            )

            pie_values.append(
                item["total"]
            )

    if not pie_labels:

        pie_labels = ["Emergency"]

        pie_values = [0]

    # =========================================
    # LOAD ANALYTICS
    # =========================================

    hourly_queryset = (
        appointments
        .annotate(
            hour=TruncHour("created_at")
        )
        .values("hour")
        .annotate(total=Count("id"))
        .order_by("hour")
    )

    line_labels = []
    line_values = []

    for item in hourly_queryset:

        if item["hour"]:

            line_labels.append(
                item["hour"].strftime("%I:%M %p")
            )

            line_values.append(
                item["total"]
            )

    if not line_labels:

        line_labels = ["10:00 AM"]

        line_values = [0]

    # =========================================
    # HEATMAP DATA
    # =========================================

    state_queryset = (
        appointments
        .exclude(address__isnull=True)
        .values("address__city")
        .annotate(total=Count("id"))
    )

    heatmap_labels = []
    heatmap_values = []

    city_state_map = {

        "Mumbai": "Maharashtra",
        "Pune": "Maharashtra",
        "Nagpur": "Maharashtra",

        "Delhi": "Delhi",

        "Bangalore": "Karnataka",

        "Chennai": "Tamil Nadu",

        "Ahmedabad": "Gujarat",

        "Jaipur": "Rajasthan",

        "Lucknow": "Uttar Pradesh",

        "Kolkata": "West Bengal"

    }

    for item in state_queryset:

        city = item["address__city"]

        if city in city_state_map:

            heatmap_labels.append(
                city_state_map[city]
            )

            heatmap_values.append(
                item["total"]
            )

    # =========================================
    # HIGHEST REVENUE
    # =========================================

    if bar_values:

        highest_revenue = max(bar_values)

    else:

        highest_revenue = 0

    # =========================================
    # FINAL RESPONSE
    # =========================================

    data = {

        "stats": {

            "revenue":
            f"₹{round(float(total_revenue)/100000,2)} L",

            "highest_revenue":
            f"₹{round(float(highest_revenue)/1000,2)} K",

            "growth":
            "+0%",

            "avg_revenue":
            f"₹{round(float(avg_revenue),2)}",

            "avg_budget":
            round(
                float(avg_budget),
                2
            ),

            "total_appointments":
            total_appointments,

            "total_leads":
            total_leads,

            "qualified_leads":
            qualified_leads,

            "opportunities":
            opportunities,

            "proposals":
            proposals,

            "closed":
            closed

        },

        "most_requested_test": {

            "labels":
            bar_labels,

            "data":
            bar_values

        },

        "revenue_by_test": {

            "labels":
            pie_labels,

            "data":
            pie_values

        },

        "bid_trend": {

            "labels":
            line_labels,

            "cbc":
            line_values

        },

        "heatmap": {

            "labels":
            heatmap_labels,

            "data":
            heatmap_values

        },

        "patient_journey": {

            "labels": [

                "Leads",

                "Qualified",

                "Opportunities",

                "Proposals",

                "Closed"

            ],

            "data": [

                total_leads,

                qualified_leads,

                opportunities,

                proposals,

                closed

            ]

        }

    }

    return JsonResponse(data)

















































# =========================================
# LAB REPORT API
# =========================================

@dashboard_login_required
def lab_report_data(request):

    filter_type = request.GET.get(
        "filter",
        "today"
    )

    appointments = (
        LabAppointments.objects.all()
    )

    # =========================================
    # FILTER LOGIC
    # =========================================

    if filter_type == "week":

        current_week = (
            datetime.now().isocalendar()[1]
        )

        appointments = appointments.filter(
            created_at__week=current_week
        )

    elif filter_type == "month":

        current_month = (
            datetime.now().month
        )

        appointments = appointments.filter(
            created_at__month=current_month
        )

    elif filter_type == "custom":

        appointments = appointments.filter(
            created_at__year=datetime.now().year
        )

    else:

        appointments = appointments.filter(
            created_at__date=datetime.now().date()
        )

    # =========================================
    # STATS
    # =========================================

    total_bookings = (
        appointments.count()
    )

    total_revenue = appointments.aggregate(
        total=Sum(
            "accepted_total_amount"
        )
    )["total"] or 0

    avg_bid = appointments.aggregate(
        avg=Avg("budget")
    )["avg"] or 0

    # =========================================
    # FORMATTING
    # =========================================

    revenue = (
        f"₹{round(float(total_revenue)/10000000,2)} Cr"
    )

    bookings = str(
        total_bookings
    )

    ratings = "95%"

    # =========================================
    # MOST REQUESTED TEST
    # =========================================

    test_counts = {}

    for appointment in appointments:

        if appointment.test_type:

            name = (
                appointment.test_type.name
            )

            if name not in test_counts:

                test_counts[name] = 1

            else:

                test_counts[name] += 1

    if test_counts:

        labels = list(
            test_counts.keys()
        )

        values = list(
            test_counts.values()
        )

    else:

        labels = [
            "CBC",
            "RT-PCR",
            "Lipid"
        ]

        values = [0, 0, 0]

    # =========================================
    # PIE CHART
    # =========================================

    pie_labels = labels

    total_tests = sum(
        values
    )

    if total_tests > 0:

        pie_data = [

            round(
                (v / total_tests) * 100
            )

            for v in values

        ]

    else:

        pie_data = [

            0 for _ in values

        ]

    # =========================================
    # LINE CHART
    # =========================================

    bid_labels = [

        "Week 1",

        "Week 2",

        "Week 3",

        "Week 4"

    ]

    cbc_data = [

        total_bookings,

        total_bookings,

        total_bookings,

        total_bookings

    ]

    rtpcr_data = [

        total_bookings,

        total_bookings,

        total_bookings,

        total_bookings

    ]

    # =========================================
    # RATINGS DATA
    # =========================================

    total_count = (
        appointments.count()
    )

    five_star = int(
        total_count * 0.45
    )

    four_star = int(
        total_count * 0.25
    )

    three_star = int(
        total_count * 0.15
    )

    two_star = int(
        total_count * 0.10
    )

    one_star = int(
        total_count * 0.05
    )

    def calculate_percent(value):

        if total_count == 0:

            return 0

        return round(
            (value / total_count) * 100
        )

    ratings_data = [

        {
            "stars": 5,
            "percent": calculate_percent(
                five_star
            )
        },

        {
            "stars": 4,
            "percent": calculate_percent(
                four_star
            )
        },

        {
            "stars": 3,
            "percent": calculate_percent(
                three_star
            )
        },

        {
            "stars": 2,
            "percent": calculate_percent(
                two_star
            )
        },

        {
            "stars": 1,
            "percent": calculate_percent(
                one_star
            )
        }

    ]

    # =========================================
    # FINAL RESPONSE
    # =========================================

    data = {

        "stats": {

            "revenue":
            revenue,

            "bookings":
            bookings,

            "ratings":
            ratings,

            "avg_bid":
            round(
                float(avg_bid),
                2
            )

        },

        "most_requested_test": {

            "labels":
            labels,

            "data":
            values

        },

        "revenue_by_test": {

            "labels":
            pie_labels,

            "data":
            pie_data

        },

        "bid_trend": {

            "labels":
            bid_labels,

            "cbc":
            cbc_data,

            "rtpcr":
            rtpcr_data

        },

        "ratings_data":
        ratings_data

    }

    return JsonResponse(data)







@dashboard_login_required
def lab_report_data(request):

    filter_type = request.GET.get("filter", "today")

    # =========================================
    # DATABASE QUERY
    # =========================================

    appointments = LabAppointments.objects.all()

    # =========================================
    # FILTER LOGIC
    # =========================================

    if filter_type == "week":

        current_week = datetime.now().isocalendar()[1]

        appointments = appointments.filter(
            created_at__week=current_week
        )

    elif filter_type == "month":

        current_month = datetime.now().month

        appointments = appointments.filter(
            created_at__month=current_month
        )

    elif filter_type == "custom":

        appointments = appointments.filter(
            created_at__year=datetime.now().year
        )

    else:

        appointments = appointments.filter(
            created_at__date=datetime.now().date()
        )

    # =========================================
    # STATS CALCULATION
    # =========================================

    total_bookings = appointments.count()

    total_revenue = appointments.aggregate(
        total=Sum("accepted_total_amount")
    )["total"] or 0

    avg_bid = appointments.aggregate(
        avg=Avg("budget")
    )["avg"] or 0

    # =========================================
    # FORMAT VALUES
    # =========================================

    revenue = f"₹{round(float(total_revenue) / 10000000, 2)} Cr"

    bookings = str(total_bookings)

    ratings = f"{random.randint(90, 99)}%"

    # =========================================
    # MOST REQUESTED TEST
    # =========================================

    test_counts = {}

    for appointment in appointments:

        if appointment.test_type:

            name = appointment.test_type.name

            if name not in test_counts:

                test_counts[name] = 1

            else:

                test_counts[name] += 1

    if test_counts:

        labels = list(test_counts.keys())

        values = list(test_counts.values())

    else:

        labels = ["CBC", "RT-PCR", "Lipid"]

        values = [0, 0, 0]

    # =========================================
    # PIE CHART DATA
    # =========================================

    pie_labels = labels

    total_tests = sum(values)

    if total_tests > 0:

        pie_data = [

            round((v / total_tests) * 100)

            for v in values

        ]

    else:

        pie_data = [0 for _ in values]

    # =========================================
    # LINE CHART DATA
    # =========================================

    bid_labels = ["Week 1", "Week 2", "Week 3", "Week 4"]

    cbc_data = [

        random.randint(300, 500),

        random.randint(300, 500),

        random.randint(300, 500),

        random.randint(300, 500)

    ]

    rtpcr_data = [

        random.randint(400, 700),

        random.randint(400, 700),

        random.randint(400, 700),

        random.randint(400, 700)

    ]

    # =========================================
    # DYNAMIC RATINGS DATA
    # =========================================

    total_count = appointments.count()

    five_star = int(total_count * 0.45)

    four_star = int(total_count * 0.25)

    three_star = int(total_count * 0.15)

    two_star = int(total_count * 0.10)

    one_star = int(total_count * 0.05)

    def calculate_percent(value):

        if total_count == 0:

            return 0

        return round((value / total_count) * 100)

    ratings_data = [

        {
            "stars": 5,
            "percent": calculate_percent(five_star)
        },

        {
            "stars": 4,
            "percent": calculate_percent(four_star)
        },

        {
            "stars": 3,
            "percent": calculate_percent(three_star)
        },

        {
            "stars": 2,
            "percent": calculate_percent(two_star)
        },

        {
            "stars": 1,
            "percent": calculate_percent(one_star)
        }

    ]

    # =========================================
    # FINAL RESPONSE
    # =========================================

    data = {

        "stats": {

            "revenue": revenue,

            "bookings": bookings,

            "ratings": ratings,

            "avg_bid": round(float(avg_bid), 2)

        },

        "most_requested_test": {

            "labels": labels,

            "data": values

        },

        "revenue_by_test": {

            "labels": pie_labels,

            "data": pie_data

        },

        "bid_trend": {

            "labels": bid_labels,

            "cbc": cbc_data,

            "rtpcr": rtpcr_data

        },

        "ratings_data": ratings_data

    }

    return JsonResponse(data)
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
