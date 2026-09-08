# companies/views.py
from rest_framework import generics, permissions, status
from rest_framework.response import Response
from .models import Company
from .serializers import CompanySerializer
from jobs.permissions import IsRecruiter
from users.models import Profile

class CompanyListCreateView(generics.ListCreateAPIView):
    queryset = Company.objects.all().select_related('user', 'user__profile')
    serializer_class = CompanySerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

class MyCompanyView(generics.RetrieveUpdateAPIView):
    serializer_class = CompanySerializer
    permission_classes = [permissions.IsAuthenticated, IsRecruiter]

    def get_object(self):
        profile = getattr(self.request.user, 'profile', None)
        company_name = (profile.company_name if profile else '') or f"{self.request.user.username}'s Company"
        location = (profile.location if profile else '') or 'Remote'
        website = (profile.company_website if profile else '') or None

        company, _ = Company.objects.get_or_create(
            user=self.request.user,
            defaults={
                'name': company_name,
                'location': location,
                'website': website,
                'description': f"{company_name} managed by {self.request.user.username}."
            }
        )
        return company

    def update(self, request, *args, **kwargs):
        company = self.get_object()
        serializer = self.get_serializer(company, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()

        # Synchronize linked profile details if provided
        profile, _ = Profile.objects.get_or_create(user=request.user)
        dirty = False
        for field in ['phone', 'designation', 'department', 'company_size']:
            if field in request.data:
                setattr(profile, field, request.data[field])
                dirty = True

        if 'name' in request.data:
            profile.company_name = request.data['name']
            dirty = True
        if 'website' in request.data:
            profile.company_website = request.data['website']
            dirty = True
        if 'location' in request.data:
            profile.location = request.data['location']
            dirty = True

        if dirty:
            profile.save()

        return Response(self.get_serializer(company).data)
