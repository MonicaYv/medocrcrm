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
from settings.models import SellerSubscription
from core.settings import MONGO_COLLECTIONS

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
            "pharmacy_medicines": medicines,
            "has_pharmacy_medicines": medicines.exists(),
            "has_premium": bool(sub and not sub.is_expired),
            "subscription": sub,
        })
        return render(request, 'pharmacy/services.html', context)
    
    elif user.user_type == 'lab':
        sub = SellerSubscription.objects.filter(
            seller_type="lab",
            seller_profile_id=user.lab_profile.id,
            is_active=True,
            is_enabled=True
        ).first()
        context["lab_categories"] = LabTestCategory.objects.all()
        context["lab_packages"] = LabTestPackageMaster.objects.select_related("category")
        context["lab_modes"] = LabModeType.objects.all()
        context["lab_regions"] = LabRegion.objects.all()
        context["lab_days"] = LabDays.objects.all()
        context["has_premium"] = bool(sub and not sub.is_expired)
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

        context["hospital_categories"] = list(
            HospitalCategory.objects.values("id", "name")
        )

        context["hospital_services"] = list(
            HospitalServiceDescription.objects.values(
                "id", "description"
            )
        )

        context["hospital_bed_rooms"] = list(
            HospitalBedRoom.objects.values("id", "name")
        )

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
