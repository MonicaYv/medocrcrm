from django.db import models
from registration.models import User
from django.utils import timezone
from django.utils.translation import gettext_lazy as _

USER_TYPE = [
    ('advertiser', 'Advertiser'),
    ('client', 'Client'),
    ('ngo', 'NGO'),
    ('pharmacy', 'Pharmacy'),
    ('user', 'User'),
    ('doctor', 'Doctor'),
    ('lab', 'Lab'),
    ('hospital', 'Hospital'),
]

class UserColorScheme(models.Model):
    user_type = models.CharField(max_length=32, choices=USER_TYPE, unique=True, verbose_name=_("User Type"))
    color_data = models.JSONField(default=dict, help_text=_("JSON object defining the color variables for this theme "))
    is_active = models.BooleanField(default=True, help_text=_("Is the color scheme active for the user type"))

    class Meta:
            verbose_name = _("User Color Scheme")
            verbose_name_plural = _("User Color Schemes")
            ordering = ['user_type']

    def __str__(self):
        return f"Color Scheme for {self.get_user_type_display()}"
    
class SellerType(models.TextChoices):
    PHARMACY = "pharmacy", "Pharmacy"
    LAB = "lab", "Lab"
    HOSPITAL = "hospital", "Hospital"
    DOCTOR = "doctor", "Doctor"



from django.db import models
from django.utils import timezone


class SellerSubscription(models.Model):
    seller_type = models.CharField(
        max_length=20,
        choices=SellerType.choices,
        db_index=True,
    )

    seller_profile_id = models.PositiveIntegerField(
        db_index=True,
    )

    plan_name = models.CharField(
        max_length=100,
        default="Free",
    )

    price = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        default=0.00,
    )

    expiry_date = models.DateTimeField(
        null=True,
        blank=True,
    )

    # Matches the FastAPI SQLAlchemy model
    autobid_enabled = models.BooleanField(
        default=False,
    )

    is_active = models.BooleanField(
        default=False,
    )

    is_enabled = models.BooleanField(
        default=True,
    )

    created_at = models.DateTimeField(
        auto_now_add=True,
    )

    updated_at = models.DateTimeField(
        auto_now=True,
    )

    class Meta:
        db_table = "seller_subscription"

        indexes = [
            models.Index(
                fields=[
                    "seller_type",
                    "seller_profile_id",
                    "is_active",
                ],
                name="idx_seller_sub_active",
            ),
        ]

        constraints = [
            models.UniqueConstraint(
                fields=[
                    "seller_type",
                    "seller_profile_id",
                ],
                condition=models.Q(is_active=True),
                name="uq_active_subscription_per_seller",
            ),
        ]

    @property
    def is_expired(self):
        if not self.expiry_date:
            return False

        expiry = self.expiry_date

        if timezone.is_naive(expiry):
            expiry = timezone.make_aware(
                expiry,
                timezone.get_current_timezone(),
            )

        return expiry < timezone.now()

    def __str__(self):
        return (
            f"{self.seller_type} | "
            f"Profile {self.seller_profile_id} | "
            f"{self.plan_name} | "
            f"{'Active' if self.is_active else 'Inactive'}"
        )
