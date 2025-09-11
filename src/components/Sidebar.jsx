import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Building, MapPin, Map, Settings, LogOut } from 'lucide-react';
import './Sidebar.css';

const Sidebar = ({ isOpen, onClose }) => {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('isAuthenticated');
    navigate('/login');
  };

  const handleNavClick = () => {
    if (onClose) {
      onClose();
    }
  };

  const menuItems = [
    {
      icon: LayoutDashboard,
      label: 'Dashboard',
      path: '/dashboard'
    },
    {
      icon: Building,
      label: 'Buildings',
      path: '/buildings'
    },
    {
      icon: MapPin,
      label: 'Paths',
      path: '/paths'
    },
    {
      icon: Map,
      label: 'Map Preview',
      path: '/map-preview'
    },
    {
      icon: Settings,
      label: 'Settings',
      path: '/settings'
    }
  ];

  return (
    <div className={`sidebar ${isOpen ? 'open' : ''}`}>
      <div className="sidebar-header">
        <div className="admin-profile">
          <div className="profile-avatar"></div>
          <div className="profile-info">
            <h3>Admin</h3>
            <p>UMP NAV-APP</p>
          </div>
        </div>
      </div>

      <nav className="sidebar-nav">
        {menuItems.map((item) => {
          const IconComponent = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) => 
                `nav-item ${isActive ? 'active' : ''}`
              }
              onClick={handleNavClick}
            >
              <IconComponent size={20} />
              <span>{item.label}</span>
            </NavLink>
          );
        })}
      </nav>

      <div className="sidebar-footer">
        <button className="logout-btn" onClick={handleLogout}>
          <LogOut size={20} />
          <span>Logout</span>
        </button>
      </div>
    </div>
  );
};

export default Sidebar;