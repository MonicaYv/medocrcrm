from .models import SettingMenu
from registration.models import User

def sidebar_menu(request):
    # 1. Try Django auth user first
    user_type = None

    # If using Django auth
    # if hasattr(request, "user") and getattr(request.user, "is_authenticated", False):
    #     user_type = getattr(request.user, "user_type", None)

    # If using custom session user and decorator (request.user_obj)
    if not user_type and hasattr(request, "user_obj"):
        user_type = getattr(request.user_obj, "user_type", None)

    if not user_type:
        return {}

    menu = SettingMenu.objects.filter(
        is_active=True,
        user_types__contains=[user_type]
    ).order_by('order')
    return {'sidebar_menu': menu}
