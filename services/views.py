import json
from django.http import JsonResponse
from django.shortcuts import get_object_or_404, render
from django.views.decorators.http import require_POST
from django.http import HttpResponse
from dashboard.utils import dashboard_login_required, get_common_context
from .models import (
    LabRatePackage, 
    LabTestCategory, 
    LabTestPackageMaster, 
    LabModeType, 
    LabRegion, 
    LabDays, 
    LabRateMode,
    ServiceCategory,
    ServiceDescription, 
    VisitType,
    DoctorServiceRate,
    DoctorVisitCharge,
    MedicineType,
    PharmacyMedicine,
)
from registration.models import LabProfile
from settings.models import SellerSubscription
from core.settings import MONGO_COLLECTIONS
from django.conf import settings

def build_media_url(path):
    if not path:
        return ""

    path = str(path).replace("\\", "/").strip()
    if path.startswith(("http://", "https://", "/")):
        return path

    return f"{settings.MEDIA_URL.rstrip('/')}/{path.lstrip('/')}"


@dashboard_login_required
def services(request):
    user = request.user_obj
    context = get_common_context(request, user)

    if user.user_type == 'pharmacy':
        pharmacy_profile = user.pharmacyprofile
        master_medicine = MONGO_COLLECTIONS["master_medicine"]
        pipeline = [
            {
                "$group": {
                    "_id": "$sub_category",
                    "medicines": { "$addToSet": "$product_name" }
                }
            },
            {
                "$project": {
                    "_id": 0,
                    "category": "$_id",
                    "medicines": 1
                }
            }
        ]

        result = list(master_medicine.aggregate(pipeline))
        medicine_map = {}
        categories = []

        for row in result:
            if row["category"]:
                categories.append(row["category"])
                medicine_map[row["category"]] = sorted(row["medicines"])

        context["medicine_categories"] = sorted(categories)
        context["medicine_map"] = json.dumps(medicine_map)

        types = MedicineType.objects.filter(is_active=True).values_list("name", flat=True)
        context["medicine_types"] = list(types)

        medicines = PharmacyMedicine.objects.filter(
            pharmacy=pharmacy_profile,
            is_active=True
        ).order_by("-updated_at", "-created_at")

        sub = SellerSubscription.objects.filter(
            seller_type="pharmacy",
            seller_profile_id=pharmacy_profile.id,
            is_active=True,
            is_enabled=True
        ).first()

        context.update({
            "pharmacy_profile": pharmacy_profile,
            "pharmacy_storefront_image_url": build_media_url(
                pharmacy_profile.storefront_image_path
            ),
            "pharmacy_medicines": medicines,
            "has_pharmacy_medicines": medicines.exists(),
            "has_premium": bool(sub and not sub.is_expired),
            "subscription": sub,
        })
        return render(request, 'pharmacy/services.html', context)
    
    elif user.user_type == 'lab':
        lab_profile = LabProfile.objects.get(user=user)

        sub = SellerSubscription.objects.filter(
            seller_type="lab",
            seller_profile_id=lab_profile.id,
            is_active=True,
            is_enabled=True
        ).first()

        package_count = LabRatePackage.objects.filter(
            lab=lab_profile,
            is_active=True
        ).count()

        mode_count = LabRateMode.objects.filter(
            lab=lab_profile,
            is_active=True
        ).count()

        has_services = package_count > 0 or mode_count > 0

        context.update({
            "lab_profile": lab_profile,
            "lab_categories": LabTestCategory.objects.all(),
            "lab_packages": LabTestPackageMaster.objects.select_related("category"),
            "lab_modes": LabModeType.objects.all(),
            "lab_regions": LabRegion.objects.all(),
            "lab_days": LabDays.objects.all(),

            "has_services": has_services,
            "package_count": package_count,
            "mode_count": mode_count,

            "has_premium": bool(sub and not sub.is_expired),
            "subscription": sub,
            "button_text": "Get Started Now",
            "subscription_url": "/settings/?tab=subscription",
        })

        return render(request, 'lab/services.html', context)
    
    elif user.user_type == 'doctor':
        context["service_categories"] = ServiceCategory.objects.all()
        context["service_descriptions"] = ServiceDescription.objects.select_related("category")
        context["visit_types"] = VisitType.objects.all()
        return render(request, 'doctor/services.html', context)

    elif user.user_type == 'hospital':
        from appointments.models import (
            HospitalCategory,
            HospitalServiceDescription,
            HospitalBedRoom
        )
        from .models import HospitalServiceRateCard, HospitalRoomRateCard

        hospital_profile = user.hospital_profile

        categories = HospitalCategory.objects.values("id", "name")
        services = HospitalServiceDescription.objects.values("id", "description")
        bed_rooms = HospitalBedRoom.objects.values("id", "name")

        service_cards = list(
            HospitalServiceRateCard.objects.filter(
                hospital=hospital_profile,
                is_active=True
            ).select_related("category", "description").order_by("-updated_at", "-created_at")
        )
        room_cards = list(
            HospitalRoomRateCard.objects.filter(
                hospital=hospital_profile,
                is_active=True
            ).select_related("bed_room").order_by("-updated_at", "-created_at")
        )

        sub = SellerSubscription.objects.filter(
            seller_type="hospital",
            seller_profile_id=hospital_profile.id,
            is_active=True,
            is_enabled=True
        ).first()
        service_count = len(service_cards)
        room_count = len(room_cards)
        has_services = service_count > 0 or room_count > 0
        context.update({
            "hospital_profile": hospital_profile,
            "hospital_categories": list(categories),
            "hospital_services": list(services),
            "hospital_bed_rooms": list(bed_rooms),
            "hospital_service_cards": service_cards,
            "hospital_room_cards": room_cards,
            "has_hospital_cards": bool(service_cards or room_cards),
            "has_premium": bool(sub and not sub.is_expired),
            "has_services": has_services,
            "subscription": sub,
        })
        print("SERVICE COUNT:", len(service_cards))
        print("ROOM COUNT:", len(room_cards))
        print("HAS SERVICES:", bool(service_cards or room_cards))
        print("Context:", context)

        return render(request, 'hospital/services.html', context)



    
@dashboard_login_required
def save_lab_services(request):
    if request.method != "POST":
        return JsonResponse({"error": "Invalid request"}, status=400)

    data = json.loads(request.body)

    services    = data.get("services", [])
    collections = data.get("collections", [])

    lab = request.user_obj.lab_profile

    saved_services    = []
    saved_collections = []

    for s in services:
        try:
            category = LabTestCategory.objects.get(id=s["category_id"])
            package  = LabTestPackageMaster.objects.get(id=s["package_id"])
        except (LabTestCategory.DoesNotExist, LabTestPackageMaster.DoesNotExist):
            continue

        day_obj = None
        if s.get("days"):
            try:
                day_obj = LabDays.objects.get(id=s["days"])
            except LabDays.DoesNotExist:
                pass

        if not day_obj:
            day_obj = LabDays.objects.first()

        if not day_obj:
            return JsonResponse({
                "success": False,
                "error": "No LabDays found. Please add at least one day."
            }, status=400)

        obj = LabRatePackage.objects.create(
            lab=lab,
            category=category,
            package=package,
            days=day_obj,
            price=s.get("price") or 0
        )

        saved_services.append({
            "category_name": category.name,
            "package_name": package.name,
            "days_name": obj.days.name if obj.days else "",
            "price": str(obj.price)
        })

    for c in collections:
        try:
            mode = LabModeType.objects.get(id=c["mode_id"])
        except LabModeType.DoesNotExist:
            continue

        region = None
        if c.get("region_id"):
            try:
                region = LabRegion.objects.get(id=c["region_id"])
            except LabRegion.DoesNotExist:
                pass

        obj, created = LabRateMode.objects.update_or_create(
            lab=lab,
            mode_type=mode,
            region=region,
            defaults={
                "price": c.get("price") or 0,
                "is_active": True
            }
        )

        saved_collections.append({
            "mode_name": obj.mode_type.name,
            "region_name": obj.region.name if obj.region else None,
            "price": str(obj.price)
        })

    return JsonResponse({
        "success": True,
        "data": saved_services,
        "collection_data": saved_collections
    })


@dashboard_login_required
def get_lab_services(request):
    lab = request.user_obj.lab_profile

    # check premium
    sub = SellerSubscription.objects.filter(
        seller_type="lab",
        seller_profile_id=lab.id,
        is_active=True,
        is_enabled=True
    ).first()

    has_premium = bool(sub and not sub.is_expired)

    packages = LabRatePackage.objects.filter(lab=lab).select_related(
        "category", "package", "days"
    )

    test_packages = []
    for p in packages:
        test_packages.append({
            "id": p.id,
            "type": "test-package",
            "category_id": p.category.id,
            "package_id": p.package.id,
            "days_id": p.days.id if p.days else None,
            "category": p.category.name,
            "package": p.package.name,
            "days": p.days.name if p.days else "",
            "price": str(p.price)
        })

    modes = LabRateMode.objects.filter(lab=lab).select_related(
        "mode_type", "region"
    )

    collection_modes = []
    for m in modes:
        collection_modes.append({
            "id": m.id,
            "type": "collection-mode",
            "mode_id": m.mode_type.id,
            "region_id": m.region.id if m.region else None,
            "mode": m.mode_type.name,
            "region": m.region.name if m.region else "",
            "price": str(m.price)
        })

    return JsonResponse({
        "success": True,
        "has_premium": has_premium,
        "test_packages": test_packages,
        "collection_modes": collection_modes
    })

@dashboard_login_required
@require_POST
def delete_lab_service(request, service_type, service_id):
    lab = request.user_obj.lab_profile

    if service_type == "test-package":
        obj = get_object_or_404(
            LabRatePackage,
            id=service_id,
            lab=lab
        )
        obj.delete()
        return JsonResponse({"success": True})

    if service_type == "collection-mode":
        obj = get_object_or_404(
            LabRateMode,
            id=service_id,
            lab=lab
        )
        obj.delete()
        return JsonResponse({"success": True})

    return JsonResponse({
        "success": False,
        "error": "Invalid service type"
    }, status=400)

@dashboard_login_required
@require_POST
def update_lab_service(request, service_type, service_id):
    lab = request.user_obj.lab_profile
    data = json.loads(request.body)

    price = data.get("price") or 0

    if service_type == "test-package":
        obj = get_object_or_404(
            LabRatePackage,
            id=service_id,
            lab=lab
        )

        category = LabTestCategory.objects.get(id=data.get("category_id"))
        package = LabTestPackageMaster.objects.get(id=data.get("package_id"))

        obj.category = category
        obj.package = package
        obj.price = price
        obj.save()

        return JsonResponse({"success": True})

    if service_type == "collection-mode":
        obj = get_object_or_404(
            LabRateMode,
            id=service_id,
            lab=lab
        )

        mode = LabModeType.objects.get(id=data.get("mode_id"))
        region = LabRegion.objects.get(id=data.get("region_id"))

        obj.mode_type = mode
        obj.region = region
        obj.price = price
        obj.save()

        return JsonResponse({"success": True})

    return JsonResponse({"success": False}, status=400)

@dashboard_login_required
@require_POST
def save_doctor_services(request):
    try:
        data = json.loads(request.body)
    except json.JSONDecodeError:
        return JsonResponse(
            {"success": False, "error": "Invalid JSON"},
            status=400
        )

    services = data.get("services", [])
    visits   = data.get("visits", [])

    doctor = request.user_obj.doctor_profile

    saved_services = []
    saved_visits   = []

    # ----------------------------
    # SAVE DOCTOR SERVICES
    # ----------------------------
    for s in services:
        try:
            category = ServiceCategory.objects.get(id=s["category_id"])
            service  = ServiceDescription.objects.get(id=s["service_id"])
        except (ServiceCategory.DoesNotExist, ServiceDescription.DoesNotExist):
            continue

        obj, created = DoctorServiceRate.objects.update_or_create(
            doctor=doctor,
            category=category,
            service=service,
            defaults={
                "price": s.get("price") or 0
            }
        )

        saved_services.append({
            "category": category.name,
            "service": service.name,
            "price": str(obj.price)
        })

    # ----------------------------
    # SAVE VISIT CHARGES
    # ----------------------------
    for v in visits:
        try:
            visit_type = VisitType.objects.get(id=v["visit_type_id"])
        except VisitType.DoesNotExist:
            continue

        obj, created = DoctorVisitCharge.objects.update_or_create(
            doctor=doctor,
            visit_type=visit_type,
            defaults={
                "price": v.get("price") or 0
            }
        )

        saved_visits.append({
            "visit_type": visit_type.name,
            "price": str(obj.price)
        })

    return JsonResponse({
        "success": True,
        "services": saved_services,
        "visits": saved_visits
    })

@dashboard_login_required
def get_doctor_services(request):
    doctor = request.user_obj.doctor_profile

    services = DoctorServiceRate.objects.filter(
        doctor=doctor
    ).select_related("category", "service")

    visits = DoctorVisitCharge.objects.filter(
        doctor=doctor
    ).select_related("visit_type")

    service_data = []
    for s in services:
        service_data.append({
            "id": s.id,
            "category": s.category.name,
            "service": s.service.name,
            "price": str(s.price),
            "category_id": s.category.id,
            "service_id": s.service.id,
        })

    visit_data = []
    for v in visits:
        visit_data.append({
            "id": v.id,
            "visit_type": v.visit_type.name,
            "price": str(v.price),
            "visit_type_id": v.visit_type.id,
        })
        

    return JsonResponse({
        "success": True,
        "services": service_data,
        "visits": visit_data,
    })

@dashboard_login_required
@require_POST
def delete_doctor_service(request, service_type, service_id):
    doctor = request.user_obj.doctor_profile

    if service_type == "service":
        obj = get_object_or_404(DoctorServiceRate, id=service_id, doctor=doctor)
        obj.delete()
        return JsonResponse({"success": True})

    if service_type == "visit":
        obj = get_object_or_404(DoctorVisitCharge, id=service_id, doctor=doctor)
        obj.delete()
        return JsonResponse({"success": True})

    return JsonResponse({"success": False}, status=400)

@dashboard_login_required
def get_pharmacy_medicines(request):
    pharmacy = request.user_obj.pharmacyprofile

    medicines = PharmacyMedicine.objects.filter(
        pharmacy=pharmacy,
        is_active=True
    )

    data = []
    for m in medicines:
        data.append({
            "id": m.id,
            "category": m.category,
            "name": m.name,
            "type": m.type,
            "quantity": m.quantity,
            "price": str(m.price)
        })

    return JsonResponse({
        "success": True,
        "medicines": data
    })

@dashboard_login_required
@require_POST
def save_pharmacy_medicines(request):
    try:
        data = json.loads(request.body)
    except json.JSONDecodeError:
        return JsonResponse({"success": False}, status=400)

    pharmacy = request.user_obj.pharmacyprofile
    services = data.get("services", [])

    if not isinstance(services, list):
        return JsonResponse({"success": False, "error": "Invalid services"}, status=400)

    saved = []
    for s in services:
        category = str(s.get("category", "")).strip()
        name = str(s.get("name", "")).strip()
        med_type = str(s.get("type", "")).strip()
        quantity = str(s.get("quantity", "")).strip()
        price = s.get("price") or 0

        if not all([category, name, med_type, quantity]):
            continue
        if not quantity.isdigit():
            return JsonResponse({
                "success": False,
                "error": "Quantity should contain numbers only."
            }, status=400)

        obj = PharmacyMedicine.objects.create(
            pharmacy=pharmacy,
            category=category,
            name=name,
            type=med_type,
            quantity=quantity,
            price=price
        )
        saved.append({
            "id": obj.id,
            "category": obj.category,
            "name": obj.name,
            "type": obj.type,
            "quantity": obj.quantity,
            "price": str(obj.price),
        })

    return JsonResponse({"success": True, "medicines": saved})


@dashboard_login_required
@require_POST
def delete_pharmacy_medicine(request, medicine_id):
    pharmacy = request.user_obj.pharmacyprofile
    medicine = get_object_or_404(
        PharmacyMedicine,
        id=medicine_id,
        pharmacy=pharmacy,
        is_active=True
    )
    medicine.is_active = False
    medicine.save(update_fields=["is_active", "updated_at"])
    return JsonResponse({"success": True})

@dashboard_login_required
def pharmacy_dropdowns(request):
    pharmacy = request.user_obj.pharmacyprofile

    medicines = PharmacyMedicine.objects.filter(
        pharmacy=pharmacy,
        is_active=True
    ).values(
        "id", "category", "name", "type", "quantity", "price"
    )

    categories = (
        PharmacyMedicine.objects
        .filter(pharmacy=pharmacy, is_active=True)
        .values_list("category", flat=True)
        .distinct()
    )

    types = (
        PharmacyMedicine.objects
        .filter(pharmacy=pharmacy, is_active=True)
        .values_list("type", flat=True)
        .distinct()
    )

    return JsonResponse({
        "categories": list(categories),
        "types": list(types),
        "medicines": list(medicines)
    })


# Hospital Services APIs
@dashboard_login_required
def get_hospital_services(request):
    hospital = request.user_obj.hospital_profile

    from .models import HospitalServiceRateCard, HospitalRoomRateCard

    services = [
        {
            "id": row.id,
            "category_id": row.category_id,
            "category": row.category.name,
            "service_id": row.description_id,
            "service": row.description.description,
            "price": str(row.price),
        }
        for row in HospitalServiceRateCard.objects.filter(
            hospital=hospital,
            is_active=True
        ).select_related("category", "description")
    ]

    rooms = [
        {
            "id": row.id,
            "bed_room_id": row.bed_room_id,
            "room": row.bed_room.name,
            "ac": row.ac,
            "days": row.days,
            "price": str(row.price),
        }
        for row in HospitalRoomRateCard.objects.filter(
            hospital=hospital,
            is_active=True
        ).select_related("bed_room")
    ]

    return JsonResponse({
        "success": True,
        "services": services,
        "rooms": rooms,
    })


@dashboard_login_required
@require_POST
def save_hospital_services(request):
    try:
        data = json.loads(request.body)
    except json.JSONDecodeError:
        return JsonResponse(
            {"success": False, "error": "Invalid JSON"},
            status=400
        )
    
    hospital = request.user_obj.hospital_profile
    services = data.get("services", [])
    rooms = data.get("rooms", [])
    
    from appointments.models import (
        HospitalCategory,
        HospitalServiceDescription,
        HospitalBedRoom
    )
    from .models import HospitalServiceRateCard, HospitalRoomRateCard
    
    saved_services = []
    saved_rooms = []
    
    # Save services
    for s in services:
        try:
            category = HospitalCategory.objects.get(id=s["category_id"])
            service = HospitalServiceDescription.objects.get(id=s["service_id"])
        except (HospitalCategory.DoesNotExist, HospitalServiceDescription.DoesNotExist):
            continue
        
        obj, created = HospitalServiceRateCard.objects.update_or_create(
            hospital=hospital,
            category=category,
            description=service,
            defaults={
                "price": s.get("price") or 0,
                "is_active": True
            }
        )
        
        saved_services.append({
            "id": obj.id,
            "category": category.name,
            "service": service.description[:50],
            "price": str(obj.price)
        })
    
    # Save rooms
    for r in rooms:
        try:
            bed_room = HospitalBedRoom.objects.get(id=r["bed_room_id"])
        except HospitalBedRoom.DoesNotExist:
            continue
        
        obj, created = HospitalRoomRateCard.objects.update_or_create(
            hospital=hospital,
            bed_room=bed_room,
            ac=r.get("ac", False),
            days=r.get("days") or 1,
            defaults={
                "price": r.get("price") or 0,
                "is_active": True
            }
        )
        
        saved_rooms.append({
            "id": obj.id,
            "room": bed_room.name,
            "ac": obj.ac,
            "days": obj.days,
            "price": str(obj.price)
        })
    
    return JsonResponse({
        "success": True,
        "services": saved_services,
        "rooms": saved_rooms
    })


@dashboard_login_required
def get_hospital_category_services(request):
    category_id = request.GET.get("category_id")
    
    if not category_id:
        return JsonResponse({"error": "Category ID required"}, status=400)
    
    from appointments.models import (
        HospitalCategory,
        HospitalServiceDescription
    )
    
    try:
        category = HospitalCategory.objects.get(id=category_id)
    except HospitalCategory.DoesNotExist:
        return JsonResponse({"error": "Category not found"}, status=404)
    
    services = HospitalServiceDescription.objects.all().values("id", "description")
    
    return JsonResponse({
        "success": True,
        "category": {
            "id": category.id,
            "name": category.name
        },
        "services": list(services)
    })


@dashboard_login_required
@require_POST
def delete_hospital_service(request, rate_id):
    hospital = request.user_obj.hospital_profile
    from .models import HospitalServiceRateCard

    rate_card = get_object_or_404(
        HospitalServiceRateCard,
        id=rate_id,
        hospital=hospital,
        is_active=True,
    )
    rate_card.is_active = False
    rate_card.save(update_fields=["is_active", "updated_at"])
    return JsonResponse({"success": True})


@dashboard_login_required
@require_POST
def delete_hospital_room(request, rate_id):
    hospital = request.user_obj.hospital_profile
    from .models import HospitalRoomRateCard

    rate_card = get_object_or_404(
        HospitalRoomRateCard,
        id=rate_id,
        hospital=hospital,
        is_active=True,
    )
    rate_card.is_active = False
    rate_card.save(update_fields=["is_active", "updated_at"])
    return JsonResponse({"success": True})
