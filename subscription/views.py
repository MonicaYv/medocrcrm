from decimal import Decimal
from django.db import models
from datetime import timedelta
from django.utils import timezone
from django.shortcuts import render
from django.http import JsonResponse
from django.conf import settings
from registration.models import ContactPerson
from django.views.decorators.http import require_POST
from points.models import PointsActionType, PointsHistory
from dashboard.utils import dashboard_login_required, get_common_context
from subscription.models import SubscriptionPlan, Feature, SubscriptionHistory

# @dashboard_login_required
# def subscription_view(request):
#     user = request.user_obj
#     context = get_common_context(request, user)
    
#     plans = SubscriptionPlan.objects.filter(is_active=True).order_by("display_order").prefetch_related(
#         models.Prefetch('features', queryset=Feature.objects.order_by('order'))
#     )
#     billing_options_map = {
#     "Standard Plan": ["Monthly", "Quarterly (10% Disc)", "Yearly (20% Disc)"],
#     "Premium Plan": ["Monthly", "Quarterly (10% Disc)", "Yearly (20% Disc)"],
#     "Enterprise Plan": [], 
#     "Basic": []
#     }   
#     for plan in plans:
#         plan.billing_options = billing_options_map.get(plan.name, [])
#     context['plans'] = plans

#     latest_sub = SubscriptionHistory.objects.filter(user=user).order_by("-activation_date").first()
#     if latest_sub:
#         latest_sub.save() 

#     if latest_sub and latest_sub.is_active:
#         context['current_plan'] = latest_sub.plan.name
#         context['status'] = "Active"
#         context['expiry_date'] = latest_sub.expiry_date
#     else:
#         context['current_plan'] = "Free Plan"
#         context['status'] = "Please Upgrade the plan"
#         context['expiry_date'] = None

#     return render(request, 'subscription.html', context)



@dashboard_login_required
def subscription_view(request):
    user = request.user_obj
    context = get_common_context(request, user)

    plans = SubscriptionPlan.objects.filter(
        is_active=True
    ).order_by("display_order").prefetch_related(
        models.Prefetch(
            'features',
            queryset=Feature.objects.order_by('order')
        )
    )

    billing_options_map = {
        "Standard Plan": ["Monthly", "Quarterly (10% Disc)", "Yearly (20% Disc)"],
        "Premium Plan": ["Monthly", "Quarterly (10% Disc)", "Yearly (20% Disc)"],
        "Enterprise Plan": [],
        "Basic": []
    }

    for plan in plans:
        plan.billing_options = billing_options_map.get(plan.name, [])

    context['plans'] = plans

    # Get latest subscription
    latest_sub = SubscriptionHistory.objects.filter(
        user=user
    ).order_by("-activation_date").first()

    if latest_sub:
        now = timezone.now()

        # Check subscription expiry
        if latest_sub.expiry_date <= now:

            latest_sub.status = "expired"
            latest_sub.save(update_fields=["status", "updated_at"])

            context['status'] = "Expired"
            context['days_left'] = None

        else:
            latest_sub.status = "active"
            latest_sub.save(update_fields=["status", "updated_at"])

            days_left = (
                latest_sub.expiry_date.date() - timezone.localdate()
            ).days

            context['status'] = "Active"
            context['days_left'] = days_left

        context['current_plan'] = latest_sub.plan.name
        context['expiry_date'] = latest_sub.expiry_date

    else:
        context['current_plan'] = "Free Plan"
        context['status'] = "Please Upgrade the plan"
        context['expiry_date'] = None
        context['days_left'] = None

    return render(request, 'subscription.html', context)




def calculate_price(request):
    plan_id = request.GET.get("plan_id")
    billing_option = request.GET.get("billing_option")

    try:
        plan = SubscriptionPlan.objects.get(id=plan_id, is_active=True)
    except SubscriptionPlan.DoesNotExist:
        return JsonResponse({"error": "Invalid plan"}, status=400)
    
    base_price = Decimal(plan.price)
    discount = Decimal(0)
    months = 1
    if "Quarterly" in billing_option:
        discount = Decimal("0.10")   
        months = 4
    elif "Yearly" in billing_option:
        discount = Decimal("0.20")   
        months = 12
    discounted_price = base_price * months * (1 - discount)
    gst_rate = Decimal("0.18")
    gst_amount = discounted_price * gst_rate
    gross_amount = discounted_price + gst_amount
    net_payable = gross_amount.quantize(Decimal("0.00"))
    start_date = timezone.now().date()
    end_date = start_date + timedelta(days=30*months)

    return JsonResponse({
        "plan_name": plan.name,
        "billing_option": billing_option,
        "start_date": start_date.strftime("%d/%m/%Y"),
        "end_date": end_date.strftime("%d/%m/%Y"),
        "total_before_gst": f"₹{discounted_price:,.2f}",
        "gst_amount": f"₹{gst_amount:,.2f}",
        "gross_amount": f"₹{gross_amount:,.2f}",
        "net_payable": f"₹{net_payable:,.2f}"
    })






@dashboard_login_required
def subscribe_plan(request):
    if request.method != "POST":
        return JsonResponse({"error": "Invalid method"}, status=405)

    user = request.user_obj
    plan_id = request.POST.get("plan_id")
    billing_option = request.POST.get("billing_option")

    try:
        plan = SubscriptionPlan.objects.get(id=plan_id, is_active=True)
    except SubscriptionPlan.DoesNotExist:
        return JsonResponse({"error": "Invalid plan"}, status=400)

    active_sub = SubscriptionHistory.objects.filter(
        user=user, status="active"
    ).first()

    if active_sub:
        if str(active_sub.plan_id) == str(plan_id):
            return JsonResponse({"error": "You already have this plan active."}, status=400)
        else:
            active_sub.status = "expired"
            active_sub.save(update_fields=["status", "updated_at"])

    base_price = Decimal(plan.price)
    discount_percent = Decimal("0.00")
    months = 1

    if "Quarterly" in billing_option:
        discount_percent = Decimal("10.00")
        months = 4
    elif "Yearly" in billing_option:
        discount_percent = Decimal("20.00")
        months = 12

    discounted_price = base_price * months * (1 - discount_percent / 100)
    gst_rate = Decimal("0.18")
    gst_amount = discounted_price * gst_rate
    gross_amount = discounted_price + gst_amount
    net_payable = gross_amount.quantize(Decimal("0.00"))
    start_date = timezone.now()
    end_date = start_date + timedelta(days=30 * months)
    license_count = 1
    if int(plan_id) == 2:
        license_count = 3
    elif int(plan_id) == 3:
        license_count = 10

    subscription = SubscriptionHistory.objects.create(
        user=user,
        plan=plan,
        activation_date=start_date,
        expiry_date=end_date,
        status="active",
        license_count=license_count,
        billing_cycle=billing_option,
        base_price=base_price,
        discount_percent=discount_percent,
        gst_amount=gst_amount,
        gross_amount=gross_amount,
        net_payable=net_payable,
    )
    try:
        action_type_obj = PointsActionType.objects.get(action_type='Subscription')
        PointsHistory.objects.create(
            user=user,
            action_type=action_type_obj,
            points=action_type_obj.default_points
        )
    except PointsActionType.DoesNotExist:
        print("PointsActionType for 'Subscription' does not exist. No points awarded.")

    company_name = getattr(getattr(user, 'clientprofile', None), 'company_name', "N/A")

    return JsonResponse({
        "success": True,
        "message": "Subscription activated!",
        "company_name": company_name,
        "amount": f"₹{net_payable}",
        "history_id": subscription.id
    })

@dashboard_login_required
def subscription_history(request):
    user = request.user_obj
    history = SubscriptionHistory.objects.filter(user=user).order_by("-created_at")
    data = []
    for h in history:
        data.append({
            "id": h.id,  
            "payment_date": h.created_at.strftime("%d/%m/%y, %H:%M"),
            "plan_name": h.plan.name,
            "package_type": h.billing_cycle,
            "start_date": h.activation_date.strftime("%d/%m/%Y"),
            "end_date": h.expiry_date.strftime("%d/%m/%Y"),
            "licenses": h.license_count,
            "amount": f"₹{h.net_payable}",
            "saved": h.saved
        })
    return JsonResponse({"history": data})

# @dashboard_login_required
# def current_subscription_summary(request):
#     user = request.user_obj
#     current = SubscriptionHistory.objects.filter(
#         user=user, status="active"
#     ).order_by("-activation_date").first()

#     if current:
#         days_left = (current.expiry_date.date() - timezone.now().date()).days

#         data = {
#             "status": current.status.capitalize(),
#             "plan_name": current.plan.name,
#             "license_count": current.license_count,
#             "payment_date": current.created_at.strftime("%d/%m/%y, %H:%M"),
#             "start_date": current.activation_date.strftime("%d/%m/%Y"),
#             "end_date": current.expiry_date.strftime("%d/%m/%Y"),
#             "days_left": days_left,
#             "package_type": f"{current.billing_cycle} ({current.discount_percent}% Disc.)"
#             if current.discount_percent > 0
#             else current.billing_cycle,
#             "amount": f"₹{current.net_payable}",
#         }
#     else:
#         last_plan = (
#             SubscriptionHistory.objects.filter(user=user, expiry_date__lt=timezone.now())
#             .order_by("-expiry_date")
#             .first()
#         )

#         start_date = None
#         if last_plan:
#             start_date = (last_plan.expiry_date + timedelta(days=1)).strftime("%d/%m/%Y")
#         data = {
#             "status": "Active",
#             "plan_name": "Basic (Free)",
#             "license_count": 1,
#             "payment_date": "NA",
#             "start_date": start_date or "NA",
#             "end_date": "NA",
#             "days_left": "NA",
#             "package_type": "NA",
#             "amount": "Free",
#         }
#     return JsonResponse({"summary": data})




@dashboard_login_required
def current_subscription_summary(request):
    user = request.user_obj

    current = SubscriptionHistory.objects.filter(
        user=user
    ).order_by("-activation_date").first()

    if current:
        today = timezone.localdate()
        days_left = (current.expiry_date.date() - today).days

        if days_left <= 0:
            subscription_status = "Expired"
            days_left_display = "Expired"
        else:
            subscription_status = "Active"
            days_left_display = days_left

        data = {
            "status": subscription_status,
            "plan_name": current.plan.name,
            "license_count": current.license_count,
            "payment_date": current.created_at.strftime("%d/%m/%y, %H:%M"),
            "start_date": current.activation_date.strftime("%d/%m/%Y"),
            "end_date": current.expiry_date.strftime("%d/%m/%Y"),
            "days_left": days_left_display,
            "package_type": (
                f"{current.billing_cycle} ({current.discount_percent}% Disc.)"
                if current.discount_percent > 0
                else current.billing_cycle
            ),
            "amount": f"₹{current.net_payable}",
        }

    else:
        data = {
            "status": "Active",
            "plan_name": "Basic (Free)",
            "license_count": 1,
            "payment_date": "NA",
            "start_date": "NA",
            "end_date": "NA",
            "days_left": "NA",
            "package_type": "NA",
            "amount": "Free",
        }

    return JsonResponse({"summary": data})


@dashboard_login_required
def subscription_invoice(request, history_id):
    user = request.user_obj
    try:
        history = SubscriptionHistory.objects.get(id=history_id, user=user)
    except SubscriptionHistory.DoesNotExist:
        return JsonResponse({"error": "Invoice not found"}, status=404)

    try:
        contact_person = ContactPerson.objects.filter(profile_type="client", profile=user.id).first()
    except ContactPerson.DoesNotExist:
        contact_person = None

    client_profile = getattr(user, "clientprofile", None)
    features = list(
        history.plan.features.order_by("order").values("text", "is_included")
    )

    return JsonResponse({
        "invoice_no": f"INV/SUB/{history.created_at.year}/{history.id:04d}",
        "invoice_date": history.created_at.strftime("%d-%B-%Y"),

        "plan_name": history.plan.name,
        "package_type": history.billing_cycle,
        "licenses": history.license_count,
        "features": features,  

        "base_price": str(history.base_price),
        "discount_percent": str(history.discount_percent),
        "gst_amount": str(history.gst_amount),
        "gross_amount": str(history.gross_amount),
        "net_payable": str(history.net_payable),

        "supplier": {
            "name": settings.COMPANY_NAME,
            "gstin": settings.COMPANY_GSTIN,
            "address": settings.COMPANY_ADDRESS,
            "contact": settings.COMPANY_CONTACT,
            "email": settings.COMPANY_EMAIL
        },

        "client": {
            "company_name": getattr(client_profile, "company_name", "N/A"),
            "gstin": getattr(client_profile, "gst_number", "N/A"),
            "address": getattr(client_profile, "address", "N/A"),
            "contact_person": contact_person.name if contact_person else "N/A",
            "email": getattr(user, "email", "N/A"),
        },

        "txn_id": history.txn_id if hasattr(history, "txn_id") else "N/A",
    })

@dashboard_login_required
@require_POST
def toggle_subscription_bookmark(request, history_id):
    user = request.user_obj
    try:
        history = SubscriptionHistory.objects.get(id=history_id, user=user)
        history.saved = not history.saved
        history.save(update_fields=["saved"])
        return JsonResponse({"success": True, "saved": history.saved})
    except SubscriptionHistory.DoesNotExist:
        return JsonResponse({"error": "Subscription not found"}, status=404)
