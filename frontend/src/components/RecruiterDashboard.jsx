// src/components/RecruiterDashboard.jsx
import { useEffect, useState } from 'react';
import API from '../api';

export default function RecruiterDashboard() {
  const [applications, setApplications] = useState([]);
  const [aiAnalysis, setAiAnalysis] = useState({});
  const [loadingAi, setLoadingAi] = useState({});

  useEffect(() => {
    let active = true;

    API.get('applications/my-applications/')
      .then((res) => {
        if (active) {
          setApplications(res.data);
        }
      })
      .catch((error) => {
        console.error('Failed to load applications', error);
      });

    return () => {
      active = false;
    };
  }, []);

  const handleRunAiAnalysis = async (appId) => {
    setLoadingAi((prev) => ({ ...prev, [appId]: true }));
    try {
      const res = await API.post(`applications/analyze/${appId}/`);
      setAiAnalysis((prev) => ({ ...prev, [appId]: res.data.analysis }));
    } catch {
      alert("Failed to analyze resume with AI.");
    } finally {
      setLoadingAi((prev) => ({ ...prev, [appId]: false }));
    }
  };

  return (
    <div style={{ padding: '20px' }}>
      <h2>Recruiter Applicant Management Dashboard</h2>
      {applications.length === 0 ? (
        <p>No applications received yet.</p>
      ) : (
        applications.map((app) => (
          <div 
            key={app.id} 
            style={{ border: '1px solid #ddd', padding: '15px', marginBottom: '15px', borderRadius: '5px' }}
          >
            <h3>Job Title: {app.job_title}</h3>
            <p><strong>Candidate Name:</strong> {app.applicant_name}</p>
            <p><strong>Status:</strong> <span style={{ fontWeight: 'bold' }}>{app.status}</span></p>
            
            <a 
              href={`http://127.0.0.1:8000${app.resume}`} 
              target="_blank" 
              rel="noreferrer"
            >
              📄 View Resume (PDF)
            </a>

            <div style={{ marginTop: '10px' }}>
              <button 
                onClick={() => handleRunAiAnalysis(app.id)}
                disabled={loadingAi[app.id]}
                style={{ background: '#4CAF50', color: '#fff', border: 'none', padding: '8px 12px', cursor: 'pointer' }}
              >
                {loadingAi[app.id] ? "Analyzing..." : "🤖 Run AI Resume Analysis"}
              </button>
            </div>

            {aiAnalysis[app.id] && (
              <div style={{ background: '#f0f8ff', padding: '10px', marginTop: '10px', borderRadius: '4px' }}>
                <h4>AI Evaluation Results:</h4>
                <pre style={{ whiteSpace: 'pre-wrap', fontFamily: 'sans-serif' }}>
                  {aiAnalysis[app.id]}
                </pre>
              </div>
            )}
          </div>
        ))
      )}
    </div>
  );
}
