import React, { useState } from 'react';
import GoogleMap from '../components/GoogleMap';
import './MapPreview.css';
import '../components/GoogleMap.css';

const MapPreview = () => {
  // University of Mpumalanga coordinates
  const campusCenter = { lat: -25.4284, lng: 30.9781 };
  
  // Sample campus buildings and locations
  const campusMarkers = [
    {
      lat: -25.4284,
      lng: 30.9781,
      title: 'Main Campus',
      infoWindow: `
        <div class="marker-info">
          <h4>University of Mpumalanga</h4>
          <p>Main Campus - Central Administration</p>
        </div>
      `
    },
    {
      lat: -25.4290,
      lng: 30.9785,
      title: 'Building 10',
      infoWindow: `
        <div class="marker-info">
          <h4>Building 10</h4>
          <p>General Enquiries</p>
        </div>
      `
    },
    {
      lat: -25.4280,
      lng: 30.9775,
      title: 'Building 7',
      infoWindow: `
        <div class="marker-info">
          <h4>Building 7</h4>
          <p>Multipurpose Hall</p>
        </div>
      `
    },
    {
      lat: -25.4275,
      lng: 30.9790,
      title: 'Building 6',
      infoWindow: `
        <div class="marker-info">
          <h4>Building 6</h4>
          <p>Lecture Hall</p>
        </div>
      `
    },
    {
      lat: -25.4295,
      lng: 30.9770,
      title: 'Old Gate',
      infoWindow: `
        <div class="marker-info">
          <h4>Old Gate</h4>
          <p>Main Entrance</p>
        </div>
      `
    }
  ];

  return (
    <div className="map-preview-page">
      <div className="page-header">
        <h1>Map Preview</h1>
      </div>
      
      <div className="map-preview-content">
        <div className="map-section">
          <h2>Campus Map View</h2>
          <div className="map-container">
            <div className="interactive-map">
              <GoogleMap
                center={campusCenter}
                zoom={16}
                markers={campusMarkers}
                className="google-map"
              />
              <div className="map-legend">
                <div className="legend-item">
                  <div className="legend-color" style={{backgroundColor: '#ef4444'}}></div>
                  <span>Academic Buildings</span>
                </div>
                <div className="legend-item">
                  <div className="legend-color" style={{backgroundColor: '#3b82f6'}}></div>
                  <span>Administrative</span>
                </div>
                <div className="legend-item">
                  <div className="legend-color" style={{backgroundColor: '#10b981'}}></div>
                  <span>Recreation</span>
                </div>
                <div className="legend-item">
                  <div className="legend-color" style={{backgroundColor: '#f59e0b'}}></div>
                  <span>Parking</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MapPreview;