# applications/serializers.py
from rest_framework import serializers
from .models import Application

class ApplicationSerializer(serializers.ModelSerializer):
    job_title = serializers.ReadOnlyField(source='job.title')
    company_name = serializers.SerializerMethodField()
    job_location = serializers.ReadOnlyField(source='job.location')
    job_type = serializers.ReadOnlyField(source='job.job_type')
    applicant_name = serializers.ReadOnlyField(source='applicant.username')

    class Meta:
        model = Application
        fields = (
            'id', 'job', 'job_title', 'company_name', 'job_location', 'job_type',
            'applicant', 'applicant_name', 'resume', 'cover_letter', 'status', 'applied_at'
        )
        read_only_fields = ('applicant', 'status', 'applied_at')

    def get_company_name(self, obj):
        return obj.job.company.name if (obj.job and obj.job.company) else 'Jobi Partner'

    def validate_resume(self, value):
        # Validate that the uploaded file is a PDF
        if not value.name.endswith('.pdf'):
            raise serializers.ValidationError("Only PDF resumes are supported.")
        return value


class ApplicationStatusSerializer(serializers.ModelSerializer):
    class Meta:
        model = Application
        fields = ('status',)
