from django.db import models
from django.utils import timezone

# Create your models here.
class CartItem(models.Model):
    user = models.ForeignKey(
        "registration.User",
        on_delete=models.CASCADE,
        related_name="cart_items"
    )

    medicine_id = models.CharField(max_length=24)
    medicine_name = models.CharField(max_length=255)
    quantity = models.IntegerField(default=1)

    price = models.DecimalField(max_digits=10, decimal_places=2)
    original_price = models.DecimalField(
        max_digits=10, decimal_places=2, null=True, blank=True
    )

    prescription_status = models.CharField(max_length=20, null=True, blank=True)
    is_generic = models.BooleanField(default=False)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "cart_items"


class ConcernList(models.Model):
    category = models.CharField(max_length=100)

    class Meta:
        db_table = "concern_list"


class TopSellingCategory(models.Model):
    category = models.CharField(max_length=100)

    class Meta:
        db_table = "top_selling_categories"


class CancelReason(models.Model):
    reason = models.CharField(max_length=255)

    class Meta:
        db_table = "cancel_reason"


class BrandList(models.Model):
    name = models.CharField(max_length=100)

    class Meta:
        db_table = "brand_list"

class OrderStatusChoices(models.TextChoices):
    PENDING = "pending", "Pending"
    CONFIRMED = "confirmed", "Confirmed"
    SHIPPED = "shipped", "Shipped"
    DELIVERED = "delivered", "Delivered"
    CANCELLED = "cancelled", "Cancelled"


class DeliveryTypeChoices(models.TextChoices):
    REGULAR = "regular", "Regular"
    QUICK = "quick", "Quick"


class MedicineTypeChoices(models.TextChoices):
    ORDINARY = "ordinary", "Ordinary"
    GENERIC = "generic", "Generic"

class UserPurchase(models.Model):
    user = models.ForeignKey(
        "registration.User",
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name="user_purchases"
    )

    address = models.ForeignKey(
        "registration.UserAddress",
        on_delete=models.SET_NULL,
        null=True,
        blank=True
    )

    total_amount = models.DecimalField(
        max_digits=10, decimal_places=2, null=True, blank=True
    )
    discount = models.DecimalField(
        max_digits=10, decimal_places=2, default=0
    )
    final_amount = models.DecimalField(
        max_digits=10, decimal_places=2, null=True, blank=True
    )

    payment_method = models.CharField(max_length=50, null=True, blank=True)
    payment_status = models.CharField(
        max_length=50, default="pending"
    )

    order_status = models.CharField(
        max_length=20,
        choices=OrderStatusChoices.choices,
        default=OrderStatusChoices.PENDING
    )

    delivery_type = models.CharField(
        max_length=32,
        choices=DeliveryTypeChoices.choices,
        null=True,
        blank=True
    )

    # latitude = models.FloatField(null=True, blank=True)
    # longitude = models.FloatField(null=True, blank=True)
    # address_text = models.TextField(null=True, blank=True)
    # city = models.CharField(max_length=128, null=True, blank=True)
    # pincode = models.CharField(max_length=16, null=True, blank=True)
    # state = models.CharField(max_length=128, null=True, blank=True)

    notes = models.TextField(null=True, blank=True)
    coupon_code = models.CharField(max_length=50, null=True, blank=True)
    coupon_discount = models.DecimalField(
        max_digits=10, decimal_places=2, default=0
    )

    gst_on_medicine = models.DecimalField(
        max_digits=10, decimal_places=2, default=0
    )
    delivery_platform_fee = models.DecimalField(
        max_digits=10, decimal_places=2, default=0
    )
    gst_on_delivery_fee = models.DecimalField(
        max_digits=10, decimal_places=2, default=0
    )

    prescriptions = models.JSONField(null=True, blank=True)
    doctor_name = models.JSONField(null=True, blank=True)
    patient_name = models.JSONField(null=True, blank=True)

    assigned_pharmacy = models.ForeignKey(
        "registration.PharmacyProfile",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="assigned_orders"
    )

    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "user_purchase"

    def __str__(self):
        return f"Order #{self.id}"

class PurchaseMedicine(models.Model):
    purchase = models.ForeignKey(
        UserPurchase,
        on_delete=models.CASCADE,
        related_name="medicines"
    )

    medicine_id = models.CharField(max_length=255)
    product_name = models.CharField(max_length=255, null=True, blank=True)

    quantity = models.IntegerField(default=1)
    price = models.DecimalField(max_digits=10, decimal_places=2)
    mrp = models.DecimalField(max_digits=10, decimal_places=2)
    total_price = models.DecimalField(
        max_digits=10, decimal_places=2, default=0
    )

    type = models.CharField(
        max_length=20,
        choices=MedicineTypeChoices.choices,
        default=MedicineTypeChoices.ORDINARY
    )

    requires_prescription = models.BooleanField(default=False)
    mongo_snapshot = models.JSONField(null=True, blank=True)

    class Meta:
        db_table = "purchase_medicine"

    def __str__(self):
        return self.product_name or self.medicine_id

class MedicineSearchHistory(models.Model):
    user = models.ForeignKey(
        "registration.User",
        on_delete=models.CASCADE,
        related_name="medicine_search_history"
    )

    keyword = models.CharField(max_length=255)
    searched_at = models.DateTimeField(default=timezone.now)

    class Meta:
        db_table = "medicine_search_history"

    def __str__(self):
        return self.keyword

