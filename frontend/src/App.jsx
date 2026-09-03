// src/App.jsx
import { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import Login from './components/Login';
import JobList from './components/JobList';
import Chatbot from './components/Chatbot';
import RecruiterDashboard from './components/RecruiterDashboard';

export default function App() {
  const [auth, setAuth] = useState(!!localStorage.getItem('token'));

  return (
    <Router>
      <nav style={{ padding: '10px', background: '#f4f4f4', marginBottom: '20px' }}>
        <Link to="/" style={{ marginRight: '10px' }}>Jobs</Link>
        <Link to="/recruiter" style={{ marginRight: '10px' }}>Recruiter Dashboard</Link>
        {!auth && <Link to="/login">Login</Link>}
      </nav>

      <Routes>
        <Route path="/" element={<JobList />} />
        <Route path="/login" element={<Login setAuth={setAuth} />} />
        <Route path="/recruiter" element={<RecruiterDashboard />} />
      </Routes>

      <Chatbot />
    </Router>
  );
}