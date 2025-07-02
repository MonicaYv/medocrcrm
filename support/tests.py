from support.models import IssueType, IssueOption

# Add the IssueType
registration_type = IssueType.objects.create(name="Registration")

# Add IssueOptions under that type
IssueOption.objects.create(issue_type=registration_type, name="Email not received")
IssueOption.objects.create(issue_type=registration_type, name="OTP not working")
IssueOption.objects.create(issue_type=registration_type, name="Already registered error")
IssueOption.objects.create(issue_type=registration_type, name="Password reset failed")
