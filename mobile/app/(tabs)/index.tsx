import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
  Platform,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
  Droplets,
  AlertTriangle,
  ShieldCheck,
  FileText,
  MapPin,
  Plus,
  RefreshCw,
  Settings,
  Check,
  X,
  Globe,
  TrendingUp,
  Clock,
  CheckCircle,
  ExternalLink,
  ChevronRight,
  Sparkles,
} from 'lucide-react-native';
import { Colors, Shadows } from '../../constants/theme';
import {
  fetchReports,
  fetchStats,
  Report,
  Stats,
  setApiBaseUrl,
  getApiBaseUrl,
  PRODUCTION_API_URL,
} from '../../services/api';
import LiveMapNative from '../../components/LiveMapNative';
import ReportDetailsSheet from '../../components/ReportDetailsSheet';
import {
  translations,
  LanguageCode,
  getSavedLanguage,
  saveLanguage,
} from '../../constants/translations';

export default function HomeScreen() {
  const router = useRouter();

  // Language state
  const [lang, setLang] = useState<LanguageCode>('en');
  const t = translations[lang];

  // Data states
  const [reports, setReports] = useState<Report[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [retrying, setRetrying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // View state: 'map' or 'feed'
  const [activeView, setActiveView] = useState<'map' | 'feed'>('map');

  // Config modal
  const [showConfig, setShowConfig] = useState(false);
  const [customUrlInput, setCustomUrlInput] = useState(getApiBaseUrl());
  const initialSelectDoneRef = useRef(false);

  const loadData = useCallback(async (isRetry = false) => {
    if (isRetry) {
      setRetrying(true);
    }
    try {
      setError(null);
      const [reportsData, statsData] = await Promise.all([
        fetchReports({ limit: 50 }).catch(() => []),
        fetchStats().catch(() => null),
      ]);

      setReports(reportsData);
      setStats(statsData);

      if (reportsData.length > 0 && !initialSelectDoneRef.current) {
        initialSelectDoneRef.current = true;
        setSelectedReport(reportsData[0]);
      }
    } catch (err: any) {
      console.warn('Load reports error:', err.message);
      setError(err.message || 'Could not connect to JalaWatch server.');
    } finally {
      setLoading(false);
      setRefreshing(false);
      setRetrying(false);
    }
  }, []);

  useEffect(() => {
    getSavedLanguage().then((l) => setLang(l));
    loadData();
  }, [loadData]);

  const onRefresh = () => {
    setRefreshing(true);
    loadData(true);
  };

  const handleToggleLang = async () => {
    const nextLang: LanguageCode = lang === 'en' ? 'te' : 'en';
    setLang(nextLang);
    await saveLanguage(nextLang);
  };

  const handleSaveCustomUrl = () => {
    if (customUrlInput.trim()) {
      setApiBaseUrl(customUrlInput.trim());
      setShowConfig(false);
      loadData(true);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      {/* Top Branding App Bar */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.logoCircle}>
            <Droplets size={18} color="#ffffff" strokeWidth={2.5} />
          </View>
          <View>
            <View style={styles.titleRow}>
              <Text style={styles.brandTitle}>{t.home_title}</Text>
              <View style={styles.cspPill}>
                <Text style={styles.cspPillText}>NUTAKKI CSP</Text>
              </View>
            </View>
            <Text style={styles.brandSubtitle}>{t.home_subtitle}</Text>
          </View>
        </View>

        <View style={styles.headerRight}>
          <TouchableOpacity
            style={styles.langPill}
            onPress={handleToggleLang}
            activeOpacity={0.8}
          >
            <Globe size={13} color={Colors.primary} />
            <Text style={styles.langPillText}>{t.lang_toggle}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.headerReportBtn}
            onPress={() => router.push('/(tabs)/report')}
            activeOpacity={0.8}
          >
            <Plus size={14} color="#ffffff" strokeWidth={3} />
            <Text style={styles.headerReportText}>{t.tab_report}</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* KPI Dashboard Summary Strip */}
      <View style={styles.kpiContainer}>
        <View style={styles.kpiItem}>
          <Text style={styles.kpiValue}>
            {stats ? stats.total_reports : reports.length}
          </Text>
          <Text style={styles.kpiLabel}>{t.kpi_total}</Text>
        </View>

        <View style={styles.kpiDivider} />

        <View style={styles.kpiItem}>
          <Text style={[styles.kpiValue, { color: Colors.warning }]}>
            {stats ? stats.under_review : reports.filter((r) => r.status === 'Under Review').length}
          </Text>
          <Text style={styles.kpiLabel}>{t.kpi_under_review}</Text>
        </View>

        <View style={styles.kpiDivider} />

        <View style={styles.kpiItem}>
          <Text style={[styles.kpiValue, { color: Colors.success }]}>
            {stats ? stats.resolved : reports.filter((r) => r.status === 'Resolved').length}
          </Text>
          <Text style={styles.kpiLabel}>{t.kpi_resolved}</Text>
        </View>

        <View style={styles.kpiDivider} />

        <View style={styles.kpiItem}>
          <Text style={[styles.kpiValue, { color: Colors.navy }]}>
            {stats ? stats.villages_impacted : 4}
          </Text>
          <Text style={styles.kpiLabel}>{t.kpi_villages}</Text>
        </View>
      </View>

      {/* Quick Action Navigation Bar */}
      <View style={styles.quickActionBar}>
        <TouchableOpacity
          style={styles.quickActionBtnPrimary}
          onPress={() => router.push('/(tabs)/report')}
          activeOpacity={0.8}
        >
          <Plus size={14} color="#ffffff" strokeWidth={2.5} />
          <Text style={styles.quickActionBtnPrimaryText}>{t.btn_quick_report}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.quickActionBtnSecondary}
          onPress={() => router.push('/(tabs)/safety')}
          activeOpacity={0.8}
        >
          <ShieldCheck size={14} color={Colors.primary} strokeWidth={2.2} />
          <Text style={styles.quickActionBtnSecondaryText}>{t.btn_view_safety}</Text>
        </TouchableOpacity>

        {/* View Toggle (Map vs Feed) */}
        <View style={styles.viewToggleGroup}>
          <TouchableOpacity
            style={[styles.viewToggleBtn, activeView === 'map' && styles.viewToggleBtnActive]}
            onPress={() => setActiveView('map')}
          >
            <MapPin size={14} color={activeView === 'map' ? '#ffffff' : Colors.slate500} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.viewToggleBtn, activeView === 'feed' && styles.viewToggleBtnActive]}
            onPress={() => setActiveView('feed')}
          >
            <FileText size={14} color={activeView === 'feed' ? '#ffffff' : Colors.slate500} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Main Content Area */}
      <View style={styles.content}>
        {loading ? (
          <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color={Colors.primary} />
            <Text style={styles.loadingText}>Loading groundwater surveillance data...</Text>
            <Text style={styles.loadingSubtext}>Connecting to JalaWatch cloud server...</Text>
          </View>
        ) : activeView === 'map' ? (
          <View style={styles.mapWrapper}>
            <LiveMapNative
              reports={reports}
              selectedReport={selectedReport}
              onSelectReport={setSelectedReport}
              onRefresh={onRefresh}
              refreshing={refreshing}
            />

            {/* Floating Connection Notice Card when server error */}
            {error && (
              <View style={styles.errorNoticeCard}>
                <View style={styles.errorNoticeHeader}>
                  <View style={styles.errorNoticeTitleRow}>
                    <AlertTriangle size={18} color={Colors.warning} />
                    <Text style={styles.errorNoticeTitle}>Backend Connection Notice</Text>
                  </View>
                  <TouchableOpacity onPress={() => setError(null)}>
                    <X size={16} color={Colors.slate400} />
                  </TouchableOpacity>
                </View>

                <ScrollView style={styles.errorScrollArea}>
                  <Text style={styles.errorNoticeDesc}>{error}</Text>
                </ScrollView>

                <View style={styles.noticeActionRow}>
                  <TouchableOpacity
                    style={[styles.retryBtn, retrying && styles.retryBtnDisabled]}
                    onPress={() => loadData(true)}
                    disabled={retrying}
                    activeOpacity={0.8}
                  >
                    {retrying ? (
                      <ActivityIndicator size="small" color="#ffffff" />
                    ) : (
                      <RefreshCw size={13} color="#ffffff" />
                    )}
                    <Text style={styles.retryBtnText}>
                      {retrying ? 'Connecting...' : 'Retry Connection'}
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.configToggleBtn}
                    onPress={() => {
                      setCustomUrlInput(getApiBaseUrl());
                      setShowConfig(true);
                    }}
                    activeOpacity={0.8}
                  >
                    <Settings size={13} color={Colors.primary} />
                    <Text style={styles.configToggleBtnText}>Server</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {/* Bottom Sheet for Selected Map Report */}
            {selectedReport && (
              <ReportDetailsSheet
                report={selectedReport}
                onClose={() => setSelectedReport(null)}
                onNavigateSafety={() => router.push('/(tabs)/safety')}
                initialExpanded={false}
              />
            )}
          </View>
        ) : (
          /* Recent Observations Feed View */
          <ScrollView
            style={styles.feedScroll}
            contentContainerStyle={styles.feedContent}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          >
            <View style={styles.feedHeaderRow}>
              <Text style={styles.feedSectionTitle}>{t.recent_reports}</Text>
              <TouchableOpacity onPress={() => router.push('/(tabs)/reports')}>
                <Text style={styles.viewAllText}>View All ({reports.length}) →</Text>
              </TouchableOpacity>
            </View>

            {reports.map((report) => (
              <TouchableOpacity
                key={report.id}
                style={styles.feedCard}
                onPress={() => {
                  setSelectedReport(report);
                  setActiveView('map');
                }}
                activeOpacity={0.8}
              >
                <View style={styles.feedCardTop}>
                  <View style={styles.feedIdGroup}>
                    <Text style={styles.feedId}>{report.id}</Text>
                    {report.is_verified && (
                      <View style={styles.verifiedBadge}>
                        <Check size={10} color="#ffffff" />
                        <Text style={styles.verifiedBadgeText}>Verified</Text>
                      </View>
                    )}
                  </View>
                  <View
                    style={[
                      styles.statusPill,
                      report.status === 'Resolved'
                        ? { backgroundColor: Colors.successBg }
                        : report.status === 'Under Review'
                          ? { backgroundColor: Colors.warningBg }
                          : { backgroundColor: Colors.primaryBg },
                    ]}
                  >
                    <Text
                      style={[
                        styles.statusPillText,
                        report.status === 'Resolved'
                          ? { color: Colors.success }
                          : report.status === 'Under Review'
                            ? { color: Colors.warning }
                            : { color: Colors.primary },
                      ]}
                    >
                      {report.status}
                    </Text>
                  </View>
                </View>

                <Text style={styles.feedCategory}>{report.category}</Text>
                <Text style={styles.feedDesc} numberOfLines={2}>
                  {report.description}
                </Text>

                <View style={styles.feedMetaRow}>
                  <Text style={styles.feedMetaText}>📍 {report.village}</Text>
                  <Text style={styles.feedMetaText}>📅 {report.date_observed}</Text>
                  {report.priority && (
                    <Text
                      style={[
                        styles.feedPriorityText,
                        report.priority === 'Urgent'
                          ? { color: Colors.danger }
                          : report.priority === 'High'
                            ? { color: Colors.warning }
                            : { color: Colors.slate600 },
                      ]}
                    >
                      ⚡ {report.priority}
                    </Text>
                  )}
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}
      </View>
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
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  brandTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.navy,
  },
  cspPill: {
    backgroundColor: Colors.primaryBg,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    marginLeft: 6,
  },
  cspPillText: {
    fontSize: 9,
    fontWeight: '800',
    color: Colors.primary,
  },
  brandSubtitle: {
    fontSize: 11,
    color: Colors.slate500,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  langPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primaryBg,
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 14,
  },
  langPillText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.primary,
    marginLeft: 4,
  },
  headerReportBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
    gap: 4,
  },
  headerReportText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
  },
  kpiContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    backgroundColor: '#F8FAFC',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  kpiItem: {
    alignItems: 'center',
    paddingHorizontal: 6,
  },
  kpiValue: {
    fontSize: 15,
    fontWeight: '800',
    color: Colors.primary,
  },
  kpiLabel: {
    fontSize: 9,
    fontWeight: '600',
    color: Colors.slate500,
    marginTop: 1,
  },
  kpiDivider: {
    width: 1,
    height: 22,
    backgroundColor: '#E2E8F0',
  },
  quickActionBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    gap: 8,
  },
  quickActionBtnPrimary: {
    flex: 1.2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 10,
    gap: 6,
  },
  quickActionBtnPrimaryText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '700',
  },
  quickActionBtnSecondary: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primaryBg,
    paddingVertical: 8,
    paddingHorizontal: 8,
    borderRadius: 10,
    gap: 4,
  },
  quickActionBtnSecondaryText: {
    color: Colors.primary,
    fontSize: 11,
    fontWeight: '700',
  },
  viewToggleGroup: {
    flexDirection: 'row',
    backgroundColor: '#F1F5F9',
    borderRadius: 8,
    padding: 2,
  },
  viewToggleBtn: {
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 6,
  },
  viewToggleBtnActive: {
    backgroundColor: Colors.primary,
  },
  content: {
    flex: 1,
    position: 'relative',
  },
  mapWrapper: {
    flex: 1,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    fontWeight: '700',
    color: Colors.navy,
  },
  loadingSubtext: {
    marginTop: 4,
    fontSize: 12,
    color: Colors.slate400,
  },
  errorNoticeCard: {
    position: 'absolute',
    top: 10,
    left: 12,
    right: 12,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#FED7AA',
    ...Shadows.card,
    zIndex: 100,
  },
  errorNoticeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  errorNoticeTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  errorNoticeTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.navy,
  },
  errorScrollArea: {
    maxHeight: 60,
    marginBottom: 8,
  },
  errorNoticeDesc: {
    fontSize: 11,
    color: Colors.slate600,
    lineHeight: 15,
  },
  noticeActionRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
  },
  retryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 6,
  },
  retryBtnDisabled: {
    opacity: 0.65,
  },
  retryBtnText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '700',
  },
  configToggleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primaryBg,
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 4,
  },
  configToggleBtnText: {
    color: Colors.primary,
    fontSize: 11,
    fontWeight: '700',
  },
  // Feed Styles
  feedScroll: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  feedContent: {
    padding: 16,
    paddingBottom: 30,
  },
  feedHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  feedSectionTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: Colors.navy,
  },
  viewAllText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.primary,
  },
  feedCard: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    ...Shadows.card,
  },
  feedCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  feedIdGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  feedId: {
    fontSize: 12,
    fontWeight: '800',
    color: Colors.navy,
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary,
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 6,
    gap: 2,
  },
  verifiedBadgeText: {
    color: '#ffffff',
    fontSize: 9,
    fontWeight: '700',
  },
  statusPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  statusPillText: {
    fontSize: 10,
    fontWeight: '700',
  },
  feedCategory: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.slate700,
    marginBottom: 4,
  },
  feedDesc: {
    fontSize: 12,
    color: Colors.slate500,
    lineHeight: 16,
    marginBottom: 8,
  },
  feedMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingTop: 8,
  },
  feedMetaText: {
    fontSize: 11,
    color: Colors.slate500,
  },
  feedPriorityText: {
    fontSize: 11,
    fontWeight: '700',
  },
});
