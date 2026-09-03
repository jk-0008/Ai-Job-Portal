from rest_framework import generics, permissions, status
from rest_framework.exceptions import PermissionDenied, ValidationError
from rest_framework.parsers import FormParser, MultiPartParser
from rest_framework.response import Response
from rest_framework.views import APIView

from jobs.permissions import IsRecruiter

from .ai_services import analyze_resume_fit, extract_text_from_pdf, get_chatbot_response
from .models import Application
from .serializers import ApplicationSerializer, ApplicationStatusSerializer


class ApplicationCreateView(generics.CreateAPIView):
    serializer_class = ApplicationSerializer
    permission_classes = [permissions.IsAuthenticated]
    parser_classes = (MultiPartParser, FormParser)

    def perform_create(self, serializer):
        if self.request.user.role != 'seeker':
            raise PermissionDenied('Only job seekers can submit applications.')
        if not serializer.validated_data['job'].is_active:
            raise ValidationError({'job': 'This job is no longer accepting applications.'})
        serializer.save(applicant=self.request.user)


class UserApplicationsListView(generics.ListAPIView):
    serializer_class = ApplicationSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Application.objects.filter(applicant=self.request.user).select_related('job')


class RecruiterApplicationsListView(generics.ListAPIView):
    serializer_class = ApplicationSerializer
    permission_classes = [permissions.IsAuthenticated, IsRecruiter]

    def get_queryset(self):
        return Application.objects.filter(job__recruiter=self.request.user).select_related('job', 'applicant')


class ApplicationStatusUpdateView(generics.UpdateAPIView):
    serializer_class = ApplicationStatusSerializer
    permission_classes = [permissions.IsAuthenticated, IsRecruiter]
    queryset = Application.objects.select_related('job')

    def get_object(self):
        application = super().get_object()
        if application.job.recruiter_id != self.request.user.id:
            raise PermissionDenied('You can only update applications for your own jobs.')
        return application


class AnalyzeResumeView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, application_id):
        try:
            application = Application.objects.select_related('job').get(id=application_id)
        except Application.DoesNotExist:
            return Response({'error': 'Application not found'}, status=status.HTTP_404_NOT_FOUND)

        if (
            application.applicant_id != request.user.id
            and application.job.recruiter_id != request.user.id
        ):
            raise PermissionDenied('You do not have access to this application.')

        resume_text = extract_text_from_pdf(application.resume.path)
        analysis = analyze_resume_fit(
            resume_text=resume_text,
            job_description=application.job.description,
        )
        return Response({'analysis': analysis}, status=status.HTTP_200_OK)


class AIChatbotView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        message = request.data.get('message', '').strip()
        if not message:
            return Response({'error': 'Message is required'}, status=status.HTTP_400_BAD_REQUEST)
        return Response({'reply': get_chatbot_response(message)}, status=status.HTTP_200_OK)
