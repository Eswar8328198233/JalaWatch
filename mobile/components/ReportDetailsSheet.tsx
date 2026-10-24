import React, { useRef, useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ScrollView,
  Linking,
  Platform,
  Animated,
  PanResponder,
  Dimensions,
} from 'react-native';
import {
  AlertTriangle,
  MapPin,
  Calendar,
  Droplets,
  CheckCircle,
  Clock,
  X,
  ChevronRight,
  ChevronUp,
  ChevronDown,
  ExternalLink,
} from 'lucide-react-native';
import { Colors, Shadows } from '../constants/theme';
import { Report, getFullPhotoUrl } from '../services/api';

interface Props {
  report: Report | null;
  onClose: () => void;
  onNavigateSafety: () => void;
  initialExpanded?: boolean;
}

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

// Responsive snap dimensions
const COLLAPSED_HEIGHT = 168;
const EXPANDED_HEIGHT = Math.min(Math.round(SCREEN_HEIGHT * 0.76), 560);
const SNAP_EXPANDED = 0;
const SNAP_COLLAPSED = EXPANDED_HEIGHT - COLLAPSED_HEIGHT;
const DISMISSED_Y = EXPANDED_HEIGHT + 60;

export default function ReportDetailsSheet({
  report,
  onClose,
  onNavigateSafety,
  initialExpanded = false,
}: Props) {
  const [isExpanded, setIsExpanded] = useState(initialExpanded);
  const currentSnapRef = useRef(initialExpanded ? SNAP_EXPANDED : SNAP_COLLAPSED);
  const translateY = useRef(new Animated.Value(initialExpanded ? SNAP_EXPANDED : SNAP_COLLAPSED)).current;
  const lastReportIdRef = useRef<string | null>(null);

  // Expand with spring animation
  const expandSheet = useCallback(() => {
    Animated.spring(translateY, {
      toValue: SNAP_EXPANDED,
      friction: 8,
      tension: 50,
      useNativeDriver: true,
    }).start(() => {
      currentSnapRef.current = SNAP_EXPANDED;
      setIsExpanded(true);
    });
  }, [translateY]);

  // Collapse with spring animation
  const collapseSheet = useCallback(() => {
    Animated.spring(translateY, {
      toValue: SNAP_COLLAPSED,
      friction: 8,
      tension: 50,
      useNativeDriver: true,
    }).start(() => {
      currentSnapRef.current = SNAP_COLLAPSED;
      setIsExpanded(false);
    });
  }, [translateY]);

  // Dismiss with smooth slide down
  const dismissSheet = useCallback(() => {
    Animated.timing(translateY, {
      toValue: DISMISSED_Y,
      duration: 220,
      useNativeDriver: true,
    }).start(() => {
      currentSnapRef.current = DISMISSED_Y;
      onClose();
    });
  }, [translateY, onClose]);

  // Toggle between collapsed and expanded
  const toggleExpand = () => {
    if (isExpanded) {
      collapseSheet();
    } else {
      expandSheet();
    }
  };

  // When report changes (e.g. user selects a different marker), animate in
  useEffect(() => {
    if (report && report.id !== lastReportIdRef.current) {
      lastReportIdRef.current = report.id;
      const targetY = initialExpanded ? SNAP_EXPANDED : SNAP_COLLAPSED;
      // Start slightly below and animate smoothly up into target snap
      translateY.setValue(targetY + 80);
      Animated.spring(translateY, {
        toValue: targetY,
        friction: 8,
        tension: 55,
        useNativeDriver: true,
      }).start(() => {
        currentSnapRef.current = targetY;
        setIsExpanded(initialExpanded);
      });
    }
  }, [report, initialExpanded, translateY]);

  // Gesture responder for smooth touch-dragging up and down without blocking child buttons
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onStartShouldSetPanResponderCapture: () => false,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        return Math.abs(gestureState.dy) > 6;
      },
      onMoveShouldSetPanResponderCapture: (_, gestureState) => {
        return Math.abs(gestureState.dy) > 6;
      },
      onPanResponderTerminationRequest: () => false,
      onPanResponderMove: (_, gestureState) => {
        const newY = currentSnapRef.current + gestureState.dy;
        // Allow slight rubber-banding at the top (-15px max)
        if (newY >= -15) {
          translateY.setValue(newY);
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        const dy = gestureState.dy;
        const vy = gestureState.vy;

        if (currentSnapRef.current === SNAP_EXPANDED) {
          // Expanded: drag down > 70px or downward flick triggers collapse
          if (dy > 70 || vy > 0.4) {
            collapseSheet();
          } else {
            expandSheet();
          }
        } else {
          // Collapsed: drag up > 35px or upward flick triggers expand
          if (dy < -35 || vy < -0.35) {
            expandSheet();
          } else if (dy > 65 || vy > 0.5) {
            // Dragged down past collapsed -> dismiss
            dismissSheet();
          } else {
            collapseSheet();
          }
        }
      },
    })
  ).current;

  if (!report) return null;

  const photoUri = getFullPhotoUrl(report.photo_url);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Resolved':
        return { bg: Colors.successBg, text: Colors.success, label: 'Resolved', icon: CheckCircle };
      case 'Under Review':
        return { bg: Colors.warningBg, text: Colors.warning, label: 'Under Review', icon: Clock };
      default:
        return { bg: Colors.primaryBg, text: Colors.primary, label: 'Submitted', icon: Droplets };
    }
  };

  const statusInfo = getStatusBadge(report.status);
  const StatusIcon = statusInfo.icon;

  const handleOpenOSM = () => {
    if (report.latitude && report.longitude) {
      const url = `https://www.openstreetmap.org/?mlat=${report.latitude}&mlon=${report.longitude}#map=16/${report.latitude}/${report.longitude}`;
      Linking.openURL(url);
    }
  };

  return (
    <Animated.View
      style={[
        styles.sheetContainer,
        {
          height: EXPANDED_HEIGHT,
          transform: [{ translateY }],
        },
      ]}
    >
      {/* 
        DRAG HANDLE & COMPACT PREVIEW HEADER 
        Attached to PanResponder for 100% reliable touch drag up/down
      */}
      <View {...panResponder.panHandlers} style={styles.handleAndHeaderZone}>
        {/* Grab Handle Pill */}
        <TouchableOpacity
          onPress={toggleExpand}
          activeOpacity={0.8}
          style={styles.handleTouchable}
          hitSlop={{ top: 10, bottom: 10, left: 20, right: 20 }}
        >
          <View style={styles.dragHandle} />
        </TouchableOpacity>

        {/* Top Header Row: Disclaimer Badge + Close Button */}
        <View style={styles.headerRow}>
          <View style={styles.unverifiedBanner}>
            <AlertTriangle size={12} color={Colors.warning} />
            <Text style={styles.unverifiedText}>UNVERIFIED COMMUNITY REPORT</Text>
          </View>
          <TouchableOpacity
            onPress={dismissSheet}
            style={styles.closeBtn}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            accessibilityLabel="Close report details"
          >
            <X size={16} color={Colors.slate600} strokeWidth={2.5} />
          </TouchableOpacity>
        </View>

        {/* Compact Metadata Row: ID + Status + Demo pill */}
        <View style={styles.metaRow}>
          <View style={styles.idBadge}>
            <Text style={styles.idText}>{report.id}</Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: statusInfo.bg }]}>
            <StatusIcon size={11} color={statusInfo.text} />
            <Text style={[styles.statusText, { color: statusInfo.text }]}>{statusInfo.label}</Text>
          </View>
          {report.is_demo && (
            <View style={styles.demoBadge}>
              <Text style={styles.demoText}>Demo</Text>
            </View>
          )}
        </View>

        {/* Title / Landmark */}
        <Text style={styles.titleText} numberOfLines={1}>
          {report.landmark || `${report.category} in ${report.village}`}
        </Text>

        {/* Village Locality */}
        <View style={styles.locationRow}>
          <MapPin size={13} color={Colors.primary} />
          <Text style={styles.locationText} numberOfLines={1}>
            {report.village}, Mangalagiri Mandal, AP
          </Text>
        </View>

        {/* Expand / Collapse Indicator Bar */}
        <TouchableOpacity
          style={styles.expandPromptBar}
          onPress={toggleExpand}
          activeOpacity={0.8}
        >
          {isExpanded ? (
            <View style={styles.expandPromptRow}>
              <Text style={styles.expandPromptText}>Swipe down to collapse to map</Text>
              <ChevronDown size={13} color={Colors.primaryDark} />
            </View>
          ) : (
            <View style={styles.expandPromptRow}>
              <Text style={styles.expandPromptText}>Tap or drag up for full observation & photos</Text>
              <ChevronUp size={13} color={Colors.primaryDark} />
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* 
        EXPANDED VERTICALLY SCROLLABLE CONTENT 
        Only active when expanded to prevent gesture conflict
      */}
      <ScrollView
        style={styles.scrollArea}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={true}
        scrollEnabled={isExpanded}
        nestedScrollEnabled={true}
      >
        {/* Key Observation Grid */}
        <View style={styles.metaGrid}>
          <View style={styles.metaBox}>
            <Text style={styles.metaLabel}>DATE OBSERVED</Text>
            <View style={styles.metaBoxValueRow}>
              <Calendar size={13} color={Colors.slate500} />
              <Text style={styles.metaValue}>{report.date_observed}</Text>
            </View>
          </View>
          <View style={styles.metaBox}>
            <Text style={styles.metaLabel}>WATER SOURCE</Text>
            <View style={styles.metaBoxValueRow}>
              <Droplets size={13} color={Colors.primary} />
              <Text style={styles.metaValue} numberOfLines={1}>
                {report.water_source || 'Borewell'}
              </Text>
            </View>
          </View>
        </View>

        {/* Community Observation Description */}
        <View style={styles.sectionBox}>
          <Text style={styles.sectionHeader}>COMMUNITY OBSERVATION</Text>
          <Text style={styles.descriptionText}>{report.description}</Text>
        </View>

        {/* Photo Evidence if Present */}
        {photoUri && (
          <View style={styles.sectionBox}>
            <Text style={styles.sectionHeader}>ATTACHED EVIDENCE PHOTOGRAPH</Text>
            <Image
              source={{ uri: photoUri }}
              style={styles.evidenceImage}
              resizeMode="cover"
            />
          </View>
        )}

        {/* Scientific Guidance Note */}
        <View style={styles.adviceBox}>
          <Text style={styles.adviceHeader}>Scientific Advisory for Residents:</Text>
          <Text style={styles.adviceText}>
            Visual discoloration or foul odor alone cannot legally certify water safety. Please request formal laboratory testing from RWS&S or APPCB.
          </Text>
        </View>

        {/* CTA to Safety & Testing Page */}
        <TouchableOpacity
          style={styles.actionBtn}
          onPress={onNavigateSafety}
          activeOpacity={0.8}
        >
          <Text style={styles.actionBtnText}>How to Request Lab Water Testing</Text>
          <ChevronRight size={16} color="#ffffff" />
        </TouchableOpacity>

        {/* Coordinates & OpenStreetMap link */}
        {report.latitude && report.longitude && (
          <TouchableOpacity style={styles.osmLink} onPress={handleOpenOSM} activeOpacity={0.8}>
            <Text style={styles.osmText}>
              Coordinates: {Number(report.latitude).toFixed(4)}° N, {Number(report.longitude).toFixed(4)}° E
            </Text>
            <ExternalLink size={12} color={Colors.primary} />
          </TouchableOpacity>
        )}

        <View style={{ height: 28 }} />
      </ScrollView>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  sheetContainer: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    width: '100%',
    ...Shadows.float,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    overflow: 'hidden',
  },
  handleAndHeaderZone: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 6,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  handleTouchable: {
    alignItems: 'center',
    paddingVertical: 4,
  },
  dragHandle: {
    width: 44,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: '#cbd5e1',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  unverifiedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: Colors.warningBg,
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 100,
    borderWidth: 1,
    borderColor: Colors.warningBorder,
  },
  unverifiedText: {
    fontSize: 9,
    fontWeight: '800',
    color: Colors.warning,
    letterSpacing: 0.3,
  },
  closeBtn: {
    padding: 6,
    borderRadius: 14,
    backgroundColor: '#f1f5f9',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 8,
  },
  idBadge: {
    backgroundColor: Colors.primaryBg,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: Colors.primaryBorder,
  },
  idText: {
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontWeight: '800',
    fontSize: 11,
    color: Colors.primaryDark,
  },
  statusBadge: {
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
  demoBadge: {
    backgroundColor: '#f3e8ff',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  demoText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#7e22ce',
  },
  titleText: {
    fontSize: 15,
    fontWeight: '800',
    color: Colors.slate900,
    marginTop: 6,
    lineHeight: 20,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 3,
  },
  locationText: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.slate600,
  },
  expandPromptBar: {
    marginTop: 6,
    paddingVertical: 3,
    alignItems: 'center',
  },
  expandPromptRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  expandPromptText: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.primaryDark,
  },
  scrollArea: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: Platform.OS === 'ios' ? 36 : 24,
  },
  metaGrid: {
    flexDirection: 'row',
    gap: 8,
  },
  metaBox: {
    flex: 1,
    backgroundColor: '#f8fafc',
    padding: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  metaLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: Colors.slate400,
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  metaBoxValueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  metaValue: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.slate800,
  },
  sectionBox: {
    marginTop: 12,
  },
  sectionHeader: {
    fontSize: 10,
    fontWeight: '800',
    color: Colors.slate400,
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  descriptionText: {
    fontSize: 13,
    color: Colors.slate700,
    lineHeight: 19,
    backgroundColor: '#f8fafc',
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  evidenceImage: {
    width: '100%',
    height: 160,
    borderRadius: 14,
    marginTop: 4,
    backgroundColor: '#e2e8f0',
  },
  adviceBox: {
    marginTop: 12,
    padding: 12,
    borderRadius: 14,
    backgroundColor: Colors.mint50,
    borderWidth: 1,
    borderColor: Colors.mint200,
  },
  adviceHeader: {
    fontSize: 11,
    fontWeight: '800',
    color: Colors.mint700,
    marginBottom: 2,
  },
  adviceText: {
    fontSize: 11,
    color: Colors.slate600,
    lineHeight: 16,
  },
  actionBtn: {
    backgroundColor: Colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderRadius: 14,
    marginTop: 14,
    ...Shadows.card,
  },
  actionBtnText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '800',
  },
  osmLink: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    marginTop: 10,
    paddingVertical: 4,
  },
  osmText: {
    fontSize: 11,
    color: Colors.primary,
    fontWeight: '600',
  },
});
