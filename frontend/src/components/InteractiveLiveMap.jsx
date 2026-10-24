import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import { 
  AlertTriangle, Droplets, CheckCircle, Clock, ShieldAlert, 
  MapPin, Calendar, ExternalLink, X, ChevronRight, Navigation,
  Layers, Compass, Info, Filter, Search, Sparkles
} from 'lucide-react';

// Custom Marker Generator with Pulsing Concentric Halos & Callout Pills
const createPulsingIcon = (report, isSelected) => {
  const isHighConcern = report.category === 'Unusual water colour' || report.status === 'Under Review';
  const isResolved = report.status === 'Resolved';

  let pulseClass = 'marker-pulse-teal';
  let dotColor = '#0d9488'; // teal
  let iconHtml = '💧';

  if (isHighConcern) {
    pulseClass = 'marker-pulse-orange';
    dotColor = '#ea580c'; // vibrant orange
    iconHtml = '!';
  } else if (isResolved) {
    pulseClass = 'marker-pulse-emerald';
    dotColor = '#10b981'; // emerald
    iconHtml = '✓';
  }

  const selectedRing = isSelected 
    ? 'box-shadow: 0 0 0 4px #ffffff, 0 0 0 7px ' + dotColor + ', 0 12px 24px rgba(0,0,0,0.25); transform: scale(1.18);' 
    : 'box-shadow: 0 4px 12px rgba(0,0,0,0.2);';

  const landmarkLabel = report.landmark 
    ? (report.landmark.length > 22 ? report.landmark.substring(0, 20) + '…' : report.landmark)
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
          transition: all 0.2s ease;
          ${selectedRing}
        ">
          ${iconHtml}
        </div>
        <div class="marker-callout-pill" style="opacity: ${isSelected ? '1' : '0.9'}; font-size: 10px; font-weight: 700; transform: translateY(${isSelected ? '-3px' : '0px'});">
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

// Sub-component to pan to selected coordinate
function MapViewUpdater({ center, zoom }) {
  const map = useMap();
  useEffect(() => {
    if (center) {
      map.flyTo(center, zoom || 14, { duration: 1.2 });
    }
  }, [center, zoom, map]);
  return null;
}

export default function InteractiveLiveMap({ 
  reports = [], 
  selectedReport, 
  onSelectReport, 
  onNavigateSafety,
  onNavigateReport
}) {
  const [activeVillage, setActiveVillage] = useState('All');
  const [activeCategory, setActiveCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [mapCenter, setMapCenter] = useState([16.4382, 80.6010]); // Nutakki Center
  const [mapZoom, setMapZoom] = useState(14);
  const [showLegend, setShowLegend] = useState(true);

  const villages = ['All', 'Nutakki', 'Tadepalli Rural', 'Mangalagiri Rural', 'Kunchanapalli'];
  const categories = ['All', 'Unusual water colour', 'Bad smell or taste', 'Drainage problems', 'Suspected waste dumping'];

  // Filter reports
  const filteredReports = reports.filter((r) => {
    if (!r.latitude || !r.longitude) return false;
    if (activeVillage !== 'All' && r.village !== activeVillage) return false;
    if (activeCategory !== 'All' && r.category !== activeCategory) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchId = r.id.toLowerCase().includes(q);
      const matchVillage = r.village.toLowerCase().includes(q);
      const matchLandmark = (r.landmark || '').toLowerCase().includes(q);
      const matchDesc = r.description.toLowerCase().includes(q);
      if (!matchId && !matchVillage && !matchLandmark && !matchDesc) return false;
    }
    return true;
  });

  const handleCenterNutakki = () => {
    setMapCenter([16.4382, 80.6010]);
    setMapZoom(14);
  };

  const handleMarkerClick = (report) => {
    onSelectReport(report);
    setMapCenter([report.latitude, report.longitude]);
  };

  return (
    <div className="relative w-full h-[620px] sm:h-[700px] lg:h-[760px] rounded-3xl overflow-hidden border border-slate-200/90 shadow-soft bg-slate-100 flex flex-col">
      
      {/* Top Floating Control Bar (Reference Image 1 & 3: search + filter bar) */}
      <div className="absolute top-4 left-4 right-4 z-[400] flex flex-col md:flex-row items-stretch md:items-center justify-between gap-2.5 pointer-events-none">
        
        {/* Search & Location Pill */}
        <div className="flex items-center gap-2 bg-white/95 backdrop-blur-md px-3.5 py-2 rounded-2xl shadow-float border border-slate-200/80 pointer-events-auto">
          <Search className="w-4 h-4 text-teal-600 shrink-0" />
          <input
            type="text"
            placeholder="Search landmark, concern, or ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="text-xs bg-transparent border-none focus:outline-none w-44 sm:w-60 text-slate-800 placeholder-slate-400 font-medium"
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery('')} className="text-slate-400 hover:text-slate-600">
              <X className="w-3.5 h-3.5" />
            </button>
          )}

          <div className="h-4 w-px bg-slate-200 mx-1 hidden sm:block" />

          {/* Village Filter dropdown */}
          <div className="relative hidden sm:flex items-center">
            <MapPin className="w-3.5 h-3.5 text-teal-600 mr-1 shrink-0" />
            <select
              value={activeVillage}
              onChange={(e) => setActiveVillage(e.target.value)}
              className="text-xs font-semibold bg-transparent border-none text-slate-700 focus:outline-none cursor-pointer pr-4"
            >
              {villages.map((v) => (
                <option key={v} value={v}>
                  {v === 'All' ? 'All Localities' : v}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Category Pills (horizontal scroll on mobile) */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1 pointer-events-auto">
          {categories.slice(0, 4).map((cat) => {
            const isSelected = activeCategory === cat;
            return (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`whitespace-nowrap px-3 py-1.5 rounded-full text-xs font-semibold transition-all shadow-xs ${
                  isSelected
                    ? 'bg-teal-700 text-white shadow-teal-700/20'
                    : 'bg-white/90 hover:bg-white text-slate-700 border border-slate-200 backdrop-blur-sm'
                }`}
              >
                {cat === 'All' ? 'All Issues' : cat}
              </button>
            );
          })}
        </div>

      </div>

      {/* Floating Action Buttons on Map (Center on Nutakki & Legend Toggle) */}
      <div className="absolute top-20 right-4 z-[400] flex flex-col gap-2 pointer-events-auto">
        <button
          onClick={handleCenterNutakki}
          title="Center on Nutakki Village"
          className="p-2.5 rounded-2xl bg-white/95 hover:bg-white text-slate-700 hover:text-teal-700 shadow-float border border-slate-200/80 transition-all hover:scale-105"
        >
          <Compass className="w-5 h-5 text-teal-600" />
        </button>

        <button
          onClick={() => setShowLegend(!showLegend)}
          title="Toggle Legend"
          className={`p-2.5 rounded-2xl bg-white/95 hover:bg-white shadow-float border border-slate-200/80 transition-all ${
            showLegend ? 'text-teal-700' : 'text-slate-400'
          }`}
        >
          <Layers className="w-5 h-5" />
        </button>
      </div>

      {/* Map Legend (Reference Image 1: Calypso & Merrimack) */}
      {showLegend && (
        <div className="absolute top-36 right-4 z-[400] bg-white/95 backdrop-blur-md p-3.5 rounded-2xl shadow-float border border-slate-200/80 text-xs space-y-2 pointer-events-auto max-w-xs animate-in fade-in">
          <div className="flex items-center justify-between border-b border-slate-100 pb-1.5">
            <span className="font-bold text-slate-800 text-[11px] uppercase tracking-wider">
              Observation Hotspots
            </span>
            <button onClick={() => setShowLegend(false)} className="text-slate-400 hover:text-slate-600">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-1.5 text-[11px]">
            <div className="flex items-center gap-2">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-orange-500"></span>
              </span>
              <span className="text-slate-700 font-medium">Under Review / Discoloured Water</span>
            </div>

            <div className="flex items-center gap-2">
              <span className="relative flex h-3 w-3">
                <span className="relative inline-flex rounded-full h-3 w-3 bg-teal-600"></span>
              </span>
              <span className="text-slate-700 font-medium">Submitted Observation</span>
            </div>

            <div className="flex items-center gap-2">
              <span className="relative flex h-3 w-3">
                <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
              </span>
              <span className="text-slate-700 font-medium">Addressed / Resolved</span>
            </div>
          </div>

          <div className="pt-1.5 border-t border-slate-100 text-[10px] text-amber-700 font-medium flex items-center gap-1">
            <ShieldAlert className="w-3 h-3 text-amber-500 shrink-0" />
            <span>Unverified community records</span>
          </div>
        </div>
      )}

      {/* Leaflet Map Canvas */}
      <div className="flex-1 w-full h-full">
        <MapContainer
          center={mapCenter}
          zoom={mapZoom}
          scrollWheelZoom={true}
          className="h-full w-full"
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <MapViewUpdater center={mapCenter} zoom={mapZoom} />

          {filteredReports.map((report) => {
            const isSelected = selectedReport?.id === report.id;
            return (
              <Marker
                key={report.id}
                position={[report.latitude, report.longitude]}
                icon={createPulsingIcon(report, isSelected)}
                eventHandlers={{
                  click: () => handleMarkerClick(report),
                }}
              />
            );
          })}
        </MapContainer>
      </div>

      {/* Floating White Report-Details Panel (Matching Reference Image 3: "Greater Lawrence Sanitary District" Card) */}
      {selectedReport && (
        <div className="absolute bottom-4 left-4 right-4 sm:left-auto sm:right-6 sm:bottom-6 sm:w-96 z-[450] bg-white rounded-3xl p-5 shadow-float border border-slate-200/90 animate-in slide-in-from-bottom-4 duration-300 pointer-events-auto max-h-[85vh] overflow-y-auto">
          
          {/* Top Banner Alert inside Card (Matching Image 3: ⚠️ OVERFLOW WARNING) */}
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-800 text-[11px] font-bold">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
              <span>UNVERIFIED COMMUNITY REPORT</span>
            </div>
            <button
              onClick={() => onSelectReport(null)}
              className="p-1 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
              title="Close Panel"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Report Title & Subtitle */}
          <div className="pt-3 space-y-1">
            <div className="flex items-center justify-between gap-2">
              <span className="font-mono text-xs font-bold text-teal-800 bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
                {selectedReport.id}
              </span>
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  selectedReport.status === 'Resolved'
                    ? 'bg-emerald-100 text-emerald-800'
                    : selectedReport.status === 'Under Review'
                    ? 'bg-amber-100 text-amber-800'
                    : 'bg-teal-100 text-teal-800'
                }`}
              >
                {selectedReport.status}
              </span>
            </div>

            <h3 className="font-extrabold text-slate-900 text-base font-['Outfit'] pt-1 leading-snug">
              {selectedReport.landmark || `${selectedReport.category} in ${selectedReport.village}`}
            </h3>

            <p className="text-xs text-slate-500 flex items-center gap-1 font-medium">
              <MapPin className="w-3.5 h-3.5 text-teal-600 shrink-0" />
              <span>{selectedReport.village}, Mangalagiri Mandal, AP</span>
            </p>
          </div>

          {/* Date & Time Metadata Ribbon (Matching Reference 3) */}
          <div className="grid grid-cols-2 gap-2 my-3 p-2.5 rounded-xl bg-slate-50 text-[11px] border border-slate-100">
            <div>
              <span className="text-slate-400 font-semibold block uppercase text-[10px]">Date Observed</span>
              <span className="font-bold text-slate-700">{selectedReport.date_observed}</span>
            </div>
            <div>
              <span className="text-slate-400 font-semibold block uppercase text-[10px]">Water Source</span>
              <span className="font-bold text-slate-700 truncate block">{selectedReport.water_source || 'Borewell'}</span>
            </div>
          </div>

          {/* Description */}
          <div className="space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Community Observation:
            </span>
            <p className="text-xs text-slate-600 leading-relaxed max-h-32 overflow-y-auto">
              {selectedReport.description}
            </p>
          </div>

          {/* Photo Preview if attached */}
          {selectedReport.photo_url && (
            <div className="mt-3 rounded-xl overflow-hidden border border-slate-200 bg-slate-100 max-h-36">
              <img
                src={selectedReport.photo_url}
                alt="Evidence"
                className="w-full h-full object-cover"
              />
            </div>
          )}

          {/* Action CTAs */}
          <div className="pt-4 mt-3 border-t border-slate-100 space-y-2">
            <button
              onClick={() => onNavigateSafety && onNavigateSafety()}
              className="w-full py-2 px-3 rounded-xl bg-teal-50 hover:bg-teal-100 text-teal-800 text-xs font-bold transition-colors flex items-center justify-center gap-1.5 border border-teal-200"
            >
              <span>How to Request Lab Water Testing</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>

            <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
              <span>GPS: {Number(selectedReport.latitude).toFixed(4)}°, {Number(selectedReport.longitude).toFixed(4)}°</span>
              <a
                href={`https://www.openstreetmap.org/?mlat=${selectedReport.latitude}&mlon=${selectedReport.longitude}#map=16/${selectedReport.latitude}/${selectedReport.longitude}`}
                target="_blank"
                rel="noreferrer"
                className="text-teal-700 hover:text-teal-900 font-semibold flex items-center gap-0.5"
              >
                <span>OSM</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>

        </div>
      )}

      {/* Floating Bottom Location / Report Switcher Ribbon (Matching Reference 3: "Showing 6 wastewater plants near: Lawrence, MA ⇅") */}
      {!selectedReport && (
        <div className="absolute bottom-4 left-4 right-4 z-[400] flex items-center justify-between pointer-events-none">
          <div className="bg-white/95 backdrop-blur-md px-4 py-2.5 rounded-full shadow-float border border-slate-200/80 flex items-center gap-2 pointer-events-auto text-xs text-slate-700 font-medium">
            <span className="w-2 h-2 rounded-full bg-teal-500 animate-ping shrink-0" />
            <span>Showing <strong className="text-slate-900">{filteredReports.length}</strong> reported concerns near <strong className="text-teal-800">Nutakki & Krishna Basin</strong></span>
          </div>

          <button
            onClick={() => onNavigateReport && onNavigateReport()}
            className="hidden sm:flex items-center gap-1.5 px-4 py-2.5 rounded-full bg-teal-700 hover:bg-teal-800 text-white shadow-float text-xs font-bold pointer-events-auto transition-transform hover:scale-105"
          >
            <span>+ Report Concern</span>
          </button>
        </div>
      )}

    </div>
  );
}
