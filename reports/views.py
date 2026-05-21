from django.shortcuts import render
from dashboard.utils import dashboard_login_required, get_common_context
from django.http import JsonResponse
from datetime import datetime
from django.http import JsonResponse
import random
# Create your views here.

@dashboard_login_required
def reports(request):

    user = request.user_obj
    context = get_common_context(request, user)

    # Dynamic conversion data
    context["leads_generated"] = 99999
    context["qualified_leads"] = 123456
    context["opportunities_created"] = 3750
    context["proposals_sent"] = 1875
    context["deals_closed"] = 999

    context["qualified_conversion"] = "75%"
    context["opportunity_conversion"] = "50%"
    context["proposal_conversion"] = "50%"
    context["deals_conversion"] = "20%"

    if user.user_type == 'pharmacy':
        return render(request, 'pharmacy_reports.html', context)

    elif user.user_type == 'lab':
        return render(request, 'lab_reports.html', context)

    elif user.user_type == 'doctor':
        return render(request, 'doctor_reports.html', context)

    elif user.user_type == 'hospital':
        return render(request, 'hospital_reports.html', context)

    else:
        return render(request, 'reports.html', context)

def hospital_report_data(request):

    filter_type = request.GET.get("filter", "today")

    data = {

        "stats": {
            "revenue": "₹1.2 Cr"
        },

        "most_requested_test": {
            "labels": ["Jan", "Feb", "Mar", "Apr"],
            "data": [120, 160, 90, 180]
        },

        "revenue_by_test": {
            "labels": [
                "Direct",
                "NGO Referrals",
                "Ads"
            ],
            "data": [15, 35, 50]
        },

        "bid_trend": {
            "labels": [
                "10:00",
                "10:30",
                "11:00",
                "11:30"
            ],
            "cbc": [320, 340, 310, 360]
        }

    }

    return JsonResponse(data)
    
@dashboard_login_required
def lab_report_data(request):

    filter_type = request.GET.get("filter", "today")
    if filter_type == "week":

        revenue = "₹4.8 Cr"
        ratings = "95%"
        bookings = "18k"

    elif filter_type == "month":

       revenue = "₹9.2 Cr"
       ratings = "97%"
       bookings = "25k"

    elif filter_type == "custom":

       revenue = "₹12 Cr"
       ratings = "99%"
       bookings = "40k"

    else:

       revenue = "₹1.2 Cr"
       ratings = "92.2%"
       bookings = "12k"

    data = {

        "stats": {
            "revenue": revenue,
            "ratings": ratings,
            "bookings": bookings,
            "avg_bid": 49
        },


    

        "most_requested_test": {
            "labels": ["CBC", "RT-PCR", "Lipid", "Thyroid", "HBAC"],
            "data": [120, 160, 70, 150, 100]
        },

        "revenue_by_test": {
            "labels": ["CBC", "RT-PCR", "Lipid", "Thyroid", "Others"],
            "data": [30, 25, 18, 12, 12]
        },

        "bid_trend": {
            "labels": ["Week 1", "Week 2", "Week 3", "Week 4"],
            "cbc": [320, 340, 310, 360],
            "rtpcr": [420, 380, 460, 400]
        },

        "ratings_data": [
            {"stars": 5, "percent": 74},
            {"stars": 4, "percent": 54},
            {"stars": 3, "percent": 38},
            {"stars": 2, "percent": 18},
            {"stars": 1, "percent": 3},
        ]
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