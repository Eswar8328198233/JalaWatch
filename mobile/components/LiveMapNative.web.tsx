import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
} from 'react-native';
import {
  Compass,
  Search,
  Layers,
  X,
  MapPin,
  AlertTriangle,
  Droplets,
  CheckCircle,
  RefreshCw,
  Info,
} from 'lucide-react-native';
import { Colors, Shadows } from '../constants/theme';
import { Report } from '../services/api';

interface Props {
  reports: Report[];
  selectedReport: Report | null;
  onSelectReport: (report: Report | null) => void;
  onRefresh: () => void;
  refreshing: boolean;
}

export default function LiveMapNativeWeb({
  reports,
  selectedReport,
  onSelectReport,
  onRefresh,
  refreshing,
}: Props) {
  const [activeCategory, setActiveCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [showLegend, setShowLegend] = useState(false);

  const categories = [
    'All',
    'Unusual water colour',
    'Bad smell or taste',
    'Drainage problems',
    'Suspected waste dumping',
  ];

  // Filter reports
  const validReports = reports.filter((r) => {
    if (activeCategory !== 'All' && r.category !== activeCategory) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchId = r.id.toLowerCase().includes(q);
      const matchVillage = r.village.toLowerCase().includes(q);
      const matchLandmark = (r.landmark || '').toLowerCase().includes(q);
      const matchDesc = r.description.toLowerCase().includes(q);
      if (!matchId && !matchVillage && !matchLandmark && !matchDesc) return false;
    }
    return true;
  });

  const getMarkerColor = (report: Report) => {
    if (report.category === 'Unusual water colour' || report.status === 'Under Review') {
      return Colors.warning;
    }
    if (report.status === 'Resolved') {
      return Colors.success;
    }
    return Colors.primary;
  };

  return (
    <View style={styles.container}>
      {/* Interactive Web Map View / Visual Canvas */}
      <View style={styles.webMapBackground}>
        {/* Nutakki Grid Map Simulation */}
        <View style={styles.gridOverlay}>
          {/* River Krishna Simulation Line */}
          <View style={styles.riverSimulation}>
            <Text style={styles.riverText}>~ Krishna River Basin (Nutakki Reach) ~</Text>
          </View>

          {/* Interactive Marker Pins on Map */}
          {validReports.map((report, idx) => {
            const isSelected = selectedReport?.id === report.id;
            const color = getMarkerColor(report);
            const isHighConcern =
              report.category === 'Unusual water colour' || report.status === 'Under Review';

            // Coordinates mapping to relative position or default grid layout
            const topPercent = report.latitude
              ? Math.min(85, Math.max(15, ((16.455 - report.latitude) / 0.035) * 100))
              : 20 + ((idx * 17) % 65);
            const leftPercent = report.longitude
              ? Math.min(85, Math.max(15, ((report.longitude - 80.58) / 0.04) * 100))
              : 20 + ((idx * 23) % 65);

            return (
              <TouchableOpacity
                key={report.id}
                style={[
                  styles.markerNode,
                  { top: `${topPercent}%`, left: `${leftPercent}%` },
                ]}
                onPress={() => onSelectReport(report)}
                activeOpacity={0.8}
              >
                {/* Floating Callout */}
                <View
                  style={[
                    styles.markerCallout,
                    isSelected && styles.markerCalloutSelected,
                  ]}
                >
                  <View style={[styles.statusDot, { backgroundColor: color }]} />
                  <Text style={styles.markerCalloutText} numberOfLines={1}>
                    {report.landmark || report.village}
                  </Text>
                </View>

                {/* Radar Halo */}
                <View
                  style={[
                    styles.radarHalo,
                    {
                      backgroundColor:
                        color === Colors.warning
                          ? 'rgba(234, 88, 12, 0.25)'
                          : 'rgba(13, 148, 136, 0.22)',
                    },
                  ]}
                />

                {/* Pin Head */}
                <View
                  style={[
                    styles.markerPin,
                    { backgroundColor: color },
                    isSelected && styles.markerPinSelected,
                  ]}
                >
                  <Text style={styles.markerPinText}>
                    {isHighConcern ? '!' : report.status === 'Resolved' ? '✓' : '💧'}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Web Notice Pill */}
        <View style={styles.webNoticePill}>
          <Text style={styles.webNoticeText}>
            📍 Nutakki Village Study Area (16.4382° N, 80.6010° E) • Tap markers for details
          </Text>
        </View>
      </View>

      {/* Floating Top Control Bar */}
      <View style={styles.topControlContainer}>
        {/* Search Bar */}
        <View style={styles.searchBar}>
          <Search size={16} color={Colors.primary} />
          <TextInput
            placeholder="Search landmark, concern, ID..."
            placeholderTextColor={Colors.slate400}
            value={searchQuery}
            onChangeText={setSearchQuery}
            style={styles.searchInput}
          />
          {searchQuery ? (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <X size={15} color={Colors.slate400} />
            </TouchableOpacity>
          ) : null}
        </View>

        {/* Category Pills */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoryScroll}
        >
          {categories.map((cat) => {
            const isSelected = activeCategory === cat;
            return (
              <TouchableOpacity
                key={cat}
                onPress={() => setActiveCategory(cat)}
                style={[styles.categoryPill, isSelected && styles.categoryPillActive]}
              >
                <Text
                  style={[
                    styles.categoryPillText,
                    isSelected && styles.categoryPillTextActive,
                  ]}
                >
                  {cat === 'All' ? 'All Issues' : cat}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Floating Map Actions */}
      <View style={styles.actionButtonsCol}>
        <TouchableOpacity
          style={[styles.floatingActionBtn, showLegend && styles.floatingActionBtnActive]}
          onPress={() => setShowLegend(!showLegend)}
          activeOpacity={0.8}
        >
          <Layers
            size={20}
            color={showLegend ? '#ffffff' : Colors.slate600}
            strokeWidth={2.2}
          />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.floatingActionBtn}
          onPress={onRefresh}
          activeOpacity={0.8}
        >
          <RefreshCw
            size={18}
            color={Colors.primary}
            strokeWidth={2.2}
            style={refreshing ? { transform: [{ rotate: '45deg' }] } : undefined}
          />
        </TouchableOpacity>
      </View>

      {/* Map Legend Overlay Card */}
      {showLegend && (
        <View style={styles.legendCard}>
          <View style={styles.legendHeader}>
            <Text style={styles.legendTitle}>Map Legend & Indicators</Text>
            <TouchableOpacity onPress={() => setShowLegend(false)}>
              <X size={16} color={Colors.slate400} />
            </TouchableOpacity>
          </View>

          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: Colors.warning }]}>
              <Text style={styles.legendIconText}>!</Text>
            </View>
            <Text style={styles.legendLabel}>
              <Text style={styles.boldText}>Orange Warning: </Text>
              Discolouration or Under Review
            </Text>
          </View>

          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: Colors.primary }]}>
              <Text style={styles.legendIconText}>💧</Text>
            </View>
            <Text style={styles.legendLabel}>
              <Text style={styles.tealText}>Teal Water: </Text>
              Submitted Community Report
            </Text>
          </View>

          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: Colors.success }]}>
              <Text style={styles.legendIconText}>✓</Text>
            </View>
            <Text style={styles.legendLabel}>
              <Text style={styles.boldText}>Green Check: </Text>
              Action Taken / Resolved
            </Text>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: 'relative',
    backgroundColor: '#e6f4f1',
  },
  webMapBackground: {
    flex: 1,
    backgroundColor: '#ebf6f5',
    position: 'relative',
    overflow: 'hidden',
  },
  gridOverlay: {
    flex: 1,
    position: 'relative',
    backgroundColor: '#e2f1ee',
  },
  riverSimulation: {
    position: 'absolute',
    top: '35%',
    left: 0,
    right: 0,
    height: 48,
    backgroundColor: '#c7e9f0',
    borderTopWidth: 2,
    borderBottomWidth: 2,
    borderColor: '#a0d7e4',
    alignItems: 'center',
    justifyContent: 'center',
    transform: [{ rotate: '-4deg' }],
  },
  riverText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#0284c7',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  markerNode: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    width: 140,
    height: 70,
    marginLeft: -70,
    marginTop: -35,
    zIndex: 10,
  },
  markerCallout: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#ffffff',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    marginBottom: 4,
    ...Shadows.pill,
  },
  markerCalloutSelected: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primaryBg,
  },
  markerCalloutText: {
    fontSize: 9,
    fontWeight: '700',
    color: Colors.slate800,
    maxWidth: 90,
  },
  statusDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
  },
  radarHalo: {
    position: 'absolute',
    width: 44,
    height: 44,
    borderRadius: 22,
    bottom: 2,
  },
  markerPin: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 2,
    borderColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.card,
  },
  markerPinSelected: {
    transform: [{ scale: 1.15 }],
    borderColor: '#ffffff',
    borderWidth: 3,
  },
  markerPinText: {
    fontSize: 12,
    fontWeight: '900',
    color: '#ffffff',
  },
  webNoticePill: {
    position: 'absolute',
    bottom: 12,
    left: 16,
    right: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.94)',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#ccfbf1',
    alignItems: 'center',
    ...Shadows.pill,
  },
  webNoticeText: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.primaryDark,
  },
  topControlContainer: {
    position: 'absolute',
    top: 12,
    left: 12,
    right: 12,
    zIndex: 20,
    gap: 8,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 24,
    paddingHorizontal: 14,
    height: 44,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    ...Shadows.card,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 13,
    color: Colors.slate800,
  },
  categoryScroll: {
    gap: 6,
    paddingRight: 12,
  },
  categoryPill: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    ...Shadows.pill,
  },
  categoryPillActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  categoryPillText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.slate600,
  },
  categoryPillTextActive: {
    color: '#ffffff',
  },
  actionButtonsCol: {
    position: 'absolute',
    right: 14,
    bottom: 50,
    zIndex: 20,
    gap: 8,
  },
  floatingActionBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    ...Shadows.float,
  },
  floatingActionBtnActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  legendCard: {
    position: 'absolute',
    bottom: 50,
    left: 14,
    right: 68,
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    zIndex: 25,
    gap: 8,
    ...Shadows.float,
  },
  legendHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2,
  },
  legendTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: Colors.slate900,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  legendDot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  legendIconText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '900',
  },
  legendLabel: {
    fontSize: 11,
    color: Colors.slate700,
    fontWeight: '500',
    flex: 1,
  },
  boldText: {
    fontWeight: '800',
    color: Colors.slate900,
  },
  tealText: {
    fontWeight: '800',
    color: Colors.primaryDark,
  },
});
