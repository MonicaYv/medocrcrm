import os
import re
import pyotp
from .models import *
import requests
from .email_otp import (
    async_send_otp_email,
    send_forgot_password_email,
    generate_otp_secret,
    generate_otp,
    verify_otp as verify_totp
)

# from .email_otp import async_send_otp_email, send_forgot_password_email
from asgiref.sync import async_to_sync
from django.http import JsonResponse
from django.conf import settings
from django.urls import reverse
from django.shortcuts import render, redirect
from django.core.cache import cache
from django.core.exceptions import ValidationError
from django.db import IntegrityError, transaction
from django.core.validators import validate_email
from django.core.files.storage import default_storage
from django.views.decorators.csrf import csrf_protect
from django.views.decorators.http import require_POST
from django.contrib.auth.hashers import make_password, check_password
from django.utils import timezone
from coupon.models import CountryOption
from django.views.decorators.http import require_GET
from django.core.mail import send_mail
from django.conf import settings
import requests
import logging
logger = logging.getLogger(__name__)

VIRUS_SCAN_URL = "http://192.168.1.99:8090/scan"
ROLE_TO_TEMPLATE = {
    "login": "login/login.html",
    "customer": "registration/register_user.html",
    "ngoOwner": "registration/ngo_register.html",
    "Pharmacy": "registration/pharmacy_register.html",
    "client": "registration/client_register.html",
    "advertiser": "registration/advertiser_register.html",
    'lab': "registration/lab_register.html",
    'hospital': "registration/hospital_register.html",
    'doctor': "registration/doctor_register.html",
}

def new_signin(request):
    return render(request, 'registration/new_signin.html')

def new_otp_verify(request):
    return render(request, 'registration/new_otp_verify.html')

def new_signup(request):
    return render(request, 'registration/new_signup.html')

def doctor_verification(request):
    return render(request, 'registration/doctor_verification.html')

def lab_verification(request):
    return render(request, 'registration/lab_verification.html')

def pharmacy_verification(request):
    return render(request, 'registration/pharmacy_verification.html')

@require_POST
def send_otp(request):
    email = request.POST.get("email", "").strip()
    if not email:
        return JsonResponse({"success": False, "message": "Please enter email"}, status=400)
    try:
        validate_email(email)
    except:
        return JsonResponse({"success": False, "message": "Invalid email address"}, status=400)
    if User.objects.filter(email=email).exists():
        return JsonResponse({"success": False, "message": "This email is already registered."}, status=400)

    # Generate secret + OTP
    token_data = async_to_sync(async_send_otp_email)(type("obj", (object,), {"email": email}))
    if not token_data.get("success"):
        return JsonResponse(
            {"success": False, "message": token_data.get("message", "Failed to send OTP email.")},
            status=500,
        )
    secret = token_data["otp_token"]

    # Cache secret (NOT otp value) for 5 minutes
    cache.set(f"otp:{secret}", {
        "email": email,
        "secret": secret,
        "created_at": timezone.now().isoformat()
    }, timeout=600)

    return JsonResponse({"success": True, "token": secret, "message": "OTP sent successfully"})

def verify_otp_token(email, otp, bearer_token):
    otp = str(otp).strip()   # <-- ADD THIS

    print("=" * 60)
    print("EMAIL =", email)
    print("OTP RECEIVED =", repr(otp))   # <-- CHANGE THIS
    print("TOKEN =", bearer_token)

    cache_key = f"otp:{bearer_token}"
    otp_data = cache.get(cache_key)

    print("CACHE DATA =", otp_data)

    if not bearer_token or not otp:
        print("FAILED : Missing token or OTP")
        return {"success": False, "message": "Missing token or OTP"}

    if not otp_data:
        print("FAILED : OTP expired")
        return {"success": False, "message": "OTP expired or invalid"}

    print("CACHE EMAIL =", otp_data.get("email"))
    print("CACHE SECRET =", otp_data.get("secret"))

    # secret = otp_data["secret"]

    # totp = pyotp.TOTP(secret, interval=300)

    # print("VERIFY RESULT =", totp.verify(otp, valid_window=5))

    # if not totp.verify(otp, valid_window=5):
    otp = str(otp).strip()
    secret = otp_data["secret"].strip()

    totp = pyotp.TOTP(secret, interval=600)

    print("OTP GENERATED NOW =", totp.now())
    print("OTP RECEIVED      =", otp)

    result = totp.verify(otp, valid_window=5)

    print("VERIFY RESULT =", result)

    if not result:
        print("FAILED : Invalid OTP")
        return {"success": False, "message": "Invalid OTP"}
        # print("FAILED : Invalid OTP")
        # return {"success": False, "message": "Invalid OTP"}

    print("SUCCESS")
    print("=" * 60)

    return {"success": True, "message": "OTP verified successfully"}

@require_POST
def verify_otp(request):
    result = verify_otp_token(
        request.POST.get("email"),
        request.POST.get("otp"),
        request.POST.get("token"),
    )
    if not result["success"]:
        return JsonResponse(result, status=400)
    return JsonResponse({"success": True, "message": "OTP verified successfully"})

def new_welcome(request):
    return render(request, 'registration/new_choose_role.html')

def welcome(request):
    return render(request, 'registration/welcome.html')

def register_by_role(request, role):
    tpl = ROLE_TO_TEMPLATE.get(role)
    if not tpl:
        tpl = "registration/welcome.html"

    context = {}

    if role == "client":
        context["client_types"] = ClientType.objects.filter(is_active=True)
        context["client_services"] = ClientService.objects.filter(is_active=True)

    elif role == "advertiser":
        context["advertiser_types"] = AdvertiserType.objects.filter(is_active=True)
        context["ad_service_reqs"] = AdServiceReq.objects.filter(is_active=True)

    elif role == "ngoOwner":
        context["ngo_services"] = NGOService.objects.filter(is_active=True)

    elif role == "Pharmacy":
        context["pharmacy_types"] = PharmacyType.objects.filter(is_active=True)
        context["pharmacy_services"] = PharmacyServices.objects.filter(is_active=True)
        context["pharmacy_timing"] = PharmacyTiming.objects.filter(is_active=True)
    
    elif role == "lab":
        context["lab_services"] = LabService.objects.filter(is_active=True)
        context["lab_facilities"] = LabFacility.objects.filter(is_active=True)
        context["lab_timing"] = LabTiming.objects.filter(is_active=True)

    elif role == "doctor":
        context["doctor_speciality"] = DoctorSpeciality.objects.filter(is_active=True)
        context["doctor_experience"] = DoctorExperience.objects.filter(is_active=True)
        context["doctor_education"] = DoctorEducation.objects.filter(is_active=True)

    elif role == "hospital":
        context["hospital_timing"] = HospitalTiming.objects.filter(is_active=True)

    return render(request, tpl, context)

ALLOWED_EXTENSIONS = {'.pdf', '.jpg', '.jpeg', '.png'}
MAX_FILE_SIZE = 5 * 1024 * 1024  # 5 MB

def is_file_clean(file_obj):
    return True

def validate_and_save_file(file_obj, subdir, field_label, user_type='common'):
    if not file_obj:
        return '', f"{field_label} is required. (Validation failed)"
    ext = os.path.splitext(file_obj.name)[1].lower()
    if ext not in ALLOWED_EXTENSIONS:
        return '', f"{field_label} must be a PDF or image file."
    if file_obj.size > MAX_FILE_SIZE:
        return '', f"{field_label} must be under 5MB."
    if not is_file_clean(file_obj):
        return '', f"{field_label} failed virus scan."

    upload_dir = os.path.join(f"{user_type}_docs", subdir)
    os.makedirs(os.path.join(settings.MEDIA_ROOT, upload_dir), exist_ok=True)
    filename = default_storage.save(os.path.join(upload_dir, file_obj.name), file_obj)
    return filename, None 

def login_page(request):
    return render(request, 'login/login.html')

@csrf_protect
@require_POST
def login_auth_OLD(request):
    data = request.POST
    email = data.get("email").strip()
    password = data.get("password").strip()
    remember_me = data.get("remember_me")
    errors = {}

    if not email:
        errors["email"] = "Email is required."
    if not password:
        errors["password"] = "Password is required."
    if errors:
        return JsonResponse({"success": False, "errors": errors})

    try:
        user = User.objects.get(email=email)

        if not check_password(password, user.password):
            errors["password"] = "Invalid email or password."
            return JsonResponse({"success": False, "errors": errors})

        allowed_user_types = ["user", "pharmacy", "lab", "doctor", "hospital"]

        if user.user_type not in allowed_user_types:
            return JsonResponse({
                "success": False,
                "error": "This account type is not allowed to login here."
            })

        if not user.is_active:
            errors["account"] = "Your account is deleted. Please contact support."
            return JsonResponse({"success": False, "errors": errors})

        user.last_login = timezone.now()
        user.save(update_fields=["last_login"])

        request.session['user_id'] = user.id

        if remember_me:
            request.session.set_expiry(60 * 60 * 24 * 30)
        else:
            request.session.set_expiry(0)

        dashboard_url = reverse("dashboard")

        return JsonResponse({
            "success": True,
            "redirect": dashboard_url
        })

    except User.DoesNotExist:
        errors["password"] = "Invalid email or password."
        return JsonResponse({"success": False, "errors": errors})
    

@csrf_protect
@require_POST
def save_medical_pharmacy(request):
    data = request.POST
    files = request.FILES
    errors = {}
    email = data.get("email")
    if not email:
        errors["email"] = "Email is required."
    else:
        try:
            validate_email(email)
        except ValidationError:
            errors["email"] = "Enter a valid email."
        if User.objects.filter(email=email).exists():
            errors["email"] = "This email already exists."
    phone_number = data.get("phone")
    phone_country_code = "+91"
    if not phone_number or not re.match(r"^\d{10}$", phone_number):
        errors["phone"] = "Enter valid phone number."
    company_name = data.get("company_name")
    if not company_name:
        errors["company_name"] = "Company name is required."

    website = data.get("website_url") or ""
    pharmacy_type_id = data.get("pharmacy_type")
    pharmacy_type = None
    if pharmacy_type_id:
        try:
            pharmacy_type = PharmacyType.objects.get(id=pharmacy_type_id)
        except:
            errors["pharmacy_type"] = "Invalid pharmacy type."
    service_id = data.get("services_offered")
    services_offered = None
    if service_id:
        try:
            services_offered = PharmacyServices.objects.get(id=service_id)
        except:
            errors["services_offered"] = "Invalid service selected."
    timing_id = data.get("pharmacy_timing")
    pharmacy_timing = None
    if timing_id:
        try:
            pharmacy_timing = PharmacyTiming.objects.get(id=timing_id)
        except:
            errors["pharmacy_timing"] = "Invalid timing selected."
    address = data.get("address")
    city = data.get("city")
    state = data.get("state")
    pincode = data.get("pincode")
    if not address:
        errors["address"] = "Address required."
    if not city:
        errors["city"] = "City required."
    if not state:
        errors["state"] = "State required."
    if not pincode or not re.match(r"^\d{4,10}$", pincode):
        errors["pincode"] = "Invalid pincode."
    incorporation_number = data.get("incorporation_number")
    incorporation_doc_path, err = validate_and_save_file(
        files.get("incorporation_doc"), 
        "incorporation", 
        "Incorporation Document",
        user_type="pharmacy"
    )
    if err:
        errors["incorporation_doc"] = err
    gst_number = data.get("gst_number")
    gst_doc_path, err = validate_and_save_file(
        files.get("gst_doc"), "gst", "GST Document", user_type="pharmacy"
    )
    if err:
        errors["gst_doc"] = err
    pan_number = data.get("pan_number")
    pan_doc_path, err = validate_and_save_file(
        files.get("pan_doc"), "pan", "PAN Document", user_type="pharmacy"
    )
    if err:
        errors["pan_doc"] = err
    medical_license_number = data.get("medical_license_number")
    medical_license_doc_path, err = validate_and_save_file(
        files.get("medical_license_doc"), "medical_license", "Medical License Document", user_type="pharmacy"
    )
    if err:
        errors["medical_license_doc"] = err

    storefront_image_path, err = validate_and_save_file(
        files.get("store_front"), "store_front", "Store Front Image", user_type="pharmacy"
    )
    if err:
        errors["store_front"] = err
    contact_name = data.get("contact_person_name")
    contact_phone = data.get("contact_person_phone")
    contact_role = data.get("contact_person_role")
    # ref_otp = data.get("otp2")
    # contact_otp_token = data.get("contact_otp_token")

    

    # otp_result = verify_otp_token(
    #    None,
    #    ref_otp,
    #    contact_otp_token
    # )

    # if not otp_result["success"]:
    # if not verify_contact_person_otp(ref_otp, contact_otp_token):
    #     return JsonResponse(
    #       {
    #         "success": False,
    #         "message": "Invalid Contact Person OTP"
    #       },
    #       status=400
    #     )
    ref_otp = data.get("otp2")
    contact_otp_token = data.get("contact_otp_token")
    
    # if not ref_otp:
    #    errors["otp2"] = "Please enter Contact Person OTP."

    # elif not contact_otp_token:
    #    errors["otp2"] = "Please click Send OTP first."

    # elif not verify_contact_person_otp(
    #     email,
    #     ref_otp,
    #     contact_otp_token
    # ):
    #     errors["otp2"] = "Invalid Contact Person OTP"
    #     # return JsonResponse(
    #     #   {
    #     #     "success": False,
    #     #     "message": otp_result["message"]
    #     #   },
    #     #   status=400
    #     # )
    # if not contact_name:
    #     errors["contact_person_name"] = "Contact name required."
    # if not contact_phone:
    #     errors["contact_person_phone"] = "Phone required."
    # if not contact_role:
    #     errors["contact_person_role"] = "Role required."
    

    # print("=" * 60)
    # print("EMAIL =", email)
    # print("CONTACT OTP =", contact_otp)
    # print("CONTACT TOKEN =", contact_otp_token)
    # print("ERRORS =", errors)
    # print("=" * 60)

    if errors:
        return JsonResponse({"success": False, "errors": errors}, status=400)

    user = User.objects.create(
        email=email,
        phone_country_code=phone_country_code,
        phone_number=phone_number,
        password=make_password(data.get("password")),
        user_type="pharmacy"
    )

    state_name = data.get("state")
    city_name = data.get("city")

    state_obj = State.objects.filter(name=state_name).first()

    city_obj = City.objects.filter(
        name=city_name,
        state=state_obj
    ).first()

    profile = PharmacyProfile.objects.create(
        user=user,
        company_name=company_name,
        # pharmacy_type=pharmacy_type,
        # services_offered=services_offered,
        pharmacy_timing=pharmacy_timing,
        personal_email=email,
        website=website,
        address=address,
        country=data.get("country"),
        # city=city,
        # state=state,
        state=state_obj,
        city=city_obj,
        pincode=pincode,
        incorporation_number=incorporation_number,
        incorporation_doc_path=incorporation_doc_path,
        gst_number=gst_number,
        gst_doc_path=gst_doc_path,
        pan_number=pan_number,
        pan_doc_path=pan_doc_path,
        medical_license_number=medical_license_number,
        medical_license_doc_path=medical_license_doc_path,
        storefront_image_path=storefront_image_path,
        referral_code=data.get("referral_code")
    )
    if pharmacy_type:
       profile.pharmacy_types.add(pharmacy_type)

    if services_offered:
       profile.services.add(services_offered)

    ContactPerson.objects.create(
        profile_type="pharmacy",
        profile=user,
        name=contact_name,
        phone_country_code=phone_country_code,
        phone_number=contact_phone,
        role=contact_role,
        otp=ref_otp
    )

    return JsonResponse({"success": True, "message": "Pharmacy registered successfully"})


@csrf_protect
@require_POST
def save_lab(request):
    data = request.POST
    

    print("=" * 50)
    print("CONTACT NAME =", data.get("contact_name"))
    print("CONTACT DESIGNATION =", data.get("contact_designation"))
    print("CONTACT PHONE =", data.get("contact_phone"))
    print("=" * 50)
    files = request.FILES
    errors = {}

    # Required text fields
    required_fields = {
        "email": "Email",
        "password": "Password",
        "confirm_password": "Confirm Password",
        "phone": "Phone Number",
        "lab_name": "Lab Name",
        "owner_name": "Owner Name",
        "lab_registration_number": "Lab Registration Number",
        "lab_timing": "Lab Timing",
        "address": "Address",
        "city": "City",
        "state": "State",
        "pincode": "Pincode",
        "country": "Country",
        "lab_certificate_number": "Lab Certificate Number",
        "aadhaar_number": "Aadhaar Number",
        "pan_number": "PAN Number",
        "gov_license_number": "Gov License Number",
        "contact_name": "Contact Person Name",
        "contact_phone": "Contact Person Phone",
    }

    for field, label in required_fields.items():
        if not data.get(field) or data.get(field).strip() == "":
            errors[field] = f"{label} is required."

    # File required fields
    required_files = {
        "lab_certificate": "Lab Certificate",
        "aadhar_doc": "Aadhar Document",
        "pan_doc": "PAN Document",
        "gov_license": "Gov License Document",
        "lab_photo": "Lab Photo",
    }

    for field, label in required_files.items():
        if field not in files:
            errors[field] = f"{label} is required."

    # Multi-select dropdown validations
    services = data.getlist("services")
    facilities = data.getlist("facilities")

    if len(services) == 0:
        errors["services"] = "Select at least one Lab Service."

    if len(facilities) == 0:
        errors["facilities"] = "Select at least one Lab Facility."

    # Email existence check
    email = data.get("email", "").strip()
    if User.objects.filter(email=email).exists():
        errors["email"] = "Email already registered."

    # Password match
    if data.get("password") != data.get("confirm_password"):
        errors["confirm_password"] = "Passwords do not match."

    if errors:
        return JsonResponse({"success": False, "errors": errors}, status=400)

    # Save uploaded files
    lab_certificate_path, _ = validate_and_save_file(files["lab_certificate"], "lab_certificate", "", "lab")
    aadhar_path, _ = validate_and_save_file(files["aadhar_doc"], "aadhaar", "", "lab")
    pan_path, _ = validate_and_save_file(files["pan_doc"], "pan", "", "lab")
    license_path, _ = validate_and_save_file(files["gov_license"], "license", "", "lab")
    lab_photo_path, _ = validate_and_save_file(files["lab_photo"], "lab_photo", "", "lab")

    # Create User
    user = User.objects.create(
        email=email,
        phone_country_code="+91",
        phone_number=data.get("phone"),
        password=make_password(data.get("password")),
        user_type="lab"
    )

    state_name = data.get("state")
    city_name = data.get("city")

    state_obj = State.objects.filter(name=state_name).first()

    city_obj = City.objects.filter(
       name=city_name,
       state=state_obj
    ).first()

    # Create Lab Profile
    lab = LabProfile.objects.create(
        user=user,
        lab_name=data.get("lab_name"),
        owner_name=data.get("owner_name"),
        contact_number=data.get("phone"),
        alt_contact_number=data.get("alt_phone"),
        lab_registration_number=data.get("lab_registration_number"),
        lab_certificate_number=data.get("lab_certificate_number"),
        identity_proof_aadhar_number=data.get("aadhaar_number"),
        identity_proof_pan_number=data.get("pan_number"),
        gov_license_number=data.get("gov_license_number"),
        address=data.get("address"),
        city=city_obj,
        state=state_obj,
        # city=data.get("city"),
        # state=data.get("state"),
        pincode=data.get("pincode"),
        country=data.get("country"),
        lab_timing_id=data.get("lab_timing"),
        lab_certificate_path=lab_certificate_path,
        identity_proof_aadhar_path=aadhar_path,
        identity_proof_pan_path=pan_path,
        gov_license_path=license_path,
        lab_photo_path=lab_photo_path,
        referral_code=data.get("referral_code") if data.get("referral_code") else None,
    )

    # # Many-to-Many — Services
    # for sid in services:
    #     LabProfileServices.objects.create(lab=lab, service_id=sid)
    for item in services:
        ids = item.split(",")

        for sid in ids:
          sid = sid.strip()

          if sid:
            LabProfileServices.objects.create(
                lab=lab,
                service_id=int(sid)
            )

    # # Many-to-Many — Facilities
    # for fid in facilities:
    #     LabProfileFacilities.objects.create(lab=lab, facility_id=fid)
    for item in facilities:
        ids = item.split(",")

        for fid in ids:
          fid = fid.strip()

          if fid:
            LabProfileFacilities.objects.create(
                lab=lab,
                facility_id=int(fid)
            )

    # Contact Person
    print("========== CONTACT DATA ==========")
    print("contact_name =", data.get("contact_name"))
    print("contact_phone =", data.get("contact_phone"))
    print("contact_designation =", data.get("contact_designation"))
    print("=================================")
    # ContactPerson.objects.create(
    #     profile_type="lab",
    #     profile=user,
    #     name=data.get("contact_name"),
    #     phone_country_code="+91",
    #     role=data.get("contact_designation"),
    #     phone_number=data.get("contact_phone"),
    # )

    return JsonResponse({"success": True, "message": "Lab registered successfully!"})

@csrf_protect
@require_POST
def save_hospital(request):
    data = request.POST
    files = request.FILES
    print("=" * 100)
    print("FILES =", request.FILES)
    print("=" * 100)
    errors = {}

    required_fields = {
        "hospital_name": "Hospital Name",
        "email": "Email",
        "password": "Password",
        "confirm_password": "Confirm Password",
        "owner_name": "Owner Name",
        "phone": "Phone Number",
        "address": "Address",
        "city": "City",
        "state": "State",
        "pincode": "Pincode",
        "country": "Country",
        "hospital_timing": "Hospital Timing",
        "registration_no": "Registration Number",
        "aadhar_card_no": "Aadhar Number",
        "pan_card_no": "PAN Number",
        "contact_name": "Contact Person Name",
        "contact_phone": "Contact Person Phone",
        "contact_role": "Contact Person Role",
    }

    for field, label in required_fields.items():
        if not data.get(field):
            errors[field] = f"{label} is required."

    if data.get("password") != data.get("confirm_password"):
        errors["confirm_password"] = "Passwords do not match."

    email = data.get("email", "").strip()
    if not email:
        errors["email"] = "Email is required."
    else:
        try:
            validate_email(email)
        except ValidationError:
            errors["email"] = "Invalid email."
        if User.objects.filter(email=email).exists():
            errors["email"] = "Email already registered."

    # otp_token = data.get("otp_token")
    # print("OTP TOKEN =", otp_token)
    # print("OTP1 =", email_otp)
    # print("CACHE =", cache.get(f"otp:{otp_token}"))
    # email_otp = data.get("otp1")
    # otp_verification = verify_otp_token(email, email_otp, otp_token)
    # print("Bearer =", bearer_token)
    # print("Cache =", otp_data)
    # print("Email =", email) 
    # print("OTP =", otp)
    # email_otp = data.get("otp1")
    email_otp = data.get("otp1", "").strip()
    otp_token = data.get("otp_token")

    print("=" * 50)
    print("OTP TOKEN FROM FORM =", repr(otp_token))
    print("OTP FROM FORM =", repr(email_otp))
    print("CACHE =", cache.get(f"otp:{otp_token}"))
    print("=" * 50)

    otp_verification = verify_otp_token(email, email_otp, otp_token)


    print("VERIFY RESULT =", otp_verification)
    if not otp_verification["success"]:
        errors["otp1"] = otp_verification["message"]
    # contact_otp = data.get("otp2")
    # contact_otp_token = data.get("contact_otp_token")

    # if not verify_contact_person_otp(email,contact_otp, contact_otp_token):
    #    errors["otp2"] = "Invalid Contact Person OTP"
    # contact_otp = data.get("otp2", "").strip()
    # contact_otp_token = data.get("contact_otp_token")

    # if not contact_otp:
    #    errors["otp2"] = "Please enter Contact Person OTP."

    # elif not contact_otp_token:
    #    errors["otp2"] = "Please click Send OTP first."

    # elif not verify_contact_person_otp(
    #     email,
    #     contact_otp,
    #     contact_otp_token
    # ):
    #   errors["otp2"] = "Invalid Contact Person OTP"

    pincode = data.get("pincode", "")
    if pincode and not re.match(r"^\d{4,10}$", pincode):
        errors["pincode"] = "Enter a valid pincode."

    reg_doc_path, reg_err = validate_and_save_file(
        files.get("registration_doc"),
        "registration",
        "Registration Document",
        "hospital",
    )
    if reg_err:
        errors["registration_doc"] = reg_err

    aadhar_doc_path, aad_err = validate_and_save_file(
        files.get("aadhar_doc"),
        "aadhar",
        "Aadhar Document",
        "hospital",
    )
    if aad_err:
        errors["aadhar_doc"] = aad_err

    pan_doc_path, pan_err = validate_and_save_file(
        files.get("pan_doc"),
        "pan",
        "PAN Document",
        "hospital",
    )
    if pan_err:
        errors["pan_doc"] = pan_err

    logo_path, logo_err = validate_and_save_file(
        files.get("logo"),
        "hospital_logo",
        "Hospital Logo",
        "hospital",
    )
    if logo_err:
        errors["logo"] = logo_err

    photo_path, photo_err = validate_and_save_file(
        files.get("photo"),
        "hospital_photo",
        "Hospital Photo",
        "hospital",
    )
    if photo_err:
        errors["photo"] = photo_err
    print("=" * 100)
    print("POST DATA =", request.POST)
    print("ERRORS =", errors)
    print("=" * 100)

    if errors:
        return JsonResponse({"success": False, "errors": errors}, status=400)

    user = User.objects.create(
        email=email,
        phone_country_code="+91",
        phone_number=data.get("phone"),
        password=make_password(data.get("password")),
        user_type="hospital",
    )

    home_visit_value = data.get("home_visit", "").strip()
    home_visit_bool = home_visit_value == "Available"


    state_name = data.get("state")
    city_name = data.get("city")

    state_obj = State.objects.filter(name=state_name).first()

    city_obj = City.objects.filter(
       name=city_name,
       state=state_obj
    ).first()

    hospital = HospitalProfile.objects.create(
        user=user,
        hospital_name=data.get("hospital_name"),
        owner_name=data.get("owner_name"),
        contact_no=data.get("phone"),
        alternate_contact_no=data.get("alt_phone"),
        address=data.get("address"),
        # city=data.get("city"),
        # state=data.get("state"),
        state=state_obj,
        city=city_obj,
        pincode=data.get("pincode"),
        country=data.get("country"),
        hospital_timing_id=data.get("hospital_timing"),
        home_visit=home_visit_bool,
        registration_no=data.get("registration_no"),
        registration_certificate_path=reg_doc_path,
        registration_doc_virus_scanned=True,
        aadhar_card_no=data.get("aadhar_card_no"),
        aadhar_doc_path=aadhar_doc_path,
        aadhar_doc_virus_scanned=True,
        pan_card_no=data.get("pan_card_no"),
        pan_doc_path=pan_doc_path,
        pan_doc_virus_scanned=True,
        hospital_logo_path=logo_path,
        hospital_logo_virus_scanned=True,
        hospital_photo_path=photo_path,
        hospital_photo_virus_scanned=True,
        referral_code=data.get("referral_code"),
        phone_for_otp=data.get("phone"),
    )

    ContactPerson.objects.create(
        profile_type="hospital",
        profile=user,
        name=data.get("contact_name"),
        phone_country_code="+91",
        phone_number=data.get("contact_phone"),
        role=data.get("contact_role"),
    )

    return JsonResponse({"success": True, "message": "Hospital registered successfully!"})

@csrf_protect
@require_POST
def save_doctor(request):
    data = request.POST
    files = request.FILES
    errors = {}
    email = data.get("email", "").strip()
    password = data.get("password")
    confirm_password = data.get("confirm_password")
    full_name = data.get("full_name")
    gender = data.get("gender")
    age = data.get("age")
    phone = data.get("phone")
    alt_phone = data.get("alt_phone")
    clinic_name = data.get("clinic_name")
    owner_name = data.get("owner_name")
    address = data.get("address")
    city = data.get("city")
    state = data.get("state")
    pincode = data.get("pincode")
    country = data.get("country")
    timing_from = data.get("clinic_timing_from")
    timing_to = data.get("clinic_timing_to")
    home_visit = data.get("home_visit_available") == "true"
    if not email:
        errors["email"] = "Email is required."
    else:
        try:
            validate_email(email)
        except ValidationError:
            errors["email"] = "Invalid email."
        if User.objects.filter(email=email).exists():
            errors["email"] = "Email already registered."

    otp_token = data.get("otp_token")
    email_otp = data.get("otp1")
    otp_verification = verify_otp_token(email, email_otp, otp_token)
    if not otp_verification["success"]:
        errors["otp1"] = otp_verification["message"]
    if not password or len(password) < 8:
        errors["password"] = "Password must be at least 8 characters."
    if password != confirm_password:
        errors["confirm_password"] = "Passwords do not match."
    if not full_name:
        errors["full_name"] = "Full name required."
    if not gender:
        errors["gender"] = "Gender is required."
    if not age:
        errors["age"] = "Age required."
    if not phone:
        errors["phone"] = "Phone number required."
    if not clinic_name:
        errors["clinic_name"] = "Clinic name required."
    if not owner_name:
        errors["owner_name"] = "Owner name required."
    if not address:
        errors["address"] = "Address required."
    if not city:
        errors["city"] = "City required."
    if not state:
        errors["state"] = "State required."
    if not pincode or not re.match(r"^\d{4,10}$", pincode):
        errors["pincode"] = "Enter valid pincode."
    specialty_id = data.get("specialization")
    education_id = data.get("qualification")
    experience_id = data.get("experience")

    try:
        specialty = DoctorSpeciality.objects.get(id=specialty_id)
    except:
        errors["specialization"] = "Specialization is required."

    try:
        education = DoctorEducation.objects.get(id=education_id)
    except:
        errors["qualification"] = "Qualification is required."

    try:
        experience = DoctorExperience.objects.get(id=experience_id)
    except:
        errors["experience"] = "Experience selection required."

    reg_number = data.get("registration_number")
    reg_doc_path, err = validate_and_save_file(files.get("registration_doc"), "doctor_registration", "Registration Certificate", "doctor")
    if err or not reg_doc_path:
        errors["registration_doc"] = "Registration certificate required."

    aadhar_number = data.get("aadhar_number")
    aadhar_path, err = validate_and_save_file(files.get("aadhar_doc"), "doctor_aadhar", "Aadhar Document", "doctor")
    if err or not aadhar_path:
        errors["aadhar_doc"] = "Aadhar document required."

    pan_number = data.get("pan_number")
    pan_path, err = validate_and_save_file(files.get("pan_doc"), "doctor_pan", "PAN Document", "doctor")
    if err or not pan_path:
        errors["pan_doc"] = "PAN document required."

    clinic_logo_path, err = validate_and_save_file(files.get("clinic_logo"), "clinic_logo", "Clinic Logo", "doctor")
    if err or not clinic_logo_path:
        errors["clinic_logo"] = "Clinic logo required."

    profile_photo_path, err = validate_and_save_file(files.get("profile_photo"), "doctor_profile_photo", "Profile Photo", "doctor")
    if err or not profile_photo_path:
        errors["profile_photo"] = "Profile photo required."

    clinic_photo_path, err = validate_and_save_file(files.get("clinic_photo"), "clinic_photo", "Clinic Photo", "doctor")
    if err or not clinic_photo_path:
        errors["clinic_photo"] = "Clinic photo required."
    contact_name = data.get("contact_name")
    contact_role = data.get("contact_role")
    contact_phone = data.get("contact_phone")
    referral_code = data.get("referral_code")

    # if not contact_name:
    #     errors["contact_name"] = "Contact person name required."

    # if not contact_role:
    #     errors["contact_role"] = "Contact person role required."

    if errors:
        return JsonResponse({"success": False, "errors": errors}, status=400)

    user = User.objects.create(
        email=email,
        phone_country_code="+91",
        phone_number=phone,
        password=make_password(password),
        user_type="doctor",
    )

    state_name = data.get("state")
    city_name = data.get("city")

    state_obj = State.objects.filter(name=state_name).first()

    city_obj = City.objects.filter(
        name=city_name,
        state=state_obj
    ).first()

    DoctorProfile.objects.create(
        user=user,
        full_name=full_name,
        gender=gender,
        age=age,
        clinic_name=clinic_name,
        owner_name=owner_name,
        contact_number=phone,
        alt_contact_number=alt_phone,
        specialty=specialty,
        education=education,
        experience=experience,
        full_address=address,
        # city=city,
        # state=state,
        state=state_obj,
        city=city_obj,
        pincode=pincode,
        country=country,
        clinic_timing_from=timing_from,
        clinic_timing_to=timing_to,
        home_visit_available=home_visit,
        registration_number=reg_number,
        registration_certificate_path=reg_doc_path,
        registration_certificate_virus_scanned=True,
        aadhar_number=aadhar_number,
        aadhar_doc_path=aadhar_path,
        aadhar_doc_virus_scanned=True,
        pan_number=pan_number,
        pan_doc_path=pan_path,
        pan_doc_virus_scanned=True,
        clinic_logo_path=clinic_logo_path,
        clinic_logo_virus_scanned=True,
        profile_photo_path=profile_photo_path,
        profile_photo_virus_scanned=True,
        clinic_photo_path=clinic_photo_path,
        clinic_photo_virus_scanned=True,
        referral_code=referral_code,
        otp=data.get("otp1")
    )

    # ContactPerson.objects.create(
    #     profile_type="doctor",
    #     profile=user,
    #     name=contact_name,
    #     phone_country_code="+91",
    #     phone_number=contact_phone,
    #     role=contact_role,
    #     email_otp=data.get("otp2"),
    #     referral_code=referral_code,
    # )

    return JsonResponse({"success": True, "message": "Doctor registered successfully!"})


@csrf_protect
def forgot_password(request):
    if request.method == "POST":
        email = request.POST.get("email")
        if not email:
            return JsonResponse({"success": False, "errors": {"email": "Email is required"}}, status=400)

        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            return JsonResponse({"success": False, "errors": {"email": "User not found"}}, status=404)

        company_name = "Account"

        if user.user_type == "advertiser" and hasattr(user, "advertiserprofile"):
            company_name = user.advertiserprofile.company_name

        elif user.user_type == "client" and hasattr(user, "clientprofile"):
            company_name = user.clientprofile.company_name

        elif user.user_type == "ngo" and hasattr(user, "ngoprofile"):
            company_name = user.ngoprofile.ngo_name

        elif user.user_type == "pharmacy" and hasattr(user, "pharmacyprofile"):
            company_name = user.pharmacyprofile.company_name

        elif user.user_type == "hospital" and hasattr(user, "hospital_profile"):
            company_name = user.hospital_profile.hospital_name

        elif user.user_type == "lab" and hasattr(user, "lab_profile"):
            company_name = user.lab_profile.lab_name

        elif user.user_type == "doctor" and hasattr(user, "doctor_profile"):
            company_name = user.doctor_profile.clinic_name

        base_url = "https://medcrm.aibuzz.net"

        result = async_to_sync(send_forgot_password_email)(
            user,
            company_name,
            base_url
        )
        return JsonResponse(result)

    return render(request, "login/forgot_password.html")

@csrf_protect
def reset_password(request, token):
    try:
        token_obj = PasswordResetToken.objects.get(token=token)
    except PasswordResetToken.DoesNotExist:
        return render(request, "not_found.html", {"error": "Invalid or expired reset link."}, status=404)

    if not token_obj.is_valid():
        token_obj.delete()
        return render(request, "not_found.html", {"error": "This reset link has expired."}, status=400)

    if request.method == "POST":
        password = request.POST.get("NewPassword")
        confirm_password = request.POST.get("ConfirmPassword")
        errors = {}

        if not password or password != confirm_password:
            errors["confirm_password"] = "Passwords do not match."

        if not password or len(password) < 8:
            errors["password"] = "Password must be at least 8 characters."

        if errors:
            return render(request, "login/reset_password.html", {"token": token, "errors": errors})
        
        user = token_obj.user
        user.password = make_password(password)
        user.save()

        token_obj.delete()
        return redirect("login_page")
    return render(request, "login/reset_password.html", {"token": token})

# def file_scan(file_obj):

#     try:
#         file_obj.seek(0)

#         files = {
#             "file": (
#                 file_obj.name,
#                 file_obj.read(),
#                 file_obj.content_type
#             )
#         }

#         response = requests.post(
#             "http://122.170.111.109:8090/scan",
#             files=files,
#             timeout=60
#         )

#         if response.status_code != 200:
#             return False, "Virus scan service unavailable"

#         result = response.json()
#         print("CLAMAV RESPONSE =", result)

#         return result.get("safe", False), result.get(
#             "message",
#             "Virus scan failed"
#         )

#     except Exception as e:
#         return False, str(e)



def file_scan(file_obj):
    """
    Scan uploaded file using the virus scanning service.

    Returns:
        (True, message)  -> file is safe
        (False, message) -> file is unsafe OR scanner unavailable

    IMPORTANT:
    We fail closed. If the scanner is unavailable,
    the file must NOT be accepted.
    """

    try:
        file_obj.seek(0)

        file_content = file_obj.read()

        if not file_content:
            return False, "The uploaded file is empty."

        files = {
            "file": (
                file_obj.name,
                file_content,
                getattr(file_obj, "content_type", None)
                or "application/octet-stream",
            )
        }

        response = requests.post(
            VIRUS_SCAN_URL,
            files=files,
            timeout=30,
        )

        # Scanner did not respond successfully
        if response.status_code != 200:
            logger.error(
                "Virus scanner returned HTTP %s: %s",
                response.status_code,
                response.text[:500],
            )

            return False, "Virus scanner unavailable. Please try again."

        try:
            result = response.json()
        except ValueError:
            logger.error(
                "Virus scanner returned invalid JSON: %s",
                response.text[:500],
            )

            return False, "Invalid response from virus scanner."

        safe = result.get("safe")

        message = result.get(
            "message",
            "File scanned successfully."
        )

        # IMPORTANT:
        # Do NOT default safe to True.
        if safe is True:
            return True, message

        if safe is False:
            return False, message or "Virus detected in uploaded file."

        # Missing/invalid "safe" field
        logger.error(
            "Invalid virus scanner response: %s",
            result,
        )

        return False, "Invalid virus scanner response."

    except requests.Timeout:
        logger.exception("Virus scanner timeout")

        return False, "Virus scanner timed out. Please try again."

    except requests.RequestException:
        logger.exception("Virus scanner connection error")

        return False, "Unable to connect to virus scanner."

    except Exception:
        logger.exception("Unexpected virus scanning error")

        return False, "Virus scan failed. Please try again."

    finally:
        try:
            file_obj.seek(0)
        except Exception:
            pass


@require_POST
def file_scan_api(request):

    uploaded_file = request.FILES.get("file")

    if not uploaded_file:
        return JsonResponse(
            {
                "safe": False,
                "message": "No file uploaded."
            },
            status=400
        )

    safe, message = file_scan(uploaded_file)

    print("FILE SCAN STATUS =", safe)
    print("FILE SCAN MESSAGE =", message)

    if safe:
        return JsonResponse({
            "safe": True,
            "message": message or "Virus scan passed."
        })

    return JsonResponse(
        {
            "safe": False,
            "message": message or "File rejected."
        },
        status=400
    )

@csrf_protect
@require_POST
def send_contact_person_otp(request):

    phone = request.POST.get("phone")

    if not phone:
        return JsonResponse(
            {
                "success": False,
                "message": "Phone is required."
            },
            status=400
        )

    otp_secret = generate_otp_secret()

    otp = generate_otp(otp_secret)

    print("="*50)
    print("CONTACT PERSON OTP =", otp)
    print("PHONE =", phone)
    print("="*50)
    cache.set(
        f"otp:{otp_secret}",
        {
            "phone": phone,
            "secret": otp_secret,
            "created_at": timezone.now().isoformat()
        },
        timeout=600
    )

    return JsonResponse(
        {
            "success": True,
            "otp_token": otp_secret,
            "message": "OTP Sent Successfully"
        }
    )
# def verify_contact_person_otp(otp, token):

#     otp_data = cache.get(f"otp:{token}")

#     if not otp_data:
#         return False

#     secret = otp_data["secret"]

#     return verify_totp(secret, otp)


# def verify_contact_person_otp(email, otp, token):

#     print("=" * 50)
#     print("CONTACT PERSON OTP VERIFY")
#     print("EMAIL =", email)
#     print("TOKEN =", token)
#     print("OTP =", otp)

#     result = verify_otp_token(email, otp, token)

#     print("VERIFY RESULT =", result)
#     print("=" * 50)

#     return result["success"]
def verify_contact_person_otp(email, otp, token):

    print("=" * 60)
    print("VERIFY CONTACT OTP")
    print("EMAIL =", email)

    otp = str(otp).strip()

    otp_data = cache.get(f"otp:{token}")

    print("CACHE DATA =", otp_data)

    if not otp_data:
        print("CACHE NOT FOUND")
        return False

    secret = str(otp_data["secret"]).strip()

    print("SECRET =", repr(secret))
    print("OTP RECEIVED =", repr(otp))

    # 👇 Ye 2 line add karo
    current_otp = generate_otp(secret)
    print("CURRENT OTP =", current_otp)

    result = verify_totp(secret, otp)

    print("VERIFY RESULT =", result)
    print("=" * 60)

    return result

# new login code by laxmi --------------------------------------- 
@csrf_protect
@require_POST
def save_user(request):
    
    data = request.POST
    errors = {}         
    
    user_type = data.get("user_type")
    phone_country_code = data.get("phone_country_code")
    phone_number = data.get("phone_number")
    
    # Validate phone number
    if not phone_number or not re.match(r"^\d{10}$", phone_number):
        errors["phone_number"] = "Enter a valid phone number (10 digits)."   
    
    # Check if phone number already exists
    if User.objects.filter(phone_number=phone_number).exists():
        errors["phone_number"] = "This phone number is already registered." 

    # If any errors, return as JSON
    if errors:
        return JsonResponse({"success": False, "errors": errors}, status=400)

    user = User.objects.create(
        phone_country_code=phone_country_code,
        phone_number = phone_number,
        user_type = user_type
    )    
    return JsonResponse({"success": True, "message": "User registered successfully."})

@csrf_protect
@require_POST
def login_auth(request):

    phone_number = request.POST.get("phone_number")

    if not phone_number:
        return JsonResponse({
            "success": False,
            "message": "Phone number is required."
        }, status=400)

    try:
        user = User.objects.get(phone_number=phone_number)

    except User.DoesNotExist:
        return JsonResponse({
            "success": False,
            "message": "Phone number not found."
        }, status=404)

    allowed_user_types = [
        "user",
        "hospital",
        "doctor",
        "lab",
        "pharmacy",
    ]

    if user.user_type not in allowed_user_types:
        return JsonResponse({
            "success": False,
            "message": "This account type is not allowed to login."
        }, status=403)

    if not user.is_active:
        return JsonResponse({
            "success": False,
            "message": "Your account is inactive."
        }, status=403)

    # Store user id in session
    request.session["user_id"] = user.id

    return JsonResponse({
        "success": True,
        "redirect": reverse("dashboard")
    })
    
# @csrf_protect
# @require_POST
# def verify_login_otp(request):

#     phone_number = request.POST.get("phone_number")
#     otp = request.POST.get("otp")

#     if otp != "123456":
#         return JsonResponse({
#             "success": False,
#             "message": "Invalid OTP."
#         })

#     try:
#         user = User.objects.get(
#             phone_number=phone_number
#         )

#         allowed_user_types = [
#             "user",
#             "pharmacy",
#             "lab",
#             "doctor",
#             "hospital"
#         ]

#         if user.user_type not in allowed_user_types:
#             return JsonResponse({
#                 "success": False,
#                 "message": "This account type is not allowed."
#             })

#         if not user.is_active:
#             return JsonResponse({
#                 "success": False,
#                 "message": "Your account is inactive."
#             })

#         # Save session
#         request.session["user_id"] = user.id

#         user.last_login = timezone.now()
#         user.save(update_fields=["last_login"])

#         # Get user ID and type
#         user_id = user.id
#         user_type = user.user_type

#         # HOSPITAL
#         if user_type == "hospital":
            
#             try:
#                 hospital_profile = HospitalProfile.objects.get(
#                     user_id=user_id
#                 )
#             except HospitalProfile.DoesNotExist:

#                 return JsonResponse({
#                     "success": True,
#                     "kyc_required": True,
#                     "kyc_step": 1,
#                     "message": "Please complete hospital profile.",
#                     "redirect": reverse("hospital_kyc")
#                 })

#             contact_exists = ContactPerson.objects.filter(
#                 profile_id=user_id,
#                 profile_type="hospital"
#             ).exists()

#             if not contact_exists:

#                 return JsonResponse({
#                     "success": True,
#                     "kyc_required": True,
#                     "kyc_step": 2,
#                     "message": "Please complete contact person details.",
#                     "redirect": reverse("hospital_kyc")
#                 })

#             step3_complete = all([
#                 hospital_profile.registration_no,
#                 hospital_profile.registration_certificate_path,

#                 hospital_profile.aadhar_card_no,
#                 hospital_profile.aadhar_doc_path,

#                 hospital_profile.pan_card_no,
#                 hospital_profile.pan_doc_path,

#                 hospital_profile.hospital_logo_path,
#                 hospital_profile.hospital_photo_path,
#             ])

#             if not step3_complete:

#                 return JsonResponse({
#                     "success": True,
#                     "kyc_required": True,
#                     "kyc_step": 3,
#                     "message": "Please complete hospital document KYC.",
#                     "redirect": reverse("hospital_kyc")
#                 })

#             return JsonResponse({
#                 "success": True,
#                 "kyc_required": False,
#                 "message": "Login Successful",
#                 "redirect": reverse("dashboard")
#             })

#         return JsonResponse({
#             "success": True,
#             "kyc_required": False,
#             "message": "Login Successful",
#             "redirect": reverse("dashboard")
#         })

#     except User.DoesNotExist:

#         return JsonResponse({
#             "success": False,
#             "message": "User not found."
#         })

@csrf_protect
@require_POST
def verify_login_otp(request):

    phone_number = request.POST.get("phone_number")
    otp = request.POST.get("otp")

    if otp != "123456":
        return JsonResponse({
            "success": False,
            "message": "Invalid OTP."
        })

    try:
        user = User.objects.get(
            phone_number=phone_number
        )

    except User.DoesNotExist:

        return JsonResponse({
            "success": False,
            "message": "User not found."
        })

    allowed_user_types = [
        "user",
        "pharmacy",
        "lab",
        "doctor",
        "hospital"
    ]

    if user.user_type not in allowed_user_types:

        return JsonResponse({
            "success": False,
            "message": "This account type is not allowed."
        })

    if not user.is_active:

        return JsonResponse({
            "success": False,
            "message": "Your account is inactive."
        })

    request.session["user_id"] = user.id
    try:
        if user.email:

            # Get user type
            user_type = (user.user_type or "user").replace("_", " ").title()

            send_mail(
                subject="New Sign-In to MedOCR CRM",
                message=(
                    "Hello,\n\n"
                    "Your MedOCR CRM account was successfully signed in \n"
                    f"Account Type: {user_type}\n"
                    f"Email: {user.email}\n"
                    f"Phone Number: {user.phone_number}\n\n"
                    "If this was not you, please contact support.\n\n"
                ),
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[user.email],
                fail_silently=False,
            )

            print("Sign-in email sent to:", user.email)

    except Exception as e:
        print("Sign-in email error:", e)
    user.last_login = timezone.now()
    user.save(update_fields=["last_login"])

    user_id = user.id
    user_type = user.user_type

    if user_type == "hospital":

        kyc_result = check_hospital_kyc(user_id)

        return JsonResponse({
            "success": True,
            **kyc_result
        })

    if user_type == "doctor":

        kyc_result = check_doctor_kyc(user_id)

        return JsonResponse({
            "success": True,
            **kyc_result
        })

    if user_type == "lab":

        kyc_result = check_lab_kyc(user_id)

        return JsonResponse({
            "success": True,
            **kyc_result
        })
        
    if user_type == "pharmacy":

        kyc_result = check_pharmacy_kyc(user_id)

        return JsonResponse({
            "success": True,
            **kyc_result
        })

    return JsonResponse({
        "success": True,
        "kyc_required": False,
        "message": "Login Successful",
        "redirect": reverse("dashboard")
    })

def check_hospital_kyc(user_id):
    
    try:
        hospital_profile = HospitalProfile.objects.get(
            user_id=user_id
        )
    except HospitalProfile.DoesNotExist:

        return {
            "kyc_required": True,
            "kyc_step": 1,
            "message": "Please complete hospital profile.",
            "redirect": reverse("hospital_kyc")
        }

    contact_exists = ContactPerson.objects.filter(
        profile_id=user_id,
        profile_type="hospital"
    ).exists()

    if not contact_exists:

        return {
            "kyc_required": True,
            "kyc_step": 2,
            "message": "Please complete contact person details.",
            "redirect": reverse("hospital_kyc")
        }

    step3_complete = all([
        hospital_profile.registration_no,
        hospital_profile.registration_certificate_path,

        hospital_profile.aadhar_card_no,
        hospital_profile.aadhar_doc_path,

        hospital_profile.pan_card_no,
        hospital_profile.pan_doc_path,

        hospital_profile.hospital_logo_path,
        hospital_profile.hospital_photo_path,
    ])

    if not step3_complete:

        return {
            "kyc_required": True,
            "kyc_step": 3,
            "message": "Please complete hospital document KYC.",
            "redirect": reverse("hospital_kyc")
        }

    return {
        "kyc_required": False,
        "kyc_step": 0,
        "message": "Login Successful",
        "redirect": reverse("dashboard")
    }

def check_doctor_kyc(user_id):

    try:
        doctor_profile = DoctorProfile.objects.get(
            user_id=user_id
        )
    except DoctorProfile.DoesNotExist:

        return {
            "kyc_required": True,
            "kyc_step": 1,
            "message": "Please complete doctor profile.",
            "redirect": reverse("doctor_kyc")
        }

    contact_exists = ContactPerson.objects.filter(
        profile_id=user_id,
        profile_type="doctor"
    ).exists()

    if not contact_exists:

        return {
            "kyc_required": True,
            "kyc_step": 2,
            "message": "Please complete contact person details.",
            "redirect": reverse("doctor_kyc")
        }

    step3_complete = all([
        doctor_profile.registration_number,
        doctor_profile.registration_certificate_path,

        doctor_profile.aadhar_number,
        doctor_profile.aadhar_doc_path,

        doctor_profile.pan_number,
        doctor_profile.pan_doc_path,

        doctor_profile.clinic_logo_path,
        doctor_profile.clinic_photo_path,
    ])
    
    if not step3_complete:

        return {
            "kyc_required": True,
            "kyc_step": 3,
            "message": "Please complete document KYC.",
            "redirect": reverse("doctor_kyc")
        }

    return {
        "kyc_required": False,
        "kyc_step": 0,
        "message": "Login Successful",
        "redirect": reverse("dashboard")
    }
    
def check_lab_kyc(user_id):

    try:
        lab_profile = LabProfile.objects.get(
            user_id=user_id
        )
    except LabProfile.DoesNotExist:

        return {
            "kyc_required": True,
            "kyc_step": 1,
            "message": "Please complete lab profile.",
            "redirect": reverse("lab_kyc")
        }

    # --------------------------------------------------------
    # Contact Person
    # --------------------------------------------------------

    contact_exists = ContactPerson.objects.filter(
        profile_id=user_id,
        profile_type="lab"
    ).exists()

    if not contact_exists:

        return {
            "kyc_required": True,
            "kyc_step": 2,
            "message": "Please complete contact person details.",
            "redirect": reverse("lab_kyc")
        }

    # --------------------------------------------------------
    # Documents
    # --------------------------------------------------------

    step3_complete = all([
        lab_profile.lab_certificate_number,
        lab_profile.lab_certificate_path,

        lab_profile.identity_proof_aadhar_number,
        lab_profile.identity_proof_aadhar_path,

        lab_profile.identity_proof_pan_number,
        lab_profile.identity_proof_pan_path,

        lab_profile.gov_license_number,
        lab_profile.gov_license_path,

        lab_profile.lab_photo_path,
    ])

    if not step3_complete:

        return {
            "kyc_required": True,
            "kyc_step": 3,
            "message": "Please complete lab document KYC.",
            "redirect": reverse("lab_kyc")
        }

    return {
        "kyc_required": False,
        "kyc_step": 0,
        "message": "Login Successful",
        "redirect": reverse("dashboard")
    }
   				
def check_pharmacy_kyc(user_id):

    try:
        pharmacy_profile = PharmacyProfile.objects.get(
            user_id=user_id
        )
    except PharmacyProfile.DoesNotExist:

        return {
            "kyc_required": True,
            "kyc_step": 1,
            "message": "Please complete pharmacy profile.",
            "redirect": reverse("pharmacy_kyc")
        }

    contact_exists = ContactPerson.objects.filter(
        profile_id=user_id,
        profile_type="pharmacy"
    ).exists()

    if not contact_exists:

        return {
            "kyc_required": True,
            "kyc_step": 2,
            "message": "Please complete contact person details.",
            "redirect": reverse("doctor_kyc")
        }

    step3_complete = all([
        pharmacy_profile.pharmacy_registration_number,
        pharmacy_profile.incorporation_doc_path,

        pharmacy_profile.pan_number,
        pharmacy_profile.pan_doc_path,
        
        pharmacy_profile.tan_number,
        pharmacy_profile.tan_doc_path,
        
        pharmacy_profile.gst_number,
        pharmacy_profile.gst_doc_path,

        pharmacy_profile.storefront_image_path,
    ])
    
    if not step3_complete:

        return {
            "kyc_required": True,
            "kyc_step": 3,
            "message": "Please complete document KYC.",
            "redirect": reverse("doctor_kyc")
        }

    return {
        "kyc_required": False,
        "kyc_step": 0,
        "message": "Login Successful",
        "redirect": reverse("dashboard")
    }
    

@csrf_protect
@require_POST
def check_phone(request):
    phone_number = request.POST.get("phone_number")

    if not phone_number:
        return JsonResponse({
            "success": False,
            "message": "Phone number is required."
        }, status=400)

    if User.objects.filter(phone_number=phone_number).exists():
        return JsonResponse({
            "success": False,
            "message": "Phone number already exists."
        }, status=400)

    return JsonResponse({
        "success": True
    })

# state, city section 
def get_states(request):
    country_id = request.GET.get("country_id")

    if not country_id:
        return JsonResponse({
            "success": False,
            "states": []
        })

    states = State.objects.filter(
        country_id=country_id
    ).order_by("name")

    state_list = [
        {
            "id": state.id,
            "name": state.name
        }
        for state in states
    ]

    return JsonResponse({
        "success": True,
        "states": state_list
    })
    
def get_cities(request):
    state_id = request.GET.get("state_id")

    if not state_id:
        return JsonResponse({
            "success": False,
            "message": "State ID is required."
        }, status=400)

    cities = City.objects.filter(
        state_id=state_id,
        is_active=True
    ).order_by("name")

    city_list = [
        {
            "id": city.id,
            "name": city.name
        }
        for city in cities
    ]

    return JsonResponse({
        "success": True,
        "cities": city_list
    })    
 
# hospital section    	
def hospital_kyc(request):
    return render(request, 'registration/kyc_hospital.html')

def hospital_profile_verification(request):
    user_id = request.session.get("user_id")
    if not user_id:
        return redirect("login")

    try:
        user = User.objects.get(id=user_id)
    except User.DoesNotExist:
        request.session.flush()
        return redirect("login")

    phone_number = user.phone_number
    phone_country_code = user.phone_country_code
    
    hospital_times = HospitalTiming.objects.filter(
        is_active=1
    ).order_by("name")
    
    hospital_types = HospitalType.objects.filter(
        status=1
    ).order_by("name")
    
    hospital_services = HospitalService.objects.filter(
        status=1
    ).order_by("name")
    
    countries = CountryOption.objects.filter(
        is_active=1
    ).order_by("name")
    
    hospital_profile = HospitalProfile.objects.filter(
        user_id=user.id
    ).first()
    
    contact_person = ContactPerson.objects.filter(
        profile_id=user.id
    ).first()
    
    return render(
        request, 
        'registration/kyc_hospital_profile.html', 
        {
            "hospital_types": hospital_types,
            "hospital_times": hospital_times,
            "hospital_services": hospital_services,
            "phone_number": phone_number,
            "phone_country_code": phone_country_code,
            "countries": countries,
            "hospital_profile": hospital_profile,
            "contact_person": contact_person,
        }
    )

def hospital_profile_review(request):
    return render(request, 'registration/kyc_hospital_profile_review.html')
           
@csrf_protect
@require_POST
def save_hospital_profile(request):

    step = request.POST.get("step")

    if not step:
        return JsonResponse({
            "success": False,
            "message": "Step is required."
        }, status=400)

    if step == "1":
        return save_hospital_step_1(request)

    elif step == "2":
        return save_hospital_step_2(request)

    elif step == "3":
        return save_hospital_step_3(request)

    return JsonResponse({
        "success": False,
        "message": "Invalid step."
    }, status=400)
    
def save_hospital_step_1(request):

    user_id = request.session.get("user_id")
    
    if not user_id:
        return JsonResponse({
            "success": False,
            "message": "User session expired. Please login again."
        }, status=401)
        
    try:
        user = User.objects.get(id=user_id)
    except User.DoesNotExist:
        return JsonResponse({
            "success": False,
            "message": "User not found."
        }, status=404)
    
    email = request.POST.get("hos_email")
    hospital_name = request.POST.get("hos_name")
    owner_name = request.POST.get("hos_owner_name")
    country_code = request.POST.get("hos_country_code_val")
    phone_number = request.POST.get("hos_phn")
    otp_verified = request.POST.get("phone_otp_verified")
    otp = request.POST.get("hos_otp")

    hospital_type = request.POST.get("hos_type")
    services = request.POST.get("hos_services")
    website_url = request.POST.get("hos_website_url")
    working_hours = request.POST.get("hos_working_hours")

    address = request.POST.get("hos_address")
    country = request.POST.get("hos_country")
    state_id = request.POST.get("hos_state")
    city_id = request.POST.get("hos_city")
    pincode = request.POST.get("hos_pincode")
    alternate_contact_no = request.POST.get("hos_alt_phn")
    
    if not hospital_name:
        return JsonResponse({
            "success": False,
            "message": "Hospital name is required."
        }, status=400)

    if not email:
        return JsonResponse({
            "success": False,
            "message": "Email is required."
        }, status=400)
        
    user.email = email
    user.phone_country_code = country_code
    user.phone_number = phone_number

    user.save(update_fields=[
        "email",
        "updated_at"
    ])
    
    state = None

    if state_id:
        try:
            state = State.objects.get(id=state_id)
        except State.DoesNotExist:
            return JsonResponse({
                "success": False,
                "message": "Selected state not found."
            }, status=400)
    
    city = None

    if city_id:
        try:
            city = City.objects.get(id=city_id)
        except City.DoesNotExist:
            return JsonResponse({
                "success": False,
                "message": "Selected city not found."
            }, status=400)
            
    hospital_timing = None

    if working_hours:
        try:
            hospital_timing = HospitalTiming.objects.get(
                id=working_hours
            )
        except HospitalTiming.DoesNotExist:
            hospital_timing = None
            
    hospital_profile, created = HospitalProfile.objects.update_or_create(
        user=user,
        defaults={
            "user_id": user_id,
            "hospital_name": hospital_name,
            "owner_name": owner_name,
            "contact_no": phone_number,
            "otp": otp,
            "address": address,
            "state": state,
            "city": city,
            "pincode": pincode,
            "alternate_contact_no": alternate_contact_no,
            "country": country,
            "hospital_timing": hospital_timing,
        }
    )
    
    if created:
        message = "Hospital profile created successfully."
    else:
        message = "Hospital profile updated successfully."
        
    return JsonResponse({
        "success": True,
        "message": message,
        "profile_id": hospital_profile.id,
        "created": created
    })

def save_hospital_step_2(request):

    user_id = request.session.get("user_id")

    if not user_id:
        return JsonResponse({
            "success": False,
            "message": "User session expired. Please login again."
        }, status=401)

    try:
        user = User.objects.get(id=user_id)
    except User.DoesNotExist:
        return JsonResponse({
            "success": False,
            "message": "User not found."
        }, status=404)

    # ============================
    # Get Hospital Profile
    # ============================

    try:
        hospital_profile = HospitalProfile.objects.get(
            user_id=user.id
        )
    except HospitalProfile.DoesNotExist:
        return JsonResponse({
            "success": False,
            "message": "Hospital profile not found. Please complete Step 1 first."
        }, status=400)

    # ============================
    # Get Step 2 data
    # ============================

    name = request.POST.get("hos_adm_name")
    email = request.POST.get("hos_adm_email")
    phone_country_code = request.POST.get("hos_phone_country_code")
    phone_number = request.POST.get("hos_phone")
    otp = request.POST.get("hos_personal_otp")
    otp_verified = request.POST.get("hos_personal_otp_verified")
    role = request.POST.get("hos_personal_role")
    referral_code = request.POST.get("hos_personal_referral")

    country_id = request.POST.get("hos_personal_country")
    state_id = request.POST.get("hos_personal_state")
    city_id = request.POST.get("hos_personal_city")
    pincode = request.POST.get("hos_personal_pincode")

    # ============================
    # Validation
    # ============================

    if not name:
        return JsonResponse({
            "success": False,
            "message": "Admin name is required."
        }, status=400)

    if not email:
        return JsonResponse({
            "success": False,
            "message": "Email is required."
        }, status=400)

    if not phone_number:
        return JsonResponse({
            "success": False,
            "message": "Phone number is required."
        }, status=400)

    # ============================
    # Get State
    # ============================

    state = None

    if state_id:
        try:
            state = State.objects.get(id=state_id)
        except State.DoesNotExist:
            return JsonResponse({
                "success": False,
                "message": "Selected state not found."
            }, status=400)

    # ============================
    # Get City
    # ============================

    city = None

    if city_id:
        try:
            city = City.objects.get(id=city_id)
        except City.DoesNotExist:
            return JsonResponse({
                "success": False,
                "message": "Selected city not found."
            }, status=400)

    # ============================
    # Get Country
    # ============================

    country = "India"

    if country_id:
        try:
            country_obj = CountryOption.objects.get(id=country_id)
            country = country_obj.name
        except CountryOption.DoesNotExist:
            return JsonResponse({
                "success": False,
                "message": "Selected country not found."
            }, status=400)

    # ============================
    # Profile Type
    # ============================

    profile_type = user.user_type

    # ============================
    # Save / Update Contact Person
    # ============================

    contact_person, created = ContactPerson.objects.update_or_create(
        profile=user,
        profile_type=profile_type,
        defaults={
            "name": name,
            "email": email,
            "phone_country_code": phone_country_code,
            "phone_number": phone_number,
            "role": role,
            "otp": otp,
            "referral_code": referral_code,
            "state": state,
            "city": city,
            "pincode": pincode,
            "country": country,
        }
    )

    # ============================
    # Response
    # ============================

    if created:
        message = "Personal details saved successfully."
    else:
        message = "Personal details updated successfully."

    return JsonResponse({
        "success": True,
        "message": message,
        "contact_person_id": contact_person.id,
        "created": created
    })

def save_hospital_step_3(request):

    user_id = request.session.get("user_id")

    if not user_id:
        return JsonResponse({
            "success": False,
            "message": "User session expired. Please login again."
        }, status=401)

    try:
        user = User.objects.get(id=user_id)
    except User.DoesNotExist:
        return JsonResponse({
            "success": False,
            "message": "User not found."
        }, status=404)

    try:
        hospital_profile = HospitalProfile.objects.get(
            user_id=user.id
        )
    except HospitalProfile.DoesNotExist:
        return JsonResponse({
            "success": False,
            "message": "Hospital profile not found. Please complete Step 1 first."
        }, status=400)

    # ============================================
    # Get POST values
    # ============================================

    registration_no = request.POST.get(
        "registration_no", ""
    ).strip()

    aadhar_card_no = request.POST.get(
        "aadhar_card_no", ""
    ).strip()

    pan_card_no = request.POST.get(
        "pan_card_no", ""
    ).strip()

    # ============================================
    # Get uploaded files
    # ============================================

    registration_file = request.FILES.get(
        "registration_certificate"
    )

    aadhar_file = request.FILES.get(
        "aadhar_document"
    )

    pan_file = request.FILES.get(
        "pan_document"
    )

    logo_file = request.FILES.get(
        "hospital_logo"
    )

    hospital_photo_file = request.FILES.get(
        "hospital_photo"
    )

    # ============================================
    # Validate document numbers
    # ============================================

    if not registration_no:
        return JsonResponse({
            "success": False,
            "message": "Hospital license number is required."
        }, status=400)

    if not aadhar_card_no:
        return JsonResponse({
            "success": False,
            "message": "Aadhar number is required."
        }, status=400)

    if not pan_card_no:
        return JsonResponse({
            "success": False,
            "message": "PAN number is required."
        }, status=400)

    # ============================================
    # Validate files exist
    # ============================================

    if not registration_file:
        return JsonResponse({
            "success": False,
            "message": "Hospital license document is required."
        }, status=400)

    if not aadhar_file:
        return JsonResponse({
            "success": False,
            "message": "Aadhar document is required."
        }, status=400)

    if not pan_file:
        return JsonResponse({
            "success": False,
            "message": "PAN document is required."
        }, status=400)

    if not logo_file:
        return JsonResponse({
            "success": False,
            "message": "Hospital logo is required."
        }, status=400)

    if not hospital_photo_file:
        return JsonResponse({
            "success": False,
            "message": "Hospital image is required."
        }, status=400)

    # ============================================
    # Virus scan + file validation + save
    # ============================================

    registration_path, err = validate_and_save_file(
        registration_file,
        "registration_certificate",
        "Hospital License",
        "hospital"
    )

    if err:
        return JsonResponse({
            "success": False,
            "message": err
        }, status=400)

    aadhar_path, err = validate_and_save_file(
        aadhar_file,
        "aadhar_document",
        "Aadhar Document",
        "hospital"
    )

    if err:
        return JsonResponse({
            "success": False,
            "message": err
        }, status=400)

    pan_path, err = validate_and_save_file(
        pan_file,
        "pan_document",
        "PAN Document",
        "hospital"
    )

    if err:
        return JsonResponse({
            "success": False,
            "message": err
        }, status=400)

    logo_path, err = validate_and_save_file(
        logo_file,
        "hospital_logo",
        "Hospital Logo",
        "hospital"
    )

    if err:
        return JsonResponse({
            "success": False,
            "message": err
        }, status=400)

    hospital_photo_path, err = validate_and_save_file(
        hospital_photo_file,
        "hospital_photo",
        "Hospital Photo",
        "hospital"
    )

    if err:
        return JsonResponse({
            "success": False,
            "message": err
        }, status=400)

    # ============================================
    # Save paths to HospitalProfile
    # ============================================

    hospital_profile.registration_no = registration_no
    hospital_profile.registration_certificate_path = registration_path

    hospital_profile.aadhar_card_no = aadhar_card_no
    hospital_profile.aadhar_doc_path = aadhar_path

    hospital_profile.pan_card_no = pan_card_no
    hospital_profile.pan_doc_path = pan_path

    hospital_profile.hospital_logo_path = logo_path

    hospital_profile.hospital_photo_path = hospital_photo_path

    hospital_profile.save()

    return JsonResponse({
        "success": True,
        "message": "Hospital documents saved successfully.",
        "profile_id": hospital_profile.id,
        "redirect_url": reverse("dashboard")
    })
       
def save_hospital_step_3_old(request):

    user_id = request.session.get("user_id")

    if not user_id:
        return JsonResponse({
            "success": False,
            "message": "User session expired. Please login again."
        }, status=401)

    try:
        user = User.objects.get(id=user_id)
    except User.DoesNotExist:
        return JsonResponse({
            "success": False,
            "message": "User not found."
        }, status=404)

    try:
        hospital_profile = HospitalProfile.objects.get(
            user_id=user.id
        )
    except HospitalProfile.DoesNotExist:
        return JsonResponse({
            "success": False,
            "message": "Hospital profile not found. Please complete Step 1 first."
        }, status=400)

    registration_no = request.POST.get("registration_no")
    aadhar_card_no = request.POST.get("aadhar_card_no")
    pan_card_no = request.POST.get("pan_card_no") 
    
    registration_file = request.FILES.get("registration_certificate")
    aadhar_file = request.FILES.get("aadhar_document")
    pan_file = request.FILES.get("pan_document")
    logo_file = request.FILES.get("hospital_logo")
    hospital_photo_file = request.FILES.get("hospital_photo")

    if not registration_no:
        return JsonResponse({
            "success": False,
            "message": "Hospital license number is required."
        }, status=400)

    if not aadhar_card_no:
        return JsonResponse({
            "success": False,
            "message": "Aadhar number is required."
        }, status=400)

    if not pan_card_no:
        return JsonResponse({
            "success": False,
            "message": "PAN number is required."
        }, status=400)

    if not registration_file:
        return JsonResponse({
            "success": False,
            "message": "Hospital license document is required."
        }, status=400)

    if not aadhar_file:
        return JsonResponse({
            "success": False,
            "message": "Aadhar document is required."
        }, status=400)

    if not pan_file:
        return JsonResponse({
            "success": False,
            "message": "PAN document is required."
        }, status=400)

    if not logo_file:
        return JsonResponse({
            "success": False,
            "message": "Hospital logo is required."
        }, status=400)

    if not hospital_photo_file:
        return JsonResponse({
            "success": False,
            "message": "Hospital image is required."
        }, status=400)

    allowed_types = [
        "image/jpeg",
        "image/png",
        "application/pdf"
    ]

    max_size = 5 * 1024 * 1024  # 5 MB

    files = {
        "Hospital License": registration_file,
        "Aadhar Document": aadhar_file,
        "PAN Document": pan_file,
        "Hospital Logo": logo_file,
        "Hospital Image": hospital_photo_file,
    }

    for field_name, file in files.items():

        if file.content_type not in allowed_types:
            return JsonResponse({
                "success": False,
                "message": f"{field_name}: Only JPG, JPEG, PNG and PDF files are allowed."
            }, status=400)

        if file.size > max_size:
            return JsonResponse({
                "success": False,
                "message": f"{field_name}: File size must not exceed 5 MB."
            }, status=400)

    upload_dir = f"hospital_documents/{user.id}"

    registration_path = default_storage.save(
        f"{upload_dir}/registration/{registration_file.name}",
        registration_file
    )

    aadhar_path = default_storage.save(
        f"{upload_dir}/aadhar/{aadhar_file.name}",
        aadhar_file
    )

    pan_path = default_storage.save(
        f"{upload_dir}/pan/{pan_file.name}",
        pan_file
    )

    logo_path = default_storage.save(
        f"{upload_dir}/logo/{logo_file.name}",
        logo_file
    )

    hospital_photo_path = default_storage.save(
        f"{upload_dir}/hospital_photo/{hospital_photo_file.name}",
        hospital_photo_file
    )

    hospital_profile.registration_no = registration_no
    hospital_profile.registration_certificate_path = registration_path
    hospital_profile.registration_doc_virus_scanned = True

    hospital_profile.aadhar_card_no = aadhar_card_no
    hospital_profile.aadhar_doc_path = aadhar_path
    hospital_profile.aadhar_doc_virus_scanned = True

    hospital_profile.pan_card_no = pan_card_no
    hospital_profile.pan_doc_path = pan_path
    hospital_profile.pan_doc_virus_scanned = True

    hospital_profile.hospital_logo_path = logo_path
    hospital_profile.hospital_logo_virus_scanned = True

    hospital_profile.hospital_photo_path = hospital_photo_path
    hospital_profile.hospital_photo_virus_scanned = True

    hospital_profile.save()

    return JsonResponse({
        "success": True,
        "message": "Hospital documents saved successfully.",
        "profile_id": hospital_profile.id,
        "redirect_url": reverse("dashboard")
    })
    
# doctor section 
def doctor_kyc(request):
    return render(request, 'registration/kyc_doctor.html')

def doctor_profile_verification(request):
    user_id = request.session.get("user_id")
    if not user_id:
        return redirect("login")

    try:
        user = User.objects.get(id=user_id)
    except User.DoesNotExist:
        request.session.flush()
        return redirect("login")

    phone_number = user.phone_number
    phone_country_code = user.phone_country_code    
    
    countries = CountryOption.objects.filter(
        is_active=1
    ).order_by("name")
    
    profile = DoctorProfile.objects.filter(
        user_id=user.id
    ).first()
    
    contact_person = ContactPerson.objects.filter(
        profile_id=user.id
    ).first()
    
    specialties = DoctorSpeciality.objects.filter(
        is_active=1
    ).order_by("name")
    
    educations = DoctorEducation.objects.filter(
        is_active=1
    ).order_by("name")
    
    experiences = DoctorExperience.objects.filter(
        is_active=1
    ).order_by("years")
    
    return render(
        request, 
        'registration/kyc_doctor_profile.html', 
        {
            "phone_number": phone_number,
            "phone_country_code": phone_country_code,
            "countries": countries,
            "profile": profile,
            "contact_person": contact_person,
            "specialties": specialties,
            "educations": educations,
            "experiences": experiences,
        }
    )

@csrf_protect
@require_POST
def save_doctor_profile(request):

    step = request.POST.get("step")

    if not step:
        return JsonResponse({
            "success": False,
            "message": "Step is required."
        }, status=400)

    if step == "1":
        return save_doctor_step_1(request)

    elif step == "2":
        return save_doctor_step_2(request)

    elif step == "3":
        return save_doctor_step_3(request)

    return JsonResponse({
        "success": False,
        "message": "Invalid step."
    }, status=400)
    
def save_doctor_step_1(request):

    user_id = request.session.get("user_id")
    
    if not user_id:
        return JsonResponse({
            "success": False,
            "message": "User session expired. Please login again."
        }, status=401)
        
    try:
        user = User.objects.get(id=user_id)
    except User.DoesNotExist:
        return JsonResponse({
            "success": False,
            "message": "User not found."
        }, status=404)
    
    email = request.POST.get("doc_email", "").strip().lower()
    full_name = request.POST.get("doc_name")
    gender = request.POST.get("doc_gender_value")
    age = request.POST.get("doc_age")
    specialty = request.POST.get("doc_speciality_value")
    education = request.POST.get("doc_education_value")
    experience = request.POST.get("doc_experience_value")
    clinic_name = request.POST.get("doc_clinic")
    owner_name = request.POST.get("doc_owner_name")
    contact_number = request.POST.get("doc_phn", "").strip()
    alt_contact_number = request.POST.get("doc_alt_phn")
    full_address = request.POST.get("doc_address")
    country = request.POST.get("doc_country")
    state_id = request.POST.get("doc_state")
    city_id = request.POST.get("doc_city")
    pincode = request.POST.get("doc_pincode")
    clinic_timing_from = request.POST.get("clinic_timing_from")
    clinic_timing_to = request.POST.get("clinic_timing_to")
    home_visit_available = request.POST.get("doc_home_visit_value")
    otp = request.POST.get("doc_otp")
    referral_code = request.POST.get("doc_referral_code")
    country_code = request.POST.get("doc_country_code_val")
    
    if not full_name:
        return JsonResponse({
            "success": False,
            "message": "Doctor name is required."
        }, status=400)

    if not email:
        return JsonResponse({
            "success": False,
            "message": "Email is required."
        }, status=400)

    try:
        validate_email(email)
    except ValidationError:
        return JsonResponse({
            "success": False,
            "message": "Please enter a valid email address."
        }, status=400)

    if User.objects.filter(email__iexact=email).exclude(id=user.id).exists():
        return JsonResponse({
            "success": False,
            "message": "This email is already used by another account."
        }, status=400)

    if contact_number and User.objects.filter(phone_number=contact_number).exclude(id=user.id).exists():
        return JsonResponse({
            "success": False,
            "message": "This phone number is already used by another account."
        }, status=400)

    state = None

    if state_id:
        try:
            state = State.objects.get(id=state_id)
        except State.DoesNotExist:
            return JsonResponse({
                "success": False,
                "message": "Selected state not found."
            }, status=400)
    
    city = None

    if city_id:
        try:
            city = City.objects.get(id=city_id)
        except City.DoesNotExist:
            return JsonResponse({
                "success": False,
                "message": "Selected city not found."
            }, status=400)
                     
    try:
        with transaction.atomic():
            user.email = email
            user.phone_country_code = country_code
            user.phone_number = contact_number
            user.save(update_fields=[
                "email",
                "phone_country_code",
                "phone_number",
                "updated_at",
            ])

            doctor_profile, created = DoctorProfile.objects.update_or_create(
                user=user,
                defaults={
                    "user_id": user_id,
                    "full_name": full_name,
                    "gender": gender,
                    "age": age,
                    "specialty_id": specialty,
                    "education_id": education,
                    "experience_id": experience,
                    "clinic_name": clinic_name,
                    "owner_name": owner_name,
                    "contact_number": contact_number,
                    "alt_contact_number": alt_contact_number,
                    "full_address": full_address,
                    "state_id": state_id,
                    "city_id": city_id,
                    "pincode": pincode,
                    "country": country,
                    "clinic_timing_from": clinic_timing_from,
                    "clinic_timing_to": clinic_timing_to,
                    "home_visit_available": home_visit_available,
                    "otp": otp,
                    "referral_code": referral_code,
                }
            )
    except IntegrityError as exc:
        # A concurrent request can still claim a value after the checks above.
        error_text = str(exc).lower()
        if "email" in error_text:
            message = "This email is already used by another account."
        elif "phone" in error_text:
            message = "This phone number is already used by another account."
        else:
            message = "A value entered is already in use. Please use a different value."
        return JsonResponse({"success": False, "message": message}, status=400)
    
    if created:
        message = "Doctor profile created successfully."
    else:
        message = "Doctor profile updated successfully."
        
    return JsonResponse({
        "success": True,
        "message": message,
        "profile_id": doctor_profile.id,
        "created": created
    })

def save_doctor_step_2(request):

    user_id = request.session.get("user_id")

    if not user_id:
        return JsonResponse({
            "success": False,
            "message": "User session expired. Please login again."
        }, status=401)

    try:
        user = User.objects.get(id=user_id)
    except User.DoesNotExist:
        return JsonResponse({
            "success": False,
            "message": "User not found."
        }, status=404)

    try:
        doctor_profile = DoctorProfile.objects.get(
            user_id=user.id
        )
    except DoctorProfile.DoesNotExist:
        return JsonResponse({
            "success": False,
            "message": "Hospital profile not found. Please complete Step 1 first."
        }, status=400)

    name = request.POST.get("doc_adm_name")
    email = request.POST.get("doc_adm_email")
    phone_country_code = request.POST.get("doc_phone_country_code")
    phone_number = request.POST.get("doc_phone")
    otp = request.POST.get("doc_personal_otp")
    otp_verified = request.POST.get("doc_personal_otp_verified")
    role = request.POST.get("doc_personal_role")
    referral_code = request.POST.get("doc_personal_referral")

    country_id = request.POST.get("doc_personal_country")
    state_id = request.POST.get("doc_personal_state")
    city_id = request.POST.get("doc_personal_city")
    pincode = request.POST.get("doc_personal_pincode")

    if not name:
        return JsonResponse({
            "success": False,
            "message": "Admin name is required."
        }, status=400)

    if not email:
        return JsonResponse({
            "success": False,
            "message": "Email is required."
        }, status=400)

    if not phone_number:
        return JsonResponse({
            "success": False,
            "message": "Phone number is required."
        }, status=400)

    state = None

    if state_id:
        try:
            state = State.objects.get(id=state_id)
        except State.DoesNotExist:
            return JsonResponse({
                "success": False,
                "message": "Selected state not found."
            }, status=400)

    city = None

    if city_id:
        try:
            city = City.objects.get(id=city_id)
        except City.DoesNotExist:
            return JsonResponse({
                "success": False,
                "message": "Selected city not found."
            }, status=400)

    country = "India"

    if country_id:
        try:
            country_obj = CountryOption.objects.get(id=country_id)
            country = country_obj.name
        except CountryOption.DoesNotExist:
            return JsonResponse({
                "success": False,
                "message": "Selected country not found."
            }, status=400)

    profile_type = user.user_type

    contact_person, created = ContactPerson.objects.update_or_create(
        profile=user,
        profile_type=profile_type,
        defaults={
            "name": name,
            "email": email,
            "phone_country_code": phone_country_code,
            "phone_number": phone_number,
            "role": role,
            "otp": otp,
            "referral_code": referral_code,
            "state": state,
            "city": city,
            "pincode": pincode,
            "country": country,
        }
    )

    # ============================
    # Response
    # ============================

    if created:
        message = "Personal details saved successfully."
    else:
        message = "Personal details updated successfully."

    return JsonResponse({
        "success": True,
        "message": message,
        "contact_person_id": contact_person.id,
        "created": created
    })

def save_doctor_step_3(request):

    user_id = request.session.get("user_id")

    if not user_id:
        return JsonResponse({
            "success": False,
            "message": "User session expired. Please login again."
        }, status=401)

    try:
        user = User.objects.get(id=user_id)
    except User.DoesNotExist:
        return JsonResponse({
            "success": False,
            "message": "User not found."
        }, status=404)

    try:
        doctor_profile = DoctorProfile.objects.get(user_id=user.id)
    except DoctorProfile.DoesNotExist:
        return JsonResponse({
            "success": False,
            "message": "Doctor profile not found. Please complete Step 1 first."
        }, status=400)

    # ============================================
    # Get POST values
    # ============================================

    registration_no = request.POST.get(
        "registration_no", ""
    ).strip()

    aadhar_card_no = request.POST.get(
        "aadhar_card_no", ""
    ).strip()

    pan_card_no = request.POST.get(
        "pan_card_no", ""
    ).strip()

    # ============================================
    # Get uploaded files
    # ============================================

    registration_file = request.FILES.get(
        "registration_certificate"
    )

    aadhar_file = request.FILES.get(
        "aadhar_document"
    )

    pan_file = request.FILES.get(
        "pan_document"
    )

    logo_file = request.FILES.get(
        "logo"
    )

    photo_file = request.FILES.get(
        "photo"
    )

    # ============================================
    # Validate document numbers
    # ============================================

    if not registration_no:
        return JsonResponse({
            "success": False,
            "message": "License number is required."
        }, status=400)

    if not aadhar_card_no:
        return JsonResponse({
            "success": False,
            "message": "Aadhar number is required."
        }, status=400)

    if not pan_card_no:
        return JsonResponse({
            "success": False,
            "message": "PAN number is required."
        }, status=400)

    # ============================================
    # Validate files exist
    # ============================================

    if not registration_file:
        return JsonResponse({
            "success": False,
            "message": "License document is required."
        }, status=400)

    if not aadhar_file:
        return JsonResponse({
            "success": False,
            "message": "Aadhar document is required."
        }, status=400)

    if not pan_file:
        return JsonResponse({
            "success": False,
            "message": "PAN document is required."
        }, status=400)

    if not logo_file:
        return JsonResponse({
            "success": False,
            "message": "Logo is required."
        }, status=400)

    if not photo_file:
        return JsonResponse({
            "success": False,
            "message": "Image is required."
        }, status=400)

    # ============================================
    # Virus scan + file validation + save
    # ============================================

    registration_path, err = validate_and_save_file(
        registration_file,
        "registration_certificate",
        "Registration Certificate",
        "doctor"
    )

    if err:
        return JsonResponse({
            "success": False,
            "message": err
        }, status=400)

    aadhar_path, err = validate_and_save_file(
        aadhar_file,
        "aadhar_document",
        "Aadhar Document",
        "doctor"
    )

    if err:
        return JsonResponse({
            "success": False,
            "message": err
        }, status=400)

    pan_path, err = validate_and_save_file(
        pan_file,
        "pan_document",
        "PAN Document",
        "doctor"
    )

    if err:
        return JsonResponse({
            "success": False,
            "message": err
        }, status=400)

    logo_path, err = validate_and_save_file(
        logo_file,
        "logo",
        "Doctor Logo",
        "doctor"
    )

    if err:
        return JsonResponse({
            "success": False,
            "message": err
        }, status=400)

    photo_path, err = validate_and_save_file(
        photo_file,
        "photo",
        "Doctor Photo",
        "doctor"
    )

    if err:
        return JsonResponse({
            "success": False,
            "message": err
        }, status=400)

    # ============================================
    # Save paths to DoctorProfile
    # ============================================

    doctor_profile.registration_number = registration_no
    doctor_profile.registration_certificate_path = registration_path

    doctor_profile.aadhar_number = aadhar_card_no
    doctor_profile.aadhar_doc_path = aadhar_path

    doctor_profile.pan_number = pan_card_no
    doctor_profile.pan_doc_path = pan_path

    doctor_profile.clinic_logo_path = logo_path

    doctor_profile.clinic_photo_path = photo_path

    doctor_profile.save()

    return JsonResponse({
        "success": True,
        "message": "Doctor documents saved successfully.",
        "profile_id": doctor_profile.id,
        "redirect_url": reverse("dashboard")
    })
       
def save_doctor_step_3_old(request):

    user_id = request.session.get("user_id")

    if not user_id:
        return JsonResponse({
            "success": False,
            "message": "User session expired. Please login again."
        }, status=401)

    try:
        user = User.objects.get(id=user_id)
    except User.DoesNotExist:
        return JsonResponse({
            "success": False,
            "message": "User not found."
        }, status=404)

    try:
        doctor_profile = DoctorProfile.objects.get(user_id=user.id)
    except DoctorProfile.DoesNotExist:
        return JsonResponse({
            "success": False,
            "message": "Doctor profile not found. Please complete Step 1 first."
        }, status=400)

    # Get POST values
    registration_no = request.POST.get("registration_no", "").strip()
    aadhar_card_no = request.POST.get("aadhar_card_no", "").strip()
    pan_card_no = request.POST.get("pan_card_no", "").strip()

    # Get uploaded files
    registration_file = request.FILES.get("registration_certificate")
    aadhar_file = request.FILES.get("aadhar_document")
    pan_file = request.FILES.get("pan_document")
    logo_file = request.FILES.get("logo")
    photo_file = request.FILES.get("photo")

    # Validate document numbers
    if not registration_no:
        return JsonResponse({
            "success": False,
            "message": "License number is required."
        }, status=400)

    if not aadhar_card_no:
        return JsonResponse({
            "success": False,
            "message": "Aadhar number is required."
        }, status=400)

    if not pan_card_no:
        return JsonResponse({
            "success": False,
            "message": "PAN number is required."
        }, status=400)

    # Validate files
    if not registration_file:
        return JsonResponse({
            "success": False,
            "message": "License document is required."
        }, status=400)

    if not aadhar_file:
        return JsonResponse({
            "success": False,
            "message": "Aadhar document is required."
        }, status=400)

    if not pan_file:
        return JsonResponse({
            "success": False,
            "message": "PAN document is required."
        }, status=400)

    if not logo_file:
        return JsonResponse({
            "success": False,
            "message": "Logo is required."
        }, status=400)

    if not photo_file:
        return JsonResponse({
            "success": False,
            "message": "Image is required."
        }, status=400)

    # File validation
    allowed_types = [
        "image/jpeg",
        "image/png",
        "application/pdf"
    ]

    max_size = 5 * 1024 * 1024  # 5 MB

    files = {
        "License": registration_file,
        "Aadhar Document": aadhar_file,
        "PAN Document": pan_file,
        "Logo": logo_file,
        "Image": photo_file,
    }

    for field_name, file in files.items():

        if file.content_type not in allowed_types:
            return JsonResponse({
                "success": False,
                "message": (
                    f"{field_name}: Only JPG, JPEG, PNG "
                    "and PDF files are allowed."
                )
            }, status=400)

        if file.size > max_size:
            return JsonResponse({
                "success": False,
                "message": f"{field_name}: File size must not exceed 5 MB."
            }, status=400)

    # Upload directory
    upload_dir = f"doctor_documents/{user.id}"

    registration_path = default_storage.save(
        f"{upload_dir}/registration/{registration_file.name}",
        registration_file
    )

    aadhar_path = default_storage.save(
        f"{upload_dir}/aadhar/{aadhar_file.name}",
        aadhar_file
    )

    pan_path = default_storage.save(
        f"{upload_dir}/pan/{pan_file.name}",
        pan_file
    )

    logo_path = default_storage.save(
        f"{upload_dir}/logo/{logo_file.name}",
        logo_file
    )

    photo_path = default_storage.save(
        f"{upload_dir}/clinic_photo/{photo_file.name}",
        photo_file
    )


    doctor_profile.registration_number = registration_no
    doctor_profile.registration_certificate_path = registration_path
    doctor_profile.registration_certificate_virus_scanned = True

    doctor_profile.aadhar_number = aadhar_card_no
    doctor_profile.aadhar_doc_path = aadhar_path
    doctor_profile.aadhar_doc_virus_scanned = True

    doctor_profile.pan_number = pan_card_no
    doctor_profile.pan_doc_path = pan_path
    doctor_profile.pan_doc_virus_scanned = True

    doctor_profile.clinic_logo_path = logo_path
    doctor_profile.clinic_logo_virus_scanned = True

    doctor_profile.clinic_photo_path = photo_path
    doctor_profile.clinic_photo_virus_scanned = True

    doctor_profile.save()

    return JsonResponse({
        "success": True,
        "message": "Doctor documents saved successfully.",
        "profile_id": doctor_profile.id,
        "redirect_url": reverse("dashboard")
    })
  
def doctor_profile_review(request):
    return render(request, 'registration/kyc_doctor_profile_review.html')






def lab_kyc(request):
    return render(request, 'registration/new_kyc_lab.html')

# def lab_profile_verification(request):
#     return render(request, 'registration/kyc_lab_profile.html')

# def lab_profile_review(request):
#     return render(request, 'registration/kyc_lab_profile_review.html')

# ============================================================
# LAB KYC
# ============================================================

def lab_kyc(request):
    return render(request, "registration/kyc_lab.html")


def lab_profile_verification(request):
    user_id = request.session.get("user_id")

    if not user_id:
        return redirect("login")

    try:
        user = User.objects.get(id=user_id)
    except User.DoesNotExist:
        request.session.flush()
        return redirect("login")

    phone_number = user.phone_number
    phone_country_code = user.phone_country_code

    countries = CountryOption.objects.filter(
        is_active=1
    ).order_by("name")

    lab_times = LabTiming.objects.filter(
        is_active=True
    ).order_by("open_time")

    lab_services = LabService.objects.filter(
        is_active=1
    ).order_by("name")

    lab_facilities = LabFacility.objects.filter(
        is_active=1
    ).order_by("name")

    lab_profile = LabProfile.objects.filter(
        user_id=user.id
    ).first()

    contact_person = ContactPerson.objects.filter(
        profile_id=user.id,
        profile_type="lab"
    ).first()

    return render(
        request,
        "registration/kyc_lab_profile.html",
        {
            "phone_number": phone_number,
            "phone_country_code": phone_country_code,
            "countries": countries,
            "lab_times": lab_times,
            "lab_services": lab_services,
            "lab_facilities": lab_facilities,
            "lab_profile": lab_profile,
            "contact_person": contact_person,
        }
    )


def lab_profile_review(request):
    return render(
        request,
        "registration/kyc_lab_profile_review.html"
    )

def save_lab_step_1(request):

    user_id = request.session.get("user_id")

    if not user_id:
        return JsonResponse({
            "success": False,
            "message": "User session expired. Please login again."
        }, status=401)

    try:
        user = User.objects.get(id=user_id)
    except User.DoesNotExist:
        return JsonResponse({
            "success": False,
            "message": "User not found."
        }, status=404)

    # ========================================================
    # BASIC DETAILS
    # ========================================================

    email = request.POST.get("lab_email", "").strip().lower()
    lab_name = request.POST.get("lab_name", "").strip()
    owner_name = request.POST.get("owner_name", "").strip()
    lab_registration_number = request.POST.get(
        "lab_registration_number", ""
    ).strip()

    country_code = request.POST.get(
        "lab_country_code",
        user.phone_country_code or "+91"
    )

    phone_number = request.POST.get(
        "lab_phone",
        user.phone_number or ""
    ).strip()

    alt_phone = request.POST.get("alt_phone", "").strip()

    # ========================================================
    # ADDRESS
    # ========================================================

    address = request.POST.get("lab_address", "").strip()
    country = request.POST.get("lab_country", "").strip()

    state_id = request.POST.get("lab_state")
    city_id = request.POST.get("lab_city")

    pincode = request.POST.get("lab_pincode", "").strip()

    # ========================================================
    # LAB TIMING
    # ========================================================

    lab_timing_id = request.POST.get("lab_timing")

    # ========================================================
    # REFERRAL
    # ========================================================

    referral_code = request.POST.get("referral_code", "").strip()

    # ========================================================
    # VALIDATION
    # ========================================================

    if not lab_name:
        return JsonResponse({
            "success": False,
            "message": "Lab name is required."
        }, status=400)

    if not owner_name:
        return JsonResponse({
            "success": False,
            "message": "Owner name is required."
        }, status=400)

    if not lab_registration_number:
        return JsonResponse({
            "success": False,
            "message": "Lab registration number is required."
        }, status=400)

    if not email:
        return JsonResponse({
            "success": False,
            "message": "Email is required."
        }, status=400)

    try:
        validate_email(email)
    except ValidationError:
        return JsonResponse({
            "success": False,
            "message": "Please enter a valid email address."
        }, status=400)

    if User.objects.filter(email__iexact=email).exclude(id=user.id).exists():
        return JsonResponse({
            "success": False,
            "message": "This email is already used by another account."
        }, status=400)

    if not phone_number:
        return JsonResponse({
            "success": False,
            "message": "Phone number is required."
        }, status=400)

    if User.objects.filter(phone_number=phone_number).exclude(id=user.id).exists():
        return JsonResponse({
            "success": False,
            "message": "This phone number is already used by another account."
        }, status=400)

    if not address:
        return JsonResponse({
            "success": False,
            "message": "Address is required."
        }, status=400)

    # ========================================================
    # STATE
    # ========================================================

    state = None

    if state_id:
        try:
            state = State.objects.get(id=state_id)
        except State.DoesNotExist:
            return JsonResponse({
                "success": False,
                "message": "Selected state not found."
            }, status=400)

    # ========================================================
    # CITY
    # ========================================================

    city = None

    if city_id:
        try:
            city = City.objects.get(id=city_id)
        except City.DoesNotExist:
            return JsonResponse({
                "success": False,
                "message": "Selected city not found."
            }, status=400)

    # ========================================================
    # LAB TIMING
    # ========================================================

    lab_timing = None

    if lab_timing_id:
        try:
            lab_timing = LabTiming.objects.get(
                id=lab_timing_id
            )
        except LabTiming.DoesNotExist:
            return JsonResponse({
                "success": False,
                "message": "Selected lab timing not found."
            }, status=400)

    # ========================================================
    # UPDATE USER
    # ========================================================

    # ========================================================
    # LAB PROFILE
    # ========================================================

    defaults = {
        "lab_name": lab_name,
        "owner_name": owner_name,
        "lab_registration_number": lab_registration_number,

        "contact_number": phone_number,
        "alt_contact_number": alt_phone,

        "address": address,
        "country": country,

        "state": state,
        "city": city,
        "pincode": pincode,

        "lab_timing": lab_timing,
    }

    if referral_code:
        defaults["referral_code"] = referral_code

    try:
        with transaction.atomic():
            user.email = email
            user.phone_country_code = country_code
            user.phone_number = phone_number
            user.save(
                update_fields=[
                    "email",
                    "phone_country_code",
                    "phone_number",
                    "updated_at"
                ]
            )

            lab_profile, created = LabProfile.objects.update_or_create(
                user=user,
                defaults=defaults
            )
    except IntegrityError as exc:
        # Protect against a concurrent request claiming the same unique value.
        error_text = str(exc).lower()
        if "email" in error_text:
            message = "This email is already used by another account."
        elif "phone" in error_text:
            message = "This phone number is already used by another account."
        else:
            message = "A value entered is already in use. Please use a different value."
        return JsonResponse({"success": False, "message": message}, status=400)

    # ========================================================
    # RESPONSE
    # ========================================================

    if created:
        message = "Lab profile created successfully."
    else:
        message = "Lab profile updated successfully."

    return JsonResponse({
        "success": True,
        "message": message,
        "profile_id": lab_profile.id,
        "created": created
    })

def save_lab_step_2(request):

    user_id = request.session.get("user_id")

    if not user_id:
        return JsonResponse({
            "success": False,
            "message": "User session expired. Please login again."
        }, status=401)

    try:
        user = User.objects.get(id=user_id)
    except User.DoesNotExist:
        return JsonResponse({
            "success": False,
            "message": "User not found."
        }, status=404)

    name = request.POST.get("contact_name")
    email = request.POST.get("contact_email")
    phone_country_code = request.POST.get(
        "contact_country_code",
        "+91"
    )
    phone_number = request.POST.get("contact_phone")
    role = request.POST.get("contact_role")
    otp = request.POST.get("contact_otp")
    referral_code = request.POST.get("referral_code")

    if not name:
        return JsonResponse({
            "success": False,
            "message": "Contact person name is required."
        }, status=400)

    if not phone_number:
        return JsonResponse({
            "success": False,
            "message": "Contact person phone is required."
        }, status=400)

    if not role:
        return JsonResponse({
            "success": False,
            "message": "Contact person role is required."
        }, status=400)

    contact_person, created = ContactPerson.objects.update_or_create(
        profile=user,
        profile_type="lab",
        defaults={
            "name": name,
            "email": email,
            "phone_country_code": phone_country_code,
            "phone_number": phone_number,
            "role": role,
            "otp": otp,
            "referral_code": referral_code,
        }
    )

    return JsonResponse({
        "success": True,
        "message": (
            "Contact person saved successfully."
            if created
            else "Contact person updated successfully."
        ),
        "contact_person_id": contact_person.id
    })

def save_lab_step_3(request):

    user_id = request.session.get("user_id")

    if not user_id:
        return JsonResponse({
            "success": False,
            "message": "User session expired. Please login again."
        }, status=401)

    try:
        user = User.objects.get(id=user_id)
    except User.DoesNotExist:
        return JsonResponse({
            "success": False,
            "message": "User not found."
        }, status=404)

    try:
        lab_profile = LabProfile.objects.get(
            user_id=user.id
        )
    except LabProfile.DoesNotExist:
        return JsonResponse({
            "success": False,
            "message": "Lab profile not found. Please complete Step 1 first."
        }, status=400)

    lab_certificate_number = request.POST.get(
        "lab_certificate_number"
    )

    aadhaar_number = request.POST.get(
        "aadhaar_number"
    )

    pan_number = request.POST.get(
        "pan_number"
    )

    gov_license_number = request.POST.get(
        "gov_license_number"
    )

    lab_certificate_file = request.FILES.get(
        "lab_certificate"
    )

    aadhaar_file = request.FILES.get(
        "aadhar_doc"
    )

    pan_file = request.FILES.get(
        "pan_doc"
    )

    gov_license_file = request.FILES.get(
        "gov_license"
    )

    lab_photo_file = request.FILES.get(
        "lab_photo"
    )

    # --------------------------------------------------------
    # Required numbers
    # --------------------------------------------------------

    if not lab_certificate_number:
        return JsonResponse({
            "success": False,
            "message": "Lab certificate number is required."
        }, status=400)

    if not aadhaar_number:
        return JsonResponse({
            "success": False,
            "message": "Aadhaar number is required."
        }, status=400)

    if not pan_number:
        return JsonResponse({
            "success": False,
            "message": "PAN number is required."
        }, status=400)

    if not gov_license_number:
        return JsonResponse({
            "success": False,
            "message": "Government license number is required."
        }, status=400)

    # --------------------------------------------------------
    # Files
    # --------------------------------------------------------

    if not lab_certificate_file:
        return JsonResponse({
            "success": False,
            "message": "Lab certificate document is required."
        }, status=400)

    if not aadhaar_file:
        return JsonResponse({
            "success": False,
            "message": "Aadhaar document is required."
        }, status=400)

    if not pan_file:
        return JsonResponse({
            "success": False,
            "message": "PAN document is required."
        }, status=400)

    if not gov_license_file:
        return JsonResponse({
            "success": False,
            "message": "Government license document is required."
        }, status=400)

    if not lab_photo_file:
        return JsonResponse({
            "success": False,
            "message": "Lab photo is required."
        }, status=400)

    # --------------------------------------------------------
    # Save files
    # --------------------------------------------------------

    lab_certificate_path, err = validate_and_save_file(
        lab_certificate_file,
        "lab_certificate",
        "Lab Certificate",
        "lab"
    )

    if err:
        return JsonResponse({
            "success": False,
            "message": err
        }, status=400)

    aadhaar_path, err = validate_and_save_file(
        aadhaar_file,
        "aadhaar",
        "Aadhaar Document",
        "lab"
    )

    if err:
        return JsonResponse({
            "success": False,
            "message": err
        }, status=400)

    pan_path, err = validate_and_save_file(
        pan_file,
        "pan",
        "PAN Document",
        "lab"
    )

    if err:
        return JsonResponse({
            "success": False,
            "message": err
        }, status=400)

    gov_license_path, err = validate_and_save_file(
        gov_license_file,
        "license",
        "Government License",
        "lab"
    )

    if err:
        return JsonResponse({
            "success": False,
            "message": err
        }, status=400)

    lab_photo_path, err = validate_and_save_file(
        lab_photo_file,
        "lab_photo",
        "Lab Photo",
        "lab"
    )

    if err:
        return JsonResponse({
            "success": False,
            "message": err
        }, status=400)

    # --------------------------------------------------------
    # Update profile
    # --------------------------------------------------------

    lab_profile.lab_certificate_number = lab_certificate_number
    lab_profile.identity_proof_aadhar_number = aadhaar_number
    lab_profile.identity_proof_pan_number = pan_number
    lab_profile.gov_license_number = gov_license_number

    lab_profile.lab_certificate_path = lab_certificate_path
    lab_profile.identity_proof_aadhar_path = aadhaar_path
    lab_profile.identity_proof_pan_path = pan_path
    lab_profile.gov_license_path = gov_license_path
    lab_profile.lab_photo_path = lab_photo_path

    lab_profile.save()

    return JsonResponse({
        "success": True,
        "message": "Lab documents saved successfully.",
        "profile_id": lab_profile.id,
        "redirect_url": reverse("lab_profile_review")
    })


@csrf_protect
@require_POST
def save_lab_profile(request):

    step = request.POST.get("step")

    if not step:
        return JsonResponse({
            "success": False,
            "message": "Step is required."
        }, status=400)

    if step == "1":
        return save_lab_step_1(request)

    elif step == "2":
        return save_lab_step_2(request)

    elif step == "3":
        return save_lab_step_3(request)

    return JsonResponse({
        "success": False,
        "message": "Invalid step."
    }, status=400)



# pharmacy section 
def pharmacy_kyc(request):
    return render(request, 'registration/kyc_pharmacy.html')

def pharmacy_profile_verification(request):
    user_id = request.session.get("user_id")
    if not user_id:
        return redirect("login")

    try:
        user = User.objects.get(id=user_id)
    except User.DoesNotExist:
        request.session.flush()
        return redirect("login")

    phone_number = user.phone_number
    phone_country_code = user.phone_country_code    
    
    countries = CountryOption.objects.filter(
        is_active=1
    ).order_by("name")
    
    profile = PharmacyProfile.objects.filter(
        user_id=user.id
    ).first()
    
    contact_person = ContactPerson.objects.filter(
        profile_id=user.id
    ).first()
    
    types = PharmacyType.objects.filter(
        is_active=1
    ).order_by("name")
    
    services = PharmacyServices.objects.filter(
        is_active=1
    ).order_by("name")
    
    timings = PharmacyTiming.objects.filter(
        is_active=1
    ).order_by("id")
    
    return render(
        request, 
        'registration/kyc_pharmacy_profile.html', 
        {
            "phone_number": phone_number,
            "phone_country_code": phone_country_code,
            "countries": countries,
            "profile": profile,
            "contact_person": contact_person,
            "types": types,
            "services": services,
            "timings": timings,
        }
    )

@csrf_protect
@require_POST
def save_pharmacy_profile(request):

    step = request.POST.get("step")

    if not step:
        return JsonResponse({
            "success": False,
            "message": "Step is required."
        }, status=400)

    if step == "1":
        return save_pharmacy_step_1(request)

    elif step == "2":
        return save_pharmacy_step_2(request)

    elif step == "3":
        return save_pharmacy_step_3(request)

    return JsonResponse({
        "success": False,
        "message": "Invalid step."
    }, status=400)
    
def save_pharmacy_step_1(request):

    user_id = request.session.get("user_id")
    
    if not user_id:
        return JsonResponse({
            "success": False,
            "message": "User session expired. Please login again."
        }, status=401)
        
    try:
        user = User.objects.get(id=user_id)
    except User.DoesNotExist:
        return JsonResponse({
            "success": False,
            "message": "User not found."
        }, status=404)
    
    personal_email = request.POST.get("pha_email")
    first_name = request.POST.get("pha_first_name")
    last_name = request.POST.get("pha_last_name")
    company_name = request.POST.get("pha_comp_name")
    gender = request.POST.get("pha_gender_value")
    age = request.POST.get("pha_age")
    pharmacy_timing = request.POST.get("pha_timing")
    contact_number = request.POST.get("pha_phn")
    personal_phone_number = request.POST.get("pha_alt_phn")
    personal_pan_number = request.POST.get("pha_alt_phn")
    address = request.POST.get("pha_address")
    country = request.POST.get("pha_country")
    state_id = request.POST.get("pha_state")
    city_id = request.POST.get("pha_city")
    website = request.POST.get("pha_website") 
    pincode = request.POST.get("pha_pincode")
    otp = request.POST.get("pha_otp")
    referral_code = request.POST.get("pha_referral_code")
    country_code = request.POST.get("pha_country_code_val")
    
    if not first_name:
        return JsonResponse({
            "success": False,
            "message": "First name is required."
        }, status=400)
        
    if not last_name:
        return JsonResponse({
            "success": False,
            "message": "Last name is required."
        }, status=400)

    if not personal_email:
        return JsonResponse({
            "success": False,
            "message": "Email is required."
        }, status=400)
        
    user.email = personal_email
    user.phone_country_code = country_code
    user.phone_number = contact_number

    user.save(update_fields=[
        "email",
        "updated_at"
    ])
    
    state = None

    if state_id:
        try:
            state = State.objects.get(id=state_id)
        except State.DoesNotExist:
            return JsonResponse({
                "success": False,
                "message": "Selected state not found."
            }, status=400)
    
    city = None

    if city_id:
        try:
            city = City.objects.get(id=city_id)
        except City.DoesNotExist:
            return JsonResponse({
                "success": False,
                "message": "Selected city not found."
            }, status=400)
                     
    pharmacy_profile, created = PharmacyProfile.objects.update_or_create(
        user=user,
        defaults={
            "user_id": user_id,
            "first_name": first_name,
            "last_name": last_name,
            "gender": gender,
            "age": age,
            "personal_email": personal_email,
            "personal_pan_number": personal_pan_number,
            "company_name": company_name,
            "personal_phone_number": personal_phone_number,
            "address": address,
            "state_id": state_id,
            "city_id": city_id,
            "pincode": pincode,
            "country": country,
            "website": website,
            "pharmacy_timing_id": pharmacy_timing,
            "otp": otp,
            "referral_code": referral_code,
            
        }
    )
    
    if created:
        message = "Pharmacy profile created successfully."
    else:
        message = "Pharmacy profile updated successfully."
        
    return JsonResponse({
        "success": True,
        "message": message,
        "profile_id": pharmacy_profile.id,
        "created": created
    })

def save_pharmacy_step_2(request):

    user_id = request.session.get("user_id")

    if not user_id:
        return JsonResponse({
            "success": False,
            "message": "User session expired. Please login again."
        }, status=401)

    try:
        user = User.objects.get(id=user_id)
    except User.DoesNotExist:
        return JsonResponse({
            "success": False,
            "message": "User not found."
        }, status=404)

    try:
        pharmacy_profile = PharmacyProfile.objects.get(
            user_id=user.id
        )
    except PharmacyProfile.DoesNotExist:
        return JsonResponse({
            "success": False,
            "message": "Pharmacy profile not found. Please complete Step 1 first."
        }, status=400)

    name = request.POST.get("pha_adm_name")
    email = request.POST.get("pha_adm_email")
    phone_country_code = request.POST.get("pha_phone_country_code")
    phone_number = request.POST.get("pha_phone")
    otp = request.POST.get("pha_personal_otp")
    otp_verified = request.POST.get("pha_personal_otp_verified")
    role = request.POST.get("pha_personal_role")
    referral_code = request.POST.get("pha_personal_referral")
    country_id = request.POST.get("pha_personal_country")
    state_id = request.POST.get("pha_personal_state")
    city_id = request.POST.get("pha_personal_city")
    pincode = request.POST.get("pha_personal_pincode")

    if not name:
        return JsonResponse({
            "success": False,
            "message": "Admin name is required."
        }, status=400)

    if not email:
        return JsonResponse({
            "success": False,
            "message": "Email is required."
        }, status=400)

    if not phone_number:
        return JsonResponse({
            "success": False,
            "message": "Phone number is required."
        }, status=400)

    state = None

    if state_id:
        try:
            state = State.objects.get(id=state_id)
        except State.DoesNotExist:
            return JsonResponse({
                "success": False,
                "message": "Selected state not found."
            }, status=400)

    city = None

    if city_id:
        try:
            city = City.objects.get(id=city_id)
        except City.DoesNotExist:
            return JsonResponse({
                "success": False,
                "message": "Selected city not found."
            }, status=400)

    country = "India"

    if country_id:
        try:
            country_obj = CountryOption.objects.get(id=country_id)
            country = country_obj.name
        except CountryOption.DoesNotExist:
            return JsonResponse({
                "success": False,
                "message": "Selected country not found."
            }, status=400)

    profile_type = user.user_type

    contact_person, created = ContactPerson.objects.update_or_create(
        profile=user,
        profile_type=profile_type,
        defaults={
            "name": name,
            "email": email,
            "phone_country_code": phone_country_code,
            "phone_number": phone_number,
            "role": role,
            "otp": otp,
            "referral_code": referral_code,
            "state": state,
            "city": city,
            "pincode": pincode,
            "country": country,
        }
    )

    # ============================
    # Response
    # ============================

    if created:
        message = "Personal details saved successfully."
    else:
        message = "Personal details updated successfully."

    return JsonResponse({
        "success": True,
        "message": message,
        "contact_person_id": contact_person.id,
        "created": created
    })
    
def save_pharmacy_step_3(request):

    user_id = request.session.get("user_id")

    if not user_id:
        return JsonResponse({
            "success": False,
            "message": "User session expired. Please login again."
        }, status=401)

    try:
        user = User.objects.get(id=user_id)
    except User.DoesNotExist:
        return JsonResponse({
            "success": False,
            "message": "User not found."
        }, status=404)

    try:
        pharmacy_profile = PharmacyProfile.objects.get(user_id=user.id)
    except PharmacyProfile.DoesNotExist:
        return JsonResponse({
            "success": False,
            "message": "Pharmacy profile not found. Please complete Step 1 first."
        }, status=400)

    # Get POST values
    registration_no = request.POST.get("registration_no", "").strip()
    med_lic_no = request.POST.get("med_lic_no", "").strip()
    aadhar_card_no = request.POST.get("aadhar_card_no", "").strip()
    gst_number = request.POST.get("gst_no", "").strip()
    tan_number = request.POST.get("tan_no", "").strip()
    pan_card_no = request.POST.get("pan_card_no", "").strip()

    # Get uploaded files
    registration_file = request.FILES.get("registration_certificate")
    medLicense_file = request.FILES.get("medLicense_certificate")
    aadhar_file = request.FILES.get("aadhar_document")
    pan_file = request.FILES.get("pan_document")
    tan_file = request.FILES.get("tan_document")
    gst_file = request.FILES.get("gst_document")
    # logo_file = request.FILES.get("logo")
    photo_file = request.FILES.get("photo")

    # Validate document numbers
    if not registration_no:
        return JsonResponse({
            "success": False,
            "message": "License number is required."
        }, status=400)
        
    if not med_lic_no:
        return JsonResponse({
            "success": False,
            "message": "Medical license number is required."
        }, status=400)

    if not aadhar_card_no:
        return JsonResponse({
            "success": False,
            "message": "Aadhar number is required."
        }, status=400)

    if not pan_card_no:
        return JsonResponse({
            "success": False,
            "message": "PAN number is required."
        }, status=400)
        
    if not gst_number:
        return JsonResponse({
            "success": False,
            "message": "GST number is required."
        }, status=400)
        
    if not tan_number:
        return JsonResponse({
            "success": False,
            "message": "TAN number is required."
        }, status=400)

    # Validate files
    if not registration_file:
        return JsonResponse({
            "success": False,
            "message": "License document is required."
        }, status=400)
        
    if not medLicense_file:
        return JsonResponse({
            "success": False,
            "message": "Medical license document is required."
        }, status=400)

    if not aadhar_file:
        return JsonResponse({
            "success": False,
            "message": "Aadhar document is required."
        }, status=400)
        
    if not tan_file:
        return JsonResponse({
            "success": False,
            "message": "TAN document is required."
        }, status=400)
        
    if not gst_file:
        return JsonResponse({
            "success": False,
            "message": "GST document is required."
        }, status=400)        

    if not pan_file:
        return JsonResponse({
            "success": False,
            "message": "PAN document is required."
        }, status=400)

    if not photo_file:
        return JsonResponse({
            "success": False,
            "message": "Image is required."
        }, status=400)

    registration_file_path, err = validate_and_save_file(
        registration_file,
        "registration_certificate",
        "Registration Certificate",
        "pharmacy"
    )

    if err:
        return JsonResponse({
            "success": False,
            "message": err
        }, status=400)
        
    medLicense_file_path, err = validate_and_save_file(
        medLicense_file,
        "medLicense_certificate",
        "MedicalLicense Certificate",
        "pharmacy"
    )

    if err:
        return JsonResponse({
            "success": False,
            "message": err
        }, status=400)
        
    aadhar_file_path, err = validate_and_save_file(
        aadhar_file,
        "aadhar_document",
        "Aadhar Document",
        "pharmacy"
    )

    if err:
        return JsonResponse({
            "success": False,
            "message": err
        }, status=400)
        
    pan_file_path, err = validate_and_save_file(
        pan_file,
        "pan_document",
        "PAN Document",
        "pharmacy"
    )

    if err:
        return JsonResponse({
            "success": False,
            "message": err
        }, status=400)
      
    tan_file_path, err = validate_and_save_file(
        tan_file,
        "tan_document",
        "TAN Document",
        "pharmacy"
    )

    if err:
        return JsonResponse({
            "success": False,
            "message": err
        }, status=400)
      
      
    gst_file_path, err = validate_and_save_file(
        gst_file,
        "gst_document",
        "GST Document",
        "pharmacy"
    )

    if err:
        return JsonResponse({
            "success": False,
            "message": err
        }, status=400)
        
    photo_file_path, err = validate_and_save_file(
        photo_file,
        "photo",
        "Pharmacy Photo",
        "pharmacy"
    )

    if err:
        return JsonResponse({
            "success": False,
            "message": err
        }, status=400)
        
    
    pharmacy_profile.pharmacy_registration_number = registration_no
    pharmacy_profile.incorporation_doc_path = registration_file_path
    
    pharmacy_profile.medical_license_number = med_lic_no
    pharmacy_profile.medical_license_doc_path = medLicense_file_path

    pharmacy_profile.admin_identity_number = aadhar_card_no
    pharmacy_profile.admin_identity_doc_path = aadhar_file_path

    pharmacy_profile.pan_number = pan_card_no
    pharmacy_profile.pan_doc_path = pan_file_path
    
    pharmacy_profile.tan_number = tan_number
    pharmacy_profile.tan_doc_path = tan_file_path
    
    pharmacy_profile.gst_number = gst_number
    pharmacy_profile.gst_doc_path = gst_file_path

    pharmacy_profile.storefront_image_path = photo_file_path

    pharmacy_profile.save()

    return JsonResponse({
        "success": True,
        "message": "Pharmacy documents saved successfully.",
        "profile_id": pharmacy_profile.id,
        "redirect_url": reverse("dashboard")
    })
  
# def pharmacy_profile_review(request):
#     return render(request, 'registration/kyc_doctor_profile_review.html')
