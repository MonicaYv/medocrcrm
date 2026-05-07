from django.shortcuts import render
from dashboard.utils import dashboard_login_required, get_common_context
import json
from django.http import JsonResponse
from django.views.decorators.http import require_POST
from registration.models import (
    User,
    DoctorSpeciality,
    DoctorEducation,
    DoctorExperience,
)
from staff.models import DoctorsProfile, DoctorAvailability
import os
from django.conf import settings
from django.core.files.storage import FileSystemStorage
# Create your views here.

@dashboard_login_required
def staffs(request):
    user = request.user_obj
    context = get_common_context(request,user)
    if user.user_type == "lab":
        return render(request, 'lab/technicians.html', context)
    elif user.user_type == "hospital":
        return render(request, 'hospital/doctors.html', context)
    
@dashboard_login_required
@require_POST
def save_hospital_doctor(request):
    if request.user_obj.user_type != "hospital":
        return JsonResponse({"success": False, "error": "Unauthorized"}, status=403)

    # FormData se data aayega
    data = request.POST
    photo = request.FILES.get("photo")

    name = data.get("name", "").strip()
    phone = data.get("phone", "").strip()
    gender = data.get("gender", "").strip()
    age = data.get("age")
    specialty_name = data.get("specialty", "").strip()
    education_name = data.get("education", "").strip()
    experience_years = data.get("experience", 0)

    # availability JSON string me aayegi, isliye parse karna hai
    try:
        availability = json.loads(data.get("availability", "[]"))
    except json.JSONDecodeError:
        availability = []

    if not name or not phone or not specialty_name:
        return JsonResponse({"success": False, "error": "Required fields missing"}, status=400)

    name_parts = name.split(" ", 1)
    first_name = name_parts[0]
    last_name = name_parts[1] if len(name_parts) > 1 else ""

    specialty, _ = DoctorSpeciality.objects.get_or_create(name=specialty_name)
    education, _ = DoctorEducation.objects.get_or_create(name=education_name)
    experience, _ = DoctorExperience.objects.get_or_create(
        years=int(experience_years or 0)
    )

    # image save
    photo_path = None

    if photo:
        upload_dir = os.path.join(settings.MEDIA_ROOT, "doctor_photos")
        os.makedirs(upload_dir, exist_ok=True)

        fs = FileSystemStorage(location=upload_dir)
        filename = fs.save(photo.name, photo)

        photo_path = "/document/doctor_photos/" + filename

    email = f"doctor_{phone}@hospital.local"

    doctor_user, _ = User.objects.get_or_create(
        email=email,
        defaults={
            "phone_number": phone,
            "phone_country_code": "+91",
            "password": "",
            "user_type": "doctor",
        }
    )

    doctor = DoctorsProfile.objects.create(
        user=doctor_user,
        first_name=first_name,
        last_name=last_name,
        gender=gender,
        age=age or None,
        phone_number=phone,
        phone_country_code="+91",
        specialties=specialty_name,
        specialization=specialty,
        education=education,
        experience=experience,
        profile_pic_path=photo_path,
        created_by_hospital=True,
    )

    for item in availability:
        DoctorAvailability.objects.create(
            doctor=doctor,
            day_of_week=item.get("day"),
            is_available=True,
            start_time=item.get("start_time"),
            end_time=item.get("end_time"),
        )

    return JsonResponse({
        "success": True,
        "doctor": {
            "id": doctor.id,
            "name": f"Dr. {doctor.first_name} {doctor.last_name}".strip(),
            "phone": f"+91 {doctor.phone_number}",
            "specialty": doctor.specialties,
            "rating": "0.0",
            "image": doctor.profile_pic_path or "/static/images/coolen-Smith.jpg",
        }
    })

@dashboard_login_required
def get_hospital_doctors(request):
    if request.user_obj.user_type != "hospital":
        return JsonResponse({"success": False, "error": "Unauthorized"}, status=403)

    doctors = DoctorsProfile.objects.filter(
        created_by_hospital=True,
        is_active=True
    ).values(
        "id",
        "first_name",
        "last_name",
        "phone_number",
        "specialties",
        "profile_pic_path",
        "created_at",
    ).order_by("-created_at")

    data = []

    for d in doctors:
        data.append({
            "id": d["id"],
            "name": f"Dr. {d['first_name']} {d['last_name'] or ''}".strip(),
            "phone": f"+91 {d['phone_number']}" if d["phone_number"] else "",
            "specialty": d["specialties"] or "",
            "rating": "0.0",
            "image": str(d["profile_pic_path"]) if d["profile_pic_path"] else "/static/images/coolen-Smith.jpg",
        })

    return JsonResponse({
        "success": True,
        "doctors": data
    })  