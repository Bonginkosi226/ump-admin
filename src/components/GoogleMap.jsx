import React, { useEffect, useRef, useState } from 'react';
import { Wrapper, Status } from '@googlemaps/react-wrapper';

const MapComponent = ({ center, zoom, markers = [], onMapClick, className }) => {
  const ref = useRef(null);
  const [map, setMap] = useState(null);
  const [mapMarkers, setMapMarkers] = useState([]);

  useEffect(() => {
    if (ref.current && !map) {
      const newMap = new window.google.maps.Map(ref.current, {
        center,
        zoom,
        mapTypeControl: true,
        streetViewControl: true,
        fullscreenControl: true,
        zoomControl: true,
        styles: [
          {
            featureType: 'poi.school',
            elementType: 'geometry.fill',
            stylers: [{ color: '#f59e0b' }]
          },
          {
            featureType: 'poi.school',
            elementType: 'labels.text.fill',
            stylers: [{ color: '#1f2937' }]
          }
        ]
      });
      
      setMap(newMap);
      
      if (onMapClick) {
        newMap.addListener('click', (event) => {
          onMapClick({
            lat: event.latLng.lat(),
            lng: event.latLng.lng()
          });
        });
      }
    }
  }, [ref, map, center, zoom, onMapClick]);

  useEffect(() => {
    if (map) {
      // Clear existing markers
      mapMarkers.forEach(marker => marker.setMap(null));
      
      // Add new markers
      const newMarkers = markers.map(markerData => {
        const marker = new window.google.maps.Marker({
          position: { lat: markerData.lat, lng: markerData.lng },
          map,
          title: markerData.title || '',
          icon: markerData.icon || {
            url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" fill="#ef4444"/>
                <circle cx="12" cy="9" r="2.5" fill="white"/>
              </svg>
            `),
            scaledSize: new window.google.maps.Size(24, 24),
            anchor: new window.google.maps.Point(12, 24)
          }
        });
        
        if (markerData.infoWindow) {
          const infoWindow = new window.google.maps.InfoWindow({
            content: markerData.infoWindow
          });
          
          marker.addListener('click', () => {
            infoWindow.open(map, marker);
          });
        }
        
        return marker;
      });
      
      setMapMarkers(newMarkers);
    }
  }, [map, markers]);

  return <div ref={ref} className={className} style={{ width: '100%', height: '100%' }} />;
};

const render = (status) => {
  switch (status) {
    case Status.LOADING:
      return (
        <div className="map-loading">
          <div className="loading-spinner"></div>
          <p>Loading Google Maps...</p>
        </div>
      );
    case Status.FAILURE:
      return (
        <div className="map-error">
          <div className="error-content">
            <h4>🗺️ Google Maps Setup Required</h4>
            <p>To use Google Maps, you need a valid API key:</p>
            <ol>
              <li>Go to <a href="https://console.cloud.google.com/" target="_blank" rel="noopener noreferrer">Google Cloud Console</a></li>
              <li>Create a new project or select existing one</li>
              <li>Enable "Maps JavaScript API"</li>
              <li>Create credentials → API Key</li>
              <li>Replace the API key in GoogleMap.jsx</li>
            </ol>
            <p><strong>Note:</strong> Google provides $200 free monthly credit (≈28,500 map loads)</p>
          </div>
        </div>
      );
    case Status.SUCCESS:
      return MapComponent;
  }
};

const GoogleMap = ({ center, zoom, markers, onMapClick, className, apiKey }) => {
  // Default to University of Mpumalanga coordinates if no center provided
  const defaultCenter = { lat: -25.4284, lng: 30.9781 };
  const mapCenter = center || defaultCenter;
  const mapZoom = zoom || 15;
  
  // Replace with your actual Google Maps API key
  // Get your free API key at: https://console.cloud.google.com/
  // For demo purposes, using a restricted demo key - replace with your own for production
  const googleMapsApiKey = apiKey || import.meta.env.VITE_GOOGLE_MAPS_API_KEY || 'AIzaSyBFw0Qbyq9zTFTd-tUY6dkS4oINtVKR3-g';

  return (
    <Wrapper apiKey={googleMapsApiKey} render={render}>
      <MapComponent 
        center={mapCenter}
        zoom={mapZoom}
        markers={markers}
        onMapClick={onMapClick}
        className={className}
      />
    </Wrapper>
  );
};

export default GoogleMap;