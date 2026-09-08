from rest_framework import generics, permissions, status
from rest_framework.exceptions import PermissionDenied, ValidationError
from rest_framework.parsers import FormParser, MultiPartParser
from rest_framework.response import Response
from rest_framework.views import APIView

from jobs.permissions import IsRecruiter

from .ai_services import (
    analyze_resume_fit,
    evaluate_structured_interview_fit,
    extract_text_from_pdf,
    generate_categorized_interview_questions,
    get_chatbot_response,
)
from .models import Application
from .serializers import ApplicationSerializer, ApplicationStatusSerializer


class ApplicationCreateView(generics.CreateAPIView):
    serializer_class = ApplicationSerializer
    permission_classes = [permissions.IsAuthenticated]
    parser_classes = (MultiPartParser, FormParser)

    def perform_create(self, serializer):
        if self.request.user.role not in ('job_seeker', 'seeker'):
            raise PermissionDenied('Only job seekers can submit applications.')
        if not serializer.validated_data['job'].is_active:
            raise ValidationError({'job': 'This job is no longer accepting applications.'})
        serializer.save(applicant=self.request.user)


class UserApplicationsListView(generics.ListAPIView):
    serializer_class = ApplicationSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Application.objects.filter(applicant=self.request.user).select_related('job')


def get_recruiter_applications_filter(user):
    from django.db.models import Q
    q = Q(job__recruiter=user)
    profile = getattr(user, 'profile', None)
    company_name = (profile.company_name if profile else '') or ''
    if company_name:
        q |= Q(job__company__name__iexact=company_name)
        q |= Q(job__recruiter__profile__company_name__iexact=company_name)
    return q


class RecruiterApplicationsListView(generics.ListAPIView):
    serializer_class = ApplicationSerializer
    permission_classes = [permissions.IsAuthenticated, IsRecruiter]

    def get_queryset(self):
        q = get_recruiter_applications_filter(self.request.user)
        return Application.objects.filter(q).distinct().select_related('job', 'applicant', 'job__recruiter')


class ApplicationStatusUpdateView(generics.UpdateAPIView):
    serializer_class = ApplicationStatusSerializer
    permission_classes = [permissions.IsAuthenticated, IsRecruiter]
    queryset = Application.objects.select_related('job')

    def get_queryset(self):
        q = get_recruiter_applications_filter(self.request.user)
        return Application.objects.filter(q).distinct()


class AnalyzeResumeView(APIView):
    permission_classes = [permissions.IsAuthenticated, IsRecruiter]

    def post(self, request, application_id):
        from django.db.models import Q
        q = get_recruiter_applications_filter(request.user) & Q(id=application_id)
        application = Application.objects.select_related('job', 'applicant').filter(q).first()
        if not application:
            return Response({'error': 'Application not found or unauthorized.'}, status=status.HTTP_404_NOT_FOUND)

        resume_text = ""
        if application.resume:
            try:
                resume_text = extract_text_from_pdf(application.resume.path)
            except Exception:
                resume_text = ""

        if not resume_text and application.applicant:
            profile = getattr(application.applicant, 'profile', None)
            bio = profile.bio if profile else ""
            skills = profile.skills if profile else ""
            resume_text = f"Candidate: {application.applicant.get_full_name() or application.applicant.username}\nSkills: {skills}\nBio: {bio}"

        job_desc = ""
        if application.job:
            job_desc = f"Title: {application.job.title}\nRequirements: {application.job.requirements}\nDescription: {application.job.description}"

        analysis = analyze_resume_fit(
            resume_text=resume_text,
            job_description=job_desc,
        )
        interview_fit = evaluate_structured_interview_fit(
            resume_text=resume_text,
            job_description=job_desc,
        )
        return Response({
            'analysis': analysis,
            'interview_fit': interview_fit,
        }, status=status.HTTP_200_OK)


class GenerateInterviewQuestionsView(APIView):
    permission_classes = [permissions.IsAuthenticated, IsRecruiter]

    def post(self, request, application_id):
        from django.db.models import Q
        q = get_recruiter_applications_filter(request.user) & Q(id=application_id)
        application = Application.objects.select_related('job', 'applicant').filter(q).first()
        if not application:
            return Response({'error': 'Application not found or unauthorized.'}, status=status.HTTP_404_NOT_FOUND)

        resume_text = ""
        if application.resume:
            try:
                resume_text = extract_text_from_pdf(application.resume.path)
            except Exception:
                resume_text = ""

        if not resume_text and application.applicant:
            profile = getattr(application.applicant, 'profile', None)
            bio = profile.bio if profile else ""
            skills = profile.skills if profile else ""
            resume_text = f"Candidate: {application.applicant.get_full_name() or application.applicant.username}\nSkills: {skills}\nBio: {bio}"

        job_desc = ""
        if application.job:
            job_desc = f"Title: {application.job.title}\nRequirements: {application.job.requirements}\nDescription: {application.job.description}"

        questions_data = generate_categorized_interview_questions(
            resume_text=resume_text,
            job_description=job_desc,
        )
        return Response(questions_data, status=status.HTTP_200_OK)


from rest_framework_simplejwt.authentication import JWTAuthentication

class SafeJWTAuthentication(JWTAuthentication):
    def authenticate(self, request):
        try:
            return super().authenticate(request)
        except Exception:
            return None


class AIChatbotView(APIView):
    authentication_classes = [SafeJWTAuthentication]
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        message = request.data.get('message', '').strip()
        if not message:
            return Response({'error': 'Message is required'}, status=status.HTTP_400_BAD_REQUEST)
        user = request.user if request.user and request.user.is_authenticated else None
        return Response({'reply': get_chatbot_response(message, user=user)}, status=status.HTTP_200_OK)


class SeedDemoApplicantView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        import os
        from django.conf import settings
        from django.contrib.auth import get_user_model
        from django.core.files.base import ContentFile
        from jobs.models import Job

        User = get_user_model()
        user = request.user if request.user.is_authenticated else User.objects.filter(role__in=['recruiter', 'company_admin', 'hiring_manager']).first()
        if not user:
            user = User.objects.first()

        profile = getattr(user, 'profile', None)
        company_name = (profile.company_name if profile else '') or ''
        from django.db.models import Q
        q = Q(recruiter=user)
        if company_name:
            q |= Q(company__name__iexact=company_name) | Q(recruiter__profile__company_name__iexact=company_name)

        job = Job.objects.filter(q).first()
        if not job:
            job = Job.objects.create(
                recruiter=user,
                title="Full-Stack AI Software Engineer",
                description="We are seeking an innovative Full-Stack Engineer with strong Python, Django, React, and LLM API experience to build next-generation AI web products.",
                requirements="Python, Django, React, JavaScript, REST APIs, Gemini AI, PostgreSQL, Docker",
                location="San Francisco, CA (Hybrid)",
                job_type="full_time",
                salary_range="$130,000 - $160,000"
            )

        applicant, _ = User.objects.get_or_create(
            username="candidate_alex",
            defaults={"email": "alex.chen@example.com", "role": "job_seeker"}
        )

        existing = Application.objects.filter(job=job, applicant=applicant).first()
        if existing:
            return Response(ApplicationSerializer(existing).data, status=status.HTTP_200_OK)

        resume_name = "sample_alex_resume.pdf"
        sample_path = os.path.join(settings.MEDIA_ROOT, "resumes", "Ganesh_Jaya_Resume.pdf")
        if os.path.exists(sample_path):
            with open(sample_path, "rb") as f:
                content = f.read()
        else:
            content = b"%PDF-1.4 Mock Candidate Resume with skills in Python, Django, React, AI APIs, JavaScript."

        application = Application(
            job=job,
            applicant=applicant,
            cover_letter="I am very excited to apply for this engineering position. I have deep hands-on expertise building AI applications with Django and React."
        )
        application.resume.save(resume_name, ContentFile(content), save=True)
        return Response(ApplicationSerializer(application).data, status=status.HTTP_201_CREATED)
