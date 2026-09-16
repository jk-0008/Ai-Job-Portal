import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import API from '../api';
import jobiIcon from '../assets/jobi-icon.jpg';

export default function Login({ setAuth }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [username, setUsername] = useState(location.state?.suggestedUsername || '');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage] = useState(location.state?.message || '');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!username.trim() || !password) {
      setErrorMessage('Please enter both username and password.');
      return;
    }

    setLoading(true);
    setErrorMessage('');

    try {
      const res = await API.post('auth/login/', {
        username: username.trim(),
        password,
      });

      localStorage.setItem('token', res.data.access);
      if (res.data.refresh) {
        localStorage.setItem('refresh', res.data.refresh);
      }
      if (res.data.role) {
        localStorage.setItem('userRole', res.data.role);
      }
      if (res.data.username) {
        localStorage.setItem('username', res.data.username);
      }
      if (res.data.company_name) {
        localStorage.setItem('companyName', res.data.company_name);
      }
      if (res.data.location) {
        localStorage.setItem('companyLocation', res.data.location);
      }
      if (res.data.department) {
        localStorage.setItem('userDepartment', res.data.department);
      }
      if (res.data.designation) {
        localStorage.setItem('userDesignation', res.data.designation);
      }

      if (setAuth) {
        setAuth(true);
      }

      if (['recruiter', 'hiring_manager', 'company_admin'].includes(res.data.role)) {
        navigate('/recruiter');
      } else {
        navigate('/');
      }
    } catch (err) {
      if (err.response && err.response.status === 401) {
        setErrorMessage('Invalid username or password. Please try again.');
      } else if (err.response?.data?.detail) {
        setErrorMessage(err.response.data.detail);
      } else {
        setErrorMessage('Unable to connect to the server. If using the free cloud backend, it may be waking up from sleep (takes ~45-60 seconds on Render). Please wait a moment and try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="auth-page">
      <div className="auth-split-wrapper">
        {/* Left Panel: Deep Green Brand Showcase */}
        <aside className="auth-brand-side">
          <div>
            <div className="auth-badge">
              <span>◈</span> Jobi Intelligence
            </div>

            <h1 className="auth-headline">
              Put your next move in motion.
            </h1>

            <p className="auth-subtext">
              Apply with confidence, track every conversation, and get AI-powered insights tailored to your career trajectory.
            </p>

            <ul className="auth-benefits">
              <li>
                <span className="auth-benefit-icon">✓</span>
                <span>Tailored job matching based on your real resume skills</span>
              </li>
              <li>
                <span className="auth-benefit-icon">✓</span>
                <span>Live status tracking for each application & hiring stage</span>
              </li>
              <li>
                <span className="auth-benefit-icon">✓</span>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '7px' }}>
                  <img src={jobiIcon} alt="Jobi AI" style={{ width: '18px', height: '18px', borderRadius: '50%', objectFit: 'cover', border: '1px solid rgba(59, 130, 246, 0.5)' }} />
                  Instant interview & resume feedback from Jobi AI
                </span>
              </li>
            </ul>
          </div>

          <div className="auth-brand-footer">
            © Jobi Portal • Designed for modern talent and top employers
          </div>
        </aside>

        {/* Right Panel: Clean Sign-In Form */}
        <section className="auth-form-side">
          <div className="auth-form-header">
            <span className="auth-category">Welcome Back</span>
            <h2>Sign in to your account</h2>
            <p>Access your applications, saved roles, and recruiter alerts.</p>
          </div>

          {successMessage && !errorMessage && (
            <div className="auth-success-banner" role="status">
              <span>✓</span>
              <div>{successMessage}</div>
            </div>
          )}

          {errorMessage && (
            <div className="auth-error-banner" role="alert">
              <span>⚠️</span>
              <div>{errorMessage}</div>
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate>
            <div className="form-group">
              <label htmlFor="username">Username or Email</label>
              <input
                id="username"
                name="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="e.g. candidate or recruiter"
                required
                autoComplete="username"
              />
            </div>

            <div className="form-group">
              <label htmlFor="password">Password</label>
              <div className="password-field-wrapper">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  required
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  className="pwd-toggle-btn"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? 'Hide' : 'Show'}
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="auth-submit-btn"
              disabled={loading}
            >
              {loading ? 'Signing in…' : 'Sign in to Jobi →'}
            </button>
          </form>

          <div className="auth-footer">
            <span>
              New here? <Link to="/register">Create an account</Link>
            </span>
            <Link to="/" className="auth-back-link">
              ← Back to jobs
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}