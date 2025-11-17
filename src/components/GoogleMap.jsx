import React, { useEffect, useRef, useState } from 'react';
import { Wrapper, Status } from '@googlemaps/react-wrapper';

const MapComponent = ({
  center,
  zoom,
  markers = [],
  onMapClick,
  onMarkerClick,
  className,
  mapTypeId,
  minZoom,
  maxZoom,
  onIdle
}) => {
  const ref = useRef(null);
  const [map, setMap] = useState(null);
  const mapMarkersRef = useRef([]);
  const idleListenerRef = useRef(null);

  useEffect(() => {
    if (ref.current && !map) {
      const newMap = new window.google.maps.Map(ref.current, {
        center,
        zoom,
        mapTypeId: mapTypeId || 'roadmap',
        minZoom,
        maxZoom,
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

      if (onIdle) {
        idleListenerRef.current = newMap.addListener('idle', () => {
          const mapCenter = newMap.getCenter();
          onIdle({
            center: mapCenter ? { lat: mapCenter.lat(), lng: mapCenter.lng() } : null,
            zoom: newMap.getZoom(),
            bounds: newMap.getBounds()
          });
        });
      }
    }
  }, [ref, map, center, zoom, onMapClick, mapTypeId, minZoom, maxZoom, onIdle]);

  useEffect(() => {
    if (!map) return;

    if (typeof mapTypeId === 'string' || typeof minZoom === 'number' || typeof maxZoom === 'number') {
      map.setOptions({
        mapTypeId: mapTypeId || map.getMapTypeId(),
        minZoom,
        maxZoom
      });
    }
  }, [map, mapTypeId, minZoom, maxZoom]);

  useEffect(() => {
    if (!map || !center || typeof center.lat !== 'number' || typeof center.lng !== 'number') return;

    const currentCenter = map.getCenter();
    if (!currentCenter || currentCenter.lat() !== center.lat || currentCenter.lng() !== center.lng) {
      map.panTo(center);
    }
  }, [map, center]);

  useEffect(() => {
    if (!map || typeof zoom !== 'number') return;
    if (map.getZoom() !== zoom) {
      map.setZoom(zoom);
    }
  }, [map, zoom]);

  useEffect(() => {
    if (!map) return;

    // Clear existing markers
    if (mapMarkersRef.current.length) {
      mapMarkersRef.current.forEach(({ marker, infoWindow }) => {
        infoWindow?.close();
        marker.setMap(null);
      });
      mapMarkersRef.current = [];
    }

    if (!markers.length) return;

    const buildMarkerIcon = (markerData) => {
      const { iconUrl, color = '#ef4444', isSelected = false, label } = markerData;

      if (iconUrl) {
        const size = isSelected ? 52 : 44;
        return {
          url: iconUrl,
          scaledSize: new window.google.maps.Size(size, size),
          anchor: new window.google.maps.Point(size / 2, size / 2)
        };
      }

      const size = isSelected ? 46 : 38;
      const strokeWidth = isSelected ? 4 : 2;
      const svg = `
        <svg width="${size}" height="${size}" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M24 4C15.7157 4 9 10.7157 9 19C9 30.75 24 44 24 44C24 44 39 30.75 39 19C39 10.7157 32.2843 4 24 4Z" fill="${color}" stroke="${isSelected ? '#111827' : '#ffffff'}" stroke-width="${strokeWidth}"/>
          <circle cx="24" cy="19" r="6" fill="#ffffff"/>
          ${label ? `<text x="24" y="22.5" text-anchor="middle" font-family='Inter, sans-serif' font-size="10" fill="#111827" font-weight="600">${label}</text>` : ''}
        </svg>
      `;

      return {
        url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(svg),
        scaledSize: new window.google.maps.Size(size, size),
        anchor: new window.google.maps.Point(size / 2, size)
      };
    };

    const createdMarkers = markers.map((markerData) => {
      const marker = new window.google.maps.Marker({
        position: { lat: markerData.lat, lng: markerData.lng },
        map,
        title: markerData.title || '',
        icon: buildMarkerIcon(markerData)
      });

      let infoWindow = null;

      if (markerData.infoWindow) {
        infoWindow = new window.google.maps.InfoWindow({
          content: markerData.infoWindow
        });

        marker.addListener('click', () => {
          infoWindow.open(map, marker);
        });

        if (markerData.isSelected) {
          infoWindow.open(map, marker);
        }
      }

      if (onMarkerClick) {
        marker.addListener('click', () => {
          onMarkerClick(markerData.payload ?? markerData);
        });
      }

      return { marker, infoWindow };
    });

    mapMarkersRef.current = createdMarkers;
  }, [map, markers, onMarkerClick]);

  useEffect(() => () => {
    if (idleListenerRef.current) {
      idleListenerRef.current.remove();
    }
    if (mapMarkersRef.current.length) {
      mapMarkersRef.current.forEach(({ marker, infoWindow }) => {
        infoWindow?.close();
        marker.setMap(null);
      });
      mapMarkersRef.current = [];
    }
  }, []);

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

const GoogleMap = ({
  center,
  zoom,
  markers,
  onMapClick,
  onMarkerClick,
  className,
  apiKey,
  mapTypeId,
  minZoom,
  maxZoom,
  onIdle
}) => {
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
        onMarkerClick={onMarkerClick}
        className={className}
        mapTypeId={mapTypeId}
        minZoom={minZoom}
        maxZoom={maxZoom}
        onIdle={onIdle}
      />
    </Wrapper>
  );
};

export default GoogleMap;