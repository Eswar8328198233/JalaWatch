import React, { useState, useEffect, useCallback } from 'react';
import { 
  Search, Filter, Map, LayoutGrid, Table as TableIcon, 
  RotateCcw, ShieldAlert, AlertCircle, ChevronLeft, ChevronRight, Eye,
  Download, Calendar, Share2
} from 'lucide-react';
import { getReports } from '../services/api';
import ReportCard from '../components/ReportCard';
import CommunityMap from '../components/CommunityMap';
import ReportDetailModal from '../components/ReportDetailModal';
import { useLanguage } from '../context/LanguageContext';

export default function CommunityReports({ setActivePage, initialReport, onClearInitialReport }) {
  const { t } = useLanguage();
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedReport, setSelectedReport] = useState(initialReport || null);
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'table' | 'map'

  // Read URL query params on initial mount
  const getInitialParams = () => {
    const params = new URLSearchParams(window.location.search);
    return {
      search: params.get('q') || '',
      category: params.get('category') || 'All',
      village: params.get('village') || 'All',
      status: params.get('status') || 'All',
      date_from: params.get('from') || '',
      date_to: params.get('to') || '',
      page: parseInt(params.get('page') || '1', 10),
    };
  };

  const initial = getInitialParams();
  const [search, setSearch] = useState(initial.search);
  const [category, setCategory] = useState(initial.category);
  const [village, setVillage] = useState(initial.village);
  const [status, setStatus] = useState(initial.status);
  const [dateFrom, setDateFrom] = useState(initial.date_from);
  const [dateTo, setDateTo] = useState(initial.date_to);
  const [page, setPage] = useState(initial.page);

  const [pagination, setPagination] = useState({
    page: 1,
    limit: 12,
    total_records: 0,
    total_pages: 1,
    has_next: false,
    has_prev: false,
  });

  const categories = [
    'All',
    'Unusual water colour',
    'Bad smell or taste',
    'Suspected waste dumping',
    'Drainage problems',
    'Leaking pipes',
    'Agricultural runoff',
    'Other'
  ];

  const villages = [
    'All',
    'Nutakki',
    'Tadepalli Rural',
    'Mangalagiri Rural',
    'Kunchanapalli',
    'Kolanukonda',
    'Vijayawada Rural'
  ];

  const statuses = ['All', 'Submitted', 'Under Review', 'Resolved'];

  // Update URL params when filters change
  const syncUrlParams = useCallback(() => {
    const params = new URLSearchParams();
    if (search) params.set('q', search);
    if (category !== 'All') params.set('category', category);
    if (village !== 'All') params.set('village', village);
    if (status !== 'All') params.set('status', status);
    if (dateFrom) params.set('from', dateFrom);
    if (dateTo) params.set('to', dateTo);
    if (page > 1) params.set('page', page.toString());

    const queryStr = params.toString();
    const newUrl = queryStr ? `${window.location.pathname}?${queryStr}#reports` : `${window.location.pathname}#reports`;
    window.history.replaceState({}, '', newUrl);
  }, [search, category, village, status, dateFrom, dateTo, page]);

  const fetchReportsData = async () => {
    setLoading(true);
    try {
      const data = await getReports({
        search,
        category,
        village,
        status,
        date_from: dateFrom,
        date_to: dateTo,
        page,
        limit: 12,
      });
      setReports(data.reports || []);
      setPagination(data.pagination || {});
      syncUrlParams();
    } catch (err) {
      console.error('Failed to load reports:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReportsData();
  }, [category, village, status, dateFrom, dateTo, page]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchReportsData();
  };

  const handleResetFilters = () => {
    setSearch('');
    setCategory('All');
    setVillage('All');
    setStatus('All');
    setDateFrom('');
    setDateTo('');
    setPage(1);
    window.history.replaceState({}, '', `${window.location.pathname}#reports`);
  };

  // CSV Export
  const exportToCSV = () => {
    if (!reports.length) return;
    const headers = ['ID', 'Village', 'Landmark', 'Category', 'Water Source', 'Date Observed', 'Status', 'Lab Status', 'pH', 'TDS', 'Fluoride', 'Nitrate', 'E. Coli', 'Description'];
    const rows = reports.map(r => [
      r.id,
      `"${(r.village || '').replace(/"/g, '""')}"`,
      `"${(r.landmark || '').replace(/"/g, '""')}"`,
      `"${(r.category || '').replace(/"/g, '""')}"`,
      `"${(r.water_source || '').replace(/"/g, '""')}"`,
      r.date_observed || '',
      r.status || '',
      r.lab_status || 'Awaiting Test',
      r.ph || '',
      r.tds || '',
      r.fluoride || '',
      r.nitrate || '',
      r.e_coli || '',
      `"${(r.description || '').replace(/"/g, '""')}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `jalawatch_reports_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-50 border border-teal-200 text-teal-800 text-xs font-semibold mb-2">
            <span>Community Service Project Database</span>
          </div>
          <h1 className="text-3xl font-extrabold text-slate-900 font-['Outfit']">
            {t('nav_reports')}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Browse submitted concerns from Nutakki and surrounding regions. Filter by issue type, village, status, or date range.
          </p>
        </div>

        {/* View Switcher & CSV Export Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={exportToCSV}
            disabled={reports.length === 0}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold text-teal-800 bg-white hover:bg-teal-50 border border-teal-200 shadow-xs transition-colors disabled:opacity-50"
            title="Download CSV"
          >
            <Download className="w-3.5 h-3.5 text-teal-600" />
            <span>{t('btn_download_csv')}</span>
          </button>

          <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-full border border-slate-200">
            <button
              onClick={() => setViewMode('grid')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold transition-all ${
                viewMode === 'grid' ? 'bg-white text-teal-800 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>Cards</span>
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold transition-all ${
                viewMode === 'table' ? 'bg-white text-teal-800 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <TableIcon className="w-3.5 h-3.5" />
              <span>Table</span>
            </button>
            <button
              onClick={() => setViewMode('map')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold transition-all ${
                viewMode === 'map' ? 'bg-white text-teal-800 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Map className="w-3.5 h-3.5" />
              <span>Map</span>
            </button>
          </div>
        </div>
      </div>

      {/* Mandatory Unverified Label Disclaimer */}
      <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200/90 text-amber-900 text-xs flex items-start gap-3">
        <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
        <div className="leading-relaxed">
          <span className="font-semibold text-amber-950 block">Important Note on Report Verification:</span>
          All records listed on this portal are <strong>unverified civic observations</strong> submitted by community members and field volunteers. 
          Reported observations of blackish water, foul odors, or drainage stagnation reflect visual or olfactory perceptions and have not been certified by official chemical testing. <em>Suspected causes are never stated as proven facts.</em>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3">
          
          {/* Search box */}
          <form onSubmit={handleSearchSubmit} className="sm:col-span-2 lg:col-span-2">
            <label className="block text-[11px] font-semibold text-slate-500 uppercase mb-1">Search Keywords or ID</label>
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
              <input
                type="text"
                placeholder="ID, village, landmark, concern..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>
          </form>

          {/* Category Filter */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 uppercase mb-1">{t('form_category')}</label>
            <select
              value={category}
              onChange={(e) => { setCategory(e.target.value); setPage(1); }}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white"
            >
              {categories.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          {/* Village Filter */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 uppercase mb-1">{t('form_village')}</label>
            <select
              value={village}
              onChange={(e) => { setVillage(e.target.value); setPage(1); }}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white"
            >
              {villages.map((v) => (
                <option key={v} value={v}>{v}</option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 uppercase mb-1">Status</label>
            <select
              value={status}
              onChange={(e) => { setStatus(e.target.value); setPage(1); }}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white"
            >
              {statuses.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>

          {/* Date Filter Range */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 uppercase mb-1">Observed From</label>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => { setDateFrom(e.target.value); setPage(1); }}
              className="w-full px-2 py-1.5 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>

        </div>

        {/* Filter Bar Footer */}
        <div className="flex flex-wrap items-center justify-between pt-2 border-t border-slate-100 text-xs gap-2">
          <span className="text-slate-500 font-medium">
            Found <strong>{pagination.total_records || reports.length}</strong> matching report(s)
            {(category !== 'All' || village !== 'All' || status !== 'All' || search || dateFrom) && (
              <span className="ml-1 text-teal-700 font-semibold">(Filtered)</span>
            )}
          </span>
          <button
            onClick={handleResetFilters}
            className="flex items-center gap-1.5 text-slate-500 hover:text-teal-700 transition-colors font-medium px-2 py-1 rounded-lg hover:bg-slate-50"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>{t('btn_reset')}</span>
          </button>
        </div>
      </div>

      {/* Content Area */}
      {loading ? (
        <div className="py-20 text-center space-y-3">
          <div className="w-8 h-8 border-3 border-teal-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs text-slate-500">Loading community reports...</p>
        </div>
      ) : reports.length === 0 ? (
        <div className="py-16 text-center bg-white rounded-3xl border border-slate-200 p-8 space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
            <AlertCircle className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-slate-800">No reports match the selected filters</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Try adjusting your search criteria or reset filters to view all entries.
          </p>
          <button
            onClick={handleResetFilters}
            className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors"
          >
            {t('btn_reset')}
          </button>
        </div>
      ) : (
        <>
          {/* Card View */}
          {viewMode === 'grid' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {reports.map((report) => (
                <ReportCard
                  key={report.id}
                  report={report}
                  onSelect={(r) => setSelectedReport(r)}
                />
              ))}
            </div>
          )}

          {/* Table View */}
          {viewMode === 'table' && (
            <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-200">
                    <tr>
                      <th className="py-3 px-4">Report ID</th>
                      <th className="py-3 px-4">Village / Locality</th>
                      <th className="py-3 px-4">Category</th>
                      <th className="py-3 px-4">Water Source</th>
                      <th className="py-3 px-4">Date</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4">Lab Testing</th>
                      <th className="py-3 px-4">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {reports.map((r) => (
                      <tr key={r.id} className="hover:bg-slate-50 transition-colors">
                        <td className="py-3.5 px-4 font-mono font-bold text-teal-800">
                          {r.id}
                        </td>
                        <td className="py-3.5 px-4 font-medium text-slate-800">
                          {r.village}
                          {r.landmark && <span className="text-[11px] text-slate-400 block">{r.landmark}</span>}
                        </td>
                        <td className="py-3.5 px-4 text-slate-600">
                          {r.category}
                        </td>
                        <td className="py-3.5 px-4 text-slate-500">
                          {r.water_source || 'Borewell'}
                        </td>
                        <td className="py-3.5 px-4 text-slate-500">
                          {r.date_observed}
                        </td>
                        <td className="py-3.5 px-4">
                          <span
                            className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                              r.status === 'Resolved'
                                ? 'bg-emerald-100 text-emerald-800'
                                : r.status === 'Under Review'
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-teal-100 text-teal-800'
                            }`}
                          >
                            {r.status}
                          </span>
                        </td>
                        <td className="py-3.5 px-4">
                          {r.lab_status === 'Tested' || r.ph != null ? (
                            <span className="inline-flex px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 text-emerald-800">
                              Lab Tested (pH {r.ph || '7.2'})
                            </span>
                          ) : (
                            <span className="text-[11px] text-slate-400">Awaiting Lab</span>
                          )}
                        </td>
                        <td className="py-3.5 px-4">
                          <button
                            onClick={() => setSelectedReport(r)}
                            className="inline-flex items-center gap-1 text-teal-700 hover:text-teal-900 font-semibold py-1 px-2.5 rounded-lg hover:bg-teal-50"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>{t('btn_details')}</span>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Interactive Map View */}
          {viewMode === 'map' && (
            <CommunityMap
              reports={reports}
              onSelectReport={(r) => setSelectedReport(r)}
            />
          )}

          {/* Pagination Controls */}
          {pagination.total_pages > 1 && (
            <div className="flex items-center justify-between pt-4 border-t border-slate-200 text-xs">
              <span className="text-slate-500">
                Page {pagination.page} of {pagination.total_pages} ({pagination.total_records} reports)
              </span>
              <div className="flex items-center gap-2">
                <button
                  disabled={!pagination.has_prev}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:pointer-events-none transition-colors"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                  <span>Previous</span>
                </button>
                <button
                  disabled={!pagination.has_next}
                  onClick={() => setPage((p) => p + 1)}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:pointer-events-none transition-colors"
                >
                  <span>Next</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Detail Modal */}
      {selectedReport && (
        <ReportDetailModal
          report={selectedReport}
          onClose={() => {
            setSelectedReport(null);
            if (onClearInitialReport) onClearInitialReport();
          }}
          onNavigateSafety={() => {
            setSelectedReport(null);
            setActivePage('safety');
            window.scrollTo(0, 0);
          }}
        />
      )}

    </div>
  );
}
