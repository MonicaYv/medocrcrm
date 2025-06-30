import os
import sys
import django

# 🚨 Add the *parent directory* of the project (the folder that contains manage.py)
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.append(BASE_DIR)

# ✅ Tell Django to use the correct settings module
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "core.settings")
django.setup()

from registration.models import AccountSubscriptionFAQ


faq_data=[
    {
        "question":"TEST?",
        "answer":"TEST.",
        "category":"Subscription"
    }
]

for item in faq_data:
    obj, created = AccountSubscriptionFAQ.objects.get_or_create(**item)
    print(f"{'Created' if created else 'Exists'}: {obj.question}")

print("✅ FAQs loaded successfully.")
