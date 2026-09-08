// src/App.jsx
import { useState } from 'react';
import { BrowserRouter, Routes, Route, Link, useNavigate } from 'react-router-dom';
import Login from './components/Login';
import JobList from './components/JobList';
import Chatbot from './components/Chatbot';
import RecruiterDashboard from './components/RecruiterDashboard';
import JobDetail from './components/JobDetail';
import MyApplications from './components/MyApplications';
import Register from './components/Register';

function Layout() {
  const [auth, setAuth] = useState(!!localStorage.getItem('token'));
  const navigate = useNavigate();

  const userRole = localStorage.getItem('userRole') || 'job_seeker';
  const username = localStorage.getItem('username') || '';

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
        return 'Job Seeker';
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('refresh');
    localStorage.removeItem('userRole');
    localStorage.removeItem('username');
    localStorage.removeItem('companyName');
    localStorage.removeItem('companyLocation');
    setAuth(false);
    navigate('/');
  };

  return (
    <div className="app-shell">
      <header className="site-header">
        <Link to="/" className="brand"><span>◈</span> Jobi</Link>
        <nav aria-label="Primary navigation">
          <Link to="/">Find jobs</Link>
          {auth && userRole === 'job_seeker' && <Link to="/applications">My applications</Link>}
          {auth && ['recruiter', 'hiring_manager', 'company_admin'].includes(userRole) && (
            <Link to="/recruiter">Employer Dashboard</Link>
          )}
          {!auth && <Link to="/recruiter">For employers</Link>}
        </nav>
        {auth ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <span
              style={{
                fontSize: '11px',
                fontWeight: '800',
                backgroundColor: userRole === 'company_admin' ? '#0f172a' : userRole === 'recruiter' ? '#eff6ff' : '#f0fdf4',
                color: userRole === 'company_admin' ? '#f8fafc' : userRole === 'recruiter' ? '#1d4ed8' : '#166534',
                border: `1px solid ${userRole === 'company_admin' ? '#334155' : userRole === 'recruiter' ? '#bfdbfe' : '#bbf7d0'}`,
                padding: '4px 10px',
                borderRadius: '99px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                textTransform: 'uppercase',
                letterSpacing: '0.4px',
              }}
            >
              <span>{userRole === 'company_admin' ? '🛡️' : userRole === 'recruiter' ? '🏢' : '👨‍💻'}</span>
              <span>{formatRole(userRole)}</span>
              {username && <span style={{ opacity: 0.8, textTransform: 'none' }}>({username})</span>}
            </span>
            <button className="text-button" onClick={logout}>Sign out</button>
          </div>
        ) : (
          <Link className="button button-small" to="/login">Sign in</Link>
        )}
      </header>

      <Routes>
        <Route path="/" element={<JobList />} />
        <Route path="/jobs/:id" element={<JobDetail />} />
        <Route path="/login" element={<Login setAuth={setAuth} />} />
        <Route path="/register" element={<Register />} />
        <Route path="/applications" element={<MyApplications />} />
        <Route path="/recruiter" element={<RecruiterDashboard />} />
        <Route path="/menu/dashboard" element={<RecruiterDashboard />} />
        <Route path="/menu/dashboard/" element={<RecruiterDashboard />} />
        <Route path="/dashboard" element={<RecruiterDashboard />} />
        <Route path="/dashboard/" element={<RecruiterDashboard />} />
      </Routes>

      <Chatbot />
    </div>
  );
}

export default function App() {
  return <BrowserRouter><Layout /></BrowserRouter>;
}
