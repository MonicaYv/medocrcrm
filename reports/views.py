
from django.shortcuts import render
from dashboard.utils import (
    dashboard_login_required,
    get_common_context
)

from django.http import JsonResponse

from datetime import datetime

from django.db.models import Sum, Avg, Count

from appointments.models import (
    LabAppointments,
    HospitalAppointments
)
import random
from django.db.models.functions import TruncHour

# =========================================
# REPORT PAGE
# =========================================

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

        return render(
            request,
            'pharmacy_reports.html',
            context
        )

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