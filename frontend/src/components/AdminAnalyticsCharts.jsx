import React from 'react';
import { 
  BarChart3, PieChart, TrendingUp, CheckCircle2, Clock, 
  Droplets, MapPin, Layers, Award, ShieldAlert, Calendar
} from 'lucide-react';

export default function AdminAnalyticsCharts({ stats }) {
  if (!stats) return null;

  const total = stats.total_reports || 0;
  const submitted = stats.submitted || 0;
  const underReview = stats.under_review || 0;
  const resolved = stats.resolved || 0;
  const resolutionRate = stats.resolution_rate || (total > 0 ? ((resolved / total) * 100).toFixed(1) : 0);
  const categories = stats.category_breakdown || [];
  const villages = stats.top_villages || [];
  const monthlyTrends = stats.monthly_trends || [];
  const waterSources = stats.water_sources || [];

  const maxMonthCount = Math.max(...monthlyTrends.map(m => m.count), 1);
  const maxVillageCount = Math.max(...villages.map(v => v.count), 1);
  const maxCategoryCount = Math.max(...categories.map(c => c.count), 1);

  return (
    <div className="space-y-6 animate-in fade-in">
      
      {/* Top Analytical KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        
        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-1.5">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-bold uppercase tracking-wider">Total Volume</span>
            <BarChart3 className="w-4 h-4 text-teal-600" />
          </div>
          <p className="text-2xl font-extrabold text-slate-900 font-['Outfit']">{total}</p>
          <span className="text-[11px] text-slate-500 block">Civic Observations Logged</span>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-1.5">
          <div className="flex items-center justify-between text-emerald-600">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Resolution Rate</span>
            <TrendingUp className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-2xl font-extrabold text-emerald-700 font-['Outfit']">{resolutionRate}%</p>
          <span className="text-[11px] text-emerald-600 block">{resolved} of {total} Issues Addressed</span>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-1.5">
          <div className="flex items-center justify-between text-amber-500">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Active Queue</span>
            <Clock className="w-4 h-4 text-amber-500" />
          </div>
          <p className="text-2xl font-extrabold text-amber-700 font-['Outfit']">{underReview}</p>
          <span className="text-[11px] text-amber-600 block">Field Investigations In-Progress</span>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-1.5">
          <div className="flex items-center justify-between text-teal-600">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Verified Lab Records</span>
            <Award className="w-4 h-4 text-teal-600" />
          </div>
          <p className="text-2xl font-extrabold text-teal-800 font-['Outfit']">{stats.verified_reports || 0}</p>
          <span className="text-[11px] text-teal-600 block">NABL / RWS&S Certified Tests</span>
        </div>

      </div>

      {/* Main Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Chart 1: Monthly Timeline Trend Bar Chart (SVG) */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-soft space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-teal-600" />
              <h4 className="font-bold text-slate-900 text-sm font-['Outfit']">Monthly Incident Trends</h4>
            </div>
            <span className="text-[11px] font-bold text-teal-700 bg-teal-50 px-2 py-0.5 rounded">Timeline Analysis</span>
          </div>

          {monthlyTrends.length === 0 ? (
            <p className="text-xs text-slate-400 py-8 text-center">No historical date trend records found.</p>
          ) : (
            <div className="space-y-3 pt-2">
              <div className="h-44 flex items-end justify-between gap-2 px-2 pt-4 border-b border-slate-200">
                {monthlyTrends.map((m, idx) => {
                  const heightPercent = Math.max(15, Math.round((m.count / maxMonthCount) * 100));
                  return (
                    <div key={idx} className="flex-1 flex flex-col items-center gap-1.5 group h-full justify-end">
                      <span className="text-[10px] font-bold text-teal-900 opacity-0 group-hover:opacity-100 transition-opacity bg-white px-1.5 py-0.5 rounded shadow-2xs border border-teal-200">
                        {m.count}
                      </span>
                      <div 
                        style={{ height: `${heightPercent}%` }}
                        className="w-full max-w-[36px] bg-gradient-to-t from-teal-700 to-teal-500 rounded-t-lg group-hover:from-teal-800 group-hover:to-teal-600 transition-all shadow-xs"
                      />
                      <span className="text-[10px] font-medium text-slate-500 truncate w-full text-center pt-1">
                        {m.month}
                      </span>
                    </div>
                  );
                })}
              </div>
              <p className="text-[11px] text-slate-400 text-right">Hover bars to inspect exact monthly report volume</p>
            </div>
          )}
        </div>

        {/* Chart 2: Status Breakdown Proportion */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-soft space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <PieChart className="w-4 h-4 text-teal-600" />
              <h4 className="font-bold text-slate-900 text-sm font-['Outfit']">Workflow Pipeline Status</h4>
            </div>
            <span className="text-[11px] font-bold text-slate-500">{total} Total</span>
          </div>

          <div className="space-y-3 pt-2">
            
            {/* Visual Multi-Segment Proportion Bar */}
            <div className="h-4 w-full rounded-full bg-slate-100 overflow-hidden flex shadow-inner">
              <div 
                style={{ width: `${total > 0 ? (submitted / total) * 100 : 0}%` }}
                className="bg-teal-500 h-full"
                title={`Submitted: ${submitted}`}
              />
              <div 
                style={{ width: `${total > 0 ? (underReview / total) * 100 : 0}%` }}
                className="bg-amber-400 h-full"
                title={`Under Review: ${underReview}`}
              />
              <div 
                style={{ width: `${total > 0 ? (resolved / total) * 100 : 0}%` }}
                className="bg-emerald-500 h-full"
                title={`Resolved: ${resolved}`}
              />
            </div>

            {/* Status Breakdown Legend & Counts */}
            <div className="grid grid-cols-3 gap-2 pt-2 text-xs">
              <div className="p-3 rounded-2xl bg-teal-50 border border-teal-200 text-teal-900">
                <span className="text-[11px] font-bold text-teal-700 block">Submitted</span>
                <span className="text-lg font-extrabold">{submitted}</span>
                <span className="text-[10px] text-teal-600 block">{total > 0 ? Math.round((submitted / total) * 100) : 0}%</span>
              </div>

              <div className="p-3 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900">
                <span className="text-[11px] font-bold text-amber-700 block">Under Review</span>
                <span className="text-lg font-extrabold">{underReview}</span>
                <span className="text-[10px] text-amber-600 block">{total > 0 ? Math.round((underReview / total) * 100) : 0}%</span>
              </div>

              <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900">
                <span className="text-[11px] font-bold text-emerald-700 block">Resolved</span>
                <span className="text-lg font-extrabold">{resolved}</span>
                <span className="text-[10px] text-emerald-600 block">{total > 0 ? Math.round((resolved / total) * 100) : 0}%</span>
              </div>
            </div>

          </div>
        </div>

        {/* Chart 3: Reports by Village / Mandal */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-soft space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-teal-600" />
              <h4 className="font-bold text-slate-900 text-sm font-['Outfit']">Locality Distribution (Nutakki & Surroundings)</h4>
            </div>
            <span className="text-[11px] font-bold text-slate-500">{villages.length} Villages</span>
          </div>

          <div className="space-y-2.5 pt-1">
            {villages.map((v, idx) => {
              const pct = Math.round((v.count / maxVillageCount) * 100);
              return (
                <div key={idx} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-800">{v.village}</span>
                    <span className="font-bold text-teal-800">{v.count} report{v.count > 1 ? 's' : ''}</span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
                    <div 
                      style={{ width: `${pct}%` }} 
                      className="h-full bg-teal-600 rounded-full transition-all duration-500"
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Chart 4: Reports by Issue Category */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-soft space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-teal-600" />
              <h4 className="font-bold text-slate-900 text-sm font-['Outfit']">Category Severity Breakdown</h4>
            </div>
            <span className="text-[11px] font-bold text-slate-500">{categories.length} Categories</span>
          </div>

          <div className="space-y-2.5 pt-1">
            {categories.map((c, idx) => {
              const pct = Math.round((c.count / maxCategoryCount) * 100);
              const isHighRisk = c.category === 'Unusual water colour' || c.category === 'Drainage problems';
              return (
                <div key={idx} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-800">{c.category}</span>
                    <span className={`font-bold ${isHighRisk ? 'text-orange-600' : 'text-teal-800'}`}>
                      {c.count} ({total > 0 ? Math.round((c.count / total) * 100) : 0}%)
                    </span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
                    <div 
                      style={{ width: `${pct}%` }} 
                      className={`h-full rounded-full transition-all duration-500 ${
                        isHighRisk ? 'bg-orange-500' : 'bg-teal-500'
                      }`}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </div>

    </div>
  );
}

