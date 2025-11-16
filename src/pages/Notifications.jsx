import React, { useState, useEffect } from 'react';
import { ArrowLeft, Bell, Mail, Info } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import './Notifications.css';

const Notifications = () => {
  const navigate = useNavigate();
  const [adminAlerts, setAdminAlerts] = useState(true);
  const [emailSummary, setEmailSummary] = useState(true);
  const [admin, setAdmin] = useState(null);

  useEffect(() => {
    const loggedInUser = localStorage.getItem('user');
    if (loggedInUser) {
      const user = JSON.parse(loggedInUser);
      setAdmin(user);
    }
  }, []);

  useEffect(() => {
    if (admin) {
      const fetchSettings = async () => {
        try {
          const API_BASE = import.meta.env?.VITE_API_BASE_URL?.trim() || 'http://localhost:5000/api';
          const response = await fetch(`${API_BASE.replace(/\/$/, '')}/admins/${admin._id}`);
          const payload = await response.json();
          if (payload.success) {
            setAdminAlerts(payload.data.adminAlerts);
            setEmailSummary(payload.data.emailSummary);
          }
        } catch (error) {
          console.error('Failed to fetch settings:', error);
        }
      };
      fetchSettings();
    }
  }, [admin]);

  const updateSettings = async (settings) => {
    if (admin) {
      try {
        const API_BASE = import.meta.env?.VITE_API_BASE_URL?.trim() || 'http://localhost:5000/api';
        await fetch(`${API_BASE.replace(/\/$/, '')}/admins/${admin._id}/settings`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(settings),
        });
      } catch (error) {
        console.error('Failed to update settings:', error);
      }
    }
  };

  const handleAdminAlertsToggle = () => {
    const newAdminAlerts = !adminAlerts;
    setAdminAlerts(newAdminAlerts);
    updateSettings({ adminAlerts: newAdminAlerts, emailSummary });
  };

  const handleEmailSummaryToggle = () => {
    const newEmailSummary = !emailSummary;
    setEmailSummary(newEmailSummary);
    updateSettings({ adminAlerts, emailSummary: newEmailSummary });
  };

  return (
    <div className="notifications-page">
      <div className="page-header">
        <button className="back-button" onClick={() => navigate('/settings')}>
          <ArrowLeft size={24} />
        </button>
        <h1>Notifications</h1>
      </div>
      
      <div className="notifications-content">
        <div className="notification-option">
          <div className="option-info">
            <div className="option-header">
              <Bell className="option-icon" size={24} />
              <span className="option-title">Admin Alerts</span>
            </div>
            
            <div className="toggle-container">
              <label className="toggle-switch">
                <input
                  type="checkbox"
                  checked={adminAlerts}
                  onChange={handleAdminAlertsToggle}
                />
                <span className="toggle-slider"></span>
              </label>
            </div>
          </div>
          
          <div className="option-description">
            <div className="description-content">
              <Info className="info-icon" size={20} />
              <span className="description-text">
                e.g., when a new building/path is added
              </span>
            </div>
          </div>
        </div>
        
        <div className="notification-option">
          <div className="option-info">
            <div className="option-header">
              <Mail className="option-icon" size={24} />
              <span className="option-title">Email summary</span>
            </div>
            
            <div className="toggle-container">
              <label className="toggle-switch">
                <input
                  type="checkbox"
                  checked={emailSummary}
                  onChange={handleEmailSummaryToggle}
                />
                <span className="toggle-slider"></span>
              </label>
            </div>
          </div>
          
          <div className="option-description">
            <div className="description-content">
              <Info className="info-icon" size={20} />
              <span className="description-text">
                daily/weekly summary on general activity in the app
              </span>
            </div>
          </div>
        </div>
        
        {(adminAlerts || emailSummary) && (
          <div className="notifications-info">
            <Bell className="bell-icon" size={16} />
            <div className="info-text">
              <div>Notification preferences saved successfully.</div>
              {adminAlerts && <div>• Admin alerts are enabled</div>}
              {emailSummary && <div>• Email summaries are enabled</div>}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Notifications;