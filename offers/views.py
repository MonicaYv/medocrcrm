from django.shortcuts import render
from dashboard.utils import dashboard_login_required, get_common_context


# Create your views here.
@dashboard_login_required
def offers_view(request):
    user = request.user_obj
    context = get_common_context(request, user)
    if user.user_type == "pharmacy":
        return render(request, "pharmacy_offers.html", context)

    elif user.user_type == "doctor":
        return render(request, "doctor_offers.html", context)

    elif user.user_type == "hospital":
        return render(request, "hospital_offers.html", context)

    elif user.user_type == "lab":
        return render(request, "lab_offers.html", context)
