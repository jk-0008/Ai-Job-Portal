# applications/serializers.py
from rest_framework import serializers
from .models import Application

class ApplicationSerializer(serializers.ModelSerializer):
    job_title = serializers.ReadOnlyField(source='job.title')
    applicant_name = serializers.ReadOnlyField(source='applicant.username')

    class Meta:
        model = Application
        fields = ('id', 'job', 'job_title', 'applicant', 'applicant_name', 'resume', 'cover_letter', 'status', 'applied_at')
        read_only_fields = ('applicant', 'status', 'applied_at')

    def validate_resume(self, value):
        # Validate that the uploaded file is a PDF
        if not value.name.endswith('.pdf'):
            raise serializers.ValidationError("Only PDF resumes are supported.")
        return value


class ApplicationStatusSerializer(serializers.ModelSerializer):
    class Meta:
        model = Application
        fields = ('status',)
