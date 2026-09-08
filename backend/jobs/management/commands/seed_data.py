from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from companies.models import Company
from jobs.models import Job

User = get_user_model()

class Command(BaseCommand):
    help = 'Seeds the database with sample companies, jobs, recruiter, and candidate accounts'

    def handle(self, *args, **options):
        self.stdout.write(self.style.NOTICE('Seeding database...'))

        # 1. Create Recruiter
        recruiter, created = User.objects.get_or_create(
            username='recruiter_sarah',
            defaults={
                'email': 'sarah@jobi.com',
                'role': 'recruiter',
                'first_name': 'Sarah',
                'last_name': 'Jenkins',
            }
        )
        if created:
            recruiter.set_password('Recruiter123!')
            recruiter.save()
            self.stdout.write(self.style.SUCCESS('Created recruiter: recruiter_sarah (Password: Recruiter123!)'))
        else:
            recruiter.role = 'recruiter'
            recruiter.save()

        # 2. Create Candidate
        candidate, created = User.objects.get_or_create(
            username='candidate_alex',
            defaults={
                'email': 'alex@example.com',
                'role': 'job_seeker',
                'first_name': 'Alex',
                'last_name': 'Morgan',
            }
        )
        if created:
            candidate.set_password('Candidate123!')
            candidate.save()
            self.stdout.write(self.style.SUCCESS('Created candidate: candidate_alex (Password: Candidate123!)'))
        else:
            candidate.role = 'job_seeker'
            candidate.save()

        # 3. Create Additional Employers/Companies
        recruiter_linear, _ = User.objects.get_or_create(
            username='recruiter_david',
            defaults={
                'email': 'david@linear.app',
                'role': 'hiring_manager',
                'first_name': 'David',
                'last_name': 'Chen',
            }
        )
        recruiter_linear.set_password('Recruiter123!')
        recruiter_linear.save()

        recruiter_vercel, _ = User.objects.get_or_create(
            username='recruiter_elena',
            defaults={
                'email': 'elena@vercel.com',
                'role': 'company_admin',
                'first_name': 'Elena',
                'last_name': 'Rostova',
            }
        )
        recruiter_vercel.set_password('Recruiter123!')
        recruiter_vercel.save()

        company_stripe, _ = Company.objects.get_or_create(
            user=recruiter,
            defaults={
                'name': 'Stripe',
                'description': 'Financial infrastructure for the internet. Millions of companies use Stripe to accept payments and scale online.',
                'website': 'https://stripe.com',
                'location': 'San Francisco, CA & Remote',
            }
        )

        company_linear, _ = Company.objects.get_or_create(
            user=recruiter_linear,
            defaults={
                'name': 'Linear',
                'description': 'The issue tracking and project management tool built for modern high-performance software teams.',
                'website': 'https://linear.app',
                'location': 'San Francisco, CA & Remote',
            }
        )

        company_vercel, _ = Company.objects.get_or_create(
            user=recruiter_vercel,
            defaults={
                'name': 'Vercel',
                'description': 'The Frontend Cloud platform for Next.js, AI web applications, and global edge deployments.',
                'website': 'https://vercel.com',
                'location': 'Remote Worldwide',
            }
        )

        # 4. Indian Tech Employers & Companies
        recruiter_razorpay, _ = User.objects.get_or_create(
            username='recruiter_arjun',
            defaults={
                'email': 'arjun@razorpay.com',
                'role': 'recruiter',
                'first_name': 'Arjun',
                'last_name': 'Sharma',
            }
        )
        recruiter_razorpay.set_password('Recruiter123!')
        recruiter_razorpay.save()

        recruiter_zoho, _ = User.objects.get_or_create(
            username='recruiter_priya',
            defaults={
                'email': 'priya@zohocorp.com',
                'role': 'recruiter',
                'first_name': 'Priya',
                'last_name': 'Ramanathan',
            }
        )
        recruiter_zoho.set_password('Recruiter123!')
        recruiter_zoho.save()

        recruiter_flipkart, _ = User.objects.get_or_create(
            username='recruiter_rohit',
            defaults={
                'email': 'rohit@flipkart.com',
                'role': 'hiring_manager',
                'first_name': 'Rohit',
                'last_name': 'Verma',
            }
        )
        recruiter_flipkart.set_password('Recruiter123!')
        recruiter_flipkart.save()

        recruiter_swiggy, _ = User.objects.get_or_create(
            username='recruiter_ananya',
            defaults={
                'email': 'ananya@swiggy.in',
                'role': 'recruiter',
                'first_name': 'Ananya',
                'last_name': 'Nair',
            }
        )
        recruiter_swiggy.set_password('Recruiter123!')
        recruiter_swiggy.save()

        company_razorpay, _ = Company.objects.get_or_create(
            user=recruiter_razorpay,
            defaults={
                'name': 'Razorpay',
                'description': 'India’s leading full-stack financial services platform enabling payments, banking, and credit for digital businesses.',
                'website': 'https://razorpay.com',
                'location': 'Bengaluru, Karnataka, India',
            }
        )

        company_zoho, _ = Company.objects.get_or_create(
            user=recruiter_zoho,
            defaults={
                'name': 'Zoho Corporation',
                'description': 'Global software suite for business operations, cloud productivity, CRM, and developer tools.',
                'website': 'https://zoho.com',
                'location': 'Chennai, Tamil Nadu, India',
            }
        )

        company_flipkart, _ = Company.objects.get_or_create(
            user=recruiter_flipkart,
            defaults={
                'name': 'Flipkart',
                'description': 'India’s homegrown e-commerce powerhouse transforming commerce through scalable tech and logistics.',
                'website': 'https://flipkart.com',
                'location': 'Bengaluru, Karnataka, India',
            }
        )

        company_swiggy, _ = Company.objects.get_or_create(
            user=recruiter_swiggy,
            defaults={
                'name': 'Swiggy',
                'description': 'India’s leading on-demand convenience platform offering food delivery, grocery quick-commerce, and logistics.',
                'website': 'https://swiggy.com',
                'location': 'Bengaluru / Hyderabad, India',
            }
        )

        # 5. Expanded Sample Jobs across India and Global Tech Hubs
        sample_jobs = [
            {
                'title': 'Senior Full-Stack Engineer',
                'company': company_stripe,
                'recruiter': recruiter,
                'description': 'We are looking for an experienced Full-Stack Engineer to design, build, and scale high-volume developer APIs and intuitive web dashboard experiences.\n\nYou will collaborate with product designers, AI engineers, and backend architects to deliver delightful financial tools.',
                'requirements': 'Python, Django, React, TypeScript, PostgreSQL, REST APIs, Docker, CI/CD',
                'location': 'San Francisco, CA (Remote)',
                'job_type': 'full_time',
                'salary_range': '$145,000 - $185,000',
                'is_active': True,
            },
            {
                'title': 'AI Solutions Architect',
                'company': company_stripe,
                'recruiter': recruiter,
                'description': 'Lead the design and rollout of generative AI capabilities across our internal tools and customer-facing workflows.\n\nYou will work with Gemini LLM models, vector embeddings, and retrieval-augmented generation pipelines.',
                'requirements': 'Python, Google Gemini, OpenAI APIs, LangChain, RAG, PyTorch, FastAPI',
                'location': 'Remote',
                'job_type': 'full_time',
                'salary_range': '$160,000 - $210,000',
                'is_active': True,
            },
            {
                'title': 'Lead UI/UX Product Designer',
                'company': company_linear,
                'recruiter': recruiter_linear,
                'description': 'Shape the next generation of issue tracking and engineering workflows. You will craft pixel-perfect user interfaces, interactive prototypes, and design system components.',
                'requirements': 'Figma, Design Systems, User Research, Prototyping, Motion Design, CSS/HTML',
                'location': 'San Francisco, CA (Hybrid)',
                'job_type': 'full_time',
                'salary_range': '$140,000 - $175,000',
                'is_active': True,
            },
            {
                'title': 'Cloud DevOps & Infrastructure Engineer',
                'company': company_linear,
                'recruiter': recruiter_linear,
                'description': 'Manage our multi-region Kubernetes clusters, automated CI/CD pipelines, and observability infrastructure with a strong focus on reliability and developer velocity.',
                'requirements': 'Kubernetes, Terraform, AWS, Docker, Prometheus, Grafana, GitHub Actions',
                'location': 'Remote',
                'job_type': 'full_time',
                'salary_range': '$135,000 - $170,000',
                'is_active': True,
            },
            {
                'title': 'Frontend React Developer',
                'company': company_vercel,
                'recruiter': recruiter_vercel,
                'description': 'Join our Core UI team to build lightning-fast web applications with modern React, Vite, and responsive design patterns.',
                'requirements': 'React 19, JavaScript ES6+, Vite, CSS Grid/Flexbox, HTML5, State Management',
                'location': 'New York, NY (Remote)',
                'job_type': 'full_time',
                'salary_range': '$120,000 - $150,000',
                'is_active': True,
            },
            {
                'title': 'Web Performance & Accessibility Consultant',
                'company': company_vercel,
                'recruiter': recruiter_vercel,
                'description': 'Part-time specialist focused on Core Web Vitals optimization, Lighthouse audits, and WCAG accessibility compliance across key web experiences.',
                'requirements': 'Web Vitals, Chrome DevTools, JavaScript profiling, WCAG 2.1, HTML Semantic markup',
                'location': 'Remote',
                'job_type': 'part_time',
                'salary_range': '$75 - $110 / hour',
                'is_active': True,
            },
            {
                'title': 'Mobile Application Developer (React Native)',
                'company': company_stripe,
                'recruiter': recruiter,
                'description': 'Contract role to deliver polished mobile experiences for iOS and Android, focusing on secure biometric authentication and real-time notifications.',
                'requirements': 'React Native, TypeScript, iOS/Android SDKs, Redux, Mobile Security, REST APIs',
                'location': 'Remote',
                'job_type': 'contract',
                'salary_range': '$65 - $90 / hour',
                'is_active': True,
            },
            {
                'title': 'Junior AI & Data Science Intern',
                'company': company_linear,
                'recruiter': recruiter_linear,
                'description': 'Great opportunity for students or recent graduates passionate about machine learning, data cleaning, and NLP prompt engineering.',
                'requirements': 'Python, Pandas, NumPy, Scikit-learn, Git, SQL',
                'location': 'San Francisco, CA (Hybrid)',
                'job_type': 'internship',
                'salary_range': '$42 / hour',
                'is_active': True,
            },
            {
                'title': 'Cybersecurity & Application Security Specialist',
                'company': company_stripe,
                'recruiter': recruiter,
                'description': 'Perform threat modeling, vulnerability assessments, and secure code reviews for critical payment processing pathways.',
                'requirements': 'OWASP Top 10, Penetration Testing, Python, Cryptography, OAuth, SOC2',
                'location': 'New York, NY (Hybrid)',
                'job_type': 'contract',
                'salary_range': '$130,000 - $165,000',
                'is_active': True,
            },
        ]

        for job_info in sample_jobs:
            job, created = Job.objects.get_or_create(
                title=job_info['title'],
                company=job_info['company'],
                defaults=job_info
            )
            if created:
                self.stdout.write(self.style.SUCCESS(f"Created job: {job.title} at {job.company.name}"))
            else:
                self.stdout.write(f"Job already exists: {job.title}")

        self.stdout.write(self.style.SUCCESS('Database seeding completed successfully!'))
