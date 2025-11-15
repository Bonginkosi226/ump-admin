import React, { useState, useEffect } from 'react';
import { ArrowLeft, User, Mail, Phone, Eye, EyeOff, Lock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import './PersonalInfo.css';

const PersonalInfo = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    department: '',
    countryCode: 'ZA'
  });
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  });
  
  const [isEditing, setIsEditing] = useState(false);
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  
  // Fetch user data on component mount
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        setLoading(true);
        const API_BASE = import.meta.env?.VITE_API_BASE_URL?.trim() || 'http://localhost:5000/api';
        const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
        const authToken = localStorage.getItem('authToken');

        if (!storedUser?._id) {
          throw new Error('No administrator session found');
        }

        const res = await fetch(`${API_BASE.replace(/\/$/, '')}/admins/${storedUser._id}`, {
          headers: {
            'Content-Type': 'application/json',
            ...(authToken ? { Authorization: `Bearer ${authToken}` } : {})
          }
        });

        const payload = await res.json().catch(() => null);
        if (!res.ok || payload?.success === false) {
          throw new Error(payload?.message || 'Failed to load administrator profile');
        }

        const user = payload?.data || storedUser;
        setFormData({
          firstName: user.firstName || '',
          lastName: user.lastName || '',
          email: user.email || '',
          phone: user.phone || '',
          department: user.department || '',
          countryCode: 'ZA'
        });
      } catch (error) {
        console.error('Error fetching user data:', error);
        const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
        if (storedUser) {
          setFormData({
            firstName: storedUser.firstName || '',
            lastName: storedUser.lastName || '',
            email: storedUser.email || '',
            phone: storedUser.phone || '',
            department: storedUser.department || '',
            countryCode: 'ZA'
          });
        }
      } finally {
        setLoading(false);
      }
    };
    
    fetchUserData();
  }, []);
  
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  const togglePasswordVisibility = (field) => {
    setShowPasswords(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
  };
  
  const validatePassword = (password) => {
    const requirements = {
      minLength: password.length >= 8,
      uppercase: /[A-Z]/.test(password),
      lowercase: /[a-z]/.test(password),
      number: /\d/.test(password),
      special: /[!@#$%^&*(),.?":{}|<>]/.test(password)
    };
    return requirements;
  };
  
  const passwordRequirements = validatePassword(passwordData.newPassword);
  
  const handleEditInfo = async () => {
    if (isEditing) {
      // Validate form data before saving
      if (!formData.firstName.trim()) {
        alert('Please enter your first name!');
        return;
      }
      
      if (!formData.lastName.trim()) {
        alert('Please enter your last name!');
        return;
      }
      
      if (!formData.email.trim()) {
        alert('Please enter your email!');
        return;
      }
      
      // Basic email validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email)) {
        alert('Please enter a valid email address!');
        return;
      }
      
      if (!formData.phone.trim()) {
        alert('Please enter your phone number!');
        return;
      }
      
      // Save to backend
      try {
        setSaving(true);
        const updateData = {
           firstName: formData.firstName.trim(),
           lastName: formData.lastName.trim(),
           email: formData.email.trim(),
           phone: formData.phone.trim(),
           department: formData.department.trim()
         };
        
        const API_BASE = import.meta.env?.VITE_API_BASE_URL?.trim() || 'http://localhost:5000/api';
        const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
        const authToken = localStorage.getItem('authToken');

        if (!storedUser?._id) {
          throw new Error('No administrator session found');
        }

        const res = await fetch(`${API_BASE.replace(/\/$/, '')}/admins/${storedUser._id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            ...(authToken ? { Authorization: `Bearer ${authToken}` } : {})
          },
          body: JSON.stringify(updateData)
        });

        const payload = await res.json().catch(() => null);
        if (!res.ok || payload?.success === false) {
          throw new Error(payload?.message || 'Failed to update profile');
        }

        const updatedUser = payload?.data || { ...storedUser, ...updateData };
        localStorage.setItem('user', JSON.stringify(updatedUser));

        alert('Personal information updated successfully!');
        setIsEditing(false);
      } catch (error) {
        console.error('Error updating profile:', error);
        alert('Failed to update profile. Please try again.');
      } finally {
        setSaving(false);
      }
    } else {
      setIsEditing(true);
    }
  };
  
  const handleTogglePasswordForm = () => {
    setShowPasswordForm(!showPasswordForm);
    if (showPasswordForm) {
      // Reset form when hiding
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
    }
  };

  const handleChangePassword = async () => {
  // Basic validation
  if (!passwordData.currentPassword.trim()) {
    alert("Please enter your current password!");
    return;
  }

  if (!passwordData.newPassword.trim()) {
    alert("Please enter a new password!");
    return;
  }

  if (passwordData.newPassword !== passwordData.confirmPassword) {
    alert("New passwords do not match!");
    return;
  }

  // Check password requirements
  const allRequirementsMet = Object.values(passwordRequirements).every(req => req);
  if (!allRequirementsMet) {
    alert("Password does not meet all requirements!");
    return;
  }

  try {
    // Call API to change password
    const API_BASE = import.meta.env?.VITE_API_BASE_URL?.trim() || 'http://localhost:5000/api';
    const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
    const authToken = localStorage.getItem('authToken');

    if (!storedUser?._id) {
      throw new Error('No administrator session found');
    }

    const res = await fetch(`${API_BASE.replace(/\/$/, '')}/admins/${storedUser._id}/password`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...(authToken ? { Authorization: `Bearer ${authToken}` } : {})
      },
      body: JSON.stringify({
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword
      })
    });

    const payload = await res.json().catch(() => null);
    if (!res.ok || payload?.success === false) {
      throw new Error(payload?.message || 'Failed to change password');
    }

    alert("Password changed successfully!");
    setPasswordData({ currentPassword: "", newPassword: "", confirmPassword: "" });
    setShowPasswordForm(false);
  } catch (error) {
    console.error("Change password error:", error);
    alert("Failed to change password. " + error.message);
  }
};


  
  if (loading) {
    return (
      <div className="personal-info-page">
        <div className="page-header">
          <button className="back-button" onClick={() => navigate('/settings')}>
            <ArrowLeft size={24} />
          </button>
          <h1>Personal Info</h1>
        </div>
        <div className="loading-container">
          <p>Loading profile information...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="personal-info-page">
      <div className="page-header">
        <button className="back-button" onClick={() => navigate('/settings')}>
          <ArrowLeft size={24} />
        </button>
        <h1>Personal Info</h1>
      </div>
      
      <div className="personal-info-content">
        <div className="info-section">
          <div className="form-row">
            <div className="form-group">
              <label>Name</label>
              <div className="input-with-icon">
                <User className="input-icon" size={20} />
                <input
                  type="text"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleInputChange}
                  disabled={!isEditing}
                  placeholder="Babongile"
                />
              </div>
              <small>First name</small>
            </div>
            
            <div className="form-group">
              <label>Surname</label>
              <div className="input-with-icon">
                <User className="input-icon" size={20} />
                <input
                  type="text"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleInputChange}
                  disabled={!isEditing}
                  placeholder="Ncube"
                />
              </div>
              <small>Last name</small>
            </div>
          </div>
          
          <div className="form-row">
            <div className="form-group">
              <label>Email</label>
              <div className="input-with-icon">
                <Mail className="input-icon" size={20} />
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  disabled={!isEditing}
                  placeholder="222147008@ump.ac.za"
                />
              </div>
              <small>Email address</small>
            </div>
            
            <div className="form-group">
              <label>Phone number</label>
              <div className="phone-input">
                <select 
                  name="countryCode" 
                  value={formData.countryCode}
                  onChange={handleInputChange}
                  disabled={!isEditing}
                  className="country-select"
                >
                  <option value="ZA">ZA</option>
                  <option value="US">US</option>
                  <option value="UK">UK</option>
                </select>
                <div className="input-with-icon">
                  <Phone className="input-icon" size={20} />
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    disabled={!isEditing}
                    placeholder="+27 (0)67-997-2425"
                  />
                </div>
              </div>
              <small>The phone Service</small>
            </div>
            
            <div className="form-group">
              <label>Department</label>
              <div className="input-with-icon">
                <User className="input-icon" size={20} />
                <input
                  type="text"
                  name="department"
                  value={formData.department}
                  onChange={handleInputChange}
                  disabled={!isEditing}
                  placeholder="Your Department"
                />
              </div>
              <small>Department or Division</small>
            </div>
          </div>
          
          <button 
            className="edit-info-btn"
            onClick={handleEditInfo}
            disabled={saving || loading}
          >
            {saving ? 'Saving...' : (isEditing ? 'Save Info' : 'Edit Info')}
          </button>
        </div>
        
        <div className="password-section">
          <button className="change-password-btn" onClick={handleTogglePasswordForm}>
            {showPasswordForm ? 'Cancel' : 'Change Password'}
          </button>
          
          {showPasswordForm && (
            <div className="password-form">
            <div className="form-group">
              <label>Current Password</label>
              <div className="input-with-icon password-input">
                <Lock className="input-icon" size={20} />
                <input
                  type={showPasswords.current ? 'text' : 'password'}
                  name="currentPassword"
                  value={passwordData.currentPassword}
                  onChange={handlePasswordChange}
                  placeholder="Your password"
                />
                <button 
                  type="button" 
                  className="password-toggle"
                  onClick={() => togglePasswordVisibility('current')}
                >
                  {showPasswords.current ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>
            
            <div className="form-group">
              <label>New Password</label>
              <div className="input-with-icon password-input">
                <Lock className="input-icon" size={20} />
                <input
                  type={showPasswords.new ? 'text' : 'password'}
                  name="newPassword"
                  value={passwordData.newPassword}
                  onChange={handlePasswordChange}
                  placeholder="Your password"
                />
                <button 
                  type="button" 
                  className="password-toggle"
                  onClick={() => togglePasswordVisibility('new')}
                >
                  {showPasswords.new ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
              
              <div className="password-requirements">
                <div className="requirements-row">
                  <span className={passwordRequirements.minLength ? 'valid' : 'invalid'}>
                    • minimum 8 characters
                  </span>
                  <span className={passwordRequirements.uppercase ? 'valid' : 'invalid'}>
                    • one uppercase character
                  </span>
                </div>
                <div className="requirements-row">
                  <span className={passwordRequirements.special ? 'valid' : 'invalid'}>
                    • one special character
                  </span>
                  <span className={passwordRequirements.lowercase ? 'valid' : 'invalid'}>
                    • one lowercase character
                  </span>
                </div>
                <div className="requirements-row">
                  <span className={passwordRequirements.number ? 'valid' : 'invalid'}>
                    • one number
                  </span>
                </div>
              </div>
            </div>
            
            <div className="form-group">
              <label>Confirm Password</label>
              <div className="input-with-icon password-input">
                <Lock className="input-icon" size={20} />
                <input
                  type={showPasswords.confirm ? 'text' : 'password'}
                  name="confirmPassword"
                  value={passwordData.confirmPassword}
                  onChange={handlePasswordChange}
                  placeholder="Your password"
                />
                <button 
                  type="button" 
                  className="password-toggle"
                  onClick={() => togglePasswordVisibility('confirm')}
                >
                  {showPasswords.confirm ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>
            
            <button 
              type="button" 
              className="edit-info-btn" 
              onClick={handleChangePassword}
              style={{ marginTop: '20px' }}
            >
              Update Password
            </button>
          </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PersonalInfo;