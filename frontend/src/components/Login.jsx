// src/components/Login.jsx
import { useState } from 'react';
import API from '../api';

export default function Login({ setAuth }) {
  const [credentials, setCredentials] = useState({ username: '', password: '' });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await API.post('auth/login/', credentials);
      localStorage.setItem('token', res.data.access);
      setAuth(true);
      alert('Login successful!');
    } catch {
      alert('Invalid credentials');
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ padding: '20px' }}>
      <h2>Login</h2>
      <input 
        type="text" 
        placeholder="Username" 
        onChange={(e) => setCredentials({ ...credentials, username: e.target.value })} 
      /><br/><br/>
      <input 
        type="password" 
        placeholder="Password" 
        onChange={(e) => setCredentials({ ...credentials, password: e.target.value })} 
      /><br/><br/>
      <button type="submit">Login</button>
    </form>
  );
}