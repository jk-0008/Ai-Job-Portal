import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import API from '../api';

export default function MyApplications() {
  const [applications, setApplications] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [expandedCover, setExpandedCover] = useState({});

  const userRole = localStorage.getItem('userRole') || 'job_seeker';
  const username = localStorage.getItem('username') || '';

  const backendOrigin = (import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000/api/')
    .replace(/\/api\/?$/, '');

  const formatRole = (role) => {
    switch (role) {
      case 'company_admin':
        return 'Company Admin';
      case 'recruiter':
        return 'Recruiter';
      case 'hiring_manager':
        return 'Hiring Manager';
      case 'job_seeker':
      default:
        return 'Job Seeker / Candidate';
    }
  };

  const getRoleBadgeStyle = (role) => {
    switch (role) {
      case 'company_admin':
        return { bg: '#0f172a', text: '#f8fafc', border: '#334155' };
      case 'recruiter':
        return { bg: '#eff6ff', text: '#1d4ed8', border: '#bfdbfe' };
      case 'hiring_manager':
        return { bg: '#faf5ff', text: '#7c3aed', border: '#e9d5ff' };
      default:
        return { bg: '#f0fdf4', text: '#166534', border: '#bbf7d0' };
    }
  };

  useEffect(() => {
    API.get('applications/my-applications/')
      .then((res) => {
        setApplications(res.data);
        setError('');
      })
      .catch(() => {
        setError('Sign in with your account to track your submitted job applications.');
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  const toggleCover = (id) => {
    setExpandedCover((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleAskJobi = (jobTitle) => {
    window.dispatchEvent(
      new CustomEvent('openJobiChat', {
        detail: { prompt: `What is the current status and condition of my application for ${jobTitle}?` },
      })
    );
  };

  const badgeStyle = getRoleBadgeStyle(userRole);
  const isEmployerRole = ['company_admin', 'recruiter', 'hiring_manager'].includes(userRole);

  // Status Metrics
  const inReviewCount = applications.filter((a) => a.status === 'applied').length;
  const shortlistedCount = applications.filter((a) => a.status === 'shortlisted').length;
  const rejectedCount = applications.filter((a) => a.status === 'rejected').length;

  const filteredApplications = applications.filter((app) => {
    if (statusFilter === 'all') return true;
    return app.status === statusFilter;
  });

  // Helper for status condition metadata
  const getStatusCondition = (status, companyName, appliedAt) => {
    const appliedDate = appliedAt
      ? new Date(appliedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
      : 'recently';
    const company = companyName || 'the employer';

    switch (status) {
      case 'shortlisted':
        return {
          label: 'Shortlisted for Interview',
          tagBg: '#dcfce7',
          tagText: '#15803d',
          tagBorder: '#86efac',
          icon: '🎉',
          cardBorder: '#86efac',
          headerBg: '#f0fdf4',
          headline: 'Congratulations! Selected for Interview Stage',
          summary: `Great news! ${company} reviewed your resume and credentials, and your profile was officially selected for the shortlist.`,
          nextStep: `The recruitment team will reach out directly via your registered contact details to schedule your interview or technical screening.`,
          currentStepIndex: 2,
        };
      case 'rejected':
        return {
          label: 'Application Concluded',
          tagBg: '#fef2f2',
          tagText: '#b91c1c',
          tagBorder: '#fecaca',
          icon: '📁',
          cardBorder: '#e2e8f0',
          headerBg: '#fafafa',
          headline: 'Review Completed — Not Selected for this Opening',
          summary: `The recruitment team at ${company} reviewed your application and decided to proceed with other candidates whose experience aligns more specifically with this position.`,
          nextStep: `Your profile remains active on Jobi. Explore other matching positions posted today.`,
          currentStepIndex: 2,
        };
      case 'applied':
      default:
        return {
          label: 'In Review & Screening',
          tagBg: '#fef9c3',
          tagText: '#854d0e',
          tagBorder: '#fef08a',
          icon: '⏳',
          cardBorder: '#cbd5e1',
          headerBg: '#f8fafc',
          headline: 'Application Received — Under Active Screening',
          summary: `Your application, resume, and profile were received on ${appliedDate} and are currently queued for evaluation in ${company}'s recruitment pipeline.`,
          nextStep: `The hiring team is reviewing applicant qualifications. You will receive a notification as soon as their decision is finalized.`,
          currentStepIndex: 1,
        };
    }
  };

  return (
    <main className="page-container" style={{ maxWidth: '920px', margin: 'auto', padding: '40px 24px 80px' }}>
      {/* Header Eyebrow with Active Role */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', marginBottom: '14px' }}>
        <p className="eyebrow" style={{ margin: 0 }}>
          Your Job Search & Applications
        </p>

        {/* Current Active Role Indicator */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '12px', color: '#64748b' }}>Active Portal Role:</span>
          <span
            style={{
              backgroundColor: badgeStyle.bg,
              color: badgeStyle.text,
              border: `1px solid ${badgeStyle.border}`,
              padding: '3px 10px',
              borderRadius: '99px',
              fontSize: '11px',
              fontWeight: '800',
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '5px',
            }}
          >
            <span>{isEmployerRole ? '🛡️' : '👨‍💻'}</span>
            {formatRole(userRole)}
            {username && <span style={{ opacity: 0.85 }}>({username})</span>}
          </span>
        </div>
      </div>

      <h1 style={{ margin: '0 0 10px 0', fontSize: '38px', color: '#0f172a', letterSpacing: '-1px' }}>
        Application Tracker & Live Condition
      </h1>
      <p className="page-intro" style={{ margin: '0 0 24px 0', color: '#64748b', fontSize: '15px' }}>
        Track what stage your applications are in, see real-time recruiter conditions, and verify submitted resumes.
      </p>

      {/* Top Quick Status Overview Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
        gap: '14px',
        marginBottom: '28px'
      }}>
        <div style={{
          backgroundColor: '#ffffff',
          border: '1px solid #e2e8f0',
          borderRadius: '12px',
          padding: '16px 20px',
          boxShadow: '0 2px 6px rgba(15, 23, 42, 0.03)'
        }}>
          <div style={{ fontSize: '12px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Total Applied
          </div>
          <div style={{ fontSize: '28px', fontWeight: '800', color: '#0f172a', marginTop: '4px' }}>
            {applications.length}
          </div>
          <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '2px' }}>Submitted positions</div>
        </div>

        <div style={{
          backgroundColor: '#ffffff',
          border: '1px solid #fef08a',
          borderRadius: '12px',
          padding: '16px 20px',
          boxShadow: '0 2px 6px rgba(15, 23, 42, 0.03)'
        }}>
          <div style={{ fontSize: '12px', fontWeight: '700', color: '#854d0e', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            ⏳ Under Review
          </div>
          <div style={{ fontSize: '28px', fontWeight: '800', color: '#a16207', marginTop: '4px' }}>
            {inReviewCount}
          </div>
          <div style={{ fontSize: '12px', color: '#a16207', marginTop: '2px' }}>Currently in screening</div>
        </div>

        <div style={{
          backgroundColor: '#ffffff',
          border: '1px solid #bbf7d0',
          borderRadius: '12px',
          padding: '16px 20px',
          boxShadow: '0 2px 6px rgba(15, 23, 42, 0.03)'
        }}>
          <div style={{ fontSize: '12px', fontWeight: '700', color: '#15803d', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            🎉 Shortlisted
          </div>
          <div style={{ fontSize: '28px', fontWeight: '800', color: '#16a34a', marginTop: '4px' }}>
            {shortlistedCount}
          </div>
          <div style={{ fontSize: '12px', color: '#16a34a', marginTop: '2px' }}>Interview round candidates</div>
        </div>

        <div style={{
          backgroundColor: '#ffffff',
          border: '1px solid #e2e8f0',
          borderRadius: '12px',
          padding: '16px 20px',
          boxShadow: '0 2px 6px rgba(15, 23, 42, 0.03)'
        }}>
          <div style={{ fontSize: '12px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            📁 Concluded
          </div>
          <div style={{ fontSize: '28px', fontWeight: '800', color: '#64748b', marginTop: '4px' }}>
            {rejectedCount}
          </div>
          <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '2px' }}>Review concluded</div>
        </div>
      </div>

      {/* Role Gateway Banner: If user is Company Admin or Recruiter */}
      {isEmployerRole && (
        <div
          style={{
            backgroundColor: '#ffffff',
            border: '1px solid #cbd5e1',
            borderRadius: '12px',
            padding: '18px 22px',
            marginBottom: '28px',
            boxShadow: '0 4px 12px rgba(15, 23, 42, 0.04)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '16px',
            borderLeft: '5px solid #2563eb',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <span style={{ fontSize: '28px' }}>🏢</span>
            <div>
              <div style={{ fontWeight: '700', fontSize: '15px', color: '#0f172a' }}>
                You are signed in as a {formatRole(userRole)}
              </div>
              <p style={{ margin: '3px 0 0 0', fontSize: '13px', color: '#64748b' }}>
                Looking to manage your organization, post new job openings, or evaluate candidate resumes?
              </p>
            </div>
          </div>
          <Link
            to="/recruiter"
            style={{
              backgroundColor: '#0f172a',
              color: '#ffffff',
              padding: '9px 16px',
              borderRadius: '8px',
              fontSize: '13px',
              fontWeight: '700',
              textDecoration: 'none',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              whiteSpace: 'nowrap',
              boxShadow: '0 2px 6px rgba(15, 23, 42, 0.2)',
            }}
          >
            Open Employer & Company Admin Workspace →
          </Link>
        </div>
      )}

      {/* Filter Tabs */}
      {!loading && applications.length > 0 && (
        <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', flexWrap: 'wrap' }}>
          {[
            { key: 'all', label: `All Applications (${applications.length})` },
            { key: 'applied', label: `In Review (${inReviewCount})` },
            { key: 'shortlisted', label: `Shortlisted (${shortlistedCount})` },
            { key: 'rejected', label: `Concluded (${rejectedCount})` },
          ].map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setStatusFilter(tab.key)}
              style={{
                backgroundColor: statusFilter === tab.key ? '#1d4ed8' : '#ffffff',
                color: statusFilter === tab.key ? '#ffffff' : '#475569',
                border: `1px solid ${statusFilter === tab.key ? '#1d4ed8' : '#cbd5e1'}`,
                borderRadius: '8px',
                padding: '7px 14px',
                fontSize: '13px',
                fontWeight: '700',
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>
      )}

      {/* Error Notice */}
      {error && <div className="notice error">{error}</div>}

      {/* Loading Skeleton */}
      {loading && !error && (
        <div style={{ padding: '30px', textAlign: 'center', color: '#64748b' }}>
          Loading your application records and tracking conditions...
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && applications.length === 0 && (
        <div className="empty-state" style={{ backgroundColor: '#ffffff', border: '1px dashed #cbd5e1', borderRadius: '12px', padding: '48px 24px', textAlign: 'center' }}>
          <div style={{ fontSize: '36px', marginBottom: '10px' }}>📄</div>
          <h2 style={{ margin: '0 0 8px 0', fontSize: '20px', color: '#0f172a' }}>No Applications Found</h2>
          <p style={{ color: '#64748b', fontSize: '14px', maxWidth: '420px', margin: '0 auto 24px' }}>
            {isEmployerRole
              ? "You haven't submitted any candidate job applications under this account. Head over to the Employer Workspace to view your received applicants."
              : "Find an open role you love and send your first application with your resume to start tracking its condition."}
          </p>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '12px', flexWrap: 'wrap' }}>
            <Link className="button" to="/" style={{ padding: '10px 20px', textDecoration: 'none' }}>
              🔍 Browse open jobs
            </Link>
            {isEmployerRole && (
              <Link to="/recruiter" className="button" style={{ backgroundColor: '#0f172a', padding: '10px 20px', textDecoration: 'none' }}>
                View Received Applicants
              </Link>
            )}
          </div>
        </div>
      )}

      {/* Filtered Empty State */}
      {!loading && applications.length > 0 && filteredApplications.length === 0 && (
        <div style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '36px', textAlign: 'center', color: '#64748b' }}>
          No applications match the "{statusFilter}" filter.
          <div style={{ marginTop: '12px' }}>
            <button
              type="button"
              onClick={() => setStatusFilter('all')}
              style={{ background: 'none', border: 'none', color: '#2563eb', fontWeight: '700', cursor: 'pointer' }}
            >
              Show all applications
            </button>
          </div>
        </div>
      )}

      {/* Detailed Application Tracking Cards */}
      {!loading && filteredApplications.length > 0 && (
        <div className="application-list" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {filteredApplications.map((item) => {
            const condition = getStatusCondition(item.status, item.company_name, item.applied_at);
            const appliedDate = item.applied_at ? new Date(item.applied_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : 'Recently';
            const resumeUrl = item.resume ? (item.resume.startsWith('http') ? item.resume : `${backendOrigin}${item.resume}`) : null;

            return (
              <article
                key={item.id}
                style={{
                  backgroundColor: '#ffffff',
                  border: `1px solid ${condition.cardBorder}`,
                  borderRadius: '16px',
                  padding: '24px',
                  boxShadow: '0 4px 16px rgba(15, 23, 42, 0.04)',
                  position: 'relative',
                  overflow: 'hidden',
                }}
              >
                {/* Top Role & Status Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px' }}>
                    <div className="company-mark" style={{ width: '52px', height: '52px', borderRadius: '12px', backgroundColor: '#eff6ff', color: '#1d4ed8', display: 'grid', placeItems: 'center', fontSize: '22px', fontWeight: 'bold' }}>
                      {(item.company_name || item.job_title || 'J').slice(0, 1).toUpperCase()}
                    </div>
                    <div>
                      <h2 style={{ margin: '0 0 6px 0', fontSize: '20px', color: '#0f172a' }}>
                        {item.job_title}
                      </h2>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px', color: '#64748b', flexWrap: 'wrap' }}>
                        <span style={{ fontWeight: '700', color: '#334155' }}>🏢 {item.company_name || 'Jobi Partner'}</span>
                        <span>•</span>
                        <span>📍 {item.job_location || 'Remote'}</span>
                        <span>•</span>
                        <span>💼 {(item.job_type || 'full_time').replace('_', ' ')}</span>
                        <span>•</span>
                        <span>Applied on {appliedDate}</span>
                      </div>
                    </div>
                  </div>

                  {/* Status Badge */}
                  <div>
                    <span
                      style={{
                        backgroundColor: condition.tagBg,
                        color: condition.tagText,
                        border: `1px solid ${condition.tagBorder}`,
                        padding: '6px 14px',
                        borderRadius: '99px',
                        fontSize: '12px',
                        fontWeight: '800',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        letterSpacing: '0.4px',
                        textTransform: 'uppercase',
                      }}
                    >
                      <span>{condition.icon}</span>
                      <span>{condition.label}</span>
                    </span>
                  </div>
                </div>

                {/* Visual Progress Stepper */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                  gap: '12px',
                  margin: '22px 0 18px 0',
                  padding: '16px',
                  backgroundColor: '#f8fafc',
                  borderRadius: '12px',
                  border: '1px solid #e2e8f0',
                }}>
                  {/* Step 1 */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{
                      width: '26px',
                      height: '26px',
                      borderRadius: '50%',
                      backgroundColor: '#16a34a',
                      color: '#ffffff',
                      display: 'grid',
                      placeItems: 'center',
                      fontSize: '12px',
                      fontWeight: '800',
                      flexShrink: 0,
                    }}>✓</div>
                    <div>
                      <div style={{ fontSize: '12px', fontWeight: '700', color: '#0f172a' }}>1. Submission</div>
                      <div style={{ fontSize: '11px', color: '#64748b' }}>Received {appliedDate}</div>
                    </div>
                  </div>

                  {/* Step 2 */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{
                      width: '26px',
                      height: '26px',
                      borderRadius: '50%',
                      backgroundColor: item.status === 'applied' ? '#ca8a04' : '#16a34a',
                      color: '#ffffff',
                      display: 'grid',
                      placeItems: 'center',
                      fontSize: '12px',
                      fontWeight: '800',
                      flexShrink: 0,
                    }}>
                      {item.status === 'applied' ? '⏳' : '✓'}
                    </div>
                    <div>
                      <div style={{ fontSize: '12px', fontWeight: '700', color: '#0f172a' }}>2. Resume Screening</div>
                      <div style={{ fontSize: '11px', color: item.status === 'applied' ? '#ca8a04' : '#64748b', fontWeight: item.status === 'applied' ? '700' : 'normal' }}>
                        {item.status === 'applied' ? 'In Review by Hiring Team' : 'Screening Finished'}
                      </div>
                    </div>
                  </div>

                  {/* Step 3 */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{
                      width: '26px',
                      height: '26px',
                      borderRadius: '50%',
                      backgroundColor: item.status === 'shortlisted' ? '#16a34a' : item.status === 'rejected' ? '#64748b' : '#cbd5e1',
                      color: item.status === 'applied' ? '#64748b' : '#ffffff',
                      display: 'grid',
                      placeItems: 'center',
                      fontSize: '12px',
                      fontWeight: '800',
                      flexShrink: 0,
                    }}>
                      {item.status === 'shortlisted' ? '🎉' : item.status === 'rejected' ? '✕' : '3'}
                    </div>
                    <div>
                      <div style={{ fontSize: '12px', fontWeight: '700', color: '#0f172a' }}>3. Hiring Decision</div>
                      <div style={{
                        fontSize: '11px',
                        color: item.status === 'shortlisted' ? '#15803d' : item.status === 'rejected' ? '#b91c1c' : '#64748b',
                        fontWeight: item.status !== 'applied' ? '700' : 'normal',
                      }}>
                        {item.status === 'shortlisted' ? 'Selected for Interview' : item.status === 'rejected' ? 'Review Concluded' : 'Awaiting Decision'}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Condition Box */}
                <div style={{
                  backgroundColor: condition.headerBg,
                  border: `1px solid ${condition.cardBorder}`,
                  borderRadius: '10px',
                  padding: '16px 18px',
                  marginBottom: '16px',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                    <span style={{ fontSize: '16px' }}>{condition.icon}</span>
                    <strong style={{ fontSize: '14px', color: '#0f172a' }}>
                      {condition.headline}
                    </strong>
                  </div>
                  <p style={{ margin: '0 0 8px 0', fontSize: '13px', color: '#334155', lineHeight: '1.6' }}>
                    {condition.summary}
                  </p>
                  <div style={{ fontSize: '12px', color: '#64748b', display: 'flex', alignItems: 'baseline', gap: '6px' }}>
                    <strong style={{ color: '#0f172a' }}>Next Step:</strong>
                    <span>{condition.nextStep}</span>
                  </div>
                </div>

                {/* Expandable Cover Letter (if submitted) */}
                {item.cover_letter && (
                  <div style={{ marginBottom: '14px' }}>
                    <button
                      type="button"
                      onClick={() => toggleCover(item.id)}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: '#2563eb',
                        fontSize: '12px',
                        fontWeight: '700',
                        cursor: 'pointer',
                        padding: 0,
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                      }}
                    >
                      <span>{expandedCover[item.id] ? '▼ Hide' : '▶ Show'} Submitted Cover Note</span>
                    </button>
                    {expandedCover[item.id] && (
                      <div style={{
                        marginTop: '8px',
                        padding: '12px 16px',
                        backgroundColor: '#f8fafc',
                        border: '1px solid #e2e8f0',
                        borderRadius: '8px',
                        fontSize: '13px',
                        color: '#334155',
                        lineHeight: '1.6',
                        whiteSpace: 'pre-line',
                      }}>
                        {item.cover_letter}
                      </div>
                    )}
                  </div>
                )}

                {/* Action Toolbar */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px', borderTop: '1px solid #f1f5f9', paddingTop: '14px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                    {resumeUrl && (
                      <a
                        href={resumeUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          fontSize: '12px',
                          color: '#0f172a',
                          backgroundColor: '#f8fafc',
                          border: '1px solid #cbd5e1',
                          padding: '6px 12px',
                          borderRadius: '6px',
                          fontWeight: '700',
                          textDecoration: 'none',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '5px',
                        }}
                      >
                        📄 View Submitted Resume (PDF)
                      </a>
                    )}
                    <button
                      type="button"
                      onClick={() => handleAskJobi(item.job_title)}
                      style={{
                        fontSize: '12px',
                        color: '#1d4ed8',
                        backgroundColor: '#eff6ff',
                        border: '1px solid #bfdbfe',
                        padding: '6px 12px',
                        borderRadius: '6px',
                        fontWeight: '700',
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '5px',
                      }}
                    >
                      💬 Ask Jobi About This Status
                    </button>
                  </div>

                  {item.job && (
                    <Link
                      to={`/jobs/${item.job}`}
                      style={{
                        fontSize: '12px',
                        color: '#2563eb',
                        fontWeight: '700',
                        textDecoration: 'none',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                      }}
                    >
                      View Original Job Posting →
                    </Link>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      )}
    </main>
  );
}

