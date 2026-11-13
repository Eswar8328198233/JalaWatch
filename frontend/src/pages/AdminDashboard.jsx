import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, FileText, CheckCircle2, Clock, Trash2, Edit3, 
  Search, Download, ExternalLink, AlertTriangle, Eye, X, 
  MapPin, Calendar, User, Phone, Check, RefreshCw, AlertCircle,
  BarChart3, ShieldAlert, Printer, FlaskConical, History, Filter,
  Layers, Users, Lock, ChevronRight, UserPlus, Sparkles, Navigation,
  MessageSquare, Compass, Wind, Activity, ArrowUpDown
} from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { 
  getAdminReports, 
  updateAdminReportStatus, 
  updateAdminLabTest,
  updateAdminReportPriority,
  assignAdminReport,
  getAdminReportNotes,
  addAdminReportNote,
  getAdminLogs,
  deleteAdminReport,
  getStats,
  getExportUrl,
  getPhotoUrl,
  getHotspots,
  getDuplicateClusters,
  getAdminUsers,
  createAdminUser,
  updateAdminUserRole,
  changeAdminPassword
} from '../services/api';
import AdminAnalyticsCharts from '../components/AdminAnalyticsCharts';

// Custom Map Marker for Hotspots
const hotspotIcon = (priority, status) => {
  let color = '#0d9488'; // teal default
  if (priority === 'Urgent' || status === 'Under Review') color = '#dc2626'; // red
  else if (priority === 'High') color = '#ea580c'; // orange
  else if (status === 'Resolved') color = '#10b981'; // emerald

  return new L.DivIcon({
    className: 'custom-admin-pin',
    html: `<div style="background-color: ${color}; width: 26px; height: 26px; border-radius: 50% 50% 50% 0; transform: rotate(-45deg); border: 2.5px solid white; box-shadow: 0 3px 10px rgba(0,0,0,0.35); display: flex; align-items: center; justify-content: center;">
            <div style="width: 8px; height: 8px; background: white; border-radius: 50%; transform: rotate(45deg);"></div>
          </div>`,
    iconSize: [26, 26],
    iconAnchor: [13, 26],
    popupAnchor: [0, -26],
  });
};

export default function AdminDashboard({ setActivePage }) {
  const { token, admin, isAuthenticated, logout } = useAuth();
  const { addToast } = useToast();

  const [activeTab, setActiveTab] = useState('table'); // 'table' | 'analytics' | 'operations' | 'logs' | 'users'
  const [reports, setReports] = useState([]);
  const [stats, setStats] = useState(null);
  const [logs, setLogs] = useState([]);
  const [hotspots, setHotspots] = useState([]);
  const [duplicateClusters, setDuplicateClusters] = useState([]);
  const [usersList, setUsersList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [logsLoading, setLogsLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  // Filters & Sorting
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [villageFilter, setVillageFilter] = useState('All');
  const [priorityFilter, setPriorityFilter] = useState('All');
  const [assignedFilter, setAssignedFilter] = useState('All');
  const [sortBy, setSortBy] = useState('date_desc');

  // Modals
  const [inspectReport, setInspectReport] = useState(null);
  const [editingReport, setEditingReport] = useState(null);
  const [labTestingReport, setLabTestingReport] = useState(null);
  const [deletingReport, setDeletingReport] = useState(null);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showCreateUserModal, setShowCreateUserModal] = useState(false);

  // Follow-up notes in inspect modal
  const [reportNotes, setReportNotes] = useState([]);
  const [newNoteText, setNewNoteText] = useState('');
  const [notesLoading, setNotesLoading] = useState(false);

  // Edit status form
  const [editStatus, setEditStatus] = useState('');
  const [editNotes, setEditNotes] = useState('');
  const [editVerified, setEditVerified] = useState(false);

  // Lab test form
  const [labForm, setLabForm] = useState({
    ph: '',
    tds: '',
    fluoride: '',
    nitrate: '',
    e_coli: 'Absent',
    lab_name: 'RWS&S District Water Testing Laboratory, Guntur',
    report_reference_no: '',
    sample_collection_date: new Date().toISOString().slice(0, 10),
    testing_date: new Date().toISOString().slice(0, 10),
    lab_certificate_url: '',
    lab_notes: '',
    lab_status: 'Tested & Certified',
    is_verified: true
  });

  // Change password form
  const [passwordForm, setPasswordForm] = useState({
    current_password: '',
    new_password: '',
    confirm_password: ''
  });

  // Create user form
  const [createUserForm, setCreateUserForm] = useState({
    username: '',
    email: '',
    password: '',
    role: 'field_officer'
  });

  const isSuperAdmin = admin?.role === 'super_admin';
  const isOfficer = admin?.role === 'field_officer';

  useEffect(() => {
    if (!isAuthenticated) {
      setActivePage('admin-login');
      return;
    }
    loadDashboardData();
  }, [isAuthenticated, statusFilter, categoryFilter, villageFilter, priorityFilter, assignedFilter, sortBy]);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      const [reportsData, statsData] = await Promise.all([
        getAdminReports(token, {
          search,
          status: statusFilter,
          category: categoryFilter,
          village: villageFilter,
          priority: priorityFilter,
          assigned_to: assignedFilter,
          sort_by: sortBy
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

  const loadHotspotsAndOperations = async () => {
    try {
      const [hotspotData, dupData] = await Promise.all([
        getHotspots(),
        getDuplicateClusters(token)
      ]);
      setHotspots(hotspotData.hotspots || []);
      setDuplicateClusters(dupData.clusters || []);
    } catch (err) {
      console.error('Operations load error:', err);
    }
  };

  const loadUsersList = async () => {
    try {
      const data = await getAdminUsers(token);
      setUsersList(data.users || []);
    } catch (err) {
      console.error('Users load error:', err);
      addToast('Failed to load system users', 'error');
    }
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    if (tab === 'logs') loadAuditLogs();
    if (tab === 'operations' || tab === 'analytics') loadHotspotsAndOperations();
    if (tab === 'users') loadUsersList();
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    loadDashboardData();
  };

  const handleOpenInspect = async (report) => {
    setInspectReport(report);
    setNewNoteText('');
    setNotesLoading(true);
    try {
      const data = await getAdminReportNotes(token, report.id);
      setReportNotes(data.notes || []);
    } catch (err) {
      console.warn('Could not load follow-up notes:', err);
      setReportNotes([]);
    } finally {
      setNotesLoading(false);
    }
  };

  const handleAddNote = async (e) => {
    e.preventDefault();
    if (!newNoteText.trim() || !inspectReport) return;

    try {
      await addAdminReportNote(token, inspectReport.id, newNoteText.trim());
      addToast('Follow-up inspection note recorded.', 'success');
      setNewNoteText('');
      const data = await getAdminReportNotes(token, inspectReport.id);
      setReportNotes(data.notes || []);
    } catch (err) {
      addToast(err.message || 'Failed to add follow-up note', 'error');
    }
  };

  const handleUpdatePriority = async (reportId, priority) => {
    try {
      await updateAdminReportPriority(token, reportId, priority);
      addToast(`Priority updated to ${priority}.`, 'success');
      if (inspectReport && inspectReport.id === reportId) {
        setInspectReport(prev => ({ ...prev, priority }));
      }
      loadDashboardData();
    } catch (err) {
      addToast(err.message || 'Failed to update priority', 'error');
    }
  };

  const handleAssignOfficer = async (reportId, officer) => {
    try {
      await assignAdminReport(token, reportId, officer);
      addToast(`Report assigned to ${officer || 'Unassigned'}.`, 'success');
      if (inspectReport && inspectReport.id === reportId) {
        setInspectReport(prev => ({ ...prev, assigned_to: officer }));
      }
      loadDashboardData();
    } catch (err) {
      addToast(err.message || 'Failed to assign officer', 'error');
    }
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
      report_reference_no: report.report_reference_no || `RWS-GNT-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
      sample_collection_date: report.sample_collection_date || report.date_observed || new Date().toISOString().slice(0, 10),
      testing_date: report.testing_date || new Date().toISOString().slice(0, 10),
      lab_certificate_url: report.lab_certificate_url || '',
      lab_notes: report.lab_notes || 'Tested compliant with BIS IS 10500 standards.',
      lab_status: report.lab_status || 'Tested & Certified',
      is_verified: true
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
        report_reference_no: labForm.report_reference_no,
        sample_collection_date: labForm.sample_collection_date,
        testing_date: labForm.testing_date,
        lab_certificate_url: labForm.lab_certificate_url,
        lab_notes: labForm.lab_notes,
        lab_status: labForm.lab_status,
        is_verified: labForm.is_verified
      });
      addToast(`Laboratory verification recorded for ${labTestingReport.id}.`, 'success');
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

  const handleChangePasswordSubmit = async (e) => {
    e.preventDefault();
    if (passwordForm.new_password !== passwordForm.confirm_password) {
      addToast('New passwords do not match.', 'error');
      return;
    }
    if (passwordForm.new_password.length < 8) {
      addToast('New password must be at least 8 characters.', 'error');
      return;
    }

    setActionLoading(true);
    try {
      await changeAdminPassword(token, passwordForm.current_password, passwordForm.new_password);
      addToast('Password changed successfully!', 'success');
      setShowPasswordModal(false);
      setPasswordForm({ current_password: '', new_password: '', confirm_password: '' });
    } catch (err) {
      addToast(err.message || 'Failed to change password.', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCreateUserSubmit = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      await createAdminUser(token, createUserForm);
      addToast(`User ${createUserForm.username} created successfully!`, 'success');
      setShowCreateUserModal(false);
      setCreateUserForm({ username: '', email: '', password: '', role: 'field_officer' });
      loadUsersList();
    } catch (err) {
      addToast(err.message || 'Failed to create user.', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRoleChange = async (userId, newRole) => {
    try {
      await updateAdminUserRole(token, userId, newRole);
      addToast('User role updated successfully.', 'success');
      loadUsersList();
    } catch (err) {
      addToast(err.message || 'Failed to change user role.', 'error');
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
    addToast('Downloading official comprehensive reports CSV...', 'info');
  };

  const handlePrintSummary = () => {
    window.print();
  };

  const getPriorityBadge = (priority) => {
    switch (priority) {
      case 'Urgent':
        return <span className="px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 border border-rose-200 text-[10px] font-bold">Urgent</span>;
      case 'High':
        return <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-200 text-[10px] font-bold">High</span>;
      case 'Low':
        return <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200 text-[10px] font-bold">Low</span>;
      default:
        return <span className="px-2 py-0.5 rounded-full bg-teal-100 text-teal-800 border border-teal-200 text-[10px] font-bold">Medium</span>;
    }
  };

  if (!isAuthenticated) return null;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      
      {/* Top Banner & Control Center Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-slate-900 text-white p-6 sm:p-8 rounded-3xl shadow-lg border border-slate-800 print:hidden">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-500/20 border border-teal-500/30 text-teal-300 text-xs font-semibold">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>JalaWatch Portal Command Center</span>
            <span className="uppercase text-[10px] font-bold bg-teal-400 text-slate-950 px-1.5 py-0.2 rounded">
              {admin?.role || 'Admin'}
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold font-['Outfit']">
            Groundwater Submissions & Field Intelligence
          </h1>
          <p className="text-xs text-slate-400">
            Authenticated as <strong className="text-white">{admin?.username}</strong> ({admin?.email})
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setShowPasswordModal(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-colors"
            title="Change Account Password"
          >
            <Lock className="w-3.5 h-3.5 text-slate-400" />
            <span>Password</span>
          </button>
          <button
            onClick={handlePrintSummary}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-colors"
            title="Print Summary"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print</span>
          </button>
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-xs shadow-md transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>
          <button
            onClick={() => { logout(); setActivePage('home'); }}
            className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-rose-300 hover:text-white text-xs font-semibold border border-slate-700 transition-colors"
          >
            Log Out
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-3 overflow-x-auto print:hidden">
        <button
          onClick={() => handleTabChange('table')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 ${
            activeTab === 'table' ? 'bg-teal-700 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>Submissions Database ({reports.length})</span>
        </button>

        <button
          onClick={() => handleTabChange('analytics')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 ${
            activeTab === 'analytics' ? 'bg-teal-700 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <BarChart3 className="w-4 h-4" />
          <span>Analytics & Hotspot Map</span>
        </button>

        <button
          onClick={() => handleTabChange('operations')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 ${
            activeTab === 'operations' ? 'bg-teal-700 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Compass className="w-4 h-4" />
          <span>Field Operations & Duplicates</span>
        </button>

        <button
          onClick={() => handleTabChange('logs')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 ${
            activeTab === 'logs' ? 'bg-teal-700 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <History className="w-4 h-4" />
          <span>Audit Trail</span>
        </button>

        {isSuperAdmin && (
          <button
            onClick={() => handleTabChange('users')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 ${
              activeTab === 'users' ? 'bg-teal-700 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Admin & RBAC Users</span>
          </button>
        )}
      </div>

      {/* TAB 1: SUBMISSIONS TABLE & FILTERS */}
      {activeTab === 'table' && (
        <div className="space-y-6">
          {/* Quick Metrics Ribbon */}
          {stats && (
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
              <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-2xs">
                <span className="text-[10px] text-slate-400 font-semibold uppercase">Total Reports</span>
                <span className="text-xl font-black text-slate-900 block font-['Outfit']">{stats.total_reports}</span>
              </div>
              <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-2xs">
                <span className="text-[10px] text-slate-400 font-semibold uppercase">Pending</span>
                <span className="text-xl font-black text-amber-600 block font-['Outfit']">{stats.submitted}</span>
              </div>
              <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-2xs">
                <span className="text-[10px] text-slate-400 font-semibold uppercase">Under Review</span>
                <span className="text-xl font-black text-teal-600 block font-['Outfit']">{stats.under_review}</span>
              </div>
              <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-2xs">
                <span className="text-[10px] text-slate-400 font-semibold uppercase">Resolved</span>
                <span className="text-xl font-black text-emerald-600 block font-['Outfit']">{stats.resolved}</span>
              </div>
              <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-2xs">
                <span className="text-[10px] text-slate-400 font-semibold uppercase">Lab Verified</span>
                <span className="text-xl font-black text-teal-800 block font-['Outfit']">{stats.verified_reports || 0}</span>
              </div>
              <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-2xs">
                <span className="text-[10px] text-slate-400 font-semibold uppercase">Resolution Rate</span>
                <span className="text-xl font-black text-slate-900 block font-['Outfit']">{stats.resolution_rate}%</span>
              </div>
            </div>
          )}

          {/* Advanced Search & Filtering Bar */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
            <form onSubmit={handleSearchSubmit} className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search by Report ID, village, reporter name, landmark, description..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 text-xs focus:ring-1 focus:ring-teal-500 focus:outline-none"
                />
              </div>
              <button
                type="submit"
                className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold rounded-xl shadow-xs transition-colors shrink-0"
              >
                Search Submissions
              </button>
            </form>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 text-xs pt-1 border-t border-slate-100">
              {/* Status Filter */}
              <div>
                <label className="block text-[10px] font-semibold text-slate-400 mb-0.5">Status</label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full px-2 py-1.5 rounded-lg border border-slate-200 text-xs bg-slate-50 focus:bg-white"
                >
                  <option value="All">All Statuses</option>
                  <option value="Submitted">Submitted</option>
                  <option value="Under Review">Under Review</option>
                  <option value="Resolved">Resolved</option>
                  <option value="Archived">Archived</option>
                </select>
              </div>

              {/* Category Filter */}
              <div>
                <label className="block text-[10px] font-semibold text-slate-400 mb-0.5">Category</label>
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="w-full px-2 py-1.5 rounded-lg border border-slate-200 text-xs bg-slate-50 focus:bg-white"
                >
                  <option value="All">All Categories</option>
                  <option value="Unusual water colour">Unusual water colour</option>
                  <option value="Bad smell or taste">Bad smell or taste</option>
                  <option value="Suspected waste dumping">Suspected waste dumping</option>
                  <option value="Drainage problems">Drainage problems</option>
                  <option value="Leaking pipes">Leaking pipes</option>
                  <option value="Agricultural runoff">Agricultural runoff</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              {/* Village Filter */}
              <div>
                <label className="block text-[10px] font-semibold text-slate-400 mb-0.5">Locality</label>
                <select
                  value={villageFilter}
                  onChange={(e) => setVillageFilter(e.target.value)}
                  className="w-full px-2 py-1.5 rounded-lg border border-slate-200 text-xs bg-slate-50 focus:bg-white"
                >
                  <option value="All">All Localities</option>
                  <option value="Nutakki">Nutakki</option>
                  <option value="Tadepalli Rural">Tadepalli Rural</option>
                  <option value="Mangalagiri Rural">Mangalagiri Rural</option>
                  <option value="Kunchanapalli">Kunchanapalli</option>
                  <option value="Kolanukonda">Kolanukonda</option>
                  <option value="Vijayawada Rural">Vijayawada Rural</option>
                </select>
              </div>

              {/* Priority Filter */}
              <div>
                <label className="block text-[10px] font-semibold text-slate-400 mb-0.5">Priority</label>
                <select
                  value={priorityFilter}
                  onChange={(e) => setPriorityFilter(e.target.value)}
                  className="w-full px-2 py-1.5 rounded-lg border border-slate-200 text-xs bg-slate-50 focus:bg-white"
                >
                  <option value="All">All Priorities</option>
                  <option value="Urgent">Urgent</option>
                  <option value="High">High</option>
                  <option value="Medium">Medium</option>
                  <option value="Low">Low</option>
                </select>
              </div>

              {/* Assigned To Filter */}
              <div>
                <label className="block text-[10px] font-semibold text-slate-400 mb-0.5">Assigned Officer</label>
                <select
                  value={assignedFilter}
                  onChange={(e) => setAssignedFilter(e.target.value)}
                  className="w-full px-2 py-1.5 rounded-lg border border-slate-200 text-xs bg-slate-50 focus:bg-white"
                >
                  <option value="All">All Assigned</option>
                  <option value="Unassigned">Unassigned Only</option>
                </select>
              </div>

              {/* Sort By */}
              <div>
                <label className="block text-[10px] font-semibold text-slate-400 mb-0.5">Sort Order</label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="w-full px-2 py-1.5 rounded-lg border border-slate-200 text-xs bg-slate-50 focus:bg-white"
                >
                  <option value="date_desc">Newest First</option>
                  <option value="date_asc">Oldest First</option>
                  <option value="priority">Priority Order</option>
                  <option value="status">Status Order</option>
                </select>
              </div>
            </div>
          </div>

          {/* Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider text-[10px] border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4">Report ID</th>
                    <th className="py-3 px-4">Location</th>
                    <th className="py-3 px-4">Issue Category</th>
                    <th className="py-3 px-4">Priority</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Lab Verified</th>
                    <th className="py-3 px-4">Assigned To</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {loading ? (
                    <tr>
                      <td colSpan="8" className="py-12 text-center text-slate-400">
                        <div className="w-5 h-5 border-2 border-teal-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                        Loading community reports...
                      </td>
                    </tr>
                  ) : reports.length === 0 ? (
                    <tr>
                      <td colSpan="8" className="py-12 text-center text-slate-400">
                        No reports matching current search and filter criteria.
                      </td>
                    </tr>
                  ) : (
                    reports.map((r) => (
                      <tr key={r.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-3 px-4 font-mono font-bold text-teal-800 whitespace-nowrap">
                          {r.id}
                        </td>
                        <td className="py-3 px-4">
                          <span className="font-semibold text-slate-900 block">{r.village}</span>
                          <span className="text-[11px] text-slate-400 truncate block max-w-[180px]">
                            {r.landmark || r.district || 'Coordinates pinned'}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-slate-700">
                          {r.category}
                        </td>
                        <td className="py-3 px-4">
                          {getPriorityBadge(r.priority || 'Medium')}
                        </td>
                        <td className="py-3 px-4">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                            r.status === 'Resolved' ? 'bg-emerald-100 text-emerald-800' :
                            r.status === 'Under Review' ? 'bg-amber-100 text-amber-800' :
                            r.status === 'Archived' ? 'bg-slate-200 text-slate-700' :
                            'bg-teal-100 text-teal-800'
                          }`}>
                            {r.status}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          {r.is_verified ? (
                            <span className="inline-flex items-center gap-1 text-emerald-700 font-semibold text-[11px]">
                              <CheckCircle2 className="w-3.5 h-3.5" /> Certified
                            </span>
                          ) : (
                            <span className="text-slate-400 text-[11px]">Pending Lab</span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-slate-600 text-[11px]">
                          {r.assigned_to ? (
                            <span className="font-medium text-slate-800">{r.assigned_to}</span>
                          ) : (
                            <span className="text-slate-400 italic">Unassigned</span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-right whitespace-nowrap space-x-1">
                          <button
                            onClick={() => handleOpenInspect(r)}
                            className="p-1.5 rounded-lg bg-teal-50 hover:bg-teal-100 text-teal-800 transition-colors inline-block"
                            title="Inspect Full Report & Observations"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleOpenEdit(r)}
                            className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors inline-block"
                            title="Update Status & Remarks"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleOpenLabTest(r)}
                            className="p-1.5 rounded-lg bg-teal-50 hover:bg-teal-100 text-teal-700 transition-colors inline-block"
                            title="Certified Lab Verification"
                          >
                            <FlaskConical className="w-3.5 h-3.5" />
                          </button>
                          {!isOfficer && (
                            <button
                              onClick={() => setDeletingReport(r)}
                              className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 transition-colors inline-block"
                              title="Delete Report"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: ADVANCED ANALYTICS & HOTSPOTS MAP */}
      {activeTab === 'analytics' && (
        <div className="space-y-6">
          {/* Main Analytics Charts */}
          <AdminAnalyticsCharts stats={stats} />

          {/* Interactive Geographic Hotspots Map */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-soft space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-teal-600" />
                <h3 className="font-bold text-slate-900 text-sm font-['Outfit']">
                  Geographic Pollution Hotspots & Surveillance Map
                </h3>
              </div>
              <div className="flex items-center gap-2 text-[11px]">
                <span className="flex items-center gap-1 font-semibold text-rose-700">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-600 inline-block" /> Urgent / Under Review
                </span>
                <span className="flex items-center gap-1 font-semibold text-teal-700 ml-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-teal-600 inline-block" /> Active Observation
                </span>
                <span className="flex items-center gap-1 font-semibold text-emerald-700 ml-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 inline-block" /> Resolved
                </span>
              </div>
            </div>

            <div className="h-96 w-full rounded-2xl overflow-hidden border border-slate-200 shadow-inner">
              <MapContainer
                center={[16.4382, 80.6010]}
                zoom={14}
                scrollWheelZoom={false}
                className="h-full w-full"
              >
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                {hotspots.map((h) => (
                  <Marker
                    key={h.id}
                    position={[Number(h.latitude), Number(h.longitude)]}
                    icon={hotspotIcon(h.priority, h.status)}
                  >
                    <Popup>
                      <div className="text-xs p-1 space-y-1">
                        <strong className="text-teal-900">{h.id} • {h.village}</strong>
                        <p className="text-[11px] text-slate-600">{h.category}</p>
                        <div className="flex items-center gap-1">
                          {getPriorityBadge(h.priority)}
                          <span className="text-[10px] text-slate-500">{h.status}</span>
                        </div>
                      </div>
                    </Popup>
                  </Marker>
                ))}
              </MapContainer>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: FIELD OPERATIONS & DUPLICATE WARNINGS */}
      {activeTab === 'operations' && (
        <div className="space-y-6">
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-soft space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-500" />
                <h3 className="font-bold text-slate-900 text-sm font-['Outfit']">
                  Potential Duplicate Clusters (Within ~150 meters)
                </h3>
              </div>
              <span className="text-[11px] font-bold text-amber-800 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200">
                {duplicateClusters.length} Hotspot Cluster(s) Identified
              </span>
            </div>

            {duplicateClusters.length === 0 ? (
              <p className="text-xs text-slate-400 py-8 text-center">
                No duplicate or clustered reports detected within proximity bounds.
              </p>
            ) : (
              <div className="space-y-4">
                {duplicateClusters.map((cluster, idx) => (
                  <div key={idx} className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs text-slate-800 flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-teal-600" />
                        Cluster at {cluster.village} ({cluster.reports_count} reports within 150m)
                      </span>
                      <span className="text-[11px] font-mono text-slate-500">
                        {cluster.center_lat.toFixed(4)}° N, {cluster.center_lng.toFixed(4)}° E
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                      {cluster.reports.map((cr) => (
                        <div key={cr.id} className="p-3 bg-white rounded-xl border border-slate-200 text-xs space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="font-mono font-bold text-teal-800">{cr.id}</span>
                            <span className="text-[10px] text-slate-400">{cr.date_observed}</span>
                          </div>
                          <p className="text-slate-700 font-medium truncate">{cr.category}</p>
                          <p className="text-[11px] text-slate-500 truncate">{cr.landmark || 'No landmark specified'}</p>
                          <div className="pt-1 flex items-center justify-between">
                            <span className="text-[10px] text-teal-700 font-semibold">{cr.status}</span>
                            <button
                              onClick={() => {
                                const fullReport = reports.find(r => r.id === cr.id);
                                if (fullReport) handleOpenInspect(fullReport);
                              }}
                              className="text-[10px] text-teal-600 hover:text-teal-800 underline font-semibold"
                            >
                              Inspect
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 4: AUDIT TRAIL */}
      {activeTab === 'logs' && (
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-soft space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <History className="w-4 h-4 text-teal-600" />
              <h3 className="font-bold text-slate-900 text-sm font-['Outfit']">
                Administrative Security & Audit Logs
              </h3>
            </div>
            <button
              onClick={loadAuditLogs}
              disabled={logsLoading}
              className="flex items-center gap-1 text-xs text-teal-700 hover:text-teal-900 font-semibold"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${logsLoading ? 'animate-spin' : ''}`} />
              <span>Refresh Logs</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider text-[10px] border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-3">Timestamp (UTC)</th>
                  <th className="py-2.5 px-3">Admin</th>
                  <th className="py-2.5 px-3">Action</th>
                  <th className="py-2.5 px-3">Report ID</th>
                  <th className="py-2.5 px-3">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
                {logsLoading ? (
                  <tr>
                    <td colSpan="5" className="py-8 text-center text-slate-400 font-sans">
                      Loading audit logs...
                    </td>
                  </tr>
                ) : logs.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="py-8 text-center text-slate-400 font-sans">
                      No security audit records logged yet.
                    </td>
                  </tr>
                ) : (
                  logs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-50">
                      <td className="py-2.5 px-3 text-slate-500 whitespace-nowrap">
                        {log.timestamp.slice(0, 19).replace('T', ' ')}
                      </td>
                      <td className="py-2.5 px-3 font-sans font-semibold text-slate-800">
                        {log.username}
                      </td>
                      <td className="py-2.5 px-3">
                        <span className="px-1.5 py-0.5 rounded bg-teal-50 text-teal-800 text-[10px] font-bold border border-teal-200 font-sans">
                          {log.action}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-teal-700">
                        {log.report_id || '-'}
                      </td>
                      <td className="py-2.5 px-3 font-sans text-slate-600 max-w-md truncate" title={log.details}>
                        {log.details || '-'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 5: RBAC USERS MANAGEMENT (SUPER ADMIN) */}
      {activeTab === 'users' && isSuperAdmin && (
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-soft space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-teal-600" />
              <h3 className="font-bold text-slate-900 text-sm font-['Outfit']">
                Authorized Administrative Users & Field Officers
              </h3>
            </div>
            <button
              onClick={() => setShowCreateUserModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold shadow-xs"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Create User / Officer</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider text-[10px] border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-3">ID</th>
                  <th className="py-2.5 px-3">Username</th>
                  <th className="py-2.5 px-3">Email</th>
                  <th className="py-2.5 px-3">Role</th>
                  <th className="py-2.5 px-3">Last Login</th>
                  <th className="py-2.5 px-3 text-right">Role Controls</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {usersList.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50">
                    <td className="py-2.5 px-3 font-mono text-slate-400">{u.id}</td>
                    <td className="py-2.5 px-3 font-bold text-slate-900">{u.username}</td>
                    <td className="py-2.5 px-3 text-slate-600">{u.email}</td>
                    <td className="py-2.5 px-3">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        u.role === 'super_admin' ? 'bg-purple-100 text-purple-900' :
                        u.role === 'admin' ? 'bg-teal-100 text-teal-900' :
                        'bg-blue-100 text-blue-900'
                      }`}>
                        {u.role}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-slate-500 text-[11px]">
                      {u.last_login ? u.last_login.slice(0, 16).replace('T', ' ') : 'Never'}
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      {u.id !== Number(admin?.id) && (
                        <select
                          value={u.role}
                          onChange={(e) => handleRoleChange(u.id, e.target.value)}
                          className="px-2 py-1 rounded-lg border border-slate-200 text-xs bg-slate-50"
                        >
                          <option value="super_admin">Super Admin</option>
                          <option value="admin">Admin</option>
                          <option value="field_officer">Field Officer</option>
                        </select>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODAL 1: FULL REPORT INSPECTION & OBSERVATIONS */}
      {inspectReport && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-3xl w-full p-6 sm:p-8 space-y-6 max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <span className="font-mono text-lg font-black text-teal-800">{inspectReport.id}</span>
                {getPriorityBadge(inspectReport.priority)}
                <span className="text-xs text-slate-500">({inspectReport.status})</span>
              </div>
              <button
                onClick={() => setInspectReport(null)}
                className="p-1 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Location & Coordinates Section */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="space-y-1 bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                <span className="text-[10px] text-slate-400 font-bold uppercase">Geographic Location</span>
                <p className="font-bold text-slate-900 text-sm">{inspectReport.village}</p>
                <p className="text-slate-600">{inspectReport.landmark || 'No landmark specified'}</p>
                <p className="text-slate-400 text-[11px] font-mono">
                  {inspectReport.latitude && inspectReport.longitude 
                    ? `📍 ${Number(inspectReport.latitude).toFixed(6)}° N, ${Number(inspectReport.longitude).toFixed(6)}° E`
                    : 'Coordinates not logged'}
                </p>
              </div>

              <div className="space-y-1 bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                <span className="text-[10px] text-slate-400 font-bold uppercase">Investigation Assignment</span>
                <div className="flex items-center gap-2 pt-1">
                  <select
                    value={inspectReport.assigned_to || ''}
                    onChange={(e) => handleAssignOfficer(inspectReport.id, e.target.value)}
                    className="px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs font-semibold bg-white flex-1"
                  >
                    <option value="">Unassigned</option>
                    <option value="Field Officer Rao">Field Officer Rao</option>
                    <option value="Inspector Lakshmi">Inspector Lakshmi</option>
                    <option value="CSP Nutakki Team">CSP Nutakki Team</option>
                    <option value="RWS&S Assistant Engineer">RWS&S Assistant Engineer</option>
                  </select>
                </div>
                <div className="flex items-center gap-2 pt-2">
                  <span className="text-[10px] text-slate-500 font-medium">Priority:</span>
                  <select
                    value={inspectReport.priority || 'Medium'}
                    onChange={(e) => handleUpdatePriority(inspectReport.id, e.target.value)}
                    className="px-2 py-1 rounded-md border border-slate-300 text-xs font-semibold bg-white"
                  >
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                    <option value="Urgent">Urgent</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Field Survey Observations Breakdown */}
            <div className="p-4 bg-teal-50/50 rounded-2xl border border-teal-100 text-xs space-y-2">
              <span className="text-[10px] font-bold text-teal-800 uppercase tracking-wider block">
                Citizen & Environmental Field Observations
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                <div>
                  <span className="text-[10px] text-slate-400 block">Water Appearance</span>
                  <strong className="text-slate-800">{inspectReport.water_appearance || 'Not specified'}</strong>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block">Water Odor</span>
                  <strong className="text-slate-800">{inspectReport.water_smell || 'None'}</strong>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block">Water Usage</span>
                  <strong className="text-slate-800">{inspectReport.water_usage || 'Drinking'}</strong>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block">Duration of Issue</span>
                  <strong className="text-slate-800">{inspectReport.issue_duration || 'Not specified'}</strong>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block">Nearby Wastewater Source</span>
                  <strong className="text-slate-800">{inspectReport.nearby_wastewater || 'None specified'}</strong>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block">Distance to Wastewater</span>
                  <strong className="text-slate-800">{inspectReport.suspected_distance || 'Unknown'}</strong>
                </div>
              </div>
            </div>

            {/* Description & Photo */}
            <div className="space-y-2 text-xs">
              <span className="text-[10px] text-slate-400 font-bold uppercase block">Detailed Description</span>
              <p className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-slate-700 leading-relaxed">
                {inspectReport.description}
              </p>
            </div>

            {inspectReport.photo_url && (
              <div className="space-y-2 text-xs">
                <span className="text-[10px] text-slate-400 font-bold uppercase block">Attached Evidence Photo</span>
                <div className="max-w-xs rounded-xl overflow-hidden border border-slate-200">
                  <img
                    src={getPhotoUrl(inspectReport.photo_url)}
                    alt="Proof evidence"
                    className="w-full h-40 object-cover cursor-pointer hover:scale-102 transition-transform"
                    onClick={() => window.open(getPhotoUrl(inspectReport.photo_url), '_blank')}
                  />
                </div>
              </div>
            )}

            {/* Certified Lab Verification Metrics (if recorded) */}
            {inspectReport.is_verified && (
              <div className="p-4 bg-emerald-50/60 rounded-2xl border border-emerald-200 text-xs space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-emerald-900 uppercase tracking-wider flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Certified Laboratory Results
                  </span>
                  <span className="text-[10px] font-mono text-emerald-800">{inspectReport.report_reference_no || 'Ref Certified'}</span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <div className="bg-white p-2 rounded-lg border border-emerald-200">
                    <span className="text-[10px] text-slate-400 block">pH Level</span>
                    <strong className="text-slate-900 text-sm">{inspectReport.ph ?? 'N/A'}</strong>
                  </div>
                  <div className="bg-white p-2 rounded-lg border border-emerald-200">
                    <span className="text-[10px] text-slate-400 block">TDS (mg/L)</span>
                    <strong className="text-slate-900 text-sm">{inspectReport.tds ?? 'N/A'}</strong>
                  </div>
                  <div className="bg-white p-2 rounded-lg border border-emerald-200">
                    <span className="text-[10px] text-slate-400 block">Fluoride (mg/L)</span>
                    <strong className="text-slate-900 text-sm">{inspectReport.fluoride ?? 'N/A'}</strong>
                  </div>
                  <div className="bg-white p-2 rounded-lg border border-emerald-200">
                    <span className="text-[10px] text-slate-400 block">E. Coli</span>
                    <strong className="text-slate-900 text-sm">{inspectReport.e_coli || 'Absent'}</strong>
                  </div>
                </div>
                <p className="text-[11px] text-emerald-800 italic">{inspectReport.lab_name} ({inspectReport.testing_date})</p>
              </div>
            )}

            {/* Internal Follow-up Notes Thread */}
            <div className="space-y-3 pt-2 border-t border-slate-100 text-xs">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                <MessageSquare className="w-3.5 h-3.5 text-teal-600" />
                Internal Field Notes Thread ({reportNotes.length})
              </span>

              <div className="space-y-2 max-h-36 overflow-y-auto">
                {notesLoading ? (
                  <p className="text-slate-400 italic">Loading notes...</p>
                ) : reportNotes.length === 0 ? (
                  <p className="text-slate-400 italic">No internal follow-up notes logged yet.</p>
                ) : (
                  reportNotes.map((n) => (
                    <div key={n.id} className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-700 space-y-0.5">
                      <div className="flex items-center justify-between text-[10px] text-slate-400">
                        <strong className="text-slate-800">{n.officer_name}</strong>
                        <span>{n.created_at ? n.created_at.slice(0, 16).replace('T', ' ') : ''}</span>
                      </div>
                      <p className="text-xs">{n.note}</p>
                    </div>
                  ))
                )}
              </div>

              {/* Add Note Input */}
              <form onSubmit={handleAddNote} className="flex gap-2">
                <input
                  type="text"
                  placeholder="Add internal follow-up note (e.g. Sample collected at 10 AM)..."
                  value={newNoteText}
                  onChange={(e) => setNewNoteText(e.target.value)}
                  className="flex-1 px-3 py-2 rounded-xl border border-slate-200 text-xs focus:ring-1 focus:ring-teal-500 focus:outline-none"
                />
                <button
                  type="submit"
                  className="px-3.5 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl font-semibold text-xs transition-colors shrink-0"
                >
                  Post Note
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: UPDATE STATUS & REMARKS */}
      {editingReport && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
          <form onSubmit={handleSaveStatus} className="bg-white rounded-3xl max-w-lg w-full p-6 space-y-4 shadow-xl border border-slate-200">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-sm font-['Outfit']">
                Update Status: {editingReport.id}
              </h3>
              <button type="button" onClick={() => setEditingReport(null)}>
                <X className="w-4 h-4 text-slate-400" />
              </button>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Investigation Status</label>
              <select
                value={editStatus}
                onChange={(e) => setEditStatus(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-1 focus:ring-teal-500"
              >
                <option value="Submitted">Submitted</option>
                <option value="Under Review">Under Review</option>
                <option value="Resolved">Resolved</option>
                <option value="Archived">Archived</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Administrative Remarks</label>
              <textarea
                rows={3}
                placeholder="Remarks regarding action taken, department forwarded, or inspection results..."
                value={editNotes}
                onChange={(e) => setEditNotes(e.target.value)}
                className="w-full p-3 rounded-xl border border-slate-300 text-xs focus:ring-1 focus:ring-teal-500"
              />
            </div>

            <div className="pt-2 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setEditingReport(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={actionLoading}
                className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold shadow-xs"
              >
                {actionLoading ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* MODAL 3: CERTIFIED LAB TESTING METRICS */}
      {labTestingReport && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-fadeIn">
          <form onSubmit={handleSaveLabTest} className="bg-white rounded-3xl max-w-xl w-full p-6 space-y-4 shadow-xl border border-slate-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <FlaskConical className="w-4 h-4 text-teal-600" />
                <h3 className="font-bold text-slate-900 text-sm font-['Outfit']">
                  Certified Laboratory Verification: {labTestingReport.id}
                </h3>
              </div>
              <button type="button" onClick={() => setLabTestingReport(null)}>
                <X className="w-4 h-4 text-slate-400" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">pH Level (6.5 - 8.5 Safe)</label>
                <input
                  type="number"
                  step="0.1"
                  value={labForm.ph}
                  onChange={(e) => setLabForm({ ...labForm, ph: e.target.value })}
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-300 font-mono"
                  placeholder="7.2"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">TDS (mg/L) (&lt; 500 Safe)</label>
                <input
                  type="number"
                  step="any"
                  value={labForm.tds}
                  onChange={(e) => setLabForm({ ...labForm, tds: e.target.value })}
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-300 font-mono"
                  placeholder="480"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Fluoride (mg/L) (&lt; 1.5 Safe)</label>
                <input
                  type="number"
                  step="0.01"
                  value={labForm.fluoride}
                  onChange={(e) => setLabForm({ ...labForm, fluoride: e.target.value })}
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-300 font-mono"
                  placeholder="0.8"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Nitrate (mg/L) (&lt; 45 Safe)</label>
                <input
                  type="number"
                  step="0.1"
                  value={labForm.nitrate}
                  onChange={(e) => setLabForm({ ...labForm, nitrate: e.target.value })}
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-300 font-mono"
                  placeholder="15.0"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">E. Coli / Coliform</label>
                <select
                  value={labForm.e_coli}
                  onChange={(e) => setLabForm({ ...labForm, e_coli: e.target.value })}
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-300"
                >
                  <option value="Absent">Absent (Bacteriologically Safe)</option>
                  <option value="Present (Detected)">Present (Contaminated)</option>
                </select>
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Lab Reference Certificate No.</label>
                <input
                  type="text"
                  value={labForm.report_reference_no}
                  onChange={(e) => setLabForm({ ...labForm, report_reference_no: e.target.value })}
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-300 font-mono"
                  placeholder="RWS-GNT-2026-904"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Sample Collection Date</label>
                <input
                  type="date"
                  value={labForm.sample_collection_date}
                  onChange={(e) => setLabForm({ ...labForm, sample_collection_date: e.target.value })}
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-300"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Lab Testing Date</label>
                <input
                  type="date"
                  value={labForm.testing_date}
                  onChange={(e) => setLabForm({ ...labForm, testing_date: e.target.value })}
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-300"
                />
              </div>
            </div>

            <div className="text-xs">
              <label className="block font-semibold text-slate-700 mb-1">Accredited Testing Laboratory Name</label>
              <input
                type="text"
                value={labForm.lab_name}
                onChange={(e) => setLabForm({ ...labForm, lab_name: e.target.value })}
                className="w-full px-3 py-1.5 rounded-lg border border-slate-300"
              />
            </div>

            <div className="text-xs">
              <label className="block font-semibold text-slate-700 mb-1">Lab Notes & BIS IS 10500 Compliance Remarks</label>
              <textarea
                rows={2}
                value={labForm.lab_notes}
                onChange={(e) => setLabForm({ ...labForm, lab_notes: e.target.value })}
                className="w-full p-2.5 rounded-lg border border-slate-300"
              />
            </div>

            <div className="pt-2 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setLabTestingReport(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={actionLoading}
                className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold shadow-xs"
              >
                {actionLoading ? 'Saving...' : 'Record Certified Results'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* MODAL 4: CHANGE PASSWORD */}
      {showPasswordModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
          <form onSubmit={handleChangePasswordSubmit} className="bg-white rounded-3xl max-w-sm w-full p-6 space-y-4 shadow-xl border border-slate-200">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-sm font-['Outfit']">Change Password</h3>
              <button type="button" onClick={() => setShowPasswordModal(false)}>
                <X className="w-4 h-4 text-slate-400" />
              </button>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Current Password</label>
              <input
                type="password"
                required
                value={passwordForm.current_password}
                onChange={(e) => setPasswordForm({ ...passwordForm, current_password: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">New Password (min 8 chars)</label>
              <input
                type="password"
                required
                minLength={8}
                value={passwordForm.new_password}
                onChange={(e) => setPasswordForm({ ...passwordForm, new_password: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Confirm New Password</label>
              <input
                type="password"
                required
                minLength={8}
                value={passwordForm.confirm_password}
                onChange={(e) => setPasswordForm({ ...passwordForm, confirm_password: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
              />
            </div>

            <div className="pt-2 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowPasswordModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={actionLoading}
                className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold shadow-xs"
              >
                {actionLoading ? 'Updating...' : 'Update Password'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* MODAL 5: CREATE USER / OFFICER (SUPER ADMIN) */}
      {showCreateUserModal && isSuperAdmin && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
          <form onSubmit={handleCreateUserSubmit} className="bg-white rounded-3xl max-w-sm w-full p-6 space-y-4 shadow-xl border border-slate-200">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-sm font-['Outfit']">Create New User / Officer</h3>
              <button type="button" onClick={() => setShowCreateUserModal(false)}>
                <X className="w-4 h-4 text-slate-400" />
              </button>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Username</label>
              <input
                type="text"
                required
                value={createUserForm.username}
                onChange={(e) => setCreateUserForm({ ...createUserForm, username: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
                placeholder="officer_rao"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Email</label>
              <input
                type="email"
                required
                value={createUserForm.email}
                onChange={(e) => setCreateUserForm({ ...createUserForm, email: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
                placeholder="officer@jalawatch.org"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Temporary Password (min 8 chars)</label>
              <input
                type="password"
                required
                minLength={8}
                value={createUserForm.password}
                onChange={(e) => setCreateUserForm({ ...createUserForm, password: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">RBAC Role</label>
              <select
                value={createUserForm.role}
                onChange={(e) => setCreateUserForm({ ...createUserForm, role: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
              >
                <option value="field_officer">Field Officer</option>
                <option value="admin">Admin</option>
                <option value="super_admin">Super Admin</option>
              </select>
            </div>

            <div className="pt-2 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowCreateUserModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={actionLoading}
                className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold shadow-xs"
              >
                {actionLoading ? 'Creating...' : 'Create Account'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* MODAL 6: CONFIRM DELETION */}
      {deletingReport && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 space-y-4 shadow-xl border border-slate-200">
            <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <div className="text-center space-y-1">
              <h4 className="font-bold text-slate-900 text-base">Permanently Delete Report?</h4>
              <p className="text-xs text-slate-500 leading-relaxed">
                Are you sure you want to delete report <strong className="text-slate-800">{deletingReport.id}</strong> ({deletingReport.village})? This action cannot be undone.
              </p>
            </div>

            <div className="pt-2 flex items-center justify-center gap-2">
              <button
                onClick={() => setDeletingReport(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold flex-1"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDelete}
                disabled={actionLoading}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold flex-1 shadow-xs"
              >
                {actionLoading ? 'Deleting...' : 'Delete Permanently'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
