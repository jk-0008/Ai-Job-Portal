# users/models.py
from django.contrib.auth.models import AbstractUser
from django.db import models

class User(AbstractUser):
    ROLE_CHOICES = (
        ('seeker', 'Job Seeker'),
        ('recruiter', 'Recruiter'),
        ('admin', 'Admin'),
    )
    role = models.CharField(max_length=10, choices=ROLE_CHOICES, default='seeker')
    phone = models.CharField(max_length=15, blank=True, null=True)

class Profile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')
    bio = models.TextField(blank=True, null=True)
    skills = models.TextField(blank=True, null=True)  # Comma-separated skills
    resume = models.FileField(upload_to='resumes/', blank=True, null=True)
    company_name = models.CharField(max_length=100, blank=True, null=True) # For recruiters

    def __str__(self):
        return f"{self.user.username}'s Profile"