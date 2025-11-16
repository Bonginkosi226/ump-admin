import React, { useState, useEffect } from 'react';
import { Bell, User, LogOut, Settings } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import apiService from '../services/api';
import './Header.css';

const Header = () => {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [admin, setAdmin] = useState(null);

  useEffect(() => {
    const loggedInUser = localStorage.getItem('user');
    if (loggedInUser) {
      const user = JSON.parse(loggedInUser);
      setAdmin(user);
    }
  }, []);

  const fetchNotifications = async () => {
    try {
      const API_BASE = import.meta.env?.VITE_API_BASE_URL?.trim() || 'http://localhost:5000/api';
      const authToken = localStorage.getItem('authToken');
      if (!authToken) return;

      const response = await fetch(`${API_BASE.replace(/\/$/, '')}/notifications`, {
        headers: {
          'Authorization': `Bearer ${authToken}`,
        },
      });
      const payload = await response.json();
      if (payload.success) {
        setNotifications(payload.data.notifications);
        setUnreadCount(payload.data.unreadCount);
      }
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 60000); // Poll every minute
    return () => clearInterval(interval);
  }, []);

  const handleLogout = () => {
    apiService.logout();
    navigate('/login', { replace: true, state: { reason: 'logout' } });
  };

  const markAsRead = async (id) => {
    try {
      const API_BASE = import.meta.env?.VITE_API_BASE_URL?.trim() || 'http://localhost:5000/api';
      const authToken = localStorage.getItem('authToken');
      await fetch(`${API_BASE.replace(/\/$/, '')}/notifications/${id}/read`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${authToken}`,
        },
      });
      fetchNotifications(); // Refresh notifications
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  };
  
    const markAllAsRead = async () => {
    try {
      const API_BASE = import.meta.env?.VITE_API_BASE_URL?.trim() || 'http://localhost:5000/api';
      const authToken = localStorage.getItem('authToken');
      await fetch(`${API_BASE.replace(/\/$/, '')}/notifications/read-all`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${authToken}`,
        },
      });
      fetchNotifications(); // Refresh notifications
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error);
    }
  };

  return (
    <header className="header">
      <div className="header-left">
        {/* Can add a logo or title here */}
      </div>
      <div className="header-right">
        <div className="notification-icon" onClick={() => setDropdownOpen(!dropdownOpen)}>
          <Bell size={24} />
          {unreadCount > 0 && <span className="notification-badge">{unreadCount}</span>}
        </div>
        {dropdownOpen && (
          <div className="notification-dropdown">
            <div className="dropdown-header">
              <h3>Notifications</h3>
              <button onClick={markAllAsRead} disabled={unreadCount === 0}>Mark all as read</button>
            </div>
            <div className="notification-list">
              {notifications.length > 0 ? (
                notifications.map(notif => (
                  <div key={notif._id} className={`notification-item ${!notif.read ? 'unread' : ''}`}>
                    <div className="item-content">
                      <strong>{notif.title}</strong>
                      <p>{notif.message}</p>
                      <small>{new Date(notif.createdAt).toLocaleString()}</small>
                    </div>
                    {!notif.read && (
                      <button className="mark-read-btn" onClick={() => markAsRead(notif._id)}>Mark as read</button>
                    )}
                  </div>
                ))
              ) : (
                <p className="no-notifications">No notifications yet.</p>
              )}
            </div>
          </div>
        )}

        <div className="user-menu" onClick={() => setUserMenuOpen(!userMenuOpen)}>
          <div className="profile-avatar-header">
            <User size={24} />
          </div>
          {userMenuOpen && (
            <div className="user-dropdown">
              {admin && <p className="user-name">{admin.firstName} {admin.lastName}</p>}
              <button onClick={() => navigate('/settings')}>
                <Settings size={16} /> Settings
              </button>
              <button onClick={handleLogout}>
                <LogOut size={16} /> Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
