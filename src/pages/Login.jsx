import React, { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Lock, Mail, ShieldCheck, X } from 'lucide-react';
import apiService from '../services/api';
import './Login.css';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [loading, setLoading] = useState(false);
  const [forgotModalOpen, setForgotModalOpen] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotMessage, setForgotMessage] = useState({ type: 'info', text: '' });
  const [forgotLoading, setForgotLoading] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    try {
      const storedEmail = localStorage.getItem('rememberedAdminEmail');
      if (storedEmail) {
        setEmail(storedEmail);
        setRememberMe(true);
      }
    } catch (storageError) {
      console.warn('Unable to load remembered credentials:', storageError);
    }
  }, []);

  useEffect(() => {
    const reason = location.state?.reason;
    if (!reason) return;

    if (reason === 'timeout') {
      setInfo('Your session expired due to inactivity. Please log in again.');
    } else if (reason === 'logout') {
      setInfo('You have been signed out. Please log in to continue.');
    }

    const timer = window.setTimeout(() => setInfo(''), 8000);
    return () => window.clearTimeout(timer);
  }, [location.state]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setInfo('');

    const trimmedEmail = email.trim();
    if (!trimmedEmail || !password) {
      setError('Enter both email address and password to continue.');
      return;
    }

    setLoading(true);
    try {
      const result = await apiService.loginAdmin({ email: trimmedEmail, password });
      if (!result.success) {
        throw new Error(result.message || 'Invalid email or password');
      }

      if (rememberMe) {
        localStorage.setItem('rememberedAdminEmail', trimmedEmail);
      } else {
        localStorage.removeItem('rememberedAdminEmail');
      }

      navigate('/dashboard', { replace: true });
    } catch (err) {
      setError(`Login failed: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const togglePasswordVisibility = () => setShowPassword((prev) => !prev);
  const handleForgotPassword = () => {
    setForgotModalOpen(true);
    setForgotMessage({ type: 'info', text: '' });
    setForgotEmail(email || '');
  };
  const handleRememberMeChange = (event) => setRememberMe(event.target.checked);

  const closeForgotModal = () => {
    if (forgotLoading) return;
    setForgotModalOpen(false);
    setForgotEmail('');
    setForgotMessage({ type: 'info', text: '' });
  };

  const handleForgotSubmit = async (event) => {
    event.preventDefault();
    const candidateEmail = forgotEmail.trim().toLowerCase();

    if (!candidateEmail) {
      setForgotMessage({ type: 'error', text: 'Please enter the email address you use to sign in.' });
      return;
    }

    setForgotLoading(true);
    setForgotMessage({ type: 'info', text: '' });

    const API_BASE = import.meta.env?.VITE_API_BASE_URL?.trim() || 'http://localhost:5000/api';
    const baseUrl = API_BASE.replace(/\/$/, '');

    try {
      const checkRes = await fetch(`${baseUrl}/admins/check-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: candidateEmail })
      });

      const checkPayload = await checkRes.json().catch(() => null);
      if (!checkRes.ok || !checkPayload?.success) {
        throw new Error(checkPayload?.message || 'Unable to verify this email. Please try again.');
      }

      if (!checkPayload.exists) {
        setForgotMessage({ type: 'error', text: 'No administrator account is registered with that email address.' });
        setForgotLoading(false);
        return;
      }

      const forgotRes = await fetch(`${baseUrl}/admins/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: candidateEmail })
      });

      const forgotPayload = await forgotRes.json().catch(() => null);
      if (!forgotRes.ok || !forgotPayload?.success) {
        throw new Error(forgotPayload?.message || 'Unable to send reset instructions. Please try again later.');
      }

      setForgotMessage({ type: 'success', text: 'Password reset instructions have been emailed to you.' });
    } catch (resetError) {
      setForgotMessage({ type: 'error', text: resetError.message || 'Something went wrong. Please try again.' });
    } finally {
      setForgotLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-wrapper">
        <aside className="login-aside">
          <div>
            <div className="login-badge">
              <ShieldCheck size={24} aria-hidden="true" />
              <span>UMP Admin Portal</span>
            </div>
            <h1>Lead your campus with confidence</h1>
            <p>
              Manage navigation data, coordinate building updates, and keep students informed from a
              secure dashboard.
            </p>
          </div>

          <ul className="login-highlights">
            <li>Modern security with automatic session timeouts</li>
            <li>Access from any authorised device</li>
            <li>Centralised admin tools in one place</li>
          </ul>
        </aside>

        <main className="login-main">
          <div className="login-card">
            <header className="login-header">
              <h2>Sign in</h2>
              <p>Use your university administrator credentials to continue.</p>
            </header>

            <form className="login-form" onSubmit={handleSubmit} noValidate>
              {info && (
                <div className="alert alert--info" role="status">
                  {info}
                </div>
              )}

              {error && (
                <div className="alert alert--error" role="alert">
                  {error}
                </div>
              )}

              <div className="input-field">
                <label htmlFor="admin-email">Email address</label>
                <div className="input-wrapper">
                  <Mail size={18} className="input-icon" aria-hidden="true" />
                  <input
                    id="admin-email"
                    type="email"
                    autoComplete="email"
                    inputMode="email"
                    placeholder="name.surname@ump.ac.za"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    disabled={loading}
                    required
                  />
                </div>
              </div>

              <div className="input-field">
                <label htmlFor="admin-password">Password</label>
                <div className="input-wrapper">
                  <Lock size={18} className="input-icon" aria-hidden="true" />
                  <input
                    id="admin-password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    disabled={loading}
                    required
                  />
                  <button
                    type="button"
                    className="toggle-password"
                    onClick={togglePasswordVisibility}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    title={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <div className="login-actions">
                <label className="remember-me">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={handleRememberMeChange}
                    disabled={loading}
                  />
                  Remember me
                </label>

                <button
                  type="button"
                  className="link-button"
                  onClick={handleForgotPassword}
                >
                  Forgot password?
                </button>
              </div>

              <button type="submit" className="login-submit" disabled={loading}>
                {loading ? 'Signing in…' : 'Sign in'}
              </button>
            </form>

            <footer className="login-footer">
              <p>
                Need access?{' '}
                <Link to="/register">
                  Request an administrator account
                </Link>
              </p>
              <small>Access is restricted to authorised university staff.</small>
            </footer>
          </div>
        </main>
      </div>

      {forgotModalOpen && (
        <div className="modal-overlay" role="dialog" aria-modal="true" aria-labelledby="forgot-password-title">
          <div className="modal-card">
            <button className="modal-close" type="button" onClick={closeForgotModal} aria-label="Close dialog">
              <X size={20} />
            </button>
            <h3 id="forgot-password-title">Reset your password</h3>
            <p className="modal-description">
              Enter the email you use to sign in. We&apos;ll let you know if the account exists and send reset instructions.
            </p>

            {forgotMessage.text && (
              <div className={`modal-alert modal-alert--${forgotMessage.type}`} role="alert">
                {forgotMessage.text}
              </div>
            )}

            <form className="modal-form" onSubmit={handleForgotSubmit}>
              <label htmlFor="forgot-email">Email address</label>
              <input
                id="forgot-email"
                type="email"
                value={forgotEmail}
                onChange={(event) => setForgotEmail(event.target.value)}
                placeholder="name.surname@ump.ac.za"
                disabled={forgotLoading}
                required
                autoFocus
              />

              <div className="modal-actions">
                <button type="button" className="modal-button modal-button--ghost" onClick={closeForgotModal} disabled={forgotLoading}>
                  Cancel
                </button>
                <button type="submit" className="modal-button" disabled={forgotLoading}>
                  {forgotLoading ? 'Sending…' : 'Send reset link'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Login;
