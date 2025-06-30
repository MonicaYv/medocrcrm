from django.db import models

# Create your models here.

class AccountSubscriptionFAQ(models.Model):
    PROFILE_TYPE_CHOICES = [
        ('advertiser', 'Advertiser'),
        ('client', 'Client'),
        ('ngo', 'NGO'),
        ('provider', 'Medical Provider'),
    ]
    profile_type = models.CharField(max_length=32, choices=PROFILE_TYPE_CHOICES)
    question = models.CharField(max_length=255)
    answer = models.TextField()
    category = models.CharField(max_length=100)
    profile_type = models.CharField(max_length=32, choices=PROFILE_TYPE_CHOICES)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'account_subscription_faq' 

    def __str__(self):
        return self.question