import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Share,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  ArrowLeft,
  MapPin,
  Calendar,
  AlertTriangle,
  ShieldCheck,
  CheckCircle,
  Share2,
  Droplets,
  ExternalLink,
  ChevronRight,
  User,
} from 'lucide-react-native';
import { Colors, Shadows } from '../../constants/theme';
import { fetchReportById, Report, getFullPhotoUrl } from '../../services/api';

export default function ReportDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [report, setReport] = useState<Report | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    loadReport();
  }, [id]);

  const loadReport = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchReportById(id as string);
      setReport(data);
    } catch (err: any) {
      setError(err.message || 'Could not load report details');
    } finally {
      setLoading(false);
    }
  };

  const handleShare = async () => {
    if (!report) return;
    try {
      await Share.share({
        title: `JalaWatch Report ${report.id}`,
        message: `[JalaWatch Unverified Observation]\nReport ID: ${report.id}\nLocation: ${report.village}${report.landmark ? `, ${report.landmark}` : ''}\nCategory: ${report.category}\nStatus: ${report.status}\n\nObservation: ${report.description}`,
      });
    } catch {
      // ignore
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Resolved':
        return { bg: Colors.successBg, border: Colors.successBorder, text: Colors.success, label: 'Resolved' };
      case 'Under Review':
        return { bg: Colors.warningBg, border: Colors.warningBorder, text: Colors.warning, label: 'Under Review' };
      default:
        return { bg: Colors.primaryBg, border: Colors.primaryBorder, text: Colors.primaryDark, label: 'Submitted' };
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      {/* Top Header Bar */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <ArrowLeft size={20} color={Colors.slate800} strokeWidth={2.4} />
        </TouchableOpacity>

        <View style={styles.headerTitleBox}>
          <Text style={styles.headerTitle}>{id || 'Report Details'}</Text>
          <Text style={styles.headerSubtitle}>Community Field Observation</Text>
        </View>

        <TouchableOpacity
          style={styles.shareButton}
          onPress={handleShare}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Share2 size={18} color={Colors.primary} strokeWidth={2.2} />
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Loading observation details...</Text>
        </View>
      ) : error || !report ? (
        <View style={styles.centerContainer}>
          <AlertTriangle size={42} color={Colors.warning} />
          <Text style={styles.errorTitle}>Report Not Found</Text>
          <Text style={styles.errorDesc}>{error || 'The requested observation could not be located.'}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={loadReport}>
            <Text style={styles.retryBtnText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView
          style={styles.container}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Unverified Observation Banner */}
          <View style={styles.unverifiedBanner}>
            <AlertTriangle size={16} color={Colors.warning} />
            <Text style={styles.unverifiedBannerText}>
              UNVERIFIED COMMUNITY REPORT • CITIZEN OBSERVATION
            </Text>
          </View>

          {/* Main Info Card */}
          <View style={styles.card}>
            <View style={styles.idRow}>
              <View>
                <Text style={styles.reportIdText}>{report.id}</Text>
                <Text style={styles.categoryText}>{report.category}</Text>
              </View>

              {(() => {
                const s = getStatusBadge(report.status);
                return (
                  <View style={[styles.statusBadge, { backgroundColor: s.bg, borderColor: s.border }]}>
                    <View style={[styles.statusDot, { backgroundColor: s.text }]} />
                    <Text style={[styles.statusBadgeText, { color: s.text }]}>{s.label}</Text>
                  </View>
                );
              })()}
            </View>

            {/* Metadata Chips */}
            <View style={styles.metaRow}>
              <View style={styles.metaItem}>
                <MapPin size={14} color={Colors.primary} />
                <Text style={styles.metaItemText}>
                  {report.village}{report.landmark ? `, ${report.landmark}` : ''}
                </Text>
              </View>

              <View style={styles.metaItem}>
                <Calendar size={14} color={Colors.slate400} />
                <Text style={styles.metaItemText}>{report.date_observed}</Text>
              </View>
            </View>

            {report.water_source ? (
              <View style={styles.waterSourceBox}>
                <Droplets size={14} color={Colors.primaryDark} />
                <Text style={styles.waterSourceText}>Water Source: {report.water_source}</Text>
              </View>
            ) : null}

            {/* Coordinates Pill */}
            {report.latitude && report.longitude ? (
              <View style={styles.gpsPill}>
                <Text style={styles.gpsPillText}>
                  GPS: {report.latitude.toFixed(5)}° N, {report.longitude.toFixed(5)}° E
                </Text>
              </View>
            ) : null}
          </View>

          {/* Description Section */}
          <View style={styles.card}>
            <Text style={styles.sectionHeader}>Description & Symptoms</Text>
            <Text style={styles.descriptionText}>{report.description}</Text>

            <View style={styles.reporterInfoRow}>
              <User size={13} color={Colors.slate400} />
              <Text style={styles.reporterInfoText}>
                Observed by: {report.reporter_name || 'Anonymous Community Member'}
              </Text>
            </View>
          </View>

          {/* Photo Proof */}
          {report.photo_url ? (
            <View style={styles.card}>
              <Text style={styles.sectionHeader}>Uploaded Field Evidence</Text>
              <Image
                source={{ uri: getFullPhotoUrl(report.photo_url)! }}
                style={styles.evidenceImage}
                resizeMode="cover"
              />
              <Text style={styles.photoCaption}>
                Attached photographic proof from Nutakki field inspection
              </Text>
            </View>
          ) : null}

          {/* Scientific Disclaimer Card */}
          <View style={styles.scientificCard}>
            <View style={styles.scientificHeader}>
              <ShieldCheck size={18} color={Colors.primary} strokeWidth={2.4} />
              <Text style={styles.scientificTitle}>Scientific Assessment Note</Text>
            </View>
            <Text style={styles.scientificBody}>
              This observation highlights suspected contamination requiring professional evaluation. Surface observations and water discoloration do not establish microbiological safety without laboratory testing.
            </Text>
            <TouchableOpacity
              style={styles.safetyLinkBtn}
              onPress={() => router.push('/(tabs)/safety')}
              activeOpacity={0.8}
            >
              <Text style={styles.safetyLinkBtnText}>View Lab Testing & Safety Protocols</Text>
              <ChevronRight size={14} color={Colors.primary} />
            </TouchableOpacity>
          </View>

          {/* Bottom Actions */}
          <TouchableOpacity
            style={styles.mapActionBtn}
            onPress={() => router.push('/(tabs)')}
            activeOpacity={0.8}
          >
            <MapPin size={16} color="#ffffff" strokeWidth={2.4} />
            <Text style={styles.mapActionBtnText}>Locate on Live Map</Text>
          </TouchableOpacity>

        </ScrollView>
      )}
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
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitleBox: {
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: Colors.slate900,
  },
  headerSubtitle: {
    fontSize: 10,
    color: Colors.slate500,
  },
  shareButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.primaryBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
    gap: 12,
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    gap: 12,
  },
  loadingText: {
    fontSize: 13,
    color: Colors.slate500,
  },
  errorTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.slate900,
  },
  errorDesc: {
    fontSize: 12,
    color: Colors.slate500,
    textAlign: 'center',
  },
  retryBtn: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 10,
    marginTop: 8,
  },
  retryBtnText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
  },
  unverifiedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: Colors.warningBg,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.warningBorder,
  },
  unverifiedBannerText: {
    fontSize: 10,
    fontWeight: '900',
    color: Colors.warning,
    letterSpacing: 0.4,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    gap: 12,
    ...Shadows.card,
  },
  idRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  reportIdText: {
    fontSize: 18,
    fontWeight: '900',
    color: Colors.slate900,
  },
  categoryText: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.primaryDark,
    marginTop: 2,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: '800',
  },
  metaRow: {
    gap: 6,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  metaItemText: {
    fontSize: 12,
    color: Colors.slate700,
    fontWeight: '500',
  },
  waterSourceBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.primaryBg,
    padding: 8,
    borderRadius: 8,
  },
  waterSourceText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.primaryDark,
  },
  gpsPill: {
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  gpsPillText: {
    fontSize: 10,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    color: Colors.slate600,
    fontWeight: '600',
  },
  sectionHeader: {
    fontSize: 13,
    fontWeight: '800',
    color: Colors.slate900,
  },
  descriptionText: {
    fontSize: 13,
    lineHeight: 20,
    color: Colors.slate700,
  },
  reporterInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  reporterInfoText: {
    fontSize: 11,
    color: Colors.slate500,
  },
  evidenceImage: {
    width: '100%',
    height: 200,
    borderRadius: 12,
    backgroundColor: '#e2e8f0',
  },
  photoCaption: {
    fontSize: 10,
    color: Colors.slate500,
    textAlign: 'center',
  },
  scientificCard: {
    backgroundColor: Colors.primaryBg,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.primaryBorder,
    gap: 8,
  },
  scientificHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  scientificTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: Colors.primaryDark,
  },
  scientificBody: {
    fontSize: 11,
    lineHeight: 16,
    color: Colors.slate700,
  },
  safetyLinkBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#ffffff',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    marginTop: 4,
  },
  safetyLinkBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.primaryDark,
  },
  mapActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.primary,
    paddingVertical: 14,
    borderRadius: 16,
    marginTop: 6,
    ...Shadows.card,
  },
  mapActionBtnText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#ffffff',
  },
});
