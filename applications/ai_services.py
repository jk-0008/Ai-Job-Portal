# applications/ai_services.py
import pdfplumber
from google import genai
from django.conf import settings

def get_genai_client():
    if not settings.GEMINI_API_KEY:
        raise RuntimeError('GEMINI_API_KEY is not configured.')
    return genai.Client(api_key=settings.GEMINI_API_KEY)

def extract_text_from_pdf(pdf_path):
    text = ""
    with pdfplumber.open(pdf_path) as pdf:
        for page in pdf.pages:
            extracted = page.extract_text()
            if extracted:
                text += extracted + "\n"
    return text

def analyze_resume_fit(resume_text, job_description):
    prompt = f"""
    You are an AI HR Assistant.
    Analyze the following resume text against the job description.
    
    Job Description:
    {job_description}
    
    Resume Text:
    {resume_text}
    
    Provide a concise evaluation including:
    1. Match Score (Percentage)
    2. Key Strengths
    3. Missing Skills/Gaps
    """
    
    response = get_genai_client().models.generate_content(
        model='gemini-2.5-flash',
        contents=prompt
    )
    return response.text

def get_chatbot_response(user_message):
    system_instruction = "You are an AI Support Assistant for a Job Portal platform. Answer user questions helpfully and concisely."
    
    response = get_genai_client().models.generate_content(
        model='gemini-2.5-flash',
        contents=f"{system_instruction}\nUser Query: {user_message}"
    )
    return response.text
