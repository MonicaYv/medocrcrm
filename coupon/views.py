import os
from pathlib import Path
from django.shortcuts import render
from django.urls import reverse
from django.http import JsonResponse
from django.contrib import messages
from django.conf import settings
from django.core.files.storage import default_storage
from datetime import datetime, timedelta, date
from django.utils import timezone
from django.core.paginator import Paginator
from django.template.loader import render_to_string
from django.db.models import Q
from django.views.decorators.http import require_GET, require_http_methods, require_POST
from dashboard.utils import dashboard_login_required, get_common_context
from .models import (
    Coupon, CategoryOption, BrandOption, OfferTypeOption, CountryOption,
    State, City, PincodeOption, AgeOption, GenderOption, SpendingPowerOption, PaymentStatusEnum
)
from points.models import PointsActionType, PointsHistory
from registration.models import PharmacyProfile, LabProfile, HospitalProfile, DoctorProfile
from coupon.models import SellerCoupon


BASE_DIR = Path(__file__).resolve().parent.parent
COUPON_ALLOWED_EXTENSIONS = {'.jpg', '.jpeg', '.png', '.mp4'}
COUPON_MAX_FILE_SIZE = 10 * 1024 * 1024


def build_media_url(path):
    if not path:
        return ""

    path = str(path).replace("\\", "/").strip()
    if path.startswith(("http://", "https://", "/")):
        return path

    return f"{settings.MEDIA_URL.rstrip('/')}/{path.lstrip('/')}"


def validate_and_save_coupon_file(file_obj):
    if not file_obj:
        return '', 'Coupon file is required.'

    ext = os.path.splitext(file_obj.name)[1].lower()
    if ext not in COUPON_ALLOWED_EXTENSIONS:
        return '', 'Coupon file must be a JPG, PNG, or MP4 file.'

    if file_obj.size > COUPON_MAX_FILE_SIZE:
        return '', 'Coupon file must be under 10MB.'

    upload_dir = os.path.join('advertiser_docs', 'coupon_images')
    os.makedirs(os.path.join(settings.MEDIA_ROOT, upload_dir), exist_ok=True)
    filename = default_storage.save(os.path.join(upload_dir, file_obj.name), file_obj)
    return filename, None

def get_seller_profile(user):
    profile_map = {
        "pharmacy": PharmacyProfile,
        "lab": LabProfile,
        "hospital": HospitalProfile,
        "doctor": DoctorProfile,
    }
    model = profile_map.get(user.user_type)
    if not model:
        return None
    return model.objects.filter(user=user).first()

@require_POST
@dashboard_login_required
def create_seller_coupon(request):
    user = request.user_obj
    profile = get_seller_profile(user)

    if not profile:
        return JsonResponse({"success": False, "error": "Seller profile not found"}, status=400)

    data = request.POST
    errors = {}

    # ---- Extract fields ----
    coupon_name = data.get("coupon_name", "").strip()
    coupon_code = data.get("coupon_code", "").strip()
    discount_type = data.get("discount_type", "percentage")
    discount_value = data.get("discount_value", "").strip()
    expiry_date = data.get("expiry_date", "").strip()
    usage_limit = data.get("usage_limit", "").strip()

    # ---- Validation ----
    if not coupon_name:
        errors["coupon_name"] = "Coupon name is required"

    if not coupon_code:
        errors["coupon_code"] = "Coupon code is required"

    if SellerCoupon.objects.filter(coupon_code=coupon_code).exists():
        errors["coupon_code"] = "Coupon code already exists"

    try:
        discount_value = float(discount_value)
        if discount_value <= 0:
            raise ValueError
    except Exception:
        errors["discount_value"] = "Invalid discount value"

    try:
        usage_limit = int(usage_limit)
        if usage_limit <= 0:
            raise ValueError
    except Exception:
        errors["usage_limit"] = "Invalid usage limit"

    if not expiry_date:
        errors["expiry_date"] = "Expiry date is required"
    else:
        try:
            expiry_date = datetime.strptime(expiry_date, "%d/%m/%Y").date()
            if expiry_date < timezone.now().date():
                errors["expiry_date"] = "Expiry date cannot be in the past"
        except ValueError:
            errors["expiry_date"] = "Invalid expiry date format"

    if errors:
        return JsonResponse({"success": False, "errors": errors}, status=400)

    # ---- Save Coupon ----
    SellerCoupon.objects.create(
        seller_type=user.user_type,
        seller_id=profile.id,
        coupon_name=coupon_name,
        coupon_code=coupon_code,
        discount_type=discount_type,
        discount_value=discount_value,
        expiry_date=expiry_date,
        usage_limit=usage_limit,
    )

    return JsonResponse({"success": True, "message": "Coupon created successfully"})

# seller coupon history
# @require_GET
# @dashboard_login_required
# def get_created_coupons(request):
#     user = request.user_obj
#     profile = get_seller_profile(user)

#     if not profile:
#         return JsonResponse({"success": False, "html": "<p>No profile found</p>"})

#     coupons = SellerCoupon.objects.filter(
#         seller_type=user.user_type,
#         seller_id=profile.id
#     ).order_by("-created_at")

#     html = render_to_string(
#         "partials/ajax_created_coupon_list.html",
#         {"created_coupons": coupons},
#         request=request
#     )

#     return JsonResponse({"success": True, "html": html})

@require_GET
@dashboard_login_required
def get_created_coupons(request):
    user = request.user_obj
    profile = get_seller_profile(user)

    page = int(request.GET.get("page", 1))
    per_page = 3   # change if you want more per page

    coupons_qs = SellerCoupon.objects.filter(
        seller_type=user.user_type,
        seller_id=profile.id
    ).order_by("-created_at")

    paginator = Paginator(coupons_qs, per_page)
    coupons = paginator.get_page(page)

    html = render_to_string(
        "partials/ajax_created_coupon_list.html",
        {"created_coupons": coupons},
        request=request
    )

    return JsonResponse({
        "success": True,
        "html": html,
        "current_page": coupons.number,
        "total_pages": paginator.num_pages
    })


@dashboard_login_required
def coupon_view(request):
    user = request.user_obj
    context = get_common_context(request, user)
    if user.user_type == "pharmacy":
        return render(request, "pharmacy/pharmacy_coupon.html", context)

    if request.method == 'POST':
        is_ajax = request.headers.get('X-Requested-With') == 'XMLHttpRequest'
        try:
            # Extract and clean base fields
            title = request.POST.get('title', '').strip()
            description = request.POST.get('description', '').strip()
            code = request.POST.get('code', '').strip()
            country = CountryOption.objects.filter(id=request.POST.get('country')).first()
            max_redemptions = request.POST.get('max_redemptions', '').strip()
            validity = request.POST.get('validity', '').strip()
            image_file = request.FILES.get('coupon_image', None)

            # Payment fields
            displays_per_coupon = request.POST.get('displays_per_coupon', '').strip()
            rate_per_display = request.POST.get('rate_per_display', '').strip()
            payment_method = request.POST.get('payment-method', '').strip()
            final_paid_amount = request.POST.get('final_paid_amount', '').strip()
            gst_amount = request.POST.get('gst_amount', '').strip()

            # --- Handle dropdowns dynamically ---
            mappings = {
                "category": (CategoryOption, "Category"),
                "brand_name": (BrandOption, "Brand Name"),
                "state": (State, "State"),
                "city": (City, "City"),
                "pincode": (PincodeOption, "Pincode"),
                "age_group": (AgeOption, "Age Group"),
                "gender": (GenderOption, "Gender"),
                "spending_power": (SpendingPowerOption, "Spending Power"),
                "offer_type": (OfferTypeOption, "Offer Type"),
            }

            resolved_data = {}
            for field, (model, label) in mappings.items():
                value = request.POST.get(field, "").strip()
                if not value or value.lower() == "custom":
                    error_msg = f"Please type valid value for {label}."
                    if is_ajax:
                        return JsonResponse({"error": error_msg})
                    messages.error(request, error_msg)
                    return render(request, "coupon.html", get_context_data(user, request.POST, [label]))

                if value.isdigit():
                    obj = model.objects.filter(id=int(value)).first()
                    if not obj:
                        error_msg = f"Invalid {label} selected."
                        if is_ajax:
                            return JsonResponse({"error": error_msg})
                        messages.error(request, error_msg)
                        return render(request, "coupon.html", get_context_data(user, request.POST, [label]))
                else:
                    normalized_value = value.strip().lower()
                    obj = model.objects.filter(name__iexact=normalized_value).first()
                    if not obj:
                        obj = model.objects.create(name=value.strip().title())

                resolved_data[field] = obj
            # --- Validate image ---
            image_path = None
            if image_file:
                image_path, error = validate_and_save_coupon_file(image_file)
                if error:
                    if is_ajax:
                        return JsonResponse({'error': error, 'missing_fields': ['Image']})
                    messages.error(request, error)
                    return render(request, 'coupon.html', get_context_data(user, request.POST, ['Image']))

            # --- Validate numeric fields ---
            try:
                max_redemptions_int = int(max_redemptions) if max_redemptions else 0
                displays_per_coupon_int = int(displays_per_coupon) if displays_per_coupon else 0
                rate_per_display_float = float(rate_per_display) if rate_per_display else 0.0
                final_paid_amount_float = float(final_paid_amount) if final_paid_amount else 0.0
                gst_amount_float = float(gst_amount) if gst_amount else 0.0
            except (ValueError, TypeError):
                error_msg = "Invalid numeric values provided. Please check your inputs."
                if is_ajax:
                    return JsonResponse({"error": error_msg})
                messages.error(request, error_msg)
                return render(request, "coupon.html", get_context_data(user, request.POST, []))

            # --- Validate validity date ---
            try:
                validity_obj = datetime.strptime(validity, '%d/%m/%Y').date() if validity else None
                if validity_obj and validity_obj < datetime.now().date():
                    error_msg = "Validity date cannot be in the past."
                    if is_ajax:
                        return JsonResponse({"error": error_msg})
                    messages.error(request, error_msg)
                    return render(request, "coupon.html", get_context_data(user, request.POST, []))
            except ValueError:
                error_msg = "Invalid date format. Please use DD/MM/YYYY format."
                if is_ajax:
                    return JsonResponse({"error": error_msg})
                messages.error(request, error_msg)
                return render(request, "coupon.html", get_context_data(user, request.POST, []))

            # --- Required fields check ---
            required_fields = {
                "Title": title,
                "Description": description,
                "Code": code,
                "Country": country,
                "Max Redemptions": max_redemptions,
                "Validity": validity,
                "Image": image_file,
                "Displays per Coupon": displays_per_coupon,
                "Rate per Display": rate_per_display,
                "Payment Method": payment_method,
            }
            missing_fields = [name for name, value in required_fields.items() if not value]
            if missing_fields:
                if is_ajax:
                    return JsonResponse({"missing_fields": missing_fields})
                messages.error(request, f"Please fill all required fields: {', '.join(missing_fields)}")
                return render(request, "coupon.html", get_context_data(user, request.POST, missing_fields))

            # --- Duplicate coupon code check ---
            if Coupon.objects.filter(code=code, advertiser=user).exists():
                error_msg = "A coupon with this code already exists for your account."
                if is_ajax:
                    return JsonResponse({"error": error_msg})
                messages.error(request, error_msg)
                return render(request, "coupon.html", get_context_data(user, request.POST, []))

            # --- Save Coupon ---
            coupon = Coupon(
                advertiser=user,
                title=title,
                description=description,
                code=code,
                country=country,
                category=resolved_data["category"],
                brand_name=resolved_data["brand_name"],
                state=resolved_data["state"],
                city=resolved_data["city"],
                pincode=resolved_data["pincode"],
                age_group=resolved_data["age_group"],
                gender=resolved_data["gender"],
                spending_power=resolved_data["spending_power"],
                offer_type=resolved_data["offer_type"],
                max_redemptions=max_redemptions_int,
                validity=validity_obj,
                image=image_path,
                displays_per_coupon=displays_per_coupon_int,
                rate_per_display=rate_per_display_float,
                payment_method=payment_method.upper(),
                payment_status=PaymentStatusEnum.PENDING,
                payment_details="",
                final_paid_amount=final_paid_amount_float,
                gst_amount=gst_amount_float,
            )
            print(1234567890, coupon)
            coupon.save()

            # --- Award points ---
            try:
                action_type_obj = PointsActionType.objects.get(action_type="Coupon")
                PointsHistory.objects.create(
                    user=user,
                    action_type=action_type_obj,
                    points=action_type_obj.default_points,
                )
            except PointsActionType.DoesNotExist:
                print("PointsActionType for 'Coupon' does not exist. No points awarded.")

            if is_ajax:
                return JsonResponse({
                    "success": True,
                    "message": "Coupon created successfully!",
                    "redirect": f"{reverse('coupons')}?tab=history"
                })

            messages.success(request, "Coupon posted successfully!")

        except Exception as e:
            error_msg = f"An unexpected error occurred: {str(e)}"
            if is_ajax:
                return JsonResponse({"error": error_msg})
            messages.error(request, error_msg)
            return render(request, "coupon.html", get_context_data(user, request.POST, []))

    context.update(get_context_data(user))
    return render(request, "coupon.html", context)

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
def platform_bill(request, coupon_id):
    user = request.user_obj
    try:
        coupon = Coupon.objects.get(id=coupon_id, advertiser=user)
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

            ## Platform Company details
            'company': settings.COMPANY_NAME,
            'gstin': settings.COMPANY_GSTIN,
            'address': settings.COMPANY_ADDRESS,
            # 'phone': os.environ.get("PHONE", ""),
            # 'email': os.environ.get("EMAIL", ""),
            # 'website': os.environ.get("WEBSITE", ""),
        }
    except Exception as e:
        return JsonResponse({'error': 'Server error'}, status=500)
    return JsonResponse(data)

@dashboard_login_required
@require_http_methods(["GET", "POST"])
def get_coupon_history(request):
    user = request.user_obj

    # --- 1. Handle Save/Unsave action if it's a POST ---
    if request.method == "POST":
        coupon_id = request.POST.get('coupon_id')
        action = request.POST.get('action')  # 'save' or 'unsave'
        try:
            coupon = Coupon.objects.get(id=coupon_id, advertiser=user)
            coupon.saved = (action == 'save')
            coupon.save()
            return JsonResponse({'success': True, 'saved': coupon.saved})
        except Coupon.DoesNotExist:
            return JsonResponse({'success': False, 'error': 'Post not found'}, status=404)

    # --- 2. If not POST, continue with GET listing logic ---
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
        # Optional: handle custom start_date and end_date from request.GET
        start = request.GET.get('start_date')
        end = request.GET.get('end_date')
        try:
            start_date = datetime.strptime(start, "%Y-%m-%d")
            end_date = datetime.strptime(end, "%Y-%m-%d")
            filters &= Q(created_at__range=(start_date, end_date))
        except Exception:
            pass

    coupons = Coupon.objects.filter(filters).order_by('-created_at')
    paginator = Paginator(coupons, limit)
    page_obj = paginator.get_page(page)

    html = render_to_string("partials/coupon-history-table.html", {
        "coupon_history": page_obj.object_list,
        'today': date.today(),
    })

    return JsonResponse({
        "html": html,
        "current_page": page_obj.number,
        "total_pages": paginator.num_pages,
        "total_items": paginator.count,  # Add this
    })

@dashboard_login_required
@require_GET
def get_saved_coupon_history(request):
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
        # Optional: handle custom start_date and end_date from request.GET
        start = request.GET.get('start_date')
        end = request.GET.get('end_date')
        try:
            start_date = datetime.strptime(start, "%Y-%m-%d")
            end_date = datetime.strptime(end, "%Y-%m-%d")
            filters &= Q(created_at__range=(start_date, end_date))
        except Exception:
            pass  # Invalid format, ignore or handle as needed
    saved_coupons = Coupon.objects.filter(filters, saved=True).order_by('-created_at')
    paginator = Paginator(saved_coupons, limit)
    page_obj = paginator.get_page(page)

    html = render_to_string("partials/saved-coupon-history-table.html", {
        "saved_coupon_history": page_obj.object_list,
        'today': date.today(),
    })

    return JsonResponse({
        "html": html,
        "current_page": page_obj.number,
        "total_pages": paginator.num_pages,
    })

def get_context_data(user, form_data=None, missing_fields=None):
    """Helper function to get context data for the template"""
    context = {
        'category_options': CategoryOption.objects.filter(is_active=True),
        'brand_options': BrandOption.objects.filter(is_active=True),
        'offer_type_options': OfferTypeOption.objects.filter(is_active=True),
        'country_options': CountryOption.objects.filter(is_active=True),
        'state_options': State.objects.filter(is_active=True),
        'city_options': City.objects.filter(is_active=True),
        'pincode_options': PincodeOption.objects.filter(is_active=True),
        'age_options': AgeOption.objects.filter(is_active=True),
        'gender_options': GenderOption.objects.filter(is_active=True),
        'spending_power_options': SpendingPowerOption.objects.filter(is_active=True),
        'today': date.today(),
    }
    
    if form_data:
        context['form_data'] = form_data
    if missing_fields:
        context['missing_fields'] = missing_fields
        
    return context

@dashboard_login_required
@require_GET
def export_coupon_history(request):
    user = request.user_obj
    # date_range = request.GET.get('daterange', '').strip().lower()
    filters = Q(advertiser=user)
    coupons = Coupon.objects.filter(filters).order_by('-created_at')
    html = render_to_string("partials/export-history-table.html", {
        "coupon_history": coupons,
        'today': date.today(),
    })

    return JsonResponse({
        "html": html,
        "total_items": coupons.count(),  # Add this
    })

@dashboard_login_required
@require_GET
def export_saved_coupon_history(request):
    user = request.user_obj
    # date_range = request.GET.get('daterange', '').strip().lower()
    filters = Q(advertiser=user)
    saved_coupons = Coupon.objects.filter(filters, saved=True).order_by('-created_at')
    html = render_to_string("partials/export-saved-history-table.html", {
        "saved_coupon_history": saved_coupons,
        'today': date.today(),
    })

    return JsonResponse({
        "html": html,
        "total_items": saved_coupons.count(),  # Add this
    })
