from django.contrib import admin
from .models import NGOPost

@admin.register(NGOPost)
class NGOPostAdmin(admin.ModelAdmin):
    list_display = ('header', 'user', 'post_type', 'status', 'target_donation', 'donation_received', 'start_date', 'end_date')
    list_filter = ('status', 'post_type', 'country', 'state')
    search_fields = ('header', 'description', 'tags', 'user__username')
    readonly_fields = ('created_at', 'updated_at', 'views', 'donation_received')
    
    fieldsets = (
        ('Post Information', {
            'fields': ('header', 'description', 'tags', 'post_type', 'status')
        }),
        ('Creator', {
            'fields': ('user',)
        }),
        ('Donation Details', {
            'fields': ('donation_frequency', 'target_donation', 'donation_received')
        }),
        ('Target Audience', {
            'fields': ('country', 'state', 'city', 'pincode', 'age_group', 'gender', 'spending_power')
        }),
        ('Timeline and Creatives', {
            'fields': ('start_date', 'end_date', 'creative1', 'creative2')
        }),
        ('Metrics and Timestamps', {
            'fields': ('views', 'created_at', 'updated_at')
        }),
    )

    def get_queryset(self, request):
        queryset = super().get_queryset(request)
        for post in queryset:
            post.update_status_if_needed()
        return queryset
