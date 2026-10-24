import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Platform,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { WebView } from 'react-native-webview';
import {
  Compass,
  Search,
  Layers,
  X,
  Droplets,
  RefreshCw,
} from 'lucide-react-native';
import { Colors, Shadows } from '../constants/theme';
import { Report } from '../services/api';

const NativeWebView = WebView as unknown as React.ComponentType<any>;

interface Props {
  reports: Report[];
  selectedReport: Report | null;
  onSelectReport: (report: Report | null) => void;
  onRefresh: () => void;
  refreshing: boolean;
}

const NUTAKKI_CENTER = {
  lat: 16.4382,
  lng: 80.6010,
  zoom: 14,
};

export default function LiveMapNative({
  reports,
  selectedReport,
  onSelectReport,
  onRefresh,
  refreshing,
}: Props) {
  const webViewRef = useRef<any>(null);
  const [activeCategory, setActiveCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [showLegend, setShowLegend] = useState(false);
  const [isMapReady, setIsMapReady] = useState(false);

  const categories = [
    'All',
    'Unusual water colour',
    'Bad smell or taste',
    'Drainage problems',
    'Suspected waste dumping',
  ];

  // Filter reports with valid coordinates
  const validReports = useMemo(() => {
    return reports.filter((r) => {
      if (!r.latitude || !r.longitude) return false;
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
  }, [reports, activeCategory, searchQuery]);

  // Push updated markers to Leaflet map when validReports or selectedReport changes
  useEffect(() => {
    if (!isMapReady || !webViewRef.current) return;

    const reportsData = validReports.map((r) => ({
      id: r.id,
      lat: r.latitude,
      lng: r.longitude,
      landmark: r.landmark || r.village,
      village: r.village,
      category: r.category,
      status: r.status,
      isSelected: selectedReport?.id === r.id,
    }));

    const js = `
      if (window.updateMarkers) {
        window.updateMarkers(${JSON.stringify(reportsData)}, ${selectedReport ? JSON.stringify(selectedReport.id) : 'null'});
      }
      true;
    `;
    webViewRef.current.injectJavaScript(js);
  }, [validReports, selectedReport, isMapReady]);

  // Center on Nutakki
  const handleCenterNutakki = () => {
    if (webViewRef.current) {
      const js = `
        if (window.centerNutakki) {
          window.centerNutakki();
        }
        true;
      `;
      webViewRef.current.injectJavaScript(js);
    }
  };

  // Handle messages received from Leaflet WebView
  const handleWebViewMessage = (event: any) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (data.type === 'MAP_READY') {
        setIsMapReady(true);
      } else if (data.type === 'SELECT_REPORT') {
        const target = reports.find((r) => r.id === data.id);
        if (target) {
          onSelectReport(target);
        }
      }
    } catch (e) {
      // Ignore non-json messages
    }
  };

  // Build the complete Leaflet + OpenStreetMap HTML
  const leafletHtml = useMemo(() => {
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
  <style>
    html, body {
      margin: 0;
      padding: 0;
      width: 100%;
      height: 100%;
      background-color: #e2f1f1;
      overflow: hidden;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    }
    #map {
      width: 100%;
      height: 100%;
    }
    /* Hide default leaflet zoom controls to keep clean mobile UI */
    .leaflet-control-zoom {
      display: none !important;
    }
    .leaflet-control-attribution {
      font-size: 8px !important;
      background: rgba(255,255,255,0.7) !important;
      padding: 1px 4px !important;
    }

    /* Custom Marker Container */
    .custom-marker {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      cursor: pointer;
    }

    /* Floating Callout Label */
    .marker-callout {
      display: flex;
      align-items: center;
      gap: 3px;
      background: #ffffff;
      padding: 2px 7px;
      border-radius: 12px;
      border: 1px solid #cbd5e1;
      box-shadow: 0 2px 6px rgba(0,0,0,0.15);
      margin-bottom: 2px;
      white-space: nowrap;
      pointer-events: auto;
    }
    .marker-callout.selected {
      border-color: #0d9488;
      background: #f0fdfa;
      box-shadow: 0 3px 10px rgba(13,148,136,0.3);
    }
    .callout-dot {
      width: 5px;
      height: 5px;
      border-radius: 50%;
    }
    .callout-text {
      font-size: 10px;
      font-weight: 700;
      color: #1e293b;
      max-width: 90px;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .callout-info {
      font-size: 9px;
      color: #94a3b8;
    }

    /* Radar Concentric Halo */
    .radar-halo {
      position: absolute;
      width: 40px;
      height: 40px;
      border-radius: 50%;
      bottom: -6px;
      animation: pulse 2s infinite ease-out;
      pointer-events: none;
    }
    @keyframes pulse {
      0% { transform: scale(0.6); opacity: 0.9; }
      100% { transform: scale(1.4); opacity: 0; }
    }

    /* Pin Head */
    .marker-pin {
      width: 26px;
      height: 26px;
      border-radius: 50%;
      border: 2px solid #ffffff;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #ffffff;
      font-weight: 900;
      font-size: 12px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.25);
      position: relative;
      z-index: 2;
      transition: transform 0.2s ease;
    }
    .marker-pin.selected {
      transform: scale(1.2);
      border-width: 3px;
      box-shadow: 0 4px 12px rgba(13,148,136,0.45);
    }
  </style>
</head>
<body>
  <div id="map"></div>

  <script>
    var map;
    var markersLayer;
    var currentSelectedId = null;

    // Initialize Leaflet Map
    map = L.map('map', {
      center: [${NUTAKKI_CENTER.lat}, ${NUTAKKI_CENTER.lng}],
      zoom: ${NUTAKKI_CENTER.zoom},
      zoomControl: false,
      attributionControl: true
    });

    // Add OpenStreetMap Standard Tiles (100% free, no API key, no watermark)
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      subdomains: 'abc',
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map);

    markersLayer = L.layerGroup().addTo(map);

    function notifyNative(msg) {
      if (window.ReactNativeWebView && window.ReactNativeWebView.postMessage) {
        window.ReactNativeWebView.postMessage(JSON.stringify(msg));
      }
    }

    window.centerNutakki = function() {
      map.flyTo([${NUTAKKI_CENTER.lat}, ${NUTAKKI_CENTER.lng}], ${NUTAKKI_CENTER.zoom}, { duration: 0.8 });
    };

    window.updateMarkers = function(reportsData, selectedId) {
      currentSelectedId = selectedId;
      markersLayer.clearLayers();

      reportsData.forEach(function(r) {
        var isSelected = r.id === currentSelectedId;
        var isHighConcern = r.category === 'Unusual water colour' || r.status === 'Under Review';
        var isResolved = r.status === 'Resolved';

        var color = '#0d9488';
        var haloColor = 'rgba(13, 148, 136, 0.35)';
        var iconSymbol = '💧';

        if (isHighConcern) {
          color = '#ea580c';
          haloColor = 'rgba(234, 88, 12, 0.35)';
          iconSymbol = '!';
        } else if (isResolved) {
          color = '#10b981';
          haloColor = 'rgba(16, 185, 129, 0.35)';
          iconSymbol = '✓';
        }

        var labelText = r.landmark || r.village;
        if (labelText.length > 18) {
          labelText = labelText.substring(0, 16) + '…';
        }

        var html = '<div class="custom-marker">' +
          '<div class="marker-callout ' + (isSelected ? 'selected' : '') + '">' +
            '<span class="callout-dot" style="background-color: ' + color + '"></span>' +
            '<span class="callout-text">' + labelText + '</span>' +
            '<span class="callout-info">ⓘ</span>' +
          '</div>' +
          '<div class="radar-halo" style="background-color: ' + haloColor + '"></div>' +
          '<div class="marker-pin ' + (isSelected ? 'selected' : '') + '" style="background-color: ' + color + '">' +
            iconSymbol +
          '</div>' +
        '</div>';

        var icon = L.divIcon({
          className: 'leaflet-custom-div-icon',
          html: html,
          iconSize: [120, 60],
          iconAnchor: [60, 50]
        });

        var marker = L.marker([r.lat, r.lng], { icon: icon });
        marker.on('click', function() {
          notifyNative({ type: 'SELECT_REPORT', id: r.id });
          map.flyTo([r.lat, r.lng], Math.max(map.getZoom(), 15), { duration: 0.6 });
        });

        markersLayer.addLayer(marker);
      });
    };

    // Notify React Native that Leaflet map is initialized
    notifyNative({ type: 'MAP_READY' });
  </script>
</body>
</html>
    `;
  }, []);

  return (
    <View style={styles.container}>
      {/* OpenStreetMap via Leaflet inside Native WebView */}
      <NativeWebView
        ref={webViewRef}
        originWhitelist={['*']}
        source={{ html: leafletHtml }}
        style={styles.map}
        onMessage={handleWebViewMessage}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        startInLoadingState={true}
        renderLoading={() => (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color={Colors.primary} />
            <Text style={styles.loadingText}>Loading OpenStreetMap...</Text>
          </View>
        )}
      />

      {/* Floating Top Bar (Search + Quick Categories) */}
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
            <TouchableOpacity onPress={() => setSearchQuery('')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <X size={15} color={Colors.slate400} />
            </TouchableOpacity>
          ) : null}
        </View>

        {/* Category Pills */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryScroll}>
          {categories.map((cat) => {
            const isSelected = activeCategory === cat;
            return (
              <TouchableOpacity
                key={cat}
                onPress={() => setActiveCategory(cat)}
                style={[styles.categoryPill, isSelected && styles.categoryPillActive]}
              >
                <Text style={[styles.categoryPillText, isSelected && styles.categoryPillTextActive]}>
                  {cat === 'All' ? 'All Issues' : cat}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Floating Map Actions (Center Nutakki, Legend, Refresh) */}
      <View style={styles.actionButtonsCol}>
        <TouchableOpacity style={styles.floatingActionBtn} onPress={handleCenterNutakki} activeOpacity={0.8}>
          <Compass size={20} color={Colors.primary} strokeWidth={2.5} />
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.floatingActionBtn, showLegend && styles.floatingActionBtnActive]}
          onPress={() => setShowLegend(!showLegend)}
          activeOpacity={0.8}
        >
          <Layers size={20} color={showLegend ? '#ffffff' : Colors.slate600} strokeWidth={2.2} />
        </TouchableOpacity>

        <TouchableOpacity style={styles.floatingActionBtn} onPress={onRefresh} activeOpacity={0.8}>
          <RefreshCw size={18} color={Colors.primary} strokeWidth={2.2} />
        </TouchableOpacity>
      </View>

      {/* Floating Map Legend Popup */}
      {showLegend && (
        <View style={styles.legendCard}>
          <View style={styles.legendHeader}>
            <Text style={styles.legendTitle}>OBSERVATION HOTSPOTS</Text>
            <TouchableOpacity onPress={() => setShowLegend(false)}>
              <X size={14} color={Colors.slate400} />
            </TouchableOpacity>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: Colors.warning }]} />
            <Text style={styles.legendLabel}>Under Review / Discoloured Water</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: Colors.primary }]} />
            <Text style={styles.legendLabel}>Submitted Community Observation</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: Colors.success }]} />
            <Text style={styles.legendLabel}>Addressed / Resolved Problem</Text>
          </View>
          <Text style={styles.legendDisclaimer}>
            ⚠️ Observations recorded by citizens; not verified lab tests.
          </Text>
        </View>
      )}

      {/* Floating Location Indicator Strip at bottom */}
      {!selectedReport && (
        <View style={styles.bottomStrip}>
          <View style={styles.pulseDot} />
          <Text style={styles.bottomStripText}>
            Showing <Text style={styles.boldText}>{validReports.length}</Text> concerns near{' '}
            <Text style={styles.tealText}>Nutakki & Krishna Basin</Text> (OpenStreetMap)
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: 'relative',
    backgroundColor: '#e2f1f1',
  },
  map: {
    width: Dimensions.get('window').width,
    height: '100%',
    backgroundColor: '#e2f1f1',
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#e2f1f1',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  loadingText: {
    fontSize: 12,
    color: Colors.slate600,
    fontWeight: '600',
  },
  topControlContainer: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 12 : 16,
    left: 14,
    right: 14,
    zIndex: 10,
    gap: 8,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.96)',
    paddingHorizontal: 12,
    paddingVertical: Platform.OS === 'ios' ? 10 : 8,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    gap: 8,
    ...Shadows.card,
  },
  searchInput: {
    flex: 1,
    fontSize: 12,
    color: Colors.slate800,
    fontWeight: '600',
    padding: 0,
  },
  categoryScroll: {
    gap: 6,
    paddingRight: 10,
  },
  categoryPill: {
    backgroundColor: 'rgba(255, 255, 255, 0.94)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 100,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    ...Shadows.pill,
  },
  categoryPillActive: {
    backgroundColor: Colors.primaryDark,
    borderColor: Colors.primaryDark,
  },
  categoryPillText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.slate700,
  },
  categoryPillTextActive: {
    color: '#ffffff',
  },
  actionButtonsCol: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 95 : 100,
    right: 14,
    zIndex: 10,
    gap: 8,
  },
  floatingActionBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    ...Shadows.card,
  },
  floatingActionBtnActive: {
    backgroundColor: Colors.primaryDark,
    borderColor: Colors.primaryDark,
  },
  legendCard: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 140 : 150,
    right: 60,
    backgroundColor: 'rgba(255, 255, 255, 0.96)',
    padding: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    width: 200,
    zIndex: 15,
    ...Shadows.float,
  },
  legendHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    paddingBottom: 4,
  },
  legendTitle: {
    fontSize: 9,
    fontWeight: '800',
    color: Colors.slate700,
    letterSpacing: 0.5,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 5,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendLabel: {
    fontSize: 10,
    color: Colors.slate700,
    fontWeight: '600',
    flex: 1,
  },
  legendDisclaimer: {
    fontSize: 9,
    color: Colors.warning,
    marginTop: 4,
    lineHeight: 12,
  },
  bottomStrip: {
    position: 'absolute',
    bottom: 14,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 100,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    ...Shadows.float,
    zIndex: 10,
  },
  pulseDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.primary,
  },
  bottomStripText: {
    fontSize: 11,
    color: Colors.slate700,
    fontWeight: '500',
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
