from django.contrib import admin
from .models import Job

@admin.register(Job)
class JobAdmin(admin.ModelAdmin):
    list_display = ('title', 'get_company_name', 'get_recruiter', 'location', 'job_type', 'is_active', 'created_at')
    list_filter = ('is_active', 'job_type', 'location', 'created_at')
    search_fields = ('title', 'description', 'company__name', 'recruiter__username')

    @admin.display(description='Company')
    def get_company_name(self, obj):
        return obj.company.name if obj.company else '-'

    @admin.display(description='Recruiter / Admin')
    def get_recruiter(self, obj):
        return obj.recruiter.username if obj.recruiter else '-'

