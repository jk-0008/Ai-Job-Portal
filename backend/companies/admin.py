from django.contrib import admin
from .models import Company

@admin.register(Company)
class CompanyAdmin(admin.ModelAdmin):
    list_display = ('name', 'admin_username', 'admin_email', 'admin_phone', 'location', 'website', 'created_at')
    search_fields = ('name', 'user__username', 'user__email', 'location')
    list_filter = ('created_at', 'location')
    readonly_fields = ('created_at',)

    @admin.display(description='Company Admin')
    def admin_username(self, obj):
        return obj.user.username if obj.user else 'No Admin'

    @admin.display(description='Admin Email')
    def admin_email(self, obj):
        return obj.user.email if obj.user else '-'

    @admin.display(description='Admin Phone')
    def admin_phone(self, obj):
        profile = getattr(obj.user, 'profile', None)
        return profile.phone if (profile and profile.phone) else '-'

