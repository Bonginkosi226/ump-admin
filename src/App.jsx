import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import Buildings from './pages/Buildings';
import UploadPage from './pages/Upload_image';
import Settings from './pages/Settings';
import PersonalInfo from './pages/PersonalInfo';
import SecuritySettings from './pages/SecuritySettings';
import Notifications from './pages/Notifications';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import SessionWatcher from './components/SessionWatcher';
import './App.css';
import Coordinates from './pages/Coordinates';
import Login from './pages/Login';
import Register from './pages/Register';
import ResetPassword from './pages/ResetPassword';

function App() {
  return (
    <Router>
      <div className="App">
        <SessionWatcher />
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/reset-password/:token" element={<ResetPassword />} />
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route
            path="/*"
            element={(
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            )}
          >
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="buildings" element={<Buildings />} />
            <Route path="coordinates" element={<Coordinates />} />
            <Route path="settings" element={<Settings />} />
            <Route path="personal-info" element={<PersonalInfo />} />
            <Route path="security-settings" element={<SecuritySettings />} />
            <Route path="notifications" element={<Notifications />} />
            <Route path="upload-image" element={<UploadPage />} />
          </Route>
        </Routes>
      </div>
    </Router>
  );
}

export default App
