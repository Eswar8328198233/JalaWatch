import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  View, Text, StyleSheet, TouchableOpacity, ScrollView, 
  ActivityIndicator, RefreshControl, Platform, TextInput 
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { 
  Droplets, AlertTriangle, ShieldCheck, FileText, 
  MapPin, Plus, RefreshCw, Settings, Check, X 
} from 'lucide-react-native';
import { Colors, Shadows } from '../../constants/theme';
import { fetchReports, Report, setApiBaseUrl, getApiBaseUrl } from '../../services/api';
import LiveMapNative from '../../components/LiveMapNative';
import ReportDetailsSheet from '../../components/ReportDetailsSheet';

export default function LiveMapScreen() {
  const router = useRouter();
  const [reports, setReports] = useState<Report[]>([]);
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [retrying, setRetrying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showConfig, setShowConfig] = useState(false);
  const [customUrlInput, setCustomUrlInput] = useState(getApiBaseUrl());
  const initialSelectDoneRef = useRef(false);

  const loadData = useCallback(async (isRetry = false) => {
    if (isRetry) {
      setRetrying(true);
    }
    try {
      setError(null);
      const data = await fetchReports({ limit: 50 });
      setReports(data);
      // On initial app launch, auto-select first report in collapsed preview
      if (data.length > 0 && !initialSelectDoneRef.current) {
        initialSelectDoneRef.current = true;
        setSelectedReport(data[0]);
      }
    } catch (err: any) {
      console.warn('Load reports error:', err.message);
      setError(err.message || 'Could not connect to JalaWatch server. Check if backend is running.');
    } finally {
      setLoading(false);
      setRefreshing(false);
      setRetrying(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const onRefresh = () => {
    setRefreshing(true);
    loadData(true);
  };

  const handleCardPress = (report: Report) => {
    setSelectedReport(report);
  };

  const handleNavigateSafety = () => {
    setSelectedReport(null);
    router.push('/(tabs)/safety');
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
      
      {/* Compact White Header (Matching Reference Image 3) */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.logoCircle}>
            <Droplets size={16} color="#ffffff" strokeWidth={2.5} />
          </View>
          <View>
            <View style={styles.titleRow}>
              <Text style={styles.brandTitle}>JalaWatch</Text>
              <View style={styles.cspPill}>
                <Text style={styles.cspPillText}>NUTAKKI CSP</Text>
              </View>
            </View>
            <Text style={styles.brandSubtitle}>Groundwater & Seepage Monitor</Text>
          </View>
        </View>

        <TouchableOpacity 
          style={styles.headerReportBtn} 
          onPress={() => router.push('/(tabs)/report')}
          activeOpacity={0.8}
        >
          <Plus size={14} color="#ffffff" strokeWidth={3} />
          <Text style={styles.headerReportText}>Report</Text>
        </TouchableOpacity>
      </View>

      {/* Main Content Area */}
      <View style={styles.content}>
        {loading ? (
          <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color={Colors.primary} />
            <Text style={styles.loadingText}>Loading groundwater observations...</Text>
          </View>
        ) : (
          <View style={styles.mapWrapper}>
            {/* Native Interactive Map (loads independently of backend) */}
            <LiveMapNative
              reports={reports}
              selectedReport={selectedReport}
              onSelectReport={setSelectedReport}
              onRefresh={onRefresh}
              refreshing={refreshing}
            />

            {/* Floating Connection Notice Card when server is offline */}
            {error && (
              <View style={styles.errorNoticeCard}>
                <View style={styles.errorNoticeHeader}>
                  <View style={styles.errorNoticeTitleRow}>
                    <AlertTriangle size={18} color={Colors.warning} />
                    <Text style={styles.errorNoticeTitle}>Backend Connection Notice</Text>
                  </View>
                  <TouchableOpacity 
                    onPress={() => setError(null)} 
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <X size={16} color={Colors.slate400} />
                  </TouchableOpacity>
                </View>

                <ScrollView style={styles.errorScrollArea} showsVerticalScrollIndicator={true}>
                  <Text style={styles.errorNoticeDesc}>{error}</Text>
                </ScrollView>

                {showConfig ? (
                  <View style={styles.customUrlBox}>
                    <Text style={styles.customUrlLabel}>Laptop IP or Online Backend URL:</Text>
                    <TextInput
                      style={styles.customUrlInput}
                      value={customUrlInput}
                      onChangeText={setCustomUrlInput}
                      placeholder="e.g. http://192.168.x.x:5000 or https://..."
                      placeholderTextColor={Colors.slate400}
                      autoCapitalize="none"
                      autoCorrect={false}
                    />
                    <View style={styles.customUrlBtnRow}>
                      <TouchableOpacity
                        style={styles.saveUrlBtn}
                        onPress={handleSaveCustomUrl}
                      >
                        <Check size={14} color="#ffffff" />
                        <Text style={styles.saveUrlBtnText}>Save & Connect</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.cancelUrlBtn}
                        onPress={() => setShowConfig(false)}
                      >
                        <Text style={styles.cancelUrlBtnText}>Cancel</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ) : (
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
                      <Settings size={13} color={Colors.primaryDark} />
                      <Text style={styles.configToggleText}>Change URL / IP</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            )}

            {/* Floating White Report-Details Bottom Sheet */}
            {selectedReport && (
              <View style={styles.sheetOverlay} pointerEvents="box-none">
                <ReportDetailsSheet
                  report={selectedReport}
                  onClose={() => setSelectedReport(null)}
                  onNavigateSafety={handleNavigateSafety}
                />
              </View>
            )}
          </View>
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
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  logoCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  brandTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: Colors.slate900,
  },
  cspPill: {
    backgroundColor: Colors.mint100,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 100,
  },
  cspPillText: {
    fontSize: 8,
    fontWeight: '800',
    color: Colors.mint700,
    letterSpacing: 0.5,
  },
  brandSubtitle: {
    fontSize: 10,
    color: Colors.slate400,
    fontWeight: '600',
  },
  headerReportBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 100,
    ...Shadows.pill,
  },
  headerReportText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '800',
  },
  content: {
    flex: 1,
    position: 'relative',
    backgroundColor: '#e2f1f1',
  },
  mapWrapper: {
    flex: 1,
    position: 'relative',
  },
  sheetOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    justifyContent: 'flex-end',
    zIndex: 100,
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    gap: 8,
    backgroundColor: '#ffffff',
  },
  loadingText: {
    fontSize: 12,
    color: Colors.slate500,
    fontWeight: '600',
    marginTop: 8,
  },
  errorTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.slate800,
    marginTop: 4,
  },
  errorSubtitle: {
    fontSize: 12,
    color: Colors.slate500,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 8,
  },
  retryBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: Colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 10,
  },
  retryBtnDisabled: {
    opacity: 0.7,
  },
  retryBtnText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
  },
  errorNoticeCard: {
    position: 'absolute',
    bottom: 24,
    left: 14,
    right: 14,
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#fed7aa',
    zIndex: 110,
    ...Shadows.float,
    gap: 8,
    maxHeight: 280,
  },
  errorNoticeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  errorNoticeTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  errorNoticeTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: Colors.slate800,
  },
  errorScrollArea: {
    maxHeight: 110,
  },
  errorNoticeDesc: {
    fontSize: 11,
    color: Colors.slate600,
    lineHeight: 16,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  noticeActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
  },
  configToggleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: Colors.primaryBg,
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#cbd5e1',
  },
  configToggleText: {
    color: Colors.primaryDark,
    fontSize: 11,
    fontWeight: '700',
  },
  customUrlBox: {
    marginTop: 4,
    gap: 6,
  },
  customUrlLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.slate700,
  },
  customUrlInput: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 7,
    fontSize: 12,
    color: Colors.slate800,
  },
  customUrlBtnRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 2,
  },
  saveUrlBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    backgroundColor: Colors.primary,
    paddingVertical: 8,
    borderRadius: 8,
  },
  saveUrlBtnText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
  },
  cancelUrlBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelUrlBtnText: {
    color: Colors.slate500,
    fontSize: 12,
    fontWeight: '600',
  },
});
