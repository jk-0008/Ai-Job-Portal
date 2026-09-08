import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import API from '../api';

export default function JobDetail() {
  const { id } = useParams(); const navigate = useNavigate();
  const [job, setJob] = useState(null); const [file, setFile] = useState(null); const [coverLetter, setCoverLetter] = useState(''); const [message, setMessage] = useState(''); const [submitting, setSubmitting] = useState(false);
  useEffect(() => { API.get(`jobs/${id}/`).then((res) => setJob(res.data)).catch(() => setMessage('This job is no longer available.')); }, [id]);


  const handleRemoveRole = async () => {
    if (!job) return;
    const confirmed = window.confirm(`Are you sure you want to remove the role "${job.title}"?`);
    if (!confirmed) return;

    try {
      await API.delete(`jobs/${id}/`);
      navigate('/', { replace: true });
    } catch (err) {
      setMessage(err.response?.data?.detail || 'Could not remove this role.');
    }
  };

  const apply = async (event) => {
    event.preventDefault();
    if (!localStorage.getItem('token')) { navigate('/login'); return; }
    if (!file) { setMessage('Please attach your resume as a PDF.'); return; }
    const data = new FormData(); data.append('job', id); data.append('resume', file); data.append('cover_letter', coverLetter);
    setSubmitting(true); setMessage('');
    try { await API.post('applications/apply/', data); setMessage('Application submitted. You can track it from My applications.'); }
    catch (error) { setMessage(error.response?.data?.non_field_errors?.[0] || error.response?.data?.detail || 'We could not submit your application.'); }
    finally { setSubmitting(false); }
  };
  const userRole = localStorage.getItem('userRole') || '';
  const isEmployer = ['recruiter', 'hiring_manager', 'company_admin'].includes(userRole);

  if (!job) return <main className="detail-page"><Link to="/">← All jobs</Link><p className="loading-copy">{message || 'Loading role…'}</p></main>;
  return (
    <main className="detail-page">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
        <Link className="back-link" to="/">← Browse all roles</Link>
        {isEmployer && (
          <button
            type="button"
            className="remove-role-btn"
            onClick={handleRemoveRole}
            title="Remove this role"
          >
            Remove role ✕
          </button>
        )}
      </div>
      <section className="detail-grid">
        <article className="job-description">
          <div className="company-mark large">{(job.company_details?.name || job.title).slice(0, 1)}</div>
          <p className="eyebrow">{job.company_details?.name || 'Independent employer'}</p>
          <h1>{job.title}</h1>
          <p className="detail-meta">{job.location} <span>·</span> {job.job_type.replace('_', ' ')} {job.salary_range && <><span>·</span> {job.salary_range}</>}</p>
          <hr />
          <h2>About the role</h2>
          <p className="long-copy">{job.description}</p>
          <h2>What you’ll bring</h2>
          <p className="long-copy requirements">{job.requirements}</p>
        </article>
        <aside className="application-card">
          <h2>Interested in this role?</h2>
          <p>Send a tailored application directly to the hiring team.</p>
          {message && <div className="notice">{message}</div>}
          <form onSubmit={apply}>
            <label>Resume (PDF)<input type="file" accept="application/pdf" onChange={(e) => setFile(e.target.files[0])} /></label>
            <label>Short note <span className="muted">optional</span><textarea value={coverLetter} onChange={(e) => setCoverLetter(e.target.value)} placeholder="Why are you a great fit?" rows="5" /></label>
            <button className="button full-width" disabled={submitting}>{submitting ? 'Submitting…' : 'Submit application'}</button>
          </form>
          <small>By applying, you agree to share your submitted materials with this employer.</small>
        </aside>
      </section>
    </main>
  );
}
