from django.urls import path
from .views import JobDetailView, JobListCreateView

urlpatterns = [
    path('', JobListCreateView.as_view(), name='job_list_create'),
    path('<int:pk>/', JobDetailView.as_view(), name='job_detail'),
]
