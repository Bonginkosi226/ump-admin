import React, { useState, useEffect } from 'react';
import { MapPin, Navigation, AlertCircle } from 'lucide-react';
import GoogleMap from '../components/GoogleMap';
import apiService from '../services/api';
import './Paths.css';
import '../components/GoogleMap.css';

const Paths = () => {
  const [startDestination, setStartDestination] = useState('');
  const [stopDestination, setStopDestination] = useState('');
  const [transportMode, setTransportMode] = useState('walking');
  const [pathPoints, setPathPoints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fallback static data
  const fallbackPathPoints = [
    { id: '001', longitude: '30.9781', latitude: '-25.4284' },
    { id: '002', longitude: '30.9785', latitude: '-25.4290' },
    { id: '003', longitude: '30.9775', latitude: '-25.4280' },
    { id: '004', longitude: '30.9790', latitude: '-25.4275' }
  ];

  useEffect(() => {
    const fetchPaths = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const response = await apiService.getPaths();
        if (response.success && response.data) {
          // Convert API data to expected format
          const formattedPaths = response.data.map(path => ({
            id: path.id || path._id,
            longitude: path.longitude || path.lng,
            latitude: path.latitude || path.lat
          }));
          setPathPoints(formattedPaths);
        } else {
          console.warn('API not available, using fallback data');
          setPathPoints(fallbackPathPoints);
        }
      } catch (err) {
        console.error('Error fetching paths:', err);
        setError('Failed to load paths');
        setPathPoints(fallbackPathPoints);
      } finally {
        setLoading(false);
      }
    };

    fetchPaths();
  }, []);
  
  // University of Mpumalanga coordinates
  const campusCenter = { lat: -25.4284, lng: 30.9781 };
  
  // Convert path points to markers for the map
  const pathMarkers = pathPoints.map((point, index) => ({
    lat: parseFloat(point.latitude),
    lng: parseFloat(point.longitude),
    title: `Path Point ${point.id}`,
    infoWindow: `
      <div class="marker-info">
        <h4>Path Point #${point.id}</h4>
        <p>Lat: ${point.latitude}, Lng: ${point.longitude}</p>
      </div>
    `
  }));
  
  const handleMapClick = (coordinates) => {
    const newPoint = {
      id: String(pathPoints.length + 1).padStart(3, '0'),
      longitude: coordinates.lng.toFixed(6),
      latitude: coordinates.lat.toFixed(6)
    };
    setPathPoints([...pathPoints, newPoint]);
  };

  if (loading) {
    return (
      <div className="paths-page">
        <div className="page-header">
          <h1>Paths</h1>
        </div>
        <div className="loading-state">
          <div className="loading-spinner"></div>
          <p>Loading paths...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="paths-page">
        <div className="page-header">
          <h1>Paths</h1>
        </div>
        <div className="error-state">
          <AlertCircle size={48} color="#ef4444" />
          <p>{error}</p>
          <button onClick={() => window.location.reload()} className="retry-button">
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="paths-page">
      <div className="page-header">
        <h1>Paths</h1>
        {pathPoints === fallbackPathPoints && (
          <div className="fallback-notice">
            <small>Using offline data - API unavailable</small>
          </div>
        )}
      </div>
      
      <div className="paths-content">
        <div className="path-inputs">
          <div className="input-group">
            <label>Start Destination <span className="required">*</span></label>
            <div className="input-with-icon">
              <MapPin className="input-icon" size={20} />
              <input
                type="text"
                placeholder="Name of Building"
                value={startDestination}
                onChange={(e) => setStartDestination(e.target.value)}
              />
            </div>
            <small>Enter valid building name</small>
          </div>
          
          <div className="input-group">
            <label>Stop Destination <span className="required">*</span></label>
            <div className="input-with-icon">
              <MapPin className="input-icon" size={20} />
              <input
                type="text"
                placeholder="Name of Building"
                value={stopDestination}
                onChange={(e) => setStopDestination(e.target.value)}
              />
            </div>
            <small>Enter valid building name</small>
          </div>
          
          <div className="transport-selector">
            <select 
              value={transportMode} 
              onChange={(e) => setTransportMode(e.target.value)}
              className="transport-dropdown"
            >
              <option value="walking">Select mode of transport</option>
              <option value="walking">Walking</option>
              <option value="cycling">Cycling</option>
              <option value="driving">Driving</option>
            </select>
          </div>
        </div>
        
        <div className="map-section">
          <h3>Campus Map View</h3>
          <div className="map-notice">
            <Navigation size={24} />
            <p>Click on the map to add a point to the path points table →</p>
          </div>
          <div className="map-container">
            <GoogleMap
              center={campusCenter}
              zoom={16}
              markers={pathMarkers}
              onMapClick={handleMapClick}
              className="paths-map"
            />
          </div>
        </div>
        
        <div className="path-points-section">
          <h3>Path Points (Auto Generated)</h3>
          <div className="path-points-table">
            <table>
              <thead>
                <tr>
                  <th>Path Point #</th>
                  <th>Longitude</th>
                  <th>Latitude</th>
                </tr>
              </thead>
              <tbody>
                {pathPoints.map((point) => (
                  <tr key={point.id}>
                    <td>{point.id}</td>
                    <td>{point.longitude}</td>
                    <td>{point.latitude}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Paths;