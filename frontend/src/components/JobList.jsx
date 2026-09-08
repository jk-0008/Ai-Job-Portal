// src/components/JobList.jsx
import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import API from '../api';

const types = [['all', 'All roles'], ['full_time', 'Full time'], ['part_time', 'Part time'], ['contract', 'Contract'], ['internship', 'Internship']];

export default function JobList() {
  const [jobs, setJobs] = useState([]);
  const [query, setQuery] = useState('');
  const [location, setLocation] = useState('');
  const [jobType, setJobType] = useState('all');
  const [saved, setSaved] = useState(() => JSON.parse(localStorage.getItem('savedJobs') || '[]'));
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionNotice, setActionNotice] = useState('');
  const [deletingId, setDeletingId] = useState(null);

  const handleRemoveRole = async (jobId, jobTitle) => {
    const confirmed = window.confirm(`Are you sure you want to remove the role "${jobTitle}"?`);
    if (!confirmed) return;

    setDeletingId(jobId);
    try {
      await API.delete(`jobs/${jobId}/`);
      setJobs((prev) => prev.filter((j) => j.id !== jobId));
      setSaved((prev) => {
        const next = prev.filter((id) => id !== jobId);
        localStorage.setItem('savedJobs', JSON.stringify(next));
        return next;
      });
      setActionNotice(`Role "${jobTitle}" was removed.`);
      setTimeout(() => setActionNotice(''), 4000);
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to remove role. Please try again.');
    } finally {
      setDeletingId(null);
    }
  };

  const loadJobs = () => {
    setLoading(true);
    setError('');
    API.get('jobs/')
      .then((res) => {
        setJobs(res.data);
        setError('');
      })
      .catch(() => setError('We could not load jobs right now. Please verify the backend server is running and try again.'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    let active = true;
    API.get('jobs/')
      .then((res) => {
        if (active) {
          setJobs(res.data);
          setError('');
        }
      })
      .catch(() => {
        if (active) {
          setError('We could not load jobs right now. Please verify the backend server is running and try again.');
        }
      })
      .finally(() => {
        if (active) {
          setLoading(false);
        }
      });
    return () => {
      active = false;
    };
  }, []);

  const visibleJobs = useMemo(() => jobs.filter((job) => {
    const text = `${job.title} ${job.description} ${job.requirements} ${job.company_details?.name || ''}`.toLowerCase();
    return (!query || text.includes(query.toLowerCase())) && (!location || job.location.toLowerCase().includes(location.toLowerCase())) && (jobType === 'all' || job.job_type === jobType);
  }), [jobs, query, location, jobType]);
  const toggleSaved = (id) => { const next = saved.includes(id) ? saved.filter((jobId) => jobId !== id) : [...saved, id]; setSaved(next); localStorage.setItem('savedJobs', JSON.stringify(next)); };

  const userRole = localStorage.getItem('userRole') || '';
  const isEmployer = ['recruiter', 'hiring_manager', 'company_admin'].includes(userRole);

  return (
    <main><section className="hero-panel"><p className="eyebrow">Careers made clearer</p><h1>Find work that fits<br />your next chapter.</h1><p className="hero-copy">Discover thoughtfully selected opportunities and keep your entire job search in one focused place.</p><div className="search-bar" role="search"><label><span>⌕</span><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Job title, skill, or company" /></label><label className="location-input"><span>⌖</span><input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="City or remote" /></label><button className="button" type="button">Search roles</button></div><div className="popular">Popular: <button onClick={() => setQuery('designer')}>Product designer</button><button onClick={() => setQuery('engineer')}>Software engineer</button><button onClick={() => setQuery('marketing')}>Marketing</button></div></section>
      <section className="jobs-layout"><aside className="filter-panel"><div className="filter-title"><h2>Filters</h2><button onClick={() => { setQuery(''); setLocation(''); setJobType('all'); }}>Clear all</button></div><h3>Work type</h3>{types.map(([value, label]) => <label className="radio-row" key={value}><input type="radio" name="type" checked={jobType === value} onChange={() => setJobType(value)} />{label}</label>)}<div className="saved-note"><span>♡</span><div><strong>Saved jobs</strong><p>{saved.length} role{saved.length === 1 ? '' : 's'} saved on this device</p></div></div></aside>
      <div className="results-panel"><div className="results-heading"><div><p className="eyebrow">Opportunities</p><h2>{loading ? 'Finding roles…' : `${visibleJobs.length} open role${visibleJobs.length === 1 ? '' : 's'}`}</h2></div><span>Most recent</span></div>{actionNotice && <div className="notice" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}><span>✓ {actionNotice}</span><button type="button" onClick={() => setActionNotice('')} style={{ background: 'none', border: 'none', cursor: 'pointer', fontWeight: 'bold' }}>✕</button></div>}{error && <div className="notice error">{error} <button style={{ marginLeft: '12px', padding: '4px 10px', borderRadius: '4px', border: '1px solid #c97a6d', background: '#fff', cursor: 'pointer', fontWeight: 'bold' }} onClick={loadJobs}>Retry</button></div>}{!loading && !error && !visibleJobs.length && <div className="empty-state"><h2>No roles match yet</h2><p>Try a different title, location, or work type.</p></div>}{visibleJobs.map((job) => <article className="job-card" key={job.id}><div className="company-mark">{(job.company_details?.name || job.title).slice(0, 1)}</div><div className="job-main"><div className="job-title-row"><div><Link to={`/jobs/${job.id}`}><h3>{job.title}</h3></Link><p>{job.company_details?.name || 'Independent employer'} <span>·</span> {job.location}</p></div><button className={`save-button ${saved.includes(job.id) ? 'saved' : ''}`} onClick={() => toggleSaved(job.id)}>{saved.includes(job.id) ? '♥' : '♡'}</button></div><div className="tags"><span>{job.job_type.replace('_', ' ')}</span>{job.salary_range && <span>{job.salary_range}</span>}</div><p className="description">{job.description}</p><div className="card-footer"><small>Posted {new Date(job.created_at).toLocaleDateString()}</small><div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>{isEmployer && <button type="button" className="remove-role-btn" onClick={() => handleRemoveRole(job.id, job.title)} disabled={deletingId === job.id} title="Remove this role">{deletingId === job.id ? 'Removing…' : 'Remove role ✕'}</button>}<Link className="apply-link" to={`/jobs/${job.id}`}>View role →</Link></div></div></div></article>)}</div></section></main>
  );
}
