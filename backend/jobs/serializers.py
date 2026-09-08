# jobs/serializers.py
from rest_framework import serializers
from .models import Job
from companies.serializers import CompanySerializer

class JobSerializer(serializers.ModelSerializer):
    company_details = CompanySerializer(source='company', read_only=True)
    applications_count = serializers.SerializerMethodField()

    class Meta:
        model = Job
        fields = '__all__'
        read_only_fields = ('recruiter',)

    def get_applications_count(self, obj):
        return obj.applications.count()