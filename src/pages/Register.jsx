import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Login.css';

const Register = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    department: '',
    password: '',
    confirmPassword: ''
  });

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');

    if (!formData.firstName.trim() || !formData.lastName.trim()) {
      setError('Please provide both first and last names.');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setSubmitting(true);
    try {
      const API_BASE = import.meta.env?.VITE_API_BASE_URL?.trim() || 'http://localhost:5000/api';
      const response = await fetch(`${API_BASE.replace(/\/$/, '')}/admins/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          firstName: formData.firstName.trim(),
          lastName: formData.lastName.trim(),
          email: formData.email.toLowerCase().trim(),
          phone: formData.phone.trim(),
          department: formData.department.trim(),
          password: formData.password
        })
      });

      const payload = await response.json().catch(() => null);
      if (!response.ok || payload?.success === false) {
        const validationMessages = Array.isArray(payload?.errors)
          ? payload.errors
              .map((err) => err?.msg || err?.message || '')
              .filter(Boolean)
              .join(' ')
          : '';
        const message = validationMessages || payload?.message || 'Registration failed';
        throw new Error(message.trim());
      }

      const admin = payload?.data?.admin || null;
      const token = payload?.data?.token || null;

      if (admin) {
        localStorage.setItem('user', JSON.stringify(admin));
      }
      if (token) {
        localStorage.setItem('authToken', token);
      }
      localStorage.setItem('isAuthenticated', 'true');

      navigate('/dashboard');
    } catch (err) {
      setError(err.message || 'Unable to register administrator.');
    } finally {
      setSubmitting(false);
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
            <h2>Create Admin</h2>
            <p>UMP NAV-APP</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="login-form">
          {error && <div className="error-message">{error}</div>}

          <div className="input-group">
            <input
              type="text"
              name="firstName"
              placeholder="FIRST NAME"
              value={formData.firstName}
              onChange={handleChange}
              required
              disabled={submitting}
              className="login-input"
            />
          </div>

          <div className="input-group">
            <input
              type="text"
              name="lastName"
              placeholder="LAST NAME"
              value={formData.lastName}
              onChange={handleChange}
              required
              disabled={submitting}
              className="login-input"
            />
          </div>

          <div className="input-group">
            <input
              type="email"
              name="email"
              placeholder="ADMIN EMAIL"
              value={formData.email}
              onChange={handleChange}
              required
              disabled={submitting}
              className="login-input"
            />
          </div>

          <div className="input-group">
            <input
              type="tel"
              name="phone"
              placeholder="CONTACT NUMBER"
              value={formData.phone}
              onChange={handleChange}
              required
              disabled={submitting}
              className="login-input"
            />
          </div>

          <div className="input-group">
            <input
              type="text"
              name="department"
              placeholder="DEPARTMENT"
              value={formData.department}
              onChange={handleChange}
              required
              disabled={submitting}
              className="login-input"
            />
          </div>

          <div className="input-group">
            <input
              type="password"
              name="password"
              placeholder="PASSWORD"
              value={formData.password}
              onChange={handleChange}
              required
              disabled={submitting}
              className="login-input"
            />
          </div>

          <div className="input-group">
            <input
              type="password"
              name="confirmPassword"
              placeholder="CONFIRM PASSWORD"
              value={formData.confirmPassword}
              onChange={handleChange}
              required
              disabled={submitting}
              className="login-input"
            />
          </div>

          <button type="submit" className="login-button" disabled={submitting}>
            {submitting ? 'CREATING ACCOUNT...' : 'REGISTER'}
          </button>

          <div className="admin-notice">
            <p>Already have an account? <a href="/login" style={{ color: '#1d4ed8', fontWeight: 600 }}>Log in</a>.</p>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Register;
