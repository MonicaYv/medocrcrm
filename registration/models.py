from django.db import models
from django.contrib.postgres.fields import ArrayField

class User(models.Model):
    USER_TYPE_CHOICES = [
        ('advertiser', 'Advertiser'),
        ('client', 'Client'),
        ('ngo', 'NGO'),
        ('provider', 'Medical Provider'),
        ('user', 'User'),
    ]
    email = models.EmailField(unique=True)
    phone_country_code = models.CharField(max_length=8, blank=True, null=True)
    phone_number = models.CharField(max_length=20, blank=True, null=True)
    password = models.CharField(max_length=255)
    user_type = models.CharField(max_length=32, choices=USER_TYPE_CHOICES)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

class UserProfile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE)
    name = models.CharField(max_length=255)
    dob = models.DateField(blank=True, null=True)
    gender = models.CharField(max_length=16, blank=True, null=True)
    address = models.TextField(blank=True, null=True)
    city = models.CharField(max_length=128, blank=True, null=True)
    state = models.CharField(max_length=128, blank=True, null=True)
    pincode = models.CharField(max_length=20, blank=True, null=True)
    country = models.CharField(max_length=128, blank=True, null=True)
    referral_code = models.CharField(max_length=64, blank=True, null=True)
    otp = models.CharField(max_length=16, blank=True, null=True)
    email_otp = models.CharField(max_length=16, blank=True, null=True)

class AdvertiserProfile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE)
    company_name = models.CharField(max_length=255)
    advertiser_type = ArrayField(models.CharField(max_length=64), blank=True, null=True)
    ad_services_required = ArrayField(models.CharField(max_length=64), blank=True, null=True)
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
    company_type = models.CharField(max_length=128)
    services_interested = ArrayField(models.CharField(max_length=128), blank=True, null=True)
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
    ngo_services = ArrayField(models.CharField(max_length=128), blank=True, null=True)
    website_url = models.CharField(max_length=255, blank=True, null=True)
    address = models.TextField(blank=True, null=True)
    city = models.CharField(max_length=128, blank=True, null=True)
    state = models.CharField(max_length=128, blank=True, null=True)
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

class MedicalProviderProfile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE)
    company_name = models.CharField(max_length=255)
    provider_type = models.CharField(max_length=128)
    services_offered = ArrayField(models.CharField(max_length=128), blank=True, null=True)
    website_url = models.CharField(max_length=255, blank=True, null=True)
    weekly_hours = models.JSONField(blank=True, null=True)  # Fixed for Django 3.1+
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
    medical_license_number = models.CharField(max_length=128, blank=True, null=True)
    medical_license_doc_path = models.CharField(max_length=255, blank=True, null=True)
    medical_license_doc_virus_scanned = models.BooleanField(default=False)
    storefront_image_path = models.CharField(max_length=255, blank=True, null=True)
    storefront_image_virus_scanned = models.BooleanField(default=False)
    email_otp = models.CharField(max_length=16, blank=True, null=True)
    referral_code = models.CharField(max_length=64, blank=True, null=True)

class ContactPerson(models.Model):
    PROFILE_TYPE_CHOICES = [
        ('advertiser', 'Advertiser'),
        ('client', 'Client'),
        ('ngo', 'NGO'),
        ('provider', 'Medical Provider'),
    ]
    profile_type = models.CharField(max_length=32, choices=PROFILE_TYPE_CHOICES)
    profile_id = models.IntegerField()
    name = models.CharField(max_length=255)
    phone_country_code = models.CharField(max_length=8, blank=True, null=True)
    phone_number = models.CharField(max_length=20, blank=True, null=True)
    role = models.CharField(max_length=128, blank=True, null=True)
    designation = models.CharField(max_length=128, blank=True, null=True)
    otp = models.CharField(max_length=16, blank=True, null=True)
    referral_code = models.CharField(max_length=64, blank=True, null=True)
    email_otp = models.CharField(max_length=16, blank=True, null=True)

class AccountSubscriptionFAQ(models.Model):
    question = models.CharField(max_length=255)
    answer = models.TextField()
    category = models.CharField(max_length=100)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'account_subscription_faq' 

    def __str__(self):
        return self.question