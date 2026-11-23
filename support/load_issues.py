# support/load_issues.py

import django
import os
import sys
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')  # Adjust project name
django.setup()

from support.models import IssueType, IssueOption

data = {
    "Account & Access": [
        "Unable to log in or reset password",
        "Profile update not saving",
        "Mobile number or email verification failed",
        "App crashing or freezing on startup",
    ],
    "Order & Bidding": [
        "Bid request not showing in history",
        "No response from pharmacies on my bid",
        "My accepted bid disappeared",
        "Can't upload or attach prescription",
    ],
    "Notifications & Comms": [
        "Not receiving order or bid notifications",
        "Chat with pharmacy not working",
        "In-app notifications are delayed",
    ],
    "Technical Issues": [
        "App interface glitches (e.g., buttons not working)",
        "Location detection issue",
        "Images or attachments not uploading",
        "Reporting fake or spam pharmacy listing",
    ]
}

for issue_type_name, issues in data.items():
    issue_type, _ = IssueType.objects.get_or_create(
        name=issue_type_name,
        defaults={"user_types": ["pharmacy"]},
    )
    issue_type_user_types = list(issue_type.user_types or [])
    if "pharmacy" not in issue_type_user_types:
        issue_type.user_types = [*issue_type_user_types, "pharmacy"]
        issue_type.save(update_fields=["user_types"])

    for issue_name in issues:
        issue_option, _ = IssueOption.objects.get_or_create(
            issue_type=issue_type,
            name=issue_name,
            defaults={"user_types": ["pharmacy"]},
        )
        option_user_types = list(issue_option.user_types or [])
        if "pharmacy" not in option_user_types:
            issue_option.user_types = [*option_user_types, "pharmacy"]
            issue_option.save(update_fields=["user_types"])

print("✅ IssueTypes and IssueOptions loaded successfully.")
