from django.urls import path

from .views import (
    AIChatbotView,
    AnalyzeResumeView,
    ApplicationCreateView,
    ApplicationStatusUpdateView,
    RecruiterApplicationsListView,
    UserApplicationsListView,
)

urlpatterns = [
    path('apply/', ApplicationCreateView.as_view(), name='apply_job'),
    path('my-applications/', UserApplicationsListView.as_view(), name='user_applications'),
    path('recruiter-applications/', RecruiterApplicationsListView.as_view(), name='recruiter_applications'),
    path('<int:pk>/status/', ApplicationStatusUpdateView.as_view(), name='application_status_update'),
    path('analyze/<int:application_id>/', AnalyzeResumeView.as_view(), name='analyze_resume'),
    path('chatbot/', AIChatbotView.as_view(), name='ai_chatbot'),
]
