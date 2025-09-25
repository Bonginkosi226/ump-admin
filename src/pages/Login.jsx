import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './Login.css';
import bcrypt from 'bcryptjs';

const DEMO_EMAIL = 'ncube@company.com';
const DEMO_PASSWORD = '12345';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showConfetti, setShowConfetti] = useState(false); // UI-only success gimmick watcher
  const navigate = useNavigate();

  // --- NEW: derive a simple password strength score (UI only) ---
  const passwordStrength = (() => {
    if (!password) return 0;
    let score = 0;
    if (password.length >= 5) score += 1;
    if (/[A-Z]/.test(password)) score += 1;
    if (/[0-9]/.test(password)) score += 1;
    if (/[^A-Za-z0-9]/.test(password)) score += 1;
    return score; // 0..4
  })();

  // --- NEW: watch localStorage isAuthenticated and show a temporary confetti-like banner (UI only) ---
  useEffect(() => {
    const onStorage = () => {
      try {
        const flag = localStorage.getItem('isAuthenticated') === 'true';
        if (flag) {
          setShowConfetti(true);
          setTimeout(() => setShowConfetti(false), 2200);
        }
      } catch (e) {
        // ignore
      }
    };

    // run once (in case login happened this session)
    onStorage();

    // attach listener (in case other tabs set it)
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const handleSubmit = async (e) => {
  e.preventDefault();
  setLoading(true);
  setError('');

  try {
    let admin = null;
    let passwordMatches = false;

    // --------- Try Database First ---------
    try {
      const response = await fetch('/api/admins');
      if (response.ok) {
        const admins = await response.json();
        admin = admins.find(
          (a) => a.email.toLowerCase() === email.toLowerCase()
        );

        if (admin) {
          passwordMatches = await bcrypt.compare(password, admin.password);
        }
      } else {
        console.warn("⚠️ DB request failed, will try fallback");
      }
    } catch (dbErr) {
      console.warn("⚠️ Could not reach DB, will try fallback", dbErr);
    }

    // --------- Fallback to Demo Admin ---------
    if (!admin || !passwordMatches) {
      if (email.toLowerCase() === DEMO_EMAIL && password === DEMO_PASSWORD) {
        admin = {
          _id: "demo-123",
          email: DEMO_EMAIL,
          name: "Bassline",
          surname: "Ncube",
          department: "Demo Department",
        };
        passwordMatches = true;
      }
    }

    // --------- Final Check ---------
    if (!admin || !passwordMatches) {
      setError("Invalid email or password!");
      return;
    }

    // Store & redirect
    localStorage.setItem('isAuthenticated', 'true');
    localStorage.setItem('user', JSON.stringify(admin));
    navigate('/dashboard');

  } catch (err) {
    setError(`Login failed: ${err.message}`);
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

        {/* --- NEW: Demo / hint area (UI-only; doesn't alter auth) --- */}
        {/* --- 
        <div className="demo-hint" style={{ margin: '0 16px 12px', fontSize: '13px', color: '#666' }}>
          <strong>Demo admin:</strong> {DEMO_EMAIL} <span style={{ opacity: 0.85 }}>•</span> <em>password:</em> {DEMO_PASSWORD}
          <div style={{ marginTop: 6 }}>
            <small>Tip: this UI shows strength and a preview avatar when you type the demo email — purely cosmetic.</small>
          </div>
        </div> --- */}


        <form onSubmit={handleSubmit} className="login-form">
          {error && <div className="error-message">{error}</div>}

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

          {/* --- NEW: Password strength bar (UI-only) --- */}
          <div className="password-strength" style={{ padding: '0 6px 12px' }}>
            <div style={{ fontSize: 12, marginBottom: 6, color: '#555' }}>
              Password strength:
              {' '}
              {passwordStrength === 0 && <span style={{ opacity: 0.7 }}>Empty</span>}
              {passwordStrength === 1 && <span>Weak</span>}
              {passwordStrength === 2 && <span>Okay</span>}
              {passwordStrength === 3 && <span>Good</span>}
              {passwordStrength === 4 && <span>Strong</span>}
            </div>
            <div className="strength-bar" style={{ height: 6, background: '#eee', borderRadius: 6, overflow: 'hidden' }}>
              <div
                style={{
                  width: `${(passwordStrength / 4) * 100}%`,
                  height: '100%',
                  transition: 'width 220ms ease',
                  background: 'linear-gradient(90deg, rgba(0,0,0,0.12), rgba(0,0,0,0.08))'
                }}
              />
            </div>
          </div>

          {/* --- NEW: small "user preview" gimmick when demo email is typed (UI-only) --- */}
          {email.toLowerCase() === DEMO_EMAIL && (
            <div className="user-preview" style={{ display: 'flex', gap: 10, alignItems: 'center', padding: '8px 12px' }}>
              <div
                className="avatar"
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 8,
                  background: '#222',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#fff',
                  fontWeight: 700
                }}
              >
                N
              </div>
              <div style={{ fontSize: 13 }}>
                <div style={{ fontWeight: 700 }}>Bassline Ncube</div>
                <div style={{ fontSize: 12, color: '#666' }}>Last login: Sep 22, 2025 • 14:12</div>
              </div>
            </div>
          )}

          <button type="submit" className="login-button" disabled={loading}>
            {loading ? 'LOGGING IN...' : 'LOGIN'}
          </button>

          <div className="admin-notice">
            <p>Access restricted to authorized administrators only</p>
          </div>
        </form>

        {/* --- NEW: temporary confetti-like banner when localStorage shows authenticated (UI-only) --- */}
        {showConfetti && (
          <div className="confetti-banner" style={{
            marginTop: 12,
            padding: 10,
            background: 'linear-gradient(90deg,#e6ffe6,#e6f7ff)',
            borderRadius: 8,
            textAlign: 'center',
            fontWeight: 700
          }}>
            🎉 Login successful — redirecting...
          </div>
        )}

        {/* --- NEW: subtle footer gimmicks (UI only) --- */}
        <div style={{ marginTop: 12, padding: '0 12px 20px', fontSize: 12, color: '#777' }}>
          <div>Login gimmicks enabled: <em>strength meter, demo preview, success banner</em></div>
          <div style={{ marginTop: 6 }}>System logs are visible in console for deep debugging.</div>
        </div>
      </div>
    </div>
  );
};

export default Login;
