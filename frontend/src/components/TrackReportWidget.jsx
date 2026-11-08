import React, { useState } from 'react';
import { 
  Search, CheckCircle2, Clock, Droplets, AlertTriangle, 
  MapPin, Calendar, Share2, Copy, Check, FlaskConical, ExternalLink, X, ShieldAlert
} from 'lucide-react';
import { getReportById, getPhotoUrl } from '../services/api';
import { useLanguage } from '../context/LanguageContext';

export default function TrackReportWidget({ onOpenReportModal }) {
  const { t, lang } = useLanguage();
  const [reportIdInput, setReportIdInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);

  const handleTrackSubmit = async (e) => {
    e.preventDefault();
    const cleanId = reportIdInput.trim().toUpperCase();
    if (!cleanId) return;

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const data = await getReportById(cleanId);
      if (data && data.report) {
        setResult(data.report);
      } else {
        setError(t('track_error_not_found'));
      }
    } catch (err) {
      setError(t('track_error_not_found'));
    } finally {
      setLoading(false);
    }
  };

  const handleCopyId = (id) => {
    navigator.clipboard.writeText(id);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getWhatsAppShareUrl = (report) => {
    const text = `*JalaWatch Groundwater Report Update*\n` +
      `Report ID: ${report.id}\n` +
      `Location: ${report.village}${report.landmark ? ` (${report.landmark})` : ''}\n` +
      `Concern: ${report.category}\n` +
      `Current Status: ${report.status}\n` +
      `Date: ${report.date_observed}\n` +
      `Track online: ${window.location.origin}${window.location.pathname}#reports`;
    return `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;
  };

  const getStatusBadge = (status) => {
    if (status === 'Resolved') {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
          {t('status_resolved')}
        </span>
      );
    }
    if (status === 'Under Review') {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-300">
          <Clock className="w-3.5 h-3.5 text-amber-600 animate-pulse" />
          {t('status_under_review')}
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-teal-100 text-teal-800 border border-teal-300">
        <Droplets className="w-3.5 h-3.5 text-teal-600" />
        {t('status_submitted')}
      </span>
    );
  };

  return (
    <div id="track-report-section" className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-soft">
      <div className="max-w-3xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="text-center space-y-1.5">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-50 border border-teal-200 text-teal-800 text-xs font-bold">
            <Search className="w-3.5 h-3.5 text-teal-600" />
            <span>{t('track_title')}</span>
          </div>
          <h3 className="text-xl sm:text-2xl font-extrabold text-slate-900 font-['Outfit']">
            {t('track_title')}
          </h3>
          <p className="text-xs sm:text-sm text-slate-500 max-w-xl mx-auto leading-relaxed">
            {t('track_subtitle')}
          </p>
        </div>

        {/* Search Input Box */}
        <form onSubmit={handleTrackSubmit} className="flex flex-col sm:flex-row items-stretch gap-2.5 max-w-xl mx-auto">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5 pointer-events-none" />
            <input
              type="text"
              value={reportIdInput}
              onChange={(e) => setReportIdInput(e.target.value)}
              placeholder={t('track_placeholder')}
              className="w-full pl-10 pr-4 py-2.5 text-xs sm:text-sm rounded-2xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent uppercase font-mono tracking-wide placeholder:normal-case placeholder:font-sans placeholder:tracking-normal bg-slate-50/50"
            />
          </div>
          <button
            type="submit"
            disabled={loading || !reportIdInput.trim()}
            className="px-6 py-2.5 rounded-2xl bg-teal-600 hover:bg-teal-700 disabled:bg-slate-300 text-white font-bold text-xs sm:text-sm shadow-md transition-colors flex items-center justify-center gap-2 shrink-0"
          >
            {loading ? (
              <span>{t('track_searching')}</span>
            ) : (
              <>
                <Search className="w-4 h-4" />
                <span>{t('track_btn')}</span>
              </>
            )}
          </button>
        </form>

        {/* Error Notice */}
        {error && (
          <div className="max-w-xl mx-auto p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2.5 animate-in fade-in">
            <AlertTriangle className="w-4 h-4 shrink-0 text-rose-500" />
            <span>{error}</span>
          </div>
        )}

        {/* Tracking Result Card */}
        {result && (
          <div className="max-w-2xl mx-auto bg-gradient-to-br from-slate-50 to-teal-50/40 rounded-3xl p-5 sm:p-7 border border-teal-200 shadow-md space-y-5 animate-in zoom-in-95">
            
            {/* Top Row: ID, Badges, Copy */}
            <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <span className="font-mono text-base font-extrabold text-teal-900 bg-white px-3 py-1 rounded-xl border border-teal-200 shadow-2xs">
                  {result.id}
                </span>
                <button
                  type="button"
                  onClick={() => handleCopyId(result.id)}
                  className="p-1.5 text-slate-400 hover:text-teal-700 rounded-lg hover:bg-white transition-colors"
                  title="Copy ID"
                >
                  {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
              <div className="flex items-center gap-2">
                {getStatusBadge(result.status)}
                {result.is_verified ? (
                  <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-teal-600 text-white flex items-center gap-1">
                    <FlaskConical className="w-3 h-3" />
                    <span>Lab Verified</span>
                  </span>
                ) : (
                  <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-amber-100 text-amber-800 border border-amber-200">
                    {t('unverified_badge')}
                  </span>
                )}
              </div>
            </div>

            {/* Public Timeline Progress Bar */}
            <div className="space-y-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                {t('track_latest_update')}
              </span>
              <div className="grid grid-cols-3 gap-2 text-center text-xs">
                
                {/* Step 1: Submitted */}
                <div className={`p-2.5 rounded-xl border ${
                  result.status === 'Submitted' || result.status === 'Under Review' || result.status === 'Resolved'
                    ? 'bg-white border-teal-300 text-teal-800 font-bold shadow-2xs'
                    : 'bg-slate-100 border-slate-200 text-slate-400'
                }`}>
                  <div className="flex items-center justify-center gap-1 mb-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-teal-600" />
                    <span>1. {t('status_submitted')}</span>
                  </div>
                  <span className="text-[10px] text-slate-400 font-normal">{result.date_observed}</span>
                </div>

                {/* Step 2: Under Review */}
                <div className={`p-2.5 rounded-xl border ${
                  result.status === 'Under Review' || result.status === 'Resolved'
                    ? 'bg-white border-amber-300 text-amber-900 font-bold shadow-2xs'
                    : 'bg-slate-100 border-slate-200 text-slate-400'
                }`}>
                  <div className="flex items-center justify-center gap-1 mb-1">
                    <Clock className={`w-3.5 h-3.5 ${result.status === 'Under Review' ? 'text-amber-500 animate-spin' : 'text-slate-400'}`} />
                    <span>2. {t('status_under_review')}</span>
                  </div>
                  <span className="text-[10px] text-slate-400 font-normal">
                    {result.status === 'Under Review' ? 'In Progress' : result.status === 'Resolved' ? 'Completed' : 'Pending'}
                  </span>
                </div>

                {/* Step 3: Resolved */}
                <div className={`p-2.5 rounded-xl border ${
                  result.status === 'Resolved'
                    ? 'bg-white border-emerald-300 text-emerald-900 font-bold shadow-2xs'
                    : 'bg-slate-100 border-slate-200 text-slate-400'
                }`}>
                  <div className="flex items-center justify-center gap-1 mb-1">
                    <CheckCircle2 className={`w-3.5 h-3.5 ${result.status === 'Resolved' ? 'text-emerald-600' : 'text-slate-400'}`} />
                    <span>3. {t('status_resolved')}</span>
                  </div>
                  <span className="text-[10px] text-slate-400 font-normal">
                    {result.status === 'Resolved' ? 'Action Logged' : 'Pending'}
                  </span>
                </div>

              </div>
            </div>

            {/* Key Information Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs bg-white p-4 rounded-2xl border border-slate-200">
              <div className="space-y-1">
                <span className="text-slate-400 text-[11px] block">{t('track_location')}:</span>
                <p className="font-semibold text-slate-800 flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                  <span>{result.village} {result.landmark ? `• ${result.landmark}` : ''}</span>
                </p>
              </div>

              <div className="space-y-1">
                <span className="text-slate-400 text-[11px] block">{t('track_water_source')}:</span>
                <p className="font-semibold text-slate-800 flex items-center gap-1">
                  <Droplets className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                  <span>{result.water_source || 'Groundwater / Borewell'}</span>
                </p>
              </div>

              <div className="sm:col-span-2 pt-2 border-t border-slate-100 space-y-1">
                <span className="text-slate-400 text-[11px] block">Public Observation Text:</span>
                <p className="text-slate-700 leading-relaxed font-normal bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                  {result.description}
                </p>
              </div>
            </div>

            {/* Certified Laboratory Results Section (if present) */}
            {result.lab_status && result.lab_status !== 'Not Tested' && (
              <div className="p-4 rounded-2xl bg-white border border-teal-200 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-teal-900">
                    <FlaskConical className="w-4 h-4 text-teal-600" />
                    <span>{t('track_lab_results')}</span>
                  </div>
                  <span className="text-[10px] font-bold text-teal-700 bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
                    {result.lab_name || 'Accredited Water Lab'}
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 text-center">
                  <div className="p-2 rounded-xl bg-slate-50 border border-slate-200">
                    <span className="text-[10px] text-slate-400 block">pH Level</span>
                    <span className="font-bold text-slate-800 text-sm">{result.ph !== null ? result.ph : '—'}</span>
                    <span className="text-[9px] text-slate-400 block">(6.5 - 8.5 Safe)</span>
                  </div>
                  <div className="p-2 rounded-xl bg-slate-50 border border-slate-200">
                    <span className="text-[10px] text-slate-400 block">TDS (mg/L)</span>
                    <span className="font-bold text-slate-800 text-sm">{result.tds !== null ? result.tds : '—'}</span>
                    <span className="text-[9px] text-slate-400 block">(&lt; 500 Desirable)</span>
                  </div>
                  <div className="p-2 rounded-xl bg-slate-50 border border-slate-200">
                    <span className="text-[10px] text-slate-400 block">Fluoride (mg/L)</span>
                    <span className="font-bold text-slate-800 text-sm">{result.fluoride !== null ? result.fluoride : '—'}</span>
                    <span className="text-[9px] text-slate-400 block">(&lt; 1.0 mg/L)</span>
                  </div>
                  <div className="p-2 rounded-xl bg-slate-50 border border-slate-200">
                    <span className="text-[10px] text-slate-400 block">E. Coli Bacteria</span>
                    <span className="font-bold text-slate-800 text-sm">{result.e_coli || '—'}</span>
                    <span className="text-[9px] text-slate-400 block">(Must be Absent)</span>
                  </div>
                </div>

                {result.lab_notes && (
                  <p className="text-[11px] text-slate-600 bg-teal-50/50 p-2 rounded-lg border border-teal-100">
                    <strong>Laboratory Analyst Note:</strong> {result.lab_notes}
                  </p>
                )}
              </div>
            )}

            {/* Actions: WhatsApp Share & Full Modal Inspection */}
            <div className="flex flex-wrap items-center justify-between gap-2.5 pt-2">
              <a
                href={getWhatsAppShareUrl(result)}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm transition-colors"
              >
                <Share2 className="w-3.5 h-3.5" />
                <span>{t('track_share_btn')}</span>
              </a>

              {onOpenReportModal && (
                <button
                  type="button"
                  onClick={() => onOpenReportModal(result)}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white hover:bg-slate-100 text-slate-700 font-semibold text-xs border border-slate-300 shadow-2xs transition-colors"
                >
                  <ExternalLink className="w-3.5 h-3.5 text-teal-600" />
                  <span>{t('btn_details')}</span>
                </button>
              )}
            </div>

          </div>
        )}

      </div>
    </div>
  );
}

