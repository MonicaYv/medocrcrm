import os
import json
import random
import uuid
from decimal import Decimal
from django.conf import settings
from django.core.files.storage import default_storage
from coupon.models import Coupon
from django.utils import timezone
from donate.models import Donation
from ngopost.models import NGOPost
from django.http import JsonResponse
from django.utils.timezone import now
from django.core.paginator import Paginator
from django.shortcuts import render, redirect
from datetime import date, datetime, timedelta
from django.db.models.functions import Coalesce, TruncDate
from django.template.loader import render_to_string
from subscription.models import SubscriptionHistory
from django.views.decorators.http import require_GET, require_POST
from .utils import dashboard_login_required, get_common_context, get_theme_colors
from history.views import get_hospital_bed_inventory
from appointments.utils import filter_appointments_between_dates, parse_filter_date
from .models import SettingMenu, CouponPerformance,  CalendarEvent, TrendingCoupon
from django.db.models import (
    Avg,
    Count,
    DecimalField,
    ExpressionWrapper,
    F,
    Max,
    OuterRef,
    Q,
    Sum,
    Subquery,
    Value,
    DurationField,
)
from registration.models import (
    PharmacyProfile, 
    NGOProfile, 
    ClientProfile, 
    AdvertiserProfile, 
    ContactPerson, 
    LabProfile, 
    DoctorProfile, 
    HospitalProfile,
    UserProfile,
)
from appointments.models import WalletTransaction
from services.models import LabBidding, LabBidStatus
from services.models import HospitalBidding, HospitalBidStatus, HospitalServiceRateCard
from services.models import DoctorBidding, DoctorBidStatus
from services.models import PharmacyMedicine, PharmacyBidding, PharmacyBidStatus
from django.db import transaction
from appointments.models import LabAppointments
from appointments.models import AppointmentStatus
from appointments.models import HospitalAppointments, HospitalAppointmentStatus
from appointments.models import DoctorAppointment
from orders.models import UserPurchase, OrderStatusChoices, PurchaseMedicine
from orders.utils import pharmacy_order_local_time
from appointments.models import WalletTransaction
from django.http import JsonResponse
from django.shortcuts import get_object_or_404
from django.http import HttpResponse  
from settings.models import SellerSubscription, SellerType 
from registration.models import ContactPerson
from django.db.models import Count
from PIL import Image, UnidentifiedImageError

PHARMACY_LOW_STOCK_THRESHOLD = 20


def get_wallet_balance(user):
    latest_transaction = (
        WalletTransaction.objects
        .filter(user=user)
        .order_by("-created_at", "-pk")
        .first()
    )
    return (
        latest_transaction.current_balance
        if latest_transaction
        else Decimal("0.00")
    )


def get_dashboard_appointment_date_range(request, today):
    date_filter = request.GET.get("date_filter", "today").strip().lower()

    if date_filter == "week":
        start_date = today - timedelta(days=6)
        end_date = today
    elif date_filter == "month":
        start_date = today.replace(day=1)
        end_date = today
    elif date_filter == "custom":
        start_date = parse_filter_date(request.GET.get("start_date"))
        end_date = parse_filter_date(request.GET.get("end_date"))
        if not start_date or not end_date:
            date_filter = "today"
            start_date = end_date = today
        elif start_date > end_date:
            start_date, end_date = end_date, start_date
    else:
        date_filter = "today"
        start_date = end_date = today

    return date_filter, start_date, end_date


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


def build_image_media_url(path):
    if not path:
        return ""

    normalized_path = str(path).replace("\\", "/").split("?", 1)[0]
    extension = os.path.splitext(normalized_path)[1].lower()
    if extension not in {".jpg", ".jpeg", ".png", ".gif", ".webp", ".bmp"}:
        return ""

    return build_media_url(path)


def format_hospital_visit_mode(value):
    normalized = (value or "").strip().lower().replace("_", "-")
    if normalized in {"home", "home-visit", "home-service"}:
        return "Home Visit"
    if normalized in {"hospital", "hospital-visit", "visit"}:
        return "Hospital Visit"
    return normalized.replace("-", " ").title() or "Not specified"


def parse_pharmacy_overview_range(filter_value, start_value, end_value, today):
    filter_value = (filter_value or "today").strip().lower()

    if filter_value == "today":
        return today, today
    if filter_value == "week":
        return today - timedelta(days=6), today
    if filter_value == "month":
        return today - timedelta(days=29), today
    if filter_value != "custom":
        raise ValueError("Unsupported date filter.")

    try:
        start_date = datetime.strptime(start_value, "%Y-%m-%d").date()
        end_date = datetime.strptime(end_value, "%Y-%m-%d").date()
    except (TypeError, ValueError):
        raise ValueError("Select both dates for the custom range.")

    if start_date > end_date:
        start_date, end_date = end_date, start_date
    return start_date, end_date


def get_pharmacy_overview_metrics(pharmacy_profile, start_date, end_date):
    placed_bid_order_ids = PharmacyBidding.objects.filter(
        pharmacy=pharmacy_profile
    ).values_list("order_id", flat=True)

    order_scope = Q(assigned_pharmacy=pharmacy_profile) | Q(
        assigned_pharmacy__isnull=True,
        order_status=OrderStatusChoices.PENDING,
    )

    orders = (
        UserPurchase.objects
        .filter(order_scope)
        .exclude(id__in=placed_bid_order_ids)
        .filter(created_at__date__range=(start_date, end_date))
    )
    completed_orders = orders.exclude(order_status=OrderStatusChoices.CANCELLED)
    amounts = completed_orders.aggregate(
        total=Sum(
            Coalesce(
                "final_amount",
                "total_amount",
                Value(Decimal("0.00")),
                output_field=DecimalField(max_digits=12, decimal_places=2),
            )
        )
    )
    sales = PurchaseMedicine.objects.filter(
        purchase__in=orders,
    ).exclude(purchase__order_status=OrderStatusChoices.CANCELLED)
    sales_totals = sales.aggregate(
        prescription=Sum("total_price", filter=Q(requires_prescription=True)),
        otc=Sum("total_price", filter=Q(requires_prescription=False)),
    )

    stock_quantities = PharmacyMedicine.objects.filter(
        pharmacy=pharmacy_profile,
        is_active=True,
    ).values_list("quantity", flat=True)
    quantities = [
        int(quantity)
        for quantity in stock_quantities
        if quantity and quantity.isdigit()
    ]

    total_orders = orders.count()
    pending_orders = orders.filter(
        order_status=OrderStatusChoices.PENDING
    ).count()
    processing_orders = orders.filter(
        order_status__in=[OrderStatusChoices.CONFIRMED, OrderStatusChoices.SHIPPED]
    ).count()
    delivered_orders = orders.filter(
        order_status=OrderStatusChoices.DELIVERED
    ).count()

    return {
        "total_orders": total_orders,
        "confirmed_orders": processing_orders,
        "pending_orders": pending_orders,
        "processing_orders": processing_orders,
        "delivered_orders": delivered_orders,
        "pending_requests": pending_orders,
        "customer_rating": "4.6",
        "review_count": "218",
        "total_stock": sum(quantities),
        "available_stock": sum(quantity for quantity in quantities if quantity > 0),
        "low_stock_medicines": sum(
            1
            for quantity in quantities
            if quantity <= PHARMACY_LOW_STOCK_THRESHOLD
        ),
        "revenue": str(amounts["total"] or Decimal("0.00")),
        "prescription_revenue": str(
            sales_totals["prescription"] or Decimal("0.00")
        ),
        "otc_revenue": str(sales_totals["otc"] or Decimal("0.00")),
    }


@require_GET
@dashboard_login_required
def pharmacy_overview_data(request):
    user = request.user_obj
    if user.user_type != "pharmacy":
        return JsonResponse({"error": "Pharmacy access required."}, status=403)

    pharmacy_profile = PharmacyProfile.objects.filter(user=user).first()
    if not pharmacy_profile:
        return JsonResponse({"error": "Pharmacy profile not found."}, status=404)

    today = timezone.localdate()
    try:
        start_date, end_date = parse_pharmacy_overview_range(
            request.GET.get("filter"),
            request.GET.get("start_date"),
            request.GET.get("end_date"),
            today,
        )
    except ValueError as error:
        return JsonResponse({"error": str(error)}, status=400)

    filter_value = (request.GET.get("filter") or "today").strip().lower()
    placed_bid_order_ids = PharmacyBidding.objects.filter(
        pharmacy=pharmacy_profile
    ).values_list("order_id", flat=True)
    order_scope = Q(assigned_pharmacy=pharmacy_profile) | Q(
        assigned_pharmacy__isnull=True,
        order_status=OrderStatusChoices.PENDING,
    )
    orders_qs = (
        UserPurchase.objects
        .filter(order_scope)
        .exclude(id__in=placed_bid_order_ids)
    )

    if filter_value == "today" and not orders_qs.filter(created_at__date=today).exists():
        latest_created = orders_qs.values_list('created_at', flat=True).order_by('-created_at').first()
        if latest_created:
            latest_date = pharmacy_order_local_time(latest_created).date()
            start_date = latest_date
            end_date = latest_date

    data = get_pharmacy_overview_metrics(pharmacy_profile, start_date, end_date)

    today_orders = orders_qs.filter(created_at__date=today)
    if not today_orders.exists():
        latest_created = orders_qs.values_list('created_at', flat=True).order_by('-created_at').first()
        if latest_created:
            latest_date = pharmacy_order_local_time(latest_created).date()
            today_orders = orders_qs.filter(created_at__date=latest_date)

    data["today_orders_count"] = today_orders.count()
    data["today_pending_count"] = today_orders.filter(
        order_status=OrderStatusChoices.PENDING
    ).count()
    data["today_processing_count"] = today_orders.filter(
        order_status__in=[OrderStatusChoices.CONFIRMED, OrderStatusChoices.SHIPPED]
    ).count()
    data["ongoing_orders_count"] = orders_qs.filter(
        order_status__in=[OrderStatusChoices.CONFIRMED, OrderStatusChoices.SHIPPED]
    ).count()
    data["wallet_balance"] = str(get_wallet_balance(user))

    return JsonResponse(data)


@require_GET
@dashboard_login_required
def lab_overview_data(request):
    user = request.user_obj
    if user.user_type != "lab":
        return JsonResponse({"error": "Lab access required."}, status=403)

    lab_profile = LabProfile.objects.filter(user=user).first()
    if not lab_profile:
        return JsonResponse({"error": "Lab profile not found."}, status=404)

    try:
        start_date = datetime.strptime(
            request.GET.get("start_date", ""), "%Y-%m-%d"
        ).date()
        end_date = datetime.strptime(
            request.GET.get("end_date", ""), "%Y-%m-%d"
        ).date()
    except (TypeError, ValueError):
        return JsonResponse({"error": "Select valid start and end dates."}, status=400)

    if start_date > end_date:
        start_date, end_date = end_date, start_date

    appointments = filter_appointments_between_dates(
        LabAppointments.objects.filter(accepted_lab=lab_profile),
        "lab",
        start_date,
        end_date,
    )
    return JsonResponse({
        "total_appointments": appointments.count(),
        "confirmed_count": appointments.filter(
            status=AppointmentStatus.ACCEPTED
        ).count(),
        "pending_count": appointments.filter(
            status=AppointmentStatus.PENDING
        ).count(),
    })


@require_POST
@dashboard_login_required
def upload_admin_profile_photo(request):
    user = request.user_obj

    contact_person = ContactPerson.objects.filter(
        profile_type=user.user_type,
        profile=user,
    ).order_by("-id").first()

    photo = request.FILES.get("profile_photo")
    if not photo:
        return JsonResponse({"error": "Choose a profile picture to upload."}, status=400)
    if photo.size > 5 * 1024 * 1024:
        return JsonResponse({"error": "Profile pictures must be 5 MB or smaller."}, status=400)

    extension = os.path.splitext(photo.name)[1].lower()
    if extension not in {".jpg", ".jpeg", ".png"}:
        return JsonResponse(
            {"error": "Upload a JPG or PNG profile picture."},
            status=400,
        )

    try:
        image = Image.open(photo)
        expected_format = "PNG" if extension == ".png" else "JPEG"
        if (
            image.format != expected_format
            or image.width > 4096
            or image.height > 4096
        ):
            return JsonResponse(
                {"error": "Upload a JPG or PNG image no larger than 4096 by 4096 pixels."},
                status=400,
            )
        image.verify()
    except (Image.DecompressionBombError, UnidentifiedImageError, OSError, ValueError):
        return JsonResponse(
            {"error": "Upload a valid JPG or PNG image."},
            status=400,
        )
    finally:
        photo.seek(0)

    admin_name = contact_person.name if contact_person else ""
    if not admin_name:
        if user.user_type == "lab":
            admin_name = LabProfile.objects.filter(user=user).values_list(
                "owner_name", flat=True
            ).first()
        elif user.user_type == "hospital":
            admin_name = HospitalProfile.objects.filter(user=user).values_list(
                "owner_name", flat=True
            ).first()
        elif user.user_type == "pharmacy":
            pharmacy_profile = PharmacyProfile.objects.filter(user=user).first()
            if pharmacy_profile:
                admin_name = " ".join(
                    value for value in (
                        pharmacy_profile.first_name,
                        pharmacy_profile.last_name,
                    ) if value
                )
        elif user.user_type == "doctor":
            doctor_profile = DoctorProfile.objects.filter(user=user).first()
            if doctor_profile:
                admin_name = doctor_profile.full_name or doctor_profile.owner_name
        elif user.user_type == "ngo":
            admin_name = NGOProfile.objects.filter(user=user).values_list("ngo_name", flat=True).first()
        elif user.user_type == "client":
            admin_name = ClientProfile.objects.filter(user=user).values_list("company_name", flat=True).first()
        elif user.user_type == "advertiser":
            admin_name = AdvertiserProfile.objects.filter(user=user).values_list("company_name", flat=True).first()
    admin_name_parts = (admin_name or user.user_type.title()).split()
    first_name = admin_name_parts[0]
    last_name = " ".join(admin_name_parts[1:])
    file_path = default_storage.save(
        f"admin_profiles/{user.user_type}/{user.id}/{uuid.uuid4().hex}{extension}",
        photo,
    )
    user_profile, _ = UserProfile.objects.get_or_create(
        user=user,
        defaults={
            "first_name": first_name,
            "last_name": last_name,
        },
    )
    user_profile.profile_photo_path = file_path
    user_profile.save(update_fields=["profile_photo_path"])

    return JsonResponse({
        "success": True,
        "image_url": default_storage.url(file_path),
    })

from django.http import HttpResponse    

@dashboard_login_required
def dashboard_home(request):
    user = request.user_obj
    user_type = user.user_type
    print("=" * 50)
    print("LOGGED USER ID =", user.id)
    print("LOGGED USER EMAIL =", user.email)
    print("LOGGED USER TYPE =", user.user_type)
    print("=" * 50)

    menu_items = SettingMenu.objects.filter(
        is_active=True,
        user_types__contains=[user_type]
    ).order_by('order')


    context = get_common_context(request, user)
    context["theme_colors"] = get_theme_colors(user_type)
    admin_user_profile = UserProfile.objects.filter(user=user).first()
    context["admin_profile_photo_url"] = (
        build_image_media_url(admin_user_profile.profile_photo_path)
        if admin_user_profile
        else ""
    )
    
    context["sidebar_menu"] = menu_items

    # -------------------------------
    # Wallet Balance (All users)
    # -------------------------------
    context["wallet_balance"] = get_wallet_balance(user)

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
            contact_person = ContactPerson.objects.filter(
                profile_type="pharmacy",
                profile=user
            ).first()

            print("========== CONTACT PERSON ==========")

            if contact_person:
                print("NAME =", contact_person.name)
                print("PHONE =", contact_person.phone_number)
                print("ROLE =", contact_person.role)
            else:
                print("CONTACT PERSON NOT FOUND")
            pharmacy_profile = PharmacyProfile.objects.get(user=user)
            today = timezone.localdate()

            placed_bid_order_ids = PharmacyBidding.objects.filter(
                pharmacy=pharmacy_profile
            ).values_list("order_id", flat=True)

            order_scope = Q(assigned_pharmacy=pharmacy_profile) | Q(
                assigned_pharmacy__isnull=True,
                order_status=OrderStatusChoices.PENDING,
            )

            pharmacy_orders_qs = (
                UserPurchase.objects
                .filter(order_scope)
                .exclude(id__in=placed_bid_order_ids)
            )

            today_orders_qs = pharmacy_orders_qs.filter(created_at__date=today)
            overview_start = today
            overview_end = today
            if not today_orders_qs.exists():
                latest_created = pharmacy_orders_qs.values_list('created_at', flat=True).order_by('-created_at').first()
                if latest_created:
                    latest_date = pharmacy_order_local_time(latest_created).date()
                    today_orders_qs = pharmacy_orders_qs.filter(created_at__date=latest_date)
                    overview_start = latest_date
                    overview_end = latest_date

            today_orders_count = today_orders_qs.count()
            today_pending_count = today_orders_qs.filter(
                order_status=OrderStatusChoices.PENDING
            ).count()
            today_processing_count = today_orders_qs.filter(
                order_status__in=[OrderStatusChoices.CONFIRMED, OrderStatusChoices.SHIPPED]
            ).count()
            ongoing_orders_count = pharmacy_orders_qs.filter(
                order_status__in=[OrderStatusChoices.CONFIRMED, OrderStatusChoices.SHIPPED]
            ).count()

            pharmacy_overview = get_pharmacy_overview_metrics(
                pharmacy_profile, overview_start, overview_end
            )

            # Order Requests for the Order Requests table
            order_scope_requests = Q(assigned_pharmacy=pharmacy_profile) | Q(
                assigned_pharmacy__isnull=True,
                order_status=OrderStatusChoices.PENDING,
            )

            raw_order_requests = list(
                UserPurchase.objects
                .filter(order_scope_requests)
                .defer("prescriptions", "doctor_name", "patient_name")
                .select_related("user", "user__userprofile", "address")
                .prefetch_related("medicines")
                .order_by("-created_at")[:15]
            )

            placed_bid_order_ids_set = set(placed_bid_order_ids)
            order_requests = []
            for o in raw_order_requests:
                cust_name = ""
                if o.user and hasattr(o.user, 'userprofile') and o.user.userprofile:
                    first = o.user.userprofile.first_name or ""
                    last = o.user.userprofile.last_name or ""
                    cust_name = f"{first} {last}".strip()
                if not cust_name and o.address:
                    cust_name = f"{o.address.first_name or ''} {o.address.last_name or ''}".strip()
                if not cust_name:
                    cust_name = f"Customer #{o.user_id or o.id}"

                parts = cust_name.split()
                if len(parts) >= 2:
                    initials = f"{parts[0][0]}{parts[1][0]}".upper()
                elif len(parts) == 1 and len(parts[0]) > 0:
                    initials = parts[0][:2].upper()
                else:
                    initials = "CU"

                colors = ["bg-green-500", "bg-amber-500", "bg-[#1A73E8]", "bg-violet-600", "bg-teal-600", "bg-pink-600", "bg-indigo-600"]
                avatar_color = colors[o.id % len(colors)]

                med_list = list(o.medicines.all())
                if med_list:
                    med_summary = " + ".join([
                        f"{m.product_name or m.medicine_id} × {m.quantity}"
                        for m in med_list[:2]
                    ])
                    if len(med_list) > 2:
                        med_summary += f" + {len(med_list) - 2} more"
                    has_rx = any(m.requires_prescription for m in med_list)
                else:
                    med_summary = "Prescription Meds"
                    has_rx = False

                delivery_label = "Store Pickup" if (o.delivery_type and "pickup" in o.delivery_type.lower()) else "Home Delivery"
                urgency = "Emergency" if (o.delivery_type and "quick" in o.delivery_type.lower()) else "Normal"
                budget_val = o.final_amount if o.final_amount is not None else (o.total_amount if o.total_amount is not None else Decimal("0.00"))
                is_bid_placed = o.id in placed_bid_order_ids_set

                order_requests.append({
                    "id": o.id,
                    "customer_name": cust_name,
                    "customer_initials": initials,
                    "avatar_color": avatar_color,
                    "medicines_summary": med_summary,
                    "local_created_at": pharmacy_order_local_time(o.created_at),
                    "delivery_label": delivery_label,
                    "has_prescription": has_rx,
                    "urgency": urgency,
                    "budget": f"{budget_val:.0f}" if budget_val == int(budget_val) else f"{budget_val:.2f}",
                    "is_bid_placed": is_bid_placed,
                    "notes": o.notes or "",
                })

            pending_orders = UserPurchase.objects.filter(
                assigned_pharmacy=pharmacy_profile,
                order_status__in=[
                    OrderStatusChoices.PENDING,
                    OrderStatusChoices.CONFIRMED,
                    OrderStatusChoices.SHIPPED
                ]
            ).count()


            recent_orders_qs = (
                UserPurchase.objects
                .filter(
                    assigned_pharmacy=pharmacy_profile,
                    order_status__in=[
                        OrderStatusChoices.CONFIRMED,
                        OrderStatusChoices.SHIPPED,
                        OrderStatusChoices.DELIVERED,
                    ],
                )
                .defer("prescriptions", "doctor_name", "patient_name")
                .select_related("user", "user__userprofile", "address")
                .prefetch_related("medicines")
                .order_by("-updated_at", "-created_at")[:3]
            )

            recent_orders = []
            order_status_labels = {
                OrderStatusChoices.CONFIRMED: "Accepted",
                OrderStatusChoices.SHIPPED: "Shipped",
                OrderStatusChoices.DELIVERED: "Completed",
            }
            for o in recent_orders_qs:
                cust_name = ""
                if o.user and hasattr(o.user, 'userprofile') and o.user.userprofile:
                    first = o.user.userprofile.first_name or ""
                    last = o.user.userprofile.last_name or ""
                    cust_name = f"{first} {last}".strip()
                if not cust_name and o.address:
                    cust_name = f"{o.address.first_name or ''} {o.address.last_name or ''}".strip()
                if not cust_name:
                    cust_name = f"Customer #{o.user_id or o.id}"

                delivery_label = "Store Pickup" if (o.delivery_type and "pickup" in o.delivery_type.lower()) else "Home Delivery"

                med_list = list(o.medicines.all())
                if med_list:
                    med_summary = " + ".join([
                        f"{m.product_name or m.medicine_id} × {m.quantity}"
                        for m in med_list[:2]
                    ])
                    if len(med_list) > 2:
                        med_summary += f" + {len(med_list) - 2} more"
                else:
                    med_summary = ""

                amount_val = o.final_amount if o.final_amount is not None else (o.total_amount if o.total_amount is not None else 0)

                payment_mode = o.payment_method or "UPI Paid"
                if "cod" in payment_mode.lower() or "cash" in payment_mode.lower():
                    payment_label = "Cash on Delivery"
                else:
                    payment_label = payment_mode

                recent_orders.append({
                    "id": o.id,
                    "order_status": o.order_status,
                    "order_status_label": order_status_labels.get(
                        o.order_status, o.get_order_status_display()
                    ),
                    "customer_name": cust_name,
                    "delivery_label": delivery_label,
                    "created_at": o.created_at,
                    "updated_at": o.updated_at,
                    "local_created_at": pharmacy_order_local_time(o.updated_at or o.created_at),
                    "medicines": med_summary,
                    "total_amount": f"{amount_val:.0f}" if amount_val == int(amount_val) else f"{amount_val:.2f}",
                    "payment_mode": payment_label,
                })


            popular_coupons = Coupon.objects.all().order_by('-redeemed_count')[:5]

            active_subscription = SellerSubscription.objects.filter(
                seller_type=SellerType.PHARMACY,
                seller_profile_id=pharmacy_profile.id,
                is_active=True,
                is_enabled=True
            ).first()

            pharmacy_medicines = PharmacyMedicine.objects.filter(
                pharmacy=pharmacy_profile,
                is_active=True
            ).order_by("-updated_at")

            inventory_alerts = []
            for med in pharmacy_medicines:
                try:
                    qty = int(str(med.quantity).strip())
                except (ValueError, TypeError):
                    qty = 0

                if qty <= PHARMACY_LOW_STOCK_THRESHOLD:
                    unit = (med.type or "unit").strip()
                    if unit.lower() in ["tablet", "capsule", "strip", "bottle", "vial", "pack"]:
                        unit_label = f"{unit.lower()}s"
                    elif unit.lower().endswith("s"):
                        unit_label = unit.lower()
                    else:
                        unit_label = unit

                    if qty == 0:
                        status_badge = "Out of Stock"
                        badge_color = "text-red-600"
                        card_bg = "bg-pink-50"
                        remaining_text = "0 units"
                    elif qty <= 5:
                        status_badge = "Critical"
                        badge_color = "text-red-600"
                        card_bg = "bg-pink-50"
                        remaining_text = f"{qty} {unit_label} remaining"
                    else:
                        status_badge = "Low Stock"
                        badge_color = "text-amber-600"
                        card_bg = "bg-amber-50"
                        remaining_text = f"{qty} {unit_label} remaining"

                    details_parts = []
                    if med.category:
                        details_parts.append(med.category.strip())
                    if med.type and med.type.strip() not in details_parts:
                        details_parts.append(med.type.strip())
                    details_str = " · ".join(details_parts) if details_parts else "General Medicine"

                    inventory_alerts.append({
                        "id": med.id,
                        "name": med.name.strip() if med.name else "Unnamed Medicine",
                        "details": details_str,
                        "quantity": qty,
                        "status_badge": status_badge,
                        "badge_color": badge_color,
                        "card_bg": card_bg,
                        "remaining_text": remaining_text,
                    })

            inventory_alerts.sort(key=lambda x: x["quantity"])
            inventory_alerts = inventory_alerts[:6]

            context.update({
                'pharmacy_profile': pharmacy_profile,
                'inventory_alerts': inventory_alerts,
                 
                'contact_person': contact_person,

                'recent_orders': recent_orders,
                'pharmacy_overview': pharmacy_overview,
                'popular_coupons': popular_coupons,

                'order_requests': order_requests,
                'user_display_name': pharmacy_profile.company_name,

                'pending_orders': pending_orders,
                'today_orders_count': today_orders_count,
                'today_pending_count': today_pending_count,
                'today_processing_count': today_processing_count,
                'ongoing_orders_count': ongoing_orders_count,

                'active_bids': PharmacyBidding.objects.filter(
                    pharmacy=pharmacy_profile,
                    is_active=True,
                ).count() or UserPurchase.objects.filter(
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
            lab_profile = LabProfile.objects.filter(user=user).first()
            if not lab_profile:
                return render(request, "dashboard/not_found.html")
            today = timezone.localdate()
            date_filter = request.GET.get("date_filter", "today")

            if date_filter == "week":
                start_date = today - timedelta(days=6)
                end_date = today
            elif date_filter == "month":
                start_date = today - timedelta(days=29)
                end_date = today
            elif date_filter == "custom":
                try:
                    start_date = datetime.strptime(
                        request.GET.get("start_date", ""), "%Y-%m-%d"
                    ).date()
                    end_date = datetime.strptime(
                        request.GET.get("end_date", ""), "%Y-%m-%d"
                    ).date()
                    if start_date > end_date:
                        start_date, end_date = end_date, start_date
                except (TypeError, ValueError):
                    start_date = end_date = today
            else:
                date_filter = "today"
                start_date = end_date = today

            today_appointments = filter_appointments_between_dates(
                LabAppointments.objects.filter(accepted_lab=lab_profile),
                "lab",
                start_date,
                end_date,
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
            ).order_by('-id').first()
            print("=" * 60   )
            print("LOGGED USER ID =", user.id)
            print("LOGGED USER EMAIL =", user.email)
            print("LOGGED USER TYPE =", user.user_type)
            print("CONTACT PERSON =", contact_person)
            print("=" * 60)
            print("========== CONTACT PERSON ==========")
            print("USER ID =", user.id)

            if contact_person:
                print("CONTACT ID =", contact_person.id)
                print("NAME =", contact_person.name)
                print("PHONE =", contact_person.phone_number)
                print("ROLE =", contact_person.role)
            else:
                print("CONTACT PERSON NOT FOUND")

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
            ).exclude(
                lab_bids__lab=lab_profile,
                lab_bids__bid_status__in=[LabBidStatus.PENDING, LabBidStatus.ACCEPTED],
            ).distinct().order_by("-created_at")[:5]
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
                'date_filter': date_filter,
                'start_date': start_date,
                'end_date': end_date,
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
            # today = timezone.now().date()

            # total_appointments_today = DoctorAppointment.objects.filter(
            #    doctor=doctor_profile,
            #     preferred_date_time__date=today
            # ).count()

            # confirmed_count = DoctorAppointment.objects.filter(
            #    doctor=doctor_profile,
            #    status="Accepted",
            # preferred_date_time__date=today
            # ).count()

            # pending_count = DoctorAppointment.objects.filter(
            #    doctor=doctor_profile,
            #    status="Pending",
            # preferred_date_time__date=today
            # ).count()

            # pending_requests_count = DoctorAppointment.objects.filter(
            #   status="Pending"
            # ).count()
            # doctor_profile = DoctorProfile.objects.get(user=user)
            doctor_profile = DoctorProfile.objects.filter(
                user=user
            ).first()
            print("CLINIC PHOTO =", doctor_profile.clinic_photo_path)
            if not doctor_profile:
                return render(request, "dashboard/not_found.html")

            today = timezone.localdate()
            date_filter, start_date, end_date = (
                get_dashboard_appointment_date_range(request, today)
            )

            doctor_appointments = DoctorAppointment.objects.filter(
                doctor=doctor_profile
            )

            total_appointments_today = filter_appointments_between_dates(
                doctor_appointments, "doctor", start_date, end_date
            ).count()

            confirmed_count = filter_appointments_between_dates(
                doctor_appointments, "doctor", start_date, end_date
            ).filter(status="Accepted").count()

            pending_count = filter_appointments_between_dates(
                doctor_appointments, "doctor", start_date, end_date
            ).filter(status="Pending").count()

            pending_requests_count = DoctorAppointment.objects.filter(
               status="Pending"
            ).count()

            contact_person = ContactPerson.objects.filter(
                profile_type="doctor",
                profile=user
            ).order_by('-id').first()

            appointment_requests = DoctorAppointment.objects.filter(
                status="Pending"
            ).exclude(
                bids__doctor=doctor_profile,
                bids__bid_status__in=[DoctorBidStatus.PENDING, DoctorBidStatus.ACCEPTED],
            ).distinct().select_related(
                "user__userprofile"
            ).order_by("-created_at")[:5]
            print("DOCTOR PROFILE =", doctor_profile.id)
            print(
                "TOTAL APPOINTMENTS TABLE =",
                DoctorAppointment.objects.count()
            )

            for a in DoctorAppointment.objects.all()[:20]:
                print(
                   "ID =", a.id,
                   "DOCTOR =", a.doctor_id,
                    "STATUS =", a.status
                )

            print(
                "ALL DOCTOR APPOINTMENTS =",
                DoctorAppointment.objects.filter(
                doctor=doctor_profile
            ).count()
            )

            print(
                "ACCEPTED APPOINTMENTS =",
                DoctorAppointment.objects.filter(
                doctor=doctor_profile,
                status="Accepted"
            ).count()
            )

            print(
               "PENDING APPOINTMENTS =",
                DoctorAppointment.objects.filter(
                doctor=doctor_profile,
                status="Pending"
            ).count()
            )
            
            # scheduled_appointments = DoctorAppointment.objects.filter(
            #     doctor=doctor_profile,
            #     status="Accepted"
            # ).select_related(
            #     "user__userprofile"
            # ).order_by("preferred_date_time")[:3]
            # scheduled_appointments = DoctorAppointment.objects.filter(
            #     status="Pending"
            # ).select_related(
            #     "user__userprofile"
            # ).order_by("-created_at")[:3]
            scheduled_appointments = DoctorAppointment.objects.filter(
                doctor=doctor_profile,
                status="Accepted"
            ).select_related(
                "user__userprofile",
                "doctor"
            ).order_by("-preferred_date_time")[:3]
            for a in scheduled_appointments:
                print(
                    "SCHEDULED =>",
                    a.id,
                    a.doctor_id,
                    a.status
                )
            for a in scheduled_appointments:
                print(
                    "ID =", a.id,
                    "DOCTOR =", a.doctor_id,
                    "STATUS =", a.status
                )

            doctor_bids = DoctorBidding.objects.filter(
                doctor=doctor_profile
                )

            active_bids_count = doctor_bids.filter(
                is_active=True,
                bid_status__in=[
                DoctorBidStatus.PENDING,
                DoctorBidStatus.ACCEPTED
                ]
            ).count()

            active_bids = active_bids_count

            ongoing_orders_count = DoctorAppointment.objects.filter(
            doctor=doctor_profile,
            status="Accepted"
            ).count()

        # Weekly date range
            week_start = today - timedelta(days=today.weekday())
            week_end = week_start + timedelta(days=7)

            weekly_appointments = DoctorAppointment.objects.filter(
            doctor=doctor_profile,
            created_at__date__gte=week_start,
            created_at__date__lt=week_end
            )

            weekly_bids = doctor_bids.filter(
            created_at__date__gte=week_start,
            created_at__date__lt=week_end
            )

            consults_won = weekly_appointments.filter(
            status="Accepted"
            ).count()

            bids_answered = weekly_bids.count()

        # Bid conversion rate
            total_bids = doctor_bids.count()

            accepted_bids = doctor_bids.filter(
            bid_status__in=[
                DoctorBidStatus.ACCEPTED,
                DoctorBidStatus.COMPLETED
            ]
            )

            accepted_bids_count = accepted_bids.count()

            bid_conversion_rate = (
            round((accepted_bids_count / total_bids) * 100, 2)
            if total_bids else 0
            )

        # Average winning bid
            avg_winning_bid = accepted_bids.aggregate(
            average=Avg("total_bid_amount")
            )["average"] or 0

        # Most-used consultation mode
            top_mode_data = DoctorAppointment.objects.filter(
            doctor=doctor_profile
            ).values(
            "consultation_type"
            ).annotate(
            mode_count=Count("id")
            ).order_by("-mode_count").first()

            top_mode = (
            top_mode_data["consultation_type"]
            if top_mode_data else "N/A"
            )

        # Average bid response time in minutes
            response_times = []

            for bid in doctor_bids.select_related("appointment"):
                if bid.appointment.created_at:
                    response_times.append(
                    (
                        bid.created_at - bid.appointment.created_at
                    ).total_seconds()
                )

            avg_response_time = (
                round(
                sum(response_times) / len(response_times) / 60,
                2
            )
            if response_times else 0
            )

            week_range = (
            f"{week_start.strftime('%d %b')} - "
            f"{(week_end - timedelta(days=1)).strftime('%d %b %Y')}"
            )
            context["appointment_requests"] = appointment_requests
            context["scheduled_appointments"] = scheduled_appointments
            context.update({
                'doctor_profile': doctor_profile,
                'clinic_photo_url': build_media_url(doctor_profile.clinic_photo_path),
                'contact_person': contact_person,
                'date_filter': date_filter,
                'start_date': start_date,
                'end_date': end_date,
                'total_appointments_today': total_appointments_today,
                'confirmed_count': confirmed_count,
                'pending_count': pending_count,
                'pending_requests_count': pending_requests_count,
                'user_display_name': doctor_profile.clinic_name,

                'quotes_given': DoctorBidding.objects.filter(
                    doctor=doctor_profile
                ).count(),

                'active_bids': active_bids,
                'active_bids_count': active_bids_count,

                'orders_won': DoctorAppointment.objects.filter(
                    doctor=doctor_profile,
                    status="Accepted"
                ).count(),

                'pending_orders': DoctorAppointment.objects.filter(
                    doctor=doctor_profile,
                    status="Pending"
                ).count(),
                
                'ongoing_orders_count': ongoing_orders_count,
                'avg_response_time': avg_response_time,

                'week_range': week_range,
                'consults_won': consults_won,
                'bids_answered': bids_answered,
                'bid_conversion_rate': bid_conversion_rate,

                'avg_winning_bid': avg_winning_bid,
                'top_mode': top_mode,
            })
            return render(request, "dashboard/home_doctor.html", context)

        # ================= HOSPITAL =================
        elif user_type == 'hospital':
            hospital_profile = HospitalProfile.objects.filter(
                user=user
            ).select_related(
                "city",
                "state",
                "hospital_timing",
                "hospital_type",
                "hospital_service",
            ).first()
            if not hospital_profile:
                return render(request, "dashboard/not_found.html", context)

            contact_person = ContactPerson.objects.filter(
                profile_type="hospital",
                profile=user
            ).order_by('-id').first()
            admin_name = " ".join(
                part
                for part in (
                    admin_user_profile.first_name if admin_user_profile else "",
                    admin_user_profile.last_name if admin_user_profile else "",
                )
                if part
            )
            hospital_contact_name = (
                (contact_person.name or "").strip()
                or (hospital_profile.owner_name or "").strip()
                or admin_name
                or "Administrator not provided"
            )
            hospital_contact_initials = "".join(
                part[0] for part in hospital_contact_name.split()[:2]
            ).upper()
            hospital_contact_phone = (
                (contact_person.phone_number or "").strip()
                or (hospital_profile.contact_no or "").strip()
                or (user.phone_number or "").strip()
            )
            hospital_contact_country_code = (
                (contact_person.phone_country_code or "").strip()
                or (user.phone_country_code or "").strip()
            )
            if hospital_contact_phone and hospital_contact_country_code:
                hospital_contact_phone = (
                    f"{hospital_contact_country_code} {hospital_contact_phone}"
                )
            hospital_hours = ""
            if hospital_profile.hospital_timing:
                timing = hospital_profile.hospital_timing
                hospital_hours = timing.name or ""
                if timing.open_time and timing.close_time:
                    time_range = (
                        f"{timing.open_time.strftime('%I:%M %p').lstrip('0')} – "
                        f"{timing.close_time.strftime('%I:%M %p').lstrip('0')}"
                    )
                    hospital_hours = f"{hospital_hours} · {time_range}".strip(" ·")
                if timing.days:
                    hospital_hours = f"{hospital_hours} · {timing.days}".strip(" ·")

            hospital_service_tags = []
            configured_services = HospitalServiceRateCard.objects.filter(
                hospital=hospital_profile,
                is_active=True,
            ).exclude(
                category__name__isnull=True,
            ).exclude(
                category__name="",
            ).order_by(
                "category__name",
            ).values_list(
                "category__name",
                flat=True,
            ).distinct()
            for service_name in (
                hospital_profile.hospital_type.name if hospital_profile.hospital_type else "",
                hospital_profile.hospital_service.name if hospital_profile.hospital_service else "",
                *configured_services,
            ):
                if service_name and service_name not in hospital_service_tags:
                    hospital_service_tags.append(service_name)

            hospital_photo_url = build_image_media_url(
                hospital_profile.hospital_photo_path
            )
            hospital_logo_url = build_image_media_url(
                hospital_profile.hospital_logo_path
            )
            bed_inventory, bed_inventory_by_room, bed_inventory_warning = (
                get_hospital_bed_inventory(
                    hospital_profile,
                    request.session.get("hospital_bed_assignments", {}),
                )
            )
            bed_capacity = len(bed_inventory)
            occupied_beds = sum(bed.is_occupied for bed in bed_inventory)
            available_beds = bed_capacity - occupied_beds
            bed_occupancy_percent = (
                round((occupied_beds / bed_capacity) * 100)
                if bed_capacity
                else 0
            )

            date_filter, start_date, end_date = (
                get_dashboard_appointment_date_range(request, timezone.localdate())
            )
            latest_hospital_bid = HospitalBidding.objects.filter(
                appointment=OuterRef("pk"),
                hospital=hospital_profile,
            ).order_by("-created_at")
            request_queryset = HospitalAppointments.objects.filter(
                status=HospitalAppointmentStatus.PENDING,
            ).annotate(
                hospital_bid_status=Subquery(
                    latest_hospital_bid.values("bid_status")[:1]
                )
            ).exclude(
                hospital_bid_status=HospitalBidStatus.ACCEPTED,
            )
            appointment_requests = list(
                request_queryset.select_related(
                    "user__userprofile",
                    "category",
                    "description",
                    "service_type",
                ).order_by("-created_at")[:10]
            )
            for appointment in appointment_requests:
                patient_profile = getattr(appointment.user, "userprofile", None)
                appointment.patient_name = (
                    " ".join(
                        part
                        for part in (
                            patient_profile.first_name if patient_profile else "",
                            patient_profile.last_name if patient_profile else "",
                        )
                        if part
                    )
                    or appointment.user.email
                    or f"Customer #{appointment.user_id}"
                )
                appointment.patient_initials = "".join(
                    part[0] for part in appointment.patient_name.split()[:2]
                ).upper()
                appointment.visit_mode_display = format_hospital_visit_mode(
                    appointment.preferred_mode
                )
                appointment.request_state = (
                    "submitted"
                    if appointment.hospital_bid_status == HospitalBidStatus.PENDING
                    else "new"
                )

            appointments_in_range = filter_appointments_between_dates(
                HospitalAppointments.objects.filter(
                    accepted_hospital=hospital_profile
                ),
                "hospital",
                start_date,
                end_date,
            ).filter(
                status__in=[
                    HospitalAppointmentStatus.ACCEPTED,
                    HospitalAppointmentStatus.COMPLETED,
                ]
            )
            today = timezone.localdate()
            today_appointments = filter_appointments_between_dates(
                HospitalAppointments.objects.filter(
                    accepted_hospital=hospital_profile,
                    status__in=[
                        HospitalAppointmentStatus.ACCEPTED,
                        HospitalAppointmentStatus.COMPLETED,
                    ],
                ),
                "hospital",
                today,
                today,
            )
            scheduled_appointments = list(
                today_appointments.select_related(
                    "user__userprofile",
                    "category",
                    "description",
                    "service_type",
                ).order_by("preferred_date_from")
            )
            current_time = timezone.now()
            for appointment in scheduled_appointments:
                patient_profile = getattr(appointment.user, "userprofile", None)
                appointment.patient_name = (
                    " ".join(
                        part
                        for part in (
                            patient_profile.first_name if patient_profile else "",
                            patient_profile.last_name if patient_profile else "",
                        )
                        if part
                    )
                    or appointment.user.email
                    or f"Customer #{appointment.user_id}"
                )
                appointment.patient_initials = "".join(
                    part[0] for part in appointment.patient_name.split()[:2]
                ).upper()
                appointment.service_name = (
                    appointment.category.name
                    if appointment.category
                    else appointment.description.description
                    if appointment.description
                    else appointment.service_type.name
                    if appointment.service_type
                    else "Service not specified"
                )
                appointment.visit_mode_display = format_hospital_visit_mode(
                    appointment.preferred_mode
                )
                if appointment.status == HospitalAppointmentStatus.COMPLETED:
                    appointment.schedule_state = "completed"
                elif appointment.preferred_date_from and appointment.preferred_date_from < current_time:
                    appointment.schedule_state = "past"
                else:
                    appointment.schedule_state = "upcoming"

            upcoming_count = appointments_in_range.filter(
                status=HospitalAppointmentStatus.ACCEPTED,
                preferred_date_from__gte=current_time,
            ).count()
            completed_count = appointments_in_range.filter(
                status=HospitalAppointmentStatus.COMPLETED,
            ).count()
            past_count = appointments_in_range.filter(
                status=HospitalAppointmentStatus.ACCEPTED,
                preferred_date_from__lt=current_time,
            ).count()
            total_appointments = appointments_in_range.count()
            today_upcoming_count = today_appointments.filter(
                status=HospitalAppointmentStatus.ACCEPTED,
                preferred_date_from__gte=current_time,
            ).count()
            today_past_count = today_appointments.filter(
                status=HospitalAppointmentStatus.ACCEPTED,
                preferred_date_from__lt=current_time,
            ).count()
            today_completed_count = today_appointments.filter(
                status=HospitalAppointmentStatus.COMPLETED,
            ).count()
            total_appointments_today = today_appointments.count()

            request_count = request_queryset.count()
            new_requests = request_queryset.filter(
                Q(hospital_bid_status__isnull=True)
                | Q(hospital_bid_status__in=[
                    HospitalBidStatus.REJECTED,
                    HospitalBidStatus.CANCELLED,
                ])
            ).count()
            submitted_requests = request_queryset.filter(
                hospital_bid_status=HospitalBidStatus.PENDING,
            ).count()

            week_start = timezone.localdate() - timedelta(days=6)
            answered_bids = HospitalBidding.objects.filter(
                hospital=hospital_profile,
                bid_status__in=[
                    HospitalBidStatus.ACCEPTED,
                    HospitalBidStatus.REJECTED,
                    HospitalBidStatus.COMPLETED,
                ],
                updated_at__date__gte=week_start,
                updated_at__date__lte=timezone.localdate(),
            )
            bids_won = answered_bids.filter(
                bid_status__in=[
                    HospitalBidStatus.ACCEPTED,
                    HospitalBidStatus.COMPLETED,
                ]
            ).count()
            bids_lost = answered_bids.filter(
                bid_status=HospitalBidStatus.REJECTED
            ).count()
            bids_answered = answered_bids.count()
            win_rate = round((bids_won / bids_answered) * 100) if bids_answered else None
            response_bids = answered_bids.filter(
                bid_status__in=[
                    HospitalBidStatus.ACCEPTED,
                    HospitalBidStatus.REJECTED,
                ]
            )
            average_response = response_bids.aggregate(
                average=Avg(
                    ExpressionWrapper(
                        F("updated_at") - F("appointment__created_at"),
                        output_field=DurationField(),
                    )
                )
            )["average"]
            avg_response_minutes = (
                round(average_response.total_seconds() / 60, 1)
                if average_response is not None
                else None
            )
            top_service_row = (
                HospitalAppointments.objects.filter(
                    created_at__date__gte=week_start,
                    created_at__date__lte=timezone.localdate(),
                )
                .exclude(category__isnull=True)
                .values("category__name")
                .annotate(total=Count("id"))
                .order_by("-total", "category__name")
                .first()
            )

            active_subscription = (
                SubscriptionHistory.objects.select_related("plan")
                .filter(user=user, status="active", expiry_date__gte=timezone.now())
                .order_by("-activation_date")
                .first()
            )

            context["appointment_requests"] = appointment_requests
            context["scheduled_appointments"] = scheduled_appointments
            context.update({
                'logo': '/static/images/hospital-logo.svg',
                'hospital_profile': hospital_profile,
                'contact_person': contact_person,
                'hospital_contact_name': hospital_contact_name,
                'hospital_contact_initials': hospital_contact_initials,
                'hospital_contact_phone': (
                    hospital_contact_phone or "Not provided"
                ),
                'hospital_service_tags': hospital_service_tags,
                'hospital_photo_url': hospital_photo_url,
                'hospital_logo_url': hospital_logo_url,
                'hospital_hours': hospital_hours,
                'date_filter': date_filter,
                'start_date': start_date,
                'end_date': end_date,
                'user_display_name': hospital_profile.hospital_name or "Hospital",
                'active_bids': HospitalBidding.objects.filter(
                    hospital=hospital_profile,
                    bid_status=HospitalBidStatus.PENDING,
                ).count(),
                'events': CalendarEvent.objects.all().order_by('date'),
                'user': user,
                'total_appointments_today': total_appointments_today,
                'overview_appointment_count': total_appointments,
                'upcoming_count': upcoming_count,
                'past_count': past_count,
                'completed_count': completed_count,
                'today_upcoming_count': today_upcoming_count,
                'today_past_count': today_past_count,
                'today_completed_count': today_completed_count,
                'new_requests': new_requests,
                'request_count': request_count,
                'submitted_requests': submitted_requests,
                'attention_count': new_requests,
                'bed_inventory_configured': bed_capacity > 0,
                'bed_inventory_by_room': bed_inventory_by_room,
                'bed_inventory_warning': bed_inventory_warning,
                'bed_capacity': bed_capacity,
                'occupied_beds': occupied_beds,
                'available_beds': available_beds,
                'bed_occupancy_percent': bed_occupancy_percent,
                'bids_won': bids_won,
                'bids_lost': bids_lost,
                'bids_answered': bids_answered,
                'win_rate': win_rate,
                'win_rate_available': bids_answered > 0,
                'avg_response_minutes': avg_response_minutes,
                'week_range': f"{week_start:%d %b} – {timezone.localdate():%d %b %Y}",
                'top_service': (
                    top_service_row["category__name"] if top_service_row else "—"
                ),
                'active_subscription': active_subscription,
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
        .order_by("-created_at", "-pk")
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
    last_txn = WalletTransaction.objects.filter(user=user).order_by("-created_at", "-pk").first()
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
    search = request.GET.get("search", "").strip()
    filter_by = request.GET.get("filter", "week")
    page = request.GET.get("page", 1)
    # Current local date
    today = timezone.localdate()
    # Base queryset
    qs = WalletTransaction.objects.filter(
        user=user
    ).order_by("-created_at")
    # Search by transaction ID
    if search:
        qs = qs.filter(tranx_id__icontains=search)
    # Date filters
    if filter_by == "custom":
        start_date = request.GET.get("start_date")
        end_date = request.GET.get("end_date")
        if start_date and end_date:
            try:
                start_date = datetime.strptime(
                    start_date, "%Y-%m-%d"
                ).date()
                end_date = datetime.strptime(
                    end_date, "%Y-%m-%d"
                ).date()
                if start_date > end_date:
                    start_date, end_date = end_date, start_date
                qs = qs.filter(
                    created_at__date__range=(
                        start_date,
                        end_date
                    )
                )
            except (ValueError, TypeError):
                return JsonResponse({
                    "success": False,
                    "message": "Invalid date format."
                }, status=400)
        else:
            # Don't return unfiltered records when custom dates are missing
            qs = qs.none()
    elif filter_by in ["week", "1week", "2week", "3week"]:
        days = {
            "week": 7,
            "1week": 7,
            "2week": 14,
            "3week": 21,
        }
        start_date = today - timedelta(
            days=days[filter_by] - 1
        )
        qs = qs.filter(
            created_at__date__range=(start_date, today)
        )
    elif filter_by == "month":
        start_date = today - timedelta(days=29)
        qs = qs.filter(
            created_at__date__range=(start_date, today)
        )
    elif filter_by == "year":
        start_date = today - timedelta(days=364)
        qs = qs.filter(
            created_at__date__range=(start_date, today)
        )
    # Pagination
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

    today = timezone.localdate()

    # Default date range
    if filter_by == "custom":
        start_date = request.GET.get("start_date")
        end_date = request.GET.get("end_date")

        if not start_date or not end_date:
            return JsonResponse({
                "success": False,
                "message": "Please select both start and end dates."
            }, status=400)

        try:
            start_date = datetime.strptime(
                start_date, "%Y-%m-%d"
            ).date()

            end_date = datetime.strptime(
                end_date, "%Y-%m-%d"
            ).date()

            if start_date > end_date:
                start_date, end_date = end_date, start_date

        except (ValueError, TypeError):
            return JsonResponse({
                "success": False,
                "message": "Invalid date format."
            }, status=400)

        label = "Custom Date"

    elif filter_by == "month":
        start_date = today - timedelta(days=29)
        end_date = today
        label = "Last 30 days"

    elif filter_by == "year":
        start_date = today - timedelta(days=364)
        end_date = today
        label = "Last 1 year"

    elif filter_by in ["week", "1week", "2week", "3week"]:
        days = {
            "week": 7,
            "1week": 7,
            "2week": 14,
            "3week": 21,
        }
        selected_days = days[filter_by]

        start_date = today - timedelta(days=selected_days - 1)
        end_date = today
        label = f"Last {selected_days} days"

    else:
        start_date = today - timedelta(days=6)
        end_date = today
        label = "Last 7 days"

    # Transactions within selected date range
    qs = WalletTransaction.objects.filter(
        user=user,
        created_at__date__range=(
            start_date,
            end_date
        )
    )

    # Total credit
    credit_total = qs.filter(
        transaction_type__iexact="CREDIT"
    ).aggregate(
        total=Sum("amount")
    )["total"] or 0

    # Total debit
    debit_total = qs.filter(
        transaction_type__iexact="DEBIT"
    ).aggregate(
        total=Sum("amount")
    )["total"] or 0
    
    # Current balance: latest transaction across all dates
    latest_tx = WalletTransaction.objects.filter(
        user=user
    ).order_by("-created_at", "-pk").first()

    current_balance = (
        latest_tx.current_balance
        if latest_tx else 0
    )

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
        id=advance_id,
        user=user,
    )

    # ── Resolve the "Received From" profile for the logged-in user ──
    # Hospitals / pharmacies / labs / doctors store their details in a
    # user-type specific profile.  Fall back to UserProfile for the rest.
    customer_name = ""
    customer_email = advance.user.email or ""
    customer_address = ""

    if user.user_type == "hospital":
        hp = HospitalProfile.objects.filter(user=user).first()
        if hp:
            customer_name = (hp.hospital_name or "").strip()
            customer_address = (hp.address or "").strip()
            if not customer_email:
                customer_email = hp.contact_no or ""
    elif user.user_type == "pharmacy":
        pp = PharmacyProfile.objects.filter(user=user).first()
        if pp:
            customer_name = (pp.company_name or "").strip()
            customer_address = getattr(pp, "address", "") or ""
    elif user.user_type == "doctor":
        dp = DoctorProfile.objects.filter(user=user).first()
        if dp:
            customer_name = (dp.clinic_name or "").strip()
            customer_address = getattr(dp, "full_address", "") or ""
    elif user.user_type == "lab":
        lp = LabProfile.objects.filter(user=user).first()
        if lp:
            customer_name = (lp.lab_name or "").strip()
            customer_address = getattr(lp, "address", "") or ""

    # Fallback to the shared user profile when no type-specific row exists
    if not customer_name:
        try:
            profile = advance.user.userprofile
        except Exception:
            profile = None
        if profile:
            customer_name = f"{profile.first_name or ''} {profile.last_name or ''}".strip()
            if not customer_address:
                customer_address = getattr(profile, "address", "") or ""

    response_data = {
        "receipt_no": f"ADV/{advance.created_at.year}/{advance.id:04d}",
        "payment_date": advance.created_at.strftime("%d-%b-%Y"),

        # platform info
        "platform_name": settings.COMPANY_NAME,
        "gstin": settings.COMPANY_GSTIN,
        "platform_address": settings.COMPANY_ADDRESS,
        "platform_contact": settings.COMPANY_CONTACT,

        # received from
        "customer_name": customer_name,
        "customer_email": customer_email,
        "customer_address": customer_address,

        # transaction
        "purpose": "Advance for services",
        "description": (
            f"{advance.transaction_type.title()} | {advance.order_id}"
            if advance.order_id
            else f"{advance.transaction_type.title()} advance"
        ),
        "amount": float(advance.amount),
        "gst_percent": 18,
        # WalletTransaction.amount is the amount actually received.  GST is
        # shown only as receipt information and must not inflate the total.
        "total_amount": float(advance.amount),
        "payment_mode": getattr(advance, "payment_mode", "") or "Wallet",
        "transaction_id": advance.tranx_id or "",

        "created_by": "Authorized Signatory",
    }

    return JsonResponse(response_data)

@require_GET
@dashboard_login_required
def pharmacy_order_details(request, order_id):
    user = request.user_obj
    if user.user_type != "pharmacy":
        return JsonResponse({"error": "Pharmacy access required."}, status=403)

    pharmacy_profile = PharmacyProfile.objects.filter(user=user).first()
    if not pharmacy_profile:
        return JsonResponse({"error": "Pharmacy profile not found."}, status=404)

    order_scope = Q(assigned_pharmacy=pharmacy_profile) | Q(
        assigned_pharmacy__isnull=True,
        order_status=OrderStatusChoices.PENDING,
    )

    order = (
        UserPurchase.objects
        .filter(order_scope, id=order_id)
        .values(
            "id",
            "final_amount",
            "total_amount",
            "order_status",
            "created_at",

            "user__phone_number",

            "user__userprofile__first_name",
            "user__userprofile__last_name",
            "user__userprofile__age",
            "user__userprofile__gender",
            "user__userprofile__profile_photo_path",

            "address__first_name",
            "address__last_name",
            "address__phone_number",
            "address__address",
            "address__pincode",
            "address__country",
            "address__city__name",
            "address__state__name",
            "delivery_type",
            "payment_method",
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

    cust_name = (
        f"{order.get('user__userprofile__first_name') or ''} "
        f"{order.get('user__userprofile__last_name') or ''}"
    ).strip()
    if not cust_name:
        cust_name = f"{order.get('address__first_name') or ''} {order.get('address__last_name') or ''}".strip()
    if not cust_name:
        cust_name = f"Customer #{order['id']}"

    total_val = order.get("final_amount") if order.get("final_amount") is not None else order.get("total_amount")

    dt = order.get("delivery_type") or "Home Delivery"
    delivery_label = "Store Pickup" if "pickup" in str(dt).lower() else "Home Delivery"
    payment_mode = order.get("payment_method") or ("UPI Paid" if order["order_status"] == "delivered" else "Pending")

    created_at_val = order.get("created_at")
    if created_at_val:
        try:
            local_dt = pharmacy_order_local_time(created_at_val)
            created_str = local_dt.strftime("%d/%m/%Y, %I:%M %p")
        except Exception:
            created_str = str(created_at_val)[:19]
    else:
        created_str = "N/A" 

    phone_num = order.get("user__phone_number") or order.get("address__phone_number") or "N/A"

    return JsonResponse({
        "id": order["id"],
        "status": order["order_status"],
        "order_status": order["order_status"],
        "phone": phone_num,
        "patient_name": cust_name,
        "customer_name": cust_name,
        "customer": {
            "name": cust_name,
            "phone": phone_num,
        },
        "delivery_type": delivery_label,
        "payment_status": "Paid" if order["order_status"] == "delivered" else ("Cash on Delivery" if "cod" in str(payment_mode).lower() else "Pending"),
        "created_at": created_str,

        "age": order.get("user__userprofile__age") or "-",
        "gender": order.get("user__userprofile__gender") or "-",

        "profile_photo": order.get("user__userprofile__profile_photo_path"),

        "address": {
            "address": order.get("address__address") or "",
            "city": order.get("address__city__name") or "",
            "state": order.get("address__state__name") or "",
            "country": order.get("address__country") or "",
            "pincode": order.get("address__pincode") or "",
            "landmark": "",
        },

        "total": float(total_val or 0),

        "medicines": [
            {
                "name": m["product_name"] or "Medicine",
                "qty": m["quantity"] or 1,
                "price": float(m["price"] or 0),
                "mrp": float(m["mrp"]) if m["mrp"] else float(m["price"] or 0) * 1.2,
                "requires_prescription": m["requires_prescription"],
            }
            for m in medicines
        ],
    })


@require_POST
@dashboard_login_required
def pharmacy_submit_bid(request):
    user = request.user_obj
    if user.user_type != "pharmacy":
        return JsonResponse({"success": False, "message": "Only pharmacies can place bids."}, status=403)

    pharmacy_profile = PharmacyProfile.objects.filter(user=user).first()
    if not pharmacy_profile:
        return JsonResponse({"success": False, "message": "Pharmacy profile not found."}, status=404)

    order_id = request.POST.get("order_id")
    if not order_id:
        return JsonResponse({"success": False, "message": "Order ID is required."}, status=400)

    try:
        order_id = int(order_id)
    except (ValueError, TypeError):
        return JsonResponse({"success": False, "message": "Invalid Order ID."}, status=400)

    raw_bid_amount = request.POST.get("bid_amount", "").strip()
    raw_delivery_time = request.POST.get("delivery_time", "").strip()
    remarks = request.POST.get("remarks", "").strip() or None

    if not raw_bid_amount:
        return JsonResponse({"success": False, "message": "Bid amount is required."}, status=400)

    try:
        bid_amount = Decimal(raw_bid_amount)
        if bid_amount <= Decimal("0.00"):
            raise ValueError()
    except Exception:
        return JsonResponse({"success": False, "message": "Please enter a valid bid amount greater than 0."}, status=400)

    if not raw_delivery_time:
        return JsonResponse({"success": False, "message": "Delivery time is required."}, status=400)

    try:
        delivery_time = int(raw_delivery_time)
        if delivery_time <= 0:
            raise ValueError()
    except Exception:
        return JsonResponse({"success": False, "message": "Please enter a valid delivery time in minutes."}, status=400)

    order = (
        UserPurchase.objects
        .defer("prescriptions", "doctor_name", "patient_name")
        .filter(id=order_id)
        .first()
    )
    if not order:
        return JsonResponse({"success": False, "message": "Order not found."}, status=404)

    if order.order_status != OrderStatusChoices.PENDING:
        return JsonResponse({"success": False, "message": f"Cannot bid on order with status '{order.order_status}'."}, status=400)

    if order.assigned_pharmacy and order.assigned_pharmacy != pharmacy_profile:
        return JsonResponse({"success": False, "message": "This order is already assigned to another pharmacy."}, status=400)

    existing_bid = PharmacyBidding.objects.filter(
        order=order,
        pharmacy=pharmacy_profile,
        is_active=True,
    ).first()
    if existing_bid:
        return JsonResponse({
            "success": False,
            "message": "You have already submitted a bid for this order.",
            "is_duplicate": True,
        }, status=400)

    bid_gst = (bid_amount * Decimal("0.18")).quantize(Decimal("0.01"))
    total_amount = (bid_amount + bid_gst).quantize(Decimal("0.01"))

    with transaction.atomic():
        bid = PharmacyBidding.objects.create(
            order=order,
            pharmacy=pharmacy_profile,
            bid_amount=bid_amount,
            bid_gst=bid_gst,
            total_amount=total_amount,
            delivery_time=delivery_time,
            remarks=remarks,
            bid_status=PharmacyBidStatus.PENDING,
            is_active=True,
        )

    active_bids_count = PharmacyBidding.objects.filter(
        pharmacy=pharmacy_profile,
        bid_status__in=[PharmacyBidStatus.PENDING, PharmacyBidStatus.ACCEPTED],
        is_active=True,
    ).count()

    return JsonResponse({
        "success": True,
        "message": "Bid submitted successfully!",
        "bid": {
            "id": bid.id,
            "order_id": order.id,
            "bid_amount": str(bid.bid_amount),
            "bid_gst": str(bid.bid_gst),
            "total_amount": str(bid.total_amount),
            "delivery_time": bid.delivery_time,
        },
        "active_bids_count": active_bids_count,
    })
