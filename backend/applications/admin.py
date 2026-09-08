from django.contrib import admin
from .models import Application

@admin.register(Application)
class ApplicationAdmin(admin.ModelAdmin):
    list_display = ('id', 'get_applicant', 'get_job_title', 'get_company', 'status', 'applied_at')
    list_filter = ('status', 'applied_at')
    search_fields = ('applicant__username', 'applicant__email', 'job__title', 'job__company__name')

    @admin.display(description='Applicant')
    def get_applicant(self, obj):
        return obj.applicant.username if obj.applicant else '-'

    @admin.display(description='Job Title')
    def get_job_title(self, obj):
        return obj.job.title if obj.job else '-'

    @admin.display(description='Company')
    def get_company(self, obj):
        return obj.job.company.name if (obj.job and obj.job.company) else '-'

