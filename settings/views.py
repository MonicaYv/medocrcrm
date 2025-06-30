import re
import json
from django.http import JsonResponse
from django.shortcuts import render, redirect
from dashboard.utils import dashboard_login_required
from registration.models import UserProfile, AdvertiserProfile, ClientProfile, NGOProfile, MedicalProviderProfile,  ContactPerson
from django.views.decorators.http import require_POST
from django.core.validators import validate_email
from django.core.exceptions import ValidationError

@dashboard_login_required
def settings_page(request):
    user = request.user_obj
    context = {
        'email': user.email,
        'country_code': '+91',
        'phone_no': user.phone_number or '',
        'user_type': user.user_type,
        'created_at': user.created_at,
        'updated_at': user.updated_at,
        "inapp_notifications": user.inapp_notifications,
        "email_notifications": user.email_notifications,
        "push_notifications": user.push_notifications,
        "regulatory_alerts": user.regulatory_alerts,
        "promotions_and_offers": user.promotions_and_offers,
        "quite_mode": user.quite_mode,
        "quite_mode_start_time": user.quite_mode_start_time,
        "quite_mode_end_time": user.quite_mode_end_time,
    }
    try:
        user_profile = UserProfile.objects.get(user=user)
        context.update({
            'name': user_profile.name,
            'date_of_birth': user_profile.dob,
            'gender': user_profile.gender,
            'address': user_profile.address,
            'city': user_profile.city,
            'state': user_profile.state,
            'country': user_profile.country,
            'pincode': user_profile.pincode,
            'referral_code': user_profile.referral_code,
        })
    except UserProfile.DoesNotExist:
        pass
    
    profile_id = None

    # Load profile-type-specific data (optional)
    if user.user_type == 'advertiser':
        profile = AdvertiserProfile.objects.filter(user=user).first()
        profile_id = profile.id
        context.update({
                'company_name': profile.company_name,
                'advertiser_type': profile.advertiser_type,
                'ad_services_required': profile.ad_services_required,
                'website_url': profile.website_url,
                'brand_description': profile.brand_description,
                'brand_image_path': profile.brand_image_path,
            })
    elif user.user_type == 'client':
        profile = ClientProfile.objects.filter(user=user).first()
        profile_id = profile.id
        if profile:
            context.update({
                'company_name': profile.company_name,
                'company_type': profile.company_type,
                'services_interested': profile.services_interested,
                'website_url': profile.website_url,
            })
    elif user.user_type == 'ngo':
        profile = NGOProfile.objects.filter(user=user).first()
        profile_id = profile.id
        if profile:
            context.update({
                'ngo_name': profile.ngo_name,
                'ngo_services': profile.ngo_services,
                'all_services': ['Education', 'Healthcare', 'Poverty Relief', 'General AID'],
                'website_url': profile.website_url,
                'address': profile.address,
                'city': profile.city,
                'state': profile.state,
                'country': profile.country,
                'pincode': profile.pincode,
                'ngo_registration_number': profile.ngo_registration_number,
                'ngo_registration_doc_path': profile.ngo_registration_doc_path,
                'pan_number': profile.pan_number,
                'pan_doc_path': profile.pan_doc_path,
                'gst_number': profile.gst_number,
                'gst_doc_path': profile.gst_doc_path,
                'tan_number': profile.tan_number,
                'tan_doc_path': profile.tan_doc_path,
                'section8_number': profile.section8_number,
                'section8_doc_path': profile.section8_doc_path,
                'doc_12a_number': profile.doc_12a_number,
                'doc_12a_path': profile.doc_12a_path,
                'brand_description': profile.brand_description,
                'brand_image_path': profile.brand_image_path,
                'referral_code': profile.referral_code,
            })
    elif user.user_type == 'provider':
        profile = MedicalProviderProfile.objects.filter(user=user).first()
        profile_id = profile.id
        if profile:
            context.update({
                'company_name': profile.company_name,
                'provider_type': profile.provider_type,
                'services_offered': profile.services_offered,
                'website_url': profile.website_url,
                'storefront_image_path': profile.storefront_image_path,
            })
            
    if profile_id:
        contact_persons = ContactPerson.objects.filter(
            profile_type=user.user_type,
            profile_id=profile_id
        ).first()
        context.update({
            'contact_name': contact_persons.name,
            'contact_phone_country_code': contact_persons.phone_country_code,
            'contact_phone_number': contact_persons.phone_number,
            'contact_role': contact_persons.role,
        })
    
    print(f"Context for settings page: {context}")

    return render(request, 'settings/settings_page.html', context)

def logout_view(request):
    request.session.flush()  # clears all session data
    return redirect('/login/')

@require_POST
@dashboard_login_required
def update_notification_field(request):
    user = request.user_obj
    data = json.loads(request.body)
    field = data.get("field")
    value = data.get("value")
    if field in ["inapp_notifications", "email_notifications", "push_notifications", "regulatory_alerts", "promotions_and_offers", "quite_mode"]:
        setattr(user, field, value)
    elif field in ["quite_mode_start_time", "quite_mode_end_time"]:
        setattr(user, field, value if value else None)
    user.save()
    return JsonResponse({"status": "success"})

@require_POST
@dashboard_login_required
def update_ngo_profile(request):
    data = request.POST
    errors={}
    user = request.user_obj
    
    # --- Basic Validations ---
    email = data.get("email")
    if not email:
        errors["email"] = "Email is required."
    else:
        try:
            validate_email(email)
        except ValidationError:
            errors["email"] = "Enter a valid email address."
    phone_number = data.get("phone")
    if not phone_number or not re.match(r"^\d{8,15}$", phone_number):
        errors["phone"] = "Enter a valid phone number (8-15 digits)."

    ngo_services = request.POST.getlist("services")
    if not ngo_services:
        errors["services"] = "Select at least one NGO service."
        
    
    # Validate address fields
    for field in ["ngo_name","address", "city", "state", "pincode", "country", "contact_name", "contact_phone_number"]:
        if not data.get(field):
            errors[field] = f"{field.capitalize()} is required."
        
    # Update User model
    user.email = request.POST.get('email')
    user.phone_country_code = request.POST.get('countryCodes')
    user.phone_number = request.POST.get('phone')
    user.save()
    
    if errors:
        print(f"Validation errors: {errors}")
        return JsonResponse({"success": False, "errors": errors}, status=400)

    # Update NGOProfile
    ngo_profile = NGOProfile.objects.filter(user=user).first()
    if ngo_profile:
        ngo_profile.ngo_name = request.POST.get('ngo_name')
        ngo_profile.website_url = request.POST.get('website_url')
        ngo_profile.address = request.POST.get('address')
        ngo_profile.city = request.POST.get('city')
        ngo_profile.state = request.POST.get('state')
        ngo_profile.country = request.POST.get('country')
        ngo_profile.pincode = request.POST.get('pincode')
        ngo_profile.ngo_services = request.POST.getlist('services')
        ngo_profile.referral_code = request.POST.get('referral_code')
        ngo_profile.save()

    # Update ContactPerson (if exists)
    contact_person = ContactPerson.objects.filter(
        profile_type='ngo', profile_id=ngo_profile.id
    ).first()

    if contact_person:
        contact_person.name = request.POST.get('contact_name')
        contact_person.phone_country_code = request.POST.get('countryCodes')
        contact_person.phone_number = request.POST.get('contact_phone_number')
        contact_person.role = request.POST.get('contact_role')
        contact_person.save()

    return JsonResponse({"success": True, "message": "NGO profile updated successfully."})  # Redirect back to settings page after save
    
