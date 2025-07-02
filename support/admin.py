from django.contrib import admin
from .models import IssueType, IssueOption, SupportTicket, FAQ  # Add FAQ if used

@admin.register(IssueType)
class IssueTypeAdmin(admin.ModelAdmin):
    list_display = ('name',)
    search_fields = ('name',)

@admin.register(IssueOption)
class IssueOptionAdmin(admin.ModelAdmin):
    list_display = ('name', 'issue_type')
    list_filter = ('issue_type',)
    search_fields = ('name',)

@admin.register(SupportTicket)
class SupportTicketAdmin(admin.ModelAdmin):
    list_display = ('ticket_id', 'user', 'issue_option', 'status', 'created_at')
    list_filter = ('status', 'issue_option')
    search_fields = ('description',)
    readonly_fields = ('created_at', 'ticket_id')

@admin.register(FAQ)
class FAQAdmin(admin.ModelAdmin):
    list_display = ('question', 'category', 'profile_type', 'user', 'created_at')
    search_fields = ('question', 'answer')
    list_filter = ('category', 'profile_type')