# users/serializers.py
from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from django.contrib.auth import get_user_model

User = get_user_model()

class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        token['role'] = user.role
        token['username'] = user.username
        return token

    def validate(self, attrs):
        data = super().validate(attrs)
        data['role'] = self.user.role
        data['username'] = self.user.username
        data['email'] = self.user.email
        profile = getattr(self.user, 'profile', None)
        if profile:
            data['company_name'] = profile.company_name or ''
            data['designation'] = profile.designation or ''
            data['department'] = profile.department or ''
            data['phone'] = profile.phone or ''
            data['company_website'] = profile.company_website or ''
            data['company_size'] = profile.company_size or ''
            data['location'] = profile.location or ''
        return data


class UserRegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)
    resume = serializers.FileField(write_only=True, required=False)
    company_name = serializers.CharField(write_only=True, required=False, allow_blank=True)
    department = serializers.CharField(write_only=True, required=False, allow_blank=True)
    designation = serializers.CharField(write_only=True, required=False, allow_blank=True)
    company_website = serializers.CharField(write_only=True, required=False, allow_blank=True)
    location = serializers.CharField(write_only=True, required=False, allow_blank=True)
    company_size = serializers.CharField(write_only=True, required=False, allow_blank=True)
    experience_level = serializers.CharField(write_only=True, required=False, allow_blank=True)
    skills = serializers.CharField(write_only=True, required=False, allow_blank=True)
    bio = serializers.CharField(write_only=True, required=False, allow_blank=True)
    phone = serializers.CharField(write_only=True, required=False, allow_blank=True)

    class Meta:
        model = User
        fields = (
            'id', 'username', 'email', 'password', 'role',
            'resume', 'company_name', 'department', 'designation',
            'company_website', 'location', 'company_size', 'experience_level',
            'skills', 'bio', 'phone'
        )

    def create(self, validated_data):
        from .models import Profile
        resume = validated_data.pop('resume', None)
        company_name = validated_data.pop('company_name', '').strip()
        department = validated_data.pop('department', '').strip()
        designation = validated_data.pop('designation', '').strip()
        company_website = validated_data.pop('company_website', '').strip()
        location = validated_data.pop('location', '').strip()
        company_size = validated_data.pop('company_size', '').strip()
        experience_level = validated_data.pop('experience_level', '').strip()
        skills = validated_data.pop('skills', '').strip()
        bio = validated_data.pop('bio', '').strip()
        phone = validated_data.pop('phone', '').strip()

        user = User.objects.create_user(
            username=validated_data['username'],
            email=validated_data.get('email', ''),
            password=validated_data['password'],
            role=validated_data.get('role', 'job_seeker'),
        )

        profile_defaults = {
            'company_name': company_name,
            'department': department,
            'designation': designation,
            'company_website': company_website,
            'location': location,
            'company_size': company_size,
            'experience_level': experience_level,
            'skills': skills,
            'bio': bio,
            'phone': phone,
        }
        if resume:
            profile_defaults['resume'] = resume

        Profile.objects.update_or_create(user=user, defaults=profile_defaults)

        # Auto-create managed company record for employer roles if company_name provided
        if company_name and user.role in ('recruiter', 'hiring_manager', 'company_admin'):
            from companies.models import Company
            Company.objects.get_or_create(
                user=user,
                defaults={
                    'name': company_name,
                    'website': company_website or None,
                    'location': location or 'Remote',
                    'description': f"{company_name} managed by {user.username}."
                }
            )

        return user