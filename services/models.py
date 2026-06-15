from django.db import models

# Create your models here.

class DoctorBidStatus(models.TextChoices):
    PENDING = "pending", "Pending"
    ACCEPTED = "accepted", "Accepted"
    REJECTED = "rejected", "Rejected"
    EXPIRED = "expired", "Expired"


class HospitalBidStatus(models.TextChoices):
    PENDING = "pending", "Pending"
    ACCEPTED = "accepted", "Accepted"
    REJECTED = "rejected", "Rejected"
    CANCELLED = "cancelled", "Cancelled"


class LabBidStatus(models.TextChoices):
    PENDING = "pending", "Pending"
    ACCEPTED = "accepted", "Accepted"
    REJECTED = "rejected", "Rejected"
    CANCELLED = "cancelled", "Cancelled"


class PharmacyBidStatus(models.TextChoices):
    PENDING = "pending", "Pending"
    ACCEPTED = "accepted", "Accepted"
    REJECTED = "rejected", "Rejected"
    CANCELLED = "cancelled", "Cancelled"


## Doctor Services

class ServiceCategory(models.Model):
    name = models.CharField(max_length=100, unique=True)

    class Meta:
        db_table = "service_categories"


class ServiceDescription(models.Model):
    category = models.ForeignKey(
        ServiceCategory, on_delete=models.CASCADE, related_name="services"
    )
    name = models.CharField(max_length=150)

    class Meta:
        db_table = "service_descriptions"


class DoctorServiceRate(models.Model):
    doctor = models.ForeignKey(
        "registration.DoctorProfile", on_delete=models.CASCADE
    )
    category = models.ForeignKey(ServiceCategory, on_delete=models.CASCADE)
    service = models.ForeignKey(ServiceDescription, on_delete=models.CASCADE)
    price = models.FloatField(default=0)

    class Meta:
        db_table = "doctor_service_rates"


class VisitType(models.Model):
    name = models.CharField(max_length=100, unique=True)

    class Meta:
        db_table = "visit_types"


class DoctorVisitCharge(models.Model):
    doctor = models.ForeignKey(
        "registration.DoctorProfile", on_delete=models.CASCADE
    )
    visit_type = models.ForeignKey(VisitType, on_delete=models.CASCADE)
    price = models.FloatField(default=0)

    class Meta:
        db_table = "doctor_visit_charges"


class DoctorBidding(models.Model):
    appointment = models.ForeignKey(
        "appointments.DoctorAppointment",
        on_delete=models.CASCADE,
        related_name="bids"
    )
    doctor = models.ForeignKey(
        "registration.DoctorProfile",
        on_delete=models.CASCADE,
        related_name="bids"
    )

    service_charges = models.DecimalField(max_digits=10, decimal_places=2)
    visit_charges = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    total_bid_amount = models.DecimalField(max_digits=10, decimal_places=2)

    delivery_time = models.IntegerField(default=2)
    remarks = models.CharField(max_length=255, blank=True, null=True)

    is_active = models.BooleanField(default=True)
    bid_status = models.CharField(
        max_length=20,
        choices=DoctorBidStatus.choices,
        default=DoctorBidStatus.PENDING
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "doctor_bidding"

## Hospital

class HospitalBidding(models.Model):
    appointment = models.ForeignKey(
        "appointments.HospitalAppointments",
        on_delete=models.CASCADE,
        related_name="bids"
    )
    hospital = models.ForeignKey(
        "registration.HospitalProfile",
        on_delete=models.CASCADE,
        related_name="bids"
    )

    service_charges = models.DecimalField(max_digits=10, decimal_places=2)
    room_charges = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    total_bid_amount = models.DecimalField(max_digits=10, decimal_places=2)

    delivery_time = models.IntegerField()
    remarks = models.CharField(max_length=255, blank=True, null=True)

    is_active = models.BooleanField(default=True)
    bid_status = models.CharField(
        max_length=20,
        choices=HospitalBidStatus.choices,
        default=HospitalBidStatus.PENDING
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "hospital_bidding"


class HospitalServiceRateCard(models.Model):
    hospital = models.ForeignKey(
        "registration.HospitalProfile",
        on_delete=models.CASCADE,
        related_name="service_rate_cards"
    )

    category = models.ForeignKey(
        "appointments.HospitalCategory",
        on_delete=models.CASCADE
    )

    description = models.ForeignKey(
        "appointments.HospitalServiceDescription",
        on_delete=models.CASCADE,
        db_column="service_description_id"   # IMPORTANT FIX
    )

    price = models.DecimalField(max_digits=10, decimal_places=2)
    is_active = models.BooleanField(default=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "hospital_service_rate_card"


class HospitalRoomRateCard(models.Model):
    hospital = models.ForeignKey(
        "registration.HospitalProfile",
        on_delete=models.CASCADE,
        related_name="room_rate_cards"
    )
    bed_room = models.ForeignKey(
        "appointments.HospitalBedRoom",
        on_delete=models.CASCADE
    )

    ac = models.BooleanField(default=False)
    days = models.IntegerField()
    price = models.DecimalField(max_digits=10, decimal_places=2)
    bed_no = models.IntegerField()
    is_active = models.BooleanField(default=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "hospital_room_rate_card"

## Lab

class LabBidding(models.Model):
    appointment = models.ForeignKey(
        "appointments.LabAppointments",
        on_delete=models.CASCADE,
        related_name="lab_bids"
    )
    lab = models.ForeignKey(
        "registration.LabProfile",
        on_delete=models.CASCADE,
        related_name="bids"
    )

    bid_amount = models.DecimalField(max_digits=10, decimal_places=2)
    bid_gst = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    total_amount = models.DecimalField(max_digits=10, decimal_places=2)
    delivery_time = models.IntegerField()
    remarks = models.CharField(max_length=255, blank=True, null=True)

    bid_status = models.CharField(
        max_length=20,
        choices=LabBidStatus.choices,
        default=LabBidStatus.PENDING
    )
    is_active = models.BooleanField(default=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "lab_bidding"

class LabTestCategory(models.Model):
    name = models.CharField(max_length=100, unique=True)

    class Meta:
        db_table = "lab_test_category"


class LabTestPackageMaster(models.Model):
    name = models.CharField(max_length=255, unique=True)
    category = models.ForeignKey(
        LabTestCategory, on_delete=models.SET_NULL, null=True
    )

    class Meta:
        db_table = "lab_test_package_master"

class LabModeType(models.Model):
    name = models.CharField(max_length=100, unique=True)

    class Meta:
        db_table = "lab_mode_type"

    def __str__(self):
        return self.name

class LabRegion(models.Model):
    name = models.CharField(max_length=100, unique=True)

    class Meta:
        db_table = "lab_region"

    def __str__(self):
        return self.name
    
class LabDays(models.Model):
    name = models.CharField(max_length=50)

    class Meta:
        db_table = "lab_days"

class LabRatePackage(models.Model):
    lab = models.ForeignKey("registration.LabProfile", on_delete=models.CASCADE)
    category = models.ForeignKey(LabTestCategory, on_delete=models.CASCADE)
    package = models.ForeignKey(LabTestPackageMaster, on_delete=models.CASCADE)

    days = models.ForeignKey(LabDays, on_delete=models.PROTECT)
    price = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    is_active = models.BooleanField(default=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "lab_rate_package"

class LabRateMode(models.Model):
    lab = models.ForeignKey(
        "registration.LabProfile",
        on_delete=models.CASCADE,
        related_name="rate_modes"
    )
    mode_type = models.ForeignKey(
        LabModeType,
        on_delete=models.CASCADE,
        related_name="rate_modes"
    )
    region = models.ForeignKey(
        LabRegion,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="rate_modes"
    )

    price = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    is_active = models.BooleanField(default=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "lab_rate_mode"
        unique_together = ("lab", "mode_type", "region")

    def __str__(self):
        return f"{self.lab_id} - {self.mode_type.name}"

## Pharmacy
class PharmacyBidding(models.Model):
    order = models.ForeignKey(
        "orders.UserPurchase",
        on_delete=models.CASCADE,
        related_name="bids"
    )
    pharmacy = models.ForeignKey(
        "registration.PharmacyProfile",
        on_delete=models.CASCADE,
        related_name="bids"
    )

    bid_amount = models.DecimalField(max_digits=10, decimal_places=2)
    bid_gst = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    total_amount = models.DecimalField(max_digits=10, decimal_places=2)
    delivery_time = models.IntegerField()
    remarks = models.CharField(max_length=255, blank=True, null=True)

    bid_status = models.CharField(
        max_length=20,
        choices=PharmacyBidStatus.choices,
        default=PharmacyBidStatus.PENDING
    )
    is_active = models.BooleanField(default=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "pharmacy_bidding"


class MedicineType(models.Model):
    name = models.CharField(max_length=50, unique=True)
    is_active = models.BooleanField(default=True)

    class Meta:
        db_table = "medicine_types"

    def __str__(self):
        return self.name
    
class PharmacyMedicine(models.Model):
    pharmacy = models.ForeignKey(
        "registration.PharmacyProfile",
        on_delete=models.CASCADE,
        related_name="medicines"
    )

    category = models.CharField(max_length=100)
    name = models.CharField(max_length=255)
    type = models.CharField(max_length=50)
    quantity = models.CharField(max_length=100)
    price = models.DecimalField(max_digits=10, decimal_places=2)
    is_active = models.BooleanField(default=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "pharmacy_medicines"
