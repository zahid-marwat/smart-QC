import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { FiMapPin, FiRefreshCw } from 'react-icons/fi';

const MapContainer = styled.div`
  width: 100%;
  height: 200px;
  background: var(--light-gray);
  border: 2px solid var(--border-gray);
  border-radius: 8px;
  margin-bottom: 16px;
  position: relative;
  overflow: hidden;
`;

const MapTitle = styled.div`
  font-size: 12px;
  font-weight: 600;
  color: var(--text-black);
  margin-bottom: 8px;
  display: flex;
  align-items: center;
  gap: 4px;
`;

const MapFrame = styled.iframe`
  width: 100%;
  height: 100%;
  border: none;
  background: white;
`;

const MapPlaceholder = styled.div`
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: #f8f9fa;
  color: #666;
  text-align: center;
  padding: 16px;
`;

const RefreshButton = styled.button`
  background: var(--secondary-yellow);
  color: var(--text-black);
  border: none;
  padding: 4px 8px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 10px;
  display: flex;
  align-items: center;
  gap: 4px;
  margin-left: auto;
  
  &:hover {
    background: #FFE55C;
  }
`;

const CoordinateDisplay = styled.div`
  position: absolute;
  top: 8px;
  left: 8px;
  background: rgba(255, 255, 255, 0.9);
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 10px;
  font-weight: 500;
  color: var(--text-black);
  z-index: 10;
`;

const MapWidget = ({ selectedObject, onLocationUpdate }) => {
  const [mapLoaded, setMapLoaded] = useState(false);
  const [coordinates, setCoordinates] = useState(null);

  useEffect(() => {
    if (selectedObject && selectedObject.latLng) {
      setCoordinates(selectedObject.latLng);
    } else {
      // Default coordinates (e.g., center of map)
      setCoordinates({ lat: 33.704228, lng: 72.959696 });
    }
  }, [selectedObject]);

  const handleRefresh = () => {
    setMapLoaded(false);
    setTimeout(() => setMapLoaded(true), 100);
  };

  const generateMapUrl = () => {
    if (!coordinates) return '';
    
    // Using OpenStreetMap with Leaflet for a free alternative
    // In production, you might want to use Google Maps API
    const { lat, lng } = coordinates;
    
    // Create a simple embedded map URL
    // Note: This is a simplified version. In production, you'd implement a proper map component
    return `data:text/html,<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <link rel="stylesheet" href="https://unpkg.com/leaflet@1.7.1/dist/leaflet.css">
    <script src="https://unpkg.com/leaflet@1.7.1/dist/leaflet.js"></script>
    <style>
        body { margin: 0; padding: 0; }
        #map { height: 100vh; width: 100%; }
    </style>
</head>
<body>
    <div id="map"></div>
    <script>
        var map = L.map('map').setView([${lat}, ${lng}], 15);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap contributors'
        }).addTo(map);
        
        var marker = L.marker([${lat}, ${lng}], {
            draggable: true
        }).addTo(map);
        
        marker.on('dragend', function(e) {
            var position = e.target.getLatLng();
            // Send message to parent
            window.parent.postMessage({
                type: 'markerDragged',
                lat: position.lat,
                lng: position.lng
            }, '*');
        });
        
        // Handle clicks on map
        map.on('click', function(e) {
            marker.setLatLng(e.latlng);
            window.parent.postMessage({
                type: 'markerDragged',
                lat: e.latlng.lat,
                lng: e.latlng.lng
            }, '*');
        });
    </script>
</body>
</html>`;
  };

  useEffect(() => {
    // Listen for messages from the map iframe
    const handleMessage = (event) => {
      if (event.data.type === 'markerDragged') {
        const newCoords = {
          lat: event.data.lat,
          lng: event.data.lng
        };
        setCoordinates(newCoords);
        if (onLocationUpdate) {
          onLocationUpdate(newCoords);
        }
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [onLocationUpdate]);

  return (
    <div>
      <MapTitle>
        <FiMapPin />
        Object Location
        <RefreshButton onClick={handleRefresh}>
          <FiRefreshCw size={10} />
          Refresh
        </RefreshButton>
      </MapTitle>
      
      <MapContainer>
        {coordinates && (
          <CoordinateDisplay>
            {coordinates.lat.toFixed(6)}, {coordinates.lng.toFixed(6)}
          </CoordinateDisplay>
        )}
        
        {coordinates ? (
          <MapFrame
            src={generateMapUrl()}
            title="Object Location Map"
            onLoad={() => setMapLoaded(true)}
          />
        ) : (
          <MapPlaceholder>
            <FiMapPin size={24} />
            <div style={{ fontSize: '12px', marginTop: '8px' }}>
              Select an object to view its location
            </div>
          </MapPlaceholder>
        )}
      </MapContainer>
    </div>
  );
};

export default MapWidget;
