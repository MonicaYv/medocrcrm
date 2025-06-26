from django.db import models
from django.contrib.postgres.fields import ArrayField

USER_TYPE_CHOICES = [
    ('advertiser', 'Advertiser'),
    ('client', 'Client'),
    ('ngo', 'NGO'),
    ('provider', 'Medical Provider'),
    ('user', 'User'),
]

class SettingMenu(models.Model):
    name = models.CharField(max_length=64)
    url = models.CharField(max_length=255)
    icon = models.CharField(max_length=64)
    order = models.PositiveIntegerField(default=0)
    user_types = ArrayField(
        models.CharField(max_length=32, choices=USER_TYPE_CHOICES),
        help_text="Show this menu to these user types",
    )
    is_active = models.BooleanField(default=True)
