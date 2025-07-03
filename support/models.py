from django.db import models
from registration.models import User
class IssueType(models.Model):
    name = models.CharField(max_length=100, unique=True)

    def __str__(self):
        return self.name

class IssueOption(models.Model):
    issue_type = models.ForeignKey(IssueType, on_delete=models.CASCADE, related_name='options')
    name = models.CharField(max_length=255)

    class Meta:
        unique_together = ('issue_type', 'name')

    def __str__(self):
        return f"{self.issue_type.name} - {self.name}"

class SupportTicket(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='submitted_tickets')
    created_by = models.ForeignKey(User, on_delete=models.CASCADE, null=True, blank=True, related_name='created_tickets')
    issue_option = models.ForeignKey(IssueOption, on_delete=models.SET_NULL, null=True)
    description = models.TextField()
    image = models.ImageField(upload_to='support_issues/', blank=True, null=True)
    
    status = models.CharField(max_length=20, choices=[
        ('Open', 'Open'),
        ('In-progress', 'In-progress'),
        ('Resolved', 'Resolved'),
        ('Closed', 'Closed'),
    ], default='Open')
    
    created_at = models.DateTimeField(auto_now_add=True)

    def ticket_id(self):
        return f"#{10000000 + self.id}"

    def __str__(self):
        creator = self.created_by.username if self.created_by else "Unknown"
        return f"{self.ticket_id()} - {self.issue_option} - by {creator}"

class FAQ(models.Model):
    question = models.TextField()
    answer = models.TextField()
    category = models.CharField(max_length=100)
    profile_type = models.CharField(max_length=100)
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'account_faq'
        verbose_name = 'FAQ'
        verbose_name_plural = 'FAQs'

    def __str__(self):
        return self.question
