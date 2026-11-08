import React, { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import {
  MapPin,
  Navigation,
  Compass,
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  Loader2,
  X,
  Crosshair,
  Edit3,
  RotateCcw
} from 'lucide-react';

// Custom marker icon with drop pin shape & vibrant teal branding
const customMarkerIcon = new L.DivIcon({
  className: 'custom-pin',
  html: `<div style="background-color: #0d9488; width: 32px; height: 32px; border-radius: 50% 50% 50% 0; transform: rotate(-45deg); border: 3px solid white; box-shadow: 0 4px 14px rgba(13,148,136,0.45); display: flex; align-items: center; justify-content: center;">
          <div style="width: 10px; height: 10px; background: white; border-radius: 50%; transform: rotate(45deg);"></div>
        </div>`,
  iconSize: [32, 32],
  iconAnchor: [16, 32],
  popupAnchor: [0, -32],
});

// Map click handler to support manual placement
function MapClickHandler({ onLocationSelect }) {
  useMapEvents({
    click(e) {
      onLocationSelect(
        Number(e.latlng.lat.toFixed(6)),
        Number(e.latlng.lng.toFixed(6))
      );
    },
  });
  return null;
}

// Map center and flyTo controller
function MapViewController({ center, zoom, flyTrigger }) {
  const map = useMap();
  useEffect(() => {
    if (center && center[0] && center[1]) {
      map.flyTo(center, zoom || 16, { duration: 1.2 });
    }
  }, [flyTrigger, map]);
  return null;
}

export default function LocationPickerMap({ latitude, longitude, onLocationChange }) {
  // Default to Nutakki Village coordinates
  const defaultPos = [16.4382, 80.6010];
  const currentPos = latitude && longitude ? [Number(latitude), Number(longitude)] : defaultPos;

  const [geoLocating, setGeoLocating] = useState(false);
  const [geoStatus, setGeoStatus] = useState(null); // { type: 'success' | 'error' | 'loading', title: string, message: string, accuracy?: number }
  const [flyTrigger, setFlyTrigger] = useState(0);
  const [showManualInputs, setShowManualInputs] = useState(false);
  const [manualLat, setManualLat] = useState(latitude ? String(latitude) : '16.4382');
  const [manualLng, setManualLng] = useState(longitude ? String(longitude) : '80.6010');

  // Keep manual input boxes synced if parent updates
  useEffect(() => {
    if (latitude) setManualLat(String(latitude));
    if (longitude) setManualLng(String(longitude));
  }, [latitude, longitude]);

  const presets = [
    { label: 'Nutakki Center', lat: 16.4382, lng: 80.6010 },
    { label: 'Nutakki School', lat: 16.4410, lng: 80.6035 },
    { label: 'Krishna River Bund', lat: 16.4355, lng: 80.6080 },
    { label: 'Tadepalli Rural', lat: 16.4680, lng: 80.5920 },
    { label: 'Mangalagiri', lat: 16.4250, lng: 80.5600 },
  ];

  const handleSelectPreset = (lat, lng) => {
    onLocationChange(lat, lng);
    setFlyTrigger((prev) => prev + 1);
    setGeoStatus({
      type: 'info',
      title: 'Preset Selected',
      message: `Coordinates updated to ${lat.toFixed(4)}° N, ${lng.toFixed(4)}° E.`
    });
  };

  const handleManualApply = (e) => {
    e?.preventDefault();
    const parsedLat = parseFloat(manualLat);
    const parsedLng = parseFloat(manualLng);

    if (isNaN(parsedLat) || parsedLat < -90 || parsedLat > 90) {
      setGeoStatus({
        type: 'error',
        title: 'Invalid Latitude',
        message: 'Latitude must be a valid number between -90 and 90.'
      });
      return;
    }

    if (isNaN(parsedLng) || parsedLng < -180 || parsedLng > 180) {
      setGeoStatus({
        type: 'error',
        title: 'Invalid Longitude',
        message: 'Longitude must be a valid number between -180 and 180.'
      });
      return;
    }

    onLocationChange(Number(parsedLat.toFixed(6)), Number(parsedLng.toFixed(6)));
    setFlyTrigger((prev) => prev + 1);
    setGeoStatus({
      type: 'success',
      title: 'Coordinates Updated',
      message: `Manually set to ${parsedLat.toFixed(6)}° N, ${parsedLng.toFixed(6)}° E.`
    });
  };

  const handleResetDefault = () => {
    onLocationChange(defaultPos[0], defaultPos[1]);
    setFlyTrigger((prev) => prev + 1);
    setGeoStatus(null);
  };

  const handleDetectLocation = () => {
    // 1. Check browser support
    if (!navigator.geolocation) {
      setGeoStatus({
        type: 'error',
        title: 'Geolocation Unsupported',
        message: 'Your browser does not support GPS location detection. Please click directly on the map or choose a preset.'
      });
      return;
    }

    // 2. Check for secure context (HTTPS)
    if (typeof window !== 'undefined' && window.isSecureContext === false) {
      setGeoStatus({
        type: 'error',
        title: 'Secure Connection Required',
        message: 'Browser geolocation requires a secure HTTPS connection. Please ensure you are accessing via HTTPS.'
      });
      return;
    }

    setGeoLocating(true);
    setGeoStatus({
      type: 'loading',
      title: 'Acquiring GPS Signal...',
      message: 'Requesting high-accuracy coordinates. If prompted by your browser, please click "Allow".'
    });

    const highAccuracyOptions = {
      enableHighAccuracy: true,
      timeout: 15000,
      maximumAge: 30000,
    };

    const lowAccuracyOptions = {
      enableHighAccuracy: false,
      timeout: 10000,
      maximumAge: 120000,
    };

    const handleSuccess = (pos) => {
      const lat = Number(pos.coords.latitude.toFixed(6));
      const lng = Number(pos.coords.longitude.toFixed(6));
      const accuracy = pos.coords.accuracy ? Math.round(pos.coords.accuracy) : null;

      setGeoLocating(false);
      onLocationChange(lat, lng);
      setFlyTrigger((prev) => prev + 1);

      setGeoStatus({
        type: 'success',
        title: 'Location Detected Successfully',
        message: `Locked at ${lat.toFixed(4)}° N, ${lng.toFixed(4)}° E${accuracy ? ` (Accuracy: ±${accuracy}m)` : ''}. Map centered.`,
        accuracy
      });
    };

    const handleFailure = (err) => {
      // If high-accuracy timed out, retry with network/cell/Wi-Fi positioning
      if (err.code === 3 /* TIMEOUT */) {
        setGeoStatus({
          type: 'loading',
          title: 'Retrying with Network Location...',
          message: 'GPS satellite fix timed out. Retrying with Wi-Fi / cell network positioning...'
        });

        navigator.geolocation.getCurrentPosition(
          (fallbackPos) => {
            handleSuccess(fallbackPos);
          },
          (fallbackErr) => {
            setGeoLocating(false);
            parseAndSetError(fallbackErr);
          },
          lowAccuracyOptions
        );
        return;
      }

      setGeoLocating(false);
      parseAndSetError(err);
    };

    const parseAndSetError = (err) => {
      let title = 'Location Detection Failed';
      let message = err.message || 'Unable to determine your current location.';

      if (err.code === 1 /* PERMISSION_DENIED */) {
        title = 'Location Permission Denied';
        message = 'Location access was blocked. Click the lock icon 🔒 in your browser address bar, set Location to "Allow", and click "Detect My Location" again.';
      } else if (err.code === 2 /* POSITION_UNAVAILABLE */) {
        title = 'Location Unavailable';
        message = 'Your device GPS / network could not acquire a fix. You can pinpoint your site by clicking on the map.';
      } else if (err.code === 3 /* TIMEOUT */) {
        title = 'Location Request Timed Out';
        message = 'The location request timed out. Please verify your device location settings, or select your location on the map.';
      }

      setGeoStatus({
        type: 'error',
        title,
        message
      });
    };

    navigator.geolocation.getCurrentPosition(handleSuccess, handleFailure, highAccuracyOptions);
  };

  return (
    <div className="space-y-3">
      {/* Top Header & Actions */}
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
        <span className="font-semibold text-slate-700 flex items-center gap-1.5">
          <MapPin className="w-3.5 h-3.5 text-brand-600" />
          Observation Location (Click map or use GPS):
        </span>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleDetectLocation}
            disabled={geoLocating}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium text-xs border transition-all shadow-sm ${
              geoLocating
                ? 'bg-brand-100 text-brand-800 border-brand-300 cursor-wait'
                : 'bg-brand-600 hover:bg-brand-700 text-white border-brand-600 active:scale-95'
            }`}
          >
            {geoLocating ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Navigation className="w-3.5 h-3.5" />
            )}
            <span>{geoLocating ? 'Detecting Location...' : 'Detect My Location'}</span>
          </button>

          <button
            type="button"
            onClick={() => setShowManualInputs(!showManualInputs)}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 transition-colors"
            title="Type exact coordinates"
          >
            <Edit3 className="w-3 h-3 text-slate-500" />
            <span>{showManualInputs ? 'Hide Inputs' : 'Manual Coordinates'}</span>
          </button>
        </div>
      </div>

      {/* Status Alert Banner */}
      {geoStatus && (
        <div
          className={`relative flex items-start gap-2.5 p-3 rounded-xl border text-xs transition-all animate-fadeIn ${
            geoStatus.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : geoStatus.type === 'loading'
              ? 'bg-brand-50 border-brand-200 text-brand-800'
              : geoStatus.type === 'info'
              ? 'bg-sky-50 border-sky-200 text-sky-800'
              : 'bg-rose-50 border-rose-200 text-rose-800'
          }`}
        >
          {geoStatus.type === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />}
          {geoStatus.type === 'loading' && <Loader2 className="w-4 h-4 text-brand-600 animate-spin shrink-0 mt-0.5" />}
          {geoStatus.type === 'info' && <Compass className="w-4 h-4 text-sky-600 shrink-0 mt-0.5" />}
          {geoStatus.type === 'error' && <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />}

          <div className="flex-1 pr-5">
            <p className="font-semibold">{geoStatus.title}</p>
            <p className="mt-0.5 opacity-90 leading-relaxed">{geoStatus.message}</p>
          </div>

          <button
            type="button"
            onClick={() => setGeoStatus(null)}
            className="absolute top-2.5 right-2.5 text-slate-400 hover:text-slate-600 p-0.5 rounded-md hover:bg-black/5"
            aria-label="Dismiss message"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Manual Input Drawer */}
      {showManualInputs && (
        <form onSubmit={handleManualApply} className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-2 text-xs animate-fadeIn">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-slate-700 flex items-center gap-1">
              <Crosshair className="w-3.5 h-3.5 text-brand-600" />
              Specify Exact GPS Coordinates
            </span>
            <span className="text-[11px] text-slate-400">Decimal degrees (e.g. 16.4382, 80.6010)</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <div>
              <label className="block text-[11px] font-medium text-slate-600 mb-0.5">Latitude (°N)</label>
              <input
                type="number"
                step="any"
                value={manualLat}
                onChange={(e) => setManualLat(e.target.value)}
                placeholder="16.438200"
                className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs font-mono focus:ring-1 focus:ring-brand-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-[11px] font-medium text-slate-600 mb-0.5">Longitude (°E)</label>
              <input
                type="number"
                step="any"
                value={manualLng}
                onChange={(e) => setManualLng(e.target.value)}
                placeholder="80.601000"
                className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs font-mono focus:ring-1 focus:ring-brand-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={handleResetDefault}
              className="flex items-center gap-1 px-2.5 py-1 rounded text-slate-600 hover:text-slate-800 hover:bg-slate-200 transition-colors"
            >
              <RotateCcw className="w-3 h-3" /> Reset to Nutakki
            </button>
            <button
              type="submit"
              className="px-3 py-1 bg-brand-600 hover:bg-brand-700 text-white rounded font-medium shadow-sm transition-colors"
            >
              Apply Coordinates
            </button>
          </div>
        </form>
      )}

      {/* Map Canvas */}
      <div className="relative h-64 sm:h-72 w-full rounded-xl overflow-hidden border border-slate-300 shadow-inner">
        <MapContainer
          center={currentPos}
          zoom={15}
          scrollWheelZoom={false}
          className="h-full w-full"
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          <MapClickHandler onLocationSelect={onLocationChange} />
          <MapViewController center={currentPos} zoom={16} flyTrigger={flyTrigger} />

          {latitude && longitude && (
            <Marker position={[Number(latitude), Number(longitude)]} icon={customMarkerIcon}>
              <Popup>
                <div className="text-xs p-1">
                  <strong className="text-brand-700">Observation Site Selected</strong>
                  <div className="mt-1 font-mono text-[11px] text-slate-600">
                    Lat: {Number(latitude).toFixed(6)}°
                    <br />
                    Lng: {Number(longitude).toFixed(6)}°
                  </div>
                  <div className="mt-1 text-[10px] text-slate-400 italic">
                    Click anywhere on the map to change position.
                  </div>
                </div>
              </Popup>
            </Marker>
          )}
        </MapContainer>

        {/* Floating helper badges */}
        <div className="absolute bottom-2 left-2 z-[400] bg-white/95 backdrop-blur-sm px-2.5 py-1 rounded-md text-[11px] font-medium text-slate-600 shadow border border-slate-200 pointer-events-none flex items-center gap-1.5">
          <Crosshair className="w-3 h-3 text-brand-600" />
          Click anywhere on the map to pinpoint exact site
        </div>

        {geoLocating && (
          <div className="absolute top-2 left-1/2 -translate-x-1/2 z-[400] bg-white/95 backdrop-blur-sm px-3 py-1.5 rounded-full shadow-lg border border-brand-200 flex items-center gap-2 text-xs font-semibold text-brand-700 animate-pulse pointer-events-none">
            <Loader2 className="w-3.5 h-3.5 animate-spin text-brand-600" />
            Detecting device GPS...
          </div>
        )}
      </div>

      {/* Coordinates Display & Presets */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs">
        <div className="text-slate-600 font-mono">
          {latitude && longitude ? (
            <span className="inline-flex items-center gap-1 bg-brand-50 px-2.5 py-1 rounded-md border border-brand-200 text-brand-800 font-semibold shadow-xs">
              📍 {Number(latitude).toFixed(6)}° N, {Number(longitude).toFixed(6)}° E
            </span>
          ) : (
            <span className="text-slate-400 italic">No coordinates selected</span>
          )}
        </div>

        {/* Quick Presets */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-slate-400 flex items-center gap-1 text-[11px]">
            <Compass className="w-3 h-3" /> Quick Presets:
          </span>
          {presets.map((p, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handleSelectPreset(p.lat, p.lng)}
              className="text-[11px] bg-slate-100 hover:bg-brand-50 hover:text-brand-700 px-2 py-0.5 rounded text-slate-600 border border-slate-200 transition-colors"
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
