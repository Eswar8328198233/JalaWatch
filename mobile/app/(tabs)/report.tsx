import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Image,
  ActivityIndicator,
  Alert,
  Platform,
  Linking,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import {
  AlertTriangle,
  MapPin,
  Calendar,
  Droplets,
  Camera,
  Upload,
  CheckCircle,
  Navigation,
  X,
  ShieldAlert,
  Sparkles,
  ArrowRight,
  Save,
  RefreshCw,
  Share2,
  Globe,
  Clock,
  Check,
  Compass,
  FileText,
  Layers,
  Trash2,
} from 'lucide-react-native';
import { Colors, Shadows } from '../../constants/theme';
import {
  submitNewReport,
  reverseGeocode,
  GeocodeAddress,
  SubmitReportPayload,
} from '../../services/api';
import {
  getOfflineReports,
  saveOfflineReport,
  syncSingleReport,
  syncAllPendingReports,
  deleteOfflineReport,
  clearSubmittedOfflineReports,
  OfflineReport,
} from '../../services/offlineStorage';
import {
  translations,
  LanguageCode,
  getSavedLanguage,
  saveLanguage,
} from '../../constants/translations';

export default function ReportScreen() {
  const router = useRouter();

  // Language state
  const [lang, setLang] = useState<LanguageCode>('en');
  const t = translations[lang];

  // Form states - Section 1: Location
  const [village, setVillage] = useState('Nutakki');
  const [district, setDistrict] = useState('Guntur District');
  const [stateName, setStateName] = useState('Andhra Pradesh');
  const [street, setStreet] = useState('');
  const [landmark, setLandmark] = useState('');
  const [latitude, setLatitude] = useState<number | undefined>(16.4382);
  const [longitude, setLongitude] = useState<number | undefined>(80.6010);
  const [gpsAccuracy, setGpsAccuracy] = useState<number | null>(null);

  // Non-silent overwrite tracking
  const [manuallyEditedFields, setManuallyEditedFields] = useState<Set<string>>(new Set());

  // Form states - Section 2: Core Details
  const [category, setCategory] = useState('Unusual water colour');
  const [waterSource, setWaterSource] = useState('Borewell / Hand pump');
  const [dateObserved, setDateObserved] = useState(new Date().toISOString().split('T')[0]);
  const [description, setDescription] = useState('');
  const [reporterName, setReporterName] = useState('');
  const [reporterContact, setReporterContact] = useState('');
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [ethicsAgreed, setEthicsAgreed] = useState(false);

  // Form states - Section 3: Extended Environmental Survey (Optional)
  const [waterAppearance, setWaterAppearance] = useState('Clear / Normal');
  const [waterSmell, setWaterSmell] = useState('None');
  const [waterUsage, setWaterUsage] = useState('Drinking');
  const [issueDuration, setIssueDuration] = useState('Few days');
  const [nearbyWastewater, setNearbyWastewater] = useState('None visible');
  const [suspectedDistance, setSuspectedDistance] = useState('15-50 meters');
  const [citizenPriority, setCitizenPriority] = useState('Normal');
  const [additionalNotes, setAdditionalNotes] = useState('');

  // Status & Progress states
  const [locating, setLocating] = useState(false);
  const [resolvingAddress, setResolvingAddress] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submissionResult, setSubmissionResult] = useState<{
    report_id: string;
    duplicate_warning?: any;
    priority?: string;
  } | null>(null);

  // Offline queue state
  const [offlineDrafts, setOfflineDrafts] = useState<OfflineReport[]>([]);
  const [showOfflineModal, setShowOfflineModal] = useState(false);
  const [syncingAll, setSyncingAll] = useState(false);

  // Option definitions
  const categoryOptions = [
    'Unusual water colour',
    'Bad smell or taste',
    'Drainage problems',
    'Suspected waste dumping',
    'Leaking pipes',
    'Agricultural runoff',
    'Other',
  ];

  const waterSourceOptions = [
    'Borewell / Hand pump',
    'Open well',
    'Piped municipal tap water',
    'Irrigation canal / Ditch',
    'Stagnant pond / Seepage',
  ];

  const appearanceOptions = [
    'Clear / Normal',
    'Turbid / Cloudy',
    'Yellowish',
    'Reddish-brown / Rust',
    'Dark / Blackish',
    'Foamy / Frothy',
  ];

  const smellOptions = [
    'None',
    'Rotten egg / Sulfur',
    'Chemical / Chlorine',
    'Sewage / Stagnant',
    'Earthy / Musty',
    'Metallic',
  ];

  const usageOptions = [
    'Drinking',
    'Cooking',
    'Bathing & Washing',
    'Irrigation / Agriculture',
    'Livestock',
  ];

  const durationOptions = [
    'First observed today',
    'Few days',
    '1-2 weeks',
    'Over a month',
    'Chronic / Long-term',
  ];

  const wastewaterOptions = [
    'None visible',
    'Open drain',
    'Septic tank seepage',
    'Industrial effluent',
    'Agricultural runoff',
    'Garbage dump leachate',
  ];

  const distanceOptions = [
    '< 5 meters',
    '5-15 meters',
    '15-50 meters',
    '> 50 meters',
  ];

  const priorityOptions = ['Normal', 'Moderate', 'High', 'Urgent'];

  useEffect(() => {
    getSavedLanguage().then((l) => setLang(l));
    refreshOfflineDrafts();
  }, []);

  const refreshOfflineDrafts = async () => {
    const list = await getOfflineReports();
    setOfflineDrafts(list);
  };

  const handleToggleLang = async () => {
    const nextLang: LanguageCode = lang === 'en' ? 'te' : 'en';
    setLang(nextLang);
    await saveLanguage(nextLang);
  };

  // ----------------- Location & Reverse Geocoding ----------------- //

  const applyGeocodedAddress = (addr: GeocodeAddress, isFromGps: boolean) => {
    // Check if user manually touched any of these fields
    const hasManualEdits =
      manuallyEditedFields.has('village') ||
      manuallyEditedFields.has('district') ||
      manuallyEditedFields.has('street') ||
      manuallyEditedFields.has('landmark');

    const updateFields = () => {
      if (addr.village) setVillage(addr.village);
      if (addr.district) setDistrict(addr.district);
      if (addr.state) setStateName(addr.state);
      if (addr.street) setStreet(addr.street);
      if (addr.landmark) setLandmark(addr.landmark);
      setManuallyEditedFields(new Set()); // Reset manual flags after accepting detected
    };

    if (hasManualEdits && isFromGps) {
      Alert.alert(
        t.overwrite_title,
        `${t.overwrite_message}\n\nDetected:\n• Village: ${addr.village || 'N/A'}\n• District: ${addr.district || 'N/A'}\n• Street: ${addr.street || 'N/A'}`,
        [
          { text: t.btn_keep_input, style: 'cancel' },
          { text: t.btn_update_detected, onPress: updateFields },
        ]
      );
    } else {
      updateFields();
    }
  };

  const handleDetectGPS = async () => {
    setLocating(true);
    setResolvingAddress(false);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Location Permission Required',
          'Please allow GPS location access in your device settings to pinpoint the groundwater concern.'
        );
        setLocating(false);
        return;
      }

      const loc = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      const lat = loc.coords.latitude;
      const lng = loc.coords.longitude;
      const acc = loc.coords.accuracy ? Math.round(loc.coords.accuracy) : null;

      setLatitude(lat);
      setLongitude(lng);
      setGpsAccuracy(acc);
      setLocating(false);

      // Now reverse geocode coordinates
      setResolvingAddress(true);
      const addr = await reverseGeocode(lat, lng);
      setResolvingAddress(false);

      applyGeocodedAddress(addr, true);
    } catch (err: any) {
      setLocating(false);
      setResolvingAddress(false);
      Alert.alert('GPS Error', err.message || 'Could not acquire GPS position.');
    }
  };

  const handlePresetLocation = async (lat: number, lng: number, name: string) => {
    setLatitude(lat);
    setLongitude(lng);
    setGpsAccuracy(null);
    setResolvingAddress(true);
    try {
      const addr = await reverseGeocode(lat, lng);
      setResolvingAddress(false);
      applyGeocodedAddress(addr, false);
    } catch {
      setResolvingAddress(false);
      setVillage(name);
    }
  };

  // ----------------- Photo Handling ----------------- //

  const handleTakePhoto = async () => {
    try {
      const permission = await ImagePicker.requestCameraPermissionsAsync();
      if (!permission.granted) {
        Alert.alert('Camera Permission', 'Please allow camera access to take photo evidence.');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setPhotoUri(result.assets[0].uri);
      }
    } catch (err: any) {
      Alert.alert('Camera Error', err.message || 'Could not launch camera');
    }
  };

  const handlePickGallery = async () => {
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        Alert.alert('Gallery Permission', 'Please allow photo gallery access to select an image.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setPhotoUri(result.assets[0].uri);
      }
    } catch (err: any) {
      Alert.alert('Gallery Error', err.message || 'Could not pick image');
    }
  };

  // ----------------- Submission & Offline Drafts ----------------- //

  const buildPayload = (): SubmitReportPayload => ({
    village: village.trim() || 'Nutakki',
    district: district.trim(),
    state: stateName.trim() || 'Andhra Pradesh',
    category,
    water_source: waterSource,
    date_observed: dateObserved,
    landmark: landmark.trim() || (street ? `Near ${street}` : undefined),
    description: description.trim(),
    latitude,
    longitude,
    reporter_name: reporterName.trim() || 'Anonymous Citizen',
    reporter_contact: reporterContact.trim() || undefined,
    water_appearance: waterAppearance,
    water_smell: waterSmell,
    water_usage: waterUsage,
    issue_duration: issueDuration,
    nearby_wastewater: nearbyWastewater,
    suspected_distance: suspectedDistance,
    priority: citizenPriority,
    additional_notes: additionalNotes.trim() || undefined,
  });

  const handleSaveOffline = async () => {
    if (!description.trim() || description.trim().length < 5) {
      Alert.alert('Validation', 'Please provide a brief description before saving draft.');
      return;
    }

    try {
      const payload = buildPayload();
      await saveOfflineReport({
        data: payload,
        photoUri: photoUri || undefined,
        syncStatus: 'draft',
      });
      await refreshOfflineDrafts();
      Alert.alert(t.offline_saved_alert, t.offline_saved_desc);
      setShowOfflineModal(true);
    } catch (err: any) {
      Alert.alert('Save Failed', 'Could not save report locally: ' + err.message);
    }
  };

  const handleSubmit = async () => {
    if (!village.trim()) {
      Alert.alert('Validation', t.val_village);
      return;
    }
    if (!description.trim() || description.trim().length < 15) {
      Alert.alert('Validation', t.val_desc);
      return;
    }
    if (!ethicsAgreed) {
      Alert.alert('Ethics Confirmation', t.val_ethics);
      return;
    }

    setSubmitting(true);
    const payload = buildPayload();

    try {
      const res = await submitNewReport(payload, photoUri || undefined);
      setSubmitting(false);
      setSubmissionResult(res);

      if (res.duplicate_warning) {
        Alert.alert(
          'Cluster Proximity Notice',
          `Another report for ${res.duplicate_warning.existing_category} was recorded ~${res.duplicate_warning.distance_meters}m away (${res.duplicate_warning.existing_report_id}). Your observation has been linked to this localized cluster.`
        );
      }
    } catch (err: any) {
      setSubmitting(false);
      // Automatically queue as pending offline report if network error occurs
      Alert.alert(
        'Submission Failed - Offline Queue',
        `Network error encountered: ${err.message}.\n\nWould you like to queue this report in your local Offline Drafts to sync automatically when online?`,
        [
          { text: 'Discard', style: 'cancel' },
          {
            text: 'Save Offline',
            onPress: async () => {
              await saveOfflineReport({
                data: payload,
                photoUri: photoUri || undefined,
                syncStatus: 'pending',
              });
              await refreshOfflineDrafts();
              setShowOfflineModal(true);
            },
          },
        ]
      );
    }
  };

  const handleResetForm = () => {
    setSubmissionResult(null);
    setDescription('');
    setLandmark('');
    setStreet('');
    setPhotoUri(null);
    setEthicsAgreed(false);
    setAdditionalNotes('');
  };

  // ----------------- SUCCESS VIEW ----------------- //
  if (submissionResult) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <ScrollView contentContainerStyle={styles.successScroll}>
          <View style={styles.successCard}>
            <View style={styles.successIconCircle}>
              <CheckCircle size={44} color={Colors.primary} strokeWidth={2.5} />
            </View>
            <Text style={styles.successTitle}>{t.success_title}</Text>
            <Text style={styles.successDesc}>{t.success_desc}</Text>

            <View style={styles.trackingBox}>
              <Text style={styles.trackingLabel}>{t.unique_id}</Text>
              <Text style={styles.trackingValue}>{submissionResult.report_id}</Text>
            </View>

            {submissionResult.priority && (
              <View style={styles.priorityNoticePill}>
                <Text style={styles.priorityNoticeText}>
                  Assigned Priority: <Text style={{ fontWeight: '800' }}>{submissionResult.priority}</Text>
                </Text>
              </View>
            )}

            <View style={styles.successActionColumn}>
              <TouchableOpacity
                style={styles.primaryActionBtn}
                onPress={() => {
                  handleResetForm();
                  router.push('/(tabs)');
                }}
              >
                <MapPin size={18} color="#ffffff" />
                <Text style={styles.primaryActionBtnText}>{t.view_live_map}</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.secondaryActionBtn}
                onPress={handleResetForm}
              >
                <Sparkles size={18} color={Colors.primary} />
                <Text style={styles.secondaryActionBtnText}>{t.submit_another}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ----------------- FORM VIEW ----------------- //
  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      {/* Top App Bar */}
      <View style={styles.header}>
        <View style={styles.headerTitleGroup}>
          <View style={styles.logoCircle}>
            <Droplets size={16} color="#ffffff" strokeWidth={2.5} />
          </View>
          <View>
            <Text style={styles.headerTitle}>{t.report_title}</Text>
            <Text style={styles.headerSubtitle}>{t.report_subtitle}</Text>
          </View>
        </View>

        <View style={styles.headerBtnGroup}>
          <TouchableOpacity
            style={styles.langPill}
            onPress={handleToggleLang}
            activeOpacity={0.8}
          >
            <Globe size={13} color={Colors.primary} />
            <Text style={styles.langPillText}>{t.lang_toggle}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.queuePill}
            onPress={() => setShowOfflineModal(true)}
            activeOpacity={0.8}
          >
            <Clock size={13} color={Colors.navy} />
            {offlineDrafts.length > 0 && (
              <View style={styles.queueBadge}>
                <Text style={styles.queueBadgeText}>{offlineDrafts.length}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {/* SECTION 1: LOCATION INTELLIGENCE & GPS */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeaderRow}>
            <View style={styles.sectionIconBadge}>
              <MapPin size={16} color={Colors.primary} />
            </View>
            <Text style={styles.sectionTitle}>Section 1: Location Intelligence</Text>
          </View>

          {/* GPS Detector Button */}
          <TouchableOpacity
            style={[styles.gpsDetectBtn, (locating || resolvingAddress) && styles.gpsDetectBtnActive]}
            onPress={handleDetectGPS}
            disabled={locating || resolvingAddress}
            activeOpacity={0.8}
          >
            {locating ? (
              <>
                <ActivityIndicator size="small" color="#ffffff" />
                <Text style={styles.gpsDetectBtnText}>{t.field_locating}</Text>
              </>
            ) : resolvingAddress ? (
              <>
                <ActivityIndicator size="small" color="#ffffff" />
                <Text style={styles.gpsDetectBtnText}>{t.field_resolving_addr}</Text>
              </>
            ) : (
              <>
                <Navigation size={16} color="#ffffff" />
                <Text style={styles.gpsDetectBtnText}>{t.field_detect_gps}</Text>
              </>
            )}
          </TouchableOpacity>

          {/* Accuracy & Coords Info */}
          {latitude !== undefined && longitude !== undefined && (
            <View style={styles.coordsInfoBox}>
              <View style={styles.coordsRow}>
                <Text style={styles.coordsText}>
                  📍 {latitude.toFixed(4)}° N, {longitude.toFixed(4)}° E
                </Text>
                {gpsAccuracy !== null && (
                  <View style={styles.accuracyBadge}>
                    <Text style={styles.accuracyBadgeText}>{t.field_accuracy}{gpsAccuracy}m</Text>
                  </View>
                )}
              </View>
            </View>
          )}

          {/* Quick Preset Locations */}
          <Text style={styles.presetLabel}>Quick Presets:</Text>
          <View style={styles.presetRow}>
            {[
              { name: 'Nutakki Center', lat: 16.4382, lng: 80.6010 },
              { name: 'Tadepalli Rural', lat: 16.4750, lng: 80.5900 },
              { name: 'Mangalagiri', lat: 16.4250, lng: 80.5600 },
            ].map((p) => (
              <TouchableOpacity
                key={p.name}
                style={styles.presetChip}
                onPress={() => handlePresetLocation(p.lat, p.lng, p.name)}
              >
                <Text style={styles.presetChipText}>{p.name}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Location Fields */}
          <View style={styles.inputGroup}>
            <Text style={styles.fieldLabel}>{t.field_village}</Text>
            <TextInput
              style={styles.textInput}
              value={village}
              onChangeText={(text) => {
                setVillage(text);
                setManuallyEditedFields((prev) => new Set(prev).add('village'));
              }}
              placeholder="e.g. Nutakki"
              placeholderTextColor={Colors.slate400}
            />
          </View>

          <View style={styles.rowTwoCols}>
            <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
              <Text style={styles.fieldLabel}>{t.field_district}</Text>
              <TextInput
                style={styles.textInput}
                value={district}
                onChangeText={(text) => {
                  setDistrict(text);
                  setManuallyEditedFields((prev) => new Set(prev).add('district'));
                }}
                placeholder="e.g. Guntur District"
                placeholderTextColor={Colors.slate400}
              />
            </View>

            <View style={[styles.inputGroup, { flex: 1 }]}>
              <Text style={styles.fieldLabel}>{t.field_state}</Text>
              <TextInput
                style={styles.textInput}
                value={stateName}
                onChangeText={setStateName}
                placeholder="Andhra Pradesh"
                placeholderTextColor={Colors.slate400}
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.fieldLabel}>{t.field_street}</Text>
            <TextInput
              style={styles.textInput}
              value={street}
              onChangeText={(text) => {
                setStreet(text);
                setManuallyEditedFields((prev) => new Set(prev).add('street'));
              }}
              placeholder="e.g. Main Bazaar Road, Panchayat Ward 3"
              placeholderTextColor={Colors.slate400}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.fieldLabel}>{t.field_landmark}</Text>
            <TextInput
              style={styles.textInput}
              value={landmark}
              onChangeText={(text) => {
                setLandmark(text);
                setManuallyEditedFields((prev) => new Set(prev).add('landmark'));
              }}
              placeholder="e.g. Opposite Community Hall Borewell"
              placeholderTextColor={Colors.slate400}
            />
          </View>
        </View>

        {/* SECTION 2: ISSUE OBSERVATIONS & EVIDENCE */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeaderRow}>
            <View style={styles.sectionIconBadge}>
              <AlertTriangle size={16} color={Colors.primary} />
            </View>
            <Text style={styles.sectionTitle}>Section 2: Issue Observations</Text>
          </View>

          {/* Category Picker */}
          <View style={styles.inputGroup}>
            <Text style={styles.fieldLabel}>{t.field_category}</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll}>
              {categoryOptions.map((cat) => (
                <TouchableOpacity
                  key={cat}
                  style={[styles.chip, category === cat && styles.chipActive]}
                  onPress={() => setCategory(cat)}
                >
                  <Text style={[styles.chipText, category === cat && styles.chipTextActive]}>{cat}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {/* Water Source Picker */}
          <View style={styles.inputGroup}>
            <Text style={styles.fieldLabel}>{t.field_water_source}</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll}>
              {waterSourceOptions.map((src) => (
                <TouchableOpacity
                  key={src}
                  style={[styles.chip, waterSource === src && styles.chipActive]}
                  onPress={() => setWaterSource(src)}
                >
                  <Text style={[styles.chipText, waterSource === src && styles.chipTextActive]}>{src}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {/* Date Observed */}
          <View style={styles.inputGroup}>
            <Text style={styles.fieldLabel}>{t.field_date}</Text>
            <TextInput
              style={styles.textInput}
              value={dateObserved}
              onChangeText={setDateObserved}
              placeholder="YYYY-MM-DD"
              placeholderTextColor={Colors.slate400}
            />
          </View>

          {/* Description */}
          <View style={styles.inputGroup}>
            <Text style={styles.fieldLabel}>{t.field_description}</Text>
            <TextInput
              style={[styles.textInput, styles.textArea]}
              value={description}
              onChangeText={setDescription}
              placeholder={t.field_description_placeholder}
              placeholderTextColor={Colors.slate400}
              multiline
              numberOfLines={4}
            />
          </View>

          {/* Photo Evidence Options (Camera & Gallery) */}
          <View style={styles.inputGroup}>
            <Text style={styles.fieldLabel}>{t.field_photo}</Text>
            <View style={styles.photoBtnRow}>
              <TouchableOpacity
                style={[styles.photoActionBtn, { marginRight: 8 }]}
                onPress={handleTakePhoto}
                activeOpacity={0.8}
              >
                <Camera size={16} color={Colors.primary} />
                <Text style={styles.photoActionBtnText}>{t.field_take_photo}</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.photoActionBtn}
                onPress={handlePickGallery}
                activeOpacity={0.8}
              >
                <Upload size={16} color={Colors.primary} />
                <Text style={styles.photoActionBtnText}>{t.field_choose_photo}</Text>
              </TouchableOpacity>
            </View>

            {photoUri && (
              <View style={styles.photoPreviewWrapper}>
                <Image source={{ uri: photoUri }} style={styles.photoPreview} />
                <TouchableOpacity
                  style={styles.removePhotoBtn}
                  onPress={() => setPhotoUri(null)}
                >
                  <X size={14} color="#ffffff" />
                  <Text style={styles.removePhotoBtnText}>{t.field_remove_photo}</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>

        {/* SECTION 3: EXTENDED ENVIRONMENTAL SURVEY */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeaderRow}>
            <View style={styles.sectionIconBadge}>
              <Layers size={16} color={Colors.primary} />
            </View>
            <Text style={styles.sectionTitle}>{t.survey_section}</Text>
          </View>

          {/* Water Appearance */}
          <View style={styles.inputGroup}>
            <Text style={styles.fieldLabel}>{t.field_appearance}</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll}>
              {appearanceOptions.map((opt) => (
                <TouchableOpacity
                  key={opt}
                  style={[styles.chip, waterAppearance === opt && styles.chipActive]}
                  onPress={() => setWaterAppearance(opt)}
                >
                  <Text style={[styles.chipText, waterAppearance === opt && styles.chipTextActive]}>{opt}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {/* Water Odor / Smell */}
          <View style={styles.inputGroup}>
            <Text style={styles.fieldLabel}>{t.field_smell}</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll}>
              {smellOptions.map((opt) => (
                <TouchableOpacity
                  key={opt}
                  style={[styles.chip, waterSmell === opt && styles.chipActive]}
                  onPress={() => setWaterSmell(opt)}
                >
                  <Text style={[styles.chipText, waterSmell === opt && styles.chipTextActive]}>{opt}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {/* Primary Usage */}
          <View style={styles.inputGroup}>
            <Text style={styles.fieldLabel}>{t.field_usage}</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll}>
              {usageOptions.map((opt) => (
                <TouchableOpacity
                  key={opt}
                  style={[styles.chip, waterUsage === opt && styles.chipActive]}
                  onPress={() => setWaterUsage(opt)}
                >
                  <Text style={[styles.chipText, waterUsage === opt && styles.chipTextActive]}>{opt}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {/* Duration */}
          <View style={styles.inputGroup}>
            <Text style={styles.fieldLabel}>{t.field_duration}</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll}>
              {durationOptions.map((opt) => (
                <TouchableOpacity
                  key={opt}
                  style={[styles.chip, issueDuration === opt && styles.chipActive]}
                  onPress={() => setIssueDuration(opt)}
                >
                  <Text style={[styles.chipText, issueDuration === opt && styles.chipTextActive]}>{opt}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {/* Nearby Wastewater Source */}
          <View style={styles.inputGroup}>
            <Text style={styles.fieldLabel}>{t.field_wastewater}</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll}>
              {wastewaterOptions.map((opt) => (
                <TouchableOpacity
                  key={opt}
                  style={[styles.chip, nearbyWastewater === opt && styles.chipActive]}
                  onPress={() => setNearbyWastewater(opt)}
                >
                  <Text style={[styles.chipText, nearbyWastewater === opt && styles.chipTextActive]}>{opt}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {/* Distance to Wastewater */}
          <View style={styles.inputGroup}>
            <Text style={styles.fieldLabel}>{t.field_distance}</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll}>
              {distanceOptions.map((opt) => (
                <TouchableOpacity
                  key={opt}
                  style={[styles.chip, suspectedDistance === opt && styles.chipActive]}
                  onPress={() => setSuspectedDistance(opt)}
                >
                  <Text style={[styles.chipText, suspectedDistance === opt && styles.chipTextActive]}>{opt}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {/* Citizen Priority Level */}
          <View style={styles.inputGroup}>
            <Text style={styles.fieldLabel}>{t.field_priority}</Text>
            <View style={styles.priorityRow}>
              {priorityOptions.map((p) => {
                const isSelected = citizenPriority === p;
                let color = Colors.primary;
                if (p === 'Urgent') color = Colors.danger;
                if (p === 'High') color = Colors.warning;

                return (
                  <TouchableOpacity
                    key={p}
                    style={[
                      styles.priorityChip,
                      isSelected && { backgroundColor: color, borderColor: color },
                    ]}
                    onPress={() => setCitizenPriority(p)}
                  >
                    <Text
                      style={[
                        styles.priorityChipText,
                        isSelected && { color: '#ffffff', fontWeight: '800' },
                      ]}
                    >
                      {p}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        </View>

        {/* SECTION 4: CITIZEN INFORMATION & ETHICS */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeaderRow}>
            <View style={styles.sectionIconBadge}>
              <ShieldAlert size={16} color={Colors.primary} />
            </View>
            <Text style={styles.sectionTitle}>Section 4: Citizen Ethics</Text>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.fieldLabel}>{t.field_name}</Text>
            <TextInput
              style={styles.textInput}
              value={reporterName}
              onChangeText={setReporterName}
              placeholder="e.g. Ramesh Kumar"
              placeholderTextColor={Colors.slate400}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.fieldLabel}>{t.field_contact}</Text>
            <TextInput
              style={styles.textInput}
              value={reporterContact}
              onChangeText={setReporterContact}
              placeholder="e.g. 98480xxxxx"
              placeholderTextColor={Colors.slate400}
              keyboardType="phone-pad"
            />
          </View>

          <TouchableOpacity
            style={styles.ethicsBox}
            onPress={() => setEthicsAgreed(!ethicsAgreed)}
            activeOpacity={0.8}
          >
            <View style={[styles.checkbox, ethicsAgreed && styles.checkboxActive]}>
              {ethicsAgreed && <Check size={14} color="#ffffff" strokeWidth={3} />}
            </View>
            <Text style={styles.ethicsText}>{t.field_ethics}</Text>
          </TouchableOpacity>

          {/* Action Buttons */}
          <TouchableOpacity
            style={[styles.submitBtn, submitting && styles.submitBtnDisabled]}
            onPress={handleSubmit}
            disabled={submitting}
            activeOpacity={0.8}
          >
            {submitting ? (
              <>
                <ActivityIndicator size="small" color="#ffffff" />
                <Text style={styles.submitBtnText}>{t.btn_submitting}</Text>
              </>
            ) : (
              <>
                <CheckCircle size={18} color="#ffffff" />
                <Text style={styles.submitBtnText}>{t.btn_submit}</Text>
              </>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.saveDraftBtn}
            onPress={handleSaveOffline}
            activeOpacity={0.8}
          >
            <Save size={16} color={Colors.primary} />
            <Text style={styles.saveDraftBtnText}>{t.btn_save_draft}</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* OFFLINE QUEUE MODAL */}
      <Modal
        visible={showOfflineModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowOfflineModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <View style={styles.modalTitleRow}>
                <Clock size={18} color={Colors.primary} />
                <Text style={styles.modalTitle}>{t.offline_section}</Text>
              </View>
              <TouchableOpacity onPress={() => setShowOfflineModal(false)}>
                <X size={20} color={Colors.slate500} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              {offlineDrafts.length === 0 ? (
                <View style={styles.emptyDraftsBox}>
                  <Text style={styles.emptyDraftsText}>{t.offline_no_drafts}</Text>
                </View>
              ) : (
                offlineDrafts.map((draft) => (
                  <View key={draft.localId} style={styles.draftCard}>
                    <View style={styles.draftCardHeader}>
                      <Text style={styles.draftCategory}>{draft.data.category}</Text>
                      <View
                        style={[
                          styles.draftStatusBadge,
                          draft.syncStatus === 'submitted'
                            ? { backgroundColor: Colors.successBg }
                            : draft.syncStatus === 'failed'
                            ? { backgroundColor: Colors.dangerBg }
                            : { backgroundColor: Colors.warningBg },
                        ]}
                      >
                        <Text
                          style={[
                            styles.draftStatusBadgeText,
                            draft.syncStatus === 'submitted'
                              ? { color: Colors.success }
                              : draft.syncStatus === 'failed'
                              ? { color: Colors.danger }
                              : { color: Colors.warning },
                          ]}
                        >
                          {draft.syncStatus.toUpperCase()}
                        </Text>
                      </View>
                    </View>

                    <Text style={styles.draftVillage}>📍 {draft.data.village}</Text>
                    <Text style={styles.draftDesc} numberOfLines={2}>
                      {draft.data.description}
                    </Text>

                    {draft.serverReportId && (
                      <Text style={styles.serverReportIdText}>
                        Portal ID: {draft.serverReportId}
                      </Text>
                    )}

                    <View style={styles.draftActionRow}>
                      {draft.syncStatus !== 'submitted' && (
                        <TouchableOpacity
                          style={styles.draftSyncBtn}
                          onPress={async () => {
                            await syncSingleReport(draft.localId);
                            await refreshOfflineDrafts();
                          }}
                        >
                          <RefreshCw size={13} color="#ffffff" />
                          <Text style={styles.draftSyncBtnText}>Sync Now</Text>
                        </TouchableOpacity>
                      )}

                      <TouchableOpacity
                        style={styles.draftDeleteBtn}
                        onPress={async () => {
                          await deleteOfflineReport(draft.localId);
                          await refreshOfflineDrafts();
                        }}
                      >
                        <Trash2 size={13} color={Colors.danger} />
                        <Text style={styles.draftDeleteBtnText}>Delete</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ))
              )}
            </ScrollView>

            <View style={styles.modalFooter}>
              {offlineDrafts.some((d) => d.syncStatus !== 'submitted') && (
                <TouchableOpacity
                  style={[styles.syncAllBtn, syncingAll && { opacity: 0.7 }]}
                  disabled={syncingAll}
                  onPress={async () => {
                    setSyncingAll(true);
                    await syncAllPendingReports();
                    await refreshOfflineDrafts();
                    setSyncingAll(false);
                  }}
                >
                  {syncingAll ? (
                    <ActivityIndicator size="small" color="#ffffff" />
                  ) : (
                    <RefreshCw size={15} color="#ffffff" />
                  )}
                  <Text style={styles.syncAllBtnText}>{t.offline_sync_all}</Text>
                </TouchableOpacity>
              )}

              {offlineDrafts.some((d) => d.syncStatus === 'submitted') && (
                <TouchableOpacity
                  style={styles.clearSubmittedBtn}
                  onPress={async () => {
                    await clearSubmittedOfflineReports();
                    await refreshOfflineDrafts();
                  }}
                >
                  <Text style={styles.clearSubmittedBtnText}>Clear Submitted</Text>
                </TouchableOpacity>
              )}
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
    flex: 1,
  },
  logoCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.navy,
  },
  headerSubtitle: {
    fontSize: 11,
    color: Colors.slate500,
  },
  headerBtnGroup: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  langPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primaryBg,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 14,
    marginRight: 6,
  },
  langPillText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.primary,
    marginLeft: 4,
  },
  queuePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    padding: 6,
    borderRadius: 14,
    position: 'relative',
  },
  queueBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: Colors.danger,
    borderRadius: 8,
    width: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  queueBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#ffffff',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  sectionCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    ...Shadows.card,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  sectionIconBadge: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: Colors.primaryBg,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: Colors.navy,
  },
  gpsDetectBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
    borderRadius: 12,
    paddingVertical: 12,
    marginBottom: 12,
    gap: 8,
  },
  gpsDetectBtnActive: {
    backgroundColor: Colors.primaryDark,
  },
  gpsDetectBtnText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
  },
  coordsInfoBox: {
    backgroundColor: '#F1F5F9',
    borderRadius: 10,
    padding: 10,
    marginBottom: 12,
  },
  coordsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  coordsText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.navy,
  },
  accuracyBadge: {
    backgroundColor: Colors.primaryBg,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  accuracyBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.primary,
  },
  presetLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.slate500,
    marginBottom: 6,
  },
  presetRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 14,
  },
  presetChip: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  presetChipText: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.slate600,
  },
  inputGroup: {
    marginBottom: 12,
  },
  rowTwoCols: {
    flexDirection: 'row',
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.navy,
    marginBottom: 5,
  },
  textInput: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 9,
    fontSize: 13,
    color: Colors.navy,
  },
  textArea: {
    height: 90,
    textAlignVertical: 'top',
  },
  chipScroll: {
    flexDirection: 'row',
    marginHorizontal: -4,
  },
  chip: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 10,
    marginHorizontal: 4,
  },
  chipActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  chipText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.slate600,
  },
  chipTextActive: {
    color: '#ffffff',
    fontWeight: '700',
  },
  priorityRow: {
    flexDirection: 'row',
    gap: 8,
  },
  priorityChip: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 10,
    paddingVertical: 8,
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
  },
  priorityChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.slate600,
  },
  photoBtnRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  photoActionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primaryBg,
    borderWidth: 1,
    borderColor: Colors.primaryLight,
    paddingVertical: 10,
    borderRadius: 10,
    gap: 6,
  },
  photoActionBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.primary,
  },
  photoPreviewWrapper: {
    position: 'relative',
    marginTop: 8,
  },
  photoPreview: {
    width: '100%',
    height: 180,
    borderRadius: 12,
  },
  removePhotoBtn: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(0,0,0,0.65)',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4,
  },
  removePhotoBtnText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '600',
  },
  ethicsBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 10,
    padding: 10,
    marginBottom: 16,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 5,
    borderWidth: 1.5,
    borderColor: Colors.slate400,
    marginRight: 10,
    marginTop: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  ethicsText: {
    flex: 1,
    fontSize: 11,
    color: Colors.slate600,
    lineHeight: 16,
  },
  submitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
    borderRadius: 12,
    paddingVertical: 13,
    marginBottom: 10,
    gap: 8,
  },
  submitBtnDisabled: {
    opacity: 0.65,
  },
  submitBtnText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '800',
  },
  saveDraftBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primaryBg,
    borderRadius: 12,
    paddingVertical: 11,
    gap: 6,
  },
  saveDraftBtnText: {
    color: Colors.primary,
    fontSize: 13,
    fontWeight: '700',
  },
  // Success styles
  successScroll: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 20,
  },
  successCard: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    ...Shadows.card,
  },
  successIconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: Colors.primaryBg,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  successTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: Colors.navy,
    marginBottom: 8,
    textAlign: 'center',
  },
  successDesc: {
    fontSize: 13,
    color: Colors.slate600,
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 18,
  },
  trackingBox: {
    width: '100%',
    backgroundColor: '#F1F5F9',
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
    marginBottom: 14,
  },
  trackingLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: Colors.slate500,
    letterSpacing: 1,
    marginBottom: 4,
  },
  trackingValue: {
    fontSize: 18,
    fontWeight: '900',
    color: Colors.primary,
    letterSpacing: 1,
  },
  priorityNoticePill: {
    backgroundColor: Colors.primaryBg,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    marginBottom: 20,
  },
  priorityNoticeText: {
    fontSize: 12,
    color: Colors.navy,
  },
  successActionColumn: {
    width: '100%',
    gap: 10,
  },
  primaryActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
    borderRadius: 12,
    paddingVertical: 12,
    gap: 8,
  },
  primaryActionBtnText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
  },
  secondaryActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingVertical: 12,
    gap: 8,
  },
  secondaryActionBtnText: {
    color: Colors.primary,
    fontSize: 14,
    fontWeight: '700',
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
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
  modalTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.navy,
  },
  modalBody: {
    marginVertical: 12,
  },
  emptyDraftsBox: {
    padding: 30,
    alignItems: 'center',
  },
  emptyDraftsText: {
    color: Colors.slate400,
    fontSize: 13,
  },
  draftCard: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
  },
  draftCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  draftCategory: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.navy,
  },
  draftStatusBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  draftStatusBadgeText: {
    fontSize: 9,
    fontWeight: '800',
  },
  draftVillage: {
    fontSize: 12,
    color: Colors.slate600,
    marginBottom: 4,
  },
  draftDesc: {
    fontSize: 12,
    color: Colors.slate500,
    lineHeight: 16,
    marginBottom: 8,
  },
  serverReportIdText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.success,
    marginBottom: 6,
  },
  draftActionRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
  },
  draftSyncBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    gap: 4,
  },
  draftSyncBtnText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '700',
  },
  draftDeleteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.dangerBg,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 8,
    gap: 4,
  },
  draftDeleteBtnText: {
    color: Colors.danger,
    fontSize: 11,
    fontWeight: '700',
  },
  modalFooter: {
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  syncAllBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
    borderRadius: 10,
    paddingVertical: 10,
    gap: 6,
  },
  syncAllBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
  },
  clearSubmittedBtn: {
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  clearSubmittedBtnText: {
    color: Colors.slate600,
    fontSize: 12,
    fontWeight: '600',
  },
});
