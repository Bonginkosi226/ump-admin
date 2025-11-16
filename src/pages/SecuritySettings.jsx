import React, { useState, useEffect } from 'react';
import { ArrowLeft, Shield, Clock, Info } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import apiService, { SESSION_TIMEOUT_CONSTANTS } from '../services/api';
import './SecuritySettings.css';

const {
  ENABLED_KEY,
  MINUTES_KEY,
  DEFAULT_MINUTES
} = SESSION_TIMEOUT_CONSTANTS;

const SecuritySettings = () => {
  const navigate = useNavigate();
  const [sessionTimeoutEnabled, setSessionTimeoutEnabled] = useState(true);
  const [timeoutMinutes, setTimeoutMinutes] = useState(DEFAULT_MINUTES);

  const handleSessionTimeoutToggle = () => {
    const nextEnabled = !sessionTimeoutEnabled;
    setSessionTimeoutEnabled(nextEnabled);
    localStorage.setItem(ENABLED_KEY, nextEnabled.toString());

    if (nextEnabled) {
      apiService.touchSession();
    }
  };

  useEffect(() => {
    apiService.ensureSessionTimeoutDefaults();
    const storedEnabled = localStorage.getItem(ENABLED_KEY);
    if (storedEnabled !== null) {
      setSessionTimeoutEnabled(storedEnabled !== 'false');
    }

    const storedMinutes = parseInt(localStorage.getItem(MINUTES_KEY) || '', 10);
    if (Number.isFinite(storedMinutes) && storedMinutes > 0) {
      setTimeoutMinutes(storedMinutes);
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
                  checked={sessionTimeoutEnabled}
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
        
        {sessionTimeoutEnabled && (
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