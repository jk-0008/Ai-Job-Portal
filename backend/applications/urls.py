from django.urls import path

from .views import (
    AIChatbotView,
    AnalyzeResumeView,
    ApplicationCreateView,
    ApplicationStatusUpdateView,
    GenerateInterviewQuestionsView,
    RecruiterApplicationsListView,
    SeedDemoApplicantView,
    UserApplicationsListView,
)

urlpatterns = [
    path('apply/', ApplicationCreateView.as_view(), name='apply_job'),
    path('my-applications/', UserApplicationsListView.as_view(), name='user_applications'),
    path('recruiter-applications/', RecruiterApplicationsListView.as_view(), name='recruiter_applications'),
    path('seed-demo/', SeedDemoApplicantView.as_view(), name='seed_demo_application'),
    path('<int:pk>/status/', ApplicationStatusUpdateView.as_view(), name='application_status_update'),
    path('analyze/<int:application_id>/', AnalyzeResumeView.as_view(), name='analyze_resume'),
    path('<int:application_id>/interview-questions/', GenerateInterviewQuestionsView.as_view(), name='generate_interview_questions'),
    path('chatbot/', AIChatbotView.as_view(), name='ai_chatbot'),
]
