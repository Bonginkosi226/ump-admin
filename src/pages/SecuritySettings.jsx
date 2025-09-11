import React, { useState, useEffect } from 'react';
import { ArrowLeft, Shield, Clock, Info } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import './SecuritySettings.css';

const SecuritySettings = () => {
  const navigate = useNavigate();
  const [sessionTimeout, setSessionTimeout] = useState(true);
  const [timeoutMinutes] = useState(10);
  const [lastActivity, setLastActivity] = useState(Date.now());

  // Session timeout logic
  useEffect(() => {
    if (!sessionTimeout) return;

    const checkActivity = () => {
      const now = Date.now();
      const timeSinceLastActivity = now - lastActivity;
      const timeoutMs = timeoutMinutes * 60 * 1000;

      if (timeSinceLastActivity >= timeoutMs) {
        // Auto logout
        localStorage.removeItem('isAuthenticated');
        navigate('/login');
      }
    };

    // Check every minute
    const interval = setInterval(checkActivity, 60000);

    // Update last activity on user interaction
    const updateActivity = () => {
      setLastActivity(Date.now());
    };

    // Add event listeners for user activity
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
    events.forEach(event => {
      document.addEventListener(event, updateActivity, true);
    });

    return () => {
      clearInterval(interval);
      events.forEach(event => {
        document.removeEventListener(event, updateActivity, true);
      });
    };
  }, [sessionTimeout, lastActivity, timeoutMinutes, navigate]);

  const handleSessionTimeoutToggle = () => {
    setSessionTimeout(!sessionTimeout);
    // Save preference to localStorage
    localStorage.setItem('sessionTimeoutEnabled', (!sessionTimeout).toString());
  };

  // Load saved preferences on component mount
  useEffect(() => {
    const savedTimeout = localStorage.getItem('sessionTimeoutEnabled');
    if (savedTimeout !== null) {
      setSessionTimeout(savedTimeout === 'true');
    }
  }, []);

  return (
    <div className="security-settings-page">
      <div className="page-header">
        <button className="back-button" onClick={() => navigate('/settings')}>
          <ArrowLeft size={24} />
        </button>
        <h1>Security Settings</h1>
      </div>
      
      <div className="security-settings-content">
        <div className="security-option">
          <div className="option-info">
            <div className="option-header">
              <Shield className="option-icon" size={24} />
              <span className="option-title">Session Timeout</span>
            </div>
            
            <div className="toggle-container">
              <label className="toggle-switch">
                <input
                  type="checkbox"
                  checked={sessionTimeout}
                  onChange={handleSessionTimeoutToggle}
                />
                <span className="toggle-slider"></span>
              </label>
            </div>
          </div>
          
          <div className="option-description">
            <div className="description-content">
              <Info className="info-icon" size={20} />
              <span className="description-text">
                auto-logout after {timeoutMinutes} mins of inactivity
              </span>
            </div>
          </div>
        </div>
        
        {sessionTimeout && (
          <div className="timeout-info">
            <Clock className="clock-icon" size={16} />
            <span>Session will automatically end after {timeoutMinutes} minutes of inactivity</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default SecuritySettings;