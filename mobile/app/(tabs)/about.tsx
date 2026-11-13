import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Linking,
  Platform,
  ActivityIndicator,
  Modal,
  Share,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Info,
  Server,
  ShieldAlert,
  Users,
  ExternalLink,
  CheckCircle,
  RefreshCw,
  Globe,
  Smartphone,
  BookOpen,
  MapPin,
  Lock,
  Unlock,
  UserCheck,
  Edit3,
  Save,
  LogOut,
  X,
  Clock,
  Droplets,
  Check,
  ChevronRight,
  Download,
  AlertTriangle,
  FileText,
  Layers,
  Key,
  Trash2,
  Share2,
  Sparkles,
} from 'lucide-react-native';
import { Colors, Shadows } from '../../constants/theme';
import {
  getApiBaseUrl,
  setApiBaseUrl,
  testEndpoint,
  adminLogin,
  adminGetMe,
  adminGetReports,
  adminUpdateReportStatus,
  adminUpdatePriority,
  adminAssignReport,
  adminGetNotes,
  adminAddNote,
  adminUpdateLabTest,
  adminDeleteReport,
  adminGetUsers,
  adminCreateUser,
  adminUpdateUserRole,
  adminChangePassword,
  adminGetHotspots,
  adminGetDuplicateClusters,
  adminGetLogs,
  adminExportCsv,
  AdminUser,
  AdminReport,
  ReportFollowupNote,
  AdminActivityLog,
  getFullPhotoUrl,
} from '../../services/api';
import {
  saveAuthSession,
  getAuthToken,
  getAuthUser,
  clearAuthSession,
} from '../../services/authStorage';
import {
  translations,
  LanguageCode,
  getSavedLanguage,
  saveLanguage,
} from '../../constants/translations';

export default function AboutScreen() {
  const [currentLang, setCurrentLang] = useState<LanguageCode>('en');
  const t = translations[currentLang];

  // Server Health State
  const [serverStatus, setServerStatus] = useState<'checking' | 'online' | 'offline'>('checking');
  const [serverPingTime, setServerPingTime] = useState<number | null>(null);
  const [activeUrl, setActiveUrl] = useState(getApiBaseUrl());

  // Admin Auth State
  const [adminToken, setAdminToken] = useState<string | null>(null);
  const [adminUser, setAdminUser] = useState<AdminUser | null>(null);
  const [adminUsername, setAdminUsername] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [adminLoggingIn, setAdminLoggingIn] = useState(false);
  const [adminError, setAdminError] = useState<string | null>(null);

  // Admin Portal Sub-View
  const [adminTab, setAdminTab] = useState<'submissions' | 'hotspots' | 'logs' | 'users'>('submissions');
  const [adminReports, setAdminReports] = useState<AdminReport[]>([]);
  const [adminLoadingReports, setAdminLoadingReports] = useState(false);
  const [adminFilterStatus, setAdminFilterStatus] = useState('All');
  const [adminFilterPriority, setAdminFilterPriority] = useState('All');
  const [adminSearch, setAdminSearch] = useState('');

  // Report Inspection Modal
  const [inspectingReport, setInspectingReport] = useState<AdminReport | null>(null);
  const [followupNotes, setFollowupNotes] = useState<ReportFollowupNote[]>([]);
  const [newNoteText, setNewNoteText] = useState('');
  const [addingNote, setAddingNote] = useState(false);

  // Lab Testing Modal
  const [showLabModal, setShowLabModal] = useState(false);
  const [labPh, setLabPh] = useState('');
  const [labTds, setLabTds] = useState('');
  const [labFluoride, setLabFluoride] = useState('');
  const [labNitrate, setLabNitrate] = useState('');
  const [labEColi, setLabEColi] = useState('Absent (Safe)');
  const [labName, setLabName] = useState('RWS&S District Water Quality Lab, Guntur');
  const [labRefNo, setLabRefNo] = useState('');
  const [labCollectionDate, setLabCollectionDate] = useState('');
  const [labTestingDate, setLabTestingDate] = useState(new Date().toISOString().split('T')[0]);
  const [savingLab, setSavingLab] = useState(false);

  // User Management State (Super Admin)
  const [usersList, setUsersList] = useState<AdminUser[]>([]);
  const [newUsername, setNewUsername] = useState('');
  const [newUserPassword, setNewUserPassword] = useState('');
  const [newUserRole, setNewUserRole] = useState<'admin' | 'field_officer'>('field_officer');
  const [creatingUser, setCreatingUser] = useState(false);

  // Duplicate clusters
  const [duplicateClusters, setDuplicateClusters] = useState<any[]>([]);

  // Logs
  const [activityLogs, setActivityLogs] = useState<AdminActivityLog[]>([]);

  // Password Change Modal
  const [showPwdModal, setShowPwdModal] = useState(false);
  const [currentPwd, setCurrentPwd] = useState('');
  const [newPwd, setNewPwd] = useState('');
  const [changingPwd, setChangingPwd] = useState(false);

  // Check health
  const checkHealth = useCallback(async () => {
    setServerStatus('checking');
    const start = Date.now();
    try {
      const res = await testEndpoint(getApiBaseUrl());
      if (res.ok) {
        setServerStatus('online');
        setServerPingTime(Date.now() - start);
      } else {
        setServerStatus('offline');
      }
    } catch {
      setServerStatus('offline');
    }
  }, []);

  // Restore secure session on mount
  useEffect(() => {
    checkHealth();
    getSavedLanguage().then((l) => setCurrentLang(l));

    (async () => {
      const token = await getAuthToken();
      const user = await getAuthUser();
      if (token && user) {
        try {
          const verifiedUser = await adminGetMe(token);
          setAdminToken(token);
          setAdminUser(verifiedUser);
        } catch {
          await clearAuthSession();
        }
      }
    })();
  }, [checkHealth]);

  // Load admin data when token changes
  useEffect(() => {
    if (adminToken) {
      loadAdminReports();
      loadDuplicateClusters();
      loadActivityLogs();
      if (adminUser?.role === 'super_admin') {
        loadUsers();
      }
    }
  }, [adminToken, adminFilterStatus, adminFilterPriority, adminSearch]);

  const loadAdminReports = async () => {
    if (!adminToken) return;
    setAdminLoadingReports(true);
    try {
      const data = await adminGetReports(adminToken, {
        status: adminFilterStatus,
        priority: adminFilterPriority,
        search: adminSearch,
      });
      setAdminReports(data);
    } catch (err: any) {
      console.warn('Failed to load admin reports:', err.message);
    } finally {
      setAdminLoadingReports(false);
    }
  };

  const loadDuplicateClusters = async () => {
    if (!adminToken) return;
    try {
      const clusters = await adminGetDuplicateClusters(adminToken);
      setDuplicateClusters(clusters);
    } catch (err) {
      console.warn('Failed to load clusters:', err);
    }
  };

  const loadActivityLogs = async () => {
    if (!adminToken) return;
    try {
      const logs = await adminGetLogs(adminToken, { limit: 30 });
      setActivityLogs(logs);
    } catch (err) {
      console.warn('Failed to load logs:', err);
    }
  };

  const loadUsers = async () => {
    if (!adminToken) return;
    try {
      const users = await adminGetUsers(adminToken);
      setUsersList(users);
    } catch (err) {
      console.warn('Failed to load users:', err);
    }
  };

  const handleLogin = async () => {
    if (!adminUsername.trim() || !adminPassword.trim()) {
      setAdminError('Please enter both username and password.');
      return;
    }
    setAdminLoggingIn(true);
    setAdminError(null);
    try {
      const res = await adminLogin(adminUsername.trim(), adminPassword.trim());
      setAdminToken(res.token);
      setAdminUser(res.admin);
      await saveAuthSession(res.token, res.admin);
      setAdminPassword('');
      Alert.alert('Login Successful', `Welcome, ${res.admin.username} (${res.admin.role}).`);
    } catch (err: any) {
      setAdminError(err.message || 'Login failed. Please check credentials.');
    } finally {
      setAdminLoggingIn(false);
    }
  };

  const handleLogout = async () => {
    await clearAuthSession();
    setAdminToken(null);
    setAdminUser(null);
    setInspectingReport(null);
  };

  const handleInspect = async (report: AdminReport) => {
    setInspectingReport(report);
    if (adminToken) {
      try {
        const notes = await adminGetNotes(adminToken, report.id);
        setFollowupNotes(notes);
      } catch {
        setFollowupNotes([]);
      }
    }
  };

  const handleAddFollowupNote = async () => {
    if (!newNoteText.trim() || !adminToken || !inspectingReport) return;
    setAddingNote(true);
    try {
      const note = await adminAddNote(adminToken, inspectingReport.id, newNoteText.trim());
      setFollowupNotes([note, ...followupNotes]);
      setNewNoteText('');
      loadActivityLogs();
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to add note');
    } finally {
      setAddingNote(false);
    }
  };

  const handleUpdateStatus = async (status: string) => {
    if (!adminToken || !inspectingReport) return;
    try {
      const updated = await adminUpdateReportStatus(adminToken, inspectingReport.id, { status });
      setInspectingReport({ ...inspectingReport, ...updated });
      loadAdminReports();
      loadActivityLogs();
      Alert.alert('Status Updated', `Report ${inspectingReport.id} marked as ${status}.`);
    } catch (err: any) {
      Alert.alert('Update Failed', err.message);
    }
  };

  const handleUpdatePriority = async (priority: string) => {
    if (!adminToken || !inspectingReport) return;
    try {
      const updated = await adminUpdatePriority(adminToken, inspectingReport.id, priority);
      setInspectingReport({ ...inspectingReport, ...updated });
      loadAdminReports();
      loadActivityLogs();
      Alert.alert('Priority Updated', `Priority set to ${priority}.`);
    } catch (err: any) {
      Alert.alert('Update Failed', err.message);
    }
  };

  const handleAssignOfficer = () => {
    if (!adminToken || !inspectingReport) return;
    Alert.prompt
      ? Alert.prompt('Assign Officer', 'Enter name of field inspector:', async (officerName) => {
          if (!officerName) return;
          try {
            const updated = await adminAssignReport(adminToken, inspectingReport.id, officerName);
            setInspectingReport({ ...inspectingReport, ...updated });
            loadAdminReports();
            loadActivityLogs();
          } catch (e: any) {
            Alert.alert('Assignment Failed', e.message);
          }
        })
      : null;
  };

  const handleSaveLabTest = async () => {
    if (!adminToken || !inspectingReport) return;
    setSavingLab(true);
    try {
      const updated = await adminUpdateLabTest(adminToken, inspectingReport.id, {
        ph: labPh ? parseFloat(labPh) : null,
        tds: labTds ? parseFloat(labTds) : null,
        fluoride: labFluoride ? parseFloat(labFluoride) : null,
        nitrate: labNitrate ? parseFloat(labNitrate) : null,
        e_coli: labEColi,
        lab_name: labName,
        report_reference_no: labRefNo.trim() || undefined,
        sample_collection_date: labCollectionDate.trim() || undefined,
        testing_date: labTestingDate,
        lab_status: 'Tested & Certified',
        is_verified: true,
      });

      setInspectingReport({ ...inspectingReport, ...updated });
      setShowLabModal(false);
      loadAdminReports();
      loadActivityLogs();
      Alert.alert('Lab Results Certified', 'Certified laboratory testing results saved.');
    } catch (err: any) {
      Alert.alert('Save Failed', err.message);
    } finally {
      setSavingLab(false);
    }
  };

  const handleDeleteReport = async (reportId: string) => {
    if (!adminToken) return;
    Alert.alert(
      'Confirm Deletion',
      `Permanently delete report ${reportId}? This action is irreversible.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete Permanently',
          style: 'destructive',
          onPress: async () => {
            try {
              await adminDeleteReport(adminToken, reportId);
              setInspectingReport(null);
              loadAdminReports();
              loadActivityLogs();
              Alert.alert('Deleted', `Report ${reportId} has been removed.`);
            } catch (err: any) {
              Alert.alert('Delete Failed', err.message);
            }
          },
        },
      ]
    );
  };

  const handleExportCsv = async () => {
    if (!adminToken) return;
    try {
      const csvData = await adminExportCsv(adminToken);
      await Share.share({
        title: 'JalaWatch_Reports_Export.csv',
        message: csvData,
      });
    } catch (err: any) {
      Alert.alert('Export Failed', err.message);
    }
  };

  const handleChangePassword = async () => {
    if (!adminToken || !currentPwd || !newPwd) return;
    setChangingPwd(true);
    try {
      await adminChangePassword(adminToken, currentPwd, newPwd);
      setShowPwdModal(false);
      setCurrentPwd('');
      setNewPwd('');
      Alert.alert('Success', 'Admin password changed successfully.');
    } catch (err: any) {
      Alert.alert('Password Change Failed', err.message);
    } finally {
      setChangingPwd(false);
    }
  };

  const handleCreateUser = async () => {
    if (!adminToken || !newUsername.trim() || !newUserPassword.trim()) {
      Alert.alert('Validation', 'Username and password required.');
      return;
    }
    setCreatingUser(true);
    try {
      await adminCreateUser(adminToken, {
        username: newUsername.trim(),
        password: newUserPassword.trim(),
        role: newUserRole,
      });
      setNewUsername('');
      setNewUserPassword('');
      loadUsers();
      Alert.alert('User Created', `Account created with role ${newUserRole}.`);
    } catch (err: any) {
      Alert.alert('Error', err.message);
    } finally {
      setCreatingUser(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      {/* Top Header */}
      <View style={styles.header}>
        <View style={styles.headerTitleGroup}>
          <Text style={styles.headerTitle}>{t.tab_about}</Text>
          <View style={styles.cspBadge}>
            <Text style={styles.cspBadgeText}>CSP 2026</Text>
          </View>
        </View>

        <TouchableOpacity
          style={styles.langPill}
          onPress={async () => {
            const nextLang = currentLang === 'en' ? 'te' : 'en';
            setCurrentLang(nextLang);
            await saveLanguage(nextLang);
          }}
          activeOpacity={0.8}
        >
          <Globe size={13} color={Colors.primary} />
          <Text style={styles.langPillText}>{t.lang_toggle}</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        {/* SECTION 1: SERVER & CLOUD ENGINE STATUS */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Server size={18} color={Colors.primary} />
            <Text style={styles.cardTitle}>Cloud Backend Health</Text>
          </View>

          <View style={styles.serverStatusRow}>
            <View
              style={[
                styles.statusDot,
                serverStatus === 'online'
                  ? { backgroundColor: Colors.success }
                  : serverStatus === 'checking'
                  ? { backgroundColor: Colors.warning }
                  : { backgroundColor: Colors.danger },
              ]}
            />
            <Text style={styles.serverStatusText}>
              {serverStatus === 'online'
                ? `Operational (${serverPingTime} ms)`
                : serverStatus === 'checking'
                ? 'Pinging server...'
                : 'Offline / Sleeping'}
            </Text>
            <TouchableOpacity onPress={checkHealth} style={{ marginLeft: 'auto' }}>
              <RefreshCw size={14} color={Colors.primary} />
            </TouchableOpacity>
          </View>

          <Text style={styles.activeUrlText} numberOfLines={1}>
            Endpoint: {activeUrl}
          </Text>
        </View>

        {/* SECTION 2: ADMINISTRATIVE & FIELD PORTAL */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Lock size={18} color={Colors.navy} />
            <Text style={styles.cardTitle}>{t.admin_title}</Text>
          </View>

          {!adminToken ? (
            /* Login Form */
            <View style={styles.loginForm}>
              <Text style={styles.loginDesc}>{t.admin_login_desc}</Text>

              {adminError && (
                <View style={styles.errorBox}>
                  <AlertTriangle size={14} color={Colors.danger} />
                  <Text style={styles.errorBoxText}>{adminError}</Text>
                </View>
              )}

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>{t.admin_username}</Text>
                <TextInput
                  style={styles.textInput}
                  value={adminUsername}
                  onChangeText={setAdminUsername}
                  placeholder="admin"
                  placeholderTextColor={Colors.slate400}
                  autoCapitalize="none"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>{t.admin_password}</Text>
                <TextInput
                  style={styles.textInput}
                  value={adminPassword}
                  onChangeText={setAdminPassword}
                  placeholder="••••••••••••"
                  placeholderTextColor={Colors.slate400}
                  secureTextEntry
                />
              </View>

              <TouchableOpacity
                style={[styles.loginBtn, adminLoggingIn && { opacity: 0.7 }]}
                onPress={handleLogin}
                disabled={adminLoggingIn}
                activeOpacity={0.8}
              >
                {adminLoggingIn ? (
                  <ActivityIndicator size="small" color="#ffffff" />
                ) : (
                  <Unlock size={16} color="#ffffff" />
                )}
                <Text style={styles.loginBtnText}>{t.btn_login}</Text>
              </TouchableOpacity>
            </View>
          ) : (
            /* Authenticated Admin Dashboard */
            <View>
              {/* Officer Profile Bar */}
              <View style={styles.profileBar}>
                <View style={styles.profileInfo}>
                  <UserCheck size={18} color={Colors.primary} />
                  <View>
                    <Text style={styles.profileName}>{adminUser?.username}</Text>
                    <Text style={styles.profileRole}>
                      Role: {adminUser?.role === 'super_admin' ? t.admin_role_super : adminUser?.role === 'admin' ? t.admin_role_admin : t.admin_role_officer}
                    </Text>
                  </View>
                </View>

                <View style={styles.profileActions}>
                  <TouchableOpacity
                    style={styles.actionIconBtn}
                    onPress={() => setShowPwdModal(true)}
                  >
                    <Key size={14} color={Colors.navy} />
                  </TouchableOpacity>

                  <TouchableOpacity style={styles.actionIconBtn} onPress={handleExportCsv}>
                    <Download size={14} color={Colors.primary} />
                  </TouchableOpacity>

                  <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
                    <LogOut size={14} color={Colors.danger} />
                  </TouchableOpacity>
                </View>
              </View>

              {/* Admin Navigation Sub-Tabs */}
              <View style={styles.adminNavTabs}>
                <TouchableOpacity
                  style={[styles.adminNavTab, adminTab === 'submissions' && styles.adminNavTabActive]}
                  onPress={() => setAdminTab('submissions')}
                >
                  <Text style={[styles.adminNavTabText, adminTab === 'submissions' && styles.adminNavTabTextActive]}>
                    {t.tab_admin_submissions}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.adminNavTab, adminTab === 'hotspots' && styles.adminNavTabActive]}
                  onPress={() => setAdminTab('hotspots')}
                >
                  <Text style={[styles.adminNavTabText, adminTab === 'hotspots' && styles.adminNavTabTextActive]}>
                    Clusters ({duplicateClusters.length})
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.adminNavTab, adminTab === 'logs' && styles.adminNavTabActive]}
                  onPress={() => setAdminTab('logs')}
                >
                  <Text style={[styles.adminNavTabText, adminTab === 'logs' && styles.adminNavTabTextActive]}>
                    {t.tab_admin_logs}
                  </Text>
                </TouchableOpacity>

                {adminUser?.role === 'super_admin' && (
                  <TouchableOpacity
                    style={[styles.adminNavTab, adminTab === 'users' && styles.adminNavTabActive]}
                    onPress={() => setAdminTab('users')}
                  >
                    <Text style={[styles.adminNavTabText, adminTab === 'users' && styles.adminNavTabTextActive]}>
                      {t.tab_admin_users}
                    </Text>
                  </TouchableOpacity>
                )}
              </View>

              {/* TAB 1: SUBMISSIONS MANAGEMENT */}
              {adminTab === 'submissions' && (
                <View style={styles.tabContent}>
                  {/* Search and Filters */}
                  <View style={styles.adminFilterRow}>
                    <TextInput
                      style={styles.adminSearchInput}
                      value={adminSearch}
                      onChangeText={setAdminSearch}
                      placeholder="Search ID, village, reporter..."
                      placeholderTextColor={Colors.slate400}
                    />
                  </View>

                  {adminLoadingReports ? (
                    <ActivityIndicator size="small" color={Colors.primary} style={{ marginVertical: 20 }} />
                  ) : (
                    adminReports.map((item) => (
                      <TouchableOpacity
                        key={item.id}
                        style={styles.adminReportCard}
                        onPress={() => handleInspect(item)}
                        activeOpacity={0.8}
                      >
                        <View style={styles.adminCardHeader}>
                          <Text style={styles.adminReportId}>{item.id}</Text>
                          <View
                            style={[
                              styles.adminStatusPill,
                              item.status === 'Resolved'
                                ? { backgroundColor: Colors.successBg }
                                : item.status === 'Under Review'
                                ? { backgroundColor: Colors.warningBg }
                                : { backgroundColor: Colors.primaryBg },
                            ]}
                          >
                            <Text
                              style={[
                                styles.adminStatusText,
                                item.status === 'Resolved'
                                  ? { color: Colors.success }
                                  : item.status === 'Under Review'
                                  ? { color: Colors.warning }
                                  : { color: Colors.primary },
                              ]}
                            >
                              {item.status}
                            </Text>
                          </View>
                        </View>

                        <Text style={styles.adminCategoryText}>{item.category}</Text>
                        <Text style={styles.adminVillageText}>📍 {item.village} • {item.date_observed}</Text>

                        {item.assigned_to && (
                          <Text style={styles.adminAssignedText}>👤 Assigned: {item.assigned_to}</Text>
                        )}
                      </TouchableOpacity>
                    ))
                  )}
                </View>
              )}

              {/* TAB 2: CLUSTERS & HOTSPOTS */}
              {adminTab === 'hotspots' && (
                <View style={styles.tabContent}>
                  <Text style={styles.tabHeaderDesc}>
                    Duplicate incidents reported within 150 meters of each other:
                  </Text>
                  {duplicateClusters.length === 0 ? (
                    <Text style={styles.emptyNoticeText}>No duplicate clusters detected within 150m.</Text>
                  ) : (
                    duplicateClusters.map((cluster, idx) => (
                      <View key={idx} style={styles.clusterCard}>
                        <View style={styles.clusterHeader}>
                          <AlertTriangle size={15} color={Colors.warning} />
                          <Text style={styles.clusterTitle}>
                            Cluster #{idx + 1} ({cluster.count} reports)
                          </Text>
                        </View>
                        <Text style={styles.clusterDistance}>
                          Separation: ~{cluster.distance_meters} meters
                        </Text>
                        <Text style={styles.clusterIds}>
                          IDs: {cluster.reports.map((r: any) => r.id).join(', ')}
                        </Text>
                      </View>
                    ))
                  )}
                </View>
              )}

              {/* TAB 3: AUDIT TRAIL */}
              {adminTab === 'logs' && (
                <View style={styles.tabContent}>
                  {activityLogs.map((log) => (
                    <View key={log.id} style={styles.logCard}>
                      <View style={styles.logHeader}>
                        <Text style={styles.logAction}>{log.action}</Text>
                        <Text style={styles.logTime}>{log.timestamp.slice(0, 16)}</Text>
                      </View>
                      <Text style={styles.logDetails}>
                        By: <Text style={styles.bold}>{log.username}</Text> {log.report_id ? `• ${log.report_id}` : ''}
                      </Text>
                      {log.details && <Text style={styles.logSubDetails}>{log.details}</Text>}
                    </View>
                  ))}
                </View>
              )}

              {/* TAB 4: USERS MANAGEMENT (SUPER ADMIN) */}
              {adminTab === 'users' && adminUser?.role === 'super_admin' && (
                <View style={styles.tabContent}>
                  {/* Create New User */}
                  <View style={styles.createUserBox}>
                    <Text style={styles.createBoxTitle}>Add Staff Account</Text>
                    <TextInput
                      style={styles.textInput}
                      value={newUsername}
                      onChangeText={setNewUsername}
                      placeholder="Username"
                      placeholderTextColor={Colors.slate400}
                      autoCapitalize="none"
                    />
                    <TextInput
                      style={[styles.textInput, { marginVertical: 8 }]}
                      value={newUserPassword}
                      onChangeText={setNewUserPassword}
                      placeholder="Password"
                      placeholderTextColor={Colors.slate400}
                      secureTextEntry
                    />
                    <View style={styles.rolePickerRow}>
                      <TouchableOpacity
                        style={[styles.roleChip, newUserRole === 'field_officer' && styles.roleChipActive]}
                        onPress={() => setNewUserRole('field_officer')}
                      >
                        <Text style={[styles.roleChipText, newUserRole === 'field_officer' && styles.roleChipTextActive]}>
                          Field Officer
                        </Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.roleChip, newUserRole === 'admin' && styles.roleChipActive]}
                        onPress={() => setNewUserRole('admin')}
                      >
                        <Text style={[styles.roleChipText, newUserRole === 'admin' && styles.roleChipTextActive]}>
                          Administrator
                        </Text>
                      </TouchableOpacity>
                    </View>
                    <TouchableOpacity
                      style={styles.addUserBtn}
                      onPress={handleCreateUser}
                      disabled={creatingUser}
                    >
                      <Text style={styles.addUserBtnText}>Create Account</Text>
                    </TouchableOpacity>
                  </View>

                  {/* Users List */}
                  {usersList.map((u) => (
                    <View key={u.id} style={styles.userCard}>
                      <View>
                        <Text style={styles.userName}>{u.username}</Text>
                        <Text style={styles.userRole}>Role: {u.role}</Text>
                      </View>
                    </View>
                  ))}
                </View>
              )}
            </View>
          )}
        </View>

        {/* SECTION 3: PROJECT INFORMATION */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Info size={18} color={Colors.primary} />
            <Text style={styles.cardTitle}>Community Service Project (CSP)</Text>
          </View>
          <Text style={styles.aboutText}>
            JalaWatch is a dedicated rural groundwater pollution monitoring and community reporting system developed for Nutakki Village and surrounding rural areas in Guntur District, Andhra Pradesh.
          </Text>
          <Text style={styles.aboutText}>
            The platform bridges community observations of discolored borewells, chemical odors, and drain seepage with certified laboratory verification, following BIS IS 10500 standards.
          </Text>
        </View>
      </ScrollView>

      {/* INSPECTION MODAL */}
      <Modal
        visible={Boolean(inspectingReport)}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setInspectingReport(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            {inspectingReport && (
              <>
                <View style={styles.modalHeader}>
                  <View>
                    <Text style={styles.modalIdText}>{inspectingReport.id}</Text>
                    <Text style={styles.modalCategoryText}>{inspectingReport.category}</Text>
                  </View>
                  <TouchableOpacity onPress={() => setInspectingReport(null)}>
                    <X size={20} color={Colors.slate500} />
                  </TouchableOpacity>
                </View>

                <ScrollView style={styles.modalBody}>
                  {/* Photo Evidence */}
                  {inspectingReport.photo_url && (
                    <Image
                      source={{ uri: getFullPhotoUrl(inspectingReport.photo_url)! }}
                      style={styles.inspectPhoto}
                      resizeMode="cover"
                    />
                  )}

                  {/* Status & Priority Controls */}
                  <View style={styles.inspectControlsBox}>
                    <Text style={styles.controlLabel}>Status:</Text>
                    <View style={styles.pillRow}>
                      {['Submitted', 'Under Review', 'Resolved', 'Archived'].map((st) => (
                        <TouchableOpacity
                          key={st}
                          style={[
                            styles.controlPill,
                            inspectingReport.status === st && styles.controlPillActive,
                          ]}
                          onPress={() => handleUpdateStatus(st)}
                        >
                          <Text
                            style={[
                              styles.controlPillText,
                              inspectingReport.status === st && styles.controlPillTextActive,
                            ]}
                          >
                            {st}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>

                    <Text style={[styles.controlLabel, { marginTop: 10 }]}>Priority:</Text>
                    <View style={styles.pillRow}>
                      {['Low', 'Medium', 'High', 'Urgent'].map((pr) => (
                        <TouchableOpacity
                          key={pr}
                          style={[
                            styles.controlPill,
                            inspectingReport.priority === pr && styles.controlPillActive,
                          ]}
                          onPress={() => handleUpdatePriority(pr)}
                        >
                          <Text
                            style={[
                              styles.controlPillText,
                              inspectingReport.priority === pr && styles.controlPillTextActive,
                            ]}
                          >
                            {pr}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>

                  {/* Quick Action Buttons */}
                  <View style={styles.quickActionRow}>
                    <TouchableOpacity
                      style={styles.labCertBtn}
                      onPress={() => {
                        setLabPh(inspectingReport.ph ? String(inspectingReport.ph) : '');
                        setLabTds(inspectingReport.tds ? String(inspectingReport.tds) : '');
                        setLabFluoride(inspectingReport.fluoride ? String(inspectingReport.fluoride) : '');
                        setLabNitrate(inspectingReport.nitrate ? String(inspectingReport.nitrate) : '');
                        setLabRefNo(inspectingReport.report_reference_no || '');
                        setShowLabModal(true);
                      }}
                    >
                      <ShieldAlert size={14} color="#ffffff" />
                      <Text style={styles.labCertBtnText}>Record Lab Verification</Text>
                    </TouchableOpacity>

                    {adminUser?.role === 'super_admin' && (
                      <TouchableOpacity
                        style={styles.deleteReportBtn}
                        onPress={() => handleDeleteReport(inspectingReport.id)}
                      >
                        <Trash2 size={14} color={Colors.danger} />
                      </TouchableOpacity>
                    )}
                  </View>

                  {/* Follow-up Notes Thread */}
                  <View style={styles.notesSection}>
                    <Text style={styles.notesSectionTitle}>Follow-up Notes & Timeline</Text>
                    <View style={styles.addNoteRow}>
                      <TextInput
                        style={styles.addNoteInput}
                        value={newNoteText}
                        onChangeText={setNewNoteText}
                        placeholder="Add field inspection note..."
                        placeholderTextColor={Colors.slate400}
                      />
                      <TouchableOpacity
                        style={styles.addNoteBtn}
                        onPress={handleAddFollowupNote}
                        disabled={addingNote}
                      >
                        <Check size={14} color="#ffffff" />
                      </TouchableOpacity>
                    </View>

                    {followupNotes.map((note) => (
                      <View key={note.id} style={styles.noteItem}>
                        <View style={styles.noteHeader}>
                          <Text style={styles.noteAuthor}>{note.officer_name}</Text>
                          <Text style={styles.noteTime}>{note.created_at.slice(0, 16)}</Text>
                        </View>
                        <Text style={styles.noteBody}>{note.note}</Text>
                      </View>
                    ))}
                  </View>
                </ScrollView>
              </>
            )}
          </View>
        </View>
      </Modal>

      {/* LAB VERIFICATION MODAL */}
      <Modal visible={showLabModal} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalIdText}>{t.lab_section}</Text>
              <TouchableOpacity onPress={() => setShowLabModal(false)}>
                <X size={20} color={Colors.slate500} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>{t.lab_ref_no}</Text>
                <TextInput
                  style={styles.textInput}
                  value={labRefNo}
                  onChangeText={setLabRefNo}
                  placeholder="e.g. RWS-GNT-2026-904"
                  placeholderTextColor={Colors.slate400}
                />
              </View>

              <View style={styles.rowTwoCols}>
                <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
                  <Text style={styles.inputLabel}>pH (6.5 - 8.5)</Text>
                  <TextInput
                    style={styles.textInput}
                    value={labPh}
                    onChangeText={setLabPh}
                    placeholder="7.2"
                    keyboardType="numeric"
                    placeholderTextColor={Colors.slate400}
                  />
                </View>

                <View style={[styles.inputGroup, { flex: 1 }]}>
                  <Text style={styles.inputLabel}>TDS mg/L (&lt; 500)</Text>
                  <TextInput
                    style={styles.textInput}
                    value={labTds}
                    onChangeText={setLabTds}
                    placeholder="420"
                    keyboardType="numeric"
                    placeholderTextColor={Colors.slate400}
                  />
                </View>
              </View>

              <View style={styles.rowTwoCols}>
                <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
                  <Text style={styles.inputLabel}>Fluoride mg/L (&lt; 1.0)</Text>
                  <TextInput
                    style={styles.textInput}
                    value={labFluoride}
                    onChangeText={setLabFluoride}
                    placeholder="0.8"
                    keyboardType="numeric"
                    placeholderTextColor={Colors.slate400}
                  />
                </View>

                <View style={[styles.inputGroup, { flex: 1 }]}>
                  <Text style={styles.inputLabel}>Nitrate mg/L (&lt; 45)</Text>
                  <TextInput
                    style={styles.textInput}
                    value={labNitrate}
                    onChangeText={setLabNitrate}
                    placeholder="22"
                    keyboardType="numeric"
                    placeholderTextColor={Colors.slate400}
                  />
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>E. coli / Bacteria</Text>
                <TextInput
                  style={styles.textInput}
                  value={labEColi}
                  onChangeText={setLabEColi}
                  placeholder="Absent (Safe)"
                  placeholderTextColor={Colors.slate400}
                />
              </View>

              <TouchableOpacity
                style={styles.saveLabBtn}
                onPress={handleSaveLabTest}
                disabled={savingLab}
              >
                {savingLab ? (
                  <ActivityIndicator size="small" color="#ffffff" />
                ) : (
                  <Check size={16} color="#ffffff" />
                )}
                <Text style={styles.saveLabBtnText}>Certify Lab Test Results</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* PASSWORD CHANGE MODAL */}
      <Modal visible={showPwdModal} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalIdText}>{t.btn_change_pwd}</Text>
              <TouchableOpacity onPress={() => setShowPwdModal(false)}>
                <X size={20} color={Colors.slate500} />
              </TouchableOpacity>
            </View>

            <View style={styles.modalBody}>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Current Password</Text>
                <TextInput
                  style={styles.textInput}
                  value={currentPwd}
                  onChangeText={setCurrentPwd}
                  secureTextEntry
                  placeholder="••••••••"
                  placeholderTextColor={Colors.slate400}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>New Password</Text>
                <TextInput
                  style={styles.textInput}
                  value={newPwd}
                  onChangeText={setNewPwd}
                  secureTextEntry
                  placeholder="At least 8 characters"
                  placeholderTextColor={Colors.slate400}
                />
              </View>

              <TouchableOpacity
                style={styles.saveLabBtn}
                onPress={handleChangePassword}
                disabled={changingPwd}
              >
                <Text style={styles.saveLabBtnText}>Update Password</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  headerTitleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.navy,
  },
  cspBadge: {
    backgroundColor: Colors.primaryBg,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  cspBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: Colors.primary,
  },
  langPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primaryBg,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 14,
  },
  langPillText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.primary,
    marginLeft: 4,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    ...Shadows.card,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: Colors.navy,
  },
  serverStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  serverStatusText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.navy,
  },
  activeUrlText: {
    fontSize: 11,
    color: Colors.slate400,
  },
  loginForm: {
    marginTop: 4,
  },
  loginDesc: {
    fontSize: 12,
    color: Colors.slate500,
    marginBottom: 12,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.dangerBg,
    padding: 10,
    borderRadius: 8,
    marginBottom: 12,
    gap: 6,
  },
  errorBoxText: {
    fontSize: 12,
    color: Colors.danger,
  },
  inputGroup: {
    marginBottom: 10,
  },
  rowTwoCols: {
    flexDirection: 'row',
  },
  inputLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.navy,
    marginBottom: 4,
  },
  textInput: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 13,
    color: Colors.navy,
  },
  loginBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.navy,
    borderRadius: 10,
    paddingVertical: 12,
    marginTop: 6,
    gap: 6,
  },
  loginBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '800',
  },
  profileBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    padding: 12,
    borderRadius: 12,
    marginBottom: 12,
  },
  profileInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  profileName: {
    fontSize: 14,
    fontWeight: '800',
    color: Colors.navy,
  },
  profileRole: {
    fontSize: 11,
    color: Colors.primary,
    fontWeight: '600',
  },
  profileActions: {
    flexDirection: 'row',
    gap: 6,
  },
  actionIconBtn: {
    backgroundColor: '#ffffff',
    padding: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  logoutBtn: {
    backgroundColor: Colors.dangerBg,
    padding: 8,
    borderRadius: 8,
  },
  adminNavTabs: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    marginBottom: 12,
  },
  adminNavTab: {
    paddingVertical: 8,
    paddingHorizontal: 10,
    marginRight: 6,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  adminNavTabActive: {
    borderBottomColor: Colors.primary,
  },
  adminNavTabText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.slate500,
  },
  adminNavTabTextActive: {
    color: Colors.primary,
    fontWeight: '800',
  },
  tabContent: {
    marginTop: 4,
  },
  adminFilterRow: {
    marginBottom: 10,
  },
  adminSearchInput: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    fontSize: 12,
  },
  adminReportCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    padding: 10,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  adminCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  adminReportId: {
    fontSize: 12,
    fontWeight: '800',
    color: Colors.navy,
  },
  adminStatusPill: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  adminStatusText: {
    fontSize: 9,
    fontWeight: '700',
  },
  adminCategoryText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.slate700,
  },
  adminVillageText: {
    fontSize: 11,
    color: Colors.slate500,
    marginTop: 2,
  },
  adminAssignedText: {
    fontSize: 10,
    color: Colors.primary,
    fontWeight: '700',
    marginTop: 2,
  },
  tabHeaderDesc: {
    fontSize: 12,
    color: Colors.slate500,
    marginBottom: 8,
  },
  emptyNoticeText: {
    fontSize: 12,
    color: Colors.slate400,
    paddingVertical: 12,
  },
  clusterCard: {
    backgroundColor: '#FFFBEB',
    borderWidth: 1,
    borderColor: '#FDE68A',
    borderRadius: 10,
    padding: 10,
    marginBottom: 8,
  },
  clusterHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  clusterTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: Colors.warning,
  },
  clusterDistance: {
    fontSize: 11,
    color: Colors.slate600,
    marginTop: 2,
  },
  clusterIds: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.navy,
    marginTop: 2,
  },
  logCard: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    padding: 8,
    marginBottom: 6,
  },
  logHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  logAction: {
    fontSize: 11,
    fontWeight: '800',
    color: Colors.navy,
  },
  logTime: {
    fontSize: 10,
    color: Colors.slate400,
  },
  logDetails: {
    fontSize: 11,
    color: Colors.slate600,
    marginTop: 2,
  },
  logSubDetails: {
    fontSize: 10,
    color: Colors.slate500,
  },
  bold: {
    fontWeight: '700',
  },
  createUserBox: {
    backgroundColor: '#F8FAFC',
    padding: 12,
    borderRadius: 10,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  createBoxTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: Colors.navy,
    marginBottom: 8,
  },
  rolePickerRow: {
    flexDirection: 'row',
    gap: 8,
    marginVertical: 4,
  },
  roleChip: {
    flex: 1,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    backgroundColor: '#ffffff',
  },
  roleChipActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  roleChipText: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.slate600,
  },
  roleChipTextActive: {
    color: '#ffffff',
    fontWeight: '700',
  },
  addUserBtn: {
    backgroundColor: Colors.navy,
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  addUserBtnText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
  },
  userCard: {
    backgroundColor: '#F8FAFC',
    padding: 10,
    borderRadius: 8,
    marginBottom: 6,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  userName: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.navy,
  },
  userRole: {
    fontSize: 11,
    color: Colors.primary,
  },
  aboutText: {
    fontSize: 12,
    color: Colors.slate600,
    lineHeight: 18,
    marginBottom: 8,
  },
  // Inspection Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '90%',
    padding: 16,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  modalIdText: {
    fontSize: 16,
    fontWeight: '900',
    color: Colors.navy,
  },
  modalCategoryText: {
    fontSize: 12,
    color: Colors.slate500,
  },
  modalBody: {
    marginVertical: 10,
  },
  inspectPhoto: {
    width: '100%',
    height: 180,
    borderRadius: 10,
    marginBottom: 10,
  },
  inspectControlsBox: {
    backgroundColor: '#F8FAFC',
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 10,
  },
  controlLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.navy,
    marginBottom: 6,
  },
  pillRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  controlPill: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 8,
  },
  controlPillActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  controlPillText: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.slate600,
  },
  controlPillTextActive: {
    color: '#ffffff',
    fontWeight: '700',
  },
  quickActionRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  labCertBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.success,
    paddingVertical: 10,
    borderRadius: 10,
    gap: 6,
  },
  labCertBtnText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
  },
  deleteReportBtn: {
    backgroundColor: Colors.dangerBg,
    paddingHorizontal: 14,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notesSection: {
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    paddingTop: 10,
  },
  notesSectionTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: Colors.navy,
    marginBottom: 8,
  },
  addNoteRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 10,
  },
  addNoteInput: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    fontSize: 12,
  },
  addNoteBtn: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  noteItem: {
    backgroundColor: '#F8FAFC',
    padding: 8,
    borderRadius: 8,
    marginBottom: 6,
  },
  noteHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  noteAuthor: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.navy,
  },
  noteTime: {
    fontSize: 10,
    color: Colors.slate400,
  },
  noteBody: {
    fontSize: 12,
    color: Colors.slate700,
  },
  saveLabBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.success,
    paddingVertical: 12,
    borderRadius: 10,
    marginTop: 10,
    gap: 6,
  },
  saveLabBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
  },
});
