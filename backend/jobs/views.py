from rest_framework import generics, permissions

from .models import Job
from .permissions import IsJobOwner, IsRecruiter
from .serializers import JobSerializer


class JobListCreateView(generics.ListCreateAPIView):
    serializer_class = JobSerializer
    permission_classes = [permissions.AllowAny]

    def get_queryset(self):
        my_jobs = self.request.query_params.get('my_jobs')
        if my_jobs:
            if self.request.user.is_authenticated:
                user = self.request.user
                company_name = getattr(getattr(user, 'profile', None), 'company_name', None)
                if user.role in ('hiring_manager', 'company_admin') and company_name:
                    from django.db.models import Q
                    return Job.objects.filter(
                        Q(recruiter=user) |
                        Q(company__name__iexact=company_name) |
                        Q(recruiter__profile__company_name__iexact=company_name)
                    ).distinct().order_by('-created_at')
                return Job.objects.filter(recruiter=self.request.user).order_by('-created_at')
            return Job.objects.filter(is_active=True).order_by('-created_at')

        queryset = Job.objects.filter(is_active=True).order_by('-created_at')
        search_query = self.request.query_params.get('search')
        if search_query:
            queryset = queryset.filter(title__icontains=search_query) | queryset.filter(
                requirements__icontains=search_query
            )

        location = self.request.query_params.get('location')
        job_type = self.request.query_params.get('job_type')
        if location:
            queryset = queryset.filter(location__icontains=location)
        if job_type:
            queryset = queryset.filter(job_type=job_type)
        return queryset

    def perform_create(self, serializer):
        from rest_framework.exceptions import PermissionDenied
        recruiter = self.request.user if self.request.user.is_authenticated else None
        if not recruiter or getattr(recruiter, 'role', '') not in ('recruiter', 'company_admin', 'hiring_manager'):
            raise PermissionDenied('Only recruiters, hiring managers, and company admins can post jobs.')

        company_name = self.request.data.get('company_name')
        company = getattr(recruiter, 'managed_company', None) if recruiter else None
        if not company and company_name:
            from companies.models import Company
            company = Company.objects.filter(name=company_name).first()
            if not company:
                company = Company.objects.create(
                    user=recruiter,
                    name=company_name,
                    location=serializer.validated_data.get('location', '')
                )
        serializer.save(recruiter=recruiter, company=company)


class JobDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Job.objects.all()
    serializer_class = JobSerializer
    permission_classes = [permissions.AllowAny]

    def perform_destroy(self, instance):
        from rest_framework.exceptions import PermissionDenied
        user = self.request.user
        if not user.is_authenticated:
            raise PermissionDenied('You must be signed in to remove a job posting.')

        is_employer = getattr(user, 'role', '') in ('recruiter', 'company_admin', 'hiring_manager')
        if not (user.is_superuser or user.is_staff or is_employer):
            raise PermissionDenied('Only recruiters, hiring managers, and company admins can remove job postings.')

        instance.delete()
