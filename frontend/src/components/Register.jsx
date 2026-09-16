import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import API from '../api';

export default function Register() {
  const navigate = useNavigate();

  useEffect(() => {
    // Prevent stale or expired tokens from interfering with registration
    localStorage.removeItem('token');
    localStorage.removeItem('refresh');
  }, []);
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'job_seeker',
    // Job Seeker Details
    skills: '',
    experience_level: 'entry',
    // Recruiter Details
    company_name: '',
    designation: '',
    phone: '',
    // Hiring Manager Details
    department: 'Engineering',
    // Company Admin Details
    company_website: '',
    location: '',
    company_size: '11-50',
  });

  const [resumeFile, setResumeFile] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Available Roles Configuration
  const roles = [
    {
      id: 'job_seeker',
      label: 'Job Seeker',
      icon: '👨‍💻',
      desc: 'Apply for open positions',
      themeColor: '#1b4332',
      bgLight: '#f0fdf4',
      borderLight: '#86efac',
      badge: 'Candidate Hub',
      summary: 'Find verified tech roles, apply with 1-click, and test your resume fit with Jobi AI.',
    },
    {
      id: 'recruiter',
      label: 'Recruiter',
      icon: '🏢',
      desc: 'Post jobs & hire talent',
      themeColor: '#1d4ed8',
      bgLight: '#eff6ff',
      borderLight: '#93c5fd',
      badge: 'Talent Acquisition',
      summary: 'Publish new job opportunities, review applicants, and utilize AI screening.',
    },
    {
      id: 'hiring_manager',
      label: 'Hiring Manager',
      icon: '📋',
      desc: 'Review & interview candidates',
      themeColor: '#7c3aed',
      bgLight: '#faf5ff',
      borderLight: '#d8b4fe',
      badge: 'Hiring Decision Maker',
      summary: 'Evaluate pipeline candidates for your department and collaborate on interviews.',
    },
    {
      id: 'company_admin',
      label: 'Company Admin',
      icon: '🛡️',
      desc: 'Manage company settings',
      themeColor: '#0f172a',
      bgLight: '#f8fafc',
      borderLight: '#cbd5e1',
      badge: 'Executive & Admin',
      summary: 'Manage your organization profile, brand identity, and company-wide hiring permissions.',
    },
  ];

  const currentRole = roles.find((r) => r.id === formData.role) || roles[0];

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file && !file.name.toLowerCase().endsWith('.pdf') && file.type !== 'application/pdf') {
      setError('Please upload a valid PDF resume.');
      setResumeFile(null);
      return;
    }
    if (file && file.size > 10 * 1024 * 1024) {
      setError('Resume file size must be less than 10MB.');
      setResumeFile(null);
      return;
    }
    setError('');
    setResumeFile(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters long.');
      return;
    }

    // Role-specific validation
    if (['recruiter', 'hiring_manager', 'company_admin'].includes(formData.role) && !formData.company_name.trim()) {
      setError('Please provide your Company / Organization name.');
      return;
    }

    setLoading(true);

    const data = new FormData();
    data.append('username', formData.username);
    data.append('email', formData.email);
    data.append('password', formData.password);
    data.append('role', formData.role);

    // Append role-specific fields
    if (formData.role === 'job_seeker') {
      if (resumeFile) data.append('resume', resumeFile);
      if (formData.skills) data.append('skills', formData.skills);
      if (formData.experience_level) data.append('experience_level', formData.experience_level);
    } else if (formData.role === 'recruiter') {
      data.append('company_name', formData.company_name);
      if (formData.designation) data.append('designation', formData.designation);
      if (formData.phone) data.append('phone', formData.phone);
    } else if (formData.role === 'hiring_manager') {
      data.append('company_name', formData.company_name);
      data.append('department', formData.department);
      if (formData.designation) data.append('designation', formData.designation);
    } else if (formData.role === 'company_admin') {
      data.append('company_name', formData.company_name);
      if (formData.company_website) data.append('company_website', formData.company_website);
      if (formData.location) data.append('location', formData.location);
      if (formData.company_size) data.append('company_size', formData.company_size);
      if (formData.designation) data.append('designation', formData.designation);
      if (formData.phone) data.append('phone', formData.phone);
    }

    try {
      await API.post('auth/register/', data);

      if (formData.company_name) {
        localStorage.setItem('companyName', formData.company_name.trim());
      }
      if (formData.location) {
        localStorage.setItem('companyLocation', formData.location.trim());
      }

      navigate('/login', {
        state: {
          registered: true,
          message: `Account created successfully as ${currentRole.label}! Please sign in with your credentials.`,
          suggestedUsername: formData.username,
        },
      });
    } catch (err) {
      if (err.response && err.response.data) {
        const apiErrors = err.response.data;
        if (typeof apiErrors === 'string') {
          setError(apiErrors);
        } else if (apiErrors.detail) {
          setError(apiErrors.detail);
        } else {
          const firstKey = Object.keys(apiErrors)[0];
          const errorMsg = Array.isArray(apiErrors[firstKey]) ? apiErrors[firstKey][0] : apiErrors[firstKey];
          const fieldName = firstKey.replace(/_/g, ' ');
          setError(`${fieldName.charAt(0).toUpperCase() + fieldName.slice(1)}: ${errorMsg}`);
        }
      } else {
        const targetHost = err.config?.baseURL || 'backend server';
        const msg = err.message || (err.code ? `Error: ${err.code}` : 'Connection failed');
        setError(`Unable to connect to ${targetHost} (${msg}). If the free cloud server is waking up from sleep, please wait 30 seconds and tap Register again.`);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '88vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#f4f6f8',
      padding: '40px 20px',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    }}>
      <div style={{
        backgroundColor: '#ffffff',
        borderRadius: '16px',
        boxShadow: '0 10px 30px rgba(0, 0, 0, 0.06)',
        width: '100%',
        maxWidth: '560px',
        padding: '38px',
        border: '1px solid #e1e4e8',
      }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <div style={{
            display: 'inline-block',
            backgroundColor: '#1b4332',
            color: '#fff',
            fontWeight: 'bold',
            padding: '6px 14px',
            borderRadius: '8px',
            fontSize: '18px',
            marginBottom: '10px',
          }}>
            ❖ Jobi
          </div>
          <h2 style={{ fontSize: '24px', fontWeight: '700', color: '#111827', margin: '0 0 6px 0' }}>
            Get started with Jobi
          </h2>
          <p style={{ fontSize: '14px', color: '#6b7280', margin: 0 }}>
            Select your account type to configure your workspace
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <div style={{
            backgroundColor: '#fef2f2',
            color: '#991b1b',
            border: '1px solid #fecaca',
            borderRadius: '8px',
            padding: '12px 16px',
            fontSize: '13px',
            marginBottom: '20px',
          }}>
            ⚠️ {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
          {/* Dynamic 4-Role Selector */}
          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#374151', marginBottom: '8px' }}>
              Select Your Role:
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              {roles.map((r) => {
                const isSelected = formData.role === r.id;
                return (
                  <div
                    key={r.id}
                    onClick={() => setFormData({ ...formData, role: r.id })}
                    style={{
                      border: isSelected ? `2px solid ${r.themeColor}` : '1px solid #d1d5db',
                      backgroundColor: isSelected ? r.bgLight : '#fff',
                      borderRadius: '10px',
                      padding: '12px 10px',
                      textAlign: 'center',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      boxShadow: isSelected ? `0 0 0 3px ${r.borderLight}` : 'none',
                    }}
                  >
                    <div style={{ fontSize: '22px' }}>{r.icon}</div>
                    <div style={{ fontSize: '13px', fontWeight: '700', color: '#111827', marginTop: '4px' }}>
                      {r.label}
                    </div>
                    <div style={{ fontSize: '11px', color: '#6b7280', marginTop: '2px' }}>
                      {r.desc}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Dynamic Role Details Container */}
          <div style={{
            backgroundColor: currentRole.bgLight,
            border: `1px solid ${currentRole.borderLight}`,
            borderRadius: '12px',
            padding: '18px 16px',
            display: 'flex',
            flexDirection: 'column',
            gap: '14px',
            transition: 'all 0.25s ease',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: `1px solid ${currentRole.borderLight}`, paddingBottom: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '18px' }}>{currentRole.icon}</span>
                <span style={{ fontSize: '13px', fontWeight: '800', color: currentRole.themeColor, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  {currentRole.label} Details
                </span>
              </div>
              <span style={{ fontSize: '11px', fontWeight: '700', color: '#4b5563', backgroundColor: '#fff', padding: '3px 8px', borderRadius: '12px', border: '1px solid #e5e7eb' }}>
                {currentRole.badge}
              </span>
            </div>
            <p style={{ margin: 0, fontSize: '12px', color: '#4b5563', lineHeight: 1.4 }}>
              {currentRole.summary}
            </p>

            {/* 1. Job Seeker Details */}
            {formData.role === 'job_seeker' && (
              <>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#374151', marginBottom: '5px' }}>
                    Primary Skills / Expertise
                  </label>
                  <input
                    type="text"
                    name="skills"
                    value={formData.skills}
                    onChange={handleChange}
                    placeholder="e.g. React, Python, Django, SQL, REST APIs"
                    style={{
                      width: '100%',
                      padding: '9px 12px',
                      borderRadius: '6px',
                      border: '1px solid #cbd5e1',
                      fontSize: '13px',
                      outline: 'none',
                      boxSizing: 'border-box',
                      backgroundColor: '#fff',
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#374151', marginBottom: '5px' }}>
                    Experience Level
                  </label>
                  <select
                    name="experience_level"
                    value={formData.experience_level}
                    onChange={handleChange}
                    style={{
                      width: '100%',
                      padding: '9px 12px',
                      borderRadius: '6px',
                      border: '1px solid #cbd5e1',
                      fontSize: '13px',
                      outline: 'none',
                      boxSizing: 'border-box',
                      backgroundColor: '#fff',
                    }}
                  >
                    <option value="entry">Entry Level / Graduate (0-1 yrs)</option>
                    <option value="mid">Mid-Level (2-4 yrs)</option>
                    <option value="senior">Senior Level (5-8 yrs)</option>
                    <option value="lead">Lead / Principal (8+ yrs)</option>
                  </select>
                </div>

                <div style={{
                  backgroundColor: '#ffffff',
                  border: '2px dashed #86efac',
                  borderRadius: '8px',
                  padding: '14px',
                  textAlign: 'center',
                }}>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#1b4332', marginBottom: '6px' }}>
                    📄 Upload Resume (PDF)
                  </label>
                  <input
                    type="file"
                    accept=".pdf,application/pdf"
                    onChange={handleFileChange}
                    style={{ fontSize: '12px', color: '#4b5563', width: '100%' }}
                  />
                  {resumeFile && (
                    <div style={{ fontSize: '12px', color: '#166534', marginTop: '6px', fontWeight: '600' }}>
                      ✓ Selected: {resumeFile.name}
                    </div>
                  )}
                </div>
              </>
            )}

            {/* 2. Recruiter Details */}
            {formData.role === 'recruiter' && (
              <>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#374151', marginBottom: '5px' }}>
                    Company or Agency Name *
                  </label>
                  <input
                    type="text"
                    name="company_name"
                    required
                    value={formData.company_name}
                    onChange={handleChange}
                    placeholder="e.g. Apex Talent Solutions / Google"
                    style={{
                      width: '100%',
                      padding: '9px 12px',
                      borderRadius: '6px',
                      border: '1px solid #cbd5e1',
                      fontSize: '13px',
                      outline: 'none',
                      boxSizing: 'border-box',
                      backgroundColor: '#fff',
                    }}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#374151', marginBottom: '5px' }}>
                      Job Title / Role
                    </label>
                    <input
                      type="text"
                      name="designation"
                      value={formData.designation}
                      onChange={handleChange}
                      placeholder="e.g. Senior Recruiter"
                      style={{
                        width: '100%',
                        padding: '9px 12px',
                        borderRadius: '6px',
                        border: '1px solid #cbd5e1',
                        fontSize: '13px',
                        outline: 'none',
                        boxSizing: 'border-box',
                        backgroundColor: '#fff',
                      }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#374151', marginBottom: '5px' }}>
                      Contact Phone
                    </label>
                    <input
                      type="text"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      placeholder="e.g. +1 (555) 234-5678"
                      style={{
                        width: '100%',
                        padding: '9px 12px',
                        borderRadius: '6px',
                        border: '1px solid #cbd5e1',
                        fontSize: '13px',
                        outline: 'none',
                        boxSizing: 'border-box',
                        backgroundColor: '#fff',
                      }}
                    />
                  </div>
                </div>
              </>
            )}

            {/* 3. Hiring Manager Details */}
            {formData.role === 'hiring_manager' && (
              <>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#374151', marginBottom: '5px' }}>
                    Company Name *
                  </label>
                  <input
                    type="text"
                    name="company_name"
                    required
                    value={formData.company_name}
                    onChange={handleChange}
                    placeholder="e.g. Stripe, Acme Corp"
                    style={{
                      width: '100%',
                      padding: '9px 12px',
                      borderRadius: '6px',
                      border: '1px solid #cbd5e1',
                      fontSize: '13px',
                      outline: 'none',
                      boxSizing: 'border-box',
                      backgroundColor: '#fff',
                    }}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#374151', marginBottom: '5px' }}>
                      Department / Team
                    </label>
                    <select
                      name="department"
                      value={formData.department}
                      onChange={handleChange}
                      style={{
                        width: '100%',
                        padding: '9px 12px',
                        borderRadius: '6px',
                        border: '1px solid #cbd5e1',
                        fontSize: '13px',
                        outline: 'none',
                        boxSizing: 'border-box',
                        backgroundColor: '#fff',
                      }}
                    >
                      <option value="Engineering">Engineering & Tech</option>
                      <option value="Product">Product Management</option>
                      <option value="Data & AI">Data Science & AI</option>
                      <option value="Design">Design & UX</option>
                      <option value="Marketing">Marketing & Growth</option>
                      <option value="Sales">Sales & BD</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#374151', marginBottom: '5px' }}>
                      Management Title
                    </label>
                    <input
                      type="text"
                      name="designation"
                      value={formData.designation}
                      onChange={handleChange}
                      placeholder="e.g. Director of Eng"
                      style={{
                        width: '100%',
                        padding: '9px 12px',
                        borderRadius: '6px',
                        border: '1px solid #cbd5e1',
                        fontSize: '13px',
                        outline: 'none',
                        boxSizing: 'border-box',
                        backgroundColor: '#fff',
                      }}
                    />
                  </div>
                </div>
              </>
            )}

            {/* 4. Company Admin Details */}
            {formData.role === 'company_admin' && (
              <>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#374151', marginBottom: '5px' }}>
                    Organization / Company Name *
                  </label>
                  <input
                    type="text"
                    name="company_name"
                    required
                    value={formData.company_name}
                    onChange={handleChange}
                    placeholder="e.g. TechNova Technologies Inc."
                    style={{
                      width: '100%',
                      padding: '9px 12px',
                      borderRadius: '6px',
                      border: '1px solid #cbd5e1',
                      fontSize: '13px',
                      outline: 'none',
                      boxSizing: 'border-box',
                      backgroundColor: '#fff',
                    }}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#374151', marginBottom: '5px' }}>
                      Company Website
                    </label>
                    <input
                      type="url"
                      name="company_website"
                      value={formData.company_website}
                      onChange={handleChange}
                      placeholder="https://example.com"
                      style={{
                        width: '100%',
                        padding: '9px 12px',
                        borderRadius: '6px',
                        border: '1px solid #cbd5e1',
                        fontSize: '13px',
                        outline: 'none',
                        boxSizing: 'border-box',
                        backgroundColor: '#fff',
                      }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#374151', marginBottom: '5px' }}>
                      Company Size
                    </label>
                    <select
                      name="company_size"
                      value={formData.company_size}
                      onChange={handleChange}
                      style={{
                        width: '100%',
                        padding: '9px 12px',
                        borderRadius: '6px',
                        border: '1px solid #cbd5e1',
                        fontSize: '13px',
                        outline: 'none',
                        boxSizing: 'border-box',
                        backgroundColor: '#fff',
                      }}
                    >
                      <option value="1-10">1-10 Employees (Startup)</option>
                      <option value="11-50">11-50 Employees</option>
                      <option value="51-200">51-200 Employees</option>
                      <option value="201-1000">201-1,000 Employees</option>
                      <option value="1000+">1,000+ Enterprise</option>
                    </select>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#374151', marginBottom: '5px' }}>
                      Admin Management Title
                    </label>
                    <input
                      type="text"
                      name="designation"
                      value={formData.designation}
                      onChange={handleChange}
                      placeholder="e.g. Founder & CEO / VP HR"
                      style={{
                        width: '100%',
                        padding: '9px 12px',
                        borderRadius: '6px',
                        border: '1px solid #cbd5e1',
                        fontSize: '13px',
                        outline: 'none',
                        boxSizing: 'border-box',
                        backgroundColor: '#fff',
                      }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#374151', marginBottom: '5px' }}>
                      Admin Contact Phone
                    </label>
                    <input
                      type="text"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      placeholder="e.g. +1 (555) 019-2834"
                      style={{
                        width: '100%',
                        padding: '9px 12px',
                        borderRadius: '6px',
                        border: '1px solid #cbd5e1',
                        fontSize: '13px',
                        outline: 'none',
                        boxSizing: 'border-box',
                        backgroundColor: '#fff',
                      }}
                    />
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#374151', marginBottom: '5px' }}>
                    Headquarters / Location
                  </label>
                  <input
                    type="text"
                    name="location"
                    value={formData.location}
                    onChange={handleChange}
                    placeholder="e.g. San Francisco, CA / Remote"
                    style={{
                      width: '100%',
                      padding: '9px 12px',
                      borderRadius: '6px',
                      border: '1px solid #cbd5e1',
                      fontSize: '13px',
                      outline: 'none',
                      boxSizing: 'border-box',
                      backgroundColor: '#fff',
                    }}
                  />
                </div>
              </>
            )}
          </div>

          {/* Username Input */}
          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#374151', marginBottom: '6px' }}>
              Username
            </label>
            <input
              type="text"
              name="username"
              required
              value={formData.username}
              onChange={handleChange}
              placeholder="e.g. jayaganesh"
              style={{
                width: '100%',
                padding: '10px 14px',
                borderRadius: '8px',
                border: '1px solid #d1d5db',
                fontSize: '14px',
                outline: 'none',
                boxSizing: 'border-box',
              }}
            />
          </div>

          {/* Email Input */}
          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#374151', marginBottom: '6px' }}>
              Email Address
            </label>
            <input
              type="email"
              name="email"
              required
              value={formData.email}
              onChange={handleChange}
              placeholder="name@example.com"
              style={{
                width: '100%',
                padding: '10px 14px',
                borderRadius: '8px',
                border: '1px solid #d1d5db',
                fontSize: '14px',
                outline: 'none',
                boxSizing: 'border-box',
              }}
            />
          </div>

          {/* Password Input */}
          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#374151', marginBottom: '6px' }}>
              Password
            </label>
            <input
              type="password"
              name="password"
              required
              value={formData.password}
              onChange={handleChange}
              placeholder="Min. 8 characters"
              style={{
                width: '100%',
                padding: '10px 14px',
                borderRadius: '8px',
                border: '1px solid #d1d5db',
                fontSize: '14px',
                outline: 'none',
                boxSizing: 'border-box',
              }}
            />
          </div>

          {/* Confirm Password Input */}
          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#374151', marginBottom: '6px' }}>
              Confirm Password
            </label>
            <input
              type="password"
              name="confirmPassword"
              required
              value={formData.confirmPassword}
              onChange={handleChange}
              placeholder="Re-enter password"
              style={{
                width: '100%',
                padding: '10px 14px',
                borderRadius: '8px',
                border: '1px solid #d1d5db',
                fontSize: '14px',
                outline: 'none',
                boxSizing: 'border-box',
              }}
            />
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            style={{
              backgroundColor: currentRole.themeColor || '#1b4332',
              color: '#ffffff',
              padding: '13px',
              border: 'none',
              borderRadius: '8px',
              fontWeight: '700',
              fontSize: '15px',
              cursor: loading ? 'not-allowed' : 'pointer',
              marginTop: '4px',
              transition: 'background-color 0.2s',
            }}
          >
            {loading ? 'Creating account...' : `Create ${currentRole.label} Account`}
          </button>
        </form>

        {/* Footer */}
        <div style={{ textAlign: 'center', marginTop: '24px', fontSize: '14px', color: '#6b7280' }}>
          Already have a Jobi account?{' '}
          <Link to="/login" style={{ color: '#1b4332', fontWeight: '600', textDecoration: 'none' }}>
            Sign in
          </Link>
        </div>
      </div>
    </div>
  );
}