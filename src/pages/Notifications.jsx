import React, { useState, useEffect } from 'react';
import { ArrowLeft, Bell, Mail, Info } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import './Notifications.css';

const Notifications = () => {
  const navigate = useNavigate();
  const [adminAlerts, setAdminAlerts] = useState(true);
  const [emailSummary, setEmailSummary] = useState(true);

  const handleAdminAlertsToggle = () => {
    setAdminAlerts(!adminAlerts);
    // Save preference to localStorage
    localStorage.setItem('adminAlertsEnabled', (!adminAlerts).toString());
  };

  const handleEmailSummaryToggle = () => {
    setEmailSummary(!emailSummary);
    // Save preference to localStorage
    localStorage.setItem('emailSummaryEnabled', (!emailSummary).toString());
  };

  // Load saved preferences on component mount
  useEffect(() => {
    const savedAdminAlerts = localStorage.getItem('adminAlertsEnabled');
    const savedEmailSummary = localStorage.getItem('emailSummaryEnabled');
    
    if (savedAdminAlerts !== null) {
      setAdminAlerts(savedAdminAlerts === 'true');
    }
    
    if (savedEmailSummary !== null) {
      setEmailSummary(savedEmailSummary === 'true');
    }
  }, []);

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