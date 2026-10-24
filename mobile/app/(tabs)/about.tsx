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
} from 'lucide-react-native';
import { Colors, Shadows } from '../../constants/theme';
import {
  getApiBaseUrl,
  setApiBaseUrl,
  testEndpoint,
  adminLogin,
  adminGetReports,
  adminUpdateReportStatus,
  AdminUser,
  AdminReport,
} from '../../services/api';

export default function AboutScreen() {
  const [serverStatus, setServerStatus] = useState<'checking' | 'online' | 'offline'>('checking');
  const [serverPingTime, setServerPingTime] = useState<number | null>(null);
  const [activeUrl, setActiveUrl] = useState(getApiBaseUrl());

  // Admin state
  const [adminToken, setAdminToken] = useState<string | null>(null);
  const [adminUser, setAdminUser] = useState<AdminUser | null>(null);
  const [adminUsername, setAdminUsername] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [adminLoggingIn, setAdminLoggingIn] = useState(false);
  const [adminError, setAdminError] = useState<string | null>(null);

  // Admin review portal modal state
  const [showAdminModal, setShowAdminModal] = useState(false);
  const [adminReports, setAdminReports] = useState<AdminReport[]>([]);
  const [adminLoadingReports, setAdminLoadingReports] = useState(false);
  const [adminFilterStatus, setAdminFilterStatus] = useState('All');
  const [editingNotesId, setEditingNotesId] = useState<string | null>(null);
  const [tempNotes, setTempNotes] = useState('');
  const [updatingId, setUpdatingId] = useState<string | null>(null);

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

  useEffect(() => {
    checkHealth();
  }, [checkHealth]);

  // Admin login handler
  const handleAdminLogin = async () => {
    if (!adminUsername.trim() || !adminPassword.trim()) {
      setAdminError('Please enter both username and password.');
      return;
    }
    setAdminLoggingIn(true);
    setAdminError(null);
    try {
      const { token, admin } = await adminLogin(adminUsername.trim(), adminPassword.trim());
      setAdminToken(token);
      setAdminUser(admin);
      setAdminPassword('');
      Alert.alert('Authenticated', `Welcome back, ${admin.username} (${admin.role}).`);
      loadAdminReports(token);
    } catch (err: any) {
      setAdminError(err.message || 'Login failed. Please verify admin credentials.');
    } finally {
      setAdminLoggingIn(false);
    }
  };

  // Load reports for admin review
  const loadAdminReports = async (token: string, status = adminFilterStatus) => {
    setAdminLoadingReports(true);
    try {
      const data = await adminGetReports(token, { status });
      setAdminReports(data);
    } catch (err: any) {
      Alert.alert('Admin Error', err.message || 'Could not load admin reports.');
    } finally {
      setAdminLoadingReports(false);
    }
  };

  const handleAdminLogout = () => {
    setAdminToken(null);
    setAdminUser(null);
    setAdminReports([]);
    setShowAdminModal(false);
  };

  // Change report status
  const handleChangeStatus = async (reportId: string, newStatus: string) => {
    if (!adminToken) return;
    setUpdatingId(reportId);
    try {
      const updated = await adminUpdateReportStatus(adminToken, reportId, { status: newStatus });
      setAdminReports((prev) => prev.map((r) => (r.id === reportId ? { ...r, ...updated } : r)));
    } catch (err: any) {
      Alert.alert('Status Update Failed', err.message);
    } finally {
      setUpdatingId(null);
    }
  };

  // Save admin notes
  const handleSaveNotes = async (reportId: string) => {
    if (!adminToken) return;
    setUpdatingId(reportId);
    try {
      const updated = await adminUpdateReportStatus(adminToken, reportId, { admin_notes: tempNotes });
      setAdminReports((prev) => prev.map((r) => (r.id === reportId ? { ...r, ...updated } : r)));
      setEditingNotesId(null);
    } catch (err: any) {
      Alert.alert('Save Notes Failed', err.message);
    } finally {
      setUpdatingId(null);
    }
  };

  // Toggle verified flag
  const handleToggleVerified = async (reportId: string, currentVerified?: boolean) => {
    if (!adminToken) return;
    setUpdatingId(reportId);
    try {
      const updated = await adminUpdateReportStatus(adminToken, reportId, { is_verified: !currentVerified });
      setAdminReports((prev) => prev.map((r) => (r.id === reportId ? { ...r, ...updated } : r)));
    } catch (err: any) {
      Alert.alert('Verification Toggle Failed', err.message);
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.headerIconCircle}>
            <Info size={18} color="#ffffff" strokeWidth={2.5} />
          </View>
          <View>
            <Text style={styles.headerTitle}>About CSP & Governance</Text>
            <Text style={styles.headerSubtitle}>Nutakki Village Groundwater Study</Text>
          </View>
        </View>
      </View>

      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Project Overview Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <BookOpen size={18} color={Colors.primary} strokeWidth={2.4} />
            <Text style={styles.cardTitle}>College Community Service Project (CSP)</Text>
          </View>
          <Text style={styles.bodyText}>
            <Text style={{ fontWeight: '800', color: Colors.slate900 }}>JalaWatch </Text>
            is an academic community-monitoring portal developed as part of a Community Service Project (CSP) field study in <Text style={{ fontWeight: '700' }}>Nutakki Village</Text> near Vijayawada, Guntur District, Andhra Pradesh.
          </Text>
          <View style={styles.highlightBox}>
            <MapPin size={16} color={Colors.primaryDark} style={{ marginTop: 2 }} />
            <Text style={styles.highlightText}>
              <Text style={{ fontWeight: '700' }}>Nutakki Field Observation: </Text>
              Villagers reported concerns regarding black-tinted groundwater in borewells. Our team observed unpaved street drains where domestic wastewater seeps directly into porous alluvial soil strata.
            </Text>
          </View>
        </View>

        {/* Academic Prototype & Ethics Disclaimer */}
        <View style={styles.disclaimerCard}>
          <View style={styles.disclaimerHeader}>
            <ShieldAlert size={18} color={Colors.warning} strokeWidth={2.4} />
            <Text style={styles.disclaimerTitle}>ETHICS & SCIENTIFIC DISCLAIMER</Text>
          </View>
          <Text style={styles.disclaimerBody}>
            1. <Text style={{ fontWeight: '700' }}>Unverified Citizen Data:</Text> Submissions represent unverified observational reports submitted by community members. They do not constitute certified scientific or epidemiological conclusions.
          </Text>
          <Text style={styles.disclaimerBody}>
            2. <Text style={{ fontWeight: '700' }}>Independent Testing Required:</Text> No suspected cause has been officially established without laboratory chemical and microbiological assay.
          </Text>
          <Text style={styles.disclaimerBody}>
            3. <Text style={{ fontWeight: '700' }}>Not a Government Agency:</Text> JalaWatch is an academic research demonstration designed to assist civic awareness and provide structured reports for official redressal via Spandana (1902).
          </Text>
        </View>

        {/* Gram Panchayat & Research Admin Portal */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Lock size={18} color={Colors.primary} strokeWidth={2.4} />
            <Text style={styles.cardTitle}>Panchayat & Research Admin Portal</Text>
          </View>

          {adminToken && adminUser ? (
            <View style={styles.adminActiveBox}>
              <View style={styles.adminBadgeRow}>
                <View style={styles.adminAvatar}>
                  <UserCheck size={16} color={Colors.primaryDark} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.adminUserText}>
                    Logged in as: <Text style={{ fontWeight: '800' }}>{adminUser.username}</Text>
                  </Text>
                  <Text style={styles.adminRoleText}>Role: {adminUser.role}</Text>
                </View>
              </View>

              <TouchableOpacity
                style={styles.openAdminModalBtn}
                onPress={() => {
                  loadAdminReports(adminToken);
                  setShowAdminModal(true);
                }}
                activeOpacity={0.8}
              >
                <Edit3 size={15} color="#ffffff" />
                <Text style={styles.openAdminModalBtnText}>Review & Manage Submissions</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.adminLogoutBtn}
                onPress={handleAdminLogout}
                activeOpacity={0.8}
              >
                <LogOut size={14} color="#dc2626" />
                <Text style={styles.adminLogoutText}>Sign Out</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.adminLoginBox}>
              <Text style={styles.adminLoginSubtitle}>
                Administrative access for Gram Panchayat officials and CSP research leads to review citizen observations and update resolution statuses.
              </Text>

              {adminError && (
                <View style={styles.adminErrorBanner}>
                  <Text style={styles.adminErrorText}>{adminError}</Text>
                </View>
              )}

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Admin Username</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="e.g. admin"
                  placeholderTextColor={Colors.slate400}
                  value={adminUsername}
                  onChangeText={setAdminUsername}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Password</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="Enter administrative password"
                  placeholderTextColor={Colors.slate400}
                  value={adminPassword}
                  onChangeText={setAdminPassword}
                  secureTextEntry
                  autoCapitalize="none"
                />
              </View>

              <TouchableOpacity
                style={[styles.adminLoginBtn, adminLoggingIn && { opacity: 0.7 }]}
                onPress={handleAdminLogin}
                disabled={adminLoggingIn}
                activeOpacity={0.8}
              >
                {adminLoggingIn ? (
                  <ActivityIndicator size="small" color="#ffffff" />
                ) : (
                  <Unlock size={14} color="#ffffff" />
                )}
                <Text style={styles.adminLoginBtnText}>
                  {adminLoggingIn ? 'Authenticating...' : 'Sign In as Administrator'}
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Server & Backend Connection Status */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Server size={18} color={Colors.primary} strokeWidth={2.4} />
            <Text style={styles.cardTitle}>Backend API Status</Text>
          </View>

          <View style={styles.statusRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.statusLabel}>Connected API Endpoint</Text>
              <Text style={styles.statusUrl} numberOfLines={1}>{activeUrl}</Text>
            </View>

            <View style={[
              styles.statusBadge,
              serverStatus === 'online' && styles.statusBadgeOnline,
              serverStatus === 'offline' && styles.statusBadgeOffline,
            ]}>
              <View style={[
                styles.statusDot,
                serverStatus === 'online' && { backgroundColor: '#16a34a' },
                serverStatus === 'offline' && { backgroundColor: '#dc2626' },
              ]} />
              <Text style={[
                styles.statusBadgeText,
                serverStatus === 'online' && { color: '#166534' },
                serverStatus === 'offline' && { color: '#991b1b' },
              ]}>
                {serverStatus === 'checking' ? 'Testing...' : serverStatus === 'online' ? `Online (${serverPingTime}ms)` : 'Offline'}
              </Text>
            </View>
          </View>

          <TouchableOpacity
            style={styles.refreshServerBtn}
            onPress={checkHealth}
            activeOpacity={0.8}
          >
            <RefreshCw size={14} color={Colors.primary} strokeWidth={2.2} />
            <Text style={styles.refreshServerBtnText}>Test Server Connection</Text>
          </TouchableOpacity>

          <View style={styles.infoTipBox}>
            <Text style={styles.infoTipText}>
              <Text style={{ fontWeight: '700' }}>Note for Android Device / USB Cable: </Text>
              Supports Wi-Fi LAN IP (192.168.x.x), Android emulator (10.0.2.2), and physical device USB reverse (127.0.0.1:5000 via adb reverse).
            </Text>
          </View>
        </View>

        {/* Technical Architecture Info */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Smartphone size={18} color={Colors.primary} strokeWidth={2.4} />
            <Text style={styles.cardTitle}>Mobile App Architecture</Text>
          </View>

          <View style={styles.techList}>
            <View style={styles.techItem}>
              <Text style={styles.techLabel}>Framework</Text>
              <Text style={styles.techVal}>React Native (Expo SDK 58, Expo Router)</Text>
            </View>
            <View style={styles.techItem}>
              <Text style={styles.techLabel}>Mapping Engine</Text>
              <Text style={styles.techVal}>Leaflet OpenStreetMap Native WebView</Text>
            </View>
            <View style={styles.techItem}>
              <Text style={styles.techLabel}>Backend REST API</Text>
              <Text style={styles.techVal}>Python Flask + SQLite (Persistent Storage)</Text>
            </View>
            <View style={styles.techItem}>
              <Text style={styles.techLabel}>Language</Text>
              <Text style={styles.techVal}>TypeScript</Text>
            </View>
            <View style={styles.techItem}>
              <Text style={styles.techLabel}>Design Tokens</Text>
              <Text style={styles.techVal}>Mint, Aqua, Teal & Clean White</Text>
            </View>
          </View>
        </View>

        {/* Student Team & Mentorship */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Users size={18} color={Colors.primary} strokeWidth={2.4} />
            <Text style={styles.cardTitle}>CSP Student Project Team</Text>
          </View>
          <Text style={styles.bodyText}>
            Community Service Project conducted by undergraduate students under faculty guidance for Nutakki Gram Panchayat public awareness.
          </Text>
          <View style={styles.teamBadge}>
            <Text style={styles.teamBadgeText}>Project Year: 2026 • Community Service Project (CSP)</Text>
          </View>
        </View>

        {/* Version info footer */}
        <View style={styles.footer}>
          <Text style={styles.footerVersion}>JalaWatch Mobile App v1.0.0</Text>
          <Text style={styles.footerCopyright}>College Community Service Project • Nutakki, AP</Text>
        </View>
      </ScrollView>

      {/* ADMIN REVIEW & STATUS MANAGEMENT MODAL */}
      <Modal
        visible={showAdminModal}
        animationType="slide"
        onRequestClose={() => setShowAdminModal(false)}
      >
        <SafeAreaView style={styles.modalSafeArea}>
          <View style={styles.modalHeader}>
            <View>
              <Text style={styles.modalTitle}>Admin Report Management</Text>
              <Text style={styles.modalSubtitle}>Review, update status, and manage field notes</Text>
            </View>
            <TouchableOpacity
              onPress={() => setShowAdminModal(false)}
              style={styles.modalCloseBtn}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <X size={20} color={Colors.slate600} />
            </TouchableOpacity>
          </View>

          {/* Status Filter Chips */}
          <View style={styles.filterRow}>
            {['All', 'Submitted', 'Under Review', 'Resolved'].map((st) => (
              <TouchableOpacity
                key={st}
                onPress={() => {
                  setAdminFilterStatus(st);
                  if (adminToken) loadAdminReports(adminToken, st);
                }}
                style={[styles.filterChip, adminFilterStatus === st && styles.filterChipActive]}
              >
                <Text style={[styles.filterChipText, adminFilterStatus === st && styles.filterChipTextActive]}>
                  {st}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Report List */}
          {adminLoadingReports ? (
            <View style={styles.modalCenter}>
              <ActivityIndicator size="large" color={Colors.primary} />
              <Text style={styles.loadingText}>Loading reports for admin review...</Text>
            </View>
          ) : adminReports.length === 0 ? (
            <View style={styles.modalCenter}>
              <Text style={styles.emptyText}>No reports found for the selected filter.</Text>
            </View>
          ) : (
            <ScrollView contentContainerStyle={styles.adminReportsList}>
              {adminReports.map((report) => {
                const isEditingThisNote = editingNotesId === report.id;
                const isBusy = updatingId === report.id;

                return (
                  <View key={report.id} style={styles.adminReportCard}>
                    {/* Top Row: ID, Village & Date */}
                    <View style={styles.adminCardTop}>
                      <View style={styles.adminIdBadge}>
                        <Text style={styles.adminIdText}>{report.id}</Text>
                      </View>
                      <Text style={styles.adminVillageText}>{report.village}</Text>
                      <Text style={styles.adminDateText}>{report.date_observed}</Text>
                    </View>

                    {/* Title / Description */}
                    <Text style={styles.adminReportTitle}>{report.landmark || report.category}</Text>
                    <Text style={styles.adminReportDesc} numberOfLines={3}>{report.description}</Text>

                    {/* Reporter contact (confidential to admin) */}
                    {report.reporter_contact ? (
                      <View style={styles.reporterContactBox}>
                        <Text style={styles.reporterContactLabel}>Citizen Contact:</Text>
                        <Text style={styles.reporterContactValue}>{report.reporter_contact}</Text>
                      </View>
                    ) : null}

                    {/* Verification Toggle */}
                    <TouchableOpacity
                      style={styles.verificationToggleRow}
                      onPress={() => handleToggleVerified(report.id, report.is_verified)}
                      disabled={isBusy}
                      activeOpacity={0.8}
                    >
                      <View style={[styles.checkboxBox, report.is_verified && styles.checkboxBoxActive]}>
                        {report.is_verified && <Check size={12} color="#ffffff" />}
                      </View>
                      <Text style={styles.verificationToggleText}>
                        {report.is_verified ? 'Verified by Field Inspection' : 'Unverified Citizen Observation'}
                      </Text>
                    </TouchableOpacity>

                    {/* Status Update Buttons */}
                    <View style={styles.statusButtonGroup}>
                      <Text style={styles.statusGroupLabel}>Change Status:</Text>
                      <View style={styles.statusBtnRow}>
                        {(['Submitted', 'Under Review', 'Resolved'] as const).map((s) => {
                          const isActive = report.status === s;
                          return (
                            <TouchableOpacity
                              key={s}
                              style={[
                                styles.statusBtn,
                                isActive && styles.statusBtnActive,
                                isBusy && { opacity: 0.5 },
                              ]}
                              onPress={() => handleChangeStatus(report.id, s)}
                              disabled={isBusy || isActive}
                            >
                              <Text
                                style={[
                                  styles.statusBtnText,
                                  isActive && styles.statusBtnTextActive,
                                ]}
                              >
                                {s}
                              </Text>
                            </TouchableOpacity>
                          );
                        })}
                      </View>
                    </View>

                    {/* Admin Field Notes */}
                    <View style={styles.notesSection}>
                      <View style={styles.notesHeader}>
                        <Text style={styles.notesLabel}>Internal Administrative Notes:</Text>
                        {!isEditingThisNote && (
                          <TouchableOpacity
                            onPress={() => {
                              setEditingNotesId(report.id);
                              setTempNotes(report.admin_notes || '');
                            }}
                          >
                            <Text style={styles.editNotesBtnText}>Edit</Text>
                          </TouchableOpacity>
                        )}
                      </View>

                      {isEditingThisNote ? (
                        <View style={styles.notesEditBox}>
                          <TextInput
                            style={styles.notesInput}
                            value={tempNotes}
                            onChangeText={setTempNotes}
                            placeholder="Add field inspection findings or escalation notes..."
                            placeholderTextColor={Colors.slate400}
                            multiline
                          />
                          <View style={styles.notesBtnRow}>
                            <TouchableOpacity
                              style={styles.saveNotesBtn}
                              onPress={() => handleSaveNotes(report.id)}
                              disabled={isBusy}
                            >
                              <Save size={12} color="#ffffff" />
                              <Text style={styles.saveNotesBtnText}>Save</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                              style={styles.cancelNotesBtn}
                              onPress={() => setEditingNotesId(null)}
                            >
                              <Text style={styles.cancelNotesBtnText}>Cancel</Text>
                            </TouchableOpacity>
                          </View>
                        </View>
                      ) : (
                        <Text style={styles.notesContent}>
                          {report.admin_notes || 'No administrative notes added yet.'}
                        </Text>
                      )}
                    </View>
                  </View>
                );
              })}
            </ScrollView>
          )}
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  headerIconCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: Colors.slate900,
  },
  headerSubtitle: {
    fontSize: 11,
    color: Colors.slate500,
  },
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  scrollContent: {
    padding: 16,
    gap: 14,
    paddingBottom: 36,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    ...Shadows.card,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: Colors.slate900,
  },
  bodyText: {
    fontSize: 13,
    color: Colors.slate600,
    lineHeight: 20,
  },
  highlightBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: Colors.mint50,
    borderWidth: 1,
    borderColor: Colors.mint200,
    borderRadius: 12,
    padding: 12,
    marginTop: 12,
  },
  highlightText: {
    flex: 1,
    fontSize: 12,
    color: Colors.slate700,
    lineHeight: 18,
  },
  disclaimerCard: {
    backgroundColor: '#fffbeb',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: '#fef3c7',
    ...Shadows.card,
  },
  disclaimerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  disclaimerTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: Colors.warning,
    letterSpacing: 0.5,
  },
  disclaimerBody: {
    fontSize: 12,
    color: '#92400e',
    lineHeight: 18,
    marginBottom: 8,
  },
  adminActiveBox: {
    gap: 10,
  },
  adminBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#f0fdfa',
    padding: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#ccfbf1',
  },
  adminAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#ccfbf1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  adminUserText: {
    fontSize: 12,
    color: Colors.slate800,
  },
  adminRoleText: {
    fontSize: 11,
    color: Colors.primaryDark,
    fontWeight: '600',
  },
  openAdminModalBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: Colors.primary,
    paddingVertical: 12,
    borderRadius: 12,
  },
  openAdminModalBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '800',
  },
  adminLogoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    paddingVertical: 6,
  },
  adminLogoutText: {
    color: '#dc2626',
    fontSize: 12,
    fontWeight: '700',
  },
  adminLoginBox: {
    gap: 10,
  },
  adminLoginSubtitle: {
    fontSize: 12,
    color: Colors.slate600,
    lineHeight: 17,
  },
  adminErrorBanner: {
    backgroundColor: '#fef2f2',
    borderWidth: 1,
    borderColor: '#fee2e2',
    borderRadius: 8,
    padding: 8,
  },
  adminErrorText: {
    fontSize: 11,
    color: '#dc2626',
    fontWeight: '600',
  },
  inputGroup: {
    gap: 4,
  },
  inputLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.slate700,
  },
  textInput: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 7,
    fontSize: 13,
    color: Colors.slate800,
  },
  adminLoginBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: Colors.primary,
    paddingVertical: 10,
    borderRadius: 10,
    marginTop: 4,
  },
  adminLoginBtnText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '800',
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#f8fafc',
    padding: 12,
    borderRadius: 12,
    marginBottom: 10,
  },
  statusLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: Colors.slate400,
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  statusUrl: {
    fontSize: 11,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    color: Colors.slate700,
    fontWeight: '600',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 100,
    backgroundColor: '#f1f5f9',
  },
  statusBadgeOnline: {
    backgroundColor: '#dcfce7',
  },
  statusBadgeOffline: {
    backgroundColor: '#fee2e2',
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#94a3b8',
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.slate600,
  },
  refreshServerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 8,
    backgroundColor: Colors.primaryBg,
    borderRadius: 10,
  },
  refreshServerBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.primaryDark,
  },
  infoTipBox: {
    marginTop: 8,
    padding: 8,
    backgroundColor: '#f8fafc',
    borderRadius: 8,
  },
  infoTipText: {
    fontSize: 10,
    color: Colors.slate500,
    lineHeight: 14,
  },
  techList: {
    gap: 8,
  },
  techItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  techLabel: {
    fontSize: 12,
    color: Colors.slate500,
  },
  techVal: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.slate800,
  },
  teamBadge: {
    alignSelf: 'flex-start',
    backgroundColor: Colors.primaryBg,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    marginTop: 10,
  },
  teamBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.primaryDark,
  },
  footer: {
    alignItems: 'center',
    paddingVertical: 12,
    gap: 4,
  },
  footerVersion: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.slate600,
  },
  footerCopyright: {
    fontSize: 10,
    color: Colors.slate400,
  },
  // Modal styles
  modalSafeArea: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: Colors.slate900,
  },
  modalSubtitle: {
    fontSize: 11,
    color: Colors.slate500,
  },
  modalCloseBtn: {
    padding: 6,
    borderRadius: 14,
    backgroundColor: '#f1f5f9',
  },
  filterRow: {
    flexDirection: 'row',
    paddingHorizontal: 14,
    paddingVertical: 10,
    gap: 6,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  filterChip: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 100,
    backgroundColor: '#f1f5f9',
  },
  filterChipActive: {
    backgroundColor: Colors.primary,
  },
  filterChipText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.slate600,
  },
  filterChipTextActive: {
    color: '#ffffff',
  },
  modalCenter: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  loadingText: {
    fontSize: 12,
    color: Colors.slate500,
    marginTop: 8,
  },
  emptyText: {
    fontSize: 13,
    color: Colors.slate500,
  },
  adminReportsList: {
    padding: 14,
    gap: 12,
  },
  adminReportCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    ...Shadows.card,
    gap: 8,
  },
  adminCardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  adminIdBadge: {
    backgroundColor: Colors.primaryBg,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  adminIdText: {
    fontSize: 11,
    fontWeight: '800',
    color: Colors.primaryDark,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  adminVillageText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.slate700,
    flex: 1,
  },
  adminDateText: {
    fontSize: 11,
    color: Colors.slate400,
  },
  adminReportTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: Colors.slate900,
  },
  adminReportDesc: {
    fontSize: 12,
    color: Colors.slate600,
    lineHeight: 17,
  },
  reporterContactBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  reporterContactLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.slate500,
  },
  reporterContactValue: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.slate800,
  },
  verificationToggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 4,
  },
  checkboxBox: {
    width: 18,
    height: 18,
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: '#cbd5e1',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffffff',
  },
  checkboxBoxActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  verificationToggleText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.slate700,
  },
  statusButtonGroup: {
    gap: 4,
    marginTop: 4,
  },
  statusGroupLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.slate400,
  },
  statusBtnRow: {
    flexDirection: 'row',
    gap: 6,
  },
  statusBtn: {
    flex: 1,
    paddingVertical: 6,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f8fafc',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  statusBtnActive: {
    backgroundColor: Colors.primaryBg,
    borderColor: Colors.primary,
  },
  statusBtnText: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.slate600,
  },
  statusBtnTextActive: {
    color: Colors.primaryDark,
  },
  notesSection: {
    backgroundColor: '#f8fafc',
    borderRadius: 10,
    padding: 10,
    marginTop: 4,
  },
  notesHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  notesLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.slate500,
  },
  editNotesBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.primaryDark,
  },
  notesContent: {
    fontSize: 11,
    color: Colors.slate700,
    fontStyle: 'italic',
  },
  notesEditBox: {
    gap: 6,
  },
  notesInput: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 6,
    padding: 8,
    fontSize: 11,
    color: Colors.slate800,
    minHeight: 50,
  },
  notesBtnRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 6,
  },
  saveNotesBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.primary,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
  },
  saveNotesBtnText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '700',
  },
  cancelNotesBtn: {
    paddingHorizontal: 8,
    paddingVertical: 5,
  },
  cancelNotesBtnText: {
    color: Colors.slate500,
    fontSize: 11,
  },
});
