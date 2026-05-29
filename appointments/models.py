from decimal import Decimal
from django.db import models
from django.utils import timezone
from registration.models import User, UserAddress, LabProfile
from django.contrib.postgres.fields import ArrayField

class PaymentMethodEnum(models.TextChoices):
    UPI = "UPI", "UPI"
    CARD = "Card", "Card"
    NETBANKING = "NetBanking", "NetBanking"
    WALLET = "Wallet", "Wallet"
    OTHER = "Other", "Other"

class PaymentStatusEnum(models.TextChoices):
    SUCCESS = "Success", "Success"
    FAILED = "Failed", "Failed"

class PaymentMethod(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, db_column="user_id", related_name="payment_methods")

    card_holder_name = models.CharField(max_length=255, null=False, blank=False)
    card_number_masked = models.CharField(max_length=255, null=False, blank=False)
    card_type = models.CharField(max_length=50, null=False, blank=False)
    expiry_month = models.IntegerField(null=False, blank=False)
    expiry_year = models.IntegerField(null=False, blank=False)
    is_default = models.BooleanField(default=False)
    payment_gateway = models.CharField(max_length=50, default="razorpay")
    status = models.CharField(max_length=50, default="active")

    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "payment_methods"

    def __str__(self):
        return f"{self.card_type} ending with {self.card_number_masked[-4:]}"

class WalletTransaction(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, db_column="user_id")
    order_id = models.CharField(max_length=64, null=True, blank=True)
    tranx_id = models.CharField(max_length=64, unique=True)
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    transaction_type = models.CharField(max_length=50)

    points_earned = models.DecimalField(max_digits=10, decimal_places=2, default=Decimal("0.00"))
    current_balance = models.DecimalField(max_digits=12, decimal_places=2)
    created_at = models.DateTimeField(default=timezone.now)

    class Meta:
        db_table = "wallet_transactions"


## Lab Appointments 

class LabTestType(models.Model):
    name = models.CharField(max_length=100, unique=True)

    class Meta:
        db_table = "labtest_type"

    def __str__(self):
        return self.name


class LabTestDescription(models.Model):
    description = models.TextField()

    class Meta:
        db_table = "labtest_description"

    def __str__(self):
        return self.description[:50]


class LabTestPackages(models.Model):
    packages = models.CharField(max_length=100, unique=True)

    class Meta:
        db_table = "labtest_packages"

    def __str__(self):
        return self.packages


class AppointmentStatus(models.TextChoices):
    PENDING = "Pending", "Pending"
    ACCEPTED = "Accepted", "Accepted"
    COMPLETED = "Completed", "Completed"
    CANCELLED = "Cancelled", "Cancelled"
    # MISSED = "Missed", "Missed"



class LabAppointments(models.Model):

    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name="lab_appointments"
    )
    address = models.ForeignKey(
        "registration.UserAddress",
        on_delete=models.CASCADE,
        related_name="lab_appointments",
    )

    test_type = models.ForeignKey(
        LabTestType,
        on_delete=models.SET_NULL,
        null=True,
        related_name="lab_appointments",
    )
    test_description = models.ForeignKey(
        LabTestDescription,
        on_delete=models.SET_NULL,
        null=True,
        related_name="lab_appointments",
    )
    test_package = models.ForeignKey(
        LabTestPackages,
        on_delete=models.SET_NULL,
        null=True,
        related_name="lab_appointments",
    )

    preferred_mode = models.CharField(max_length=20, null=True, blank=True)
    service_type = models.CharField(max_length=20, null=True, blank=True)
    preferred_date_time = models.DateTimeField(null=True, blank=True)
    budget = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)

    status = models.CharField(
        max_length=20,
        choices=AppointmentStatus.choices,
        default=AppointmentStatus.PENDING
    )

    accepted_bid = models.ForeignKey(
        "services.LabBidding",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="accepted_lab_appointments"
    )
    accepted_lab = models.ForeignKey(
        "registration.LabProfile",
        on_delete=models.SET_NULL,
        null=True, blank=True,
        related_name="accepted_lab_appointments"
    )

    accepted_total_amount = models.DecimalField(
        max_digits=10, decimal_places=2,
        null=True, blank=True
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "lab_appointments"

    def __str__(self):
        return f"Appointment #{self.id} - {self.user}"

## Hospital Appointments
class HospitalServiceType(models.Model):
    name = models.CharField(max_length=150, unique=True)

    class Meta:
        db_table = "hospital_service_type"

    def __str__(self):
        return self.name


class HospitalServiceDescription(models.Model):
    description = models.TextField()

    class Meta:
        db_table = "hospital_service_description"

    def __str__(self):
        return self.description[:50]


class HospitalCategory(models.Model):
    name = models.CharField(max_length=150)

    class Meta:
        db_table = "hospital_category"

    def __str__(self):
        return self.name


class HospitalBedRoom(models.Model):
    name = models.CharField(max_length=150)

    class Meta:
        db_table = "hospital_beds_rooms"

    def __str__(self):
        return self.name

class HospitalAppointmentStatus(models.TextChoices):
    PENDING = "Pending", "Pending"
    ACCEPTED = "Accepted", "Accepted"
    COMPLETED = "Completed", "Completed"
    CANCELLED = "Cancelled", "Cancelled"

class HospitalAppointments(models.Model):
    user = models.ForeignKey(
        "registration.User",
        on_delete=models.CASCADE,
        related_name="hospital_appointments"
    )

    address = models.ForeignKey(
        "registration.UserAddress",
        on_delete=models.SET_NULL,
        null=True,
        blank=True
    )

    service_type = models.ForeignKey(
        HospitalServiceType,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        db_column="service_type_id",
        related_name="appointments"
    )

    description = models.ForeignKey(
        HospitalServiceDescription,
        on_delete=models.SET_NULL,
        null=True,
        blank=True
    )

    category = models.ForeignKey(
        HospitalCategory,
        on_delete=models.SET_NULL,
        null=True,
        blank=True
    )

    bed_room = models.ForeignKey(
        HospitalBedRoom,
        on_delete=models.SET_NULL,
        null=True,
        blank=True
    )

    preferred_mode = models.CharField(max_length=20)   # visit / home-service
    service_mode = models.CharField(
    max_length=20,
    null=True,
    blank=True,
    db_column="service_type"
    )  # emergency / normal

    preferred_date_from = models.DateTimeField(null=True, blank=True)
    preferred_date_to = models.DateTimeField(null=True, blank=True)

    budget = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)

    status = models.CharField(
        max_length=20,
        choices=HospitalAppointmentStatus.choices,
        default=HospitalAppointmentStatus.PENDING
    )

    accepted_bid = models.ForeignKey(
        "services.HospitalBidding",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="accepted_appointments"
    )

    accepted_hospital = models.ForeignKey(
        "registration.HospitalProfile",
        on_delete=models.SET_NULL,
        null=True,
        blank=True
    )

    accepted_total_amount = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        null=True,
        blank=True
    )
    

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "hospital_appointments"

    def __str__(self):
        return f"Hospital Appointment #{self.id}"

## Doctors Appointments
class HealthIssue(models.Model):
    name = models.CharField(max_length=255, unique=True)

    class Meta:
        db_table = "health_issues"

    def __str__(self):
        return self.name

class DoctorAppointment(models.Model):
    user = models.ForeignKey(
        "registration.User",
        on_delete=models.CASCADE,
        related_name="doctor_appointments"
    )

    doctor = models.ForeignKey(
        "registration.DoctorProfile",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="appointments"
    )

    address = models.ForeignKey(
        "registration.UserAddress",
        on_delete=models.CASCADE,
        related_name="doctor_appointments"
    )

    description = models.TextField(null=True, blank=True)

    consultation_type = models.CharField(
        max_length=20,
        help_text="clinic_visit | home_visit"
    )

    service_type = models.CharField(
        max_length=20,
        help_text="emergency | normal"
    )

    preferred_date_time = models.DateTimeField(null=True, blank=True)

    budget = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        null=True,
        blank=True
    )

    status = models.CharField(
        max_length=20,
        default="Pending"
    )

    specialization_ids = ArrayField(
        models.IntegerField(),
        blank=True,
        default=list
    )

    health_issue_ids = ArrayField(
        models.IntegerField(),
        blank=True,
        default=list
    )

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "doctor_appointments"

    def __str__(self):
        return f"Doctor Appointment #{self.id}"

class SpecializationServiceMap(models.Model):
    specialization = models.ForeignKey(
        "registration.DoctorSpeciality",
        on_delete=models.CASCADE,
        related_name="service_mappings"
    )

    service_category = models.ForeignKey(
        "services.ServiceCategory",
        on_delete=models.CASCADE,
        related_name="specialization_mappings"
    )

    class Meta:
        db_table = "specialization_service_map"
        unique_together = ("specialization", "service_category")

    def __str__(self):
        return f"{self.specialization} → {self.service_category}"

class HealthIssueServiceMap(models.Model):
    health_issue = models.ForeignKey(
        HealthIssue,
        on_delete=models.CASCADE,
        related_name="service_mappings"
    )

    service = models.ForeignKey(
        "services.ServiceDescription",
        on_delete=models.CASCADE,
        related_name="health_issue_mappings"
    )

    class Meta:
        db_table = "healthissue_service_map"
        unique_together = ("health_issue", "service")

    def __str__(self):
        return f"{self.health_issue} → {self.service}"
