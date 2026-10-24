import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, FileText, CheckCircle2, Clock, Trash2, Edit3, 
  Search, Download, ExternalLink, AlertTriangle, Eye, X, 
  MapPin, Calendar, User, Phone, Check, RefreshCw, AlertCircle
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { 
  getAdminReports, 
  updateAdminReportStatus, 
  deleteAdminReport,
  getStats,
  getExportUrl,
  getPhotoUrl
} from '../services/api';

export default function AdminDashboard({ setActivePage }) {
  const { token, admin, isAuthenticated, logout } = useAuth();
  const { addToast } = useToast();

  const [reports, setReports] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [categoryFilter, setCategoryFilter] = useState('All');

  // Modals
  const [selectedReport, setSelectedReport] = useState(null);
  const [editingReport, setEditingReport] = useState(null);
  const [deletingReport, setDeletingReport] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Edit form states
  const [editStatus, setEditStatus] = useState('');
  const [editNotes, setEditNotes] = useState('');
  const [editVerified, setEditVerified] = useState(false);

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
    // Open direct download or trigger link
    const link = document.createElement('a');
    link.href = exportUrl;
    link.setAttribute('download', 'jalawatch_reports_export.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    addToast('Downloading official reports CSV...', 'info');
  };

  if (!isAuthenticated) return null;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      
      {/* Top Banner & Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-slate-900 text-white p-6 sm:p-8 rounded-3xl shadow-lg border border-slate-800">
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

        <div className="flex items-center gap-3">
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-xs shadow-md transition-colors"
          >
            <Download className="w-4 h-4" />
            <span>Export CSV</span>
          </button>
          <button
            onClick={() => { logout(); setActivePage('home'); }}
            className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-semibold border border-slate-700 transition-colors"
          >
            Log Out
          </button>
        </div>
      </div>

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
            <span className="text-2xl font-black text-brand-600 block font-['Outfit'] mt-1">
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
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
        <form onSubmit={handleSearchSubmit} className="w-full sm:w-72 relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
          <input
            type="text"
            placeholder="Search report ID, village, notes..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
        </form>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 rounded-xl border border-slate-200 focus:outline-none"
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
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="py-20 text-center space-y-2">
            <div className="w-8 h-8 border-3 border-brand-600 border-t-transparent rounded-full animate-spin mx-auto" />
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
                  <th className="py-3 px-4">Admin Notes</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {reports.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50/80 transition-colors">
                    
                    {/* ID */}
                    <td className="py-3.5 px-4 font-mono font-bold text-brand-700 whitespace-nowrap">
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
                            : 'bg-brand-100 text-brand-800'
                        }`}
                      >
                        {r.status}
                      </span>
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
                    <td className="py-3.5 px-4 text-right whitespace-nowrap space-x-1">
                      <button
                        onClick={() => setSelectedReport(r)}
                        className="p-1.5 rounded-lg text-slate-500 hover:text-brand-600 hover:bg-brand-50 transition-colors"
                        title="View Full Details"
                      >
                        <Eye className="w-4 h-4" />
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

      {/* Edit Status & Admin Notes Modal */}
      {editingReport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full p-6 border border-slate-200 space-y-5">
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
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-brand-500"
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
                  className="w-full p-3 rounded-xl border border-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-brand-500"
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
                  className="px-5 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold transition-colors shadow-sm disabled:opacity-50"
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
          <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full p-6 border border-slate-200 text-center space-y-4">
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
          <div className="bg-white rounded-2xl shadow-2xl max-w-xl w-full p-6 border border-slate-200 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <span className="font-mono font-bold text-brand-700">{selectedReport.id}</span>
              <button
                onClick={() => setSelectedReport(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-2 bg-slate-50 p-3 rounded-xl">
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
                  <img src={getPhotoUrl(selectedReport.photo_url)} alt="Proof" className="w-full rounded-xl max-h-64 object-cover border" loading="lazy" />
                </div>
              )}

              <div>
                <span className="font-bold text-slate-700 block mb-1">Internal Admin Notes:</span>
                <p className="p-3 rounded-xl bg-amber-50/50 border border-amber-200 text-amber-950">
                  {selectedReport.admin_notes || 'No administrative notes recorded yet.'}
                </p>
              </div>
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
