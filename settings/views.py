import os
import re
import json
import traceback

from django.core.cache import cache
from django.utils import timezone
from asgiref.sync import async_to_sync
from registration.models import State, City, LabTiming
from registration.models import State, City
from registration.views import verify_otp_token, async_send_otp_email
from django.utils import timezone
from datetime import timedelta
from django.conf import settings
from django.http import JsonResponse
from django.shortcuts import render, redirect, get_object_or_404
from django.core.exceptions import ValidationError
from django.core.validators import validate_email
from django.db import transaction
from django.views.decorators.http import (
    require_POST,
    require_GET,
)
from django.contrib.auth.hashers import make_password, check_password
from dashboard.utils import (
    dashboard_login_required,
    get_common_context,
)
from settings.models import SellerSubscription
from registration.models import (
    User,
    NGOProfile,
    AdvertiserProfile,
    ClientProfile,
    PharmacyProfile,
    ContactPerson,
    LabProfile,
    DoctorProfile,
    HospitalProfile,
    DoctorEducation,
    DoctorSpeciality,
    DoctorExperience,
    PharmacyServices,
    PharmacyType,
    PharmacyTiming,
    LabService,
    LabFacility,
    LabTiming,
    AdServiceReq,
    AdvertiserType,
    ClientType,
    ClientService,
    NGOService,
)
from registration.views import (
    validate_and_save_file,
)
from support.models import (
    IssueType,
    IssueOption,
)
from maps.models import SearchHistory, SavedLocation
from coupon.models import Coupon
from donate.models import Donation
from ngopost.models import NGOPost

## Settings
def load_country_codes():
    json_path = os.path.join(settings.BASE_DIR, 'static', 'data', 'countryCodes.json')
    with open(json_path, 'r', encoding='utf-8') as f:
        return json.load(f)
    
def validate_email_phone(post_data, errors):
    email = post_data.get("email", "").strip()
    if not email:
        errors["email"] = "Email is required."
    else:
        try:
            validate_email(email)
        except ValidationError:
            errors["email"] = "Enter a valid email address."

    phone_number = post_data.get("phone", "").strip()
    if not re.match(r"^\d{10}$", phone_number):
        errors["phone"] = "Enter a valid 10-digit Indian mobile number."

@dashboard_login_required
def settings_page(request):
    user = request.user_obj
    user_type = user.user_type

    context = get_common_context(request, user)
    context.update(get_base_context(user))
    context["active_main_tab"] = request.GET.get("tab", "settings")
    
    issue_types = IssueType.objects.filter(
        user_types__contains=[user_type]
    )

    issue_options = IssueOption.objects.filter(
        issue_type__in=issue_types,
        user_types__contains=[user_type]
    ).select_related("issue_type")

    context.update({
        "issue_types": issue_types,
        "issue_options": issue_options,
    })


    user_type_handlers = {
        'ngo': handle_ngo_profile,
        'client': handle_client_profile,
        'advertiser': handle_advertiser_profile,
        'pharmacy': handle_pharmacy_profile,
        'lab': handle_lab_profile,
        'hospital': handle_hospital_profile,
        'doctor': handle_doctor_profile,
    }

    handler_func = user_type_handlers.get(user.user_type)
    if handler_func:
        context.update(handler_func(user))

    context['country_codes'] = load_country_codes()

    template_map = {
        "pharmacy": "settings/seller_settings.html",
        "lab": "settings/seller_settings.html",
        "hospital": "settings/seller_settings.html",
        "doctor": "settings/seller_settings.html",
    }

    template_name = template_map.get(
        user.user_type,
        "settings/settings_page.html"
    )

    return render(request, template_name, context)


def get_base_context(user):

    context = {
        
        'email': user.email,
        'country_code': user.phone_country_code,
        'phone_no': user.phone_number,
        'user_type': user.user_type,
        'created_at': user.created_at,
        'updated_at': user.updated_at,
        'inapp_notifications': user.inapp_notifications,
        'email_notifications': user.email_notifications,
        'push_notifications': user.push_notifications,
        'regulatory_alerts': user.regulatory_alerts,
        'promotions_and_offers': user.promotions_and_offers,
        'payment_notifications': user.payment_notifications,
        'location_notification': user.location_notification,
        'quite_mode': user.quite_mode,
        'quite_mode_start_time': user.quite_mode_start_time,
        'quite_mode_end_time': user.quite_mode_end_time,
        
        
    }
    return context

def handle_contact_person(profile_type, profile):
    contact = ContactPerson.objects.filter(profile_type=profile_type, profile=profile).first()
    return {
        'contact_name': contact.name if contact else '',
        'contact_phone_country_code': contact.phone_country_code if contact else '',
        'contact_phone_number': contact.phone_number if contact else '',
        'contact_role': contact.role if contact else ''
    }

def handle_advertiser_profile(user):
    profile = AdvertiserProfile.objects.filter(user=user).first()
    all_types = AdvertiserType.objects.filter(is_active=True)
    all_services = AdServiceReq.objects.filter(is_active=True)
    data = {
        'company_name': profile.company_name,
        'advertiser_type': profile.advertiser_type,
        'all_types': all_types,
        'services_interested': profile.ad_services_required,
        'all_services': all_services,
        'website_url': profile.website_url,
        'address': profile.address,
        'city': profile.city,
        'state': profile.state,
        'country': profile.country,
        'pincode': profile.pincode,
        'brand_description': profile.brand_description,
        'brand_image_path': os.path.basename(profile.brand_image_path),
        'referral_code': profile.referral_code,
        'incorporation_number': profile.incorporation_number,
        'incorporation_doc_path': os.path.basename(profile.incorporation_doc_path),
        'gst_number': profile.gst_number,
        'gst_doc_path': os.path.basename(profile.gst_doc_path),
        'pan_number': profile.pan_number,
        'pan_doc_path': os.path.basename(profile.pan_doc_path),
        'tan_number': profile.tan_number,
        'tan_doc_path': os.path.basename(profile.tan_doc_path),
    }
    data.update(handle_contact_person(user.user_type, user))
    return data

def handle_client_profile(user):
    profile = ClientProfile.objects.filter(user=user).first()
    all_types = ClientType.objects.filter(is_active=True)
    all_services = ClientService.objects.filter(is_active=True)

    data = {
        'company_name': profile.company_name,
        'company_type': profile.company_type,
        'all_types': all_types,
        'services_interested': profile.services_interested,
        'all_services': all_services,
        'website_url': profile.website_url,
        'address': profile.address,
        'city': profile.city,
        'state': profile.state,
        'country': profile.country,
        'pincode': profile.pincode,
        'referral_code': profile.referral_code,
        'incorporation_number': profile.incorporation_number,
        'incorporation_doc_path': os.path.basename(profile.incorporation_doc_path),
        'gst_number': profile.gst_number,
        'gst_doc_path': os.path.basename(profile.gst_doc_path),
        'pan_number': profile.pan_number,
        'pan_doc_path': os.path.basename(profile.pan_doc_path),
        'tan_number': profile.tan_number,
        'tan_doc_path': os.path.basename(profile.tan_doc_path),
    }
    data.update(handle_contact_person(user.user_type, user))
    return data

def handle_ngo_profile(user):
    profile = NGOProfile.objects.filter(user=user).first()
    all_services = NGOService.objects.filter(is_active=True)
    data = {
        'ngo_name': profile.ngo_name,
        'ngo_services': profile.ngo_services,
        'all_services': all_services,
        'website_url': profile.website_url,
        'address': profile.address,
        'city': profile.city,
        'state': profile.state,
        'country': profile.country,
        'pincode': profile.pincode,
        'ngo_registration_number': profile.ngo_registration_number,
        'ngo_registration_doc_path': os.path.basename(profile.ngo_registration_doc_path),
        'pan_number': profile.pan_number,
        'pan_doc_path': os.path.basename(profile.pan_doc_path),
        'gst_number': profile.gst_number,
        'gst_doc_path': os.path.basename(profile.gst_doc_path),
        'tan_number': profile.tan_number,
        'tan_doc_path': os.path.basename(profile.tan_doc_path),
        'section8_number': profile.section8_number,
        'section8_doc_path': os.path.basename(profile.section8_doc_path),
        'doc_12a_number': profile.doc_12a_number,
        'doc_12a_path': os.path.basename(profile.doc_12a_path),
        'brand_description': profile.brand_description,
        'brand_image_path': os.path.basename(profile.brand_image_path),
        'referral_code': profile.referral_code,
    }
    data.update(handle_contact_person(user.user_type, user))
    return data

def handle_pharmacy_profile(user):
    profile = PharmacyProfile.objects.filter(user=user).first()
    all_types = PharmacyType.objects.filter(is_active=True)
    all_services = PharmacyServices.objects.filter(is_active=True)
    all_workingdays = PharmacyTiming.objects.filter(is_active=True)
    data = {
        'company_name': profile.company_name,
        'pharmacy_types': profile.pharmacy_types.all(),
        'all_types': all_types,
        'services_offered': profile.services.all(),
        'all_services': all_services,
        'all_workingdays': all_workingdays,
        'website_url': profile.website,
        'country': profile.country,
        'working_days': profile.pharmacy_timing,
        'address': profile.address,
        # 'city': profile.city,
        # 'state': profile.state,
        'city': profile.city.name if profile.city else "",
        'state': profile.state.name if profile.state else "",
        'pincode': profile.pincode,
        'referral_code': profile.referral_code or '',
        'incorporation_number': profile.incorporation_number,
        'incorporation_doc_path': os.path.basename(profile.incorporation_doc_path) if profile.incorporation_doc_path else "",
        'gst_number': profile.gst_number,
        'gst_doc_path': os.path.basename(profile.gst_doc_path) if profile.gst_doc_path else "",
        'medical_license_number': profile.medical_license_number,
        'medical_license_doc_path': os.path.basename(profile.medical_license_doc_path) if profile.medical_license_doc_path else "",
        'pan_number': profile.pan_number,
        'pan_doc_path': os.path.basename(profile.pan_doc_path) if profile.pan_doc_path else "",
        'storefront_image_path': os.path.basename(profile.storefront_image_path) if profile.storefront_image_path else "",
        
        # Clean string extraction to guarantee the file name is captured perfectly
        'tan_number': profile.tan_number if profile.tan_number else "",
        'tan_doc_path': profile.tan_doc_path.split('/')[-1] if profile.tan_doc_path else "",
    }
    data.update(handle_contact_person(user.user_type, user))
    return data

def handle_lab_profile(user):
    profile = LabProfile.objects.filter(user=user).first()
    all_timings = LabTiming.objects.filter(is_active=True)
    all_services = LabService.objects.filter(is_active=True)
    all_facilities = LabFacility.objects.filter(is_active=True)

    data = {
        'lab_name' : profile.lab_name,
        'owner_name': profile.owner_name,
        'contact_number': profile.contact_number,
        'alt_contact_number': profile.alt_contact_number,
        'lab_registration_number': profile.lab_registration_number,
        'address': profile.address,
        # 'city': profile.city,
        # 'state': profile.state,
        # 'lab_timing': profile.lab_timing,
        'lab_timing': (
            f"{profile.lab_timing.open_time} - {profile.lab_timing.close_time}"
            if profile.lab_timing else ""
        ),
        'city': profile.city.name if profile.city else "",
        'state': profile.state.name if profile.state else "",
        'country': profile.country,
        'pincode': profile.pincode,
        'all_timings': all_timings,
        # 'lab_timing': profile.lab_timing,
        'services_selected': profile.services.all(),
        'all_services': all_services,
        'facilities_selected': profile.facilities.all(),
        'all_facilities': all_facilities,
        'lab_certificate_number': profile.lab_certificate_number,
        # 'lab_certificate_path': os.path.basename(profile.lab_certificate_path) if profile.lab_certificate_path else "",
        'lab_certificate_path': profile.lab_certificate_path if profile.lab_certificate_path else "",
        'identity_proof_aadhar_number': profile.identity_proof_aadhar_number,
        # 'identity_proof_aadhar_path': os.path.basename(profile.identity_proof_aadhar_path) if profile.identity_proof_aadhar_path else "",
        'identity_proof_aadhar_path': profile.identity_proof_aadhar_path if profile.identity_proof_aadhar_path else "",
        'identity_proof_pan_number': profile.identity_proof_pan_number,
        # 'identity_proof_pan_path': os.path.basename(profile.identity_proof_pan_path) if profile.identity_proof_pan_path else "",
        'identity_proof_pan_path': profile.identity_proof_pan_path if profile.identity_proof_pan_path else "",
        'gov_license_number': profile.gov_license_number,
        # 'gov_license_path': os.path.basename(profile.gov_license_path) if profile.gov_license_path else "",
        'gov_license_path': profile.gov_license_path if profile.gov_license_path else "",
        # 'lab_photo_path': os.path.basename(profile.lab_photo_path) if profile.lab_photo_path else "",
        # 'is_verified': profile.is_verified,
    
        'lab_photo_path': os.path.basename(profile.lab_photo_path) if profile.lab_photo_path else "",
        'is_verified': profile.is_verified,
        'verification_status': profile.verification_status,
        'rejection_reason': profile.rejection_reason,
        'verified_at': profile.verified_at,
        'referral_code': profile.referral_code or '',
    }
    return data

def handle_hospital_profile(user):
    profile = HospitalProfile.objects.filter(user=user).first()
    data = {
        'registration_certificate_path': profile.registration_certificate_path if profile.registration_certificate_path else "",

        'aadhar_doc_path': profile.aadhar_doc_path if profile.aadhar_doc_path else "",

        'pan_doc_path': profile.pan_doc_path if profile.pan_doc_path else "",

        'hospital_photo_path': profile.hospital_photo_path if profile.hospital_photo_path else "",
        'hospital_name' : profile.hospital_name,
        'owner_name': profile.owner_name,
        'contact_no': profile.contact_no,
        'alternate_contact_no': profile.alternate_contact_no,
        'address': profile.address,
        # 'country': profile.country,
        # 'city': profile.city,
        # 'state': profile.state,
        # 'pincode': profile.pincode,
        # 'hospital_timing': profile.hospital_timing,
        'country': profile.country or "",
        'city': profile.city.name if profile.city else "",
        'state': profile.state.name if profile.state else "",
        'pincode': profile.pincode or "",
        'hospital_timing': profile.hospital_timing,
        'home_visit': profile.home_visit,
        'registration_no': profile.registration_no,
        # 'registration_certificate_path': os.path.basename(profile.registration_certificate_path) if profile.registration_certificate_path else "",
       'registration_certificate_path': profile.registration_certificate_path if profile.registration_certificate_path else "",
        'aadhar_card_no': profile.aadhar_card_no,
        # 'aadhar_doc_path': os.path.basename(profile.aadhar_doc_path) if profile.aadhar_doc_path else "",
        'aadhar_doc_path': profile.aadhar_doc_path if profile.aadhar_doc_path else "",
        'pan_card_no': profile.pan_card_no,
        # 'pan_doc_path': os.path.basename(profile.pan_doc_path) if profile.pan_doc_path else "",
        'pan_doc_path': profile.pan_doc_path if profile.pan_doc_path else "",
        # 'hospital_logo_path': os.path.basename(profile.hospital_logo_path) if profile.hospital_logo_path else "",
        'hospital_logo_path': profile.hospital_logo_path if profile.hospital_logo_path else "",
        # 'hospital_photo_path': os.path.basename(profile.hospital_photo_path) if profile.hospital_photo_path else "",
        'hospital_photo_path': profile.hospital_photo_path if profile.hospital_photo_path else "",
        'phone_for_otp': profile.phone_for_otp,
        'is_verified': profile.is_verified,
        'verification_status': profile.verification_status,
        'rejection_reason': profile.rejection_reason,
        'verified_at': profile.verified_at,
        'referral_code': profile.referral_code or '',
    }
    return data

def handle_doctor_profile(user):
    profile = DoctorProfile.objects.filter(user=user).first()
    all_speciality = DoctorSpeciality.objects.filter(is_active=True)
    all_education = DoctorEducation.objects.filter(is_active=True)
    all_experience = DoctorExperience.objects.filter(is_active=True)
    data = {
        'full_name': profile.full_name,
        'gender': profile.gender,
        'age': profile.age,
        'specialty': profile.specialty,
        'all_speciality': all_speciality,
        'education': profile.education,
        'all_education': all_education,
        'experience': profile.experience,
        'all_experience': all_experience,
        'profile_photo_path': profile.profile_photo_path,
        'clinic_name': profile.clinic_name,
        'owner_name': profile.owner_name,
        'contact_number': profile.contact_number,
        'alt_contact_number': profile.alt_contact_number,
        'address': profile.full_address,
        # 'city': profile.city,
        # 'state': profile.state,
        'city': profile.city.name if profile.city else "",
        'state': profile.state.name if profile.state else "",
        'pincode': profile.pincode,
        'clinic_timing_from': profile.clinic_timing_from,
        'clinic_timing_to': profile.clinic_timing_to,
        'home_visit_available': profile.home_visit_available,
        'registration_number': profile.registration_number,
        'registration_certificate_path': os.path.basename(profile.registration_certificate_path) if profile.registration_certificate_path else "",
        'aadhar_number': profile.aadhar_number,
        'aadhar_doc_path': os.path.basename(profile.aadhar_doc_path) if profile.aadhar_doc_path else "",
        'pan_number': profile.pan_number,
        'pan_doc_path': os.path.basename(profile.pan_doc_path) if profile.pan_doc_path else "",
        'clinic_logo_path': os.path.basename(profile.clinic_logo_path) if profile.clinic_logo_path else "",
        'clinic_photo_path': os.path.basename(profile.clinic_photo_path) if profile.clinic_photo_path else "",
        'is_verified': profile.is_verified,
        'verification_status': profile.verification_status,
        'rejection_reason': profile.rejection_reason,
        'verified_at': profile.verified_at,
        'referral_code': profile.referral_code or '',
    }
    return data

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
    if field in ["inapp_notifications", "email_notifications", "push_notifications", "regulatory_alerts", "promotions_and_offers", "quite_mode", "payment_notifications", "location_notification"]:
        setattr(user, field, value)
    elif field in ["quite_mode_start_time", "quite_mode_end_time"]:
        setattr(user, field, value if value else None)
    user.save()
    return JsonResponse({"status": "success"})

# @dashboard_login_required
# @require_POST
# def update_user_document(request):
#     user = request.user_obj
#     user_type = user.user_type
#     doc_type = request.POST.get('doc_type')
#     file = request.FILES.get('document')

#     print(file)

#     if not doc_type or not file:
#         return JsonResponse({'success': False, 'error': 'Missing document or type.'}, status=400)

#     subdir_map = {
#         'hospital_license': 'registration',
#         'admin_identity_proof': 'aadhar',      
#         'pan_doc': 'pan',
#         'hospital_image': 'hospital_image',
#         'ngo_registration_doc': 'registration',
#         'lab_certificate': 'lab_certificate',
#         'identity_proof_aadhar': 'aadhar',
#         'identity_proof_pan': 'pan',
#         'gov_license': 'gov_license',
#         'lab_photo': 'lab_photo',
#         'incorporation_doc': 'incorporation',
#         'gst_doc': 'gst',
#         'pan_doc': 'pan',
#         'tan_doc': 'tan',
#         'section8_doc': 'section8',
#         'doc_12a': 'doc_12a',
#         'brand_image': 'brand_image',
#         'medical_license_doc': 'medical_license',
#         'storefront_image': 'store_front',
#         'clinic_registration': 'registration',
#         'aadhar_doc': 'aadhar',
#         'doctor_pan': 'pan',
#         'clinic_logo': 'clinic_logo',
#         'clinic_photo': 'clinic_photo',
#     }
        
#     upload_subdir = subdir_map.get(doc_type)
#     if not upload_subdir:
#         return JsonResponse({'success': False, 'error': 'Invalid document type.'}, status=400)

#     file_path, error = validate_and_save_file(file, upload_subdir, doc_type.replace('_', ' ').title(), user_type=user_type)
#     if error:
#         return JsonResponse({'success': False, 'error': error}, status=400)

#     # profile_model = {
#     #     'ngo': NGOProfile,
#     #     'advertiser': AdvertiserProfile,
#     #     'client': ClientProfile,
#     #     'pharmacy': PharmacyProfile,
#     # }.get(user_type)
    

#     profile_model = {
#         'ngo': NGOProfile,
#         'advertiser': AdvertiserProfile,
#         'client': ClientProfile,
#         'pharmacy': PharmacyProfile,
#         'lab': LabProfile,
#         'hospital': HospitalProfile,
#         'doctor': DoctorProfile,
#     }.get(user_type)
#     if not profile_model:
#         return JsonResponse({'success': False, 'error': 'Invalid user type for document upload.'}, status=400)

#     profile = profile_model.objects.filter(user=user).first()
#     print("PROFILE =", profile)
#     print("DOC TYPE =", doc_type)
#     print("FILE =", file)
#     if not profile:
#         return JsonResponse({'success': False, 'error': 'Profile not found.'}, status=404)

#     doc_field_map = {
#         'hospital_license': ('registration_certificate_path', 'registration_certificate_virus_scanned'),
#         'admin_identity_proof': ('aadhar_doc_path', 'aadhar_doc_virus_scanned'),
#         'hospital_pan': ('pan_doc_path', 'pan_doc_virus_scanned'),
#         'hospital_image': ('hospital_photo_path', 'hospital_photo_virus_scanned'),
#         'ngo_registration_doc': ('ngo_registration_doc_path', 'ngo_registration_doc_virus_scanned'),
#         'lab_certificate': ('lab_certificate_path', 'lab_certificate_virus_scanned'),
#         'identity_proof_aadhar': ('identity_proof_aadhar_path', 'identity_proof_aadhar_virus_scanned'),
#         'identity_proof_pan': ('identity_proof_pan_path', 'identity_proof_pan_virus_scanned'),
#         'gov_license': ('gov_license_path', 'gov_license_virus_scanned'),
#         'lab_photo': ('lab_photo_path', 'lab_photo_virus_scanned'),
#         'incorporation_doc': ('incorporation_doc_path', 'incorporation_doc_virus_scanned'),
#         'gst_doc': ('gst_doc_path', 'gst_doc_virus_scanned'),
#         'pan_doc': ('pan_doc_path', 'pan_doc_virus_scanned'),
#         'tan_doc': ('tan_doc_path', 'tan_doc_virus_scanned'),
#         'section8_doc': ('section8_doc_path', 'section8_doc_virus_scanned'),
#         'doc_12a': ('doc_12a_path', 'doc_12a_virus_scanned'),
#         'brand_image': ('brand_image_path', 'brand_image_virus_scanned'),
#         'medical_license_doc': ('medical_license_doc_path', 'medical_license_doc_virus_scanned'),
#         'storefront_image': ('storefront_image_path', 'storefront_image_virus_scanned'),
#         'clinic_registration': ('registration_certificate_path', 'registration_certificate_virus_scanned'),
#         'aadhar_doc': ('aadhar_doc_path', 'aadhar_doc_virus_scanned'),
#         'doctor_pan': ('pan_doc_path', 'pan_doc_virus_scanned'),
#         'clinic_logo': ('clinic_logo_path', 'clinic_logo_virus_scanned'),
#         'clinic_photo': ('clinic_photo_path', 'clinic_photo_virus_scanned'),
#     }

#     doc_fields = doc_field_map.get(doc_type)
#     if not doc_fields:
#         return JsonResponse({'success': False, 'error': 'Unknown document type.'}, status=400)

#     setattr(profile, doc_fields[0], file_path)
#     print("SETTING:", doc_fields[0], "=", file_path)
#     setattr(profile, doc_fields[1], True)
#     print("FILE PATH =", file_path)
#     print("DOC FIELD =", doc_fields[0])
#     profile.save()

#     return JsonResponse({'success': True, 'message': 'Document updated successfully.'})

@dashboard_login_required
@require_POST
def update_user_document(request):
    user = request.user_obj
    user_type = user.user_type
    doc_type = request.POST.get('doc_type')
    
    # Check for a generic 'document' key first; fall back to the dynamic doc_type name 
    file = request.FILES.get('document') or request.FILES.get(doc_type)

    # ==================== DEBUGGING BLOCK 1 ====================
    print("\n--- [DEBUG TAN START] ---")
    print(f"USER TYPE: {user_type}")
    print(f"INCOMING DOC TYPE: '{doc_type}'")
    print(f"FILES IN REQUEST: {list(request.FILES.keys())}")
    print(f"POST FIELDS IN REQUEST: {list(request.POST.keys())}")
    print(f"RESOLVED FILE OBJECT: {file}")
    # ===========================================================

    if not doc_type or not file:
        print("[DEBUG ERROR] Short-circuited: Missing doc_type or file object!")
        print("--- [DEBUG TAN END] ---\n")
        return JsonResponse({'success': False, 'error': 'Missing document or type.'}, status=400)

    subdir_map = {
        'hospital_license': 'registration',
        'admin_identity_proof': 'aadhar',      
        'pan_doc': 'pan',
        'hospital_pan': 'pan',
        'hospital_image': 'hospital_image',
        'ngo_registration_doc': 'registration',
        'lab_certificate': 'lab_certificate',
        'identity_proof_aadhar': 'aadhar',
        'identity_proof_pan': 'pan',
        'gov_license': 'gov_license',
        'lab_photo': 'lab_photo',
        'incorporation_doc': 'incorporation',
        'gst_doc': 'gst',
        'tan_doc': 'tan',
        'section8_doc': 'section8',
        'doc_12a': 'doc_12a',
        'brand_image': 'brand_image',
        'medical_license_doc': 'medical_license',
        'storefront_image': 'store_front',
        'clinic_registration': 'registration',
        'aadhar_doc': 'aadhar',
        'doctor_pan': 'pan',
        'clinic_logo': 'clinic_logo',
        'clinic_photo': 'clinic_photo',
    }
        
    upload_subdir = subdir_map.get(doc_type)
    print(f"MAPPED SUBDIRECTORY: '{upload_subdir}'")
    
    if not upload_subdir:
        print(f"[DEBUG ERROR] Short-circuited: '{doc_type}' not found in subdir_map!")
        print("--- [DEBUG TAN END] ---\n")
        return JsonResponse({'success': False, 'error': 'Invalid document type.'}, status=400)

    file_path, error = validate_and_save_file(file, upload_subdir, doc_type.replace('_', ' ').title(), user_type=user_type)
    print(f"VALIDATE & SAVE RESULT - Path: '{file_path}', Error: '{error}'")
    
    if error:
        print("--- [DEBUG TAN END] ---\n")
        return JsonResponse({'success': False, 'error': error}, status=400)

    profile_model = {
        'ngo': NGOProfile,
        'advertiser': AdvertiserProfile,
        'client': ClientProfile,
        'pharmacy': PharmacyProfile,
        'lab': LabProfile,
        'hospital': HospitalProfile,
        'doctor': DoctorProfile,
    }.get(user_type)
    
    if not profile_model:
        print(f"[DEBUG ERROR] Short-circuited: No profile model mapped for user type '{user_type}'")
        print("--- [DEBUG TAN END] ---\n")
        return JsonResponse({'success': False, 'error': 'Invalid user type for document upload.'}, status=400)

    profile = profile_model.objects.filter(user=user).first()
    print(f"TARGET PROFILE OBJECT FOUND: {profile}")
    
    if not profile:
        print("--- [DEBUG TAN END] ---\n")
        return JsonResponse({'success': False, 'error': 'Profile not found.'}, status=404)

    doc_field_map = {
        'hospital_license': ('registration_certificate_path', 'registration_certificate_virus_scanned'),
        'admin_identity_proof': ('aadhar_doc_path', 'aadhar_doc_virus_scanned'),
        'hospital_pan': ('pan_doc_path', 'pan_doc_virus_scanned'),
        'hospital_image': ('hospital_photo_path', 'hospital_photo_virus_scanned'),
        'ngo_registration_doc': ('ngo_registration_doc_path', 'ngo_registration_doc_virus_scanned'),
        'lab_certificate': ('lab_certificate_path', 'lab_certificate_virus_scanned'),
        'identity_proof_aadhar': ('identity_proof_aadhar_path', 'identity_proof_aadhar_virus_scanned'),
        'identity_proof_pan': ('identity_proof_pan_path', 'identity_proof_pan_virus_scanned'),
        'gov_license': ('gov_license_path', 'gov_license_virus_scanned'),
        'lab_photo': ('lab_photo_path', 'lab_photo_virus_scanned'),
        'incorporation_doc': ('incorporation_doc_path', 'incorporation_doc_virus_scanned'),
        'gst_doc': ('gst_doc_path', 'gst_doc_virus_scanned'),
        'pan_doc': ('pan_doc_path', 'pan_doc_virus_scanned'),
        'tan_doc': ('tan_doc_path', 'tan_doc_virus_scanned'),
        'section8_doc': ('section8_doc_path', 'section8_doc_virus_scanned'),
        'doc_12a': ('doc_12a_path', 'doc_12a_virus_scanned'),
        'brand_image': ('brand_image_path', 'brand_image_virus_scanned'),
        'medical_license_doc': ('medical_license_doc_path', 'medical_license_doc_virus_scanned'),
        'storefront_image': ('storefront_image_path', 'storefront_image_virus_scanned'),
        'clinic_registration': ('registration_certificate_path', 'registration_certificate_virus_scanned'),
        'aadhar_doc': ('aadhar_doc_path', 'aadhar_doc_virus_scanned'),
        'doctor_pan': ('pan_doc_path', 'pan_doc_virus_scanned'),
        'clinic_logo': ('clinic_logo_path', 'clinic_logo_virus_scanned'),
        'clinic_photo': ('clinic_photo_path', 'clinic_photo_virus_scanned'),
    }

    doc_fields = doc_field_map.get(doc_type)
    print(f"MAPPED MODEL FIELDS TO SAVE: {doc_fields}")
    
    if not doc_fields:
        print(f"[DEBUG ERROR] Short-circuited: '{doc_type}' not found in doc_field_map!")
        print("--- [DEBUG TAN END] ---\n")
        return JsonResponse({'success': False, 'error': 'Unknown document type.'}, status=400)

    # Set paths dynamically and update verification flag fields
    setattr(profile, doc_fields[0], file_path)
    setattr(profile, doc_fields[1], True)
    
    # Extra check before saving to confirm fields were changed in memory
    print(f"CONFIRMING PROPERTY ATTR VALUE SET ON INSTANCE: '{getattr(profile, doc_fields[0])}'")
    
    profile.save()
    print("[DEBUG SUCCESS] profile.save() executed smoothly without an exception crash.")
    print("--- [DEBUG TAN END] ---\n")

    return JsonResponse({'success': True, 'message': 'Document updated successfully.'})

@require_POST
@dashboard_login_required
def update_ngo_profile(request):
    data = request.POST
    errors={}
    user = request.user_obj
    
    validate_email_phone(data, errors)
    
    ngo_services = request.POST.get("ngo_services")
    if not ngo_services:
        errors["services"] = "Select at least one NGO service."
        
    # Validate address fields
    for field in ["ngo_name","address", "city", "state", "pincode", "country", "contact_name", "contact_phone_number"]:
        if not data.get(field):
            errors[field] = f"{field.replace('_', ' ').capitalize()} is required."
    
    if errors:
        return JsonResponse({"success": False, "errors": errors}, status=400)
        
    with transaction.atomic():
    # Update User model
        user.email = request.POST.get('email')
        user.phone_country_code = request.POST.get('countryCodes')
        user.phone_number = request.POST.get('phone')
        user.save()

    # Update NGOProfile
        ngo_profile = NGOProfile.objects.filter(user=user).first()
        if ngo_profile:
            for field in ["ngo_name", "website_url", "address", "city", "state", "country", "pincode", "referral_code"]:
                setattr(ngo_profile, field, data.get(field))
            ngo_profile.ngo_services = NGOService.objects.get(name=data.get("ngo_services"))
            ngo_profile.save()
        contact_person = ContactPerson.objects.filter(profile_type='ngo', profile=user).first()

        if contact_person:
            contact_person.name = request.POST.get('contact_name')
            contact_person.phone_country_code = request.POST.get('contact_countryCodes')
            contact_person.phone_number = request.POST.get('contact_phone_number')
            contact_person.role = request.POST.get('contact_role')
            contact_person.save()

    return JsonResponse({"success": True, "message": "NGO profile updated successfully."})
    
@require_POST
@dashboard_login_required
def update_advertiser_profile(request):
    post_data = request.POST
    errors = {}
    user = request.user_obj  
    
    validate_email_phone(post_data, errors)
    
    required_fields = ["company_name", "phone","address", "city", "state", "country", "pincode", "contact_name", "contact_phone_number", "contact_role"]
    for field in required_fields:
        if not post_data.get(field):
            errors[field] = f"{field.replace('_', ' ').capitalize()} is required."

    if errors:
        return JsonResponse({"success": False, "errors": errors}, status=400)

    try:
        with transaction.atomic():
            # --- Update User ---
            # user.email = post_data.get('email')
            user.phone_country_code = post_data.get("countryCodes")
            user.phone_number = post_data.get("phone")
            user.save()

            # --- Update AdvertiserProfile ---
            advertiser_profile = get_object_or_404(AdvertiserProfile, user=user)
            advertiser_profile.company_name = post_data.get("company_name")
            advertiser_profile.advertiser_type = AdvertiserType.objects.get(name=post_data.get("advertiser_type"))
            advertiser_profile.ad_services_required = AdServiceReq.objects.get(name=post_data.get("company_services") )
            advertiser_profile.website_url = post_data.get("website_url")
            advertiser_profile.address = post_data.get("address")
            advertiser_profile.city = post_data.get("city")
            advertiser_profile.state = post_data.get("state")
            advertiser_profile.country = post_data.get("country")
            advertiser_profile.pincode = post_data.get("pincode")
            advertiser_profile.save()

            # --- Update or Create ContactPerson ---
            contact_name = post_data.get("contact_name")
            contact_phone = post_data.get("contact_phone_number")
            if contact_name or contact_phone:
                contact, _ = ContactPerson.objects.get_or_create(
                    profile_type="advertiser",
                    profile=user
                )
                contact.name = contact_name
                contact.role = post_data.get("contact_role")
                contact.phone_country_code = post_data.get("contact_countryCodes")
                contact.phone_number = contact_phone
                contact.save()

        return JsonResponse({'success': True, 'message': 'Advertiser profile updated successfully'})
    
    except Exception as e:
        return JsonResponse({"success": False, "message": str(e)}, status=500)

@require_POST
@dashboard_login_required
def update_client_profile(request):
    post_data = request.POST
    errors = {}
    user = request.user_obj
    validate_email_phone(post_data, errors)

    # Required fields
    required_fields = ["company_name", "company_type", "address", "city", "state", "pincode", "country"]
    for field in required_fields:
        if not post_data.get(field):
            errors[field] = f"{field.replace('_', ' ').capitalize()} is required."

    if errors:
        return JsonResponse({"success": False, "errors": errors}, status=400)
    try:
        with transaction.atomic():
            # Update User model
            user.email = post_data.get('email')
            user.phone_country_code = post_data.get('countryCodes', "+91")
            user.phone_number = post_data.get('phone')
            user.save()
            
            # --- Update ClientProfile ---
            profile = get_object_or_404(ClientProfile, user=user)
            profile.company_name = post_data.get("company_name")
            profile.company_type = ClientType.objects.get(name=post_data.get("company_type"))
            profile.website_url = post_data.get("website_url")
            profile.address = post_data.get("address")
            profile.city = post_data.get("city")
            profile.state = post_data.get("state")
            profile.pincode = post_data.get("pincode")
            profile.country = post_data.get("country")
            profile.services_interested = ClientService.objects.get(name=post_data.get("company_services")) 
            profile.phone = post_data.get("phone")
            profile.phone_country_code = post_data.get("countryCodes")
            profile.save()
            
            contact_name = post_data.get("contact_name")
            contact_phone = post_data.get("contact_phone_number")
            if contact_name or contact_phone:
                contact, _ = ContactPerson.objects.get_or_create(
                    profile_type="advertiser",
                    profile=user
                )
                contact.name = contact_name
                contact.role = post_data.get("contact_role")
                contact.phone_country_code = post_data.get("contact_countryCodes")
                contact.phone_number = contact_phone
                contact.save()

        return JsonResponse({'success': True, 'message': 'Client profile updated successfully.'})
    except Exception as e:
        import traceback
        print(traceback)
        return JsonResponse({'success': False, 'message': f'Error updating profile: {str(e)}'})

@require_POST
@dashboard_login_required
def update_pharmacy_profile(request):
    post_data = request.POST
    errors = {}
    user = request.user_obj  

    validate_email_phone(post_data, errors)
    # required_fields = ["company_name", "city", "state", "pincode"]
    required_fields = ["company_name", "pincode"]
    for field in required_fields:
        if not post_data.get(field):
            errors[field] = f"{field.replace('_', ' ').capitalize()} is required."

    if errors:
        return JsonResponse({"success": False, "errors": errors}, status=400)

    try:
        with transaction.atomic():
            # --- Update User ---
            user.email = post_data.get('email')
            user.phone_country_code = post_data.get("countryCodes")
            user.phone_number = post_data.get("phone")
            user.save()

            # --- Update Pharmacy Profile ---
            pharmacy_profile = get_object_or_404(PharmacyProfile, user=user)
            pharmacy_profile.company_name = post_data.get("company_name")
            pharmacy_profile.website = post_data.get("website_url")
            pharmacy_profile.address = post_data.get("address")
            
            # -------- STATE --------
            state_raw = post_data.get("state", "").strip()
            # Remove extra spaces and normalize
            state_name = ' '.join(state_raw.split())
            
            state_obj = None
            if state_name:
                # Try exact match first (case-insensitive)
                state_obj = State.objects.filter(
                   name__iexact=state_name
                ).first()
                
                # If not found, try partial match
                if not state_obj:
                    state_obj = State.objects.filter(
                       name__icontains=state_name
                    ).first()
                
                if state_obj:
                    pharmacy_profile.state = state_obj
                    print(f"State found: '{state_obj.name}' for input: '{state_raw}'")
                else:
                    print(f"State NOT found for: '{state_name}' (raw: '{state_raw}')")

            # -------- CITY --------
            city_name = post_data.get("city", "").split(",")[0].strip()

            if city_name and state_obj:
                # Try to find existing city (case-insensitive)
                city = City.objects.filter(
                    name__iexact=city_name,
                    state=state_obj
                ).first()
                
                # If city doesn't exist, create it
                if not city:
                    city = City.objects.create(
                        name=city_name.title(),  # Title case for consistency
                        state=state_obj
                    )
                    print(f"Created new city: {city_name} in {state_obj.name}")
                
                pharmacy_profile.city = city

            # ---------- Update Working Hours ----------
            timing_id = post_data.get("working_days") or post_data.get("pharmacy_timing")

            if timing_id:
                pharmacy_profile.pharmacy_timing_id = int(timing_id)

            pharmacy_profile.owner_name = post_data.get("owner_name", "")
            pharmacy_profile.country = post_data.get("country", "")
            pharmacy_profile.pincode = post_data.get("pincode")
            
            print("POST =", post_data.dict())
            print("State POST =", post_data.get("state"))
            print("City POST =", post_data.get("city"))
            print("Country POST =", post_data.get("country"))
            print("Working =", post_data.get("working_days"))

            print("Before save")
            print("pharmacy_profile.state =", pharmacy_profile.state)
            print("pharmacy_profile.city =", pharmacy_profile.city)
            print("pharmacy_profile.country =", pharmacy_profile.country)
            print("pharmacy_profile.pincode =", pharmacy_profile.pincode)

            pharmacy_profile.save()

            pharmacy_profile.referral_code = post_data.get("referral_code", "")

            pharmacy_type_name = post_data.get("pharmacy_type", "").strip()

            if pharmacy_type_name:
                type_obj = PharmacyType.objects.filter(name__iexact=pharmacy_type_name).first()

            if type_obj:
                pharmacy_profile.pharmacy_types.set([type_obj])

            service_name = post_data.get("services_offered", "").strip()

            if service_name:
                service_obj = PharmacyServices.objects.filter(name__iexact=service_name).first()

            if service_obj:
                pharmacy_profile.services.set([service_obj])

            pharmacy_profile.save()

        # --- Update or Create ContactPerson ---
        contact_name = post_data.get("contact_name")
        contact_phone = post_data.get("contact_phone_number")
        if contact_name or contact_phone:
            contact, _ = ContactPerson.objects.get_or_create(
                profile_type="pharmacy",
                profile=user
            )
            contact.name = contact_name
            contact.role = post_data.get("contact_role")
            contact.phone_country_code = post_data.get("contact_countryCodes")
            contact.phone_number = contact_phone
            contact.save()

        return JsonResponse({'success': True, 'message': 'Pharmacy profile updated successfully'})
    
    # except Exception as e:
    #     return JsonResponse({"success": False, "message": str(e)}, status=500)
    except Exception as e:
        traceback.print_exc()
        print("PHARMACY SAVE ERROR:", e)

        return JsonResponse({
            "success": False,
            "message": str(e)
        }, status=500)

@require_POST
@dashboard_login_required
def update_lab_profile(request):
    post_data = request.POST
    errors = {}
    user = request.user_obj  
    
    validate_email_phone(post_data, errors)
    required_fields = ["lab_name", "city", "state", "pincode"]
    for field in required_fields:
        if not post_data.get(field):
            errors[field] = f"{field.replace('_', ' ').capitalize()} is required."

    if errors:
        return JsonResponse({"success": False, "errors": errors}, status=400)
    
    try:
    
        with transaction.atomic():

             user.email = post_data.get('email')
             user.phone_country_code = post_data.get("countryCodes")
             user.save()

             lab_profile = get_object_or_404(LabProfile, user=user)

             # Update fields
             lab_profile.lab_name = post_data.get("lab_name")
             lab_profile.owner_name = post_data.get("owner_name")

             lab_profile.contact_number = post_data.get("phone")

             lab_profile.lab_registration_number = post_data.get("lab_registration_number")

             lab_profile.address = post_data.get("address")
             lab_profile.country = post_data.get("country")

             lab_profile.pincode = post_data.get("pincode")
            # ---------------- STATE ----------------

             state_name = post_data.get("state", "").strip()

             state = State.objects.filter(
                name__iexact=state_name
            ).first()

             if state:
                lab_profile.state = state


            # ---------------- CITY ----------------

             city_name = post_data.get("city", "").split(",")[0].strip()

             if state:
              city = City.objects.filter(
                name__iexact=city_name,
                state=state
            ).first()

             if city:
              lab_profile.city = city


            # ---------------- WORKING HOURS ----------------

             timing_id = post_data.get("lab_timing_id")

             if timing_id:
                lab_profile.lab_timing_id = int(timing_id)

    # DO NOT TOUCH city/state for now
    # because they are ForeignKeys
             print("State =", lab_profile.state)
             print("City =", lab_profile.city)
             print("Timing =", lab_profile.lab_timing)

             lab_profile.save()

             return JsonResponse({
                 'success': True,
                 'message': 'Lab profile updated successfully'
              })
    except Exception as e:
        import traceback
        print(traceback.format_exc())

        return JsonResponse({
            "success": False,
            "message": str(e)
        }, status=500)

    
    
    #         return JsonResponse({'success': True, 'message': 'Lab profile updated successfully'})

    # except Exception as e:
    #     return JsonResponse({"success": False, "message": str(e)}, status=500)

@require_POST
@dashboard_login_required
def update_hospital_profile(request):

    if request.method == "POST":

        print(request.POST)

        post_data = request.POST
        errors = {}

        user = request.user_obj

        validate_email_phone(post_data, errors)

        required_fields = ["hospital_name", "city", "state", "pincode"]

        for field in required_fields:
            if not post_data.get(field):
                errors[field] = f"{field.replace('_', ' ').capitalize()} is required."

        if errors:
            return JsonResponse({
                "success": False,
                "errors": errors
            }, status=400)

        try:

            with transaction.atomic():

                user.email = post_data.get('email')
                # user.phone_country_code = post_data.get("countryCodes")
                # user.phone_number = post_data.get("contact_number")
                user.phone_country_code = post_data.get("phone_country_code")
                user.phone_number = post_data.get("phone")
                user.save()

                hospital_profile = get_object_or_404(
                    HospitalProfile,
                    user=user
                )

                hospital_profile.hospital_name = post_data.get("hospital_name")
                hospital_profile.address = post_data.get("address")
                # hospital_profile.city = post_data.get("city")
                # hospital_profile.state = post_data.get("state")
                # hospital_profile.city_name = post_data.get("city")
                # hospital_profile.state_id = None
                hospital_profile.owner_name = post_data.get("owner_name")
                user.phone_country_code = post_data.get("phone_country_code")
                user.phone_number = post_data.get("phone")
                # hospital_profile.country = post_data.get("country")
                # hospital_profile.pincode = post_data.get("pincode")
                hospital_profile.owner_name = post_data.get("owner_name")

                state_name = post_data.get("state", "").strip()
                # city_name = post_data.get("city", "").strip()
                city_name = post_data.get("city", "").split(",")[0].strip()

                state = State.objects.filter(
                   name__iexact=state_name
                ).first()

                if state:
                    hospital_profile.state = state

                    city = City.objects.filter(
                        name__iexact=city_name,
                        state=state
                    ).first()

                    if city:
                        hospital_profile.city = city

                hospital_profile.country = post_data.get("country")
                hospital_profile.pincode = post_data.get("pincode")

                hospital_profile.save()

                print("DATA SAVED SUCCESSFULLY")

                return JsonResponse({
                    "success": True,
                    "message": "Hospital profile updated successfully"
                })

        except Exception as e:

            print("SAVE ERROR:", e)

            return JsonResponse({
                "success": False,
                "message": str(e)
            }, status=500)
# def update_hospital_profile(request):
#     if request.method == "POST":
#         print(request.POST)
#     post_data = request.POST
#     errors = {}
#     user = request.user_obj  
#     validate_email_phone(post_data, errors)
#     required_fields = ["hospital_name", "city", "state", "pincode"]
#     for field in required_fields:
#         if not post_data.get(field):
#             errors[field] = f"{field.replace('_', ' ').capitalize()} is required."

#     if errors:
#         return JsonResponse({"success": False, "errors": errors}, status=400)
    
#     try:
#         with transaction.atomic():
#             user.email = post_data.get('email')
#             user.phone_country_code = post_data.get("countryCodes")
#             user.phone_number = post_data.get("contact_number")
#             user.save()
            
#             hospital_profile = get_object_or_404(HospitalProfile, user=user)
#             hospital_profile.hospital_name = post_data.get("hospital_name")
#             hospital_profile.address = post_data.get("address")
#             hospital_profile.city = post_data.get("city")
#             hospital_profile.state = post_data.get("state")
#             hospital_profile.country = post_data.get("country")
#             hospital_profile.pincode = post_data.get("pincode")
#             try:
#                hospital.save()
#                print("DATA SAVED SUCCESSFULLY")

#                return JsonResponse({
#                "status": "success"
#             })

#             except Exception as e:
#                 print("SAVE ERROR:", e)

#                 return JsonResponse({
#                 "status": "error",
#                 "message": str(e)
#             })
#             # hospital_profile.save()
        
            
    #         return JsonResponse({'success': True, 'message': 'Hospital profile updated successfully'})

    # except Exception as e:
    #     return JsonResponse({"success": False, "message": str(e)}, status=500)


@require_POST
@dashboard_login_required
def update_doctor_profile(request):

    post_data = request.POST
    errors = {}
    user = request.user_obj

    validate_email_phone(post_data, errors)

    required_fields = ["clinic_name", "city", "state", "pincode"]

    for field in required_fields:
        if not post_data.get(field):
            errors[field] = f"{field.replace('_', ' ').capitalize()} is required."

    if errors:
        return JsonResponse({
            "success": False,
            "errors": errors
        }, status=400)

    try:

        with transaction.atomic():

            # USER UPDATE
            user.email = post_data.get('email')
            user.phone_country_code = post_data.get("countryCodes")
            user.phone_number = post_data.get("phone")
            user.save()

            # DOCTOR PROFILE
            doctor_profile = get_object_or_404(
                DoctorProfile,
                user=user
            )

            doctor_profile.clinic_name = post_data.get("clinic_name")

            doctor_profile.registration_number = post_data.get(
                "registration_number"
            )

            doctor_profile.full_address = post_data.get("address")
            # ---------------- STATE ----------------

            state_name = post_data.get("state", "").strip()

            state = State.objects.filter(
                name__iexact=state_name
            ).first()

            if state:
               doctor_profile.state = state


            # ---------------- CITY ----------------

            city_name = post_data.get("city", "").split(",")[0].strip()

            if state:
                city = City.objects.filter(
                  name__iexact=city_name,
                  state=state
                ).first()

                if city:
                  doctor_profile.city = city

            # doctor_profile.city = post_data.get("city")

            # doctor_profile.state = post_data.get("state")

            doctor_profile.country = post_data.get("country")

            doctor_profile.pincode = post_data.get("pincode")

            doctor_profile.owner_name = post_data.get("owner_name")

            doctor_profile.save()

            return JsonResponse({
                "success": True,
                "message": "Doctor profile updated successfully"
            })

    except Exception as e:

        import traceback

        print(traceback.format_exc())

        print("DOCTOR SAVE ERROR:", str(e))

        return JsonResponse({
            "success": False,
            "message": str(e)
        }, status=500)
# def update_doctor_profile(request):
#     post_data = request.POST
#     errors = {}
#     user = request.user_obj

#     validate_email_phone(post_data, errors)

#     required_fields = ["clinic_name", "city", "state", "pincode"]

#     for field in required_fields:
#         if not post_data.get(field):
#             errors[field] = f"{field.replace('_', ' ').capitalize()} is required."

#     if errors:
#         return JsonResponse({"success": False, "errors": errors}, status=400)

#     try:
#         with transaction.atomic():

#             user.email = post_data.get('email')
#             user.phone_country_code = post_data.get("countryCodes")
#             user.phone_number = post_data.get("phone")
#             user.save()

#             doctor_profile = get_object_or_404(DoctorProfile, user=user)
            

            # doctor_profile.clinic_name = post_data.get("clinic_name")
            # doctor_profile.registration_number = post_data.get("registration_number")

        #    doctor_profile.full_address = post_data.get("address")
        #    doctor_profile.city = post_data.get("city")
        #    doctor_profile.state = post_data.get("state")
        #    doctor_profile.pincode = post_data.get("pincode")
        
# def update_doctor_profile(request):
#     post_data = request.POST
#     errors = {}
#     user = request.user_obj  
#     validate_email_phone(post_data, errors)
#     required_fields = ["clinic_name", "city", "state", "pincode"]
#     for field in required_fields:
#         if not post_data.get(field):
#             errors[field] = f"{field.replace('_', ' ').capitalize()} is required."

#     if errors:
#         return JsonResponse({"success": False, "errors": errors}, status=400)
#     try:
#     with transaction.atomic():

#         user.email = post_data.get('email')
#         user.phone_country_code = post_data.get("countryCodes")
#         user.phone_number = post_data.get("phone")
#         user.save()

#         doctor_profile = get_object_or_404(DoctorProfile, user=user)

#         doctor_profile.clinic_name = post_data.get("clinic_name")
#         doctor_profile.registration_number = post_data.get("registration_number")

#         doctor_profile.address = post_data.get("address")

#         doctor_profile.city = post_data.get("city")
#         doctor_profile.state = post_data.get("state")
#         doctor_profile.pincode = post_data.get("pincode")

#         doctor_profile.owner_name = post_data.get("owner_name")

#         doctor_profile.contact_number = post_data.get("phone")
#         doctor_profile.alt_contact_number = post_data.get("alt_contact_number")

#         doctor_profile.save()

#         return JsonResponse({
#             'success': True,
#             'message': 'Doctor profile updated successfully'
#         })
  
    # try:
    #     with transaction.atomic():
    #         user.email = post_data.get('email')
    #         user.phone_country_code = post_data.get("countryCodes")
    #         user.save()
            
    #         # doctor_profile = get_object_or_404(DoctorProfile, user=user)
    #         # doctor_profile.save()
    #         doctor_profile = get_object_or_404(DoctorProfile, user=user)
    #         doctor_profile.clinic_name = post_data.get("clinic_name")
    #         doctor_profile.registration_number = post_data.get("registration_number")
    #         # doctor_profile.full_address = post_data.get("address")
    #         doctor_profile.address = post_data.get("address")
    #         doctor_profile.city = post_data.get("city")
    #         doctor_profile.state = post_data.get("state")
    #         doctor_profile.pincode = post_data.get("pincode")
    #         doctor_profile.owner_name = post_data.get("owner_name")
    #         doctor_profile.contact_number = post_data.get("phone")
    #         doctor_profile.alt_contact_number = post_data.get("alt_contact_number")

    #         doctor_profile.save()
            
    #         return JsonResponse({'success': True, 'message': 'Doctor profile updated successfully'})

    # except Exception as e:
    #     return JsonResponse({"success": False, "message": str(e)}, status=500)
# 
@require_POST
@dashboard_login_required
def delete_account(request):
    user = request.user_obj
    data = json.loads(request.body)
    reason = data.get("reason", "No reason provided")

    # Soft delete: deactivate user
    user.is_active = False
    user.save(update_fields=["is_active"])
    # user.delete()
    request.session.flush()

    return JsonResponse({'status': 'account deleted'})

@require_POST
@dashboard_login_required
def clear_search_history(request):
    user = request.user_obj
    SearchHistory.objects.filter(user=user).delete()
    return JsonResponse({'status': 'search history cleared'})

@require_POST
@dashboard_login_required
def clear_saved_data(request):
    user = request.user_obj
    SavedLocation.objects.filter(user=user).delete()

    if user.user_type == 'advertiser':
        Coupon.objects.filter(user=user, saved=True).update(saved=False)
        Donation.objects.filter(user=user, saved=True).update(saved=False)

    elif user.user_type == 'ngo':
        NGOPost.objects.filter(user=user, saved=True).update(saved=False)

    elif user.user_type == "pharmacy":
        Donation.objects.filter(user=user, saved=True).update(saved=False)

    return JsonResponse({'status': 'saved data cleared'})

@dashboard_login_required
@require_POST
def send_change_password_otp(request):
    user = request.user_obj

    token_data = async_to_sync(async_send_otp_email)(user)

    if not token_data.get("success"):
        return JsonResponse({
            "success": False,
            "message": "Failed to send OTP."
        })

    secret = token_data["otp_token"]

    cache.set(
        f"otp:{secret}",
        {
            "email": user.email,
            "secret": secret,
            "created_at": timezone.now().isoformat(),
        },
        timeout=600,
    )

    return JsonResponse({
        "success": True,
        "token": secret,
        "message": "OTP sent successfully."
    })

@dashboard_login_required
@require_POST
def change_password(request):
    try:
        user = request.user_obj
        current_password = request.POST.get('current_password')
        new_password = request.POST.get('new_password')
        confirm_password = request.POST.get('confirm_password')
        otp = request.POST.get("otp")
        token = request.POST.get("token")
        otp_result = verify_otp_token(user.email, otp, token)
        
        if not otp_result["success"]: return JsonResponse({
            "success": False,
            "message": otp_result["message"]
        })
        errors={}
        error=''
        if not current_password or len(current_password) <= 8:
            errors["new_password"] = "Password is required (min 8 chars)."
            error = "Password is required (min 8 chars)."
        if not check_password(current_password, user.password):
            errors["current_password"] = "Current password is incorrect."
            error = "Current password is incorrect."
        elif new_password != confirm_password:
            errors["confirm_password"] = "Passwords do not match."
            error = "Passwords do not match."
            
        if errors:
            return JsonResponse({"success": False, "errors": errors, "message": error})
        
        user.password = make_password(new_password)
        user.save()
        return JsonResponse({'success': True, 'message': 'Password changed successfully', "errors" : ''})
    except Exception as e:
        return JsonResponse({'success': False, 'errors': f'Error updating password: {str(e)}', "message" : ''})

def get_seller_profile_id(user):
    profile_map = {
        "pharmacy": PharmacyProfile,
        "lab": LabProfile,
        "hospital": HospitalProfile,
        "doctor": DoctorProfile,
    }
    model = profile_map.get(user.user_type)
    if not model:
        return None

    profile = model.objects.filter(user=user).only("id").first()
    return profile.id if profile else None

@dashboard_login_required
def seller_subscription_status(request):
    """
    Returns current subscription status for logged-in seller
    """
    user = request.user_obj  # assuming custom auth

    seller_type = user.user_type           # pharmacy / lab / hospital / doctor
    seller_profile_id = get_seller_profile_id(user)  # adapt this to your project

    sub = SellerSubscription.objects.filter(
        seller_type=seller_type,
        seller_profile_id=seller_profile_id,
        is_active=True,
        is_enabled=True
    ).first()

    if not sub:
        return JsonResponse({
            "has_subscription": False,
            "plan": "Free",
        })

    days_left = None
    if sub.expiry_date:
        days_left = (sub.expiry_date.date() - timezone.now().date()).days

    return JsonResponse({
        "has_subscription": True,
        "plan": sub.plan_name,
        "price": float(sub.price),
        "expiry_date": sub.expiry_date.strftime("%d/%m/%Y") if sub.expiry_date else None,
        "days_left": days_left,
    })

@require_POST
@dashboard_login_required
def subscribe_subscription(request):
    user = request.user_obj

    seller_profile_id = get_seller_profile_id(user)
    if not seller_profile_id:
        return JsonResponse({"success": False}, status=400)

    # deactivate old
    SellerSubscription.objects.filter(
        seller_type=user.user_type,
        seller_profile_id=seller_profile_id,
        is_active=True
    ).update(is_active=False)

    # create new subscription
    SellerSubscription.objects.create(
        seller_type=user.user_type,
        seller_profile_id=seller_profile_id,
        plan_name="Premium",
        price=999,
        is_active=True,
        expiry_date=timezone.now() + timedelta(days=30),
    )

    return JsonResponse({"success": True})

@dashboard_login_required
@require_POST
def cancel_subscription(request):
    user = request.user_obj

    SellerSubscription.objects.filter(
        seller_type=user.user_type,
        seller_profile_id=get_seller_profile_id(user),
        is_active=True
    ).update(is_active=False)

    return JsonResponse({"success": True})

@dashboard_login_required
def terms_conditions(request):
    user = request.user_obj
    user_type = user.user_type
    context = get_common_context(request, user)
    context.update(get_base_context(user))
    context["active_main_tab"] = request.GET.get("tab", "settings")
    return render(request, 'settings/partials/terms-conditions.html',context)

@dashboard_login_required
def privacy_policy(request):
    user = request.user_obj
    user_type = user.user_type
    context = get_common_context(request, user)
    context.update(get_base_context(user))
    context["active_main_tab"] = request.GET.get("tab", "settings")
    return render(request, 'settings/partials/privacy-policy.html',context)

@dashboard_login_required
def disclaimer(request):
    user = request.user_obj
    user_type = user.user_type
    context = get_common_context(request, user)
    context.update(get_base_context(user))
    context["active_main_tab"] = request.GET.get("tab", "settings")
    return render(request, 'settings/partials/disclaimer.html',context)

@require_POST
@dashboard_login_required
def get_cities_by_state(request):
    """API endpoint to fetch cities for a given state"""
    try:
        data = json.loads(request.body)
        state_name = data.get('state', '').strip()
        
        if not state_name:
            return JsonResponse({'cities': []})
        
        # Get state object
        state = State.objects.filter(name__iexact=state_name).first()
        
        if not state:
            return JsonResponse({'cities': []})
        
        # Fetch cities for this state
        cities = City.objects.filter(state=state).order_by('name').values_list('name', flat=True)
        
        return JsonResponse({'cities': list(cities)})
        
    except Exception as e:
        print("Error fetching cities:", e)
        return JsonResponse({'cities': []}, status=500)
