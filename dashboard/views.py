from django.shortcuts import render
from django.urls import reverse
from django.db.models import Sum
from django.utils import timezone

from .utils import dashboard_login_required
from .models import SettingMenu
from registration.models import NGOProfile
from ngopost.models import NGOPost

@dashboard_login_required
def dashboard_home(request):
    user = request.user_obj
    # Show menu only for this user's type
    menu_items = SettingMenu.objects.filter(
        is_active=True, user_types__contains=[user.user_type]
    ).order_by('order')
    
    try:
        ngo_profile = NGOProfile.objects.get(user=user)
        user_profile = user
    except NGOProfile.DoesNotExist:
        # Handle error, redirect or show 404
        return render(request, "dashboard/not_found.html")
    
    posts_qs = NGOPost.objects.filter(user=user)
    total_posts = posts_qs.count()
    total_views = posts_qs.aggregate(total_views=Sum('views'))['total_views'] or 0
    total_target = posts_qs.aggregate(total_target=Sum('target_donation'))['total_target'] or 0
    total_received = posts_qs.aggregate(total_received=Sum('donation_received'))['total_received'] or 0

    # Trending posts = top 4 by views in last 30 days
    trending_posts = posts_qs.filter(
        created_at__gte=timezone.now() - timezone.timedelta(days=30)
    ).order_by('-views')[:4]

    context = {
        'ngo_profile': ngo_profile,
        'user_profile': user_profile,
        'total_posts': total_posts,
        'total_views': total_views,
        'total_target': total_target,
        'total_received': total_received,
        'trending_posts': trending_posts,
        'menu_items': menu_items,
    }
    return render(request, "dashboard/home.html", context)

def logout_view(request):
    request.session.flush()  # clears all session data
    return reverse('user/login')
