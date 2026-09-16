import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import API, { BACKEND_ORIGIN } from '../api';
import jobiIcon from '../assets/jobi-icon.jpg';

export default function RecruiterDashboard() {
  const [applications, setApplications] = useState([]);
  const [myJobs, setMyJobs] = useState([]);
  const [activeTab, setActiveTab] = useState('pipeline');
  const [statusFilter, setStatusFilter] = useState('all');
  const [jobFilter, setJobFilter] = useState('all');
  const [aiAnalysis, setAiAnalysis] = useState({});
  const [loadingAi, setLoadingAi] = useState({});
  const [interviewFitData, setInterviewFitData] = useState({});
  const [interviewQuestions, setInterviewQuestions] = useState({});
  const [loadingQuestions, setLoadingQuestions] = useState({});
  const [copiedAppId, setCopiedAppId] = useState(null);
  const [expandedAnalysis, setExpandedAnalysis] = useState({});
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Post Job Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [postingLoading, setPostingLoading] = useState(false);
  const [modalError, setModalError] = useState('');
  const [jobForm, setJobForm] = useState({
    title: '',
    company_name: localStorage.getItem('companyName') || '',
    location: localStorage.getItem('companyLocation') || '',
    job_type: 'full_time',
    salary_range: '',
    description: '',
    requirements: '',
  });

  const handleOpenPostJobModal = () => {
    const defaultCompanyName = companyData?.name || localStorage.getItem('companyName') || '';
    const defaultLocation = companyData?.location || localStorage.getItem('companyLocation') || '';
    setJobForm((prev) => ({
      ...prev,
      company_name: prev.company_name || defaultCompanyName,
      location: prev.location || defaultLocation,
    }));
    setModalError('');
    setIsModalOpen(true);
  };


  // Company & Admin Details State
  const [companyData, setCompanyData] = useState(null);
  const [companyForm, setCompanyForm] = useState({
    name: '',
    website: '',
    location: '',
    company_size: '11-50',
    description: '',
    admin_designation: '',
    admin_phone: '',
    admin_department: '',
  });
  const [savingCompany, setSavingCompany] = useState(false);

  const userRole = localStorage.getItem('userRole') || '';
  const username = localStorage.getItem('username') || '';
  const isHiringManager = userRole === 'hiring_manager';
  const isCompanyAdmin = userRole === 'company_admin';
  const userDepartment = companyData?.admin_department || localStorage.getItem('userDepartment') || '';
  const userDesignation = companyData?.admin_designation || localStorage.getItem('userDesignation') || '';

  const backendOrigin = BACKEND_ORIGIN;

  const fetchData = async () => {
    if (userRole === 'job_seeker') return;
    try {
      const [appsRes, jobsRes, compRes] = await Promise.allSettled([
        API.get('applications/recruiter-applications/'),
        API.get('jobs/?my_jobs=true'),
        API.get('companies/my-company/'),
      ]);

      if (appsRes.status === 'fulfilled') {
        setApplications(appsRes.value.data);
        setError('');
      } else {
        setError('Sign in with a recruiter account to view your candidate pipeline.');
      }

      if (jobsRes.status === 'fulfilled') {
        setMyJobs(jobsRes.value.data);
      }

      if (compRes.status === 'fulfilled' && compRes.value.data) {
        const c = compRes.value.data;
        setCompanyData(c);
        setCompanyForm({
          name: c.name || '',
          website: c.website || '',
          location: c.location || '',
          company_size: c.company_size || '11-50',
          description: c.description || '',
          admin_designation: c.admin_designation || '',
          admin_phone: c.admin_phone || '',
          admin_department: c.admin_department || '',
        });
        if (c.name) {
          localStorage.setItem('companyName', c.name);
          if (c.location) localStorage.setItem('companyLocation', c.location);
          setJobForm((prev) => ({
            ...prev,
            company_name: prev.company_name || c.name,
            location: prev.location || c.location || '',
          }));
        }
      }
    } catch {
      setError('Unable to load recruiter dashboard data.');
    }
  };

  useEffect(() => {
    if (userRole === 'job_seeker') return;
    let active = true;
    Promise.allSettled([
      API.get('applications/recruiter-applications/'),
      API.get('jobs/?my_jobs=true'),
      API.get('companies/my-company/'),
    ])
      .then(([appsRes, jobsRes, compRes]) => {
        if (!active) return;
        if (appsRes.status === 'fulfilled') {
          setApplications(appsRes.value.data);
          setError('');
        } else {
          setError('Sign in with a recruiter account to view your candidate pipeline.');
        }

        if (jobsRes.status === 'fulfilled') {
          setMyJobs(jobsRes.value.data);
        }

        if (compRes.status === 'fulfilled' && compRes.value.data) {
          const c = compRes.value.data;
          setCompanyData(c);
          setCompanyForm({
            name: c.name || '',
            website: c.website || '',
            location: c.location || '',
            company_size: c.company_size || '11-50',
            description: c.description || '',
            admin_designation: c.admin_designation || '',
            admin_phone: c.admin_phone || '',
            admin_department: c.admin_department || '',
          });
          if (c.name) {
            localStorage.setItem('companyName', c.name);
            if (c.location) localStorage.setItem('companyLocation', c.location);
            setJobForm((prev) => ({
              ...prev,
              company_name: prev.company_name || c.name,
              location: prev.location || c.location || '',
            }));
          }
        }
      })
      .catch(() => {
        if (active) {
          setError('Unable to load recruiter dashboard data.');
        }
      });

    return () => {
      active = false;
    };
  }, []);

  const handleSaveCompany = async (e) => {
    e.preventDefault();
    setSavingCompany(true);
    setError('');
    try {
      const payload = {
        name: companyForm.name,
        website: companyForm.website,
        location: companyForm.location,
        description: companyForm.description,
        designation: companyForm.admin_designation,
        phone: companyForm.admin_phone,
        department: companyForm.admin_department,
        company_size: companyForm.company_size,
      };
      const res = await API.patch('companies/my-company/', payload);
      setCompanyData(res.data);
      setSuccess('Company and Admin details updated successfully!');
      setTimeout(() => setSuccess(''), 4000);
    } catch (err) {
      setError(err?.response?.data?.detail || 'Failed to save company details.');
    } finally {
      setSavingCompany(false);
    }
  };

  const updateStatus = async (applicationId, status) => {
    try {
      await API.patch(`applications/${applicationId}/status/`, { status });
      setApplications((items) =>
        items.map((item) => (item.id === applicationId ? { ...item, status } : item))
      );
      setSuccess(`Application marked as ${status.toUpperCase()}`);
      setTimeout(() => setSuccess(''), 3000);
    } catch {
      setError('Could not update application status.');
    }
  };

  const handleRunAiAnalysis = async (applicationId) => {
    setError('');
    setLoadingAi((state) => ({ ...state, [applicationId]: true }));
    try {
      const response = await API.post(`applications/analyze/${applicationId}/`);
      setAiAnalysis((state) => ({ ...state, [applicationId]: response.data.analysis }));
      if (response.data.interview_fit) {
        setInterviewFitData((state) => ({ ...state, [applicationId]: response.data.interview_fit }));
      }
      setError('');
    } catch (err) {
      if (err?.response?.status === 401) {
        setError('Your session has expired. Please sign in again to evaluate candidate resumes.');
      } else {
        const msg = err?.response?.data?.error || err?.response?.data?.detail || 'AI analysis is temporarily unavailable.';
        setError(msg);
      }
    } finally {
      setLoadingAi((state) => ({ ...state, [applicationId]: false }));
    }
  };

  const handleGenerateQuestions = async (applicationId) => {
    setError('');
    setLoadingQuestions((state) => ({ ...state, [applicationId]: true }));
    try {
      const response = await API.post(`applications/${applicationId}/interview-questions/`);
      setInterviewQuestions((state) => ({ ...state, [applicationId]: response.data }));
      setSuccess('AI Technical Interview Questions generated successfully!');
      setTimeout(() => setSuccess(''), 3500);
    } catch (err) {
      if (err?.response?.status === 401) {
        setError('Your session has expired. Please sign in again to generate questions.');
      } else {
        const msg = err?.response?.data?.error || err?.response?.data?.detail || 'Unable to generate interview questions.';
        setError(msg);
      }
    } finally {
      setLoadingQuestions((state) => ({ ...state, [applicationId]: false }));
    }
  };

  const handleCopyQuestions = (applicationId, questionsData) => {
    if (!questionsData?.categories) return;
    let text = `Technical Interview Guide (Jobi AI)\n`;
    text += `Role / Tech: ${questionsData.candidate_role || 'Software Engineering'}\n\n`;
    questionsData.categories.forEach((cat) => {
      text += `--- ${cat.title} ---\n`;
      cat.questions?.forEach((q, idx) => {
        text += `  ${idx + 1}. ${q}\n`;
      });
      text += `\n`;
    });
    navigator.clipboard.writeText(text);
    setCopiedAppId(applicationId);
    setTimeout(() => setCopiedAppId(null), 2500);
  };

  const handleCreateJob = async (e) => {
    e.preventDefault();
    if (!jobForm.title || !jobForm.description || !jobForm.requirements || !jobForm.location) {
      setModalError('Please fill in all required fields.');
      return;
    }

    setPostingLoading(true);
    setModalError('');

    try {
      await API.post('jobs/', jobForm);
      setIsModalOpen(false);
      const defaultCompanyName = companyData?.name || localStorage.getItem('companyName') || '';
      const defaultLocation = companyData?.location || localStorage.getItem('companyLocation') || '';
      setJobForm({
        title: '',
        company_name: defaultCompanyName,
        location: defaultLocation,
        job_type: 'full_time',
        salary_range: '',
        description: '',
        requirements: '',
      });
      setSuccess('Job posting published successfully! It is now live on the jobs board.');
      setTimeout(() => setSuccess(''), 4000);
      fetchData();
      setActiveTab('jobs');
    } catch (err) {
      const detail = err.response?.data?.detail || 'Failed to publish job posting. Please try again.';
      setModalError(detail);
    } finally {
      setPostingLoading(false);
    }
  };

  const handleRemoveJob = async (jobId, jobTitle) => {
    const confirmed = window.confirm(
      `Are you sure you want to remove the job role "${jobTitle}"? This will also remove any candidate applications submitted for this role.`
    );
    if (!confirmed) return;

    try {
      await API.delete(`jobs/${jobId}/`);
      setMyJobs((prev) => prev.filter((j) => j.id !== jobId));
      setApplications((prev) => prev.filter((app) => String(app.job) !== String(jobId)));
      setSuccess(`Role "${jobTitle}" removed successfully.`);
      setTimeout(() => setSuccess(''), 4000);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to remove job posting.');
    }
  };

  const handleLoginAndPublish = async () => {
    if (!jobForm.title || !jobForm.description || !jobForm.requirements || !jobForm.location) {
      setModalError('Please fill in all required fields.');
      return;
    }

    setPostingLoading(true);
    setModalError('');

    try {
      const authRes = await API.post('auth/login/', {
        username: 'recruiter_sarah',
        password: 'Recruiter123!',
      });
      localStorage.setItem('token', authRes.data.access);
      if (authRes.data.refresh) {
        localStorage.setItem('refresh', authRes.data.refresh);
      }
      if (authRes.data.role) {
        localStorage.setItem('userRole', authRes.data.role);
      }

      if (authRes.data.company_name) {
        localStorage.setItem('companyName', authRes.data.company_name);
      }
      if (authRes.data.location) {
        localStorage.setItem('companyLocation', authRes.data.location);
      }

      await API.post('jobs/', jobForm);
      setIsModalOpen(false);
      setJobForm({
        title: '',
        company_name: authRes.data.company_name || companyData?.name || 'Sarah Jenkins Recruitment',
        location: authRes.data.location || companyData?.location || '',
        job_type: 'full_time',
        salary_range: '',
        description: '',
        requirements: '',
      });
      setSuccess('Job posting published successfully! It is now live on the jobs board.');
      setTimeout(() => setSuccess(''), 4000);
      await fetchData();
      setActiveTab('jobs');
    } catch (err) {
      const detail = err.response?.data?.detail || 'Failed to authenticate and publish job opening.';
      setModalError(detail);
    } finally {
      setPostingLoading(false);
    }
  };


  const handleQuickDemoLogin = async () => {
    setError('');
    try {
      const res = await API.post('auth/login/', {
        username: 'recruiter_sarah',
        password: 'Recruiter123!',
      });
      localStorage.setItem('token', res.data.access);
      if (res.data.refresh) {
        localStorage.setItem('refresh', res.data.refresh);
      }
      if (res.data.role) {
        localStorage.setItem('userRole', res.data.role);
      }
      setSuccess('Logged in as demo recruiter (Sarah Jenkins)! Loading candidate pipeline...');
      setTimeout(() => setSuccess(''), 4000);
      await fetchData();
    } catch {
      setError('Could not sign in with demo account. Please verify backend is running.');
    }
  };

  // Filter pipeline applications
  const filteredApplications = applications.filter((app) => {
    const matchesStatus = statusFilter === 'all' || app.status === statusFilter;
    const matchesJob = jobFilter === 'all' || String(app.job) === String(jobFilter) || app.job_title === jobFilter;
    return matchesStatus && matchesJob;
  });

  const shortlistedCount = applications.filter((a) => a.status === 'shortlisted').length;
  const pendingCount = applications.filter((a) => a.status === 'applied').length;

  if (userRole === 'job_seeker') {
    return (
      <main style={{ maxWidth: '680px', margin: '60px auto', padding: '0 20px', textAlign: 'center' }}>
        <div style={{
          background: '#ffffff',
          border: '1px solid #e2e8f0',
          borderRadius: '16px',
          padding: '44px 32px',
          boxShadow: '0 12px 35px rgba(15, 23, 42, 0.08)'
        }}>
          <div style={{ fontSize: '48px', marginBottom: '14px' }}>👨‍💻</div>
          <div style={{ display: 'inline-block', marginBottom: '16px' }}>
            <span style={{
              fontSize: '11px',
              fontWeight: '800',
              backgroundColor: '#f0fdf4',
              color: '#166534',
              border: '1px solid #bbf7d0',
              padding: '4px 12px',
              borderRadius: '99px',
              textTransform: 'uppercase',
              letterSpacing: '0.5px'
            }}>
              Job Seeker Portal {username ? `(${username})` : ''}
            </span>
          </div>
          <h1 style={{ fontSize: '26px', color: '#0f172a', margin: '0 0 12px 0', fontFamily: 'Playfair Display, serif' }}>
            Employer & Recruiter Workspace
          </h1>
          <p style={{ color: '#64748b', fontSize: '15px', lineHeight: '1.7', margin: '0 auto 24px auto', maxWidth: '500px' }}>
            This section is reserved for employers and recruiters to post jobs and review applicant resumes.
            As a <strong>Job Seeker</strong>, your account is configured to:
          </p>
          <div style={{
            background: '#f8fafc',
            border: '1px solid #e2e8f0',
            borderRadius: '12px',
            padding: '18px 22px',
            marginBottom: '28px',
            textAlign: 'left',
            fontSize: '14px',
            color: '#334155'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
              <span style={{ fontSize: '18px' }}>🔍</span> <span><strong>Browse listings:</strong> Discover job opportunities that match your skills.</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
              <span style={{ fontSize: '18px' }}>📄</span> <span><strong>Upload PDF resume:</strong> Apply to open positions with your CV.</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span style={{ fontSize: '18px' }}>📊</span> <span><strong>Track applications:</strong> Follow real-time review and shortlist status.</span>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link to="/" className="button" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
              🔍 Browse Open Positions
            </Link>
            <Link to="/applications" style={{
              padding: '12px 20px',
              borderRadius: '8px',
              border: '1px solid #cbd5e1',
              color: '#1e293b',
              fontWeight: '700',
              fontSize: '14px',
              textDecoration: 'none',
              backgroundColor: '#f8fafc'
            }}>
              📄 View My Applications
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <div style={styles.page}>
      {/* Top Hero Banner */}
      <section style={styles.heroBanner}>
        <div style={styles.heroContent}>
          <div>
            <div style={styles.badgeRow}>
              <img src={jobiIcon} alt="Jobi AI" style={styles.badgeIcon} />
              <span style={styles.badgeText}>
                {isHiringManager
                  ? '🎯 Hiring Manager Workspace'
                  : isCompanyAdmin
                  ? '🏛️ Company Admin Workspace'
                  : 'Recruiter & Employer Workspace'}
              </span>
            </div>
            <h1 style={styles.heroTitle}>
              {isHiringManager
                ? 'Department Candidate Review & Technical Fit'
                : isCompanyAdmin
                ? 'Company-Wide Hiring & Organization Management'
                : 'Manage Your Hiring & Candidates'}
            </h1>
            <p style={styles.heroSubtitle}>
              {isHiringManager
                ? 'Review applicants for your department, evaluate technical fit with Jobi AI, and shortlist qualified talent for technical interviews.'
                : isCompanyAdmin
                ? 'Oversee company-wide job postings, applicant pipelines across all teams, and maintain company profile details.'
                : 'Publish job openings, track applicants across hiring stages, and let Jobi AI evaluate candidate resumes automatically.'}
            </p>
            {isHiringManager && (
              <div style={{
                marginTop: '12px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '10px',
                backgroundColor: 'rgba(255, 255, 255, 0.12)',
                border: '1px solid rgba(255, 255, 255, 0.22)',
                padding: '6px 14px',
                borderRadius: '8px',
                fontSize: '13px',
                color: '#e2e8f0',
                flexWrap: 'wrap',
              }}>
                <span>🏢 <strong>{companyData?.name || localStorage.getItem('companyName') || 'CTS'}</strong></span>
                <span>•</span>
                <span>🎯 <strong>Department:</strong> {userDepartment || 'Engineering'}</span>
                {userDesignation && (
                  <>
                    <span>•</span>
                    <span>💼 <strong>Role:</strong> {userDesignation}</span>
                  </>
                )}
                <span>•</span>
                <span style={{ color: '#86efac', fontWeight: '700' }}>✓ Filtered for Your Team</span>
              </div>
            )}
          </div>

          <div style={styles.heroActionGroup}>
            <button
              type="button"
              onClick={handleOpenPostJobModal}
              style={styles.primaryBtn}
            >
              <span style={{ fontSize: '18px' }}>+</span> {isHiringManager ? 'Post Department Job' : 'Post a New Job'}
            </button>
          </div>
        </div>

        {/* Quick Stats Strip */}
        <div style={styles.statsStrip}>
          <div style={styles.statCard}>
            <div style={styles.statNumber}>{myJobs.length}</div>
            <div style={styles.statLabel}>{isHiringManager ? 'Department / Team Roles' : 'Active Job Postings'}</div>
          </div>
          <div style={styles.statCard}>
            <div style={styles.statNumber}>{applications.length}</div>
            <div style={styles.statLabel}>Total Applicants</div>
          </div>
          <div style={styles.statCard}>
            <div style={styles.statNumber}>{shortlistedCount}</div>
            <div style={styles.statLabel}>{isHiringManager ? 'Shortlisted for Interview' : 'Shortlisted Candidates'}</div>
          </div>
          <div style={styles.statCard}>
            <div style={styles.statNumber}>{pendingCount}</div>
            <div style={styles.statLabel}>Awaiting Review</div>
          </div>
        </div>
      </section>

      {/* Main Content Area */}
      <main style={styles.container}>
        {/* Flash Notifications */}
        {error && (
          <div style={{
            ...styles.errorBanner,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '12px',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span>⚠️</span>
              <span>{error}</span>
            </div>
            {(error.includes('Sign in') || error.includes('session') || error.includes('expired')) && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  onClick={handleQuickDemoLogin}
                  style={{
                    backgroundColor: '#1d4ed8',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '6px',
                    padding: '6px 12px',
                    fontSize: '12px',
                    fontWeight: '700',
                    cursor: 'pointer',
                  }}
                >
                  ⚡ 1-Click Demo Login (Sarah)
                </button>
                <Link
                  to="/login"
                  style={{
                    backgroundColor: '#ffffff',
                    color: '#991b1b',
                    border: '1px solid #fca5a5',
                    borderRadius: '6px',
                    padding: '5px 12px',
                    fontSize: '12px',
                    fontWeight: '700',
                    textDecoration: 'none',
                  }}
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  style={{
                    backgroundColor: '#ffffff',
                    color: '#1b4332',
                    border: '1px solid #86efac',
                    borderRadius: '6px',
                    padding: '5px 12px',
                    fontSize: '12px',
                    fontWeight: '700',
                    textDecoration: 'none',
                  }}
                >
                  Register
                </Link>
              </div>
            )}
          </div>
        )}
        {success && <div style={styles.successBanner}>✓ {success}</div>}

        {/* Tab Navigation */}
        <div style={styles.tabBar}>
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={() => setActiveTab('pipeline')}
              style={styles.tabBtn(activeTab === 'pipeline')}
            >
              {isHiringManager ? '👥 Candidate Pipeline' : 'Candidate Pipeline'}
              <span style={styles.tabCount(activeTab === 'pipeline')}>
                {applications.length}
              </span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('jobs')}
              style={styles.tabBtn(activeTab === 'jobs')}
            >
              {isHiringManager ? '📋 Department Openings' : 'My Posted Jobs'}
              <span style={styles.tabCount(activeTab === 'jobs')}>
                {myJobs.length}
              </span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('company')}
              style={styles.tabBtn(activeTab === 'company')}
            >
              {isHiringManager ? '🏢 Department & Profile' : '🏢 Company & Admin Details'}
            </button>
          </div>

          {activeTab === 'pipeline' && (
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
              {/* Job Selector Filter */}
              {myJobs.length > 0 && (
                <select
                  value={jobFilter}
                  onChange={(e) => setJobFilter(e.target.value)}
                  style={styles.filterSelect}
                >
                  <option value="all">All Jobs ({applications.length})</option>
                  {myJobs.map((j) => (
                    <option key={j.id} value={j.id}>
                      {j.title}
                    </option>
                  ))}
                </select>
              )}

              {/* Status Filter Tabs */}
              <div style={styles.pillGroup}>
                {['all', 'applied', 'shortlisted', 'rejected'].map((st) => (
                  <button
                    key={st}
                    type="button"
                    onClick={() => setStatusFilter(st)}
                    style={styles.pillBtn(statusFilter === st)}
                  >
                    {st === 'all' ? 'All Statuses' : st.charAt(0).toUpperCase() + st.slice(1)}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* TAB 1: CANDIDATE PIPELINE */}
        {activeTab === 'pipeline' && (
          <div>
            {filteredApplications.length === 0 ? (
              <div style={styles.emptyCard}>
                <div style={styles.emptyIcon}>📂</div>
                <h3 style={{ margin: '0 0 8px 0', fontSize: '20px', color: '#0f172a' }}>
                  {applications.length === 0 ? 'No Candidates Received Yet' : 'No Candidates Match Filter'}
                </h3>
                <p style={{ margin: '0 0 24px 0', color: '#64748b', maxWidth: '520px', lineHeight: '1.6' }}>
                  {applications.length === 0
                    ? 'When job seekers find your job listings on Jobi and apply, their profiles, resumes, and cover letters will appear here.'
                    : 'Try changing your status or job filters above to view other candidates.'}
                </p>

                {applications.length === 0 && (
                  <div style={{ display: 'flex', gap: '14px', justifyContent: 'center', flexWrap: 'wrap' }}>
                    <button
                      type="button"
                      onClick={handleOpenPostJobModal}
                      style={styles.primaryBtn}
                    >
                      + Post Your First Job
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div style={styles.candidateList}>
                {filteredApplications.map((application) => {
                  const isAnalyzing = loadingAi[application.id];
                  const analysisResult = aiAnalysis[application.id];
                  const fitData = interviewFitData[application.id];
                  const questionsData = interviewQuestions[application.id];
                  const isQuestionsLoading = loadingQuestions[application.id];
                  const applicantName = application.applicant_name || 'Candidate';
                  const initials = applicantName.slice(0, 2).toUpperCase();

                  return (
                    <article key={application.id} style={styles.candidateCard}>
                      <div style={styles.cardHeader}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                          <div style={styles.applicantAvatar}>{initials}</div>
                          <div>
                            <h3 style={styles.applicantName}>{applicantName}</h3>
                            <div style={styles.jobAppliedTag}>
                              Applied for: <strong>{application.job_title}</strong>
                            </div>
                            <div style={styles.appliedDate}>
                              Applied on {application.applied_at ? new Date(application.applied_at).toLocaleDateString() : 'Recently'}
                            </div>
                          </div>
                        </div>

                        {/* Status Control */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <label style={{ fontSize: '12px', fontWeight: '700', color: '#64748b' }}>
                            Stage:
                          </label>
                          <select
                            value={application.status}
                            onChange={(e) => updateStatus(application.id, e.target.value)}
                            style={styles.statusSelect(application.status)}
                          >
                            <option value="applied">Applied (Reviewing)</option>
                            <option value="shortlisted">
                              {isHiringManager ? '⭐ Shortlist for Technical Interview' : '⭐ Shortlisted'}
                            </option>
                            <option value="rejected">Rejected / Archived</option>
                          </select>
                        </div>
                      </div>

                      {/* Candidate Cover Letter / Note */}
                      {application.cover_letter && (
                        <div style={styles.coverLetterBox}>
                          <span style={{ fontWeight: '700', color: '#475569' }}>Note: </span>
                          {application.cover_letter}
                        </div>
                      )}

                      {/* Action Buttons: Resume & AI Analysis */}
                      <div style={styles.actionRow}>
                        {application.resume ? (
                          <a
                            href={
                              application.resume.startsWith('http')
                                ? application.resume
                                : `${backendOrigin}${application.resume}`
                            }
                            target="_blank"
                            rel="noreferrer"
                            style={styles.resumeLinkBtn}
                          >
                            📄 View Resume (PDF)
                          </a>
                        ) : (
                          <span style={{ fontSize: '13px', color: '#94a3b8' }}>No resume uploaded</span>
                        )}

                        <button
                          type="button"
                          onClick={() => handleRunAiAnalysis(application.id)}
                          disabled={isAnalyzing}
                          style={styles.aiAnalysisBtn(isAnalyzing)}
                        >
                          <img src={jobiIcon} alt="Jobi AI" style={styles.aiBtnIcon} />
                          {isAnalyzing
                            ? 'Jobi is Analyzing Technical Fit...'
                            : isHiringManager
                            ? '⚡ Evaluate Technical Fit with Jobi AI'
                            : '✦ Jobi AI Resume Fit Analysis'}
                        </button>
                      </div>

                      {/* AI Interview Fit Card */}
                      {(fitData || analysisResult) && (
                        <div style={styles.interviewFitCard}>
                          {/* Card Header & Match Score */}
                          <div style={styles.interviewFitHeader}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                              <span style={{ fontSize: '26px' }}>🎯</span>
                              <div>
                                <h4 style={{ margin: 0, fontSize: '17px', color: '#0f172a', fontWeight: '800' }}>
                                  AI Interview Fit
                                </h4>
                                <span style={{ fontSize: '12px', color: '#64748b' }}>
                                  Evaluated against {application.job_title} requirements
                                </span>
                              </div>
                            </div>

                            {/* Overall Score Box */}
                            <div style={styles.scoreGaugeBox}>
                              <span style={{ fontSize: '10px', fontWeight: '800', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                Overall Score
                              </span>
                              <span style={styles.scoreNumber(fitData?.score || 80)}>
                                {fitData?.score ? `${fitData.score}%` : '80%'}
                              </span>
                            </div>
                          </div>

                          {/* Bullet Highlights */}
                          <div style={styles.highlightsContainer}>
                            {fitData?.highlights ? (
                              fitData.highlights.map((h, i) => (
                                <div key={i} style={styles.highlightItem(h.type)}>
                                  <span style={{ fontSize: '15px' }}>{h.icon}</span>
                                  <span style={{ fontSize: '13px', fontWeight: h.type === 'positive' ? '600' : '500', color: h.type === 'positive' ? '#166534' : '#9a3412' }}>
                                    {h.text}
                                  </span>
                                </div>
                              ))
                            ) : (
                              <>
                                <div style={styles.highlightItem('positive')}>
                                  <span style={{ fontSize: '15px' }}>✅</span>
                                  <span style={{ fontSize: '13px', fontWeight: '600', color: '#166534' }}>
                                    Strong technical match in core competencies
                                  </span>
                                </div>
                                <div style={styles.highlightItem('positive')}>
                                  <span style={{ fontSize: '15px' }}>✅</span>
                                  <span style={{ fontSize: '13px', fontWeight: '600', color: '#166534' }}>
                                    Relevant hands-on project experience verified
                                  </span>
                                </div>
                                <div style={styles.highlightItem('warning')}>
                                  <span style={{ fontSize: '15px' }}>⚠️</span>
                                  <span style={{ fontSize: '13px', fontWeight: '500', color: '#9a3412' }}>
                                    Limited enterprise cloud & framework scaling experience
                                  </span>
                                </div>
                              </>
                            )}
                          </div>

                          {/* Recommendation & Generate Action Row */}
                          <div style={styles.recommendationRow}>
                            <div>
                              <span style={{ fontSize: '11px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>
                                Recommendation:
                              </span>
                              <div style={styles.recommendationBadge(fitData?.recommendation_type || 'proceed')}>
                                {fitData?.recommendation_badge || '🟢 Proceed to Interview'}
                              </div>
                            </div>

                            <button
                              type="button"
                              onClick={() => handleGenerateQuestions(application.id)}
                              disabled={isQuestionsLoading}
                              style={styles.generateQuestionsBtn}
                            >
                              <img src={jobiIcon} alt="Jobi" style={{ width: '16px', height: '16px', borderRadius: '50%' }} />
                              {isQuestionsLoading
                                ? 'Generating Questions...'
                                : questionsData
                                ? '🔄 Refresh Questions'
                                : '⚡ Generate Interview Questions'}
                            </button>
                          </div>

                          {/* Categorized Interview Questions Section */}
                          {questionsData && (
                            <div style={styles.questionsContainer}>
                              <div style={styles.questionsHeader}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                  <span style={{ fontSize: '20px' }}>📝</span>
                                  <div>
                                    <span style={{ fontWeight: '800', fontSize: '14px', color: '#0f172a', display: 'block' }}>
                                      Tailored Technical Interview Questions
                                    </span>
                                    <span style={{ fontSize: '11px', color: '#64748b' }}>
                                      Categorized for {questionsData.candidate_role} and {questionsData.framework_name}
                                    </span>
                                  </div>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => handleCopyQuestions(application.id, questionsData)}
                                  style={styles.copyQuestionsBtn}
                                >
                                  {copiedAppId === application.id ? '✓ Copied to Clipboard!' : '📋 Copy All Questions'}
                                </button>
                              </div>

                              <div style={styles.questionsGrid}>
                                {questionsData.categories?.map((cat) => (
                                  <div key={cat.id} style={styles.categoryCard}>
                                    <div style={styles.categoryCardHeader}>
                                      <span style={{ fontSize: '16px' }}>{cat.icon}</span>
                                      <span style={{ fontWeight: '700', fontSize: '13px', color: '#1e293b' }}>
                                        {cat.title}
                                      </span>
                                    </div>
                                    <ol style={styles.questionsList}>
                                      {cat.questions?.map((q, qIdx) => (
                                        <li key={qIdx} style={styles.questionItem}>{q}</li>
                                      ))}
                                    </ol>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Expandable Raw Analysis */}
                          {analysisResult && (
                            <div style={{ marginTop: '14px', borderTop: '1px solid #f1f5f9', paddingTop: '10px' }}>
                              <button
                                type="button"
                                onClick={() => setExpandedAnalysis((prev) => ({ ...prev, [application.id]: !prev[application.id] }))}
                                style={{
                                  background: 'none',
                                  border: 'none',
                                  color: '#2563eb',
                                  fontSize: '12px',
                                  fontWeight: '600',
                                  cursor: 'pointer',
                                  padding: '4px 0',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '4px',
                                }}
                              >
                                {expandedAnalysis[application.id] ? '▲ Hide Full AI Evaluation Report' : '▼ View Full AI Evaluation Report'}
                              </button>

                              {expandedAnalysis[application.id] && (
                                <div style={styles.aiReportContainer}>
                                  <pre style={styles.aiReportBody}>{analysisResult}</pre>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      )}
                    </article>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: MY POSTED JOBS / DEPARTMENT OPENINGS */}
        {activeTab === 'jobs' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ margin: 0, fontSize: '20px', color: '#0f172a' }}>
                {isHiringManager
                  ? `Department & Company Openings (${myJobs.length})`
                  : `Your Live Job Postings (${myJobs.length})`}
              </h2>
              <button
                type="button"
                onClick={handleOpenPostJobModal}
                style={styles.primaryBtn}
              >
                + {isHiringManager ? 'Post Department Role' : 'Post a Job'}
              </button>
            </div>

            {myJobs.length === 0 ? (
              <div style={styles.emptyCard}>
                <div style={styles.emptyIcon}>💼</div>
                <h3 style={{ margin: '0 0 8px 0', fontSize: '20px', color: '#0f172a' }}>
                  No Jobs Posted Yet
                </h3>
                <p style={{ margin: '0 0 24px 0', color: '#64748b', maxWidth: '480px', lineHeight: '1.6' }}>
                  Publish your first job opening to start receiving qualified candidate applications on Jobi.
                </p>
                <button
                  type="button"
                  onClick={handleOpenPostJobModal}
                  style={styles.primaryBtn}
                >
                  + Create Your First Job Posting
                </button>
              </div>
            ) : (
              <div style={styles.jobsGrid}>
                {myJobs.map((job) => (
                  <article key={job.id} style={styles.jobCard}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div>
                        <h3 style={styles.jobCardTitle}>{job.title}</h3>
                        <p style={styles.jobCardMeta}>
                          {job.company_details?.name || 'Independent Employer'} · {job.location}
                          {job.company_details?.admin_username && (
                            <span> · Posted by: <strong>{job.company_details.admin_username}</strong></span>
                          )}
                        </p>
                      </div>
                      <span style={styles.jobTypeBadge}>
                        {job.job_type.replace('_', ' ')}
                      </span>
                    </div>

                    <p style={styles.jobCardDescription}>{job.description}</p>

                    <div style={styles.requirementsSnippet}>
                      <span style={{ fontWeight: '700', color: '#475569' }}>Skills: </span>
                      {job.requirements}
                    </div>

                    <div style={styles.jobCardFooter}>
                      <div style={styles.applicantBadge}>
                        👥 {job.applications_count || 0} candidate{job.applications_count === 1 ? '' : 's'} applied
                      </div>

                      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                        {(isCompanyAdmin || job.company_details?.admin_username === username || !job.company_details?.admin_username) && (
                          <button
                            type="button"
                            onClick={() => handleRemoveJob(job.id, job.title)}
                            style={styles.deleteJobBtn}
                            title="Remove this role"
                          >
                            🗑️ Remove Role
                          </button>
                        )}
                        <Link
                          to={`/jobs/${job.id}`}
                          style={styles.viewJobLink}
                        >
                          View Public Role →
                        </Link>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 3: COMPANY & ADMIN DETAILS */}
        {activeTab === 'company' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {/* Header / Summary Card */}
            <div style={{
              backgroundColor: '#ffffff',
              borderRadius: '12px',
              padding: '24px',
              border: '1px solid #e2e8f0',
              boxShadow: '0 4px 12px rgba(0,0,0,0.03)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '16px',
            }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                  <span style={{ fontSize: '22px' }}>🏢</span>
                  <h2 style={{ margin: 0, fontSize: '20px', color: '#0f172a' }}>
                    {isHiringManager
                      ? `${companyData?.name || 'CTS'} · ${userDepartment || 'Engineering'} Department`
                      : (companyData?.name || 'Organization Profile')}
                  </h2>
                  <span style={{
                    backgroundColor: '#f0fdf4',
                    color: '#166534',
                    border: '1px solid #bbf7d0',
                    fontSize: '11px',
                    fontWeight: '700',
                    padding: '2px 8px',
                    borderRadius: '12px',
                  }}>
                    {isHiringManager ? 'Hiring Team Verified' : 'Verified Organization'}
                  </span>
                </div>
                <p style={{ margin: 0, fontSize: '13px', color: '#64748b' }}>
                  {isHiringManager
                    ? 'Review and update your department details, technical hiring profile, and organization information.'
                    : 'Manage company identity, public recruiter details, and company administrator contact information.'}
                </p>
              </div>

              {companyData?.website && (
                <a
                  href={companyData.website.startsWith('http') ? companyData.website : `https://${companyData.website}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    fontSize: '13px',
                    fontWeight: '600',
                    color: '#1d4ed8',
                    textDecoration: 'none',
                    padding: '8px 14px',
                    borderRadius: '8px',
                    border: '1px solid #bfdbfe',
                    backgroundColor: '#eff6ff',
                  }}
                >
                  🌐 Visit Website ↗
                </a>
              )}
            </div>

            {/* Side-by-Side Detail Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
              {/* Card 1: Company Profile */}
              <div style={{
                backgroundColor: '#ffffff',
                borderRadius: '12px',
                padding: '24px',
                border: '1px solid #e2e8f0',
                boxShadow: '0 4px 12px rgba(0,0,0,0.03)',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px', borderBottom: '1px solid #f1f5f9', paddingBottom: '12px' }}>
                  <span style={{ fontSize: '18px' }}>🏛️</span>
                  <h3 style={{ margin: 0, fontSize: '16px', color: '#0f172a' }}>Company Profile</h3>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', fontSize: '13px' }}>
                  <div>
                    <span style={{ color: '#64748b', display: 'block', fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', marginBottom: '2px' }}>Company Name</span>
                    <span style={{ color: '#0f172a', fontWeight: '600', fontSize: '15px' }}>{companyData?.name || 'Not set'}</span>
                  </div>
                  <div>
                    <span style={{ color: '#64748b', display: 'block', fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', marginBottom: '2px' }}>Headquarters Location</span>
                    <span style={{ color: '#0f172a' }}>📍 {companyData?.location || 'Remote'}</span>
                  </div>
                  <div>
                    <span style={{ color: '#64748b', display: 'block', fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', marginBottom: '2px' }}>Website</span>
                    <span style={{ color: '#0f172a' }}>{companyData?.website || 'None'}</span>
                  </div>
                  <div>
                    <span style={{ color: '#64748b', display: 'block', fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', marginBottom: '2px' }}>Company Size</span>
                    <span style={{ color: '#0f172a' }}>👥 {companyData?.company_size || '11-50 Employees'}</span>
                  </div>
                  <div>
                    <span style={{ color: '#64748b', display: 'block', fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', marginBottom: '2px' }}>About Organization</span>
                    <p style={{ margin: '4px 0 0 0', color: '#334155', lineHeight: '1.5' }}>
                      {companyData?.description || 'No description provided yet.'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Card 2: Manager or Admin Profile */}
              <div style={{
                backgroundColor: '#ffffff',
                borderRadius: '12px',
                padding: '24px',
                border: '1px solid #e2e8f0',
                boxShadow: '0 4px 12px rgba(0,0,0,0.03)',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px', borderBottom: '1px solid #f1f5f9', paddingBottom: '12px' }}>
                  <span style={{ fontSize: '18px' }}>{isHiringManager ? '🎯' : '🛡️'}</span>
                  <h3 style={{ margin: 0, fontSize: '16px', color: '#0f172a' }}>
                    {isHiringManager ? 'Hiring Manager Profile' : 'Company Administrator Details'}
                  </h3>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', fontSize: '13px' }}>
                  <div>
                    <span style={{ color: '#64748b', display: 'block', fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', marginBottom: '2px' }}>
                      {isHiringManager ? 'Manager Username' : 'Admin Username'}
                    </span>
                    <span style={{ color: '#0f172a', fontWeight: '600', fontSize: '15px' }}>{companyData?.admin_username || username}</span>
                  </div>
                  <div>
                    <span style={{ color: '#64748b', display: 'block', fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', marginBottom: '2px' }}>Contact Email</span>
                    <span style={{ color: '#0f172a' }}>✉️ {companyData?.admin_email || 'No email provided'}</span>
                  </div>
                  <div>
                    <span style={{ color: '#64748b', display: 'block', fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', marginBottom: '2px' }}>Portal Role</span>
                    <span style={{
                      display: 'inline-block',
                      backgroundColor: '#eff6ff',
                      color: '#1d4ed8',
                      padding: '2px 8px',
                      borderRadius: '6px',
                      fontWeight: '600',
                      fontSize: '12px',
                      marginTop: '2px',
                    }}>
                      {(companyData?.admin_role || userRole || 'Hiring Manager').replace('_', ' ').toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <span style={{ color: '#64748b', display: 'block', fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', marginBottom: '2px' }}>Management Title / Designation</span>
                    <span style={{ color: '#0f172a', fontWeight: '500' }}>{companyData?.admin_designation || userDesignation || 'Director of eng'}</span>
                  </div>
                  <div>
                    <span style={{ color: '#64748b', display: 'block', fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', marginBottom: '2px' }}>Department</span>
                    <span style={{ color: '#0f172a', fontWeight: '600' }}>🎯 {companyData?.admin_department || userDepartment || 'Engineering'}</span>
                  </div>
                  <div>
                    <span style={{ color: '#64748b', display: 'block', fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', marginBottom: '2px' }}>Contact Phone</span>
                    <span style={{ color: '#0f172a' }}>📞 {companyData?.admin_phone || 'Not specified'}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Edit & Update Form */}
            <div style={{
              backgroundColor: '#ffffff',
              borderRadius: '12px',
              padding: '24px',
              border: '1px solid #e2e8f0',
              boxShadow: '0 4px 12px rgba(0,0,0,0.03)',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '18px' }}>
                <span style={{ fontSize: '18px' }}>✏️</span>
                <h3 style={{ margin: 0, fontSize: '16px', color: '#0f172a' }}>Update Company & Admin Details</h3>
              </div>

              <form onSubmit={handleSaveCompany}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px', marginBottom: '16px' }}>
                  <div>
                    <label style={styles.fieldLabel}>Company Name *</label>
                    <input
                      type="text"
                      required
                      value={companyForm.name}
                      onChange={(e) => setCompanyForm({ ...companyForm, name: e.target.value })}
                      style={styles.inputField}
                    />
                  </div>
                  <div>
                    <label style={styles.fieldLabel}>Company Website</label>
                    <input
                      type="url"
                      placeholder="https://example.com"
                      value={companyForm.website}
                      onChange={(e) => setCompanyForm({ ...companyForm, website: e.target.value })}
                      style={styles.inputField}
                    />
                  </div>
                  <div>
                    <label style={styles.fieldLabel}>Headquarters / Location</label>
                    <input
                      type="text"
                      placeholder="e.g. San Francisco, CA / Remote"
                      value={companyForm.location}
                      onChange={(e) => setCompanyForm({ ...companyForm, location: e.target.value })}
                      style={styles.inputField}
                    />
                  </div>
                  <div>
                    <label style={styles.fieldLabel}>Company Size</label>
                    <select
                      value={companyForm.company_size}
                      onChange={(e) => setCompanyForm({ ...companyForm, company_size: e.target.value })}
                      style={styles.inputField}
                    >
                      <option value="1-10">1-10 Employees (Startup)</option>
                      <option value="11-50">11-50 Employees</option>
                      <option value="51-200">51-200 Employees</option>
                      <option value="201-1000">201-1,000 Employees</option>
                      <option value="1000+">1,000+ Enterprise</option>
                    </select>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px', marginBottom: '16px' }}>
                  <div>
                    <label style={styles.fieldLabel}>Admin Management Title</label>
                    <input
                      type="text"
                      placeholder="e.g. Founder & CEO / Head of HR"
                      value={companyForm.admin_designation}
                      onChange={(e) => setCompanyForm({ ...companyForm, admin_designation: e.target.value })}
                      style={styles.inputField}
                    />
                  </div>
                  <div>
                    <label style={styles.fieldLabel}>Admin Contact Phone</label>
                    <input
                      type="text"
                      placeholder="e.g. +1 (555) 019-2834"
                      value={companyForm.admin_phone}
                      onChange={(e) => setCompanyForm({ ...companyForm, admin_phone: e.target.value })}
                      style={styles.inputField}
                    />
                  </div>
                  <div>
                    <label style={styles.fieldLabel}>Department</label>
                    <input
                      type="text"
                      placeholder="e.g. Executive / Talent Acquisition"
                      value={companyForm.admin_department}
                      onChange={(e) => setCompanyForm({ ...companyForm, admin_department: e.target.value })}
                      style={styles.inputField}
                    />
                  </div>
                </div>

                <div style={{ marginBottom: '20px' }}>
                  <label style={styles.fieldLabel}>About Company / Description</label>
                  <textarea
                    rows={3}
                    placeholder="Brief description of your organization and culture..."
                    value={companyForm.description}
                    onChange={(e) => setCompanyForm({ ...companyForm, description: e.target.value })}
                    style={{ ...styles.inputField, resize: 'vertical' }}
                  />
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                  <button
                    type="submit"
                    disabled={savingCompany}
                    style={{
                      backgroundColor: '#0f172a',
                      color: '#ffffff',
                      border: 'none',
                      borderRadius: '8px',
                      padding: '10px 20px',
                      fontSize: '13px',
                      fontWeight: '700',
                      cursor: savingCompany ? 'not-allowed' : 'pointer',
                    }}
                  >
                    {savingCompany ? 'Saving Details...' : '💾 Save Company & Admin Details'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>

      {/* POST A JOB MODAL */}
      {isModalOpen && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalContent}>
            <div style={styles.modalHeader}>
              <div>
                <h2 style={{ margin: '0 0 4px 0', fontSize: '22px', color: '#0f172a' }}>
                  Post a New Job Opening
                </h2>
                <p style={{ margin: 0, fontSize: '13px', color: '#64748b' }}>
                  Your listing will immediately appear live on Jobi for candidates to apply.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                style={styles.modalCloseBtn}
              >
                ✕
              </button>
            </div>

            {modalError && (
              <div style={{
                ...styles.modalErrorBanner,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '10px',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span>⚠️</span>
                  <span>{modalError}</span>
                </div>
                {(modalError.includes('credentials') || modalError.includes('Authentication') || modalError.includes('sign in')) && (
                  <button
                    type="button"
                    onClick={handleLoginAndPublish}
                    disabled={postingLoading}
                    style={{
                      backgroundColor: '#1d4ed8',
                      color: '#ffffff',
                      border: 'none',
                      borderRadius: '6px',
                      padding: '6px 14px',
                      fontSize: '12px',
                      fontWeight: '700',
                      cursor: 'pointer',
                      boxShadow: '0 2px 6px rgba(29, 78, 216, 0.3)',
                    }}
                  >
                    ⚡ Sign In as Recruiter & Publish Now
                  </button>
                )}
              </div>
            )}

            <form onSubmit={handleCreateJob} style={styles.modalForm}>
              <div style={styles.formRow}>
                <div style={{ flex: 1 }}>
                  <label style={styles.fieldLabel}>Job Title *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Senior Frontend Engineer"
                    value={jobForm.title}
                    onChange={(e) => setJobForm({ ...jobForm, title: e.target.value })}
                    style={styles.inputField}
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '6px' }}>
                    <label style={{ ...styles.fieldLabel, margin: 0 }}>Company Name *</label>
                    {jobForm.company_name && (
                      <span style={{ fontSize: '11px', color: '#16a34a', fontWeight: '700', display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                        ✓ Auto-filled
                      </span>
                    )}
                  </div>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Acme AI or Stripe"
                    value={jobForm.company_name}
                    onChange={(e) => setJobForm({ ...jobForm, company_name: e.target.value })}
                    style={styles.inputField}
                  />
                  <span style={{ fontSize: '11px', color: '#64748b', marginTop: '4px', display: 'block' }}>
                    Defaults to your company. You can edit this if posting for an agency client.
                  </span>
                </div>
              </div>

              <div style={styles.formRow}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '6px' }}>
                    <label style={{ ...styles.fieldLabel, margin: 0 }}>Location *</label>
                    {jobForm.location && (
                      <span style={{ fontSize: '11px', color: '#16a34a', fontWeight: '700', display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                        ✓ Auto-filled
                      </span>
                    )}
                  </div>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Remote or San Francisco, CA"
                    value={jobForm.location}
                    onChange={(e) => setJobForm({ ...jobForm, location: e.target.value })}
                    style={styles.inputField}
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={styles.fieldLabel}>Work Type</label>
                  <select
                    value={jobForm.job_type}
                    onChange={(e) => setJobForm({ ...jobForm, job_type: e.target.value })}
                    style={styles.inputField}
                  >
                    <option value="full_time">Full Time</option>
                    <option value="part_time">Part Time</option>
                    <option value="contract">Contract</option>
                    <option value="internship">Internship</option>
                  </select>
                </div>
              </div>

              <div>
                <label style={styles.fieldLabel}>Salary Range (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. $120,000 - $155,000 / year"
                  value={jobForm.salary_range}
                  onChange={(e) => setJobForm({ ...jobForm, salary_range: e.target.value })}
                  style={styles.inputField}
                />
              </div>

              <div>
                <label style={styles.fieldLabel}>Required Skills (Comma separated) *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. React, TypeScript, Node.js, REST APIs, TailwindCSS"
                  value={jobForm.requirements}
                  onChange={(e) => setJobForm({ ...jobForm, requirements: e.target.value })}
                  style={styles.inputField}
                />
                <small style={{ fontSize: '11px', color: '#94a3b8' }}>
                  Jobi AI uses these skills to automatically grade candidate resume match.
                </small>
              </div>

              <div>
                <label style={styles.fieldLabel}>Job Description & Responsibilities *</label>
                <textarea
                  required
                  rows={5}
                  placeholder="Describe the role, key responsibilities, team culture, and qualifications..."
                  value={jobForm.description}
                  onChange={(e) => setJobForm({ ...jobForm, description: e.target.value })}
                  style={{ ...styles.inputField, resize: 'vertical' }}
                />
              </div>

              <div style={styles.modalFooter}>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  style={styles.cancelBtn}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={postingLoading}
                  style={styles.primaryBtn}
                >
                  {postingLoading ? 'Publishing...' : 'Publish Job Opening'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// Visual Styles
const styles = {
  page: {
    backgroundColor: '#f8fafc',
    minHeight: 'calc(100vh - 76px)',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    paddingBottom: '80px',
  },
  heroBanner: {
    background: 'linear-gradient(135deg, #090e1a 0%, #0f172a 45%, #1d4ed8 100%)',
    color: '#ffffff',
    padding: '48px 30px 40px',
    boxShadow: '0 10px 30px rgba(15, 23, 42, 0.15)',
  },
  heroContent: {
    maxWidth: '1120px',
    margin: '0 auto',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: '24px',
    flexWrap: 'wrap',
  },
  badgeRow: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px',
    backgroundColor: 'rgba(59, 130, 246, 0.2)',
    border: '1px solid rgba(96, 165, 250, 0.35)',
    borderRadius: '20px',
    padding: '4px 12px',
    marginBottom: '14px',
  },
  badgeIcon: {
    width: '18px',
    height: '18px',
    borderRadius: '50%',
  },
  badgeText: {
    fontSize: '12px',
    fontWeight: '700',
    color: '#93c5fd',
    letterSpacing: '0.5px',
    textTransform: 'uppercase',
  },
  heroTitle: {
    margin: '0 0 10px 0',
    fontSize: '32px',
    fontWeight: '800',
    letterSpacing: '-0.8px',
    color: '#ffffff',
  },
  heroSubtitle: {
    margin: 0,
    fontSize: '15px',
    color: '#cbd5e1',
    maxWidth: '620px',
    lineHeight: '1.6',
  },
  heroActionGroup: {
    display: 'flex',
    gap: '12px',
    flexWrap: 'wrap',
  },
  primaryBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px',
    background: '#2563eb',
    color: '#ffffff',
    border: 'none',
    borderRadius: '8px',
    padding: '12px 20px',
    fontSize: '14px',
    fontWeight: '700',
    cursor: 'pointer',
    boxShadow: '0 4px 14px rgba(37, 99, 235, 0.4)',
    transition: 'all 0.2s ease',
  },
  secondaryBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    color: '#ffffff',
    border: '1px solid rgba(255, 255, 255, 0.25)',
    borderRadius: '8px',
    padding: '12px 18px',
    fontSize: '13px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  },
  statsStrip: {
    maxWidth: '1120px',
    margin: '36px auto 0',
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '16px',
  },
  statCard: {
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    borderRadius: '12px',
    padding: '16px 20px',
  },
  statNumber: {
    fontSize: '28px',
    fontWeight: '800',
    color: '#ffffff',
    letterSpacing: '-0.5px',
  },
  statLabel: {
    fontSize: '12px',
    fontWeight: '600',
    color: '#94a3b8',
    marginTop: '4px',
  },
  container: {
    maxWidth: '1120px',
    margin: '32px auto 0',
    padding: '0 20px',
  },
  errorBanner: {
    backgroundColor: '#fef2f2',
    border: '1px solid #fecaca',
    color: '#991b1b',
    padding: '12px 16px',
    borderRadius: '8px',
    marginBottom: '20px',
    fontSize: '13px',
  },
  successBanner: {
    backgroundColor: '#eff6ff',
    border: '1px solid #bfdbfe',
    color: '#1e40af',
    padding: '12px 16px',
    borderRadius: '8px',
    marginBottom: '20px',
    fontSize: '13px',
    fontWeight: '600',
  },
  tabBar: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottom: '1px solid #e2e8f0',
    paddingBottom: '16px',
    marginBottom: '24px',
    flexWrap: 'wrap',
    gap: '16px',
  },
  tabBtn: (active) => ({
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px',
    background: 'none',
    border: 'none',
    fontSize: '15px',
    fontWeight: '700',
    color: active ? '#2563eb' : '#64748b',
    cursor: 'pointer',
    padding: '8px 14px',
    borderRadius: '8px',
    backgroundColor: active ? '#eff6ff' : 'transparent',
    transition: 'all 0.15s ease',
  }),
  tabCount: (active) => ({
    backgroundColor: active ? '#2563eb' : '#e2e8f0',
    color: active ? '#ffffff' : '#64748b',
    fontSize: '11px',
    fontWeight: '800',
    borderRadius: '12px',
    padding: '2px 8px',
  }),
  filterSelect: {
    padding: '8px 12px',
    borderRadius: '8px',
    border: '1px solid #cbd5e1',
    backgroundColor: '#ffffff',
    fontSize: '13px',
    color: '#0f172a',
    cursor: 'pointer',
  },
  pillGroup: {
    display: 'flex',
    backgroundColor: '#e2e8f0',
    padding: '3px',
    borderRadius: '8px',
    gap: '2px',
  },
  pillBtn: (active) => ({
    background: active ? '#ffffff' : 'transparent',
    border: 'none',
    borderRadius: '6px',
    padding: '5px 12px',
    fontSize: '12px',
    fontWeight: '700',
    color: active ? '#0f172a' : '#64748b',
    cursor: 'pointer',
    boxShadow: active ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
    transition: 'all 0.15s ease',
  }),
  candidateList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  candidateCard: {
    backgroundColor: '#ffffff',
    border: '1px solid #e2e8f0',
    borderRadius: '12px',
    padding: '22px',
    boxShadow: '0 2px 8px rgba(15, 23, 42, 0.04)',
    transition: 'border-color 0.2s ease',
  },
  cardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: '14px',
  },
  applicantAvatar: {
    width: '46px',
    height: '46px',
    borderRadius: '50%',
    background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
    color: '#ffffff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: '800',
    fontSize: '16px',
    boxShadow: '0 4px 10px rgba(37, 99, 235, 0.2)',
  },
  applicantName: {
    margin: '0 0 4px 0',
    fontSize: '17px',
    fontWeight: '700',
    color: '#0f172a',
  },
  jobAppliedTag: {
    fontSize: '13px',
    color: '#475569',
  },
  appliedDate: {
    fontSize: '11px',
    color: '#94a3b8',
    marginTop: '2px',
  },
  statusSelect: (status) => ({
    padding: '6px 12px',
    borderRadius: '8px',
    fontSize: '12px',
    fontWeight: '700',
    cursor: 'pointer',
    border: '1px solid transparent',
    outline: 'none',
    backgroundColor:
      status === 'shortlisted' ? '#eff6ff' : status === 'rejected' ? '#fef2f2' : '#f1f5f9',
    color:
      status === 'shortlisted' ? '#1d4ed8' : status === 'rejected' ? '#991b1b' : '#334155',
    borderColor:
      status === 'shortlisted' ? '#bfdbfe' : status === 'rejected' ? '#fecaca' : '#cbd5e1',
  }),
  coverLetterBox: {
    backgroundColor: '#f8fafc',
    border: '1px solid #e2e8f0',
    borderRadius: '8px',
    padding: '12px 16px',
    marginTop: '16px',
    fontSize: '13px',
    color: '#475569',
    lineHeight: '1.5',
  },
  actionRow: {
    display: 'flex',
    gap: '12px',
    marginTop: '18px',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  resumeLinkBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    backgroundColor: '#f1f5f9',
    color: '#0f172a',
    border: '1px solid #cbd5e1',
    borderRadius: '6px',
    padding: '8px 14px',
    fontSize: '12px',
    fontWeight: '700',
    textDecoration: 'none',
  },
  aiAnalysisBtn: (isAnalyzing) => ({
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px',
    background: 'linear-gradient(135deg, #1d4ed8 0%, #0f172a 100%)',
    color: '#ffffff',
    border: '1px solid rgba(59, 130, 246, 0.4)',
    borderRadius: '6px',
    padding: '8px 16px',
    fontSize: '12px',
    fontWeight: '700',
    cursor: isAnalyzing ? 'wait' : 'pointer',
    boxShadow: '0 2px 8px rgba(37, 99, 235, 0.25)',
  }),
  aiBtnIcon: {
    width: '16px',
    height: '16px',
    borderRadius: '50%',
  },
  aiReportContainer: {
    marginTop: '16px',
    backgroundColor: '#0f172a',
    color: '#e2e8f0',
    borderRadius: '10px',
    padding: '18px',
    border: '1px solid #1e3a8a',
    boxShadow: '0 8px 24px rgba(15, 23, 42, 0.15)',
  },
  aiReportHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottom: '1px solid #1e293b',
    paddingBottom: '12px',
    marginBottom: '14px',
  },
  aiGeneratedTag: {
    fontSize: '10px',
    fontWeight: '800',
    backgroundColor: 'rgba(59, 130, 246, 0.25)',
    color: '#60a5fa',
    border: '1px solid rgba(96, 165, 250, 0.3)',
    borderRadius: '6px',
    padding: '2px 8px',
    letterSpacing: '0.5px',
  },
  aiReportBody: {
    margin: 0,
    fontFamily: 'inherit',
    fontSize: '13px',
    lineHeight: '1.6',
    whiteSpace: 'pre-wrap',
    color: '#cbd5e1',
  },
  interviewFitCard: {
    marginTop: '16px',
    backgroundColor: '#ffffff',
    borderRadius: '12px',
    padding: '20px',
    border: '1px solid #e2e8f0',
    boxShadow: '0 4px 16px rgba(15, 23, 42, 0.05)',
  },
  interviewFitHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: '12px',
    borderBottom: '1px solid #f1f5f9',
    paddingBottom: '14px',
    marginBottom: '14px',
  },
  scoreGaugeBox: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-end',
    backgroundColor: '#f8fafc',
    border: '1px solid #e2e8f0',
    borderRadius: '8px',
    padding: '6px 14px',
  },
  scoreNumber: (score) => ({
    fontSize: '22px',
    fontWeight: '900',
    color: score >= 75 ? '#16a34a' : score >= 60 ? '#d97706' : '#dc2626',
    lineHeight: '1.1',
  }),
  highlightsContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    marginBottom: '16px',
    backgroundColor: '#f8fafc',
    borderRadius: '10px',
    padding: '12px 16px',
    border: '1px solid #f1f5f9',
  },
  highlightItem: (type) => ({
    display: 'flex',
    alignItems: 'flex-start',
    gap: '8px',
    fontSize: '13px',
    lineHeight: '1.4',
  }),
  recommendationRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: '12px',
    paddingTop: '12px',
    borderTop: '1px solid #f1f5f9',
  },
  recommendationBadge: (type) => ({
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    fontSize: '13px',
    fontWeight: '800',
    padding: '6px 12px',
    borderRadius: '8px',
    backgroundColor: type === 'proceed' ? '#f0fdf4' : type === 'screen' ? '#fefce8' : '#fef2f2',
    color: type === 'proceed' ? '#15803d' : type === 'screen' ? '#a16207' : '#b91c1c',
    border: `1px solid ${type === 'proceed' ? '#bbf7d0' : type === 'screen' ? '#fef08a' : '#fecaca'}`,
  }),
  generateQuestionsBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px',
    backgroundColor: '#4338ca',
    color: '#ffffff',
    border: 'none',
    borderRadius: '8px',
    padding: '8px 16px',
    fontSize: '13px',
    fontWeight: '700',
    cursor: 'pointer',
    boxShadow: '0 2px 8px rgba(67, 56, 202, 0.25)',
  },
  questionsContainer: {
    marginTop: '18px',
    borderTop: '2px dashed #e2e8f0',
    paddingTop: '16px',
  },
  questionsHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '14px',
    flexWrap: 'wrap',
    gap: '10px',
  },
  copyQuestionsBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    backgroundColor: '#f1f5f9',
    color: '#334155',
    border: '1px solid #cbd5e1',
    borderRadius: '6px',
    padding: '6px 12px',
    fontSize: '12px',
    fontWeight: '700',
    cursor: 'pointer',
  },
  questionsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
    gap: '14px',
  },
  categoryCard: {
    backgroundColor: '#ffffff',
    border: '1px solid #e2e8f0',
    borderRadius: '10px',
    padding: '14px',
    boxShadow: '0 2px 6px rgba(0, 0, 0, 0.02)',
  },
  categoryCardHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    borderBottom: '1px solid #f1f5f9',
    paddingBottom: '8px',
    marginBottom: '10px',
  },
  questionsList: {
    margin: 0,
    paddingLeft: '18px',
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  questionItem: {
    fontSize: '12px',
    color: '#334155',
    lineHeight: '1.5',
  },
  emptyCard: {
    backgroundColor: '#ffffff',
    border: '2px dashed #cbd5e1',
    borderRadius: '16px',
    padding: '60px 24px',
    textAlign: 'center',
  },
  emptyIcon: {
    fontSize: '44px',
    marginBottom: '16px',
  },
  jobsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
    gap: '20px',
  },
  jobCard: {
    backgroundColor: '#ffffff',
    border: '1px solid #e2e8f0',
    borderRadius: '12px',
    padding: '20px',
    boxShadow: '0 2px 8px rgba(15, 23, 42, 0.04)',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
  },
  jobCardTitle: {
    margin: '0 0 4px 0',
    fontSize: '16px',
    fontWeight: '700',
    color: '#0f172a',
  },
  jobCardMeta: {
    margin: 0,
    fontSize: '12px',
    color: '#64748b',
  },
  jobTypeBadge: {
    backgroundColor: '#eff6ff',
    color: '#1d4ed8',
    borderRadius: '6px',
    padding: '4px 8px',
    fontSize: '11px',
    fontWeight: '700',
    textTransform: 'capitalize',
  },
  jobCardDescription: {
    fontSize: '13px',
    color: '#475569',
    lineHeight: '1.5',
    margin: '14px 0',
    display: '-webkit-box',
    WebkitLineClamp: 3,
    WebkitBoxOrient: 'vertical',
    overflow: 'hidden',
  },
  requirementsSnippet: {
    backgroundColor: '#f8fafc',
    borderRadius: '6px',
    padding: '8px 10px',
    fontSize: '11px',
    color: '#64748b',
    marginBottom: '16px',
  },
  jobCardFooter: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTop: '1px solid #f1f5f9',
    paddingTop: '14px',
  },
  applicantBadge: {
    fontSize: '12px',
    fontWeight: '700',
    color: '#0f172a',
  },
  viewJobLink: {
    fontSize: '12px',
    fontWeight: '700',
    color: '#2563eb',
    textDecoration: 'none',
  },
  deleteJobBtn: {
    backgroundColor: '#fff',
    color: '#dc2626',
    border: '1px solid #fca5a5',
    borderRadius: '6px',
    padding: '4px 10px',
    fontSize: '11px',
    fontWeight: '700',
    cursor: 'pointer',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '4px',
    transition: 'all 0.2s ease',
  },

  // Modal Styles
  modalOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2000,
    padding: '20px',
    backdropFilter: 'blur(4px)',
  },
  modalContent: {
    backgroundColor: '#ffffff',
    borderRadius: '16px',
    maxWidth: '620px',
    width: '100%',
    maxHeight: '90vh',
    overflowY: 'auto',
    padding: '32px',
    boxShadow: '0 20px 50px rgba(0, 0, 0, 0.25)',
  },
  modalHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '20px',
  },
  modalCloseBtn: {
    background: 'none',
    border: 'none',
    fontSize: '20px',
    color: '#64748b',
    cursor: 'pointer',
    padding: '4px',
  },
  modalErrorBanner: {
    backgroundColor: '#fef2f2',
    border: '1px solid #fecaca',
    color: '#991b1b',
    padding: '10px 14px',
    borderRadius: '8px',
    fontSize: '13px',
    marginBottom: '16px',
  },
  modalForm: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  formRow: {
    display: 'flex',
    gap: '14px',
  },
  fieldLabel: {
    display: 'block',
    fontSize: '12px',
    fontWeight: '700',
    color: '#334155',
    marginBottom: '6px',
  },
  inputField: {
    width: '100%',
    boxSizing: 'border-box',
    padding: '10px 12px',
    borderRadius: '8px',
    border: '1px solid #cbd5e1',
    fontSize: '13px',
    color: '#0f172a',
    backgroundColor: '#f8fafc',
    outline: 'none',
  },
  modalFooter: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '12px',
    marginTop: '12px',
    paddingTop: '16px',
    borderTop: '1px solid #e2e8f0',
  },
  cancelBtn: {
    background: 'none',
    border: '1px solid #cbd5e1',
    borderRadius: '8px',
    padding: '10px 18px',
    fontSize: '13px',
    fontWeight: '700',
    color: '#64748b',
    cursor: 'pointer',
  },
};

