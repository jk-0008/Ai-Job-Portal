# companies/views.py
from rest_framework import generics, permissions
from .models import Company
from .serializers import CompanySerializer
from jobs.permissions import IsRecruiter

class CompanyListCreateView(generics.ListCreateAPIView):
    queryset = Company.objects.all()
    serializer_class = CompanySerializer
    permission_classes = [permissions.IsAuthenticated, IsRecruiter]

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)
