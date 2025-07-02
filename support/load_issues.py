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
    issue_type, created = IssueType.objects.get_or_create(name=issue_type_name)
    for issue_name in issues:
        IssueOption.objects.get_or_create(issue_type=issue_type, name=issue_name)

print("✅ IssueTypes and IssueOptions loaded successfully.")
