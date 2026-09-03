import { useEffect, useState } from 'react';
import API from '../api';

export default function RecruiterDashboard() {
  const [applications, setApplications] = useState([]);
  const [aiAnalysis, setAiAnalysis] = useState({});
  const [loadingAi, setLoadingAi] = useState({});
  const [error, setError] = useState('');
  const backendOrigin = (import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000/api/')
    .replace(/\/api\/?$/, '');

  useEffect(() => {
    let active = true;
    API.get('applications/recruiter-applications/')
      .then((res) => active && setApplications(res.data))
      .catch(() => active && setError('Sign in with a recruiter account to view candidates.'));
    return () => {
      active = false;
    };
  }, []);

  const updateStatus = async (applicationId, status) => {
    try {
      await API.patch(`applications/${applicationId}/status/`, { status });
      setApplications((items) => items.map((item) => (
        item.id === applicationId ? { ...item, status } : item
      )));
    } catch {
      setError('Could not update the application status.');
    }
  };

  const handleRunAiAnalysis = async (applicationId) => {
    setLoadingAi((state) => ({ ...state, [applicationId]: true }));
    try {
      const response = await API.post(`applications/analyze/${applicationId}/`);
      setAiAnalysis((state) => ({ ...state, [applicationId]: response.data.analysis }));
    } catch {
      setError('AI analysis is unavailable. Confirm the Gemini API key is configured.');
    } finally {
      setLoadingAi((state) => ({ ...state, [applicationId]: false }));
    }
  };

  return (
    <main style={{ padding: '20px', textAlign: 'left' }}>
      <h2>Candidate Pipeline</h2>
      {error && <p role="alert">{error}</p>}
      {!error && applications.length === 0 && <p>No applications received yet.</p>}
      {applications.map((application) => (
        <article key={application.id} style={{ border: '1px solid #ddd', padding: '15px', marginBottom: '15px' }}>
          <h3>{application.job_title}</h3>
          <p><strong>Candidate:</strong> {application.applicant_name}</p>
          <label>
            Status
            <select value={application.status} onChange={(event) => updateStatus(application.id, event.target.value)}>
              <option value="applied">Applied</option>
              <option value="shortlisted">Shortlisted</option>
              <option value="rejected">Rejected</option>
            </select>
          </label>
          <p><a href={`${backendOrigin}${application.resume}`} target="_blank" rel="noreferrer">View resume</a></p>
          <button type="button" onClick={() => handleRunAiAnalysis(application.id)} disabled={loadingAi[application.id]}>
            {loadingAi[application.id] ? 'Analyzing...' : 'Run AI resume analysis'}
          </button>
          {aiAnalysis[application.id] && <pre style={{ whiteSpace: 'pre-wrap' }}>{aiAnalysis[application.id]}</pre>}
        </article>
      ))}
    </main>
  );
}
