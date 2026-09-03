# jobs/views.py
from rest_framework import generics, permissions
from .models import Job
from .serializers import JobSerializer

class JobListCreateView(generics.ListCreateAPIView):
    serializer_class = JobSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]

    def get_queryset(self):
        queryset = Job.objects.filter(is_active=True).order_by('-created_at')
        
        # Search functionality
        search_query = self.request.query_params.get('search', None)
        if search_query:
            queryset = queryset.filter(title__icontains=search_query) | queryset.filter(requirements__icontains=search_query)

        # Filtering
        location = self.request.query_params.get('location', None)
        job_type = self.request.query_params.get('job_type', None)

        if location:
            queryset = queryset.filter(location__icontains=location)
        if job_type:
            queryset = queryset.filter(job_type=job_type)

        return queryset

    def perform_create(self, serializer):
        serializer.save(recruiter=self.request.user)

class JobDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Job.objects.all()
    serializer_class = JobSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]