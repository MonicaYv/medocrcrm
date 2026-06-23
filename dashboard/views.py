import os
import json
import random
import uuid
from decimal import Decimal
from django.conf import settings
from coupon.models import Coupon
from django.utils import timezone
from donate.models import Donation
from ngopost.models import NGOPost
from django.http import JsonResponse
from django.utils.timezone import now
from django.core.paginator import Paginator
from django.shortcuts import render, redirect
from datetime import date, datetime, timedelta
from django.db.models.functions import TruncDate
from django.template.loader import render_to_string
from subscription.models import SubscriptionHistory
from django.views.decorators.http import require_GET, require_POST
from .utils import dashboard_login_required, get_common_context, get_theme_colors
from .models import SettingMenu, CouponPerformance,  CalendarEvent, TrendingCoupon
from django.db.models import Sum, Count, Q, Max, F, ExpressionWrapper, DurationField
from registration.models import (
    PharmacyProfile, 
    NGOProfile, 
    ClientProfile, 
    AdvertiserProfile, 
    ContactPerson, 
    LabProfile, 
    DoctorProfile, 
    HospitalProfile
)
from appointments.models import WalletTransaction
from services.models import LabBidding, LabBidStatus
from services.models import HospitalBidding, HospitalBidStatus
from services.models import DoctorBidding, DoctorBidStatus
from appointments.models import LabAppointments
from appointments.models import HospitalAppointments, HospitalAppointmentStatus
from appointments.models import DoctorAppointment
from orders.models import UserPurchase, OrderStatusChoices, PurchaseMedicine
from appointments.models import WalletTransaction
from django.http import JsonResponse
from django.shortcuts import get_object_or_404
from django.http import HttpResponse  
from settings.models import SellerSubscription, SellerType 
from registration.models import ContactPerson
from django.db.models import Count
def build_media_url(path):
    if not path:
        return ""

    path = str(path).replace("\\", "/").strip()
    if path.startswith(("http://", "https://", "/")):
        return path

    media_url = settings.MEDIA_URL.rstrip("/")
    media_prefix = settings.MEDIA_URL.strip("/")

    if media_prefix and path.startswith(f"{media_prefix}/"):
        path = path[len(media_prefix) + 1:]

    return f"{media_url}/{path.lstrip('/')}"
from django.http import HttpResponse    

@dashboard_login_required
def dashboard_home(request):
    user = request.user_obj
    user_type = user.user_type

    menu_items = SettingMenu.objects.filter(
        is_active=True,
        user_types__contains=[user_type]
    ).order_by('order')


    context = get_common_context(request, user)
    context["theme_colors"] = get_theme_colors(user_type)
    
    context["sidebar_menu"] = menu_items

    # -------------------------------
    # Wallet Balance (All users)
    # -------------------------------
    context["wallet_balance"] = (
        WalletTransaction.objects
        .filter(user=user)
        .order_by('-created_at')
        .values_list('current_balance', flat=True)
        .first()
    ) or 0

    try:
        # ================= NGO =================
        if user_type == 'ngo':
            ngo_profile = NGOProfile.objects.get(user=user)
            posts_qs = NGOPost.objects.filter(user=user)
            events = CalendarEvent.objects.filter(user=user, is_active=True)

            context.update({
                'ngo_profile': ngo_profile,
                'user_display_name': ngo_profile.ngo_name,
                'total_posts': posts_qs.count(),
                'total_views': posts_qs.aggregate(Sum('views'))['views__sum'] or 0,
                'total_target': posts_qs.aggregate(Sum('target_donation'))['target_donation__sum'] or 0,
                'total_received': posts_qs.aggregate(Sum('donation_received'))['donation_received__sum'] or 0,
                'trending_posts': posts_qs.filter(
                    created_at__gte=timezone.now() - timedelta(days=30)
                ).order_by('-views')[:4],
                'events': events,
                'user': user,
            })
            return render(request, "dashboard/home_NGO.html", context)

        # ================= CLIENT =================
        elif user_type == 'client':
            client_profile = ClientProfile.objects.get(user=user)
            latest_sub = SubscriptionHistory.objects.filter(user=user).order_by("-activation_date").first()

            if latest_sub and latest_sub.is_active:
                context.update({
                    'current_plan': latest_sub.plan.name,
                    'expiry_date': latest_sub.expiry_date,
                    'licenses': latest_sub.license_count,
                })
            else:
                context.update({
                    'current_plan': "Free Plan",
                    'expiry_date': None,
                    'licenses': 1,
                })

            context.update({
                'client_profile': client_profile,
                'user_display_name': client_profile.company_name,
                'user': user,
            })
            return render(request, "dashboard/home_client.html", context)

        # ================= ADVERTISER =================
        elif user_type == 'advertiser':
            advertiser_profile = AdvertiserProfile.objects.get(user=user)
            today = now().date()
            last_30_days = today - timedelta(days=30)

            coupons = Coupon.objects.filter(
                advertiser=user,
                created_at__date__gte=last_30_days
            )

            active_coupons_all = Coupon.objects.filter(
                advertiser=user,
                validity__gte=today
            )

            max_days_left = active_coupons_all.aggregate(
                max_days=Max(
                    ExpressionWrapper(
                        F('validity') - today,
                        output_field=DurationField()
                    )
                )
            )['max_days']

            context.update({
                'advertiser_profile': advertiser_profile,
                'user_display_name': advertiser_profile.company_name,
                'performance': CouponPerformance.objects.order_by('-date').first(),
                'trending_coupons': TrendingCoupon.objects.order_by('-created_at')[:5],
                'events': CalendarEvent.objects.all().order_by('date'),
                'total_coupons': coupons.count(),
                'total_active_coupons': coupons.filter(validity__gte=today).count(),
                'total_redemptions': coupons.aggregate(
                    total=Sum('redeemed_count')
                )['total'] or 0,
                'max_days_left': max_days_left.days if max_days_left else None,
                'user': user,
            })
            return render(request, "dashboard/home_advertiser.html", context)

        # ================= PHARMACY =================
        elif user_type == 'pharmacy':
            pharmacy_profile = PharmacyProfile.objects.get(user=user)

            pending_orders = UserPurchase.objects.filter(
                assigned_pharmacy=pharmacy_profile,
                order_status__in=[
                    OrderStatusChoices.PENDING,
                    OrderStatusChoices.CONFIRMED,
                    OrderStatusChoices.SHIPPED
                ]
            ).count()


            scheduled_orders = (
                UserPurchase.objects
                .filter(
                    assigned_pharmacy=pharmacy_profile
                )
                .exclude(
                    order_status__in=[
                        OrderStatusChoices.DELIVERED,
                        OrderStatusChoices.CANCELLED
                    ]
                )
                .values(
                    'id',
                    'order_status',
                    'created_at',
                    'user__userprofile__first_name',
                    'user__userprofile__last_name',
                )
                .order_by('-created_at')[:3]
            )


            popular_coupons = Coupon.objects.all().order_by('-redeemed_count')[:5]

            active_subscription = SellerSubscription.objects.filter(
                seller_type=SellerType.PHARMACY,
                seller_profile_id=pharmacy_profile.id,
                is_active=True,
                is_enabled=True
            ).first()


            popular_coupons = Coupon.objects.all().order_by('-redeemed_count')[:5]

            context.update({
                'pharmacy_profile': pharmacy_profile,

                'scheduled_orders': scheduled_orders,
                'popular_coupons': popular_coupons,

                'user_display_name': pharmacy_profile.company_name,

                'pending_orders': pending_orders,

                'active_bids': UserPurchase.objects.filter(
                    assigned_pharmacy=pharmacy_profile
                ).count(),

                'quotes_given': Coupon.objects.count(),

                'active_subscription': active_subscription,

                'orders_won': UserPurchase.objects.filter(
                    assigned_pharmacy=pharmacy_profile,
                    order_status=OrderStatusChoices.DELIVERED
                ).count(),

                'events': CalendarEvent.objects.all().order_by('date'),

                'user': user,
            })
            # return render(request, "dashboard/nearby_pharmacy.html", context)
            context["sidebar_active"] = "home"
            return render(request, "dashboard/home_pharmacy.html", context)

        # ================= LAB =================
        elif user_type == 'lab':
            lab_profile = LabProfile.objects.get(user=user)
            today = timezone.now().date()

            today_appointments = LabAppointments.objects.filter(
                accepted_lab=lab_profile,
                preferred_date_time__date=today
            )

            confirmed_count = today_appointments.filter(
               status="Accepted" 
            ).count()

            pending_count = today_appointments.filter(
                status="Pending" 
            ).count()

            total_appointments = today_appointments.count()

            contact_person = ContactPerson.objects.filter(
                profile_type="lab",
                profile=user
            ).first()

            most_requested = (
                LabAppointments.objects
                .filter(accepted_lab=lab_profile)
                .values("test_type__name")
                .annotate(total=Count("id"))
                .order_by("-total")
                .first()
            )

            most_requested_test = (
                most_requested["test_type__name"]
                if most_requested else "N/A"
            )

            most_requested_count = (
               most_requested["total"]
               if most_requested else 0
            )
            print("LAB ID =", lab_profile.id)

            all_appts = LabAppointments.objects.filter(
                accepted_lab=lab_profile
            )

            print("TOTAL LAB APPOINTMENTS =", all_appts.count())

            accepted_appts = all_appts.filter(
                status="Accepted"
            )
 
            print("ACCEPTED =", accepted_appts.count())

            # scheduled_appointments = LabAppointments.objects.all()[:3]
            # scheduled_appointments = LabAppointments.objects.filter(
            #     accepted_lab=lab_profile,
            #     status="Accepted"
            # ).order_by("preferred_date_time")[:3]
            # scheduled_appointments = LabAppointments.objects.filter(
            #    accepted_lab=lab_profile
            # ).order_by("preferred_date_time")[:3]
            scheduled_appointments = LabAppointments.objects.filter(
                accepted_lab=lab_profile
            ).exclude(
                status="Cancelled"
            ).order_by("preferred_date_time")[:3]
            print("LAB ID =", lab_profile.id)
            print("SCHEDULED =", scheduled_appointments.count())

            # scheduled_appointments = LabAppointments.objects.filter(
            #     accepted_lab=lab_profile,
            #     status="Accepted"
            # ).select_related(
            #   "test_type",
            #    "user"
            # ).order_by("preferred_date_time")[:3]

            # appointment_requests = LabAppointments.objects.filter(
            #     status="Pending"
            # ).order_by("-created_at")[:5]
            # appointment_requests = LabAppointments.objects.filter(
            #    status="Pending",
               
            # ).order_by("-created_at")[:5]
            appointment_requests = LabAppointments.objects.filter(
                status="Pending"
            ).order_by("-created_at")[:5]
            print("\n===== APPOINTMENT REQUESTS =====")

            for a in appointment_requests:
                print(
                    a.id,
                    a.user_id,
                    a.user.userprofile.first_name,
                    a.user.userprofile.profile_photo_path
                )  
            print("\n===== SCHEDULED =====")

            for appointment in scheduled_appointments:
                print(
                    appointment.id,
                    appointment.user.id,
                    appointment.user.userprofile.first_name,
                    appointment.user.userprofile.profile_photo_path
                )

            context.update({
                'lab_profile': lab_profile,
                'today_appointments': total_appointments,
                'confirmed_count': confirmed_count,
                'pending_count': pending_count,
                'contact_person': contact_person,
                'user_display_name': lab_profile.lab_name,
                'most_requested_test': most_requested_test,
                'most_requested_count': most_requested_count,
                'scheduled_appointments': scheduled_appointments,
                'appointment_requests': appointment_requests,
                'quotes_given': LabBidding.objects.filter(lab=lab_profile).count(),
                
                'active_bids': LabBidding.objects.filter(
                    lab=lab_profile,
                    bid_status__in=[
                        LabBidStatus.PENDING,
                        LabBidStatus.ACCEPTED
                    ]
                ).count(),
                'orders_won': LabAppointments.objects.filter(
                    accepted_lab=lab_profile,
                    status="Accepted"
                ).count(),
                'pending_orders': LabAppointments.objects.filter(
                    accepted_lab=lab_profile,
                    status="Pending"
                ).count(),
                'events': CalendarEvent.objects.all().order_by('date'),
                'user': user,
            })
            return render(request, "dashboard/home_lab.html", context)

        # ================= DOCTOR =================
        elif user_type == 'doctor':
            # doctor_profile = DoctorProfile.objects.get(user=user)
            doctor_profile = DoctorProfile.objects.filter(
                user=user
            ).first()

            contact_person = ContactPerson.objects.filter(
                profile_type="doctor",
                profile=user
            ).first()

            appointment_requests = DoctorAppointment.objects.filter(
                status="Pending"
            ).exclude(
                bids__doctor=doctor_profile
            ).select_related(
                "user__userprofile"
            ).order_by("-created_at")[:5]

            scheduled_appointments = DoctorAppointment.objects.filter(
                doctor=doctor_profile,
                status="Accepted"
            ).select_related(
                "user__userprofile"
            ).order_by("preferred_date_time")[:3]

            context["appointment_requests"] = appointment_requests
            context["scheduled_appointments"] = scheduled_appointments
            context.update({
                'doctor_profile': doctor_profile,
                'contact_person': contact_person,
                'user_display_name': doctor_profile.clinic_name,
                'quotes_given': DoctorBidding.objects.filter(doctor=doctor_profile).count(),
                'active_bids': DoctorBidding.objects.filter(
                    doctor=doctor_profile,
                    bid_status__in=[
                        DoctorBidStatus.PENDING,
                        DoctorBidStatus.ACCEPTED
                    ]
                ).count(),
                'orders_won': DoctorAppointment.objects.filter(
                    doctor=doctor_profile,
                    status="Accepted"
                ).count(),
                'pending_orders': DoctorAppointment.objects.filter(
                    doctor=doctor_profile,
                    status="Pending"
                ).count(),
                'events': CalendarEvent.objects.all().order_by('date'),
                'user': user,
            })
            return render(request, "dashboard/home_doctor.html", context)

        # ================= HOSPITAL =================
        elif user_type == 'hospital':
            # hospital_profile = HospitalProfile.objects.get(user=user)
            hospital_profile = HospitalProfile.objects.filter(
                user=user
            ).first()

            appointment_requests = HospitalAppointments.objects.filter(
                status="Pending"
            ).exclude(
                bids__hospital=hospital_profile
            ).select_related(
                "user__userprofile",
                "category",
                "description",
            ).order_by("-created_at")[:5]
            scheduled_appointments = HospitalAppointments.objects.filter(
                accepted_hospital=hospital_profile,
                status=HospitalAppointmentStatus.ACCEPTED
            ).select_related(
                "user__userprofile",
                "category",
                "description",
            ).order_by(
                "preferred_date_from"
            )[:3]
            context["appointment_requests"] = appointment_requests
            context["scheduled_appointments"] = scheduled_appointments
            context.update({
                'logo': '/static/images/hospital-logo.svg',
                'hospital_profile': hospital_profile,
                'user_display_name': hospital_profile.hospital_name,
                'quotes_given': HospitalBidding.objects.filter(hospital=hospital_profile).count(),
                'active_bids': HospitalBidding.objects.filter(
                    hospital=hospital_profile,
                    bid_status__in=[
                        HospitalBidStatus.PENDING,
                        HospitalBidStatus.ACCEPTED
                    ]
                ).count(),
                'orders_won': HospitalAppointments.objects.filter(
                    accepted_hospital=hospital_profile,
                    status="Accepted"
                ).count(),
                'pending_orders': HospitalAppointments.objects.filter(
                    accepted_hospital=hospital_profile,
                    status="Pending"
                ).count(),
                'events': CalendarEvent.objects.all().order_by('date'),
                'user': user,
            })
            return render(request, "dashboard/home_hospital.html", context)

    # except Exception:
    #     return render(request, "dashboard/not_found.html")
    except Exception as e:
        print("ERROR =>", e)
        raise e

    
def get_coupon_chart_data(request):
    performances = CouponPerformance.objects.order_by('-date')[:8][::-1]  
    data = {
        'labels': [perf.date.strftime('%d %b') for perf in performances], 
        'total_coupons': [perf.total_coupons for perf in performances],
        'total_redemptions': [perf.total_redemptions for perf in performances],
        'active_coupons': [perf.active_coupons for perf in performances],
    }
    return JsonResponse(data)

def logout_view(request):
    request.session.flush() 
    return redirect('/') 

@require_POST
@dashboard_login_required
def save_event(request):
    user = request.user_obj
    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            name = data.get('name')
            date = data.get('date')
            time = data.get('time')

            event_date = datetime.strptime(date, '%Y-%m-%d').date()
            future_events = CalendarEvent.objects.filter(
                user=user,
                date__gte=event_date,
                is_active=True
            ).exclude(id=None) 
            used_colors = set(future_events.values_list('color', flat=True))
            all_colors = [
                'bg-slate-blue', 'bg-strong-red', 'bg-green', 'bg-vivid-orange',
                'bg-purple', 'bg-pink', 'bg-teal', 'bg-dark-blue', 'bg-dark-green', 'bg-dark-purple'
            ]
            available_colors = [color for color in all_colors if color not in used_colors]
            if not available_colors:
                available_colors = all_colors
            random_color = random.choice(available_colors)
            if name and date and time:
                CalendarEvent.objects.create(
                    user=user,
                    name=name,
                    date=datetime.strptime(date, '%Y-%m-%d').date(),
                    time=datetime.strptime(time, '%H:%M').time(),
                    color=random_color
                )
                return JsonResponse({'success': True})
            else:
                return JsonResponse({'success': False, 'error': 'Missing fields'})
        except Exception as e:
            return JsonResponse({'success': False, 'error': str(e)})
    return JsonResponse({'success': False, 'error': 'Invalid request method'})

@require_GET
@dashboard_login_required
def get_events(request):
    user = request.user_obj
    if request.method == 'GET':
        events = CalendarEvent.objects.filter(user=user)
        event_data = {}
        for event in events:
            date_str = event.date.strftime('%Y-%m-%d')
            if date_str not in event_data:
                event_data[date_str] = []
            event_data[date_str].append({
                'name': event.name,
                'time': event.time.strftime('%H:%M'),
                'color': event.color
            })
        return JsonResponse({'events': event_data})

@require_GET
@dashboard_login_required
def get_upcoming_events(request):
    user = request.user_obj
    if request.method == 'GET':
        upcoming_events = CalendarEvent.objects.filter(
            user=user,
            date__gte=datetime.now().date(),
            is_active=True
        ).order_by('date', 'time')[:5]
        events_data = []
        for event in upcoming_events:
            event_data = {
                'name': event.name,
                'date': event.date.strftime('%Y-%m-%d'),
                'time': event.time.strftime('%H:%M'),
                'color': event.color,
                'color_hex': event.get_color_hex()
            }
            events_data.append(event_data)
        response_data = {'upcoming_events': events_data}
        return JsonResponse(response_data)

@dashboard_login_required
def saved(request):
    user = request.user_obj
    context = get_common_context(request, user)

    if user.user_type == 'ngo':
        query = request.GET.get('query', '').strip().lower()
        menu_items = SettingMenu.objects.filter(
            is_active=True, user_types__contains=[user.user_type]
        ).order_by('order')

        try:
            ngo_profile = NGOProfile.objects.get(user=user)
            user_profile = user
        except NGOProfile.DoesNotExist:
            return render(request, "dashboard/not_found.html")
        limit = request.GET.get('limit', '50')
        try:
            limit = int(limit)
        except ValueError:
            limit = 50
        saved_posts = NGOPost.objects.filter(user=user, saved=True)
        if query:
            saved_posts = saved_posts.filter(
                Q(post_type__icontains=query) |
                Q(status__icontains=query) |
                Q(created_at__icontains=query)
            )
        saved_posts = saved_posts[:limit]
        context.update({
            'ngo_profile': ngo_profile,
            'user_display_name': ngo_profile.ngo_name,
            'user_profile': user_profile,
            'menu_items': menu_items,
            'saved_posts': saved_posts,
            'query': query,
            'limit': str(limit),
        })
        return render(request, "saved/saved_ngo.html", context)
    
    elif user.user_type == 'advertiser':
        advertiser_profile = AdvertiserProfile.objects.get(user=user)
        context.update({
            'advertiser_profile': advertiser_profile,
            'user_display_name': advertiser_profile.company_name,
            'user_profile': user,
            'user': user
        })
        return render(request, "saved/saved_advertiser.html", context)
    
    elif user.user_type == 'pharmacy':
        pharmacy_profile = PharmacyProfile.objects.get(user=user)
        context.update({
            'pharmacy_profile': pharmacy_profile,
            'user_display_name': pharmacy_profile.company_name,
            'user_profile': user,
            'user': user
        })
        return render(request, "saved/saved_pharmacy.html", context)
    
    elif user.user_type == 'client':
        client_profile = ClientProfile.objects.get(user=user)
        context.update({
            'client_profile': client_profile,
            'user_display_name': client_profile.company_name,
            'user_profile': user,
            'user': user
        })
        return render(request, "saved/saved_client.html", context)

@require_GET
@dashboard_login_required
def adv_saved_coupon_history(request):
    user = request.user_obj
    query = request.GET.get('query', '').strip()
    page = int(request.GET.get('page', 1))
    limit = int(request.GET.get('limit', 10))
    date_range = request.GET.get('daterange', '').strip().lower()

    filters = Q(advertiser=user)
    if query:
        filters &= (
            Q(category__name__icontains=query) |
            Q(brand_name__name__icontains=query) |
            Q(validity__icontains=query)
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
        try:
            start_date = datetime.strptime(start, "%Y-%m-%d")
            end_date = datetime.strptime(end, "%Y-%m-%d")
            filters &= Q(created_at__range=(start_date, end_date))
        except Exception:
            pass  
    saved_coupons = Coupon.objects.filter(filters, saved=True).order_by('-created_at')
    paginator = Paginator(saved_coupons, limit)
    page_obj = paginator.get_page(page)
    html = render_to_string("advertiser/partials/saved-coupon-history-table.html", {
        "saved_coupon_history": page_obj.object_list,
        'today': date.today(),
    })
    return JsonResponse({
        "html": html,
        "current_page": page_obj.number,
        "total_pages": paginator.num_pages,
    })

@dashboard_login_required
@require_GET
def coupon_detail(request, coupon_id):
    user = request.user_obj
    try:
        coupon = Coupon.objects.get(id=coupon_id, advertiser=user)
    except Coupon.DoesNotExist:
        return JsonResponse({'error': 'Coupon not found'}, status=404)

    try:
        data = {
            'id': coupon.id,
            'uploaded_by': coupon.advertiser.email if coupon.advertiser else '',
            'uploaded_on': coupon.created_at.strftime('%Y-%m-%d %H:%M:%S') if coupon.created_at else '',
            'title': getattr(coupon, 'title', ''),
            'description': getattr(coupon, 'description', ''),
            'category': getattr(coupon.category, 'name', '') if coupon.category else '',
            'brand_name': getattr(coupon.brand_name, 'name', '') if hasattr(coupon, 'brand_name') and coupon.brand_name else '',
            'offer_type': getattr(coupon.offer_type, 'name', '') if hasattr(coupon, 'offer_type') and coupon.offer_type else '',
            'max_redemptions': getattr(coupon, 'max_redemptions', 0),
            'redeemed_count': getattr(coupon, 'redeemed_count', 0),
            'validity': coupon.validity.strftime('%d/%m/%y,%H:%M') if getattr(coupon, 'validity', None) else '',
            'status': 'Active' if getattr(coupon, 'validity', None) and coupon.validity > timezone.now().date() else 'Expired',
            'image_url': build_media_url(coupon.image),
            'age_group': getattr(coupon.age_group, 'name', '') if hasattr(coupon, 'age_group') and coupon.age_group else '',
            'gender': getattr(coupon.gender, 'name', '') if hasattr(coupon, 'gender') and coupon.gender else '',
            'city': getattr(coupon.city, 'name', '') if hasattr(coupon, 'city') and coupon.city else '',
            'spending_power': getattr(coupon.spending_power, 'name', '') if hasattr(coupon, 'spending_power') and coupon.spending_power else '',
        }
    except Exception as e:
        return JsonResponse({'error': 'Server error'}, status=500)
    return JsonResponse(data)

@dashboard_login_required
@require_GET
def export_saved_coupon_history(request):
    user = request.user_obj
    filters = Q(advertiser=user)
    saved_coupons = Coupon.objects.filter(filters, saved=True).order_by('-created_at')
    html = render_to_string("partials/export-saved-history-table.html", {
        "saved_coupon_history": saved_coupons,
        'today': date.today(),
    })

    return JsonResponse({
        "html": html,
        "total_items": saved_coupons.count(), 
    })

@dashboard_login_required
@require_GET
def platform_bill(request, coupon_id):
    user = request.user_obj
    try:
        coupon = Coupon.objects.get(id=coupon_id, advertiser=user, saved=True)
        profile = coupon.advertiser.advertiserprofile
    except Coupon.DoesNotExist:
        return JsonResponse({'error': 'Coupon not found'}, status=404)
    try:
        data = {
            'id': coupon.id,
            'company_name': profile.company_name if profile else '',
            'company_address': profile.address if profile else '',
            'phone_number': coupon.advertiser.phone_number if coupon.advertiser else '',
            'uploaded_by': coupon.advertiser.email if coupon.advertiser else '',
            'uploaded_on': coupon.created_at.strftime('%Y-%m-%d %H:%M:%S') if coupon.created_at else '',
            'quantity': getattr(coupon, 'max_redemptions', 0),
            'validity': coupon.validity.strftime('%d/%m/%y,%H:%M') if getattr(coupon, 'validity', None) else '',
            'rate_per_display': getattr(coupon, 'rate_per_display', 0),
            'payment_method': getattr(coupon, 'payment_method', ''),
            'displays_per_coupon': getattr(coupon, 'displays_per_coupon', 0),
            'gst_amount': getattr(coupon, 'gst_amount', 0),
            'final_paid_amount': getattr(coupon, 'final_paid_amount', 0),
            'company': os.environ.get("COMPANY", ""),
            'gstin': os.environ.get("GSTIN", ""),
            'address': os.environ.get("ADDRESS", ""),
        }
    except Exception as e:
        return JsonResponse({'error': 'Server error'}, status=500)
    return JsonResponse(data)

@dashboard_login_required
@require_GET
def get_donation_history(request):
    user = request.user_obj
    query = request.GET.get('query', '').strip()
    page = int(request.GET.get('page', 1))
    limit = int(request.GET.get('limit', 10))
    date_range = request.GET.get('daterange', '').strip().lower()
    saved_only = request.GET.get('saved_only', '').lower() == 'true'

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
        try:
            start_date = datetime.strptime(start, "%Y-%m-%d")
            end_date = datetime.strptime(end, "%Y-%m-%d")
            filters &= Q(created_at__range=(start_date, end_date))
        except Exception:
            pass  
    if saved_only:
        filters &= Q(saved=True)
    donations = Donation.objects.filter(filters).order_by('-created_at')
    paginator = Paginator(donations, limit)
    page_obj = paginator.get_page(page)
    
    if user.user_type == 'advertiser':
        html = render_to_string("advertiser/partials/donate-history.html", {
            "donation_history": page_obj.object_list,
            'today': date.today(),
        })
    elif user.user_type == 'client':
        html = render_to_string("client/partials/donate-history.html", {
            "donation_history": page_obj.object_list,
            'today': date.today(),
        })
    elif user.user_type == 'pharmacy':
        html = render_to_string("pharmacy/partials/donate-history.html", {
            "donation_history": page_obj.object_list,
            'today': date.today(),
        })
    return JsonResponse({
        "html": html,
        "current_page": page_obj.number,
        "total_pages": paginator.num_pages,
        "total_items": paginator.count,  
    })

@dashboard_login_required    
def get_donate_bill(request, donation_id):
    user = request.user_obj
    donation = Donation.objects.select_related('ngopost__user__ngoprofile').get(id=donation_id)
    ngo_user = donation.ngopost.user
    ngo_profile = NGOProfile.objects.filter(user=ngo_user).first()

    contact_person = ContactPerson.objects.filter(
        profile_type=user.user_type,
        profile=user
    ).first() 

    response_data = {
        "receipt_no": donation.id,
        "payment_date": donation.payment_date.strftime("%d-%b-%Y"),
        "ngo_name": ngo_profile.ngo_name,
        "pan": ngo_profile.pan_number,
        "amount": f"₹{donation.amount}",
        "pay_mode": f"{donation.payment_method}",
        "address": f"{ngo_profile.address}, {ngo_profile.city}, {ngo_profile.state}, {ngo_profile.pincode}",
        "name": contact_person.name,
        "email": user.email,
    }
    return JsonResponse(response_data)

@dashboard_login_required    
def get_platform_bill(request, donation_id):
    user = request.user_obj
    donation = Donation.objects.select_related('ngopost__user__ngoprofile').get(id=donation_id)
    
    ngo_user = donation.ngopost.user
    ngo_profile = NGOProfile.objects.filter(user=ngo_user).first()
    contact_person = ContactPerson.objects.filter(
        profile_type=user.user_type,
        profile=user
    ).first()

    response_data = {
        "receipt_no": donation.id,
        "payment_date": donation.payment_date.strftime("%d-%b-%Y"),
        "ngo_name": ngo_profile.ngo_name,
        "pan": ngo_profile.pan_number,
        "gst": donation.gst,
        "amount": f"₹{donation.amount}",
        "pay_mode": f"{donation.payment_method}",
        "address": f"{ngo_profile.address}, {ngo_profile.city}, {ngo_profile.state}, {ngo_profile.pincode}",
        "name": contact_person.name,
        "email": user.email,
        "finalTotal": f"{(donation.amount + donation.gst):.2f}",
    }
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

        return JsonResponse({'success': True, 'saved': donation.saved})

    except Donation.DoesNotExist:
        return JsonResponse({'success': False, 'error': 'Donation not found'}, status=404)

@dashboard_login_required
@require_GET
def export_donation_history(request):
    user = request.user_obj
    donations = Donation.objects.filter(Q(user=user) & Q(saved=True)).order_by('-created_at')
    html = render_to_string("advertiser/partials/export-donate-history.html", {
        "donation_history": donations,
        'today': date.today(),
    })
    return JsonResponse({
        "html": html,
        "total_items": donations.count(),
    })

@require_GET
@dashboard_login_required
def get_ngo_graph_data(request):
    user = request.user_obj
    today = timezone.now().date()

    start_date_str = request.GET.get("start_date")
    end_date_str = request.GET.get("end_date")

    try:
        start_date = datetime.strptime(start_date_str, "%Y-%m-%d").date() if start_date_str else today - timedelta(days=6)
        end_date = datetime.strptime(end_date_str, "%Y-%m-%d").date() if end_date_str else today
    except ValueError:
        return JsonResponse({'error': 'Invalid date format'}, status=400)

    posts = (
        NGOPost.objects
        .annotate(date=TruncDate('created_at'))
        .filter(
            user_id=user,
            date__range=(start_date, end_date)
        )
        .values('date')
        .annotate(
            total_post=Count('id'),
            total_views=Sum('views'),
            target_donation=Sum('target_donation'),
            donation_received=Sum('donation_received')
        )
        .order_by('date')
    )

    data_by_date = {entry['date']: entry for entry in posts}

    labels = []
    total_post = []
    total_views = []
    target_donation = []
    donation_received = []

    current_date = start_date
    while current_date <= end_date:
        entry = data_by_date.get(current_date, {})
        labels.append(current_date.strftime('%d-%b')) 
        total_post.append(entry.get('total_post', 0))
        total_views.append(entry.get('total_views', 0) or 0)
        target_donation.append(entry.get('target_donation', 0) or 0)
        donation_received.append(entry.get('donation_received', 0) or 0)
        current_date += timedelta(days=1)

    return JsonResponse({
        'labels': labels,
        'datasets': {
            'Total Post': total_post,
            'Total Views': total_views,
            'Target Donation': target_donation,
            'Donation Received': donation_received,
        }
    })
    
@dashboard_login_required
def advance(request):
    user = request.user_obj
    context = get_common_context(request, user)
    context["sidebar_active"] = "home"

    profile_map = {
        'advertiser': (AdvertiserProfile, 'company_name', 'advertiser_profile'),
        'ngo': (NGOProfile, 'ngo_name', 'ngo_profile'),
        'pharmacy': (PharmacyProfile, 'company_name', 'pharmacy_profile'),
        'lab': (LabProfile, 'lab_name', 'lab_profile'),
        'hospital': (HospitalProfile, 'hospital_name', 'hospital_profile'),
        'doctor': (DoctorProfile, 'clinic_name', 'doctor_profile'),
    }

    profile_config = profile_map.get(user.user_type)

    if not profile_config:
        return render(request, "dashboard/not_found.html", context)

    model, display_field, context_key = profile_config
    profile = model.objects.get(user=user)

    # ✅ Fetch wallet balance
    last_txn = (
        WalletTransaction.objects
        .filter(user=user)
        .order_by("-created_at")
        .first()
    )
    last_updated = (
        last_txn.created_at.strftime("%d %B %Y")
        if last_txn else None
    )
    wallet_balance = last_txn.current_balance if last_txn else Decimal("0.00")

    context.update({
        context_key: profile,
        'user_display_name': getattr(profile, display_field, ''),
        'user_profile': user,
        'user': user,
        'wallet_balance': wallet_balance,
        'wallet_last_updated': last_updated,
    })

    return render(request, "advance/advance.html", context)


    
@dashboard_login_required
def advance_history(request):
    user = request.user_obj
    context = get_common_context(request, user)
    context["sidebar_active"] = "home"

    profile_map = {
        'advertiser': (AdvertiserProfile, 'company_name', 'advertiser_profile'),
        'pharmacy': (PharmacyProfile, 'company_name', 'pharmacy_profile'),
        'hospital': (HospitalProfile, 'hospital_name', 'hospital_profile'),
        'doctor': (DoctorProfile, 'clinic_name', 'doctor_profile'),
        'lab': (LabProfile, 'lab_name', 'lab_profile'),
    }

    profile_config = profile_map.get(user.user_type)
    if not profile_config:
        return render(request, "dashboard/not_found.html", context)

    model, display_field, context_key = profile_config
    profile = model.objects.get(user=user)

    context.update({
        context_key: profile,
        'user_display_name': getattr(profile, display_field, ''),
        'user_profile': user,
        'user': user,
    })
    return render(request, "advance/advance-history.html", context)

@dashboard_login_required
def cart(request):
    user = request.user_obj
    context = get_common_context(request, user)
    if user.user_type == 'advertiser':
        advertiser_profile = AdvertiserProfile.objects.get(user=user)
        context.update({
            'advertiser_profile': advertiser_profile,
            'user_display_name': advertiser_profile.company_name,
            'user_profile': user,
            'user': user
        })
        return render(request, "dashboard/cart.html", context)
    elif user.user_type == 'pharmacy':
        pharmacy_profile = PharmacyProfile.objects.get(user=user)
        context.update({
            'pharmacy_profile': pharmacy_profile,
            'user_display_name': pharmacy_profile.company_name,
            'user_profile': user,
            'user':user
        })
        return render(request, "dashboard/cart.html", context)
    

@dashboard_login_required
def add_advance_amount(request):
    if request.method != "POST":
        return JsonResponse({"success": False, "message": "Invalid request"}, status=400)

    user = request.user_obj

    try:
        amount = Decimal(request.POST.get("amount", 0))
        payment_method = request.POST.get("payment_method")
    except:
        return JsonResponse({"success": False, "message": "Invalid amount"}, status=400)

    if amount < 100:
        return JsonResponse({"success": False, "message": "Minimum ₹100 required"}, status=400)

    if not payment_method:
        return JsonResponse({"success": False, "message": "Select payment method"}, status=400)

    # 🔹 Get Previous Balance
    last_txn = WalletTransaction.objects.filter(user=user).order_by("-created_at").first()
    previous_balance = last_txn.current_balance if last_txn else Decimal("0.00")

    # 🔹 New Balance
    current_balance = previous_balance + amount

    # 🔹 Calculate Points (example: 0.28% of recharge)
    points = round(amount * Decimal("0.0028"), 2)

    # 🔹 Create Transaction Entry
    WalletTransaction.objects.create(
        user=user,
        tranx_id=str(uuid.uuid4()),
        amount=amount,
        transaction_type="CREDIT",
        points_earned=points,
        current_balance=current_balance,
        created_at=timezone.now(),
    )

    return JsonResponse({
        "success": True,
        "previous_balance": float(previous_balance),
        "added_amount": float(amount),
        "current_balance": float(current_balance),
        "points": float(points),
        "message": "Advance added successfully"
    })



@dashboard_login_required
def ajax_advance_history(request):
    user = request.user_obj

    search = request.GET.get("search", "")
    filter_by = request.GET.get("filter", "")
    page = int(request.GET.get("page", 1))

    qs = WalletTransaction.objects.filter(user=user).order_by("-created_at")

    # 🔍 SEARCH
    if search:
        qs = qs.filter(
            Q(tranx_id__icontains=search) |
            Q(transaction_type__icontains=search)
        )

    # 🗂️ FILTER
    now = timezone.now()
    if filter_by == "week":
        qs = qs.filter(created_at__gte=now - timedelta(days=7))
    elif filter_by == "month":
        qs = qs.filter(created_at__gte=now - timedelta(days=30))
    elif filter_by == "year":
        qs = qs.filter(created_at__gte=now - timedelta(days=365))

    # 📄 PAGINATION
    paginator = Paginator(qs, 10)
    page_obj = paginator.get_page(page)

    data = [{
        "id": tx.id, 
        "date": tx.created_at.strftime("%d %b %Y, %I:%M %p"),
        "tranx_id": tx.tranx_id,
        "type": tx.transaction_type.title(),
        "description": (
            "Advance Payment"
            if tx.transaction_type.lower() == "credit"
            else "Platform Payment"
        ),
        "amount": f"₹{tx.amount}",
        "status": "Successful",
    } for tx in page_obj]

    return JsonResponse({
        "success": True,
        "data": data,
        "pagination": {
            "current": page_obj.number,
            "total_pages": paginator.num_pages,
            "has_next": page_obj.has_next(),
            "has_prev": page_obj.has_previous(),
        }
    })

@dashboard_login_required
def ajax_advance_summary(request):
    user = request.user_obj
    filter_by = request.GET.get("filter", "week")

    end_date = timezone.now()

    if filter_by == "month":
        start_date = end_date - timedelta(days=30)
        label = "Last 30 days"
    elif filter_by == "year":
        start_date = end_date - timedelta(days=365)
        label = "Last 1 year"
    else:
        start_date = end_date - timedelta(days=7)
        label = "Last 7 days"

    qs = WalletTransaction.objects.filter(
        user=user,
        created_at__range=(start_date, end_date)
    )

    credit_total = qs.filter(transaction_type="CREDIT").aggregate(
        total=Sum("amount")
    )["total"] or 0

    debit_total = qs.filter(transaction_type="DEBIT").aggregate(
        total=Sum("amount")
    )["total"] or 0

    latest_tx = qs.order_by("-created_at").first()
    current_balance = latest_tx.current_balance if latest_tx else 0

    return JsonResponse({
        "success": True,
        "current_balance": float(current_balance),
        "total_credit": float(credit_total),
        "total_debit": float(debit_total),
        "label": label,
        "from_date": start_date.strftime("%d/%m/%Y"),
        "to_date": end_date.strftime("%d/%m/%Y"),
    })

@dashboard_login_required
def get_advance_receipt(request, advance_id):
    user = request.user_obj

    advance = get_object_or_404(
        WalletTransaction.objects.select_related("user"),
        id=advance_id
    )

    profile = getattr(advance.user, "userprofile", None)

    response_data = {
        "receipt_no": f"ADV/{advance.created_at.year}/{advance.id:04d}",
        "payment_date": advance.created_at.strftime("%d-%b-%Y"),

        # platform info
        "platform_name": settings.COMPANY_NAME,
        "gstin": settings.COMPANY_GSTIN,
        "platform_address": settings.COMPANY_ADDRESS,
        "platform_contact": settings.COMPANY_CONTACT,

        # received from
        "customer_name": (
            f"{profile.first_name} {profile.last_name}".strip()
            if profile else ""
        ),
        "customer_email": advance.user.email or "",
        "customer_address": (
            profile.address if hasattr(profile, "address") else ""
        ),

        # transaction
        "purpose": getattr(advance, "purpose", None) or "Advance for services",
        "description": getattr(advance, "description", None) or "Advance Payment",
        "amount": float(advance.amount),
        "gst_percent": 18,
        "payment_mode": getattr(advance, "payment_mode", ""),
        "transaction_id": getattr(advance, "transaction_id", ""),

        "created_by": "Authorized Signatory",
    }

    return JsonResponse(response_data)

def pharmacy_order_details(request, order_id):

    order = (
        UserPurchase.objects
        .filter(id=order_id)
        .values(
            "id",
            "final_amount",
            "order_status",
            "created_at",

            "user__phone_number",

            "user__userprofile__first_name",
            "user__userprofile__last_name",
            "user__userprofile__age",
            "user__userprofile__gender",
            "user__userprofile__profile_photo_path",

            "address__address",
            "address__pincode",
            "address__country",
            "address__city__name",
            "address__state__name",
        )
        .first()
    )

    if not order:
        return JsonResponse(
            {"error": "Order not found"},
            status=404
        )

    medicines = list(
        PurchaseMedicine.objects.filter(
            purchase_id=order_id
        ).values(
            "product_name",
            "quantity",
            "price",
            "mrp",
            "requires_prescription"
        )
    )

    return JsonResponse({
        "id": order["id"],
        "status": order["order_status"],
        "phone": order["user__phone_number"],

        "patient_name": (
            f"{order['user__userprofile__first_name'] or ''} "
            f"{order['user__userprofile__last_name'] or ''}"
        ).strip(),

        "age": order["user__userprofile__age"],
        "gender": order["user__userprofile__gender"],

        "profile_photo": order["user__userprofile__profile_photo_path"],

        "address": {
            "address": order["address__address"],
            "city": order["address__city__name"],
            "state": order["address__state__name"],
            "country": order["address__country"],
            "pincode": order["address__pincode"],
        },

        "total": float(order["final_amount"] or 0),

        "medicines": [
            {
                "name": m["product_name"],
                "qty": m["quantity"],
                "price": float(m["price"] or 0),
                "mrp": float(m["mrp"]) if m["mrp"] else float(m["price"] or 0) * 1.2,
                "requires_prescription": m["requires_prescription"],
            }
            for m in medicines
        ],
    })
