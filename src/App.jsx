import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import Buildings from './pages/Buildings';
import UploadPage from './pages/Upload_image';
import MapPreview from './pages/MapPreview';
import Settings from './pages/Settings';
import PersonalInfo from './pages/PersonalInfo';
import SecuritySettings from './pages/SecuritySettings';
import Notifications from './pages/Notifications';
import Layout from './components/Layout';
import './App.css';
import Coordinates from './pages/Coordinates';

function App() {
  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/*" element={<Layout />}>
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="buildings" element={<Buildings />} />
            <Route path="coordinates" element={<Coordinates />} />
            <Route path="map-preview" element={<MapPreview />} />
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
