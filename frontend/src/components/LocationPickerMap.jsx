import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import { MapPin, Navigation, Compass } from 'lucide-react';

// Fix for default Leaflet marker icons in React/Vite
const customMarkerIcon = new L.DivIcon({
  className: 'custom-pin',
  html: `<div style="background-color: #0d9488; width: 28px; height: 28px; border-radius: 50% 50% 50% 0; transform: rotate(-45deg); border: 3px solid white; box-shadow: 0 4px 10px rgba(13,148,136,0.3); display: flex; align-items: center; justify-content: center;">
          <div style="width: 8px; height: 8px; background: white; border-radius: 50%; transform: rotate(45deg);"></div>
        </div>`,
  iconSize: [28, 28],
  iconAnchor: [14, 28],
  popupAnchor: [0, -28],
});

// Map click handler sub-component
function MapClickHandler({ onLocationSelect }) {
  useMapEvents({
    click(e) {
      onLocationSelect(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

export default function LocationPickerMap({ latitude, longitude, onLocationChange }) {
  // Default to Nutakki Village coordinates
  const defaultPos = [16.4382, 80.6010];
  const currentPos = latitude && longitude ? [latitude, longitude] : defaultPos;
  const [geoLocating, setGeoLocating] = useState(false);

  const presets = [
    { label: 'Nutakki Center (Panchayat)', lat: 16.4382, lng: 80.6010 },
    { label: 'Nutakki ZP High School', lat: 16.4410, lng: 80.6035 },
    { label: 'Krishna River Bund (East)', lat: 16.4355, lng: 80.6080 },
    { label: 'Tadepalli Rural', lat: 16.4680, lng: 80.5920 },
    { label: 'Mangalagiri', lat: 16.4250, lng: 80.5600 },
  ];

  const handleSelectPreset = (lat, lng) => {
    onLocationChange(lat, lng);
  };

  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser.');
      return;
    }
    setGeoLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setGeoLocating(false);
        onLocationChange(pos.coords.latitude, pos.coords.longitude);
      },
      (err) => {
        setGeoLocating(false);
        alert('Could not retrieve current location: ' + err.message);
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
        <span className="font-semibold text-slate-700 flex items-center gap-1.5">
          <MapPin className="w-3.5 h-3.5 text-brand-600" />
          Click on map to pinpoint observation site:
        </span>
        <button
          type="button"
          onClick={handleUseCurrentLocation}
          disabled={geoLocating}
          className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-brand-50 hover:bg-brand-100 text-brand-700 font-medium border border-brand-200 transition-colors"
        >
          <Navigation className={`w-3 h-3 ${geoLocating ? 'animate-spin' : ''}`} />
          <span>{geoLocating ? 'Detecting GPS...' : 'Use My GPS Location'}</span>
        </button>
      </div>

      {/* Map Canvas */}
      <div className="relative h-64 sm:h-72 w-full rounded-xl overflow-hidden border border-slate-300 shadow-inner">
        <MapContainer
          center={currentPos}
          zoom={14}
          scrollWheelZoom={false}
          className="h-full w-full"
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <MapClickHandler onLocationSelect={onLocationChange} />
          {latitude && longitude && (
            <Marker position={[latitude, longitude]} icon={customMarkerIcon}>
              <Popup>
                <div className="text-xs p-1">
                  <strong>Selected Location</strong>
                  <br />
                  Lat: {Number(latitude).toFixed(4)}, Lng: {Number(longitude).toFixed(4)}
                </div>
              </Popup>
            </Marker>
          )}
        </MapContainer>

        {/* Small floating hint badge */}
        <div className="absolute bottom-2 left-2 z-[400] bg-white/90 backdrop-blur-sm px-2.5 py-1 rounded-md text-[11px] font-medium text-slate-600 shadow border border-slate-200 pointer-events-none">
          Click any spot on map to set GPS marker
        </div>
      </div>

      {/* Coordinates Display & Presets */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs">
        <div className="text-slate-600 font-mono">
          {latitude && longitude ? (
            <span className="inline-flex items-center gap-1 bg-slate-100 px-2 py-0.5 rounded border border-slate-200 text-slate-700">
              📍 {Number(latitude).toFixed(4)}° N, {Number(longitude).toFixed(4)}° E
            </span>
          ) : (
            <span className="text-slate-400 italic">No coordinates selected (optional)</span>
          )}
        </div>

        {/* Presets */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-slate-400 flex items-center gap-1 text-[11px]">
            <Compass className="w-3 h-3" /> Quick Presets:
          </span>
          {presets.slice(0, 3).map((p, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handleSelectPreset(p.lat, p.lng)}
              className="text-[11px] bg-slate-100 hover:bg-brand-50 hover:text-brand-700 px-2 py-0.5 rounded text-slate-600 border border-slate-200 transition-colors"
            >
              {p.label.split(' ')[0]}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
