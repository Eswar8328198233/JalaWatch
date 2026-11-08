import React, { useState, useEffect } from 'react';
import { 
  Droplets, AlertTriangle, ShieldCheck, FileText, ArrowRight, 
  MapPin, CheckCircle2, Clock, Sparkles, Activity, ShieldAlert,
  Building2, ChevronRight, Waves, Filter, Layers, ExternalLink
} from 'lucide-react';
import { getStats, getReports } from '../services/api';
import InteractiveLiveMap from '../components/InteractiveLiveMap';
import TrackReportWidget from '../components/TrackReportWidget';
import { useLanguage } from '../context/LanguageContext';

export default function Home({ setActivePage, onSelectReport }) {
  const { t } = useLanguage();
  const [stats, setStats] = useState({
    total_reports: 0,
    submitted: 0,
    under_review: 0,
    resolved: 0,
    villages_impacted: 0,
  });
  const [reports, setReports] = useState([]);
  const [selectedMapReport, setSelectedMapReport] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [statsData, reportsData] = await Promise.all([
          getStats().catch(() => null),
          getReports({ limit: 50 }).catch(() => null),
        ]);
        if (statsData) setStats(statsData);
        if (reportsData && reportsData.reports) {
          setReports(reportsData.reports);
          // By default, select the first report so user immediately sees the floating details panel
          if (reportsData.reports.length > 0) {
            setSelectedMapReport(reportsData.reports[0]);
          }
        }
      } catch (err) {
        console.error('Error loading homepage data:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const handleCardClick = (report) => {
    setSelectedMapReport(report);
    window.scrollTo({ top: 400, behavior: 'smooth' });
  };

  return (
    <div className="space-y-10 pb-16 bg-slate-50">
      
      {/* Hero Header Ribbon (Compact & Environmental) */}
      <section className="bg-gradient-to-b from-teal-50/80 via-mint-50/40 to-slate-50 border-b border-slate-200/80 pt-6 pb-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            
            <div className="space-y-1.5 max-w-2xl">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white border border-teal-200 shadow-xs text-[11px] text-teal-800 font-bold">
                <span className="w-2 h-2 rounded-full bg-teal-500 animate-ping" />
                <span>{t('hero_pill')}</span>
              </div>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-slate-900 font-['Outfit']">
                {t('hero_title')}{' '}
                <span className="text-teal-700">{t('hero_title_highlight')}</span>
              </h1>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                {t('hero_desc')}
              </p>
            </div>

            {/* Quick Actions */}
            <div className="flex items-center gap-2.5 shrink-0 w-full sm:w-auto">
              <button
                onClick={() => { setActivePage('report'); window.scrollTo(0, 0); }}
                className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-2.5 rounded-full bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs shadow-md shadow-teal-600/20 transition-transform hover:-translate-y-0.5"
              >
                <AlertTriangle className="w-4 h-4" />
                <span>{t('hero_report_btn')}</span>
              </button>

              <button
                onClick={() => { setActivePage('reports'); window.scrollTo(0, 0); }}
                className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-full bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs border border-slate-300 shadow-xs transition-colors"
              >
                <FileText className="w-4 h-4 text-teal-600" />
                <span>{t('hero_all_reports')} ({stats.total_reports})</span>
              </button>
            </div>

          </div>

        </div>
      </section>

      {/* TRACK MY REPORT CITIZEN WIDGET */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <TrackReportWidget onOpenReportModal={(rep) => {
          setSelectedMapReport(rep);
          if (onSelectReport) onSelectReport(rep);
        }} />
      </section>

      {/* PRIMARY FOCUS: The Interactive Live Map */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="space-y-4">
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-teal-600" />
              <h2 className="text-lg font-bold text-slate-900 font-['Outfit']">
                {t('map_heading')}
              </h2>
            </div>
            <span className="text-xs text-slate-500 hidden sm:block">
              {t('map_subheading')}
            </span>
          </div>

          {/* Interactive Live Map Component with Pulsing Markers & Floating Details Panel */}
          <InteractiveLiveMap
            reports={reports}
            selectedReport={selectedMapReport}
            onSelectReport={(r) => setSelectedMapReport(r)}
            onNavigateSafety={() => { setActivePage('safety'); window.scrollTo(0, 0); }}
            onNavigateReport={() => { setActivePage('report'); window.scrollTo(0, 0); }}
          />

        </div>
      </section>

      {/* Horizontal List of Reports */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900 font-['Outfit']">
              {t('hotspots')} ({reports.length})
            </h3>
            <p className="text-xs text-slate-500">
              {t('hotspots_desc')}
            </p>
          </div>
          <button
            onClick={() => { setActivePage('reports'); window.scrollTo(0, 0); }}
            className="text-xs font-bold text-teal-700 hover:text-teal-900 flex items-center gap-1"
          >
            <span>{t('view_catalog')}</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Hotspot Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {reports.slice(0, 6).map((r) => {
            const isSelected = selectedMapReport?.id === r.id;
            const isWarning = r.status === 'Under Review' || r.category === 'Unusual water colour';

            return (
              <div
                key={r.id}
                onClick={() => handleCardClick(r)}
                className={`p-4 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between space-y-3 ${
                  isSelected
                    ? 'bg-teal-50/70 border-teal-500 shadow-md ring-2 ring-teal-500/20'
                    : 'bg-white hover:bg-slate-50/80 border-slate-200/90 shadow-xs'
                }`}
              >
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono text-[11px] font-bold text-teal-800 bg-white px-2 py-0.5 rounded border border-teal-200">
                      {r.id}
                    </span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        r.status === 'Resolved'
                          ? 'bg-emerald-100 text-emerald-800'
                          : r.status === 'Under Review'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-teal-100 text-teal-800'
                      }`}
                    >
                      {t(`status_${(r.status || '').toLowerCase().replace(/ /g, '_')}`) || r.status}
                    </span>
                  </div>

                  <h4 className="font-bold text-slate-900 text-sm line-clamp-1">
                    {r.landmark || `${r.category} in ${r.village}`}
                  </h4>

                  <p className="text-xs text-slate-500 flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                    <span>{r.village}</span>
                    <span className="text-slate-300">•</span>
                    <span>{r.date_observed}</span>
                  </p>

                  <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                    {r.description}
                  </p>
                </div>

                <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
                  <span className="text-amber-700 font-semibold bg-amber-50 px-2 py-0.5 rounded border border-amber-200/80">
                    {t('unverified_badge')}
                  </span>
                  <span className="text-teal-700 font-bold group-hover:underline flex items-center gap-0.5">
                    {t('view_on_map')} &rarr;
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Nutakki Village Field Case Study Card */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-gradient-to-r from-teal-900 via-slate-900 to-teal-950 text-white rounded-3xl p-6 sm:p-10 shadow-float border border-teal-800/80 space-y-4">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="space-y-2 max-w-3xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-500/20 border border-teal-500/40 text-mint-300 text-xs font-bold">
                <Building2 className="w-3.5 h-3.5" />
                <span>{t('case_study_title')}</span>
              </div>
              <h3 className="text-xl sm:text-2xl font-extrabold font-['Outfit'] text-white">
                {t('case_study_heading')}
              </h3>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                {t('case_study_desc')}
              </p>
              <p className="text-xs text-mint-200/80 leading-relaxed">
                <em>{t('case_study_disclaimer')}</em>
              </p>
            </div>

            <div className="shrink-0 flex flex-col gap-2 w-full sm:w-auto">
              <button
                onClick={() => { setActivePage('about'); window.scrollTo(0, 0); }}
                className="px-5 py-2.5 rounded-full bg-mint-400 hover:bg-mint-300 text-slate-950 font-bold text-xs shadow-md transition-colors text-center"
              >
                {t('read_methodology')}
              </button>
              <button
                onClick={() => { setActivePage('safety'); window.scrollTo(0, 0); }}
                className="px-5 py-2.5 rounded-full bg-white/10 hover:bg-white/20 text-white font-medium text-xs border border-white/20 transition-colors text-center"
              >
                {t('testing_guidelines')}
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* KPI Counters Ribbon */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs flex items-center gap-3.5">
            <div className="p-3 rounded-2xl bg-teal-50 text-teal-600 shrink-0">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <span className="text-2xl font-black text-slate-900 block font-['Outfit']">{stats.total_reports}</span>
              <span className="text-xs text-slate-500 font-medium">{t('stat_total')}</span>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs flex items-center gap-3.5">
            <div className="p-3 rounded-2xl bg-amber-50 text-amber-600 shrink-0">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <span className="text-2xl font-black text-slate-900 block font-['Outfit']">{stats.under_review}</span>
              <span className="text-xs text-slate-500 font-medium">{t('stat_under_review')}</span>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs flex items-center gap-3.5">
            <div className="p-3 rounded-2xl bg-emerald-50 text-emerald-600 shrink-0">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <span className="text-2xl font-black text-slate-900 block font-['Outfit']">{stats.resolved}</span>
              <span className="text-xs text-slate-500 font-medium">{t('stat_resolved')}</span>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs flex items-center gap-3.5">
            <div className="p-3 rounded-2xl bg-mint-50 text-teal-700 shrink-0">
              <MapPin className="w-5 h-5" />
            </div>
            <div>
              <span className="text-2xl font-black text-slate-900 block font-['Outfit']">{stats.villages_impacted || 1}</span>
              <span className="text-xs text-slate-500 font-medium">{t('stat_villages')}</span>
            </div>
          </div>
        </div>
      </section>

      {/* Three Core Pillars */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-4">
        <div className="text-center max-w-xl mx-auto space-y-1">
          <span className="text-xs font-bold text-teal-700 uppercase tracking-wider">Community Hydrology Pillars</span>
          <h3 className="text-2xl font-extrabold text-slate-900 font-['Outfit']">How JalaWatch Operates</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
          <div className="p-6 rounded-3xl bg-white border border-slate-200/90 shadow-xs space-y-3">
            <div className="w-10 h-10 rounded-2xl bg-teal-50 text-teal-600 flex items-center justify-center font-bold">1</div>
            <h4 className="font-bold text-slate-900 text-base">Community Reporting</h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              Villagers can document discolored water, foul odors, or drainage overflows with GPS pins and photos without revealing private personal data.
            </p>
          </div>

          <div className="p-6 rounded-3xl bg-white border border-slate-200/90 shadow-xs space-y-3">
            <div className="w-10 h-10 rounded-2xl bg-mint-50 text-teal-700 flex items-center justify-center font-bold">2</div>
            <h4 className="font-bold text-slate-900 text-base">Soak Pit & Drainage Hygiene</h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              Practical guides on constructing simple gravel soak pits to prevent kitchen sullage from seeping into domestic drinking water borewells.
            </p>
          </div>

          <div className="p-6 rounded-3xl bg-white border border-slate-200/90 shadow-xs space-y-3">
            <div className="w-10 h-10 rounded-2xl bg-aqua-50 text-aqua-700 flex items-center justify-center font-bold">3</div>
            <h4 className="font-bold text-slate-900 text-base">Certified Lab Testing</h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              Educating citizens on sterile sample collection and official testing channels through the RWS&S laboratory and AP Spandana (1902).
            </p>
          </div>
        </div>
      </section>

    </div>
  );
}
