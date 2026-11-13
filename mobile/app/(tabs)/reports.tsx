import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  RefreshControl,
  Image,
  Modal,
  ScrollView,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Search,
  Filter,
  MapPin,
  Calendar,
  AlertTriangle,
  CheckCircle,
  Clock,
  Droplets,
  ChevronRight,
  X,
  ShieldAlert,
  Globe,
  Sparkles,
  ExternalLink,
  Check,
  Layers,
  FileText,
} from 'lucide-react-native';
import { Colors, Shadows } from '../../constants/theme';
import { fetchReports, Report, getFullPhotoUrl } from '../../services/api';
import {
  translations,
  LanguageCode,
  getSavedLanguage,
  saveLanguage,
} from '../../constants/translations';

export default function ReportsScreen() {
  // Language state
  const [lang, setLang] = useState<LanguageCode>('en');
  const t = translations[lang];

  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Filters
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedVillage, setSelectedVillage] = useState('All');
  const [selectedPriority, setSelectedPriority] = useState('All');
  const [selectedStatus, setSelectedStatus] = useState('All');

  // Detail Modal
  const [activeReport, setActiveReport] = useState<Report | null>(null);

  const categories = [
    'All',
    'Unusual water colour',
    'Bad smell or taste',
    'Drainage problems',
    'Suspected waste dumping',
    'Leaking pipes',
    'Agricultural runoff',
  ];

  const villages = ['All', 'Nutakki', 'Tadepalli Rural', 'Mangalagiri Rural'];
  const priorities = ['All', 'Urgent', 'High', 'Medium', 'Low'];
  const statuses = ['All', 'Submitted', 'Under Review', 'Resolved'];

  const loadReports = useCallback(async () => {
    try {
      const data = await fetchReports({
        search,
        category: selectedCategory,
        village: selectedVillage,
        priority: selectedPriority,
        status: selectedStatus,
        limit: 50,
      });
      setReports(data);
    } catch (err: any) {
      console.warn('Reports load error:', err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [search, selectedCategory, selectedVillage, selectedPriority, selectedStatus]);

  useEffect(() => {
    getSavedLanguage().then((l) => setLang(l));
    loadReports();
  }, [loadReports]);

  const onRefresh = () => {
    setRefreshing(true);
    loadReports();
  };

  const handleToggleLang = async () => {
    const nextLang: LanguageCode = lang === 'en' ? 'te' : 'en';
    setLang(nextLang);
    await saveLanguage(nextLang);
  };

  const renderReportItem = ({ item }: { item: Report }) => {
    const isUnderReview = item.status === 'Under Review';
    const isResolved = item.status === 'Resolved';

    let statusBg = Colors.primaryBg;
    let statusColor = Colors.primary;
    let StatusIcon = Droplets;

    if (isUnderReview) {
      statusBg = Colors.warningBg;
      statusColor = Colors.warning;
      StatusIcon = Clock;
    } else if (isResolved) {
      statusBg = Colors.successBg;
      statusColor = Colors.success;
      StatusIcon = CheckCircle;
    }

    const photoUrl = getFullPhotoUrl(item.photo_url);

    return (
      <TouchableOpacity
        style={styles.card}
        activeOpacity={0.8}
        onPress={() => setActiveReport(item)}
      >
        <View style={styles.cardHeader}>
          <View style={styles.idContainer}>
            <Text style={styles.idText}>{item.id}</Text>
            {item.is_verified ? (
              <View style={styles.verifiedBadge}>
                <Check size={9} color="#ffffff" strokeWidth={3} />
                <Text style={styles.verifiedBadgeText}>Lab Verified</Text>
              </View>
            ) : (
              <View style={styles.unverifiedBadge}>
                <Text style={styles.unverifiedBadgeText}>Community</Text>
              </View>
            )}
          </View>

          <View style={[styles.statusPill, { backgroundColor: statusBg }]}>
            <StatusIcon size={11} color={statusColor} />
            <Text style={[styles.statusText, { color: statusColor }]}>{item.status}</Text>
          </View>
        </View>

        <Text style={styles.cardCategory}>{item.category}</Text>

        <Text style={styles.cardTitle} numberOfLines={2}>
          {item.landmark ? item.landmark : `${item.category} in ${item.village}`}
        </Text>

        <Text style={styles.cardDesc} numberOfLines={2}>
          {item.description}
        </Text>

        {photoUrl && (
          <Image source={{ uri: photoUrl }} style={styles.cardThumbnail} resizeMode="cover" />
        )}

        <View style={styles.metaRow}>
          <View style={styles.metaItem}>
            <MapPin size={12} color={Colors.primary} />
            <Text style={styles.metaText}>{item.village}</Text>
          </View>

          <View style={styles.metaItem}>
            <Calendar size={12} color={Colors.slate400} />
            <Text style={styles.metaText}>{item.date_observed}</Text>
          </View>

          {item.priority && (
            <View
              style={[
                styles.priorityBadge,
                item.priority === 'Urgent'
                  ? { backgroundColor: Colors.dangerBg }
                  : item.priority === 'High'
                  ? { backgroundColor: Colors.warningBg }
                  : { backgroundColor: '#F1F5F9' },
              ]}
            >
              <Text
                style={[
                  styles.priorityBadgeText,
                  item.priority === 'Urgent'
                    ? { color: Colors.danger }
                    : item.priority === 'High'
                    ? { color: Colors.warning }
                    : { color: Colors.slate600 },
                ]}
              >
                {item.priority}
              </Text>
            </View>
          )}

          <ChevronRight size={14} color={Colors.slate400} style={{ marginLeft: 'auto' }} />
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      {/* Top Header */}
      <View style={styles.header}>
        <View style={styles.headerTitleGroup}>
          <Text style={styles.headerTitle}>{t.tab_reports}</Text>
          <View style={styles.countBadge}>
            <Text style={styles.countBadgeText}>{reports.length}</Text>
          </View>
        </View>

        <TouchableOpacity
          style={styles.langPill}
          onPress={handleToggleLang}
          activeOpacity={0.8}
        >
          <Globe size={13} color={Colors.primary} />
          <Text style={styles.langPillText}>{t.lang_toggle}</Text>
        </TouchableOpacity>
      </View>

      {/* Search Input */}
      <View style={styles.searchBar}>
        <Search size={16} color={Colors.slate400} style={{ marginRight: 8 }} />
        <TextInput
          style={styles.searchInput}
          value={search}
          onChangeText={setSearch}
          placeholder="Search by ID, landmark, or description..."
          placeholderTextColor={Colors.slate400}
        />
        {search ? (
          <TouchableOpacity onPress={() => setSearch('')}>
            <X size={16} color={Colors.slate400} />
          </TouchableOpacity>
        ) : null}
      </View>

      {/* Filter Horizontal Scroll */}
      <View style={styles.filterSection}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterRow}>
          {/* Status Filter Chips */}
          {statuses.map((st) => (
            <TouchableOpacity
              key={st}
              style={[styles.filterChip, selectedStatus === st && styles.filterChipActive]}
              onPress={() => setSelectedStatus(st)}
            >
              <Text style={[styles.filterChipText, selectedStatus === st && styles.filterChipTextActive]}>
                {st}
              </Text>
            </TouchableOpacity>
          ))}

          {/* Priority Filter Chips */}
          {priorities.filter((p) => p !== 'All').map((p) => (
            <TouchableOpacity
              key={`p-${p}`}
              style={[styles.filterChip, selectedPriority === p && styles.filterChipActive]}
              onPress={() => setSelectedPriority(selectedPriority === p ? 'All' : p)}
            >
              <Text style={[styles.filterChipText, selectedPriority === p && styles.filterChipTextActive]}>
                ⚡ {p}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Report List */}
      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Loading reports...</Text>
        </View>
      ) : (
        <FlatList
          data={reports}
          keyExtractor={(item) => item.id}
          renderItem={renderReportItem}
          contentContainerStyle={styles.listContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <AlertTriangle size={36} color={Colors.slate300} />
              <Text style={styles.emptyText}>No reports match your filters</Text>
              <TouchableOpacity
                style={styles.clearFilterBtn}
                onPress={() => {
                  setSearch('');
                  setSelectedCategory('All');
                  setSelectedVillage('All');
                  setSelectedPriority('All');
                  setSelectedStatus('All');
                }}
              >
                <Text style={styles.clearFilterBtnText}>Reset All Filters</Text>
              </TouchableOpacity>
            </View>
          }
        />
      )}

      {/* FULL REPORT DETAILS MODAL */}
      <Modal
        visible={Boolean(activeReport)}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setActiveReport(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            {activeReport && (
              <>
                <View style={styles.modalHeader}>
                  <View>
                    <View style={styles.modalIdRow}>
                      <Text style={styles.modalIdText}>{activeReport.id}</Text>
                      {activeReport.is_verified && (
                        <View style={styles.verifiedBadge}>
                          <Check size={10} color="#ffffff" strokeWidth={3} />
                          <Text style={styles.verifiedBadgeText}>Tested & Certified</Text>
                        </View>
                      )}
                    </View>
                    <Text style={styles.modalCategory}>{activeReport.category}</Text>
                  </View>
                  <TouchableOpacity onPress={() => setActiveReport(null)}>
                    <X size={22} color={Colors.slate500} />
                  </TouchableOpacity>
                </View>

                <ScrollView style={styles.modalScroll} showsVerticalScrollIndicator={true}>
                  {/* Evidence Photo */}
                  {activeReport.photo_url && (
                    <View style={styles.modalPhotoBox}>
                      <Image
                        source={{ uri: getFullPhotoUrl(activeReport.photo_url)! }}
                        style={styles.modalPhoto}
                        resizeMode="cover"
                      />
                    </View>
                  )}

                  {/* Location & Meta Card */}
                  <View style={styles.modalSectionCard}>
                    <Text style={styles.modalSectionTitle}>Location & Date</Text>
                    <Text style={styles.modalDetailText}>📍 Village: <Text style={styles.bold}>{activeReport.village}</Text></Text>
                    {activeReport.district && <Text style={styles.modalDetailText}>🏛️ District: {activeReport.district}</Text>}
                    {activeReport.landmark && <Text style={styles.modalDetailText}>🏢 Landmark: {activeReport.landmark}</Text>}
                    <Text style={styles.modalDetailText}>📅 Date Observed: {activeReport.date_observed}</Text>
                    <Text style={styles.modalDetailText}>🚰 Water Source: {activeReport.water_source || 'Borewell'}</Text>
                    {activeReport.latitude && activeReport.longitude && (
                      <TouchableOpacity
                        style={styles.openMapLink}
                        onPress={() => {
                          const url = `https://www.google.com/maps/search/?api=1&query=${activeReport.latitude},${activeReport.longitude}`;
                          Linking.openURL(url);
                        }}
                      >
                        <ExternalLink size={13} color={Colors.primary} />
                        <Text style={styles.openMapLinkText}>
                          View on Google Maps ({activeReport.latitude.toFixed(4)}°, {activeReport.longitude.toFixed(4)}°)
                        </Text>
                      </TouchableOpacity>
                    )}
                  </View>

                  {/* Citizen Description */}
                  <View style={styles.modalSectionCard}>
                    <Text style={styles.modalSectionTitle}>Citizen Observation</Text>
                    <Text style={styles.modalDesc}>{activeReport.description}</Text>
                  </View>

                  {/* Environmental Survey Breakdown */}
                  {(activeReport.water_appearance || activeReport.water_smell || activeReport.water_usage) && (
                    <View style={styles.modalSectionCard}>
                      <Text style={styles.modalSectionTitle}>Environmental Survey Data</Text>
                      {activeReport.water_appearance && (
                        <Text style={styles.modalDetailText}>👁️ Appearance: <Text style={styles.bold}>{activeReport.water_appearance}</Text></Text>
                      )}
                      {activeReport.water_smell && (
                        <Text style={styles.modalDetailText}>👃 Odor: <Text style={styles.bold}>{activeReport.water_smell}</Text></Text>
                      )}
                      {activeReport.water_usage && (
                        <Text style={styles.modalDetailText}>💧 Usage: {activeReport.water_usage}</Text>
                      )}
                      {activeReport.issue_duration && (
                        <Text style={styles.modalDetailText}>⏱️ Duration: {activeReport.issue_duration}</Text>
                      )}
                      {activeReport.nearby_wastewater && (
                        <Text style={styles.modalDetailText}>☣️ Wastewater Source: {activeReport.nearby_wastewater}</Text>
                      )}
                      {activeReport.suspected_distance && (
                        <Text style={styles.modalDetailText}>📏 Distance to Drain: {activeReport.suspected_distance}</Text>
                      )}
                      {activeReport.priority && (
                        <Text style={styles.modalDetailText}>⚡ Citizen Priority: <Text style={styles.bold}>{activeReport.priority}</Text></Text>
                      )}
                    </View>
                  )}

                  {/* Certified Lab Test Results (if available) */}
                  {(activeReport.ph !== undefined || activeReport.tds !== undefined || activeReport.is_verified) && (
                    <View style={[styles.modalSectionCard, { backgroundColor: '#F0FDF4', borderColor: '#BBF7D0' }]}>
                      <View style={styles.labHeaderRow}>
                        <ShieldAlert size={16} color={Colors.success} />
                        <Text style={[styles.modalSectionTitle, { color: Colors.success, marginBottom: 0 }]}>
                          Certified Laboratory Analysis
                        </Text>
                      </View>
                      {activeReport.report_reference_no && (
                        <Text style={styles.modalDetailText}>🔖 Ref No: <Text style={styles.bold}>{activeReport.report_reference_no}</Text></Text>
                      )}
                      {activeReport.lab_name && (
                        <Text style={styles.modalDetailText}>🔬 Lab: {activeReport.lab_name}</Text>
                      )}
                      {activeReport.sample_collection_date && (
                        <Text style={styles.modalDetailText}>🧪 Sample Collected: {activeReport.sample_collection_date}</Text>
                      )}
                      {activeReport.testing_date && (
                        <Text style={styles.modalDetailText}>📋 Tested: {activeReport.testing_date}</Text>
                      )}

                      {/* Lab Parameter Grid */}
                      <View style={styles.labGrid}>
                        {activeReport.ph !== undefined && (
                          <View style={styles.labGridItem}>
                            <Text style={styles.labGridLabel}>pH</Text>
                            <Text style={styles.labGridValue}>{activeReport.ph}</Text>
                          </View>
                        )}
                        {activeReport.tds !== undefined && (
                          <View style={styles.labGridItem}>
                            <Text style={styles.labGridLabel}>TDS (mg/L)</Text>
                            <Text style={styles.labGridValue}>{activeReport.tds}</Text>
                          </View>
                        )}
                        {activeReport.fluoride !== undefined && (
                          <View style={styles.labGridItem}>
                            <Text style={styles.labGridLabel}>Fluoride</Text>
                            <Text style={styles.labGridValue}>{activeReport.fluoride}</Text>
                          </View>
                        )}
                        {activeReport.nitrate !== undefined && (
                          <View style={styles.labGridItem}>
                            <Text style={styles.labGridLabel}>Nitrate</Text>
                            <Text style={styles.labGridValue}>{activeReport.nitrate}</Text>
                          </View>
                        )}
                        {activeReport.e_coli && (
                          <View style={styles.labGridItem}>
                            <Text style={styles.labGridLabel}>E. coli</Text>
                            <Text style={styles.labGridValue}>{activeReport.e_coli}</Text>
                          </View>
                        )}
                      </View>

                      {activeReport.lab_notes && (
                        <Text style={[styles.modalDesc, { marginTop: 8, fontStyle: 'italic' }]}>
                          Notes: {activeReport.lab_notes}
                        </Text>
                      )}
                    </View>
                  )}
                </ScrollView>
              </>
            )}
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
  countBadge: {
    backgroundColor: Colors.primaryBg,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  countBadgeText: {
    fontSize: 11,
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
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    marginHorizontal: 16,
    marginTop: 10,
    marginBottom: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: Colors.navy,
  },
  filterSection: {
    paddingHorizontal: 12,
    paddingBottom: 8,
  },
  filterRow: {
    flexDirection: 'row',
  },
  filterChip: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 6,
  },
  filterChipActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  filterChipText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.slate600,
  },
  filterChipTextActive: {
    color: '#ffffff',
  },
  listContent: {
    padding: 16,
    paddingTop: 8,
    paddingBottom: 30,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    ...Shadows.card,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  idContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  idText: {
    fontSize: 13,
    fontWeight: '800',
    color: Colors.navy,
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    gap: 3,
  },
  verifiedBadgeText: {
    color: '#ffffff',
    fontSize: 9,
    fontWeight: '800',
  },
  unverifiedBadge: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  unverifiedBadgeText: {
    color: Colors.slate500,
    fontSize: 9,
    fontWeight: '700',
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    gap: 4,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '700',
  },
  cardCategory: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.slate700,
    marginBottom: 4,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: Colors.navy,
    marginBottom: 4,
  },
  cardDesc: {
    fontSize: 12,
    color: Colors.slate500,
    lineHeight: 16,
    marginBottom: 8,
  },
  cardThumbnail: {
    width: '100%',
    height: 140,
    borderRadius: 8,
    marginBottom: 8,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingTop: 8,
    gap: 12,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: 11,
    color: Colors.slate600,
  },
  priorityBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  priorityBadgeText: {
    fontSize: 10,
    fontWeight: '800',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 13,
    color: Colors.slate500,
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
    gap: 10,
  },
  emptyText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.slate500,
  },
  clearFilterBtn: {
    backgroundColor: Colors.primaryBg,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  clearFilterBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.primary,
  },
  // Modal Styles
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
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  modalIdRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  modalIdText: {
    fontSize: 16,
    fontWeight: '900',
    color: Colors.navy,
  },
  modalCategory: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.slate500,
    marginTop: 2,
  },
  modalScroll: {
    marginVertical: 12,
  },
  modalPhotoBox: {
    marginBottom: 12,
  },
  modalPhoto: {
    width: '100%',
    height: 200,
    borderRadius: 12,
  },
  modalSectionCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  modalSectionTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: Colors.navy,
    marginBottom: 6,
  },
  modalDetailText: {
    fontSize: 12,
    color: Colors.slate600,
    marginBottom: 4,
  },
  bold: {
    fontWeight: '700',
    color: Colors.navy,
  },
  modalDesc: {
    fontSize: 12,
    color: Colors.slate600,
    lineHeight: 18,
  },
  openMapLink: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
    gap: 6,
  },
  openMapLinkText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.primary,
  },
  labHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  labGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
  },
  labGridItem: {
    backgroundColor: '#ffffff',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#BBF7D0',
    alignItems: 'center',
    minWidth: 70,
  },
  labGridLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: Colors.slate500,
  },
  labGridValue: {
    fontSize: 13,
    fontWeight: '800',
    color: Colors.success,
  },
});
