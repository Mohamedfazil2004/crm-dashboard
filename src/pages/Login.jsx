import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, password })
      });

      const data = await response.json();

      if (response.ok) {
        // Login successful
        setSuccess("Login Successful! Redirecting...");
        login(data.user, data.access_token, data.refresh_token);

        const role = data.user.role;
        const team = data.user.team;
        const empId = data.user.id;

        // Delay redirect slightly to show success message
        setTimeout(() => {
          if (role === 'Admin') {
            navigate('/admin-dashboard');
          } else if (role === 'Manager') {
            navigate('/dashboard');
          } else if (role === 'Team Lead') {
            if (team === 'Website') navigate('/website-team');
            else if (team === 'Branding') navigate('/branding-team');
            else if (team === 'SEO') navigate('/seo-team');
            else if (team === 'Campaign') navigate('/campaign-team');
            else if (team === 'Telecaller') navigate('/telecaller-team');
            else navigate('/team-members');
          } else {
            // Assume any other role (e.g., "Video Editor", "Graphic Designer", "Employee") is an Employee
            navigate(`/employee-profile/${empId}`);
          }
        }, 1500);

      } else {
        setError(data.message || "Invalid email or password");
      }
    } catch (err) {
      console.error("Login catch block error:", err);
      setError("Network error. Please ensure the backend is running at http://127.0.0.1:5000");
    }
  };

  return (
    <div className="container" style={{ maxWidth: '400px', marginTop: '100px', textAlign: 'center' }}>
      <h1 style={{ color: '#007bff' }}>Reach Skyline CRM</h1>
      <h3 style={{ marginBottom: '20px', color: '#666' }}>Sign In</h3>

      {error && <div style={{ color: 'red', marginBottom: '10px', fontWeight: 'bold' }}>❌ {error}</div>}
      {success && <div style={{ color: '#28a745', marginBottom: '10px', fontWeight: 'bold' }}>✅ {success}</div>}

      <form onSubmit={handleLogin} className="form-section" style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
        <input
          type="email"
          placeholder="Email Address"
          value={email}
          onChange={e => setEmail(e.target.value)}
          required
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          required
        />
        <button type="submit" style={{ marginTop: '10px' }} disabled={!!success}>
          {success ? 'Success!' : 'Login'}
        </button>
      </form>
    </div>
  );
};

export default Login;