# applications/views.py
from rest_framework import generics, permissions
from rest_framework.parsers import FormParser, MultiPartParser
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, permissions
from .models import Application
from .serializers import ApplicationSerializer
from .ai_services import extract_text_from_pdf, analyze_resume_fit, get_chatbot_response


class ApplicationCreateView(generics.CreateAPIView):
    serializer_class = ApplicationSerializer
    permission_classes = [permissions.IsAuthenticated]
    parser_classes = (MultiPartParser, FormParser)

    def perform_create(self, serializer):
        serializer.save(applicant=self.request.user)


class UserApplicationsListView(generics.ListAPIView):
    serializer_class = ApplicationSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Application.objects.filter(applicant=self.request.user)

class AnalyzeResumeView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, application_id):
        try:
            application = Application.objects.get(id=application_id)
            pdf_path = application.resume.path
            resume_text = extract_text_from_pdf(pdf_path)
            
            analysis = analyze_resume_fit(
                resume_text=resume_text,
                job_description=application.job.description
            )
            return Response({"analysis": analysis}, status=status.HTTP_200_OK)
        except Application.DoesNotExist:
            return Response({"error": "Application not found"}, status=status.HTTP_404_NOT_FOUND)

class AIChatbotView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        message = request.data.get('message', '')
        if not message:
            return Response({"error": "Message is required"}, status=status.HTTP_400_BAD_REQUEST)
            
        bot_response = get_chatbot_response(message)
        return Response({"reply": bot_response}, status=status.HTTP_200_OK)