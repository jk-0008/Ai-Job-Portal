# companies/serializers.py
from rest_framework import serializers
from .models import Company

class CompanySerializer(serializers.ModelSerializer):
    admin_username = serializers.CharField(source='user.username', read_only=True)
    admin_email = serializers.CharField(source='user.email', read_only=True)
    admin_role = serializers.CharField(source='user.role', read_only=True)
    admin_designation = serializers.SerializerMethodField()
    admin_department = serializers.SerializerMethodField()
    admin_phone = serializers.SerializerMethodField()
    company_size = serializers.SerializerMethodField()

    class Meta:
        model = Company
        fields = (
            'id', 'name', 'description', 'website', 'location', 'created_at',
            'admin_username', 'admin_email', 'admin_role',
            'admin_designation', 'admin_department', 'admin_phone', 'company_size'
        )
        read_only_fields = ('user', 'created_at')

    def get_admin_designation(self, obj):
        profile = getattr(obj.user, 'profile', None)
        return profile.designation if (profile and profile.designation) else ''

    def get_admin_department(self, obj):
        profile = getattr(obj.user, 'profile', None)
        return profile.department if (profile and profile.department) else ''

    def get_admin_phone(self, obj):
        profile = getattr(obj.user, 'profile', None)
        return profile.phone if (profile and profile.phone) else ''

    def get_company_size(self, obj):
        profile = getattr(obj.user, 'profile', None)
        return profile.company_size if (profile and profile.company_size) else ''