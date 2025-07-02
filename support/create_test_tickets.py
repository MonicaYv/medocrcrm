import os
import django
import sys

# Setup Django environment
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')  # Change if your settings file is different
django.setup()

from django.contrib.auth.models import User
from support.models import IssueType, IssueOption, SupportTicket

# Create or get user
user, _ = User.objects.get_or_create(email='ngo@test.com',)

# Create or get issue type and option
issue_type, _ = IssueType.objects.get_or_create(name='Registration')
issue_option, _ = IssueOption.objects.get_or_create(issue_type=issue_type, name='OTP not working')

# Create the ticket
ticket = SupportTicket.objects.create(
    user=user,
    created_by=user,
    issue_option=issue_option,
    description='Otp is taking very long',
    status='Open'
)

print(f"✅ Ticket created: {ticket.ticket_id()} - {ticket.issue_option}")
