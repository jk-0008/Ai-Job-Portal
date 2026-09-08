# Jobi - AI-Powered Job Portal

A full-stack, AI-powered recruitment and job application platform featuring resume analysis and an intelligent assistant powered by Google Gemini AI.

---

## Project Structure

The project is structured with isolated `backend/` and `frontend/` folders:

```text
ai_job_portal/
├── backend/                  # Django REST Framework Backend
│   ├── backend/              # Django Project Settings & Root URL Configuration
│   ├── applications/         # Job Applications & Gemini AI Services (Screening & Chatbot)
│   ├── companies/            # Company Profiles & Management
│   ├── jobs/                 # Job Postings, Filters & Queries
│   ├── users/                # Custom User Model (Recruiter & Job Seeker) & Auth
│   ├── media/                # Uploaded candidate resumes
│   ├── db.sqlite3            # Local Development Database
│   ├── manage.py             # Django Management Utility
│   ├── requirements.txt      # Python Dependencies
│   └── Procfile              # Production Deployment Configuration
│
├── frontend/                 # React + Vite Single Page Application
│   ├── src/
│   │   ├── components/       # UI Components (JobList, JobDetail, RecruiterDashboard, etc.)
│   │   ├── assets/           # Static images and icons
│   │   ├── App.jsx           # Main Router & Application Shell
│   │   ├── api.js            # Axios Client & Interceptors
│   │   └── index.css         # Modern Editorial Styling
│   ├── package.json          # Frontend Dependencies & NPM Scripts
│   └── vite.config.js        # Vite Configuration
│
├── venv/                     # Python Virtual Environment
└── README.md                 # Project Documentation
```

---

## Getting Started

### 1. Backend Setup & Run

1. Open a terminal and navigate to the `backend/` folder:
   ```bash
   cd backend
   ```

2. (Optional) Set your Gemini API key for AI features:
   * **PowerShell**:
     ```powershell
     $env:GEMINI_API_KEY="your-gemini-api-key"
     ```
   * **Command Prompt (CMD)**:
     ```cmd
     set GEMINI_API_KEY=your-gemini-api-key
     ```
   * **Bash**:
     ```bash
     export GEMINI_API_KEY="your-gemini-api-key"
     ```

3. Run the development server:
   ```powershell
   ..\venv\Scripts\python.exe manage.py runserver
   ```
   *(Or activate the virtual environment: `..\venv\Scripts\Activate.ps1` and run `python manage.py runserver`)*

* **API Base URL**: `http://127.0.0.1:8000/api/`
* **Django Admin**: `http://127.0.0.1:8000/admin/`

---

### 2. Frontend Setup & Run

1. Open a second terminal and navigate to the `frontend/` folder:
   ```bash
   cd frontend
   ```

2. Install dependencies (if not already installed):
   ```bash
   npm install
   ```

3. Start Vite development server:
   ```bash
   npm run dev
   ```

* **Frontend Web App**: `http://localhost:5173/`

---

### 3. Demo Accounts & Seeding

To quickly populate the database with sample jobs and accounts:
```powershell
cd backend
..\venv\Scripts\python.exe manage.py seed_data
```

* **Recruiter Account**:
  * Username: `recruiter_sarah`
  * Password: `Recruiter123!`
* **Candidate Account**:
  * Username: `candidate_alex`
  * Password: `AlexPassword123!`
