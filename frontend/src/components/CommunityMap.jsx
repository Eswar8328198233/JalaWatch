import React, { useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import { AlertTriangle, Clock, MapPin, Eye, ExternalLink, X, ShieldAlert } from 'lucide-react';

const createCommunityIcon = (report, isSelected) => {
  const isHighConcern = report.category === 'Unusual water colour' || report.status === 'Under Review';
  const isResolved = report.status === 'Resolved';

  let pulseClass = 'marker-pulse-teal';
  let dotColor = '#0d9488'; // teal
  let iconHtml = '💧';

  if (isHighConcern) {
    pulseClass = 'marker-pulse-orange';
    dotColor = '#ea580c'; // orange
    iconHtml = '!';
  } else if (isResolved) {
    pulseClass = 'marker-pulse-emerald';
    dotColor = '#10b981'; // emerald
    iconHtml = '✓';
  }

  const landmarkLabel = report.landmark 
    ? (report.landmark.length > 20 ? report.landmark.substring(0, 18) + '…' : report.landmark)
    : report.village;

  return new L.DivIcon({
    className: 'custom-marker-wrapper',
    html: `
      <div style="position: relative; width: 28px; height: 28px; display: flex; align-items: center; justify-content: center;">
        <div class="${pulseClass}"></div>
        <div style="
          width: 28px; 
          height: 28px; 
          border-radius: 50%; 
          background-color: ${dotColor}; 
          color: white; 
          display: flex; 
          align-items: center; 
          justify-content: center; 
          font-weight: 800; 
          font-size: 13px; 
          border: 2.5px solid #ffffff;
          box-shadow: 0 4px 12px rgba(0,0,0,0.2);
        ">
          ${iconHtml}
        </div>
        <div class="marker-callout-pill" style="font-size: 10px; font-weight: 700;">
          <span style="color: ${dotColor};">●</span>
          <span>${landmarkLabel}</span>
          <span style="color: #94a3b8; font-size: 9px; margin-left: 2px;">ⓘ</span>
        </div>
      </div>
    `,
    iconSize: [28, 28],
    iconAnchor: [14, 14],
  });
};

export default function CommunityMap({ reports, onSelectReport }) {
  const [activeReport, setActiveReport] = useState(null);
  const validReports = reports.filter((r) => r.latitude && r.longitude);
  const defaultCenter = [16.4382, 80.6010]; // Nutakki

  const handleMarkerClick = (report) => {
    setActiveReport(report);
    if (onSelectReport) onSelectReport(report);
  };

  return (
    <div className="relative w-full h-[580px] rounded-3xl overflow-hidden border border-slate-200 shadow-soft">
      <MapContainer
        center={defaultCenter}
        zoom={13}
        scrollWheelZoom={true}
        className="h-full w-full"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {validReports.map((report) => (
          <Marker
            key={report.id}
            position={[report.latitude, report.longitude]}
            icon={createCommunityIcon(report, activeReport?.id === report.id)}
            eventHandlers={{
              click: () => handleMarkerClick(report),
            }}
          />
        ))}
      </MapContainer>

      {/* Floating Legend */}
      <div className="absolute top-4 right-4 z-[400] bg-white/95 backdrop-blur-md p-3.5 rounded-2xl shadow-float border border-slate-200 text-xs space-y-2 pointer-events-auto">
        <span className="font-bold text-slate-800 text-[11px] uppercase tracking-wider block">Hotspots</span>
        <div className="flex items-center gap-2 text-[11px]">
          <span className="w-2.5 h-2.5 rounded-full bg-orange-500 inline-block"></span>
          <span className="text-slate-700">Under Review</span>
        </div>
        <div className="flex items-center gap-2 text-[11px]">
          <span className="w-2.5 h-2.5 rounded-full bg-teal-600 inline-block"></span>
          <span className="text-slate-700">Submitted</span>
        </div>
        <div className="flex items-center gap-2 text-[11px]">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block"></span>
          <span className="text-slate-700">Resolved</span>
        </div>
        <div className="text-[10px] text-slate-400 pt-1 border-t border-slate-100">
          Showing {validReports.length} geocoded reports
        </div>
      </div>

      {/* Floating Preview Card on Map */}
      {activeReport && (
        <div className="absolute bottom-4 left-4 right-4 sm:left-auto sm:right-4 sm:w-80 z-[450] bg-white rounded-2xl p-4 shadow-float border border-slate-200 pointer-events-auto animate-in slide-in-from-bottom-2">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <span className="font-mono text-xs font-bold text-teal-800 bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
              {activeReport.id}
            </span>
            <button onClick={() => setActiveReport(null)} className="text-slate-400 hover:text-slate-600 p-0.5">
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="py-2 space-y-1">
            <h4 className="font-bold text-slate-900 text-sm line-clamp-1">
              {activeReport.landmark || activeReport.village}
            </h4>
            <p className="text-[11px] text-slate-500 flex items-center gap-1">
              <MapPin className="w-3 h-3 text-teal-600 shrink-0" />
              <span>{activeReport.village}</span>
            </p>
            <p className="text-xs text-slate-600 line-clamp-2 pt-1 leading-relaxed">
              {activeReport.description}
            </p>
          </div>

          <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
            <span className="text-[10px] text-amber-700 font-semibold bg-amber-50 px-1.5 py-0.5 rounded">
              Unverified
            </span>
            <button
              onClick={() => onSelectReport(activeReport)}
              className="text-xs font-bold text-teal-700 hover:text-teal-900 flex items-center gap-1"
            >
              <span>View Full Report</span>
              <Eye className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
