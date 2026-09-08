from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from .models import User, Profile

class ProfileInline(admin.StackedInline):
    model = Profile
    can_delete = False
    verbose_name_plural = 'Profile & Company Details'

@admin.register(User)
class UserAdmin(BaseUserAdmin):
    inlines = (ProfileInline,)
    list_display = ('username', 'email', 'role', 'get_company_name', 'is_staff', 'is_active', 'date_joined')
    list_filter = ('role', 'is_staff', 'is_superuser', 'is_active')
    search_fields = ('username', 'email', 'profile__company_name')

    @admin.display(description='Company')
    def get_company_name(self, obj):
        profile = getattr(obj, 'profile', None)
        return profile.company_name if (profile and profile.company_name) else '-'

@admin.register(Profile)
class ProfileAdmin(admin.ModelAdmin):
    list_display = ('user', 'get_user_role', 'company_name', 'designation', 'department', 'phone', 'location', 'company_size')
    search_fields = ('user__username', 'user__email', 'company_name', 'designation', 'phone')
    list_filter = ('user__role', 'company_size')

    @admin.display(description='Role')
    def get_user_role(self, obj):
        return obj.user.role if obj.user else '-'

