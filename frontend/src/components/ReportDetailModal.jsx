import React from 'react';
import { X, Calendar, MapPin, Droplet, ShieldAlert, CheckCircle, Clock, ExternalLink, Copy, Check } from 'lucide-react';
import { useState } from 'react';
import { getPhotoUrl } from '../services/api';

export default function ReportDetailModal({ report, onClose, onNavigateSafety }) {
  const [copied, setCopied] = useState(false);

  if (!report) return null;

  const handleCopyId = () => {
    navigator.clipboard.writeText(report.id);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getStatusBadge = (status) => {
    if (status === 'Resolved') {
      return (
        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
          <CheckCircle className="w-3.5 h-3.5" />
          Resolved
        </span>
      );
    }
    if (status === 'Under Review') {
      return (
        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-200">
          <Clock className="w-3.5 h-3.5" />
          Under Review
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-teal-100 text-teal-800 border border-teal-200">
        <Droplet className="w-3.5 h-3.5" />
        Submitted
      </span>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden border border-slate-200">
        
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-3">
            <span className="font-mono font-bold text-lg text-slate-800">{report.id}</span>
            <button
              onClick={handleCopyId}
              className="p-1 text-slate-400 hover:text-slate-600 rounded transition-colors"
              title="Copy Report ID"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
            </button>
            {getStatusBadge(report.status)}
            {report.is_demo && (
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-purple-100 text-purple-700 border border-purple-200">
                Demo Sample
              </span>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6 overflow-y-auto">
          
          {/* Unverified Disclaimer Box */}
          <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-start gap-3">
            <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-amber-950">Unverified Community Observation</p>
              <p className="mt-0.5 leading-relaxed text-amber-800">
                This record reflects an observational report from a community member. Visual, smell, or taste concerns do not substitute for formal laboratory chemical or microbiological testing.
              </p>
            </div>
          </div>

          {/* Key Meta Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm bg-slate-50 p-4 rounded-xl border border-slate-100">
            <div>
              <span className="text-xs text-slate-400 block font-medium">Issue Category</span>
              <span className="font-semibold text-slate-800">{report.category}</span>
            </div>
            <div>
              <span className="text-xs text-slate-400 block font-medium">Water Source</span>
              <span className="font-semibold text-slate-800">{report.water_source || 'Not specified'}</span>
            </div>
            <div>
              <span className="text-xs text-slate-400 block font-medium">Village / Locality</span>
              <span className="font-semibold text-slate-800 flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-brand-600" />
                {report.village}
              </span>
            </div>
            <div>
              <span className="text-xs text-slate-400 block font-medium">Date Observed</span>
              <span className="font-semibold text-slate-800 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-slate-500" />
                {report.date_observed}
              </span>
            </div>
            {report.landmark && (
              <div className="sm:col-span-2">
                <span className="text-xs text-slate-400 block font-medium">Nearby Landmark</span>
                <span className="text-slate-700">{report.landmark}</span>
              </div>
            )}
          </div>

          {/* Description */}
          <div>
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
              Detailed Observation
            </h4>
            <div className="p-4 rounded-xl bg-white border border-slate-200 text-slate-700 text-sm leading-relaxed whitespace-pre-wrap">
              {report.description}
            </div>
          </div>

          {/* Photo if present */}
          {report.photo_url && (
            <div>
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                Attached Photographic Evidence
              </h4>
              <div className="rounded-xl overflow-hidden border border-slate-200 bg-slate-100 max-h-72">
                <img
                  src={getPhotoUrl(report.photo_url)}
                  alt="Pollution report evidence"
                  className="w-full h-auto object-cover max-h-72 hover:scale-105 transition-transform duration-300"
                  loading="lazy"
                />
              </div>
            </div>
          )}

          {/* Location Coordinates */}
          {report.latitude && report.longitude && (
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs">
              <span className="text-slate-600 font-mono">
                GPS: {Number(report.latitude).toFixed(4)}° N, {Number(report.longitude).toFixed(4)}° E
              </span>
              <a
                href={`https://www.openstreetmap.org/?mlat=${report.latitude}&mlon=${report.longitude}#map=16/${report.latitude}/${report.longitude}`}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1 text-brand-600 hover:text-brand-700 font-medium"
              >
                <span>View on OpenStreetMap</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          )}

          {/* Next Steps Advisory */}
          <div className="p-4 rounded-2xl bg-teal-50/70 border border-teal-200/80 text-xs text-slate-700 space-y-2">
            <span className="font-semibold text-teal-900 block">Recommended Next Steps for Residents:</span>
            <ul className="list-disc pl-4 space-y-1 text-slate-600">
              <li>Avoid using water for direct drinking or cooking until tested.</li>
              <li>Request official laboratory testing from the local RWS&S or APPCB division.</li>
              <li>Report severe persistent contamination to the AP Spandana helpline (1902).</li>
            </ul>
          </div>

        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
          <button
            onClick={() => {
              onClose();
              if (onNavigateSafety) onNavigateSafety();
            }}
            className="text-xs font-bold text-teal-700 hover:text-teal-900"
          >
            Read Water Safety & Testing Protocols &rarr;
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-900 text-white text-xs font-semibold transition-colors"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
}
