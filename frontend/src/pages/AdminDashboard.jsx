import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, FileText, CheckCircle2, Clock, Trash2, Edit3, 
  Search, Download, ExternalLink, AlertTriangle, Eye, X, 
  MapPin, Calendar, User, Phone, Check, RefreshCw, AlertCircle,
  BarChart3, ShieldAlert, Printer, FlaskConical, History, Filter
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { 
  getAdminReports, 
  updateAdminReportStatus, 
  updateAdminLabTest,
  getAdminLogs,
  deleteAdminReport,
  getStats,
  getExportUrl,
  getPhotoUrl
} from '../services/api';
import AdminAnalyticsCharts from '../components/AdminAnalyticsCharts';

export default function AdminDashboard({ setActivePage }) {
  const { token, admin, isAuthenticated, logout } = useAuth();
  const { addToast } = useToast();

  const [activeTab, setActiveTab] = useState('table'); // 'table' | 'analytics' | 'logs'
  const [reports, setReports] = useState([]);
  const [stats, setStats] = useState(null);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [logsLoading, setLogsLoading] = useState(false);

  // Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [categoryFilter, setCategoryFilter] = useState('All');

  // Modals
  const [selectedReport, setSelectedReport] = useState(null);
  const [editingReport, setEditingReport] = useState(null);
  const [labTestingReport, setLabTestingReport] = useState(null);
  const [deletingReport, setDeletingReport] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Edit form states
  const [editStatus, setEditStatus] = useState('');
  const [editNotes, setEditNotes] = useState('');
  const [editVerified, setEditVerified] = useState(false);

  // Lab test form states
  const [labForm, setLabForm] = useState({
    ph: '',
    tds: '',
    fluoride: '',
    nitrate: '',
    e_coli: 'Absent',
    lab_name: 'RWS&S District Water Testing Laboratory, Guntur',
    testing_date: new Date().toISOString().slice(0, 10),
    lab_notes: '',
    lab_status: 'Tested'
  });

  useEffect(() => {
    if (!isAuthenticated) {
      setActivePage('admin-login');
      return;
    }
    loadDashboardData();
  }, [isAuthenticated, statusFilter, categoryFilter]);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      const [reportsData, statsData] = await Promise.all([
        getAdminReports(token, {
          search,
          status: statusFilter,
          category: categoryFilter,
        }),
        getStats(),
      ]);
      setReports(reportsData.reports || []);
      setStats(statsData);
    } catch (err) {
      console.error('Failed to load admin data:', err);
      addToast(err.message || 'Error loading administrative reports', 'error');
    } finally {
      setLoading(false);
    }
  };

  const loadAuditLogs = async () => {
    setLogsLoading(true);
    try {
      const data = await getAdminLogs(token, { limit: 100 });
      setLogs(data.logs || []);
    } catch (err) {
      console.error('Failed to load audit logs:', err);
      addToast('Error fetching security audit logs', 'error');
    } finally {
      setLogsLoading(false);
    }
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    if (tab === 'logs') {
      loadAuditLogs();
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    loadDashboardData();
  };

  const handleOpenEdit = (report) => {
    setEditingReport(report);
    setEditStatus(report.status);
    setEditNotes(report.admin_notes || '');
    setEditVerified(Boolean(report.is_verified));
  };

  const handleOpenLabTest = (report) => {
    setLabTestingReport(report);
    setLabForm({
      ph: report.ph != null ? report.ph : '7.2',
      tds: report.tds != null ? report.tds : '480',
      fluoride: report.fluoride != null ? report.fluoride : '0.8',
      nitrate: report.nitrate != null ? report.nitrate : '15',
      e_coli: report.e_coli || 'Absent',
      lab_name: report.lab_name || 'RWS&S District Water Testing Laboratory, Guntur',
      testing_date: report.testing_date || new Date().toISOString().slice(0, 10),
      lab_notes: report.lab_notes || 'Tested compliant with BIS IS 10500 standards.',
      lab_status: report.lab_status || 'Tested'
    });
  };

  const handleSaveStatus = async (e) => {
    e.preventDefault();
    if (!editingReport) return;

    setActionLoading(true);
    try {
      await updateAdminReportStatus(token, editingReport.id, {
        status: editStatus,
        admin_notes: editNotes,
        is_verified: editVerified,
      });
      addToast(`Report ${editingReport.id} status updated successfully.`, 'success');
      setEditingReport(null);
      loadDashboardData();
    } catch (err) {
      console.error('Update status error:', err);
      addToast(err.message || 'Failed to update report status.', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleSaveLabTest = async (e) => {
    e.preventDefault();
    if (!labTestingReport) return;

    setActionLoading(true);
    try {
      await updateAdminLabTest(token, labTestingReport.id, {
        ph: labForm.ph ? parseFloat(labForm.ph) : null,
        tds: labForm.tds ? parseFloat(labForm.tds) : null,
        fluoride: labForm.fluoride ? parseFloat(labForm.fluoride) : null,
        nitrate: labForm.nitrate ? parseFloat(labForm.nitrate) : null,
        e_coli: labForm.e_coli,
        lab_name: labForm.lab_name,
        testing_date: labForm.testing_date,
        lab_notes: labForm.lab_notes,
        lab_status: labForm.lab_status,
      });
      addToast(`Laboratory test results recorded for ${labTestingReport.id}.`, 'success');
      setLabTestingReport(null);
      loadDashboardData();
    } catch (err) {
      console.error('Record lab test error:', err);
      addToast(err.message || 'Failed to save laboratory testing metrics.', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deletingReport) return;

    setActionLoading(true);
    try {
      await deleteAdminReport(token, deletingReport.id);
      addToast(`Report ${deletingReport.id} deleted.`, 'success');
      setDeletingReport(null);
      loadDashboardData();
    } catch (err) {
      console.error('Delete error:', err);
      addToast(err.message || 'Failed to delete report.', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleExportCSV = () => {
    const exportUrl = getExportUrl(token);
    const link = document.createElement('a');
    link.href = exportUrl;
    link.setAttribute('download', 'jalawatch_reports_export.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    addToast('Downloading official reports CSV...', 'info');
  };

  const handlePrintSummary = () => {
    window.print();
  };

  if (!isAuthenticated) return null;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      
      {/* Top Banner & Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-slate-900 text-white p-6 sm:p-8 rounded-3xl shadow-lg border border-slate-800 print:hidden">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-500/20 border border-teal-500/30 text-teal-300 text-xs font-semibold">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Admin Control Center</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold font-['Outfit']">
            Groundwater Submissions Management
          </h1>
          <p className="text-xs text-slate-400">
            Logged in as <strong className="text-white">{admin?.username}</strong> ({admin?.email})
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={handlePrintSummary}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-colors"
            title="Print Summary"
          >
            <Printer className="w-4 h-4" />
            <span>Print Summary</span>
          </button>
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-xs shadow-md transition-colors"
          >
            <Download className="w-4 h-4" />
            <span>Export CSV</span>
          </button>
          <button
            onClick={() => { logout(); setActivePage('home'); }}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-rose-300 hover:text-white text-xs font-semibold border border-slate-700 transition-colors"
          >
            Log Out
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-3 print:hidden">
        <button
          onClick={() => handleTabChange('table')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'table'
              ? 'bg-teal-700 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>Submissions Database ({reports.length})</span>
        </button>

        <button
          onClick={() => handleTabChange('analytics')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'analytics'
              ? 'bg-teal-700 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <BarChart3 className="w-4 h-4" />
          <span>Advanced Analytics</span>
        </button>

        <button
          onClick={() => handleTabChange('logs')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'logs'
              ? 'bg-teal-700 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <History className="w-4 h-4" />
          <span>Security & Activity Logs</span>
        </button>
      </div>

      {/* TAB 1: SUBMISSIONS TABLE */}
      {activeTab === 'table' && (
        <div className="space-y-6">
          {/* KPI Stats Ribbon */}
          {stats && (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                <span className="text-xs text-slate-400 font-medium">Total Submissions</span>
                <span className="text-2xl font-black text-slate-900 block font-['Outfit'] mt-1">
                  {stats.total_reports}
                </span>
              </div>
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                <span className="text-xs text-slate-400 font-medium">Pending Review</span>
                <span className="text-2xl font-black text-teal-600 block font-['Outfit'] mt-1">
                  {stats.submitted}
                </span>
              </div>
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                <span className="text-xs text-slate-400 font-medium">Under Investigation</span>
                <span className="text-2xl font-black text-amber-600 block font-['Outfit'] mt-1">
                  {stats.under_review}
                </span>
              </div>
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                <span className="text-xs text-slate-400 font-medium">Resolved / Addressed</span>
                <span className="text-2xl font-black text-emerald-600 block font-['Outfit'] mt-1">
                  {stats.resolved}
                </span>
              </div>
            </div>
          )}

          {/* Management Toolbar */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3 text-xs print:hidden">
            <form onSubmit={handleSearchSubmit} className="w-full sm:w-72 relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
              <input
                type="text"
                placeholder="Search report ID, village, notes..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </form>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 rounded-xl border border-slate-200 focus:outline-none bg-white"
              >
                <option value="All">All Statuses</option>
                <option value="Submitted">Submitted</option>
                <option value="Under Review">Under Review</option>
                <option value="Resolved">Resolved</option>
                <option value="Archived">Archived</option>
              </select>

              <button
                onClick={loadDashboardData}
                className="p-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors"
                title="Refresh List"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Reports Table */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
            {loading ? (
              <div className="py-20 text-center space-y-2">
                <div className="w-8 h-8 border-3 border-teal-600 border-t-transparent rounded-full animate-spin mx-auto" />
                <p className="text-xs text-slate-500">Loading reports database...</p>
              </div>
            ) : reports.length === 0 ? (
              <div className="py-16 text-center text-slate-500 text-xs">
                No reports match the current criteria.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-200">
                    <tr>
                      <th className="py-3 px-4">Report ID</th>
                      <th className="py-3 px-4">Village & Source</th>
                      <th className="py-3 px-4">Category</th>
                      <th className="py-3 px-4">Date Observed</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4">Lab Verification</th>
                      <th className="py-3 px-4">Admin Notes</th>
                      <th className="py-3 px-4 text-right print:hidden">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {reports.map((r) => (
                      <tr key={r.id} className="hover:bg-slate-50/80 transition-colors">
                        
                        {/* ID */}
                        <td className="py-3.5 px-4 font-mono font-bold text-teal-800 whitespace-nowrap">
                          {r.id}
                          {r.is_demo && (
                            <span className="ml-1.5 text-[9px] uppercase px-1.5 py-0.5 rounded bg-purple-100 text-purple-700">
                              Demo
                            </span>
                          )}
                        </td>

                        {/* Village */}
                        <td className="py-3.5 px-4">
                          <span className="font-semibold text-slate-800 block">{r.village}</span>
                          <span className="text-[11px] text-slate-400 block">{r.water_source || 'Groundwater'}</span>
                        </td>

                        {/* Category */}
                        <td className="py-3.5 px-4 text-slate-700">
                          {r.category}
                        </td>

                        {/* Date */}
                        <td className="py-3.5 px-4 text-slate-500 whitespace-nowrap">
                          {r.date_observed}
                        </td>

                        {/* Status */}
                        <td className="py-3.5 px-4 whitespace-nowrap">
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

                        {/* Lab Verification */}
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          {r.lab_status === 'Tested' || r.ph != null ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                              <FlaskConical className="w-3 h-3" />
                              <span>pH {r.ph || '7.2'} • Verified</span>
                            </span>
                          ) : (
                            <span className="text-[10px] text-slate-400">Not Tested</span>
                          )}
                        </td>

                        {/* Admin Notes Preview */}
                        <td className="py-3.5 px-4 max-w-xs text-slate-600 truncate">
                          {r.admin_notes ? (
                            <span className="text-slate-700 italic">{r.admin_notes}</span>
                          ) : (
                            <span className="text-slate-300 italic">None logged</span>
                          )}
                        </td>

                        {/* Actions */}
                        <td className="py-3.5 px-4 text-right whitespace-nowrap space-x-1 print:hidden">
                          <button
                            onClick={() => setSelectedReport(r)}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-teal-700 hover:bg-teal-50 transition-colors"
                            title="View Full Details"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleOpenLabTest(r)}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-emerald-700 hover:bg-emerald-50 transition-colors"
                            title="Record Laboratory Test"
                          >
                            <FlaskConical className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleOpenEdit(r)}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-amber-600 hover:bg-amber-50 transition-colors"
                            title="Edit Status & Notes"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setDeletingReport(r)}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                            title="Delete Report"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>

                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: ADVANCED ANALYTICS */}
      {activeTab === 'analytics' && stats && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-900 font-['Outfit']">
              Groundwater Incident Analytics & Trends
            </h2>
            <button
              onClick={loadDashboardData}
              className="text-xs text-teal-700 font-bold flex items-center gap-1 hover:underline"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Refresh Metrics</span>
            </button>
          </div>
          <AdminAnalyticsCharts stats={stats} />
        </div>
      )}

      {/* TAB 3: AUDIT LOGS */}
      {activeTab === 'logs' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-900 font-['Outfit']">
                Administrative Activity & Security Audit Trail
              </h2>
              <p className="text-xs text-slate-500">
                All administrative status updates, laboratory tests, and deletions are immutably logged for civic governance accountability.
              </p>
            </div>
            <button
              onClick={loadAuditLogs}
              className="flex items-center gap-1 px-3 py-1.5 rounded-xl border border-slate-200 text-xs text-slate-700 hover:bg-slate-50"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Refresh Logs</span>
            </button>
          </div>

          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
            {logsLoading ? (
              <div className="py-20 text-center space-y-2">
                <div className="w-8 h-8 border-3 border-teal-600 border-t-transparent rounded-full animate-spin mx-auto" />
                <p className="text-xs text-slate-500">Retrieving audit log entries...</p>
              </div>
            ) : logs.length === 0 ? (
              <div className="py-16 text-center text-slate-500 text-xs">
                No activity logs recorded yet. Action a report to generate records.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-200">
                    <tr>
                      <th className="py-3 px-4">Timestamp</th>
                      <th className="py-3 px-4">Action</th>
                      <th className="py-3 px-4">Report ID</th>
                      <th className="py-3 px-4">Admin</th>
                      <th className="py-3 px-4">Details / Notes</th>
                      <th className="py-3 px-4">Origin IP</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {logs.map((log) => (
                      <tr key={log.id} className="hover:bg-slate-50/80">
                        <td className="py-3 px-4 font-mono text-slate-500 whitespace-nowrap">
                          {log.created_at}
                        </td>
                        <td className="py-3 px-4">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            log.action.includes('DELETE') ? 'bg-rose-100 text-rose-800' :
                            log.action.includes('LAB') ? 'bg-emerald-100 text-emerald-800' :
                            'bg-teal-100 text-teal-800'
                          }`}>
                            {log.action}
                          </span>
                        </td>
                        <td className="py-3 px-4 font-mono font-bold text-teal-800">
                          {log.report_id || 'Global'}
                        </td>
                        <td className="py-3 px-4 font-semibold text-slate-800">
                          {log.admin_username}
                        </td>
                        <td className="py-3 px-4 text-slate-600 max-w-sm truncate">
                          {log.notes || '—'}
                        </td>
                        <td className="py-3 px-4 font-mono text-[11px] text-slate-400">
                          {log.ip_address || 'Localhost'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* RECORD LAB TEST MODAL */}
      {labTestingReport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-3xl shadow-xl max-w-xl w-full p-6 border border-slate-200 space-y-4 max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="text-xs text-teal-700 font-mono font-bold">Report: {labTestingReport.id}</span>
                <h3 className="font-bold text-slate-900 text-base">Record Official Laboratory Water Test</h3>
              </div>
              <button
                onClick={() => setLabTestingReport(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveLabTest} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">pH Level (6.5 - 8.5)</label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="e.g. 7.4"
                    value={labForm.ph}
                    onChange={(e) => setLabForm({ ...labForm, ph: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-teal-500"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">TDS (mg/L, Norm &lt; 500)</label>
                  <input
                    type="number"
                    step="1"
                    placeholder="e.g. 480"
                    value={labForm.tds}
                    onChange={(e) => setLabForm({ ...labForm, tds: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-teal-500"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Fluoride (mg/L, Norm &lt; 1.0)</label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="e.g. 0.8"
                    value={labForm.fluoride}
                    onChange={(e) => setLabForm({ ...labForm, fluoride: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-teal-500"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Nitrate (mg/L, Norm &lt; 45)</label>
                  <input
                    type="number"
                    step="0.1"
                    placeholder="e.g. 15.0"
                    value={labForm.nitrate}
                    onChange={(e) => setLabForm({ ...labForm, nitrate: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-teal-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">E. Coli Bacteriological Test</label>
                  <select
                    value={labForm.e_coli}
                    onChange={(e) => setLabForm({ ...labForm, e_coli: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-teal-500 bg-white"
                  >
                    <option value="Absent">Absent (Negative / Safe)</option>
                    <option value="Present">Present (Positive / Contaminated)</option>
                    <option value="High Risk">High Risk (Severe Coliform Counts)</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Test Completion Date</label>
                  <input
                    type="date"
                    value={labForm.testing_date}
                    onChange={(e) => setLabForm({ ...labForm, testing_date: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-teal-500"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Testing Authority / Accredited Lab</label>
                <input
                  type="text"
                  value={labForm.lab_name}
                  onChange={(e) => setLabForm({ ...labForm, lab_name: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Lab Officer Analysis Notes</label>
                <textarea
                  rows={3}
                  value={labForm.lab_notes}
                  onChange={(e) => setLabForm({ ...labForm, lab_notes: e.target.value })}
                  placeholder="Official observations regarding turbidity, odor, or chemical limits..."
                  className="w-full p-3 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setLabTestingReport(null)}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-5 py-2 rounded-xl bg-teal-700 hover:bg-teal-800 text-white font-bold transition-colors shadow-sm disabled:opacity-50"
                >
                  {actionLoading ? 'Saving...' : 'Record Certified Results'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Status & Admin Notes Modal */}
      {editingReport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-3xl shadow-xl max-w-lg w-full p-6 border border-slate-200 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="text-xs text-slate-400 font-mono">Report: {editingReport.id}</span>
                <h3 className="font-bold text-slate-900 text-base">Update Status & Review Notes</h3>
              </div>
              <button
                onClick={() => setEditingReport(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveStatus} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Investigation Status</label>
                <select
                  value={editStatus}
                  onChange={(e) => setEditStatus(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white"
                >
                  <option value="Submitted">Submitted (Awaiting Initial Review)</option>
                  <option value="Under Review">Under Review (Forwarded to Testing / Field Inspection)</option>
                  <option value="Resolved">Resolved (Addressed by Panchayat / Repaired)</option>
                  <option value="Archived">Archived</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Private Administrative Notes
                </label>
                <textarea
                  rows={4}
                  placeholder="e.g. Field inspection conducted on 20-Oct. Forwarded sample to RWS&S subdivision lab for turbidity and bacterial analysis..."
                  value={editNotes}
                  onChange={(e) => setEditNotes(e.target.value)}
                  className="w-full p-3 rounded-xl border border-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
                <span className="text-[11px] text-slate-400 mt-1 block">
                  Private: These notes are strictly internal and hidden from public visitors.
                </span>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editVerified}
                    onChange={(e) => setEditVerified(e.target.checked)}
                    className="w-4 h-4 rounded text-teal-600 focus:ring-teal-500"
                  />
                  <span className="text-xs font-semibold text-slate-800">
                    Mark as Formally Lab-Verified
                  </span>
                </label>
                <span className="text-[11px] text-slate-500 block mt-1 pl-6">
                  Only check this if an official accredited laboratory report has confirmed the findings.
                </span>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingReport(null)}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-5 py-2 rounded-xl bg-teal-700 hover:bg-teal-800 text-white font-bold transition-colors shadow-sm disabled:opacity-50"
                >
                  {actionLoading ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingReport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-3xl shadow-xl max-w-sm w-full p-6 border border-slate-200 text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-slate-900 text-base">Delete Report?</h3>
            <p className="text-xs text-slate-500">
              Are you sure you want to permanently delete report <strong className="text-slate-800 font-mono">{deletingReport.id}</strong>? Any associated photo file will also be deleted from storage.
            </p>
            <div className="flex items-center justify-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDeletingReport(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={actionLoading}
                onClick={handleConfirmDelete}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-sm"
              >
                {actionLoading ? 'Deleting...' : 'Yes, Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Detail View Modal for Admin */}
      {selectedReport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-3xl shadow-2xl max-w-xl w-full p-6 border border-slate-200 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <span className="font-mono font-bold text-teal-800">{selectedReport.id}</span>
              <button
                onClick={() => setSelectedReport(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-2 bg-slate-50 p-3 rounded-2xl">
                <div>
                  <span className="text-slate-400 block font-medium">Village:</span>
                  <span className="font-semibold text-slate-800">{selectedReport.village}</span>
                </div>
                <div>
                  <span className="text-slate-400 block font-medium">Landmark:</span>
                  <span className="font-semibold text-slate-800">{selectedReport.landmark || 'None'}</span>
                </div>
                <div>
                  <span className="text-slate-400 block font-medium">Reporter Name:</span>
                  <span className="text-slate-800">{selectedReport.reporter_name || 'Anonymous'}</span>
                </div>
                <div>
                  <span className="text-slate-400 block font-medium">Reporter Contact:</span>
                  <span className="text-slate-800">{selectedReport.reporter_contact || 'None provided'}</span>
                </div>
              </div>

              <div>
                <span className="font-bold text-slate-700 block mb-1">Description:</span>
                <p className="p-3 rounded-xl bg-slate-50 text-slate-700 leading-relaxed whitespace-pre-wrap">
                  {selectedReport.description}
                </p>
              </div>

              {selectedReport.photo_url && (
                <div>
                  <span className="font-bold text-slate-700 block mb-1">Uploaded Photo:</span>
                  <img src={getPhotoUrl(selectedReport.photo_url)} alt="Proof" className="w-full rounded-2xl max-h-64 object-cover border" loading="lazy" />
                </div>
              )}

              <div>
                <span className="font-bold text-slate-700 block mb-1">Internal Admin Notes:</span>
                <p className="p-3 rounded-xl bg-amber-50/50 border border-amber-200 text-amber-950">
                  {selectedReport.admin_notes || 'No administrative notes recorded yet.'}
                </p>
              </div>

              {/* Lab test results if any */}
              {selectedReport.ph != null && (
                <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 space-y-1">
                  <span className="font-bold text-emerald-950 block">Recorded Laboratory Results:</span>
                  <div className="grid grid-cols-3 gap-2 text-[11px] pt-1">
                    <div>pH: <strong>{selectedReport.ph}</strong></div>
                    <div>TDS: <strong>{selectedReport.tds} mg/L</strong></div>
                    <div>Fluoride: <strong>{selectedReport.fluoride || 'N/A'}</strong></div>
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-end pt-2 border-t border-slate-100">
              <button
                onClick={() => setSelectedReport(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 text-white text-xs font-semibold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
