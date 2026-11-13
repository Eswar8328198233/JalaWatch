import React, { useState } from 'react';
import { 
  AlertTriangle, MapPin, Calendar, Droplet, Upload, CheckCircle2, 
  Copy, Check, ArrowRight, ShieldAlert, Sparkles, Image as ImageIcon, X,
  Clock, Eye, Wind, Activity, Compass, Layers, ShieldCheck
} from 'lucide-react';
import LocationPickerMap from '../components/LocationPickerMap';
import { submitReport } from '../services/api';
import { useToast } from '../context/ToastContext';
import { useLanguage } from '../context/LanguageContext';

export default function ReportIssue({ setActivePage, onReportCreated }) {
  const { addToast } = useToast();
  const { t } = useLanguage();

  const [formData, setFormData] = useState({
    village: 'Nutakki',
    customVillage: '',
    district: 'Guntur District',
    state: 'Andhra Pradesh',
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
    // Field observations
    water_appearance: 'Turbid / Cloudy',
    water_smell: 'None',
    water_usage: 'Drinking',
    issue_duration: 'Few days',
    nearby_wastewater: 'Open drain / Stagnant trench',
    suspected_distance: '5-15 meters',
    additional_notes: '',
    priority: 'Medium'
  });

  const [userEdited, setUserEdited] = useState({ village: false, landmark: false });
  const [pendingDetectedLocation, setPendingDetectedLocation] = useState(null);
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

  const appearances = [
    'Clear',
    'Turbid / Cloudy',
    'Brownish / Rust',
    'Blackish',
    'Greenish / Algae',
    'Yellowish',
    'Oily Sheen',
    'Other'
  ];

  const smells = [
    'None',
    'Rotten Egg / Sulfur',
    'Chemical / Chlorine',
    'Earthy / Musty',
    'Sewage / Drainage',
    'Metallic',
    'Other'
  ];

  const usages = [
    'Drinking',
    'Cooking',
    'Domestic / Washing',
    'Livestock / Agriculture',
    'Not Currently Used'
  ];

  const durations = [
    'Just noticed today',
    'Few days',
    '1-4 weeks',
    'Several months',
    'Chronic / Ongoing for years'
  ];

  const wastewaterSources = [
    'Open drain / Stagnant trench',
    'Soak pit',
    'Septic tank overflow',
    'Agricultural fertilizer runoff',
    'Industrial canal / discharge',
    'None nearby'
  ];

  const distances = [
    '< 5 meters',
    '5-15 meters',
    '15-50 meters',
    '> 50 meters',
    'Unknown / Not visible'
  ];

  const priorities = [
    { value: 'Low', label: 'Low', desc: 'Minor aesthetic variance' },
    { value: 'Medium', label: 'Medium', desc: 'Moderate concern / domestic disruption' },
    { value: 'High', label: 'High', desc: 'Severe discoloration or strong smell' },
    { value: 'Urgent', label: 'Urgent', desc: 'Immediate health hazard / sewage ingress' }
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

  const handleLocationChange = (lat, lng, addressInfo, accuracy) => {
    setFormData((prev) => {
      const updated = { ...prev, latitude: lat, longitude: lng };

      if (addressInfo) {
        if (addressInfo.district) updated.district = addressInfo.district;
        if (addressInfo.state) updated.state = addressInfo.state;

        // Auto-populate village only if user hasn't explicitly customized it
        if (!userEdited.village) {
          if (addressInfo.village) {
            if (villageOptions.includes(addressInfo.village)) {
              updated.village = addressInfo.village;
              updated.customVillage = '';
            } else {
              updated.village = 'Other';
              updated.customVillage = addressInfo.village;
            }
          }
        } else if (addressInfo.village && addressInfo.village !== (prev.village === 'Other' ? prev.customVillage : prev.village)) {
          // If user previously customized the field, prompt instead of silently overwriting
          setPendingDetectedLocation(addressInfo);
        }

        // Auto-populate landmark if user hasn't customized it
        if (!userEdited.landmark && !prev.landmark) {
          const autoLandmark = addressInfo.landmark || addressInfo.street || (addressInfo.display_name ? addressInfo.display_name.split(',')[0] : '');
          if (autoLandmark) updated.landmark = autoLandmark;
        }
      }

      return updated;
    });
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
      payload.append('district', formData.district);
      payload.append('state', formData.state);
      payload.append('category', formData.category);
      payload.append('water_source', formData.water_source);
      payload.append('date_observed', formData.date_observed);
      payload.append('landmark', formData.landmark.trim());
      payload.append('description', formData.description.trim());
      if (formData.latitude) payload.append('latitude', formData.latitude);
      if (formData.longitude) payload.append('longitude', formData.longitude);
      payload.append('reporter_name', formData.reporter_name.trim() || 'Anonymous Community Member');
      payload.append('reporter_contact', formData.reporter_contact.trim());

      // Extended survey parameters
      payload.append('water_appearance', formData.water_appearance);
      payload.append('water_smell', formData.water_smell);
      payload.append('water_usage', formData.water_usage);
      payload.append('issue_duration', formData.issue_duration);
      payload.append('nearby_wastewater', formData.nearby_wastewater);
      payload.append('suspected_distance', formData.suspected_distance);
      payload.append('additional_notes', formData.additional_notes.trim());
      payload.append('priority', formData.priority);

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
    setUserEdited({ village: false, landmark: false });
    setPendingDetectedLocation(null);
    setFormData({
      village: 'Nutakki',
      customVillage: '',
      district: 'Guntur District',
      state: 'Andhra Pradesh',
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
      water_appearance: 'Turbid / Cloudy',
      water_smell: 'None',
      water_usage: 'Drinking',
      issue_duration: 'Few days',
      nearby_wastewater: 'Open drain / Stagnant trench',
      suspected_distance: '5-15 meters',
      additional_notes: '',
      priority: 'Medium'
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

          {/* Duplicate Cluster Warning if near recent reports */}
          {submissionResult.duplicate_warning && (
            <div className="p-4 rounded-xl bg-sky-50 border border-sky-200 text-sky-900 text-xs text-left max-w-xl mx-auto flex items-start gap-3">
              <Sparkles className="w-5 h-5 text-sky-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-sky-950">Geographic Hotspot Cluster Linked</p>
                <p className="mt-0.5 leading-relaxed text-sky-800">
                  {submissionResult.nearby_count} similar report(s) were recorded within ~150 meters of this site in the last 14 days. These records have been linked for local authority inspection prioritization.
                </p>
              </div>
            </div>
          )}

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
          {t('form_title')}
        </h1>
        <p className="text-sm text-slate-600 max-w-xl mx-auto">
          {t('form_subtitle')}
        </p>
      </div>

      {/* Main Form Card */}
      <form onSubmit={handleSubmit} className="bg-white rounded-3xl p-6 sm:p-10 border border-slate-200 shadow-md space-y-8">
        
        {/* Section 1: Locality & Landmark */}
        <div className="space-y-4">
          <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2 border-b border-slate-100 pb-2">
            <MapPin className="w-4 h-4 text-brand-600" />
            <span>1. Location Details & GPS</span>
          </h3>

          {/* User Confirmation Banner if user manually edited fields and new location was detected */}
          {pendingDetectedLocation && (
            <div className="bg-amber-50 border border-amber-300 rounded-xl p-3 text-xs text-amber-900 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 animate-fadeIn">
              <div className="flex items-start gap-2">
                <Sparkles className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <strong>Location Intelligence Detected:</strong>{' '}
                  <span className="font-semibold underline">
                    {pendingDetectedLocation.village || 'Detected Locality'}
                  </span>{' '}
                  ({pendingDetectedLocation.district || 'District'}). Update your locality fields?
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    const detVillage = pendingDetectedLocation.village || '';
                    if (villageOptions.includes(detVillage)) {
                      setFormData(prev => ({ ...prev, village: detVillage, customVillage: '' }));
                    } else {
                      setFormData(prev => ({ ...prev, village: 'Other', customVillage: detVillage }));
                    }
                    if (pendingDetectedLocation.landmark || pendingDetectedLocation.street) {
                      setFormData(prev => ({ ...prev, landmark: pendingDetectedLocation.landmark || pendingDetectedLocation.street }));
                    }
                    setPendingDetectedLocation(null);
                    addToast('Locality updated to detected location', 'info');
                  }}
                  className="px-2.5 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-semibold text-[11px] shadow-xs"
                >
                  Update to Detected
                </button>
                <button
                  type="button"
                  onClick={() => setPendingDetectedLocation(null)}
                  className="px-2 py-1 bg-white border border-amber-300 text-amber-800 rounded-lg hover:bg-amber-100 font-medium text-[11px]"
                >
                  Keep My Custom Input
                </button>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Village or Locality <span className="text-rose-500">*</span>
              </label>
              <select
                value={formData.village}
                onChange={(e) => {
                  setUserEdited(prev => ({ ...prev, village: true }));
                  setFormData({ ...formData, village: e.target.value });
                }}
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
                  onChange={(e) => {
                    setUserEdited(prev => ({ ...prev, village: true }));
                    setFormData({ ...formData, customVillage: e.target.value });
                  }}
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
                onChange={(e) => {
                  setUserEdited(prev => ({ ...prev, landmark: true }));
                  setFormData({ ...formData, landmark: e.target.value });
                }}
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

        {/* Section 3: Extended Field Observations (New) */}
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <Layers className="w-4 h-4 text-brand-600" />
              <span>3. Field Observations & Environmental Context</span>
            </h3>
            <span className="text-[11px] text-teal-700 bg-teal-50 px-2 py-0.5 rounded-md font-semibold">
              Community Field Survey
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Water Appearance */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
                <Eye className="w-3.5 h-3.5 text-slate-500" />
                Water Visual Appearance
              </label>
              <select
                value={formData.water_appearance}
                onChange={(e) => setFormData({ ...formData, water_appearance: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-1 focus:ring-brand-500 focus:outline-none"
              >
                {appearances.map((a) => (
                  <option key={a} value={a}>{a}</option>
                ))}
              </select>
            </div>

            {/* Water Smell */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
                <Wind className="w-3.5 h-3.5 text-slate-500" />
                Water Odor / Smell
              </label>
              <select
                value={formData.water_smell}
                onChange={(e) => setFormData({ ...formData, water_smell: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-1 focus:ring-brand-500 focus:outline-none"
              >
                {smells.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>

            {/* Primary Water Usage */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
                <Activity className="w-3.5 h-3.5 text-slate-500" />
                Primary Water Usage
              </label>
              <select
                value={formData.water_usage}
                onChange={(e) => setFormData({ ...formData, water_usage: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-1 focus:ring-brand-500 focus:outline-none"
              >
                {usages.map((u) => (
                  <option key={u} value={u}>{u}</option>
                ))}
              </select>
            </div>

            {/* Issue Duration */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-slate-500" />
                Duration of Problem
              </label>
              <select
                value={formData.issue_duration}
                onChange={(e) => setFormData({ ...formData, issue_duration: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-1 focus:ring-brand-500 focus:outline-none"
              >
                {durations.map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>

            {/* Nearby Wastewater Source */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
                <AlertTriangle className="w-3.5 h-3.5 text-slate-500" />
                Nearby Wastewater Source
              </label>
              <select
                value={formData.nearby_wastewater}
                onChange={(e) => setFormData({ ...formData, nearby_wastewater: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-1 focus:ring-brand-500 focus:outline-none"
              >
                {wastewaterSources.map((w) => (
                  <option key={w} value={w}>{w}</option>
                ))}
              </select>
            </div>

            {/* Suspected Distance */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
                <Compass className="w-3.5 h-3.5 text-slate-500" />
                Distance to Wastewater Trench
              </label>
              <select
                value={formData.suspected_distance}
                onChange={(e) => setFormData({ ...formData, suspected_distance: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-1 focus:ring-brand-500 focus:outline-none"
              >
                {distances.map((dist) => (
                  <option key={dist} value={dist}>{dist}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Priority Selection */}
          <div className="pt-2">
            <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-teal-600" />
              Initial Severity Priority Assessment
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {priorities.map((p) => {
                const isSelected = formData.priority === p.value;
                return (
                  <button
                    key={p.value}
                    type="button"
                    onClick={() => setFormData({ ...formData, priority: p.value })}
                    className={`p-2.5 rounded-xl border text-left transition-all ${
                      isSelected
                        ? p.value === 'Urgent'
                          ? 'border-rose-500 bg-rose-50 text-rose-900 ring-2 ring-rose-400'
                          : p.value === 'High'
                          ? 'border-amber-500 bg-amber-50 text-amber-900 ring-2 ring-amber-400'
                          : 'border-teal-500 bg-teal-50 text-teal-900 ring-2 ring-teal-400'
                        : 'border-slate-200 bg-slate-50/50 hover:bg-slate-100 text-slate-700'
                    }`}
                  >
                    <div className="font-bold text-xs flex items-center justify-between">
                      <span>{p.label}</span>
                      {isSelected && <Check className="w-3.5 h-3.5" />}
                    </div>
                    <span className="text-[10px] text-slate-500 block mt-0.5 leading-tight">{p.desc}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Section 4: Date & Detailed Description */}
        <div className="space-y-4">
          <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2 border-b border-slate-100 pb-2">
            <Calendar className="w-4 h-4 text-brand-600" />
            <span>4. Observations & Description</span>
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
                Detailed Observation Description <span className="text-rose-500">*</span>
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

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Additional Field Notes (Optional)
            </label>
            <textarea
              rows={2}
              placeholder="Any other observations, nearby agricultural fields, borewell depth (if known), or community notes..."
              value={formData.additional_notes}
              onChange={(e) => setFormData({ ...formData, additional_notes: e.target.value })}
              className="w-full p-3 rounded-xl border border-slate-300 text-xs focus:ring-1 focus:ring-brand-500 focus:outline-none"
            />
          </div>
        </div>

        {/* Section 5: Photo Upload (Optional) */}
        <div className="space-y-4">
          <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2 border-b border-slate-100 pb-2">
            <Upload className="w-4 h-4 text-brand-600" />
            <span>5. Evidence Photograph (Optional)</span>
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

        {/* Section 6: Reporter Details (Optional) */}
        <div className="space-y-4">
          <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2 border-b border-slate-100 pb-2">
            <CheckCircle2 className="w-4 h-4 text-brand-600" />
            <span>6. Reporter Information (Optional)</span>
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

        {/* Section 7: Ethics Confirmation */}
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
                <span>{t('form_submitting')}</span>
              </>
            ) : (
              <>
                <AlertTriangle className="w-4 h-4" />
                <span>{t('form_submit_btn')}</span>
              </>
            )}
          </button>
        </div>

      </form>
    </div>
  );
}
