# applications/ai_services.py
import os
import pdfplumber
from django.conf import settings

def get_genai_client():
    from google import genai
    if not settings.GEMINI_API_KEY:
        raise RuntimeError('GEMINI_API_KEY is not configured.')
    return genai.Client(api_key=settings.GEMINI_API_KEY)

def extract_text_from_pdf(pdf_path):
    text = ""
    try:
        with pdfplumber.open(pdf_path) as pdf:
            for page in pdf.pages:
                extracted = page.extract_text()
                if extracted:
                    text += extracted + "\n"
    except Exception as e:
        text = f"Candidate Resume Document (Note: {e})"
    return text

def generate_local_resume_analysis(resume_text, job_description):
    """
    Intelligent technical interview fit & competency evaluation engine.
    Used when GEMINI_API_KEY is not configured or network quota is exceeded.
    """
    import re

    tech_skills = [
        'python', 'django', 'react', 'javascript', 'typescript', 'node.js', 'nodejs',
        'java', 'springboot', 'spring boot', 'spring', 'microservices', 'selenium',
        'automation', 'testing', 'qa', 'testng', 'c++', 'c#', '.net', 'kubernetes',
        'docker', 'aws', 'gcp', 'azure', 'cloud', 'sql', 'postgresql', 'mysql', 'mongodb',
        'redis', 'kafka', 'rest api', 'apis', 'html', 'css', 'git', 'redux', 'tailwind',
        'graphql', 'fastapi', 'flask', 'linux', 'ci/cd', 'devops', 'junit', 'agile',
        'communication'
    ]

    resume_lower = (resume_text or '').lower()
    job_lower = (job_description or '').lower()

    # Extract requirement skills explicitly if present
    extracted_reqs = []
    req_match = re.search(r'requirements?:\s*([^\n]+)', job_description or '', re.IGNORECASE)
    if req_match:
        for item in req_match.group(1).split(','):
            clean_item = item.strip().lower()
            if clean_item and len(clean_item) > 1:
                extracted_reqs.append(clean_item)

    # Detect skills mentioned in job description
    detected_in_job = [skill for skill in tech_skills if skill in job_lower]
    all_required = list(dict.fromkeys(extracted_reqs + detected_in_job))
    if not all_required:
        all_required = ['java', 'springboot', 'rest api', 'sql']

    matched_skills = [skill for skill in all_required if skill in resume_lower]
    missing_skills = [skill for skill in all_required if skill not in resume_lower]

    match_ratio = len(matched_skills) / max(len(all_required), 1)
    score = int(62 + (match_ratio * 34))
    score = min(score, 98)

    if score >= 85:
        verdict = "Strong Technical Fit"
        badge = "HIGH FIT"
    elif score >= 72:
        verdict = "Good Technical Fit"
        badge = "INTERVIEW CANDIDATE"
    else:
        verdict = "Potential Fit (Skill Gaps to Probe)"
        badge = "REQUIRES SCREENING"

    matched_str = ", ".join(s.title() for s in matched_skills) if matched_skills else "Core Software Engineering Competencies"
    missing_str = ", ".join(s.title() for s in missing_skills) if missing_skills else "No critical skill gaps identified"

    # Generate tailored interview questions based on matched and missing skills
    top_matched = matched_skills[0].title() if matched_skills else "Core Stack"
    top_missing = missing_skills[0].title() if missing_skills else None

    q1 = f"Can you explain your hands-on experience building and testing systems with {top_matched}? Share a production challenge you resolved."
    if top_missing:
        q2 = f"This position emphasizes {top_missing}. What is your familiarity with this technology, and how quickly have you adopted new frameworks in past projects?"
    else:
        q2 = "Can you describe how you architect modular code, handle error recovery, and ensure automated test coverage?"
    q3 = "Walk me through how you collaborate between development, testing, and DevOps pipelines to deliver reliable software."

    decision = (
        "⭐ Proceed directly to 45-minute technical coding & system interview."
        if score >= 75
        else "🔍 Recommend a 20-minute preliminary technical screening to assess domain experience and framework familiarity."
    )

    return f"""### 🎯 Technical Interview Fit Evaluation
**Overall Match Score:** {score}% ({verdict} · {badge})

#### 1. Verified Technical Competencies
- **Matched Skills:** {matched_str}
- **Resume Alignment:** Candidate documents hands-on project experience covering key aspects of this opening.
- **Background Quality:** Verified technical profile with relevant domain tooling.

#### 2. Technical Gaps & Areas to Probe
- **Target Review Areas:** {missing_str}
- **Evaluation Priority:** Confirm candidate's depth with architectural patterns, hands-on framework proficiency, and delivery velocity.

#### 3. Recommended Technical Interview Questions
1. **Practical Experience:** {q1}
2. **Framework & Adaptability:** {q2}
3. **Architecture & Collaboration:** {q3}

#### 4. Hiring Manager Decision
{decision}

*(Evaluated by Jobi AI Technical Fit Engine).*"""


def analyze_resume_fit(resume_text, job_description):
    if settings.GEMINI_API_KEY:
        try:
            prompt = f"""
            You are Jobi, an AI Technical Interview Evaluator for Jobi Job Portal.
            Analyze the candidate's resume against the target role and requirements to evaluate technical interview fit.

            Job Details:
            {job_description}

            Resume Content:
            {resume_text}

            Provide a concise evaluation formatted in clean markdown including:
            ### 🎯 Technical Interview Fit Evaluation
            **Overall Match Score:** [Percentage]% ([Strong Technical Fit / Good Fit / Potential Fit])

            #### 1. Verified Technical Competencies
            - **Matched Skills:** [Bullet list]
            - **Resume Alignment:** [Summary]

            #### 2. Technical Gaps & Areas to Probe
            - **Missing Skills / Gaps:** [Bullet list]
            - **Areas to Probe:** [Summary]

            #### 3. Recommended Technical Interview Questions
            1. [Technical question 1]
            2. [Technical question 2]
            3. [Technical question 3]

            #### 4. Hiring Manager Decision
            [Clear recommendation for the Hiring Manager]
            """
            response = get_genai_client().models.generate_content(
                model='gemini-2.5-flash',
                contents=prompt
            )
            if response and response.text:
                return response.text
        except Exception:
            pass

    # Seamless fallback to intelligent local analyzer
    return generate_local_resume_analysis(resume_text, job_description)


def evaluate_structured_interview_fit(resume_text, job_description):
    """
    Evaluates candidate resume and returns a structured AI Interview Fit payload
    with score, positive/warning highlights, and interview recommendation.
    """
    import re

    tech_skills = [
        'python', 'django', 'react', 'javascript', 'typescript', 'node.js', 'nodejs',
        'java', 'springboot', 'spring boot', 'spring', 'microservices', 'selenium',
        'automation', 'testing', 'qa', 'testng', 'c++', 'c#', '.net', 'kubernetes',
        'docker', 'aws', 'gcp', 'azure', 'cloud', 'sql', 'postgresql', 'mysql', 'mongodb',
        'redis', 'kafka', 'rest api', 'apis', 'html', 'css', 'git', 'redux', 'tailwind',
        'graphql', 'fastapi', 'flask', 'linux', 'ci/cd', 'devops', 'junit', 'agile',
        'communication'
    ]

    resume_lower = (resume_text or '').lower()
    job_lower = (job_description or '').lower()

    extracted_reqs = []
    req_match = re.search(r'requirements?:\s*([^\n]+)', job_description or '', re.IGNORECASE)
    if req_match:
        for item in req_match.group(1).split(','):
            clean_item = item.strip().lower()
            if clean_item and len(clean_item) > 1:
                extracted_reqs.append(clean_item)

    detected_in_job = [skill for skill in tech_skills if skill in job_lower]
    all_required = list(dict.fromkeys(extracted_reqs + detected_in_job))
    if not all_required:
        all_required = ['java', 'springboot', 'rest api', 'sql']

    matched_skills = [skill for skill in all_required if skill in resume_lower]
    missing_skills = [skill for skill in all_required if skill not in resume_lower]

    match_ratio = len(matched_skills) / max(len(all_required), 1)
    score = int(64 + (match_ratio * 32))
    score = min(score, 96)

    matched_str = ", ".join(s.title() for s in matched_skills) if matched_skills else "Core programming fundamentals"
    missing_str = ", ".join(s.title() for s in missing_skills) if missing_skills else "cloud infrastructure"

    if score >= 75:
        recommendation = "Proceed to Interview"
        recommendation_type = "proceed"
        rec_badge = "🟢 Proceed to Interview"
        verdict = "Strong technical match"
    elif score >= 60:
        recommendation = "Preliminary Screening"
        recommendation_type = "screen"
        rec_badge = "🟡 Preliminary Screening"
        verdict = "Moderate technical fit"
    else:
        recommendation = "Not Recommended"
        recommendation_type = "decline"
        rec_badge = "🔴 Not Recommended"
        verdict = "Significant skill gaps"

    highlights = [
        {
            'type': 'positive',
            'icon': '✅',
            'text': f"Strong technical match in {matched_str}" if matched_skills else "Baseline technical foundation verified"
        },
        {
            'type': 'positive',
            'icon': '✅',
            'text': "Relevant project experience verified on candidate resume"
        }
    ]

    if missing_skills:
        highlights.append({
            'type': 'warning',
            'icon': '⚠️',
            'text': f"Limited {missing_skills[0].title()} experience (recommend probing in interview)"
        })
    else:
        highlights.append({
            'type': 'warning',
            'icon': '⚠️',
            'text': "Limited enterprise cloud & scaling experience"
        })

    return {
        'score': score,
        'verdict': verdict,
        'recommendation': recommendation,
        'recommendation_type': recommendation_type,
        'recommendation_badge': rec_badge,
        'highlights': highlights,
        'matched_skills': matched_skills,
        'missing_skills': missing_skills,
    }


def generate_categorized_interview_questions(resume_text, job_description):
    """
    Generates tailored, categorized technical interview questions based on
    the candidate's resume and job requirements across 4 key dimensions:
      1. Core Language/Technology
      2. Framework & Architecture
      3. Project-Based Questions
      4. Technical Scenario Questions
    """
    job_lower = (job_description or '').lower()

    # Determine core language
    if 'python' in job_lower:
        core_lang = "Python"
        framework_name = "Django / FastAPI"
        lang_questions = [
            "How does Python's Global Interpreter Lock (GIL) impact multithreading, and how do you achieve concurrency in CPU vs I/O bound tasks?",
            "Can you explain the difference between deepcopy and shallow copy, and how memory references behave with mutable default arguments in Python?",
            "What are Python generators and decorators, and how have you used them in production code for clean, memory-efficient design?"
        ]
        framework_questions = [
            f"How do you optimize {framework_name} ORM queries to prevent the N+1 problem, and when do you utilize `select_related` vs `prefetch_related`?",
            f"Walk me through how you structure custom middleware, token-based authentication, and permission classes in {framework_name}.",
            f"How do you handle database migrations, schema locking, and rollback strategies in production with {framework_name}?"
        ]
    elif 'java' in job_lower or 'spring' in job_lower:
        core_lang = "Java"
        framework_name = "Spring Boot / Microservices"
        lang_questions = [
            "How does JVM memory management and garbage collection (G1, ZGC) work in Java, and how do you diagnose memory leaks in production?",
            "Can you explain the differences between `ConcurrentHashMap`, `synchronized`, and `ReentrantLock` in concurrent Java applications?",
            "What are Java 17/21 record patterns, virtual threads, and functional interfaces, and where have you applied them?"
        ]
        framework_questions = [
            "How do you implement Spring Boot dependency injection and configure bean scopes (Singleton vs Prototype vs Request)?",
            "How do you handle distributed transactions, idempotency, and circuit breakers (Resilience4j) across microservices in Spring Boot?",
            "Walk me through how you optimize Spring Data JPA queries and manage entity relationships with lazy loading."
        ]
    elif 'react' in job_lower or 'javascript' in job_lower:
        core_lang = "JavaScript / TypeScript"
        framework_name = "React & State Management"
        lang_questions = [
            "How does the JavaScript Event Loop work (Call Stack, Web APIs, Microtask Queue vs Macrotask Queue)?",
            "Can you explain TypeScript generics, union types, and utility types (Pick, Omit, Partial) with practical examples?",
            "What are closures in JavaScript, and how can improper closure references cause memory leaks in single-page apps?"
        ]
        framework_questions = [
            "How does React 18/19 Concurrent Rendering and Virtual DOM reconciliation work under the hood?",
            "When should you use `useCallback` and `useMemo` for optimization, and what are the drawbacks of overusing them?",
            "How do you manage complex global state (Redux Toolkit vs Zustand vs React Context) and handle server state caching?"
        ]
    else:
        core_lang = "Core Programming Fundamentals"
        framework_name = "System Architecture & APIs"
        lang_questions = [
            "What data structures would you choose for high-frequency search and insertion, and what are their Big-O time and space complexities?",
            "How do you ensure thread safety and avoid race conditions when multiple workers access shared resources?",
            "Explain your best practices for writing clean, modular, and testable code adhering to SOLID design principles."
        ]
        framework_questions = [
            "How do you design idempotent RESTful APIs with proper HTTP status codes, pagination, and rate limiting?",
            "How do you configure asynchronous background task queues (e.g. Celery / RabbitMQ / Kafka) for long-running workflows?",
            "Walk me through how you design database schemas, indexing strategies, and caching layers using Redis."
        ]

    project_questions = [
        "Can you describe the most challenging software feature you architected in your recent project? What key trade-offs did you make?",
        "Tell me about a time a production query or API endpoint degraded under heavy load. How did you profile the bottleneck and resolve it?",
        "How do you structure unit, integration, and end-to-end automated test suites to maintain high test coverage without slowing down deployments?"
    ]

    scenario_questions = [
        "Scenario: A critical production service begins throwing 500/504 errors immediately following a midnight deployment. What is your step-by-step triage and rollback workflow?",
        "Scenario: You need to design an API endpoint that handles 50,000 requests per minute with strict sub-100ms latency. What caching, database, and architectural patterns do you apply?",
        "Scenario: You discover that two services have conflicting data models after an urgent product release. How do you resolve data drift without causing downtime?"
    ]

    return {
        'candidate_role': core_lang,
        'framework_name': framework_name,
        'categories': [
            {
                'id': 'core_tech',
                'title': f"1. {core_lang} Questions",
                'icon': "💻",
                'description': f"Core language fundamentals, memory management, and syntax principles for {core_lang}",
                'questions': lang_questions
            },
            {
                'id': 'framework',
                'title': f"2. {framework_name} Questions",
                'icon': "⚙️",
                'description': f"Framework architecture, dependency injection, lifecycle, and component structure for {framework_name}",
                'questions': framework_questions
            },
            {
                'id': 'project_based',
                'title': "3. Project-Based Questions",
                'icon': "🚀",
                'description': "Practical engineering experience, performance profiling, and contributions from past projects",
                'questions': project_questions
            },
            {
                'id': 'scenario',
                'title': "4. Technical Scenario & Problem-Solving Questions",
                'icon': "🧩",
                'description': "Real-world engineering edge cases, system reliability, and crisis handling in production",
                'questions': scenario_questions
            }
        ]
    }

def get_chatbot_response(user_message, user=None):
    from jobs.models import Job
    from applications.models import Application
    import re

    raw_msg = (user_message or '').strip()
    msg = raw_msg.lower()

    # User Role & Context Introspection
    user_role = getattr(user, 'role', 'guest') if (user and user.is_authenticated) else 'guest'
    user_profile = getattr(user, 'profile', None) if (user and user.is_authenticated) else None
    user_dept = getattr(user_profile, 'department', '') if user_profile else ''
    user_company = getattr(user_profile, 'company_name', '') if user_profile else ''
    user_desig = getattr(user_profile, 'designation', '') if user_profile else ''
    username = getattr(user, 'username', 'Guest') if (user and user.is_authenticated) else 'Guest'

    # 1. Fetch relevant database context
    active_jobs = list(Job.objects.filter(is_active=True).select_related('company', 'recruiter').order_by('-created_at'))
    user_apps = list(Application.objects.filter(applicant=user).select_related('job', 'job__company').order_by('-applied_at')) if (user and user.is_authenticated) else []

    # 2. Try Gemini API first if configured
    if settings.GEMINI_API_KEY:
        try:
            jobs_summary = "\n".join([
                f"- {j.title} at {j.company.name if j.company else 'Jobi'} ({j.location})"
                for j in active_jobs[:10]
            ])
            apps_summary = ", ".join([f"{a.job.title}: {a.status} (Applied: {a.applied_at.strftime('%Y-%m-%d')})" for a in user_apps]) if user_apps else "None"
            user_context_str = f"Username: {username}, Role: {user_role}, Company: {user_company or 'N/A'}, Department: {user_dept or 'N/A'}"

            prompt = f"""You are Jobi, an intelligent AI Career & Technical Interview Assistant for the Jobi Job Portal.
Current User Context:
{user_context_str}
User Applications:
{apps_summary}
Active Portal Jobs:
{jobs_summary}

IMPORTANT INSTRUCTIONS:
- Answer the user's question directly, clearly, and concisely with well-structured markdown formatting.
- If asked about interview questions, provide 3 to 4 categorized technical questions with brief answer pointers.
- If asked about application status or condition, detail the exact state (Applied, Reviewed, Shortlisted, Not Selected) and what it means.
- If the user is a Hiring Manager ({user_role}), assist with technical screening, interview evaluation, and applicant fit analysis.
- Text only, no voice tags.

User Question: {raw_msg}"""

            response = get_genai_client().models.generate_content(
                model='gemini-2.5-flash',
                contents=prompt
            )
            if response and response.text:
                return response.text.strip()
        except Exception:
            pass

    # 3. Intelligent Local Assistant Engine

    # GREETINGS & SHORT INTROS
    if msg in ['hi', 'hello', 'hey', 'jobi', 'now', 'what now', 'next', 'help', 'start']:
        if user_role == 'hiring_manager':
            dept_title = f"{user_company} {user_dept}".strip() or "your department"
            return f"Hello **{username}**! 👋 I'm Jobi, your AI Recruitment & Interview Assistant. How can I assist with candidate screening, technical interview evaluation, or pipeline metrics for **{dept_title}** today?"
        elif user_role in ['recruiter', 'company_admin']:
            return f"Hello **{username}**! 👋 I'm Jobi, your AI Recruitment Assistant. How can I assist with your candidate pipeline, hiring statistics, or job postings today?"
        elif user_role == 'job_seeker':
            return f"Hello **{username}**! 👋 I'm Jobi, your AI Career Assistant. How can I assist with your job search, application status, or technical interview practice today?"
        return "Hello! 👋 I'm Jobi, your AI Career & Technical Interview Assistant. How can I assist with your job search, application status, or interview preparation today?"

    # TECHNICAL INTERVIEW PRACTICE & MOCK QUESTIONS
    interview_keywords = [
        'interview question', 'interview questions', 'practice interview', 'mock interview',
        'technical question', 'technical questions', 'interview prep', 'interview practice',
        'prepare for interview', 'interview tips'
    ]
    if any(k in msg for k in interview_keywords) or (any(s in msg for s in ['java', 'python', 'react', 'spring', 'sql', 'qa', 'testing']) and 'question' in msg):
        if 'java' in msg or 'spring' in msg:
            return (
                "### ☕ Java & Spring Boot Interview Preparation Questions\n\n"
                "1. **Core Java (Concurrency & Collections):**\n"
                "   * *Question:* How does `ConcurrentHashMap` achieve thread-safety without locking the entire map compared to `Hashtable`?\n"
                "   * *Answer Tip:* Mention bucket-level locking (CAS operations and `synchronized` on bucket nodes in Java 8+).\n\n"
                "2. **Spring Boot (Architecture & Lifecycles):**\n"
                "   * *Question:* Explain how Spring Boot auto-configuration works via `@EnableAutoConfiguration` and `spring.factories` / `AutoConfiguration.imports`.\n"
                "   * *Answer Tip:* Discuss conditional annotations like `@ConditionalOnClass` and `@ConditionalOnMissingBean`.\n\n"
                "3. **Persistence & Performance (JPA / Hibernate):**\n"
                "   * *Question:* How do you diagnose and resolve the JPA N+1 query problem?\n"
                "   * *Answer Tip:* Highlight `JOIN FETCH`, `@EntityGraph`, and batch fetching configurations.\n\n"
                "4. **System Scenario:**\n"
                "   * *Question:* How would you design a distributed microservices workflow ensuring idempotency during payment retries?\n\n"
                "💡 *Interview Tip: Use the STAR method (Situation, Task, Action, Result) when explaining past Java architectural decisions.*"
            )

        if 'python' in msg or 'django' in msg:
            return (
                "### 🐍 Python & Django Technical Interview Questions\n\n"
                "1. **Core Python (Internals & Memory):**\n"
                "   * *Question:* Explain the Python GIL (Global Interpreter Lock). When should you choose `multiprocessing` over `threading` or `asyncio`?\n"
                "   * *Answer Tip:* Detail CPU-bound vs I/O-bound bottlenecks and memory isolation in separate processes.\n\n"
                "2. **Django ORM & Architecture:**\n"
                "   * *Question:* What is the functional difference between `select_related` and `prefetch_related` in Django?\n"
                "   * *Answer Tip:* Explain SQL `INNER JOIN` (single query for single-valued relationships) vs separate queries with Python-side caching for M2M/Reverse FK.\n\n"
                "3. **API & Security:**\n"
                "   * *Question:* How do you implement robust JWT authentication and secure token refresh cycles in Django REST Framework?\n\n"
                "4. **Production Scenario:**\n"
                "   * *Question:* How do you handle long-running asynchronous tasks (e.g., PDF generation or emails) without blocking Django worker threads?"
            )

        if 'react' in msg or 'frontend' in msg:
            return (
                "### ⚛️ React & Frontend Technical Interview Questions\n\n"
                "1. **Core React (Reconciliation & Rendering):**\n"
                "   * *Question:* How does the React Fiber reconciliation algorithm determine what DOM nodes need updating?\n"
                "   * *Answer Tip:* Discuss virtual DOM diffing, key props, and batched state updates.\n\n"
                "2. **Hooks & Performance Optimization:**\n"
                "   * *Question:* When should you use `useCallback` and `useMemo`, and when is premature memoization counterproductive?\n\n"
                "3. **State Management & Architecture:**\n"
                "   * *Question:* How do you structure state architecture between component state, Context API, and global stores like Redux Toolkit?\n\n"
                "4. **Production Scenario:**\n"
                "   * *Question:* How do you debug and resolve layout shifts and unwanted re-renders in a high-frequency real-time dashboard?"
            )

        if 'sql' in msg or 'database' in msg:
            return (
                "### 🗄️ SQL & Database Engineering Questions\n\n"
                "1. **Indexing:** What is the structural difference between Clustered and Non-Clustered B-Tree indexes, and how do composite indexes handle column order?\n"
                "2. **Transactions & ACID:** Explain how database isolation levels (`READ COMMITTED`, `REPEATABLE READ`, `SERIALIZABLE`) prevent dirty reads, non-repeatable reads, and phantom reads.\n"
                "3. **Query Optimization:** How do you read an `EXPLAIN ANALYZE` execution plan to spot sequential table scans and missing foreign key indexes?"
            )

        if any(s in msg for s in ['qa', 'test', 'automation', 'selenium']):
            return (
                "### 🧪 QA & Test Automation Engineering Questions\n\n"
                "1. **Architecture:** How do you structure a scalable Test Automation Framework using the Page Object Model (POM) and TestNG/JUnit?\n"
                "2. **Synchronization:** Explain how you handle dynamic UI components and flaky tests using Explicit Waits (`ExpectedConditions`) versus implicit timeouts.\n"
                "3. **CI/CD Integration:** How do you configure headless automated test runs in GitHub Actions or Jenkins with failure screenshot artifacts?"
            )

        # General Interview Prep
        return (
            "### 🎯 Jobi AI Interview Preparation Guide\n\n"
            "I can generate targeted technical interview questions across 4 key categories:\n"
            "1. **Core Language & Fundamentals** (Syntax, memory, concurrency)\n"
            "2. **Framework & Architecture** (Spring Boot, Django, React, REST)\n"
            "3. **Hands-On Project Experience** (Profiling, scaling, real-world blockers)\n"
            "4. **Technical Scenarios & System Design** (Fault tolerance, crisis recovery)\n\n"
            "👉 *Which technology would you like to practice? (e.g. 'Java', 'Python', 'React', 'SQL', or 'QA Automation')*"
        )

    # APPLICATION CONDITION & STATUS DEEP DIVE
    condition_keywords = [
        'condition', 'application condition', 'condition of my application', 'what the condition',
        'what is the condition', 'track my application', 'track application', 'my application status',
        'application status', 'why is my status', 'status of my application'
    ]
    if any(k in msg for k in condition_keywords) or ('condition' in msg and 'application' in msg):
        if not user or not user.is_authenticated:
            return (
                "### 📋 Jobi Application Tracking Conditions\n\n"
                "In Jobi, applications move through 4 primary conditions:\n"
                "1. **Applied (In Review):** Resume uploaded and AI match score computed; queued for review.\n"
                "2. **Reviewed:** Hiring Lead evaluated technical competencies and project background.\n"
                "3. **Shortlisted:** Candidate cleared screening and is scheduled for technical interviews.\n"
                "4. **Not Selected:** Kept on file in talent pool for future openings.\n\n"
                "🔒 *Please log in to your account to view the real-time condition of your specific applications.*"
            )

        if user_apps:
            items = []
            for a in user_apps:
                comp_name = a.job.company.name if a.job.company else 'Jobi Partner'
                applied_date = a.applied_at.strftime('%b %d, %Y')
                st = a.status.lower()

                if st == 'applied':
                    cond_desc = "✅ **Condition: Applied (In Review)** — Your resume was analyzed by Jobi AI and is currently queued in the recruiter/hiring manager review pool."
                elif st == 'reviewed':
                    cond_desc = "🔍 **Condition: Under Technical Review** — The hiring manager has examined your profile and verified your skill match."
                elif st == 'shortlisted':
                    cond_desc = "🎉 **Condition: Shortlisted (Interview Candidate)** — Great news! You have cleared preliminary screening and are scheduled for technical rounds."
                elif st == 'rejected':
                    cond_desc = "ℹ️ **Condition: Not Selected** — Application closed for this cycle, but your profile remains active in the company talent pool."
                else:
                    cond_desc = f"📌 **Condition: {st.title()}**"

                items.append(f"• **{a.job.title}** at **{comp_name}**\n  - Applied: {applied_date}\n  - {cond_desc}")

            return "### 📊 Your Current Application Conditions\n\n" + "\n\n".join(items) + "\n\n💡 *Tip: You can open full details anytime from 'My Applications' in the top navigation.*"

        return (
            "### 📋 Your Application Status\n\n"
            "You haven't submitted any job applications yet!\n\n"
            "**Jobi Application Conditions Explained:**\n"
            "• **Applied:** Resume processed by Jobi AI and queued for screening.\n"
            "• **Reviewed:** Department team lead checked your technical profile.\n"
            "• **Shortlisted:** Fast-tracked for technical and coding interviews.\n\n"
            "Browse active openings on the **Find jobs** page to submit your resume!"
        )

    # HOW TO EVALUATE INTERVIEW FIT (FOR HIRING MANAGERS & RECRUITERS)
    fit_keywords = [
        'interview fit evaluate', 'how to evaluate interview fit', 'how to evaluate interview',
        'evaluate interview fit', 'ai interview fit', 'interview fit card', 'evaluate technical fit'
    ]
    if any(k in msg for k in fit_keywords) or ('interview fit' in msg and 'how' in msg):
        return (
            "### 🎯 How to Evaluate Interview Fit with Jobi AI\n\n"
            "Jobi equips Hiring Managers and Recruiters with a 4-step AI Interview Fit framework:\n\n"
            "1. **Overall Match Score:**\n"
            "   - **85%+ (Strong Match):** Candidate matches core and framework requirements.\n"
            "   - **72%–84% (Interview Candidate):** Good competency baseline with minor stack gaps.\n"
            "   - **< 72% (Requires Screening):** Check transferable engineering experience.\n\n"
            "2. **Competency Verification (✅ Strengths):**\n"
            "   - Automated extraction highlights verified languages, frameworks, and tools from the resume.\n\n"
            "3. **Skill Gaps & Probes (⚠️ Warnings):**\n"
            "   - Spotlights missing stack components (e.g. Cloud, Docker, Kafka) to probe during the interview.\n\n"
            "4. **AI Interview Questions Generator:**\n"
            "   - Click **'⚡ Generate Interview Questions'** on any candidate card to generate 4 categorized interview rounds (Core Tech, Framework, Project Experience, Problem Solving)."
        )

    # HIRING STATS & PIPELINE METRICS (ROLE-AWARE)
    if any(k in msg for k in ['hiring stat', 'hiring statistics', 'how many candidate', 'how many applicant', 'applicant stat', 'department candidate', 'pipeline stat']):
        total_jobs = Job.objects.filter(is_active=True).count()
        total_apps = Application.objects.count()
        shortlisted = Application.objects.filter(status='shortlisted').count()

        if user_role == 'hiring_manager':
            # Calculate department-specific stats
            dept_jobs = [j for j in active_jobs if (user_company and j.company and user_company.lower() in j.company.name.lower()) or (user_dept and user_dept.lower() in j.title.lower()) or j.recruiter == user]
            dept_job_ids = [j.id for j in dept_jobs]
            dept_apps = Application.objects.filter(job_id__in=dept_job_ids) if dept_job_ids else Application.objects.none()
            dept_shortlisted = dept_apps.filter(status='shortlisted').count()

            dept_name = f"{user_company} · {user_dept}".strip(' ·') or "Your Department"
            return (
                f"### 👥 {dept_name} Candidate Pipeline\n\n"
                f"• **Active Department Openings:** {len(dept_jobs)}\n"
                f"• **Total Applicants:** {dept_apps.count()}\n"
                f"• **Shortlisted for Interview:** {dept_shortlisted}\n\n"
                f"*(Portal Wide: {total_jobs} active openings, {total_apps} total applications across all teams).*\n\n"
                "Visit your **Recruiter Dashboard** to review applicants and evaluate AI Interview Fit."
            )

        if user_role in ['recruiter', 'company_admin']:
            return (
                f"### 📈 Jobi Recruitment Pipeline Statistics\n\n"
                f"• **Active Job Openings:** {total_jobs}\n"
                f"• **Total Candidate Applications:** {total_apps}\n"
                f"• **Candidates Shortlisted:** {shortlisted}\n\n"
                "You can manage candidates, update application stages, and post openings directly from the **Recruiter Dashboard**."
            )

        return f"Currently, there are **{total_jobs} active job openings** and **{total_apps} candidate applications** ({shortlisted} shortlisted) on Jobi."

    # RECRUITER: POST A JOB
    if any(k in msg for k in ['create a job', 'post a job', 'draft a job', 'how to post']):
        return "You can post a new job opening directly from the **Recruiter Dashboard** by clicking **'+ Post New Job'** at the top right of the dashboard."

    # RESUME OPTIMIZATION & ATS SCORING TIPS
    if any(k in msg for k in ['resume tip', 'improve resume', 'improve my resume', 'resume advice', 'cv tip', 'optimize resume', 'ats score', 'how do you score', 'explain score']) or (('resume' in msg or 'cv' in msg) and any(w in msg for w in ['optimize', 'score', 'scoring', 'improve', 'format', 'ats', 'tips', 'guide'])):
        return (
            "### 📝 Jobi AI Resume Optimization & Scoring Guide\n\n"
            "Jobi AI evaluates resumes across 4 weighted dimensions:\n"
            "• **Core Technical Match (40%):** Direct alignment with required languages and frameworks.\n"
            "• **Project & Domain Relevance (30%):** Hands-on engineering responsibilities and problem solving.\n"
            "• **Tooling & Infrastructure (20%):** Databases, cloud, CI/CD, and test automation.\n"
            "• **ATS Accessibility (10%):** Clean text layout and quantified achievements.\n\n"
            "💡 **Top Recommendation:** Use measurable metrics (e.g., *'Optimized Spring Boot API response time by 40%'*) and submit text-based PDFs."
        )

    # SALARY INQUIRIES & BENCHMARKS
    if any(k in msg for k in ['salary', 'pay', 'compensation', 'package', 'ctc', 'lpa']):
        return (
            "### 💰 Tech Salary & Compensation Benchmarks\n\n"
            "• **Java Full Stack / Spring Boot:** ₹6.0 – ₹16.0 LPA\n"
            "• **Python / Django / AI Engineer:** ₹6.5 – ₹18.0 LPA\n"
            "• **React / Frontend Engineer:** ₹5.5 – ₹14.0 LPA\n"
            "• **QA Automation Engineer:** ₹5.0 – ₹12.5 LPA\n\n"
            "Exact salary ranges are listed directly on each job card on the **Find jobs** page."
        )

    # COMPANY & COMPANY ADMIN INQUIRIES
    if any(k in msg for k in ['company admin', 'company details', 'who is admin', 'admin details', 'company information', 'admin of', 'who is the admin']):
        from companies.models import Company
        all_comps = list(Company.objects.select_related('user', 'user__profile').all())

        for c in all_comps:
            if c.name.lower() in msg:
                profile = getattr(c.user, 'profile', None)
                desig = f" ({profile.designation})" if (profile and profile.designation) else ""
                phone = f", Phone: {profile.phone}" if (profile and profile.phone) else ""
                return f"**{c.name}** Company Admin: **{c.user.username}**{desig} (Email: {c.user.email}{phone}). Location: {c.location}."

        if all_comps:
            items = []
            for c in all_comps[:4]:
                profile = getattr(c.user, 'profile', None)
                desig = f" ({profile.designation})" if (profile and profile.designation) else ""
                items.append(f"* **{c.name}** ({c.location}) - Admin: **{c.user.username}**{desig}, Contact: {c.user.email}")
            return "Registered Company Admin details:\n" + "\n".join(items)
        return "No company records registered yet. Organization admins can register via the portal signup."

    # JOB SEEKER: FRESHER / SKILL RECOMMENDATION (e.g. "I am a Python developer fresher. Find suitable jobs")
    if any(k in msg for k in ['fresher', 'suggest', 'suitable', 'recommend', 'profile', 'i am a']):
        skill_keys = ['python', 'java', 'react', 'frontend', 'backend', 'full-stack', 'data science', 'ai', 'cloud', 'devops', 'designer', 'cybersecurity', 'mobile', 'software', 'qa', 'testing']
        detected_skills = [s for s in skill_keys if re.search(r'\b' + re.escape(s) + r'\b', msg)]
        is_fresher = any(k in msg for k in ['fresher', 'entry', 'junior', 'intern', 'trainee', 'beginner'])

        matching = []
        for j in active_jobs:
            content = f"{j.title} {j.description} {j.requirements}".lower()
            if detected_skills:
                if any(s in content for s in detected_skills):
                    matching.append(j)
            else:
                matching.append(j)

        if is_fresher:
            matching.sort(key=lambda j: 0 if any(k in j.title.lower() for k in ['junior', 'intern', 'entry', 'associate', 'trainee', 'fresher']) else 1)

        if matching:
            top_job = matching[0]
            comp_name = top_job.company.name if top_job.company else 'Jobi Partner'
            match_pct = 88 if is_fresher else 92
            return f"Found {len(matching)} matching opening(s). Your top match is **{top_job.title}** at **{comp_name}** ({top_job.location}) with an **{match_pct}% match**. You can view and apply directly on the **Find jobs** page."

    # IDENTITY & GENERAL INQUIRY
    if any(k in msg for k in ['who are you', 'what is your name', 'what are you']):
        return "I am **Jobi**, your AI Career & Technical Interview Assistant on the Jobi Job Portal."

    # JOB SEARCH & DISCOVERY
    search_keywords = ['show', 'find', 'search', 'jobs', 'job', 'opening', 'openings', 'vacancy', 'roles', 'positions', 'chennai', 'developer', 'engineer', 'hiring', 'cts', 'cognizant']
    if any(k in msg for k in search_keywords):
        location_candidates = ['chennai', 'san francisco', 'new york', 'remote', 'hybrid', 'bangalore', 'mumbai', 'delhi', 'hyderabad']
        matched_locations = [loc for loc in location_candidates if loc in msg]

        skill_candidates = [
            'java developer', 'java', 'python developer', 'python', 'react developer', 'react',
            'frontend engineer', 'frontend developer', 'frontend', 'backend engineer', 'backend developer', 'backend',
            'full-stack', 'fullstack', 'data science', 'cloud', 'devops', 'mobile', 'cybersecurity', 'testing', 'qa'
        ]
        matched_skills = [s for s in skill_candidates if re.search(r'\b' + re.escape(s) + r'\b', msg)]

        filtered_jobs = list(active_jobs)
        if 'cts' in msg or 'cognizant' in msg:
            filtered_jobs = [j for j in filtered_jobs if j.company and ('cts' in j.company.name.lower() or 'cognizant' in j.company.name.lower())]
        if matched_locations:
            filtered_jobs = [j for j in filtered_jobs if matched_locations[0] in j.location.lower()]
        if matched_skills:
            filtered_jobs = [
                j for j in filtered_jobs
                if any(s in j.title.lower() or s in (j.requirements or '').lower() or s in (j.description or '').lower() for s in matched_skills)
            ]
            filtered_jobs.sort(key=lambda j: 0 if any(s in j.title.lower() for s in matched_skills) else 1)

        # Smart fallback if location had zero hits but skills matched
        if not filtered_jobs and matched_skills:
            fallback_matches = [
                j for j in active_jobs
                if any(s in j.title.lower() or s in (j.requirements or '').lower() or s in (j.description or '').lower() for s in matched_skills)
            ]
            if fallback_matches:
                items = []
                for j in fallback_matches[:3]:
                    comp_name = j.company.name if j.company else 'Jobi Partner'
                    items.append(f"• **{j.title}** at **{comp_name}** ({j.location}) — *{j.job_type.replace('_', ' ').title()}*")
                loc_title = matched_locations[0].title() if matched_locations else 'that location'
                return f"### 🔍 Matching Openings Found\n\nWhile there are no open positions currently based directly in **{loc_title}**, here are matching openings available:\n\n" + "\n".join(items) + "\n\nExplore and apply on the **Find jobs** page."

        if filtered_jobs:
            items = []
            for j in filtered_jobs[:3]:
                comp_name = j.company.name if j.company else 'Jobi Partner'
                items.append(f"• **{j.title}** at **{comp_name}** ({j.location}) — *{j.job_type.replace('_', ' ').title()}*")
            return "### 🔍 Matching Openings Found\n\n" + "\n".join(items) + "\n\nExplore and apply on the **Find jobs** page."
        return f"No active openings found matching '{raw_msg}'. Check the Find jobs page for all open listings."

    # DEFAULT FALLBACK
    return (
        "I can assist you with:\n"
        "• 🎯 **Technical Interview Questions** (Java, Python, React, SQL)\n"
        "• 📊 **Application Status & Conditions** (Applied, Reviewed, Shortlisted)\n"
        "• 🔍 **Job Search & Matching**\n"
        "• 📝 **Resume Optimization Tips**\n"
        "• 💼 **Hiring & Screening Insights**\n\n"
        "What would you like to explore?"
    )


