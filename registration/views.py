from django.shortcuts import render
import os
import re
from django.conf import settings
from django.urls import reverse
from django.core.files.storage import default_storage
from django.views.decorators.csrf import csrf_protect
from django.http import JsonResponse
from django.views.decorators.http import require_POST
from django.contrib.auth.hashers import make_password, check_password
from django.core.validators import validate_email
from django.core.exceptions import ValidationError
from .models import User, NGOProfile
from .models import User, UserProfile



ROLE_TO_TEMPLATE = {
    "login": "login/login.html",
    "customer": "registration/register_user.html",
    "ngoOwner": "registration/ngo_register.html",
    "medicalProvider": "registration/medical_provider_register.html",
    "client": "registration/client_register.html",
    "advertiser": "registration/advertiser_register.html",
}

def welcome(request):
    return render(request, 'registration/welcome.html')

def register_by_role(request, role):
    tpl = ROLE_TO_TEMPLATE.get(role)
    if not tpl:
        tpl = "registration/welcome.html"
    print(f"Rendering registration page for role: {role}")
    return render(request, tpl)

ALLOWED_EXTENSIONS = {'.pdf', '.jpg', '.jpeg', '.png'}
MAX_FILE_SIZE = 5 * 1024 * 1024  # 5 MB

def is_file_clean(file_obj):
    return True

def validate_and_save_file(file_obj, subdir, field_label):
   
    if not file_obj:
      return '', f"{field_label} is required."

    ext = os.path.splitext(file_obj.name)[1].lower()
    if ext not in ALLOWED_EXTENSIONS:
        return '', f"{field_label} must be a PDF or image file."

    if file_obj.size > MAX_FILE_SIZE:
        return '', f"{field_label} must be under 5MB."

    if not is_file_clean(file_obj):
        return '', f"{field_label} failed virus scan."

    upload_dir = os.path.join('ngo_docs', subdir)
    os.makedirs(os.path.join(settings.MEDIA_ROOT, upload_dir), exist_ok=True)
    filename = default_storage.save(os.path.join(upload_dir, file_obj.name), file_obj)
    return filename, None 

@csrf_protect
@require_POST
def save_ngo(request):
    data = request.POST
    files = request.FILES
    errors = {}

    # --- Validation ---
    email = data.get("email")
    if not email:
        errors["email"] = "Email is required."
    else:
        try:
            validate_email(email)
        except ValidationError:
            errors["email"] = "Enter a valid email address."
        if User.objects.filter(email=email).exists():
            errors["email"] = "This email is already registered."

    password = data.get("password")
    confirm_password = data.get("confirm_password")
    if not password or len(password) < 8:
        errors["password"] = "Password is required (min 8 chars)."
    elif password != confirm_password:
        errors["confirm_password"] = "Passwords do not match."

    # Phone and country code
    phone_country_code = "+91"  # default; 
    phone_number = data.get("phone_number1")
    if not phone_number or not re.match(r"^\d{8,15}$", phone_number):
        errors["phone_number1"] = "Enter a valid phone number (8-15 digits)."

    ngo_name = data.get("company_name")
    if not ngo_name:
        errors["company_name"] = "NGO Name is required."

    website_url = data.get("website_url")
    ngo_services = request.POST.getlist("ngo_services[]")
    if not ngo_services:
        errors["ngo_services"] = "Select at least one NGO service."

    address = data.get("address")
    if not address:
        errors["address"] = "Address is required."
    city = data.get("dist")
    if not city:
        errors["dist"] = "City/District is required."
    state = data.get("state")
    if not state:
        errors["state"] = "State is required."
    pincode = data.get("pincode")
    if not pincode or not re.match(r"^\d{4,10}$", pincode):
        errors["pincode"] = "Enter a valid pincode."
    country = data.get("country")
    if not country:
        errors["country"] = "Country is required."

    ngo_registration_number = data.get("ngo_registration_number")
    if not ngo_registration_number:
        errors["ngo_registration_number"] = "Registration Number is required."

    # --- File validations and saves ---
    ngo_registration_doc_path, err = validate_and_save_file(
        files.get("ngo_registration_doc"), "registration", "Registration Document")
    if err:
        errors["ngo_registration_doc"] = err

    pan_number = data.get("pan_number")
    pan_doc_path, err = validate_and_save_file(
        files.get("pan_doc"), "pan", "PAN Document")
    if pan_number and not pan_doc_path:
        errors["pan_doc"] = "PAN document is required if PAN number is provided."
    if err:
        errors["pan_doc"] = err

    gst_number = data.get("gst_number")
    gst_doc_path, err = validate_and_save_file(
        files.get("gst_doc"), "gst", "GST Document")
    if gst_number and not gst_doc_path:
        errors["gst_doc"] = "GST document is required if GST number is provided."
    if err:
        errors["gst_doc"] = err

    tan_number = data.get("tan_number")
    tan_doc_path, err = validate_and_save_file(
        files.get("tan_doc"), "tan", "TAN Document")
    if tan_number and not tan_doc_path:
        errors["tan_doc"] = "TAN document is required if TAN number is provided."
    if err:
        errors["tan_doc"] = err

    section8_number = data.get("section8_number")
    section8_doc_path, err = validate_and_save_file(
        files.get("section8_doc"), "section8", "Section 8 Document")
    if section8_number and not section8_doc_path:
        errors["section8_doc"] = "Section 8 document is required if number is provided."
    if err:
        errors["section8_doc"] = err

    doc_12a_number = data.get("doc_12a_number")
    doc_12a_path, err = validate_and_save_file(
        files.get("doc_12a"), "doc_12a", "12A Document")
    if doc_12a_number and not doc_12a_path:
        errors["doc_12a"] = "12A document is required if number is provided."
    if err:
        errors["doc_12a"] = err

    brand_image_path, err = validate_and_save_file(
        files.get("brand_image"), "brand_image", "Brand Image")
    if brand_image_path and err:
        errors["brand_image"] = err

    brand_description = data.get("brand_description", "")
    email_otp = data.get("otp1", "")  # from HTML field "otp1"
    referral_code = data.get("referral_code", "")
    contact_person_name = data.get("contact_person_name", "")
    contact_person_phone = data.get("contact_person_phone", "")
    contact_person_role = data.get("contact_person_role", "")
    contact_person_designation = data.get("contact_person_designation", "")
    contact_person_otp = data.get("otp2", "")

    if errors:
        print("Validation errors:", errors)
        return JsonResponse({"success": False, "errors": errors}, status=400)

    # --- Save User & NGOProfile ---
    user = User.objects.create(
        email=email,
        phone_country_code=phone_country_code,
        phone_number=phone_number,
        password=make_password(password),
        user_type="ngo"
    )

    ngo_profile = NGOProfile.objects.create(
        user=user,
        ngo_name=ngo_name,
        ngo_services=ngo_services,
        website_url=website_url,
        address=address,
        city=city,
        state=state,
        pincode=pincode,
        country=country,
        ngo_registration_number=ngo_registration_number,
        ngo_registration_doc_path=ngo_registration_doc_path,
        ngo_registration_doc_virus_scanned=True if ngo_registration_doc_path else False,
        pan_number=pan_number,
        pan_doc_path=pan_doc_path,
        pan_doc_virus_scanned=True if pan_doc_path else False,
        gst_number=gst_number,
        gst_doc_path=gst_doc_path,
        gst_doc_virus_scanned=True if gst_doc_path else False,
        tan_number=tan_number,
        tan_doc_path=tan_doc_path,
        tan_doc_virus_scanned=True if tan_doc_path else False,
        section8_number=section8_number,
        section8_doc_path=section8_doc_path,
        section8_doc_virus_scanned=True if section8_doc_path else False,
        doc_12a_number=doc_12a_number,
        doc_12a_path=doc_12a_path,
        doc_12a_virus_scanned=True if doc_12a_path else False,
        brand_image_path=brand_image_path,
        brand_image_virus_scanned=True if brand_image_path else False,
        brand_description=brand_description,
        email_otp=email_otp,
        referral_code=referral_code,
    )

    # Save Contact Person
    if contact_person_name and contact_person_phone:
        from .models import ContactPerson
        ContactPerson.objects.create(
            profile_type='ngo',
            profile_id=ngo_profile.id,
            name=contact_person_name,
            phone_country_code=phone_country_code,
            phone_number=contact_person_phone,
            role=contact_person_role,
            designation=contact_person_designation,
            otp=contact_person_otp,
            referral_code=referral_code,
            email_otp=email_otp
        )

    return JsonResponse({"success": True, "message": "NGO registered successfully."})

@csrf_protect
@require_POST
def save_user(request):
    data = request.POST

    errors = {}

    # Email
    email = data.get("email")
    if not email:
        errors["email"] = "Email is required."
    else:
        try:
            validate_email(email)
        except ValidationError:
            errors["email"] = "Enter a valid email address."
        if User.objects.filter(email=email).exists():
            errors["email"] = "This email is already registered."

    # Password
    password = data.get("password")
    if not password or len(password) < 8:
        errors["password"] = "Password is required (min 8 chars)."

    # Phone
    phone_number = data.get("phone_number")
    if not phone_number or not re.match(r"^\d{8,15}$", phone_number):
        errors["phone_number"] = "Enter a valid phone number (8-15 digits)."

    # Name
    name = data.get("name")
    if not name:
        errors["name"] = "Name is required."

    # DOB (optional, but check format if provided)
    dob = data.get("dob")
    if dob and not re.match(r"^\d{4}-\d{2}-\d{2}$", dob):
        errors["dob"] = "Enter a valid date (YYYY-MM-DD)."

    # Gender (optional, but check if provided)
    gender = data.get("gender")
    if gender and gender not in ("male", "female", "other"):
        errors["gender"] = "Select a valid gender."

    address = data.get("address")
    if not address:
        errors["address"] = "Address is required."
    city = data.get("city")
    if not city:
        errors["city"] = "City/District is required."
    state = data.get("state")
    if not state:
        errors["state"] = "State is required."
    pincode = data.get("pincode")
    if not pincode or not re.match(r"^\d{4,10}$", pincode):
        errors["pincode"] = "Enter a valid pincode."
    country = data.get("country")
    if not country:
        errors["country"] = "Country is required."

    referral_code = data.get("referral_code", "")
    otp = data.get("otp", "")
    phone_country_code = data.get("phone_country_code", "+91")

    # If any errors, return as JSON
    if errors:
        return JsonResponse({"success": False, "errors": errors}, status=400)

    user = User.objects.create(
        email=email,
        phone_country_code=phone_country_code,
        phone_number=phone_number,
        password=make_password(password),
        user_type="user"
    )

    UserProfile.objects.create(
        user=user,
        name=name,
        dob=dob or None,
        gender=gender,
        address=address,
        city=city,
        state=state,
        pincode=pincode,
        country=country,
        referral_code=referral_code,
        otp=otp,
    )
    return JsonResponse({"success": True, "message": "User registered successfully."})

def login_page(request):
    return render(request, 'login/login.html')


@csrf_protect
@require_POST
def login_auth(request):
    data = request.POST
    email = data.get("email", "").strip()
    password = data.get("password", "").strip()
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
        request.session['user_id'] = user.id
        dashboard_url = reverse("dashboard")
        return JsonResponse({"success": True, "redirect": dashboard_url})
    except User.DoesNotExist:
        errors["password"] = "Invalid email or password."
        return JsonResponse({"success": False, "errors": errors})
