# jobs/models.py
from django.db import models
from django.conf import settings
from companies.models import Company

class Job(models.Model):
    JOB_TYPE_CHOICES = (
        ('full_time', 'Full Time'),
        ('part_time', 'Part Time'),
        ('contract', 'Contract'),
        ('internship', 'Internship'),
    )

    recruiter = models.ForeignKey(
        settings.AUTH_USER_MODEL, 
        on_delete=models.CASCADE, 
        related_name='posted_jobs'
    )
    company = models.ForeignKey(
        Company, 
        on_delete=models.CASCADE, 
        related_name='jobs', 
        null=True, 
        blank=True
    )
    title = models.CharField(max_length=255)
    description = models.TextField()
    requirements = models.TextField(help_text="Enter skills separated by commas")
    location = models.CharField(max_length=255)
    job_type = models.CharField(max_length=20, choices=JOB_TYPE_CHOICES, default='full_time')
    salary_range = models.CharField(max_length=100, blank=True, null=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.title} - {self.company.name if self.company else 'Independent'}"