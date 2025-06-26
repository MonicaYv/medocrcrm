from django.shortcuts import render
from django.urls import reverse


# Create your views here.
from .utils import dashboard_login_required
from .models import SettingMenu

@dashboard_login_required
def dashboard_home(request):
    user = request.user_obj
    # Show menu only for this user's type
    menu_items = SettingMenu.objects.filter(
        is_active=True, user_types__contains=[user.user_type]
    ).order_by('order')
    # You can add more user-specific logic here
    return render(request, "dashboard/home.html", {
        "user": user,
    })


def logout_view(request):
    request.session.flush()  # clears all session data
    return reverse('user/login')

