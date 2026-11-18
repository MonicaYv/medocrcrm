from django.shortcuts import render
from dashboard.utils import dashboard_login_required

# Create your views here.
@dashboard_login_required
def payout_view(request):
    user = request.user_obj
    if user.user_type != "pharmacy":
        return render(request, 'pharmacy_payout.html')
    if user.user_type == "doctor":
        return render(request, 'doctor_payout.html')