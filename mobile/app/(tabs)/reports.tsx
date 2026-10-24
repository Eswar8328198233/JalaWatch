import React, { useState, useEffect, useCallback } from 'react';
import { 
  View, Text, StyleSheet, FlatList, TouchableOpacity, 
  TextInput, ActivityIndicator, RefreshControl, Platform 
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { 
  Search, Filter, MapPin, Calendar, AlertTriangle, 
  CheckCircle, Clock, Droplets, ChevronRight, X, ShieldAlert 
} from 'lucide-react-native';
import { Colors, Shadows } from '../../constants/theme';
import { fetchReports, Report } from '../../services/api';
import ReportDetailsSheet from '../../components/ReportDetailsSheet';

export default function ReportsScreen() {
  const router = useRouter();
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedStatus, setSelectedStatus] = useState('All');
  const [activeReport, setActiveReport] = useState<Report | null>(null);

  const categories = ['All', 'Unusual water colour', 'Bad smell or taste', 'Drainage problems', 'Suspected waste dumping'];
  const statuses = ['All', 'Submitted', 'Under Review', 'Resolved'];

  const loadReports = useCallback(async () => {
    try {
      const data = await fetchReports({
        search,
        category: selectedCategory,
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
  }, [search, selectedCategory, selectedStatus]);

  useEffect(() => {
    loadReports();
  }, [loadReports]);

  const onRefresh = () => {
    setRefreshing(true);
    loadReports();
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

    return (
      <TouchableOpacity
        style={styles.card}
        activeOpacity={0.8}
        onPress={() => setActiveReport(item)}
      >
        <View style={styles.cardHeader}>
          <View style={styles.idContainer}>
            <Text style={styles.idText}>{item.id}</Text>
            <View style={styles.unverifiedBadge}>
              <Text style={styles.unverifiedBadgeText}>Unverified</Text>
            </View>
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

        <View style={styles.metaRow}>
          <View style={styles.metaItem}>
            <MapPin size={12} color={Colors.primary} />
            <Text style={styles.metaText}>{item.village}</Text>
          </View>
          <View style={styles.metaItem}>
            <Calendar size={12} color={Colors.slate400} />
            <Text style={styles.metaText}>{item.date_observed}</Text>
          </View>
        </View>

        <Text style={styles.descText} numberOfLines={2}>
          {item.description}
        </Text>

        <View style={styles.cardFooter}>
          <Text style={styles.sourceText}>Source: {item.water_source || 'Borewell'}</Text>
          <View style={styles.viewDetailsRow}>
            <Text style={styles.viewDetailsText}>View Details</Text>
            <ChevronRight size={14} color={Colors.primaryDark} />
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.screenTitle}>Community Reports</Text>
        <Text style={styles.screenSubtitle}>Observational records logged across Nutakki and AP mandals</Text>

        {/* Search Input */}
        <View style={styles.searchContainer}>
          <Search size={16} color={Colors.primary} />
          <TextInput
            placeholder="Search report ID, village, landmark..."
            placeholderTextColor={Colors.slate400}
            value={search}
            onChangeText={setSearch}
            style={styles.searchInput}
          />
          {search ? (
            <TouchableOpacity onPress={() => setSearch('')}>
              <X size={16} color={Colors.slate400} />
            </TouchableOpacity>
          ) : null}
        </View>

        {/* Category Pills */}
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={categories}
          keyExtractor={(item) => item}
          contentContainerStyle={styles.filterScroll}
          renderItem={({ item }) => {
            const isSelected = selectedCategory === item;
            return (
              <TouchableOpacity
                onPress={() => setSelectedCategory(item)}
                style={[styles.filterChip, isSelected && styles.filterChipActive]}
              >
                <Text style={[styles.filterChipText, isSelected && styles.filterChipTextActive]}>
                  {item === 'All' ? 'All Issues' : item}
                </Text>
              </TouchableOpacity>
            );
          }}
        />
      </View>

      {/* Unverified Disclaimer Ribbon */}
      <View style={styles.disclaimerRibbon}>
        <ShieldAlert size={14} color={Colors.warning} />
        <Text style={styles.disclaimerText}>
          All submissions are civic observations. They have not been certified by laboratory water testing.
        </Text>
      </View>

      {/* List */}
      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Fetching community logs...</Text>
        </View>
      ) : reports.length === 0 ? (
        <View style={styles.centerContainer}>
          <AlertTriangle size={32} color={Colors.slate400} />
          <Text style={styles.emptyTitle}>No Matching Reports</Text>
          <Text style={styles.emptyText}>Try searching another keyword or clearing your category filters.</Text>
        </View>
      ) : (
        <FlatList
          data={reports}
          keyExtractor={(item) => item.id}
          renderItem={renderReportItem}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[Colors.primary]} />
          }
        />
      )}

      {/* Detail Modal Bottom Sheet */}
      {activeReport && (
        <View style={styles.modalOverlay}>
          <ReportDetailsSheet
            report={activeReport}
            initialExpanded={true}
            onClose={() => setActiveReport(null)}
            onNavigateSafety={() => {
              setActiveReport(null);
              router.push('/(tabs)/safety');
            }}
          />
        </View>
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
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 10,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  screenTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: Colors.slate900,
  },
  screenSubtitle: {
    fontSize: 11,
    color: Colors.slate500,
    marginTop: 2,
    marginBottom: 10,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    paddingHorizontal: 12,
    paddingVertical: Platform.OS === 'ios' ? 9 : 7,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    gap: 8,
    marginBottom: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 12,
    color: Colors.slate800,
    padding: 0,
    fontWeight: '600',
  },
  filterScroll: {
    gap: 6,
    paddingVertical: 4,
  },
  filterChip: {
    backgroundColor: '#f8fafc',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 100,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  filterChipActive: {
    backgroundColor: Colors.primaryDark,
    borderColor: Colors.primaryDark,
  },
  filterChipText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.slate600,
  },
  filterChipTextActive: {
    color: '#ffffff',
  },
  disclaimerRibbon: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.warningBg,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: Colors.warningBorder,
  },
  disclaimerText: {
    fontSize: 10,
    color: Colors.warning,
    fontWeight: '600',
    flex: 1,
    lineHeight: 14,
  },
  listContainer: {
    padding: 14,
    gap: 12,
    backgroundColor: '#f8fafc',
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    ...Shadows.card,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  idContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  idText: {
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontWeight: '800',
    fontSize: 11,
    color: Colors.primaryDark,
    backgroundColor: Colors.primaryBg,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  unverifiedBadge: {
    backgroundColor: '#fef3c7',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  unverifiedBadgeText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#92400e',
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 100,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '700',
  },
  cardCategory: {
    fontSize: 10,
    fontWeight: '800',
    color: Colors.primaryDark,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: Colors.slate900,
    marginTop: 2,
    lineHeight: 20,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginTop: 6,
    marginBottom: 6,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: 11,
    color: Colors.slate500,
    fontWeight: '600',
  },
  descText: {
    fontSize: 12,
    color: Colors.slate600,
    lineHeight: 17,
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  sourceText: {
    fontSize: 10,
    color: Colors.slate400,
  },
  viewDetailsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  viewDetailsText: {
    fontSize: 11,
    fontWeight: '800',
    color: Colors.primaryDark,
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 30,
    gap: 8,
    backgroundColor: '#f8fafc',
  },
  loadingText: {
    fontSize: 12,
    color: Colors.slate500,
    marginTop: 8,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.slate800,
  },
  emptyText: {
    fontSize: 12,
    color: Colors.slate500,
    textAlign: 'center',
    lineHeight: 18,
  },
  modalOverlay: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
    justifyContent: 'flex-end',
    zIndex: 100,
  },
});
