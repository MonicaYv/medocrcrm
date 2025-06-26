from .models import SettingMenu
from registration.models import User

def sidebar_menu(request):
    user_type = None
    if not user_type and hasattr(request, "user_obj"):
        user_type = getattr(request.user_obj, "user_type", None)

    if not user_type:
        return {}

    menu = SettingMenu.objects.filter(
        is_active=True,
        user_types__contains=[user_type]
    ).order_by('order')
    return {'sidebar_menu': menu}
