import secrets
from django.utils import timezone
from datetime import time
from django.db import models

class State(models.Model):
    name = models.CharField(max_length=128, unique=True)

    class Meta:
        db_table = "state"

    def __str__(self):
        return self.name


class City(models.Model):
    name = models.CharField(max_length=128)
    state = models.ForeignKey(State, on_delete=models.CASCADE, related_name="cities")

    class Meta:
        db_table = "city"
        unique_together = ("name", "state")

    def __str__(self):
        return f"{self.name} - {self.state.name}"
    
class AdvertiserType(models.Model):
    name = models.CharField(max_length=100, unique=True)
    is_active = models.BooleanField(default=True)
    def __str__(self):
        return self.name
    
class AdServiceReq(models.Model):
    name = models.CharField(max_length=100, unique=True)
    is_active = models.BooleanField(default=True)
    def __str__(self):
        return self.name
    
class ClientService(models.Model):
    name = models.CharField(max_length=100, unique=True)
    is_active = models.BooleanField(default=True)
    def __str__(self):
        return self.name
    
class ClientType(models.Model):
    name = models.CharField(max_length=100, unique=True)
    is_active = models.BooleanField(default=True)
    def __str__(self):
        return self.name
    
class NGOService(models.Model):
    name = models.CharField(max_length=100, unique=True)
    is_active = models.BooleanField(default=True)
    def __str__(self):
        return self.name

class PharmacyType(models.Model):
    name = models.CharField(max_length=100, unique=True)
    is_active = models.BooleanField(default=True)
    def __str__(self):
        return self.name
    class Meta:
            db_table = 'pharmacy_type'
    
class PharmacyServices(models.Model):
    name = models.CharField(max_length=100, unique=True)
    is_active = models.BooleanField(default=True)
    def __str__(self):
        return self.name
    class Meta:
            db_table = 'pharmacy_services'

class PharmacyTiming(models.Model):
    day_of_week = models.CharField(max_length=20)
    is_active = models.BooleanField(default=True)
    class Meta:
        db_table = 'pharmacy_timing'
    def __str__(self):
        return self.day_of_week

class LabService(models.Model):
    name = models.CharField(max_length=100, unique=True, null=True, blank=True)
    is_active = models.BooleanField(default=True)
    class Meta:
        db_table = 'lab_service'
    
class LabFacility(models.Model):
    name = models.CharField(max_length=100, unique=True, null=True, blank=True)
    is_active = models.BooleanField(default=True)
    class Meta:
        db_table = 'lab_facility'        
    
class LabTiming(models.Model):
    open_time = models.TimeField(null=True, blank=True)
    close_time = models.TimeField(null=True, blank=True)
    is_active = models.BooleanField(default=True)
    class Meta:
        db_table = 'lab_timing'   

class DoctorSpeciality(models.Model):
    name = models.CharField(max_length=100, unique=True)
    is_active = models.BooleanField(default=True)

    class Meta:
        db_table = "doctor_speciality"

    def __str__(self):
        return self.name

class DoctorEducation(models.Model):
    name = models.CharField(max_length=100, unique=True)
    is_active = models.BooleanField(default=True)

    class Meta:
        db_table = "doctor_education"

    def __str__(self):
        return self.name

class DoctorExperience(models.Model):
    years = models.IntegerField(unique=True)
    is_active = models.BooleanField(default=True)

    class Meta:
        db_table = "doctor_experience"

    def __str__(self):
        return f"{self.years} Years"

class HospitalTiming(models.Model):
    id = models.AutoField(primary_key=True)
    name = models.CharField(max_length=255)
    open_time = models.TimeField(null=True, blank=True)
    close_time = models.TimeField(null=True, blank=True)
    days = models.CharField(max_length=50)
    is_active = models.BooleanField(default=True)

    class Meta:
        db_table = "hospital_timing"
        ordering = ["id"]

    def __str__(self):
        return self.name

class PharmacyTypeAssociation(models.Model):
    pharmacy = models.ForeignKey(
        'PharmacyProfile',
        db_column='pharmacy_id',
        on_delete=models.CASCADE
    )

    pharmacy_type = models.ForeignKey(
        'PharmacyType',
        db_column='type_id',
        on_delete=models.CASCADE
    )

    class Meta:
        db_table = 'pharmacy_profile_types'
        managed = False

class PharmacyServiceAssociation(models.Model):
    pharmacy = models.ForeignKey(
        'PharmacyProfile',
        db_column='pharmacy_id',
        on_delete=models.CASCADE
    )

    pharmacy_service = models.ForeignKey(
        'PharmacyServices',
        db_column='service_id',
        on_delete=models.CASCADE
    )

    class Meta:
        db_table = 'pharmacy_profile_services'
        managed = False


class User(models.Model):
    USER_TYPE_CHOICES = [
        ('advertiser', 'Advertiser'),
        ('client', 'Client'),
        ('ngo', 'NGO'),
        ('pharmacy', 'Pharmacy'),
        ('doctor', 'Doctor'),
        ('lab', 'Lab'),
        ('hospital', 'Hospital'),
        ('user', 'User'),
    ]
    email = models.EmailField(unique=True)
    phone_country_code = models.CharField(max_length=8, blank=True, null=True)
    phone_number = models.CharField(max_length=20, blank=True, null=True)
    password = models.CharField(max_length=255)
    user_type = models.CharField(max_length=32, choices=USER_TYPE_CHOICES)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    inapp_notifications = models.BooleanField(default=True)
    email_notifications = models.BooleanField(default=True)
    push_notifications = models.BooleanField(default=True)
    regulatory_alerts = models.BooleanField(default=True)
    promotions_and_offers = models.BooleanField(default=True)
    payment_notifications = models.BooleanField(default=True)
    location_notification = models.BooleanField(default=True)
    quite_mode = models.BooleanField(default=False)
    quite_mode_start_time = models.TimeField(blank=True, null=True, default=time(22, 0))
    quite_mode_end_time = models.TimeField(blank=True, null=True, default=time(6, 0))
    is_active = models.BooleanField(default=True)
    last_login = models.DateTimeField(blank=True, null=True)
    last_login_ip = models.CharField(max_length=45, blank=True, null=True, default=None)

class UserProfile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE)
    first_name = models.CharField(max_length=255)
    last_name = models.CharField(max_length=255, blank=True, null=True)
    age = models.IntegerField(null=True, blank=True)
    gender = models.CharField(max_length=16, blank=True, null=True)
    pan_number = models.CharField(max_length=32, blank=True, null=True)
    profile_photo_path = models.CharField(max_length=255, blank=True, null=True)
    referral_code = models.CharField(max_length=64, blank=True, null=True)
    otp = models.CharField(max_length=64, blank=True, null=True)

class UserAddress(models.Model):
    user = models.ForeignKey(
        UserProfile,
        on_delete=models.CASCADE,
        related_name="addresses",
        db_column="user_profile_id"
    )

    address_type = models.CharField(max_length=64)
    first_name = models.CharField(max_length=255)
    last_name = models.CharField(max_length=255, blank=True, null=True)

    phone_number = models.CharField(max_length=20)

    country = models.CharField(max_length=128)

    state = models.ForeignKey(
        State,
        on_delete=models.SET_NULL,
        null=True
    )

    city = models.ForeignKey(
        City,
        on_delete=models.SET_NULL,
        null=True
    )

    pincode = models.CharField(max_length=20)

    address = models.TextField()

    latitude = models.FloatField(blank=True, null=True)
    longitude = models.FloatField(blank=True, null=True)

    class Meta:
        db_table = "registration_useraddress"
        managed = False

    def __str__(self):
        city_name = self.city.name if self.city else ""
        return f"{self.address_type} - {city_name}"

    
class UserReferral(models.Model):
    referrer = models.ForeignKey(User, on_delete=models.CASCADE, related_name='referrals_made')
    referred = models.ForeignKey(User, on_delete=models.CASCADE, related_name='referrals_received')
    created_at = models.DateTimeField(default=timezone.now)
    
class AdvertiserProfile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE)
    company_name = models.CharField(max_length=255)
    advertiser_type = models.ForeignKey(AdvertiserType, on_delete=models.CASCADE, blank=True, null=True)
    ad_services_required = models.ForeignKey(AdServiceReq, on_delete=models.CASCADE, blank=True, null=True)
    website_url = models.CharField(max_length=255, blank=True, null=True)
    address = models.TextField(blank=True, null=True)
    city = models.CharField(max_length=128, blank=True, null=True)
    state = models.CharField(max_length=128, blank=True, null=True)
    pincode = models.CharField(max_length=20, blank=True, null=True)
    country = models.CharField(max_length=128, blank=True, null=True)
    incorporation_number = models.CharField(max_length=128, blank=True, null=True)
    incorporation_doc_path = models.CharField(max_length=255, blank=True, null=True)
    incorporation_doc_virus_scanned = models.BooleanField(default=False)
    pan_number = models.CharField(max_length=32, blank=True, null=True)
    pan_doc_path = models.CharField(max_length=255, blank=True, null=True)
    pan_doc_virus_scanned = models.BooleanField(default=False)
    gst_number = models.CharField(max_length=32, blank=True, null=True)
    gst_doc_path = models.CharField(max_length=255, blank=True, null=True)
    gst_doc_virus_scanned = models.BooleanField(default=False)
    tan_number = models.CharField(max_length=32, blank=True, null=True)
    tan_doc_path = models.CharField(max_length=255, blank=True, null=True)
    tan_doc_virus_scanned = models.BooleanField(default=False)
    brand_image_path = models.CharField(max_length=255, blank=True, null=True)
    brand_image_virus_scanned = models.BooleanField(default=False)
    brand_description = models.TextField(blank=True, null=True)
    email_otp = models.CharField(max_length=16, blank=True, null=True)
    referral_code = models.CharField(max_length=64, blank=True, null=True)

class ClientProfile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE)
    company_name = models.CharField(max_length=255)
    company_type = models.ForeignKey(ClientType, on_delete=models.CASCADE, blank=True, null=True)
    services_interested = models.ForeignKey(ClientService, on_delete=models.CASCADE, blank=True, null=True)
    website_url = models.CharField(max_length=255, blank=True, null=True)
    address = models.TextField(blank=True, null=True)
    city = models.CharField(max_length=128, blank=True, null=True)
    state = models.CharField(max_length=128, blank=True, null=True)
    pincode = models.CharField(max_length=20, blank=True, null=True)
    country = models.CharField(max_length=128, blank=True, null=True)
    incorporation_number = models.CharField(max_length=128, blank=True, null=True)
    incorporation_doc_path = models.CharField(max_length=255, blank=True, null=True)
    incorporation_doc_virus_scanned = models.BooleanField(default=False)
    pan_number = models.CharField(max_length=32, blank=True, null=True)
    pan_doc_path = models.CharField(max_length=255, blank=True, null=True)
    pan_doc_virus_scanned = models.BooleanField(default=False)
    gst_number = models.CharField(max_length=32, blank=True, null=True)
    gst_doc_path = models.CharField(max_length=255, blank=True, null=True)
    gst_doc_virus_scanned = models.BooleanField(default=False)
    tan_number = models.CharField(max_length=32, blank=True, null=True)
    tan_doc_path = models.CharField(max_length=255, blank=True, null=True)
    tan_doc_virus_scanned = models.BooleanField(default=False)
    email_otp = models.CharField(max_length=16, blank=True, null=True)
    referral_code = models.CharField(max_length=64, blank=True, null=True)
    
class NGOProfile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE)
    ngo_name = models.CharField(max_length=255)
    ngo_services = models.ForeignKey(NGOService, on_delete=models.CASCADE, blank=True, null=True)
    website_url = models.CharField(max_length=255, blank=True, null=True)
    address = models.TextField(blank=True, null=True)
    state = models.ForeignKey(State, on_delete=models.SET_NULL, null=True)
    city = models.ForeignKey(City, on_delete=models.SET_NULL, null=True)
    pincode = models.CharField(max_length=20, blank=True, null=True)
    country = models.CharField(max_length=128, blank=True, null=True)
    ngo_registration_number = models.CharField(max_length=128, blank=True, null=True)
    ngo_registration_doc_path = models.CharField(max_length=255, blank=True, null=True)
    ngo_registration_doc_virus_scanned = models.BooleanField(default=False)
    pan_number = models.CharField(max_length=32, blank=True, null=True)
    pan_doc_path = models.CharField(max_length=255, blank=True, null=True)
    pan_doc_virus_scanned = models.BooleanField(default=False)
    gst_number = models.CharField(max_length=32, blank=True, null=True)
    gst_doc_path = models.CharField(max_length=255, blank=True, null=True)
    gst_doc_virus_scanned = models.BooleanField(default=False)
    tan_number = models.CharField(max_length=32, blank=True, null=True)
    tan_doc_path = models.CharField(max_length=255, blank=True, null=True)
    tan_doc_virus_scanned = models.BooleanField(default=False)
    section8_number = models.CharField(max_length=128, blank=True, null=True)
    section8_doc_path = models.CharField(max_length=255, blank=True, null=True)
    section8_doc_virus_scanned = models.BooleanField(default=False)
    doc_12a_number = models.CharField(max_length=128, blank=True, null=True)
    doc_12a_path = models.CharField(max_length=255, blank=True, null=True)
    doc_12a_virus_scanned = models.BooleanField(default=False)
    brand_image_path = models.CharField(max_length=255, blank=True, null=True)
    brand_image_virus_scanned = models.BooleanField(default=False)
    brand_description = models.TextField(blank=True, null=True)
    email_otp = models.CharField(max_length=16, blank=True, null=True)
    referral_code = models.CharField(max_length=64, blank=True, null=True)

class PharmacyProfile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE)
    first_name = models.CharField(max_length=100, blank=True, null=True)
    last_name = models.CharField(max_length=100, blank=True, null=True)
    gender = models.CharField(max_length=20, blank=True, null=True)
    age = models.PositiveIntegerField(blank=True, null=True)
    personal_email = models.CharField(max_length=255, blank=True, null=True)
    personal_phone_number = models.CharField(max_length=20, blank=True, null=True)
    personal_pan_number = models.CharField(max_length=50, blank=True, null=True)
    website = models.CharField(max_length=255, blank=True, null=True)
    company_name = models.CharField(max_length=255)
    pharmacy_types = models.ManyToManyField(
        PharmacyType,
        through='PharmacyTypeAssociation',
        related_name='pharmacies',
        blank=True
    )

    services = models.ManyToManyField(
        PharmacyServices,
        through='PharmacyServiceAssociation',
        related_name='pharmacies',
        blank=True
    )
    pharmacy_timing = models.ForeignKey(PharmacyTiming, on_delete=models.CASCADE, blank=True, null=True)
    address = models.TextField(blank=True, null=True)
    state = models.ForeignKey(State, on_delete=models.SET_NULL, null=True)
    city = models.ForeignKey(City, on_delete=models.SET_NULL, null=True)
    pincode = models.CharField(max_length=20, blank=True, null=True)
    country = models.CharField(max_length=128, blank=True, null=True, default='India')
    incorporation_number = models.CharField(max_length=128, blank=True, null=True)
    incorporation_doc_path = models.CharField(max_length=255, blank=True, null=True)
    incorporation_doc_virus_scanned = models.BooleanField(default=False)
    pan_number = models.CharField(max_length=32, blank=True, null=True)
    pan_doc_path = models.CharField(max_length=255, blank=True, null=True)
    pan_doc_virus_scanned = models.BooleanField(default=False)
    gst_number = models.CharField(max_length=32, blank=True, null=True)
    gst_doc_path = models.CharField(max_length=255, blank=True, null=True)
    gst_doc_virus_scanned = models.BooleanField(default=False)
    tan_number = models.CharField(max_length=32, blank=True, null=True)
    tan_doc_path = models.CharField(max_length=255, blank=True, null=True)
    tan_doc_virus_scanned = models.BooleanField(default=False)
    medical_license_number = models.CharField(max_length=128, blank=True, null=True)
    medical_license_doc_path = models.CharField(max_length=255, blank=True, null=True)
    medical_license_doc_virus_scanned = models.BooleanField(default=False)
    storefront_image_path = models.CharField(max_length=255, blank=True, null=True)
    storefront_image_virus_scanned = models.BooleanField(default=False)
    selfie_path_for_applock = models.CharField(max_length=255, blank=True, null=True)
    selfie_virus_scanned = models.BooleanField(default=False)
    is_verified = models.BooleanField(default=False)
    verification_status = models.CharField(max_length=20, default='pending')  # e.g., pending, approved, rejected
    rejection_reason = models.TextField(blank=True, null=True)
    verified_at = models.DateTimeField(blank=True, null=True)
    referral_code = models.CharField(max_length=64, blank=True, null=True)
    otp = models.CharField(max_length=64, blank=True, null=True)

    def __str__(self):
        return f"{self.company_name} ({self.user.email})"

class LabProfile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, db_column="user_id", related_name="lab_profile",)

    lab_name = models.CharField(max_length=255, null=True, blank=True)
    owner_name = models.CharField(max_length=255, null=True, blank=True)
    contact_number = models.CharField(max_length=50, null=True, blank=True)
    alt_contact_number = models.CharField(max_length=50, null=True, blank=True)
    lab_registration_number = models.CharField(max_length=100, null=True, blank=True)
    address = models.TextField(null=True, blank=True)
    state = models.ForeignKey(State, on_delete=models.SET_NULL, null=True)
    city = models.ForeignKey(City, on_delete=models.SET_NULL, null=True)
    pincode = models.CharField(max_length=20, null=True, blank=True)
    country = models.CharField(max_length=128, blank=True, null=True, default='India')
    lab_timing = models.ForeignKey(LabTiming, on_delete=models.SET_NULL, null=True, blank=True, db_column="lab_timing_id", related_name="lab_profiles")
    services = models.ManyToManyField(LabService, through="LabProfileServices", related_name="labs")
    facilities = models.ManyToManyField(LabFacility, through="LabProfileFacilities", related_name="labs")

    lab_certificate_number = models.CharField(max_length=100, null=True, blank=True)
    lab_certificate_path = models.CharField(max_length=255, null=True, blank=True)
    lab_certificate_virus_scanned = models.BooleanField(default=False)
    identity_proof_aadhar_number = models.CharField(max_length=100, null=True, blank=True)
    identity_proof_aadhar_path = models.CharField(max_length=255, null=True, blank=True)
    identity_proof_aadhar_virus_scanned = models.BooleanField(default=False)
    identity_proof_pan_number = models.CharField(max_length=100, null=True, blank=True)
    identity_proof_pan_path = models.CharField(max_length=255, null=True, blank=True)
    identity_proof_pan_virus_scanned = models.BooleanField(default=False)
    gov_license_number = models.CharField(max_length=100, null=True, blank=True)
    gov_license_path = models.CharField(max_length=255, null=True, blank=True)
    gov_license_virus_scanned = models.BooleanField(default=False)
    lab_photo_path = models.CharField(max_length=255, null=True, blank=True)
    lab_photo_virus_scanned = models.BooleanField(default=False)

    is_verified = models.BooleanField(default=False)
    verification_status = models.CharField(max_length=20, default="pending")
    rejection_reason = models.TextField(null=True, blank=True)
    verified_at = models.DateTimeField(null=True, blank=True)
    otp = models.CharField(max_length=64, null=True, blank=True)
    referral_code = models.CharField(max_length=64, null=True, blank=True)

    class Meta:
        db_table = "registration_labprofile"

class LabProfileFacilities(models.Model):
    id = models.AutoField(primary_key=True)
    lab = models.ForeignKey(LabProfile, on_delete=models.CASCADE, db_column="lab_id")
    facility = models.ForeignKey(LabFacility, on_delete=models.CASCADE, db_column="facility_id")

    class Meta:
        db_table = "lab_profile_facilities"
        unique_together = ("lab", "facility")


class LabProfileServices(models.Model):
    id = models.AutoField(primary_key=True)
    lab = models.ForeignKey(LabProfile, on_delete=models.CASCADE, db_column="lab_id")
    service = models.ForeignKey(LabService, on_delete=models.CASCADE, db_column="service_id")

    class Meta:
        db_table = "lab_profile_services"
        unique_together = ("lab", "service")

class HospitalProfile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, db_column="user_id", related_name="hospital_profile",)

    hospital_name = models.CharField(max_length=255, null=True, blank=True)
    owner_name = models.CharField(max_length=255, null=True, blank=True)
    contact_no = models.CharField(max_length=20, null=True, blank=True)
    alternate_contact_no = models.CharField(max_length=20, null=True, blank=True)
    address = models.TextField(null=True, blank=True)
    state = models.ForeignKey(State, on_delete=models.SET_NULL, null=True)
    city = models.ForeignKey(City, on_delete=models.SET_NULL, null=True)
    pincode = models.CharField(max_length=20, null=True, blank=True)
    country = models.CharField(max_length=128, blank=True, null=True, default='India')
    hospital_timing = models.ForeignKey(HospitalTiming, on_delete=models.SET_NULL, null=True, db_column="hospital_timing_id")
    home_visit = models.BooleanField(default=False)

    registration_no = models.CharField(max_length=128, null=True, blank=True)
    registration_certificate_path = models.CharField(max_length=255, null=True, blank=True)
    registration_doc_virus_scanned = models.BooleanField(default=False)
    aadhar_card_no = models.CharField(max_length=20, null=True, blank=True)
    aadhar_doc_path = models.CharField(max_length=255, null=True, blank=True)
    aadhar_doc_virus_scanned = models.BooleanField(default=False)
    pan_card_no = models.CharField(max_length=20, null=True, blank=True)
    pan_doc_path = models.CharField(max_length=255, null=True, blank=True)
    pan_doc_virus_scanned = models.BooleanField(default=False)
    hospital_logo_path = models.CharField(max_length=255, null=True, blank=True)
    hospital_logo_virus_scanned = models.BooleanField(default=False)
    hospital_photo_path = models.CharField(max_length=255, null=True, blank=True)
    hospital_photo_virus_scanned = models.BooleanField(default=False)

    phone_for_otp = models.CharField(max_length=20, null=True, blank=True)
    is_verified = models.BooleanField(default=False)
    verification_status = models.CharField(max_length=20, default="pending")
    rejection_reason = models.TextField(null=True, blank=True)
    verified_at = models.DateTimeField(null=True, blank=True)
    otp = models.CharField(max_length=64, null=True, blank=True)
    referral_code = models.CharField(max_length=64, null=True, blank=True)

    class Meta:
        db_table = "registration_hospitalprofile"

class DoctorProfile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name="doctor_profile", db_column="user_id")
    full_name = models.CharField(max_length=255, null=True, blank=True)
    gender = models.CharField(max_length=20, null=True, blank=True)
    age = models.IntegerField(null=True, blank=True)
    specialty = models.ForeignKey(DoctorSpeciality, on_delete=models.SET_NULL, null=True, blank=True, related_name="doctors")
    education = models.ForeignKey(DoctorEducation, on_delete=models.SET_NULL, null=True, blank=True, related_name="doctors")
    experience = models.ForeignKey(DoctorExperience, on_delete=models.SET_NULL, null=True, blank=True, related_name="doctors")
    profile_photo_path = models.CharField(max_length=255, null=True, blank=True)
    profile_photo_virus_scanned = models.BooleanField(default=False)
    clinic_name = models.CharField(max_length=255, null=True, blank=True)
    owner_name = models.CharField(max_length=255, null=True, blank=True)
    contact_number = models.CharField(max_length=50, null=True, blank=True)
    alt_contact_number = models.CharField(max_length=50, null=True, blank=True)
    full_address = models.TextField(null=True, blank=True)
    state = models.ForeignKey(State, on_delete=models.SET_NULL, null=True)
    city = models.ForeignKey(City, on_delete=models.SET_NULL, null=True)
    pincode = models.CharField(max_length=20, null=True, blank=True)
    country = models.CharField(max_length=128, blank=True, null=True, default='India')
    clinic_timing_from = models.CharField(max_length=100, null=True, blank=True)
    clinic_timing_to = models.CharField(max_length=100, null=True, blank=True)
    home_visit_available = models.BooleanField(default=False)
    registration_number = models.CharField(max_length=100, null=True, blank=True)
    registration_certificate_path = models.CharField(max_length=255, null=True, blank=True)
    registration_certificate_virus_scanned = models.BooleanField(default=False)
    aadhar_number = models.CharField(max_length=100, null=True, blank=True)
    aadhar_doc_path = models.CharField(max_length=255, null=True, blank=True)
    aadhar_doc_virus_scanned = models.BooleanField(default=False)
    pan_number = models.CharField(max_length=100, null=True, blank=True)
    pan_doc_path = models.CharField(max_length=255, null=True, blank=True)
    pan_doc_virus_scanned = models.BooleanField(default=False)
    clinic_logo_path = models.CharField(max_length=255, null=True, blank=True)
    clinic_logo_virus_scanned = models.BooleanField(default=False)
    clinic_photo_path = models.CharField(max_length=255, null=True, blank=True)
    clinic_photo_virus_scanned = models.BooleanField(default=False)
    is_verified = models.BooleanField(default=False)
    verification_status = models.CharField(max_length=20, default="pending")
    rejection_reason = models.TextField(null=True, blank=True)
    verified_at = models.DateTimeField(null=True, blank=True)
    otp = models.CharField(max_length=64, null=True, blank=True)
    referral_code = models.CharField(max_length=64, null=True, blank=True)
    class Meta:
        db_table = "registration_doctorprofile"
    def __str__(self):
        return self.full_name or f"Doctor #{self.id}"

class ContactPerson(models.Model):
    PROFILE_TYPE_CHOICES = [
        ('advertiser', 'Advertiser'),
        ('client', 'Client'),
        ('ngo', 'NGO'),
        ('pharmacy', 'Pharmacy'),
        ('hospital', 'Hospital'),
        ('doctor', 'Doctor'),
        ('lab', 'Lab Technician'),
    ]
    profile_type = models.CharField(max_length=32, choices=PROFILE_TYPE_CHOICES)
    profile = models.ForeignKey(User, on_delete=models.CASCADE)
    name = models.CharField(max_length=255)
    phone_country_code = models.CharField(max_length=8, blank=True, null=True)
    phone_number = models.CharField(max_length=20, blank=True, null=True)
    role = models.CharField(max_length=128, blank=True, null=True)
    otp = models.CharField(max_length=16, blank=True, null=True)
    referral_code = models.CharField(max_length=64, blank=True, null=True)
    email_otp = models.CharField(max_length=16, blank=True, null=True)

class PasswordResetToken(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    token = models.CharField(max_length=128, unique=True)
    created_at = models.DateTimeField(auto_now_add=True)

    @staticmethod
    def create_token(user):
        token = secrets.token_urlsafe(32)
        return PasswordResetToken.objects.create(user=user, token=token)
    
    def is_valid(self):
        return (timezone.now() - self.created_at).total_seconds() < 1800