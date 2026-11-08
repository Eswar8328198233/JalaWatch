import React, { useState } from 'react';
import { 
  X, Calendar, MapPin, Droplet, ShieldAlert, CheckCircle, Clock, 
  ExternalLink, Copy, Check, Share2, Printer, FlaskConical, Maximize2, ShieldCheck
} from 'lucide-react';
import { getPhotoUrl } from '../services/api';
import ImageLightboxModal from './ImageLightboxModal';
import { useLanguage } from '../context/LanguageContext';

export default function ReportDetailModal({ report, onClose, onNavigateSafety }) {
  const { t } = useLanguage();
  const [copied, setCopied] = useState(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);

  if (!report) return null;

  const handleCopyId = () => {
    navigator.clipboard.writeText(report.id);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShareWhatsApp = () => {
    const text = `💧 *JalaWatch Groundwater Report*\n🆔 *Report ID:* ${report.id}\n📍 *Village:* ${report.village}${report.landmark ? ` (${report.landmark})` : ''}\n⚠️ *Concern:* ${report.category}\n📊 *Status:* ${report.status}\n📅 *Observed:* ${report.date_observed}\n\n🔗 *Track this report:* ${window.location.origin}`;
    const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  const handlePrint = () => {
    window.print();
  };

  const getStatusBadge = (status) => {
    if (status === 'Resolved') {
      return (
        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
          <CheckCircle className="w-3.5 h-3.5" />
          {t('status_resolved')}
        </span>
      );
    }
    if (status === 'Under Review') {
      return (
        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-200">
          <Clock className="w-3.5 h-3.5" />
          {t('status_under_review')}
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-teal-100 text-teal-800 border border-teal-200">
        <Droplet className="w-3.5 h-3.5" />
        {t('status_submitted')}
      </span>
    );
  };

  const hasLabData = report.lab_status === 'Tested' || report.ph != null || report.tds != null;

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in print:static print:p-0 print:bg-transparent">
        <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full max-h-[92vh] flex flex-col overflow-hidden border border-slate-200 print:border-none print:shadow-none print:max-h-full">
          
          {/* Modal Header */}
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/80">
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="font-mono font-black text-lg text-teal-900">{report.id}</span>
              <button
                onClick={handleCopyId}
                className="p-1.5 text-slate-400 hover:text-teal-700 bg-white hover:bg-teal-50 border border-slate-200 rounded-lg transition-colors"
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

            <div className="flex items-center gap-1.5 print:hidden">
              <button
                onClick={handleShareWhatsApp}
                className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-xl transition-colors border border-emerald-200/60"
                title="Share via WhatsApp"
              >
                <Share2 className="w-4 h-4" />
              </button>
              <button
                onClick={handlePrint}
                className="p-2 text-slate-600 hover:bg-slate-100 rounded-xl transition-colors border border-slate-200"
                title="Print Report"
              >
                <Printer className="w-4 h-4" />
              </button>
              <button
                onClick={onClose}
                className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors ml-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Modal Body */}
          <div className="p-6 space-y-5 overflow-y-auto print:overflow-visible">
            
            {/* Unverified Disclaimer Box */}
            <div className="p-4 rounded-2xl bg-amber-50/80 border border-amber-200 text-amber-900 text-xs flex items-start gap-3">
              <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-amber-950">{t('unverified_badge')}</p>
                <p className="mt-0.5 leading-relaxed text-amber-800">
                  This record reflects an observational report from a community member. Visual, smell, or taste concerns do not substitute for formal laboratory chemical or microbiological testing.
                </p>
              </div>
            </div>

            {/* Key Meta Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs sm:text-sm bg-slate-50 p-4 rounded-2xl border border-slate-100">
              <div>
                <span className="text-[11px] text-slate-400 block font-medium uppercase tracking-wider">{t('form_category')}</span>
                <span className="font-bold text-slate-800">{report.category}</span>
              </div>
              <div>
                <span className="text-[11px] text-slate-400 block font-medium uppercase tracking-wider">{t('track_water_source')}</span>
                <span className="font-bold text-slate-800">{report.water_source || 'Groundwater Borewell'}</span>
              </div>
              <div>
                <span className="text-[11px] text-slate-400 block font-medium uppercase tracking-wider">{t('track_location')}</span>
                <span className="font-bold text-slate-800 flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-teal-600" />
                  {report.village}
                </span>
              </div>
              <div>
                <span className="text-[11px] text-slate-400 block font-medium uppercase tracking-wider">{t('track_date')}</span>
                <span className="font-bold text-slate-800 flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-slate-500" />
                  {report.date_observed}
                </span>
              </div>
              {report.landmark && (
                <div className="sm:col-span-2 pt-1 border-t border-slate-200/60">
                  <span className="text-[11px] text-slate-400 block font-medium uppercase tracking-wider">{t('form_landmark')}</span>
                  <span className="text-slate-800 font-semibold">{report.landmark}</span>
                </div>
              )}
            </div>

            {/* Observation Description */}
            <div>
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                {t('form_desc')}
              </h4>
              <div className="p-4 rounded-2xl bg-white border border-slate-200 text-slate-700 text-xs sm:text-sm leading-relaxed whitespace-pre-wrap">
                {report.description}
              </div>
            </div>

            {/* Photo Evidence with Lightbox */}
            {report.photo_url && (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                    {t('photo_evidence')}
                  </h4>
                  <button
                    onClick={() => setLightboxOpen(true)}
                    className="text-xs text-teal-700 hover:text-teal-900 font-bold flex items-center gap-1"
                  >
                    <Maximize2 className="w-3.5 h-3.5" />
                    <span>{t('click_to_expand')}</span>
                  </button>
                </div>
                <div 
                  onClick={() => setLightboxOpen(true)}
                  className="rounded-2xl overflow-hidden border border-slate-200 bg-slate-100 max-h-72 cursor-pointer relative group"
                >
                  <img
                    src={getPhotoUrl(report.photo_url)}
                    alt="Pollution report evidence"
                    className="w-full h-auto object-cover max-h-72 group-hover:scale-105 transition-transform duration-300"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-bold gap-1.5 backdrop-blur-xs">
                    <Maximize2 className="w-4 h-4" />
                    <span>{t('click_to_expand')}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Certified Laboratory Analysis Section */}
            <div className={`p-4 rounded-2xl border ${hasLabData ? 'bg-emerald-50/70 border-emerald-200' : 'bg-slate-50/80 border-slate-200'}`}>
              <div className="flex items-center gap-2 mb-2">
                <FlaskConical className={`w-4 h-4 ${hasLabData ? 'text-emerald-700' : 'text-slate-400'}`} />
                <h4 className="font-bold text-xs uppercase tracking-wider text-slate-800">
                  {t('lab_section_title')}
                </h4>
                {hasLabData ? (
                  <span className="ml-auto text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
                    {t('lab_tested')}
                  </span>
                ) : (
                  <span className="ml-auto text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                    Awaiting Formal Test
                  </span>
                )}
              </div>

              {hasLabData ? (
                <div className="space-y-3 pt-1 text-xs">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    <div className="p-2.5 rounded-xl bg-white border border-emerald-200">
                      <span className="text-[10px] text-slate-400 block font-bold">pH Level</span>
                      <span className="font-black text-sm text-slate-900">{report.ph ?? 'N/A'}</span>
                      <span className="text-[10px] text-slate-400 block">Norm: 6.5 - 8.5</span>
                    </div>
                    <div className="p-2.5 rounded-xl bg-white border border-emerald-200">
                      <span className="text-[10px] text-slate-400 block font-bold">TDS (mg/L)</span>
                      <span className="font-black text-sm text-slate-900">{report.tds ?? 'N/A'}</span>
                      <span className="text-[10px] text-slate-400 block">Norm: &lt; 500</span>
                    </div>
                    <div className="p-2.5 rounded-xl bg-white border border-emerald-200">
                      <span className="text-[10px] text-slate-400 block font-bold">Fluoride</span>
                      <span className="font-black text-sm text-slate-900">{report.fluoride ? `${report.fluoride} mg/L` : 'N/A'}</span>
                      <span className="text-[10px] text-slate-400 block">Norm: &lt; 1.0</span>
                    </div>
                    <div className="p-2.5 rounded-xl bg-white border border-emerald-200">
                      <span className="text-[10px] text-slate-400 block font-bold">E. Coli</span>
                      <span className="font-black text-sm text-slate-900">{report.e_coli ?? 'Negative'}</span>
                      <span className="text-[10px] text-slate-400 block">Norm: Absent</span>
                    </div>
                  </div>

                  <div className="text-[11px] text-slate-600 space-y-1">
                    {report.lab_name && <div><strong>Lab Agency:</strong> {report.lab_name} ({report.testing_date || 'Recent'})</div>}
                    {report.lab_notes && <div><strong>Officer Remarks:</strong> {report.lab_notes}</div>}
                  </div>
                </div>
              ) : (
                <p className="text-xs text-slate-500 leading-relaxed">
                  {t('lab_not_tested')}. Visual or odor observations alone cannot determine chemical potable status.
                </p>
              )}
            </div>

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
                  className="flex items-center gap-1 text-teal-700 hover:text-teal-900 font-bold"
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
          <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between print:hidden">
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
              className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-900 text-white text-xs font-semibold transition-colors"
            >
              {t('btn_close')}
            </button>
          </div>

        </div>
      </div>

      {/* Lightbox Modal */}
      {lightboxOpen && report.photo_url && (
        <ImageLightboxModal
          photoUrl={getPhotoUrl(report.photo_url)}
          caption={`${report.id} - ${report.category} at ${report.village}`}
          onClose={() => setLightboxOpen(false)}
        />
      )}
    </>
  );
}
