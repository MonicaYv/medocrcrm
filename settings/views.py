from django.shortcuts import render, redirect
from .utils import dashboard_login_required
from registration.models import UserProfile, AdvertiserProfile, ClientProfile, NGOProfile, MedicalProviderProfile,  ContactPerson

@dashboard_login_required
def settings_page(request):
    user = request.user_obj
    context = {
        'email': user.email,
        'country_code': user.phone_country_code or '+91',
        'phone_no': user.phone_number or '',
        'user_type': user.user_type,
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
                'website_url': profile.website_url,
                'address': profile.address,
                'city': profile.city,
                'state': profile.state,
                'country': profile.country,
                'pincode': profile.pincode,
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

