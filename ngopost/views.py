from django.shortcuts import render
import re
from datetime import datetime, date
from .models import (
    NGOPost, 
    Status,
    PostTypeOption, 
    DonationFrequencyOption, 
    CountryOption, 
    StateOption, 
    CityOption, 
    AgeOption, 
    GenderOption, 
    SpendingPowerOption
    )
from datetime import datetime
from dashboard.utils import dashboard_login_required, get_common_context
from django.http import JsonResponse, Http404
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_GET, require_POST
from django.db.models import Q
from donate.models import Donation
from django.template.loader import render_to_string
from django.core.paginator import Paginator
from django.shortcuts import get_object_or_404


@dashboard_login_required
def post_view(request):
    user = request.user_obj
    context = get_common_context(request, user)
    # GET request handling - load form data
    history_query = request.GET.get('history_query', '').strip().lower()
    saved_query = request.GET.get('saved_query', '').strip().lower()

    # Get limits with proper validation
    try:
        history_limit_int = int(request.GET.get('history_limit', '10'))
    except ValueError:
        history_limit_int = 10
    
    try:
        saved_limit_int = int(request.GET.get('saved_limit', '10'))
    except ValueError:
        saved_limit_int = 10

    # Base queries
    post_history = NGOPost.objects.filter(user=user).order_by('-created_at')
    saved_posts = NGOPost.objects.filter(user=user, saved=True)

    # Apply search filters
    if history_query:
        post_history = post_history.filter(
            Q(post_type__icontains=history_query) |
            Q(status__icontains=history_query) |
            Q(created_at__icontains=history_query)
        )
    if saved_query:
        saved_posts = saved_posts.filter(
            Q(post_type__icontains=saved_query) |
            Q(status__icontains=saved_query) |
            Q(created_at__icontains=saved_query)
        )

    # Apply limits
    post_history = post_history[:history_limit_int]
    saved_posts = saved_posts[:saved_limit_int]

    # Update post status and attach donations
    for post in post_history:
        if post.status == Status.ONGOING and post.end_date < datetime.now().date():
            post.update_status_if_needed()
        post.donation_list = Donation.objects.filter(ngopost=post).select_related('user').order_by('-payment_date')
    
    for post in saved_posts:
        if post.status == Status.ONGOING and post.end_date < datetime.now().date():
            post.update_status_if_needed()
        post.donation_list = Donation.objects.filter(ngopost=post).select_related('user').order_by('-payment_date')

    context.update({
        'post_history': post_history,
        'saved_posts': saved_posts,
        'history_query': history_query,
        'saved_query': saved_query,
        'history_limit': str(history_limit_int),
        'saved_limit': str(saved_limit_int),
        'post_type_options': PostTypeOption.objects.filter(is_active=True),
        'donation_frequency_options': DonationFrequencyOption.objects.filter(is_active=True),
        'country_options': CountryOption.objects.filter(is_active=True),
        'state_options': StateOption.objects.filter(is_active=True),
        'city_options': CityOption.objects.filter(is_active=True),
        'age_options': AgeOption.objects.filter(is_active=True),
        'gender_options': GenderOption.objects.filter(is_active=True),
        'spending_power_options': SpendingPowerOption.objects.filter(is_active=True),
    })
    return render(request, 'post.html', context)

@dashboard_login_required
def post_history_ajax(request):
    user = request.user_obj
    query = request.GET.get('query', '').strip()
    page = int(request.GET.get('page', 1))
    limit = int(request.GET.get('limit', 10))
    start_date = request.GET.get('start_date')
    end_date = request.GET.get('end_date')
    saved_only = request.GET.get('saved_only', '').lower() == 'true'

    filters = Q(user=user)

    if query:
        filters &= (
            Q(header__icontains=query) |
            Q(status__icontains=query) |
            Q(post_type__name__icontains=query)
        )

    if start_date:
        try:
            filters &= Q(created_at__date__gte=datetime.strptime(start_date, '%Y-%m-%d').date())
        except: pass

    if end_date:
        try:
            filters &= Q(created_at__date__lte=datetime.strptime(end_date, '%Y-%m-%d').date())
        except: pass

    if saved_only:
        filters &= Q(saved=True)

    posts = NGOPost.objects.filter(filters).order_by('-created_at')

    paginator = Paginator(posts, limit)
    page_obj = paginator.get_page(page)

    html = render_to_string("partials/post_history_rows.html", {
        "post_history": page_obj.object_list,
    })

    return JsonResponse({
        "html": html,
        "current_page": page_obj.number,
        "total_pages": paginator.num_pages,
    })

@dashboard_login_required
@csrf_exempt
def save_ngo_post(request):
    if request.method != "POST":
        return JsonResponse({'error': 'Invalid request method'}, status=405)

    user = request.user_obj

    data = request.POST
    files = request.FILES.getlist('creatives[]')

    required_fields = [
        'header', 'description', 'tags', 'post_type', 'donation_frequency',
        'target_donation', 'country', 'state', 'city', 'pincode',
        'age', 'gender', 'spending_power', 'start-date', 'end-date'
    ]
    missing_fields = [f for f in required_fields if not data.get(f)]
    if len(files) == 0:
        missing_fields.append('creatives[]')

    if missing_fields:
        return JsonResponse({'error': 'Missing required fields', 'missing_fields': missing_fields}, status=400)

    # Validate pincode - must be exactly 6 digits (e.g. Indian PIN codes)
    pincode = data.get('pincode', '').strip()
    if not re.fullmatch(r'\d{6}', pincode):
        return JsonResponse(
            {
                'error': 'Invalid pincode. Pincode must be exactly 6 digits.',
                'missing_fields': ['pincode'],
            },
            status=400
        )

    try:
        # Convert IDs to model instances
        post_type_instance = get_object_or_404(PostTypeOption, id=data['post_type'])
        country_instance = get_object_or_404(CountryOption, id=data['country'])
        state_instance = get_object_or_404(StateOption, id=data['state'])
        city_instance = get_object_or_404(CityOption, id=data['city'])
        age_instance = get_object_or_404(AgeOption, id=data['age'])
        gender_instance = get_object_or_404(GenderOption, id=data['gender'])
        spending_power_instance = get_object_or_404(SpendingPowerOption, id=data['spending_power'])

        post = NGOPost.objects.create(
            user=user,
            header=data['header'].strip()[:80],
            description=data['description'].strip()[:500],
            tags=data['tags'].strip()[:255],
            post_type=post_type_instance,
            donation_frequency=data['donation_frequency'],
            target_donation=data['target_donation'].replace('Rs', '').replace(',', '').strip(),
            country=country_instance,
            state=state_instance,
            city=city_instance,
            pincode=pincode,
            age_group=age_instance,
            gender=gender_instance,
            spending_power=spending_power_instance,
            start_date=datetime.strptime(data['start-date'], '%Y-%m-%d'),
            end_date=datetime.strptime(data['end-date'], '%Y-%m-%d'),
            creative1=files[0] if len(files) > 0 else None,
            creative2=files[1] if len(files) > 1 else None
        )

        return JsonResponse({'success': True, 'post_id': post.id, 'message': 'NGO Post Saved.'})

    except Exception as e:
        return JsonResponse({'error': 'Something went wrong.', 'message': 'NGO Post not Saved.', 'details': str(e)}, status=500)
    
@dashboard_login_required
@require_GET
def post_detail(request, post_id):
    try:
        post = NGOPost.objects.get(id=post_id)
    except NGOPost.DoesNotExist:
        raise Http404('Post not found')
    donations = Donation.objects.filter(ngopost=post).select_related('user')
    donation_list = []
    for d in donations:
        user = d.user
        profile = None
        name = user.email  
        city = ''
        if user.user_type == 'user':
            profile = getattr(user, 'userprofile', None)
            if profile:
                name = profile.name
                city = profile.city
        elif user.user_type == 'client':
            profile = getattr(user, 'clientprofile', None)
            if profile:
                name = profile.company_name
                city = profile.city
        elif user.user_type == 'advertiser':
            profile = getattr(user, 'advertiserprofile', None)
            if profile:
                name = profile.company_name
                city = profile.city
        elif user.user_type == 'pharmacy':
            profile = getattr(user, 'Pharmacyprofile', None)
            if profile:
                name = profile.company_name
                city = profile.city
        elif user.user_type == 'ngo':
            profile = getattr(user, 'ngoprofile', None)
            if profile:
                name = profile.ngo_name
                city = profile.city
        donation_list.append({
            'payment_date': d.payment_date.strftime('%d/%m/%y,%H:%M') if d.payment_date else '',
            'city': city,
            'name': name,
            'amount': str(d.amount),
        })
    data = {
        'id': post.id,
        'header': post.header,
        'description': post.description,
        'tags': post.tags if isinstance(post.tags, str) else str(post.tags),
        'post_type': post.post_type.name if post.post_type else '',
        'donation_frequency': post.donation_frequency if post.donation_frequency else '',
        'target_donation': post.target_donation,
        'country': post.country.name if post.country else '',
        'state': post.state.name if post.state else '',
        'city': post.city.name if post.city else '',
        'pincode': post.pincode,
        'age_group': post.age_group.name if post.age_group else '',
        'gender': post.gender.name if post.gender else '',
        'views': post.views if hasattr(post, 'views') else 0,
        'post_reference_id': post.id,  # or post.reference_id if you have a custom field
        'uploaded_by': post.user.email if post.user else '', 
        'status': post.status if post.status else '',
        'donation_received': post.donation_received if hasattr(post, 'donation_received') else 0,
        'date_time': str(post.created_at) if hasattr(post, 'created_at') else '',
        'spending_power': post.spending_power.name if post.spending_power else '',
        'start_date': str(post.start_date),
        'end_date': str(post.end_date),
        'creative1': post.creative1.url if post.creative1 else '',
        'creative2': post.creative2.url if post.creative2 else '',
        'donations': donation_list,
    }
    return JsonResponse(data)

@dashboard_login_required
@require_POST
def toggle_saved_post(request):
    post_id = request.POST.get('post_id')
    action = request.POST.get('action')

    if not post_id or action not in ['save', 'unsave']:
        return JsonResponse({'success': False, 'error': 'Invalid data'}, status=400)

    try:
        post = NGOPost.objects.get(id=post_id, user=request.user_obj)
        post.saved = (action == 'save')
        post.save()

        return JsonResponse({'success': True, 'saved': post.saved})

    except NGOPost.DoesNotExist:
        return JsonResponse({'success': False, 'error': 'Post not found'}, status=404)

@dashboard_login_required
@require_POST
def update_post_status(request):
    post_id = request.POST.get('post_id')
    new_status = request.POST.get('status')
    try:
        post = NGOPost.objects.get(id=post_id, user=request.user_obj)
        post.status = new_status
        post.save()
        return JsonResponse({'success': True, 'status': post.status})
    except NGOPost.DoesNotExist:
        return JsonResponse({'success': False, 'error': 'Post not found'}, status=404)
    
@dashboard_login_required
@require_GET
def export_post_history(request):
    user = request.user_obj
    # date_range = request.GET.get('daterange', '').strip().lower()
    filters = Q(user=user)
    posts = NGOPost.objects.filter(filters).order_by('-created_at')
    html = render_to_string("partials/export-post-history.html", {
        "post_history": posts,
        'today': date.today(),
    })
    return JsonResponse({
        "html": html,
        "total_items": posts.count(),  # Add this
    })

@dashboard_login_required
@require_GET
def export_saved_post_history(request):
    user = request.user_obj
    # date_range = request.GET.get('daterange', '').strip().lower()
    filters = Q(user=user)
    posts = NGOPost.objects.filter(filters, saved=True).order_by('-created_at')
    html = render_to_string("partials/export-saved-post-history.html", {
    "saved_post_history": posts,
    'today': date.today(),
    })
    return JsonResponse({
    "html": html,
    "total_items": posts.count(),  # Add this
    })