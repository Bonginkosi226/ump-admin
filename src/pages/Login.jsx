import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import apiService from '../services/api';
import './Login.css';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
  e.preventDefault();
  setLoading(true);
  setError('');

  try {
    // ⚠️ Skip API validation, just log user in
    localStorage.setItem('isAuthenticated', 'true');
    localStorage.setItem('adminToken', 'dummy-token');
    localStorage.setItem('adminUser', JSON.stringify({ email }));

    navigate('/dashboard');
  } catch (err) {
    setError('Something went wrong.');
  } finally {
    setLoading(false);
  }
};

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="logo-section">
          <div className="university-logo">
            <div className="logo-shield">
              <div className="shield-quarter yellow"></div>
              <div className="shield-quarter red"></div>
              <div className="shield-quarter green"></div>
              <div className="shield-quarter blue"></div>
            </div>
          </div>
          <h1 className="university-name">UNIVERSITY OF<br />MPUMALANGA</h1>
          <div className="admin-section">
            <h2>Admin</h2>
            <p>UMP NAV-APP</p>
          </div>
        </div>
        
        <form onSubmit={handleSubmit} className="login-form">
          {error && (
            <div className="error-message">
              {error}
            </div>
          )}
          
          <div className="input-group">
            <input
              type="email"
              placeholder="ADMIN EMAIL"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="login-input"
              required
              disabled={loading}
            />
          </div>
          
          <div className="input-group">
            <input
              type="password"
              placeholder="PASSWORD"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="login-input"
              required
              disabled={loading}
            />
          </div>
          
          <button type="submit" className="login-button" disabled={loading}>
            {loading ? 'LOGGING IN...' : 'LOGIN'}
          </button>
          
          <div className="admin-notice">
            <p>Access restricted to authorized administrators only</p>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Login;