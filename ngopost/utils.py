from django.shortcuts import redirect
from functools import wraps
from registration.models import User

def dashboard_login_required(view_func):
    @wraps(view_func)
    def _wrapped_view(request, *args, **kwargs):
        user_id = request.session.get('user_id')
        if not user_id:
            return redirect('user/login')
        # Optionally: attach the user object
        request.user_obj = User.objects.filter(id=user_id).first()
        if not request.user_obj:
            return redirect('user/login')
        return view_func(request, *args, **kwargs)
    return _wrapped_view