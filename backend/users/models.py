# users/models.py
from django.contrib.auth.models import AbstractUser
from django.db import models

# backend/users/models.py
class User(AbstractUser):
    ROLE_CHOICES = (
        ('job_seeker', 'Job Seeker'),
        ('recruiter', 'Recruiter'),
        ('hiring_manager', 'Hiring Manager'),
        ('company_admin', 'Company Admin'),
    )
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='job_seeker')

class Profile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')
    bio = models.TextField(blank=True, null=True)
    skills = models.TextField(blank=True, null=True)  # Comma-separated skills / domain
    resume = models.FileField(upload_to='resumes/', blank=True, null=True)
    company_name = models.CharField(max_length=150, blank=True, null=True)
    department = models.CharField(max_length=100, blank=True, null=True)
    designation = models.CharField(max_length=100, blank=True, null=True)
    company_website = models.URLField(blank=True, null=True)
    location = models.CharField(max_length=150, blank=True, null=True)
    company_size = models.CharField(max_length=50, blank=True, null=True)
    experience_level = models.CharField(max_length=50, blank=True, null=True)
    phone = models.CharField(max_length=30, blank=True, null=True)

    def __str__(self):
        return f"{self.user.username}'s Profile ({self.user.role})"