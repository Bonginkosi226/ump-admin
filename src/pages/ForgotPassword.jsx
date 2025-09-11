import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Mail } from 'lucide-react';
import './ForgotPassword.css';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = (e) => {
    e.preventDefault();
    if (email) {
      // In a real app, this would send a password reset email
      setIsSubmitted(true);
    }
  };

  const handleBackToLogin = () => {
    navigate('/login');
  };

  if (isSubmitted) {
    return (
      <div className="forgot-password-container">
        <div className="forgot-password-card">
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
          
          <div className="success-message">
            <div className="success-icon">
              <Mail size={48} />
            </div>
            <h3>Check your email</h3>
            <p>We've sent a password reset link to <strong>{email}</strong></p>
            <p className="instruction">Click the link in the email to reset your password. If you don't see the email, check your spam folder.</p>
            
            <button 
              type="button" 
              className="back-to-login-btn"
              onClick={handleBackToLogin}
            >
              Back to Login
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="forgot-password-container">
      <div className="forgot-password-card">
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
        
        <div className="forgot-password-content">
          <button 
            type="button" 
            className="back-button"
            onClick={handleBackToLogin}
          >
            <ArrowLeft size={20} />
          </button>
          
          <h3 className="forgot-title">Forgot Password?</h3>
          <p className="forgot-description">
            Enter your email address and we'll send you a link to reset your password.
          </p>
          
          <form onSubmit={handleSubmit} className="forgot-password-form">
            <div className="input-group">
              <input
                type="email"
                placeholder="Enter your email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="forgot-input"
                required
              />
            </div>
            
            <button type="submit" className="reset-button">
              Send Reset Link
            </button>
          </form>
          
          <div className="back-to-login">
            <span>Remember your password? </span>
            <button 
              type="button" 
              className="login-link"
              onClick={handleBackToLogin}
            >
              Back to Login
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;