import React, { useState } from 'react';
import { 
  AlertTriangle, MapPin, Calendar, Droplet, Upload, CheckCircle2, 
  Copy, Check, ArrowRight, ShieldAlert, Sparkles, Image as ImageIcon, X
} from 'lucide-react';
import LocationPickerMap from '../components/LocationPickerMap';
import { submitReport } from '../services/api';
import { useToast } from '../context/ToastContext';

export default function ReportIssue({ setActivePage, onReportCreated }) {
  const { addToast } = useToast();

  const [formData, setFormData] = useState({
    village: 'Nutakki',
    customVillage: '',
    category: 'Unusual water colour',
    water_source: 'Borewell / Hand pump',
    date_observed: new Date().toISOString().split('T')[0],
    landmark: '',
    description: '',
    latitude: 16.4382,
    longitude: 80.6010,
    reporter_name: '',
    reporter_contact: '',
    ethics_agreed: false,
  });

  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState({});
  const [submissionResult, setSubmissionResult] = useState(null);
  const [copiedId, setCopiedId] = useState(false);

  const categories = [
    'Unusual water colour',
    'Bad smell or taste',
    'Suspected waste dumping',
    'Drainage problems',
    'Leaking pipes',
    'Agricultural runoff',
    'Other'
  ];

  const waterSources = [
    'Borewell / Hand pump',
    'Open well',
    'Piped municipal tap water',
    'Irrigation canal / Ditch',
    'Stagnant pond / Seepage puddle',
    'Other'
  ];

  const villageOptions = [
    'Nutakki',
    'Tadepalli Rural',
    'Mangalagiri Rural',
    'Kunchanapalli',
    'Kolanukonda',
    'Vijayawada Rural',
    'Other'
  ];

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!['image/jpeg', 'image/jpg', 'image/png', 'image/webp'].includes(file.type)) {
      setErrors((prev) => ({ ...prev, photo: 'Only JPG, JPEG, PNG, or WEBP images are allowed.' }));
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setErrors((prev) => ({ ...prev, photo: 'File size exceeds 5MB limit.' }));
      return;
    }

    setErrors((prev) => {
      const copy = { ...prev };
      delete copy.photo;
      return copy;
    });

    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
  };

  const handleRemovePhoto = () => {
    setPhotoFile(null);
    if (photoPreview) URL.revokeObjectURL(photoPreview);
    setPhotoPreview(null);
  };

  const handleLocationChange = (lat, lng) => {
    setFormData((prev) => ({ ...prev, latitude: lat, longitude: lng }));
  };

  const validate = () => {
    const errs = {};
    const effectiveVillage = formData.village === 'Other' ? formData.customVillage.trim() : formData.village;

    if (!effectiveVillage || effectiveVillage.length < 2) {
      errs.village = 'Please specify a valid village or locality name.';
    }

    if (!formData.category) {
      errs.category = 'Please choose an issue category.';
    }

    if (!formData.date_observed) {
      errs.date_observed = 'Date of observation is required.';
    } else {
      const today = new Date().toISOString().split('T')[0];
      if (formData.date_observed > today) {
        errs.date_observed = 'Observation date cannot be in the future.';
      }
    }

    if (!formData.description || formData.description.trim().length < 15) {
      errs.description = 'Please provide a detailed description (minimum 15 characters).';
    }

    if (!formData.ethics_agreed) {
      errs.ethics_agreed = 'Please confirm that this is an honest observational report.';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) {
      addToast('Please correct the highlighted errors in the form.', 'error');
      return;
    }

    setSubmitting(true);
    try {
      const payload = new FormData();
      const effectiveVillage = formData.village === 'Other' ? formData.customVillage.trim() : formData.village;
      payload.append('village', effectiveVillage);
      payload.append('category', formData.category);
      payload.append('water_source', formData.water_source);
      payload.append('date_observed', formData.date_observed);
      payload.append('landmark', formData.landmark.trim());
      payload.append('description', formData.description.trim());
      if (formData.latitude) payload.append('latitude', formData.latitude);
      if (formData.longitude) payload.append('longitude', formData.longitude);
      payload.append('reporter_name', formData.reporter_name.trim() || 'Anonymous Community Member');
      payload.append('reporter_contact', formData.reporter_contact.trim());

      if (photoFile) {
        payload.append('photo', photoFile);
      }

      const res = await submitReport(payload);
      setSubmissionResult(res);
      addToast(`Report ${res.report_id} successfully submitted!`, 'success');
      if (onReportCreated) onReportCreated(res);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      console.error('Submission error:', err);
      addToast(err.message || 'Failed to submit report. Please try again.', 'error');
      if (err.details) {
        setErrors(err.details);
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleCopyId = () => {
    if (submissionResult?.report_id) {
      navigator.clipboard.writeText(submissionResult.report_id);
      setCopiedId(true);
      setTimeout(() => setCopiedId(false), 2000);
    }
  };

  const handleResetForm = () => {
    setSubmissionResult(null);
    setFormData({
      village: 'Nutakki',
      customVillage: '',
      category: 'Unusual water colour',
      water_source: 'Borewell / Hand pump',
      date_observed: new Date().toISOString().split('T')[0],
      landmark: '',
      description: '',
      latitude: 16.4382,
      longitude: 80.6010,
      reporter_name: '',
      reporter_contact: '',
      ethics_agreed: false,
    });
    handleRemovePhoto();
  };

  // If submitted successfully, show detailed confirmation view
  if (submissionResult) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-12">
        <div className="bg-white rounded-3xl p-8 sm:p-10 border border-slate-200 shadow-xl text-center space-y-6 animate-in zoom-in-95">
          <div className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto border border-emerald-100 shadow-inner">
            <CheckCircle2 className="w-10 h-10" />
          </div>

          <div className="space-y-2">
            <span className="text-xs font-bold text-emerald-700 uppercase tracking-wider px-3 py-1 bg-emerald-50 rounded-full border border-emerald-200">
              Submission Received
            </span>
            <h2 className="text-3xl font-extrabold text-slate-900 font-['Outfit']">
              Thank You for Making Concerns Visible
            </h2>
            <p className="text-sm text-slate-600 max-w-lg mx-auto">
              Your observation has been assigned a unique tracking identifier and recorded into the civic database.
            </p>
          </div>

          {/* Generated ID Box */}
          <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 max-w-md mx-auto space-y-3">
            <span className="text-xs text-slate-500 font-medium block">Unique Report ID</span>
            <div className="flex items-center justify-center gap-3">
              <span className="font-mono text-3xl font-black text-brand-700 tracking-wider">
                {submissionResult.report_id}
              </span>
              <button
                type="button"
                onClick={handleCopyId}
                className="p-2 text-slate-500 hover:text-slate-800 rounded-lg hover:bg-slate-200 transition-colors"
                title="Copy ID to clipboard"
              >
                {copiedId ? <Check className="w-5 h-5 text-emerald-600" /> : <Copy className="w-5 h-5" />}
              </button>
            </div>
            <p className="text-[11px] text-slate-400">
              Save this reference ID to track status updates or provide to local Panchayat officials.
            </p>
          </div>

          {/* Unverified Disclaimer Reminder */}
          <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs text-left max-w-xl mx-auto flex items-start gap-3">
            <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-amber-950">Observational Prototype Status</p>
              <p className="mt-0.5 leading-relaxed text-amber-800">
                This report is published to the community portal with an <strong>Unverified</strong> label. Appearance or smell alone cannot legally prove drinking water safety. Please review our Water Safety Guide to request certified laboratory testing.
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              onClick={() => { setActivePage('reports'); window.scrollTo(0, 0); }}
              className="w-full sm:w-auto px-6 py-3 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-semibold text-xs transition-colors shadow-md flex items-center justify-center gap-2"
            >
              <span>Explore Community Reports</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              onClick={handleResetForm}
              className="w-full sm:w-auto px-6 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs transition-colors"
            >
              Submit Another Report
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-10 space-y-8">
      
      {/* Header */}
      <div className="text-center space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-50 border border-teal-200 text-teal-800 text-xs font-semibold">
          <AlertTriangle className="w-3.5 h-3.5 text-teal-600" />
          <span>Groundwater Concern Reporting Form</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 font-['Outfit']">
          Report a Groundwater Concern
        </h1>
        <p className="text-sm text-slate-600 max-w-xl mx-auto">
          Help map water anomalies, blackish borewells, and wastewater stagnation across Nutakki and surrounding villages. No mandatory personal identification is required.
        </p>
      </div>

      {/* Main Form Card */}
      <form onSubmit={handleSubmit} className="bg-white rounded-3xl p-6 sm:p-10 border border-slate-200 shadow-md space-y-8">
        
        {/* Section 1: Locality & Landmark */}
        <div className="space-y-4">
          <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2 border-b border-slate-100 pb-2">
            <MapPin className="w-4 h-4 text-brand-600" />
            <span>1. Location Details</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Village or Locality <span className="text-rose-500">*</span>
              </label>
              <select
                value={formData.village}
                onChange={(e) => setFormData({ ...formData, village: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-brand-500 focus:outline-none transition-all"
              >
                {villageOptions.map((v) => (
                  <option key={v} value={v}>{v}</option>
                ))}
              </select>
            </div>

            {formData.village === 'Other' && (
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Specify Locality Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Pedavadlapudi, Kolanukonda"
                  value={formData.customVillage}
                  onChange={(e) => setFormData({ ...formData, customVillage: e.target.value })}
                  className={`w-full px-3.5 py-2.5 rounded-xl border text-sm focus:ring-2 focus:ring-brand-500 focus:outline-none ${
                    errors.village ? 'border-rose-400 bg-rose-50/30' : 'border-slate-300'
                  }`}
                />
                {errors.village && <p className="text-xs text-rose-500 mt-1">{errors.village}</p>}
              </div>
            )}

            <div className={formData.village === 'Other' ? 'sm:col-span-2' : ''}>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Nearby Landmark / Street
              </label>
              <input
                type="text"
                placeholder="e.g. Near Ramalayam Temple, Old High School road"
                value={formData.landmark}
                onChange={(e) => setFormData({ ...formData, landmark: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-brand-500 focus:outline-none"
              />
              <span className="text-[11px] text-slate-400">Helps community members locate the exact borewell or drainage site.</span>
            </div>
          </div>

          {/* Interactive Map Picker */}
          <div className="pt-2">
            <LocationPickerMap
              latitude={formData.latitude}
              longitude={formData.longitude}
              onLocationChange={handleLocationChange}
            />
          </div>
        </div>

        {/* Section 2: Issue Type & Water Source */}
        <div className="space-y-4">
          <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2 border-b border-slate-100 pb-2">
            <Droplet className="w-4 h-4 text-brand-600" />
            <span>2. Issue Classification</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Type of Issue <span className="text-rose-500">*</span>
              </label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-brand-500 focus:outline-none"
              >
                {categories.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
              {errors.category && <p className="text-xs text-rose-500 mt-1">{errors.category}</p>}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Affected Water Source
              </label>
              <select
                value={formData.water_source}
                onChange={(e) => setFormData({ ...formData, water_source: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-brand-500 focus:outline-none"
              >
                {waterSources.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Section 3: Date & Detailed Description */}
        <div className="space-y-4">
          <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2 border-b border-slate-100 pb-2">
            <Calendar className="w-4 h-4 text-brand-600" />
            <span>3. Observations & Description</span>
          </h3>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Date Observed <span className="text-rose-500">*</span>
            </label>
            <input
              type="date"
              max={new Date().toISOString().split('T')[0]}
              value={formData.date_observed}
              onChange={(e) => setFormData({ ...formData, date_observed: e.target.value })}
              className={`w-full sm:w-1/2 px-3.5 py-2.5 rounded-xl border text-sm focus:ring-2 focus:ring-brand-500 focus:outline-none ${
                errors.date_observed ? 'border-rose-400 bg-rose-50/30' : 'border-slate-300'
              }`}
            />
            {errors.date_observed && <p className="text-xs text-rose-500 mt-1">{errors.date_observed}</p>}
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-semibold text-slate-700">
                Detailed Description <span className="text-rose-500">*</span>
              </label>
              <span className={`text-[11px] ${formData.description.length < 15 ? 'text-amber-600' : 'text-slate-400'}`}>
                {formData.description.length} / 3000 chars (min 15)
              </span>
            </div>
            <textarea
              rows={4}
              placeholder="Describe what you observed: color changes (e.g. blackish or grey tint), smell, foam, nearby drainage overflows, or duration of the issue..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className={`w-full p-3.5 rounded-xl border text-sm focus:ring-2 focus:ring-brand-500 focus:outline-none ${
                errors.description ? 'border-rose-400 bg-rose-50/30' : 'border-slate-300'
              }`}
            />
            {errors.description && <p className="text-xs text-rose-500 mt-1">{errors.description}</p>}
          </div>
        </div>

        {/* Section 4: Photo Upload (Optional) */}
        <div className="space-y-4">
          <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2 border-b border-slate-100 pb-2">
            <Upload className="w-4 h-4 text-brand-600" />
            <span>4. Evidence Photograph (Optional)</span>
          </h3>

          {!photoPreview ? (
            <label className="border-2 border-dashed border-slate-300 hover:border-brand-500 rounded-2xl p-6 flex flex-col items-center justify-center cursor-pointer transition-colors bg-slate-50/50 hover:bg-brand-50/20">
              <Upload className="w-8 h-8 text-slate-400 mb-2" />
              <span className="text-xs font-semibold text-slate-700">Click or drag image file here</span>
              <span className="text-[11px] text-slate-400 mt-1">Supported: JPG, PNG, WEBP (Max 5MB)</span>
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handlePhotoChange}
                className="hidden"
              />
            </label>
          ) : (
            <div className="relative rounded-2xl overflow-hidden border border-slate-200 bg-slate-100 max-w-sm">
              <img src={photoPreview} alt="Preview" className="w-full h-44 object-cover" />
              <button
                type="button"
                onClick={handleRemovePhoto}
                className="absolute top-2 right-2 p-1.5 rounded-full bg-slate-900/70 hover:bg-slate-900 text-white transition-colors"
                title="Remove photo"
              >
                <X className="w-4 h-4" />
              </button>
              <div className="p-2 text-[11px] text-slate-500 truncate bg-white">
                {photoFile?.name}
              </div>
            </div>
          )}
          {errors.photo && <p className="text-xs text-rose-500">{errors.photo}</p>}
        </div>

        {/* Section 5: Reporter Details (Optional) */}
        <div className="space-y-4">
          <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2 border-b border-slate-100 pb-2">
            <CheckCircle2 className="w-4 h-4 text-brand-600" />
            <span>5. Reporter Information (Optional)</span>
          </h3>

          <p className="text-xs text-slate-500">
            You may remain completely anonymous. Contact information is never displayed publicly and is accessible only to authorized administrators for follow-up testing coordination.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Your Name / Display Name
              </label>
              <input
                type="text"
                placeholder="Leave blank to remain Anonymous"
                value={formData.reporter_name}
                onChange={(e) => setFormData({ ...formData, reporter_name: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-brand-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Phone or Email (Optional)
              </label>
              <input
                type="text"
                placeholder="For test result updates"
                value={formData.reporter_contact}
                onChange={(e) => setFormData({ ...formData, reporter_contact: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-brand-500 focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Section 6: Ethics Confirmation */}
        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={formData.ethics_agreed}
              onChange={(e) => setFormData({ ...formData, ethics_agreed: e.target.checked })}
              className="w-4 h-4 mt-0.5 rounded text-brand-600 focus:ring-brand-500 border-slate-300"
            />
            <span className="text-xs text-slate-700 leading-relaxed">
              I confirm that this report is an honest community observation. I acknowledge that <strong>JalaWatch is a college CSP prototype</strong> and that this submission does not replace official police FIR or legal environmental petitions.
            </span>
          </label>
          {errors.ethics_agreed && <p className="text-xs text-rose-500 pl-7">{errors.ethics_agreed}</p>}
        </div>

        {/* Submit Button */}
        <div className="pt-2">
          <button
            type="submit"
            disabled={submitting}
            className="w-full flex items-center justify-center gap-2 py-4 px-6 rounded-2xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-sm shadow-md shadow-teal-600/20 hover:shadow-teal-600/30 transition-all disabled:opacity-60 cursor-pointer"
          >
            {submitting ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Recording Report...</span>
              </>
            ) : (
              <>
                <AlertTriangle className="w-4 h-4" />
                <span>Submit Report to Community Portal</span>
              </>
            )}
          </button>
        </div>

      </form>
    </div>
  );
}
