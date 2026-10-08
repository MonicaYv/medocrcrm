import uuid
from decimal import Decimal
from django.db.models import Q
from django.utils import timezone
from ngopost.models import NGOPost
from donate.models import Donation
from django.shortcuts import render
from django.http import JsonResponse
from django.core.paginator import Paginator
from django.utils.dateparse import parse_date
from datetime import date, timedelta
from django.template.loader import render_to_string
from dashboard.utils import dashboard_login_required, get_common_context, get_theme_colors, seller_verified_required
from registration.views import validate_and_save_file
from points.models import PointsActionType, PointsHistory
from django.views.decorators.http import require_POST, require_GET
from registration.models import NGOProfile, AdvertiserProfile, ClientProfile, PharmacyProfile, ContactPerson, LabProfile, DoctorProfile, HospitalProfile

@dashboard_login_required
@require_GET
def donate_view(request):
    user = request.user_obj
    if user.user_type == 'advertiser':
        user_profile = AdvertiserProfile.objects.filter(user=user).first()
    elif user.user_type == 'client':
        user_profile = ClientProfile.objects.filter(user=user).first()
    elif user.user_type == 'pharmacy':
        user_profile = PharmacyProfile.objects.filter(user=user).first()
    elif user.user_type == 'lab':
        user_profile = LabProfile.objects.filter(user=user).first()
    elif user.user_type == 'doctor':
        user_profile = DoctorProfile.objects.filter(user=user).first()
    elif user.user_type == 'hospital':
        user_profile = HospitalProfile.objects.filter(user=user).first()

    donation_query = request.GET.get('donation_query', '').strip().lower()

    donations = Donation.objects.filter(user=request.user_obj).select_related('ngopost', 'ngopost__user', 'ngopost__user__ngoprofile', 'ngopost__post_type')
    if donation_query:
        donations = [d for d in donations if
                     donation_query in (d.ngopost.post_type.name.lower() if d.ngopost and d.ngopost.post_type else '') or
                     donation_query in (d.ngopost.user.ngoprofile.ngo_name.lower() if d.ngopost and d.ngopost.user and hasattr(d.ngopost.user, 'ngoprofile') and d.ngopost.user.ngoprofile.ngo_name else '')]
    context = get_common_context(request, request.user_obj)
    color_hex_map = {
        "living-coral": "#FF6F61",
        "dark-blue": "#123456",
        "violet-sky": "#6B79F5",
        "light-sea-green": "#3AAFA9",
    }
    primary_bg = context.get("primary_bg")
    context["hexcolor"] = color_hex_map.get(primary_bg)
    if user.user_type == "lab":
        context.update({
        "donations": donations,
        "donation_query": donation_query,
        'user_display_name': user_profile.lab_name,
    })
    elif user.user_type == "doctor":
        context.update({
            "donations": donations,
            "donation_query": donation_query,
            'user_display_name': user_profile.clinic_name,
        })
    elif user.user_type == "hospital":
        context.update({
            "donations": donations,
            "donation_query": donation_query,
            'user_display_name': user_profile.hospital_name,
        })
    else:
        context.update({
            "donations": donations,
            "donation_query": donation_query,
            'user_display_name': user_profile.company_name,
        })
    return render(request, "advertiser/donate.html", context)

@dashboard_login_required
@require_GET
def get_organization_posts(request):
    user = request.user_obj
    query = request.GET.get("query", "").strip()
    start = request.GET.get("start_date", "").strip()
    end = request.GET.get("end_date", "").strip()
    daterange = request.GET.get("daterange", "").strip().lower()
    page = int(request.GET.get("page", 1))

    filters = Q(end_date__gte=timezone.now().date())

    if query:
        filters &= (
            Q(header__icontains=query) |
            Q(city__name__icontains=query) |
            Q(state__name__icontains=query) |
            Q(country__name__icontains=query) |
            Q(post_type__name__icontains=query) |
            Q(user__ngoprofile__ngo_name__icontains=query)
        )

    now = timezone.now()
    applied_date_filter = None

    if daterange == "1 week":
        filters &= Q(created_at__date__gte=now.date() - timedelta(days=7))
        applied_date_filter = "Last 1 Week"

    elif daterange == "1 month":
        filters &= Q(created_at__date__gte=now.date() - timedelta(days=30))
        applied_date_filter = "Last 1 Month"

    elif daterange == "1 year":
        filters &= Q(created_at__date__gte=now.date() - timedelta(days=365))
        applied_date_filter = "Last 1 Year"

    if start and end:
        start_date = parse_date(start)
        end_date = parse_date(end)
        if start_date and end_date:
            filters &= Q(created_at__date__range=(start_date, end_date))
            applied_date_filter = f"Explicit Range: {start_date} → {end_date}"

    posts = NGOPost.objects.filter(filters).select_related("user").order_by("-created_at")

    paginator = Paginator(posts, 6)
    posts_page = paginator.get_page(page)

    user_ids = [post.user_id for post in posts_page]
    profiles = NGOProfile.objects.filter(user_id__in=user_ids)
    profile_map = {p.user_id: p for p in profiles}

    for post in posts_page:
        profile = profile_map.get(post.user_id)
        post.ngo_name = profile.ngo_name if profile else "NGO Name Not Found"
        post.website_url = profile.website_url if profile else ""

    html = render_to_string(
        "advertiser/partials/organization-cards.html",
        {"ngo_posts": posts_page,
        **get_common_context(request, user)},
        request=request,
    )

    return JsonResponse({
        "html": html,
        "current_page": posts_page.number,
        "total_pages": paginator.num_pages,
    })

@dashboard_login_required
def donate_pay_view(request, post_id=None):
    post = None
    ngo_profile = None
    user = request.user_obj
    context = get_common_context(request, user)
    if post_id:
        try:
            post = NGOPost.objects.select_related('user').get(id=post_id)
            # Increment views
            post.views = (post.views or 0) + 1
            post.save(update_fields=['views'])
            ngo_profile = NGOProfile.objects.filter(user=post.user).first()
        except NGOPost.DoesNotExist:
            post = None
    if request.method == 'POST' and post:
        user = request.user_obj
        amount = float(request.POST.get('donation_amount', 0))
        if amount < 100:
            return JsonResponse({'error': 'Minimum donation is ₹100'}, status=400)

        if (post.donation_received or Decimal('0.00')) + Decimal(str(amount)) > post.target_donation:
            return JsonResponse({'error': 'Donation exceeds the target amount for this post.'}, status=400)
        
        freq = post.donation_frequency.lower()
        user_donations_count = Donation.objects.filter(ngopost=post, user=user).count()
        allowed = 1 if 'one' in freq else 2 if 'two' in freq else 3 if 'three' in freq else 1
        if user_donations_count >= allowed:
            return JsonResponse({'error': f'You can donate only {allowed} time(s) to this post.'}, status=400)
        
        platform_fee = round(amount * 0.02, 2)
        gst = round(platform_fee * 0.18, 2)
        amount_to_ngo = round(amount - platform_fee - gst, 2)
        
        pan_number = request.POST.get('pan_number', '')
        pan_document_file = request.FILES.get('pan_document')
        if not pan_number or len(pan_number) != 10:
            return JsonResponse({'error': 'Invalid PAN number'}, status=400)
        pan_document_path, error = validate_and_save_file(pan_document_file, 'donation_docs', 'PAN Document', user_type='common')
        if error:
            return JsonResponse({'error': error}, status=400)
        
        order_id = str(uuid.uuid4().hex[:8])
        transaction_id = str(uuid.uuid4().hex[:8])
        donation = Donation.objects.create(
            ngopost=post,
            user=user,
            amount=amount,
            payment_method='UPI',
            pan_number=pan_number,
            pan_document=pan_document_path,
            payment_status='Success',
            order_id=order_id,
            payment_date=timezone.now(),
            gst=gst,
            platform_fee=platform_fee,
            amount_to_ngo=amount_to_ngo,
            transaction_id=transaction_id
        )
        # Increment donation_received
        post.donation_received = (post.donation_received or Decimal('0.00')) + Decimal(str(amount))
        post.save(update_fields=['donation_received'])
        try:
            action_type_obj = PointsActionType.objects.get(action_type='Donate')
            PointsHistory.objects.create(user=user, action_type=action_type_obj, points=action_type_obj.default_points)
        except PointsActionType.DoesNotExist:
            print("PointsActionType for 'Donate' does not exist. No points awarded.")
        return JsonResponse({'success': True, 'order_id': order_id, 'transaction_id': transaction_id})
    context.update({ "post": post, "ngo_profile": ngo_profile})
    return render(request, "advertiser/donate-pay.html", context)

@dashboard_login_required
@require_GET
def get_donation_history(request):
    user = request.user_obj

    query = request.GET.get('query', '').strip()
    page = int(request.GET.get('page', 1))
    limit = int(request.GET.get('limit', 10))
    date_range = request.GET.get('daterange', '').strip().lower()
    filters = Q(user=user)
    if query:
        filters &= (
            Q(ngopost__header__icontains=query) |
            Q(payment_status__icontains=query) |
            Q(ngopost__post_type__name__icontains=query)
        )

    now = timezone.now()
    if date_range == "1 week":
        filters &= Q(created_at__gte=now - timedelta(weeks=1))
    elif date_range == "1 month":
        filters &= Q(created_at__gte=now - timedelta(days=30))
    elif date_range == "1 year":
        filters &= Q(created_at__gte=now - timedelta(days=365))
    elif date_range == "custom":
        start = request.GET.get('start_date')
        end = request.GET.get('end_date')
        start_date = parse_date(start or "")
        end_date = parse_date(end or "")
        if not start_date or not end_date or end_date < start_date:
            return JsonResponse({"error": "Select a valid date range."}, status=400)
        filters &= Q(created_at__date__range=(start_date, end_date))

    donations = Donation.objects.filter(filters).order_by('-created_at')
    paginator = Paginator(donations, limit)
    page_obj = paginator.get_page(page)
    
    html = render_to_string("advertiser/partials/donation-history.html", {
        "donation_history": page_obj.object_list,
        'today': date.today(),
        **get_common_context(request, request.user_obj),
    })
    return JsonResponse({
        "html": html,
        "current_page": page_obj.number,
        "total_pages": paginator.num_pages,
        "total_items": paginator.count,
    })

def _get_donation_document_data(user, donation_id):
    donation = (
        Donation.objects
        .select_related("ngopost__user__ngoprofile")
        .filter(id=donation_id, user=user)
        .first()
    )
    if donation is None:
        return None

    ngo_profile = NGOProfile.objects.filter(user=donation.ngopost.user).first()
    contact_person = ContactPerson.objects.filter(
        profile_type=user.user_type,
        profile=user,
    ).first()
    address = ", ".join(
        str(part)
        for part in (
            ngo_profile.address if ngo_profile else None,
            ngo_profile.city if ngo_profile else None,
            ngo_profile.state if ngo_profile else None,
            ngo_profile.pincode if ngo_profile else None,
        )
        if part
    )
    gst = donation.gst or Decimal("0")

    return {
        "receipt_no": donation.id,
        "payment_date": (
            donation.payment_date.strftime("%d-%b-%Y")
            if donation.payment_date else ""
        ),
        "ngo_name": ngo_profile.ngo_name if ngo_profile else "",
        "pan": ngo_profile.pan_number if ngo_profile else "",
        "amount": f"₹{donation.amount}",
        "pay_mode": donation.payment_method,
        "address": address,
        "name": contact_person.name if contact_person else "",
        "email": user.email or "",
        "gst": f"{gst:.2f}",
        "finalTotal": f"{donation.amount + gst:.2f}",
    }


@dashboard_login_required
def get_donate_bill(request, donation_id):
    response_data = _get_donation_document_data(request.user_obj, donation_id)
    if response_data is None:
        return JsonResponse({"error": "Donation not found."}, status=404)
    return JsonResponse(response_data)


@dashboard_login_required
def get_platform_bill(request, donation_id):
    response_data = _get_donation_document_data(request.user_obj, donation_id)
    if response_data is None:
        return JsonResponse({"error": "Donation not found."}, status=404)
    response_data["pay_mode"] = f"₹{response_data['pay_mode']}"
    return JsonResponse(response_data)

@dashboard_login_required
@require_POST
def toggle_saved_donation(request):
    donation_id = request.POST.get('donation_id')
    action = request.POST.get('action')

    if not donation_id or action not in ['save', 'unsave']:
        return JsonResponse({'success': False, 'error': 'Invalid data'}, status=400)

    try:
        donation = Donation.objects.get(id=donation_id, user=request.user_obj)
        donation.saved = (action == 'save')
        donation.save()

        return JsonResponse({'success': True, 'saved': donation.saved, 'text_class': get_theme_colors(request.user_obj.user_type).get("text", "blue-500")})

    except Donation.DoesNotExist:
        return JsonResponse({'success': False, 'error': 'Donation not found'}, status=404)

@dashboard_login_required
@require_GET
def export_donation_history(request):
    user = request.user_obj
    # date_range = request.GET.get('daterange', '').strip().lower()
    filters = Q(user=user)
    donations = Donation.objects.filter(filters).order_by('-created_at')
    html = render_to_string("advertiser/partials/export-donate-history.html", {
        "donation_history": donations,
        'today': date.today(),
    })
    return JsonResponse({
        "html": html,
        "total_items": donations.count(),  # Add this
    })

