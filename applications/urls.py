# applications/urls.py
from django.urls import path
from .views import (
    ApplicationCreateView, 
    UserApplicationsListView, 
    AnalyzeResumeView, 
    AIChatbotView
)

urlpatterns = [
    path('apply/', ApplicationCreateView.as_view(), name='apply_job'),
    path('my-applications/', UserApplicationsListView.as_view(), name='user_applications'),
    path('analyze/<int:application_id>/', AnalyzeResumeView.as_view(), name='analyze_resume'),
    path('chatbot/', AIChatbotView.as_view(), name='ai_chatbot'),
]