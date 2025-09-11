import React from 'react';
import { User, Shield, Bell, LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import './Settings.css';

const Settings = () => {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('isAuthenticated');
    navigate('/login');
  };

  const settingsOptions = [
    {
      id: 'personal',
      title: 'Personal Info',
      icon: User,
      color: '#f59e0b',
      onClick: () => navigate('/personal-info')
    },
    {
      id: 'security',
      title: 'Security Settings',
      icon: Shield,
      color: '#ef4444',
      onClick: () => navigate('/security-settings')
    },
    {
      id: 'notifications',
      title: 'Notifications',
      icon: Bell,
      color: '#10b981',
      onClick: () => navigate('/notifications')
    },
    {
      id: 'logout',
      title: 'Log Out',
      icon: LogOut,
      color: '#f97316',
      onClick: handleLogout
    }
  ];

  return (
    <div className="settings-page">
      <div className="page-header">
        <h1>Settings</h1>
      </div>
      
      <div className="settings-content">
        <div className="settings-grid">
          {settingsOptions.map((option) => {
            const IconComponent = option.icon;
            return (
              <div 
                key={option.id}
                className="setting-card"
                onClick={option.onClick}
                style={{ '--icon-color': option.color }}
              >
                <div className="setting-icon">
                  <IconComponent size={24} />
                </div>
                <h3>{option.title}</h3>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default Settings;