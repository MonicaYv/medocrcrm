import json
import datetime
from django.shortcuts import render
from dashboard.utils import dashboard_login_required, get_common_context
from .models import PointsHistory, PointsActionType, PointsBadge
from coupon.models import Coupon, CouponClaimed
from django.http import JsonResponse
from django.template.loader import render_to_string
from django.utils.dateparse import parse_date
from django.utils import timezone
from django.views.decorators.http import require_POST, require_GET
from django.db.models import Sum, Q
from django.core.paginator import Paginator


@dashboard_login_required
def points_dashboard(request):
    user = request.user_obj

    context = get_common_context(request, user)
    return render(request, "ngo_points.html", context)

@dashboard_login_required
def get_coupon_data(request, is_popular=False):
    user = request.user_obj
    try:
        query = request.GET.get('search', '').strip().lower()
        date_range = request.GET.get('daterange', '').strip().lower()
        start_date_str = request.GET.get('start_date', '').strip()
        end_date_str = request.GET.get('end_date', '').strip()
        page = int(request.GET.get('page', 1))
        limit = int(request.GET.get('limit', 4))  # default 4 per page

        now = timezone.now()
        coupons = Coupon.objects.select_related('category', 'brand_name')

        if query:
            coupons = coupons.filter(
                Q(title__icontains=query) |
                Q(code__icontains=query) |
                Q(category__name__icontains=query) |
                Q(brand_name__name__icontains=query)
            )

        if date_range == "1 week":
            coupons = coupons.filter(created_at__gte=now - datetime.timedelta(weeks=1))
        elif date_range == "1 month":
            coupons = coupons.filter(created_at__gte=now - datetime.timedelta(days=30))
        elif date_range == "1 year":
            coupons = coupons.filter(created_at__gte=now - datetime.timedelta(days=365))
        elif start_date_str and end_date_str:
            try:
                start_date = datetime.strptime(start_date_str, "%Y-%m-%d")
                end_date = datetime.strptime(end_date_str, "%Y-%m-%d") + datetime.timedelta(days=1)
                coupons = coupons.filter(created_at__range=(start_date, end_date))
            except ValueError:
                return JsonResponse({"html": "", "error": "Invalid date format."})

        if is_popular:
            coupons = coupons.order_by('-redeemed_count')
        else:
            coupons = coupons.order_by('-created_at')

        paginator = Paginator(coupons, limit)
        page_obj = paginator.get_page(page)

        data_list = []
        for c in page_obj:
            redeemed = c.redeemed_count or 0
            max_redemptions = c.max_redemptions or 100
            item = {
                "title": c.title[:20] if is_popular else c.title,
                "id": c.id,
                "description": c.description[:120] if is_popular else c.description,
                "category": c.category.name if c.category else "N/A",
                "brand_name": c.brand_name.name if c.brand_name else "N/A",
                "code": c.code,
                "redeemed_count": redeemed,
                "max_redemptions": max_redemptions,
            }
            if is_popular:
                item["percent_used"] = int((redeemed / max_redemptions) * 100)
            data_list.append(item)

        context = {"coupons" if is_popular else "products": data_list}
        context.update(get_common_context(request, user))
        html = render_to_string(
            "partials/coupon_card_layout.html" if is_popular else "partials/coupon_cards.html",
            context
        )

        return JsonResponse({
            "html": html,
            "pagination": {
                "page": page_obj.number,
                "num_pages": paginator.num_pages
            }
        })

    except Exception as e:
        return JsonResponse({"html": "", "error": str(e)})

@require_GET
def get_coupon_cards(request):
    return get_coupon_data(request, is_popular=False)

@require_GET
def get_popular_coupon_cards(request):
    return get_coupon_data(request, is_popular=True)

@require_GET
def points_history_view(request):
    context = filter_points(request)
    return render(request, 'partials/points_table.html', context)

@require_GET
def ajax_filtered_points(request):
    context = filter_points(request)
    return render(request, 'partials/points_table.html', context)

@dashboard_login_required
def filter_points(request):
    user = request.user_obj
    today = timezone.now().date()

    search_query = request.GET.get('search', '').strip().lower()
    date_filter = request.GET.get('date_filter', '')
    start_date = request.GET.get('start_date')
    end_date = request.GET.get('end_date')
    page = request.GET.get('page', 1)
    # Base queryset
    history_queryset = PointsHistory.objects.filter(user=user).select_related('action_type')

    # Apply date filtering
    if date_filter == 'last_week':
        last_week = today - datetime.timedelta(days=7)
        history_queryset = history_queryset.filter(timestamp__date__gte=last_week)
    elif date_filter == 'last_month':
        last_month = today - datetime.timedelta(days=30)
        history_queryset = history_queryset.filter(timestamp__date__gte=last_month)
    elif date_filter == 'last_year':
        last_year = today - datetime.timedelta(days=365)
        history_queryset = history_queryset.filter(timestamp__date__gte=last_year)
    elif date_filter == 'custom' and start_date and end_date:
        try:
            start_dt = datetime.datetime.strptime(start_date, '%Y-%m-%d').date()
            end_dt = datetime.datetime.strptime(end_date, '%Y-%m-%d').date()
            history_queryset = history_queryset.filter(timestamp__date__range=(start_dt, end_dt))
        except ValueError:
            pass  # invalid date inputs are ignored

    # Search filtering
    if search_query:
        history_queryset = history_queryset.filter(
            Q(action_type__action_type__icontains=search_query)
        )

    history_queryset = history_queryset.order_by('-timestamp')

    # Pagination
    paginator = Paginator(history_queryset, 5)  # 10 items per page
    page_obj = paginator.get_page(page)

    history_data = [
        {
            'timestamp': h.timestamp.strftime('%d/%m/%y, %H:%M'),
            'action_type': h.action_type.action_type.title() if h.action_type else 'Unknown',
            'points': h.points,
            'status': 'Completed'
        }
        for h in page_obj
    ]

    return {
        'data': history_data,
        'page_obj': page_obj,
        **get_common_context(request, user)
    }

@require_POST
@dashboard_login_required
def claim_coupon(request):
    try:
        data = json.loads(request.body)
        coupon_id = data.get('coupon_id')
        coupon = Coupon.objects.get(id=coupon_id)
        user = request.user_obj

        if CouponClaimed.objects.filter(user=user, coupon=coupon).exists():
            return JsonResponse({'status': 'already_claimed'})

        CouponClaimed.objects.create(
            user=user,
            coupon=coupon,
            expiry_date=coupon.validity
        )
        return JsonResponse({'status': 'success'})

    except Coupon.DoesNotExist:
        return JsonResponse({'status': 'coupon_not_found'}, status=404)
    except Exception as e:
        return JsonResponse({'status': 'error', 'message': str(e)}, status=400)

@dashboard_login_required
def get_claimed_coupons(request):
    try:
        user = request.user_obj
        search = request.GET.get('search', '').strip()
        start_date = request.GET.get('start_date')
        end_date = request.GET.get('end_date')
        date_range = request.GET.get('date_range', '').lower()
        page = request.GET.get('page', 1)

        claimed_qs = CouponClaimed.objects.filter(user=user).select_related(
            'coupon__category', 'coupon__brand_name'
        )

        # Search
        if search:
            claimed_qs = claimed_qs.filter(
                Q(coupon__title__icontains=search) |
                Q(coupon__code__icontains=search) |
                Q(coupon__category__name__icontains=search) |
                Q(coupon__brand_name__name__icontains=search)
            )

        # Normalize date_range
        if date_range:
            date_range = date_range.strip().lower()
            today = timezone.now().date()

            if date_range == "1 week":
                claimed_qs = claimed_qs.filter(date_claimed__date__gte=today - datetime.timedelta(weeks=1))
            elif date_range == "1 month":
                claimed_qs = claimed_qs.filter(date_claimed__date__gte=today - datetime.timedelta(days=30))
            elif date_range == "1 year":
                claimed_qs = claimed_qs.filter(date_claimed__date__gte=today - datetime.timedelta(days=365))


        # Start Date Filter
        if start_date:
            try:
                start = parse_date(start_date)
                if start:
                    claimed_qs = claimed_qs.filter(date_claimed__date__gte=start)
            except Exception as e: 
                return JsonResponse({"error": f"Error occurred - Invalid start date: {str(e)}"}, status=500)

        # End Date Filter
        if end_date:
            try:
                end = parse_date(end_date)
                if end:
                    claimed_qs = claimed_qs.filter(date_claimed__date__lte=end)
            except Exception as e:
                return JsonResponse({"error": f"Error occurred - Invalid end date: {str(e)}"}, status=500)

        paginator = Paginator(claimed_qs.order_by('-date_claimed'), 5)
        try:
            page_obj = paginator.get_page(page)
        except Exception:
            page_obj = paginator.page(1)

        html = render_to_string("partials/coupon_claimed_table.html", {
            "claimed_coupons": page_obj
        })

        pagination_html = render_to_string("partials/coupon_claimed_pagination.html", {
            "page_obj": page_obj,
            **get_common_context(request, user)
        })

        return JsonResponse({"html": html, "pagination": pagination_html})
    
    except Exception as e:
        return JsonResponse({"error": f"Error occurred: {str(e)}"}, status=500)
