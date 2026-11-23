from django.shortcuts import render
from dashboard.utils import dashboard_login_required, get_common_context

@dashboard_login_required
def payout_view(request):
    user = request.user_obj
    context = get_common_context(request, user)

    if user.user_type == "pharmacy":
        return render(request, "pharmacy_payout.html", context)

    elif user.user_type == "doctor":
        return render(request, "doctor_payout.html", context)