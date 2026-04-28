from django.db import models


class LabSpecialization(models.Model):
    name = models.CharField(max_length=100, unique=True)
    is_active = models.BooleanField(default=True)

    class Meta:
        db_table = "lab_specialization"

    def __str__(self):
        return self.name


class LabTechnician(models.Model):
    lab = models.ForeignKey(
        "registration.LabProfile",  # update app name if needed
        on_delete=models.CASCADE,
        related_name="technicians",
        db_index=True,
    )

    full_name = models.CharField(max_length=255)
    phone_number = models.CharField(max_length=20, null=True, blank=True)
    email = models.EmailField(max_length=255, null=True, blank=True)
    education = models.CharField(max_length=100, null=True, blank=True)
    experience_years = models.IntegerField(null=True, blank=True)

    status = models.CharField(max_length=20, default="active")

    specialization = models.ForeignKey(
        LabSpecialization,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
    )

    profile_photo_path = models.CharField(max_length=255, null=True, blank=True)

    age = models.IntegerField(null=True, blank=True)
    gender = models.CharField(max_length=20, null=True, blank=True)

    availability = models.JSONField(null=True, blank=True)

    average_rating = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        default=0,
        null=True,
        blank=True,
    )

    ratings_count = models.IntegerField(default=0, null=True, blank=True)
    patients_number = models.IntegerField(default=0, null=True, blank=True)
    reviews_number = models.IntegerField(default=0, null=True, blank=True)

    attendance_details = models.JSONField(null=True, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "lab_technicians"

    def __str__(self):
        return self.full_name


class DoctorsProfile(models.Model):
    user = models.ForeignKey(
        "registration.User", 
        on_delete=models.CASCADE,
    )

    first_name = models.CharField(max_length=255)
    last_name = models.CharField(max_length=255)

    gender = models.CharField(max_length=50, null=True, blank=True)
    age = models.IntegerField(null=True, blank=True)

    specialties = models.CharField(max_length=255)

    attendance_details = models.JSONField(null=True, blank=True)

    phone_number = models.CharField(max_length=20, null=True, blank=True)
    phone_country_code = models.CharField(max_length=8, null=True, blank=True)

    email = models.EmailField(max_length=255, null=True, blank=True)

    education = models.ForeignKey(
        "registration.DoctorEducation",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
    )

    experience = models.ForeignKey(
        "registration.DoctorExperience",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
    )

    specialization = models.ForeignKey(
        "registration.DoctorSpeciality",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
    )

    profile_pic_path = models.CharField(max_length=255, null=True, blank=True)

    is_active = models.BooleanField(default=True)
    created_by_hospital = models.BooleanField(default=False)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "doctor_profile"

    def __str__(self):
        return f"{self.first_name} {self.last_name}"


class DoctorAvailability(models.Model):
    doctor = models.ForeignKey(
        DoctorsProfile,
        on_delete=models.CASCADE,
        related_name="availability",
    )

    day_of_week = models.CharField(max_length=20)

    is_available = models.BooleanField(default=True)

    start_time = models.CharField(max_length=20, null=True, blank=True)
    end_time = models.CharField(max_length=20, null=True, blank=True)

    class Meta:
        db_table = "doctor_availability"

    def __str__(self):
        return f"{self.doctor} - {self.day_of_week}"


class PatientProfile(models.Model):
    user = models.ForeignKey(
        "registration.User",  # update app name if needed
        on_delete=models.CASCADE,
    )

    first_name = models.CharField(max_length=255)
    last_name = models.CharField(max_length=255)

    gender = models.CharField(max_length=50)

    age = models.IntegerField()

    relation = models.CharField(max_length=255, null=True, blank=True)

    class Meta:
        db_table = "patient_profile"

    def __str__(self):
        return f"{self.first_name} {self.last_name}"