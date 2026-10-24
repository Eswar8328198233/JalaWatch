import React from 'react';
import { MapPin, Calendar, CheckCircle, Clock, Droplets, Image as ImageIcon, ChevronRight } from 'lucide-react';
import { getPhotoUrl } from '../services/api';

export default function ReportCard({ report, onSelect }) {
  const getCategoryBadge = (cat) => {
    switch (cat) {
      case 'Unusual water colour':
        return 'text-orange-700 bg-orange-50 border-orange-200';
      case 'Bad smell or taste':
        return 'text-amber-700 bg-amber-50 border-amber-200';
      case 'Suspected waste dumping':
        return 'text-rose-700 bg-rose-50 border-rose-200';
      case 'Drainage problems':
        return 'text-teal-700 bg-teal-50 border-teal-200';
      default:
        return 'text-slate-700 bg-slate-50 border-slate-200';
    }
  };

  const getStatusBadge = (status) => {
    if (status === 'Resolved') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
          <CheckCircle className="w-3 h-3" />
          Resolved
        </span>
      );
    }
    if (status === 'Under Review') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
          <Clock className="w-3 h-3" />
          Under Review
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-teal-100 text-teal-800 border border-teal-200">
        <Droplets className="w-3 h-3" />
        Submitted
      </span>
    );
  };

  return (
    <div className="bg-white rounded-3xl border border-slate-200/90 shadow-soft hover:shadow-float transition-all duration-200 flex flex-col justify-between overflow-hidden group">
      
      {/* Top Details */}
      <div className="p-5 space-y-3">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5">
            <span className="font-mono text-xs font-bold text-teal-800 bg-teal-50 px-2 py-0.5 rounded-lg border border-teal-200">
              {report.id}
            </span>
            <span className="text-[10px] font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200/80">
              Unverified
            </span>
          </div>
          {getStatusBadge(report.status)}
        </div>

        {/* Category & Title */}
        <div>
          <span className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-md border mb-1.5 ${getCategoryBadge(report.category)}`}>
            {report.category}
          </span>
          <h3 className="font-bold text-slate-900 text-base group-hover:text-teal-700 transition-colors line-clamp-1">
            {report.landmark ? `${report.landmark}` : `${report.category} in ${report.village}`}
          </h3>
        </div>

        {/* Village & Date */}
        <div className="flex flex-wrap items-center gap-y-1 gap-x-4 text-xs text-slate-500">
          <span className="flex items-center gap-1 font-semibold text-slate-700">
            <MapPin className="w-3.5 h-3.5 text-teal-600" />
            {report.village}
          </span>
          <span className="flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            {report.date_observed}
          </span>
        </div>

        {/* Description snippet */}
        <p className="text-xs text-slate-600 line-clamp-3 leading-relaxed">
          {report.description}
        </p>

        {/* Thumbnail Evidence */}
        {report.photo_url && (
          <div className="relative h-28 rounded-2xl overflow-hidden border border-slate-200 bg-slate-100 mt-2">
            <img
              src={getPhotoUrl(report.photo_url)}
              alt="Proof"
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              loading="lazy"
            />
            <div className="absolute bottom-1.5 right-1.5 bg-black/60 text-white text-[10px] px-2 py-0.5 rounded-full backdrop-blur-sm flex items-center gap-1">
              <ImageIcon className="w-3 h-3" /> Photo Attached
            </div>
          </div>
        )}
      </div>

      {/* Footer CTA */}
      <div className="px-5 py-3 bg-slate-50/70 border-t border-slate-100 flex items-center justify-between text-xs">
        <span className="text-[11px] text-slate-400 font-medium">
          Source: {report.water_source || 'Groundwater'}
        </span>
        <button
          onClick={() => onSelect(report)}
          className="flex items-center gap-1 font-bold text-teal-700 hover:text-teal-900 transition-colors py-1 px-2.5 rounded-lg hover:bg-teal-50"
        >
          <span>View Details</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>

    </div>
  );
}
