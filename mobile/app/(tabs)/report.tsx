import React, { useState, useEffect } from 'react';
import { 
  View, Text, StyleSheet, TextInput, TouchableOpacity, 
  ScrollView, Image, ActivityIndicator, Alert, Platform, Linking 
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { 
  AlertTriangle, MapPin, Calendar, Droplets, Camera, 
  Upload, CheckCircle, Navigation, X, ShieldAlert, Sparkles, ArrowRight,
  Save, RefreshCw, Share2, Globe, Clock, Check
} from 'lucide-react-native';
import { Colors, Shadows } from '../../constants/theme';
import { submitNewReport } from '../../services/api';
import { 
  getOfflineReports, 
  saveOfflineReport, 
  syncSingleReport, 
  syncAllPendingReports, 
  deleteOfflineReport,
  OfflineReport 
} from '../../services/offlineStorage';
import { translations, LanguageCode, getSavedLanguage, saveLanguage } from '../../constants/translations';

export default function ReportScreen() {
  const router = useRouter();

  // Language state
  const [lang, setLang] = useState<LanguageCode>('en');
  const t = translations[lang];

  // Form states
  const [village, setVillage] = useState('Nutakki');
  const [customVillage, setCustomVillage] = useState('');
  const [category, setCategory] = useState('Unusual water colour');
  const [waterSource, setWaterSource] = useState('Borewell / Hand pump');
  const [dateObserved, setDateObserved] = useState(new Date().toISOString().split('T')[0]);
  const [landmark, setLandmark] = useState('');
  const [description, setDescription] = useState('');
  const [latitude, setLatitude] = useState<number | undefined>(16.4382);
  const [longitude, setLongitude] = useState<number | undefined>(80.6010);
  const [reporterName, setReporterName] = useState('');
  const [reporterContact, setReporterContact] = useState('');
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [ethicsAgreed, setEthicsAgreed] = useState(false);

  // Status & Offline states
  const [locating, setLocating] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submissionResult, setSubmissionResult] = useState<{ report_id: string } | null>(null);
  const [offlineDrafts, setOfflineDrafts] = useState<OfflineReport[]>([]);
  const [syncingAll, setSyncingAll] = useState(false);
  const [showOfflineQueue, setShowOfflineQueue] = useState(false);

  const villageOptions = ['Nutakki', 'Tadepalli Rural', 'Mangalagiri Rural', 'Kunchanapalli', 'Other'];
  const categoryOptions = [
    'Unusual water colour',
    'Bad smell or taste',
    'Drainage problems',
    'Suspected waste dumping',
    'Leaking pipes',
    'Agricultural runoff',
    'Other'
  ];
  const waterSourceOptions = [
    'Borewell / Hand pump',
    'Open well',
    'Piped municipal tap water',
    'Irrigation canal / Ditch',
    'Stagnant pond / Seepage'
  ];

  useEffect(() => {
    // Load saved language
    getSavedLanguage().then((l) => setLang(l));
    // Load offline drafts
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

  const handlePickPhoto = async () => {
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        Alert.alert('Permission Denied', 'Please enable photo library access to attach proof.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets.length > 0) {
        setPhotoUri(result.assets[0].uri);
      }
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Could not pick image');
    }
  };

  const handleGetLocation = async () => {
    setLocating(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Location Permission', 'Permission is needed to automatically attach GPS coordinates.');
        return;
      }

      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      setLatitude(loc.coords.latitude);
      setLongitude(loc.coords.longitude);
      Alert.alert('Location Detected', `Latitude: ${loc.coords.latitude.toFixed(4)}, Longitude: ${loc.coords.longitude.toFixed(4)}`);
    } catch (err: any) {
      Alert.alert('Location Error', 'Could not detect device GPS: ' + err.message);
    } finally {
      setLocating(false);
    }
  };

  const handlePresetLocation = (lat: number, lng: number) => {
    setLatitude(lat);
    setLongitude(lng);
  };

  const handleSaveOfflineDraft = async () => {
    const finalVillage = village === 'Other' ? customVillage.trim() : village;
    if (!description.trim()) {
      Alert.alert('Validation', t.val_desc);
      return;
    }

    try {
      await saveOfflineReport({
        data: {
          village: finalVillage || 'Nutakki',
          category,
          water_source: waterSource,
          date_observed: dateObserved,
          landmark: landmark.trim(),
          description: description.trim(),
          latitude,
          longitude,
          reporter_name: reporterName.trim() || 'Anonymous Community Member',
          reporter_contact: reporterContact.trim(),
        },
        photoUri: photoUri || undefined,
        syncStatus: 'draft',
      });

      await refreshOfflineDrafts();
      Alert.alert(t.offline_saved_alert, t.offline_saved_desc);
      setShowOfflineQueue(true);
    } catch (err: any) {
      Alert.alert('Error', 'Could not save offline draft.');
    }
  };

  const handleSubmit = async () => {
    const finalVillage = village === 'Other' ? customVillage.trim() : village;

    if (!finalVillage) {
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
    try {
      const res = await submitNewReport(
        {
          village: finalVillage,
          category,
          water_source: waterSource,
          date_observed: dateObserved,
          landmark: landmark.trim(),
          description: description.trim(),
          latitude,
          longitude,
          reporter_name: reporterName.trim() || 'Anonymous Community Member',
          reporter_contact: reporterContact.trim(),
        },
        photoUri || undefined
      );

      setSubmissionResult(res);
    } catch (err: any) {
      // Prompt user to save as offline draft
      Alert.alert(
        'Submission Offline',
        `Network connection failed: ${err.message || 'Server unreachable'}.\nWould you like to save this observation as an offline draft to sync later?`,
        [
          { text: 'Cancel', style: 'cancel' },
          { 
            text: 'Save Offline Draft', 
            onPress: async () => {
              await saveOfflineReport({
                data: {
                  village: finalVillage,
                  category,
                  water_source: waterSource,
                  date_observed: dateObserved,
                  landmark: landmark.trim(),
                  description: description.trim(),
                  latitude,
                  longitude,
                  reporter_name: reporterName.trim() || 'Anonymous Community Member',
                  reporter_contact: reporterContact.trim(),
                },
                photoUri: photoUri || undefined,
                syncStatus: 'pending',
              });
              await refreshOfflineDrafts();
              setShowOfflineQueue(true);
            }
          }
        ]
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleSyncItem = async (localId: string) => {
    const res = await syncSingleReport(localId);
    await refreshOfflineDrafts();
    if (res.success) {
      Alert.alert('Synced Successfully', `Report synced with Server ID: ${res.reportId}`);
    } else {
      Alert.alert('Sync Failed', res.error || 'Server still unreachable.');
    }
  };

  const handleSyncAll = async () => {
    setSyncingAll(true);
    try {
      const result = await syncAllPendingReports();
      await refreshOfflineDrafts();
      Alert.alert('Sync Complete', `Synced: ${result.synced}, Failed: ${result.failed}`);
    } catch (err: any) {
      Alert.alert('Sync Error', err.message || 'Could not complete sync.');
    } finally {
      setSyncingAll(false);
    }
  };

  const handleDeleteDraft = async (localId: string) => {
    await deleteOfflineReport(localId);
    await refreshOfflineDrafts();
  };

  const handleShareWhatsApp = (reportId: string) => {
    const text = `💧 *JalaWatch Groundwater Observation*\n🆔 *Report ID:* ${reportId}\n📍 *Village:* ${village}\n⚠️ *Concern:* ${category}\n\nTrack progress on: https://eswar8328198233.github.io/JalaWatch/`;
    Linking.openURL(`whatsapp://send?text=${encodeURIComponent(text)}`).catch(() => {
      Alert.alert('WhatsApp Error', 'Could not open WhatsApp on this device.');
    });
  };

  const handleReset = () => {
    setSubmissionResult(null);
    setLandmark('');
    setDescription('');
    setPhotoUri(null);
    setEthicsAgreed(false);
  };

  // Success view
  if (submissionResult) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <ScrollView contentContainerStyle={styles.successContainer}>
          <View style={styles.successIconCircle}>
            <CheckCircle size={38} color={Colors.success} strokeWidth={2.5} />
          </View>

          <Text style={styles.successHeading}>{t.success_title}</Text>
          <Text style={styles.successSubtext}>{t.success_desc}</Text>

          <View style={styles.idBox}>
            <Text style={styles.idBoxLabel}>{t.unique_id}</Text>
            <Text style={styles.idBoxValue}>{submissionResult.report_id}</Text>
            <Text style={styles.idBoxHint}>Reference ID for Gram Panchayat inquiries.</Text>
          </View>

          <TouchableOpacity
            style={styles.whatsAppBtn}
            onPress={() => handleShareWhatsApp(submissionResult.report_id)}
          >
            <Share2 size={16} color="#ffffff" />
            <Text style={styles.whatsAppBtnText}>{t.share_report}</Text>
          </TouchableOpacity>

          <View style={styles.disclaimerCard}>
            <ShieldAlert size={16} color={Colors.warning} />
            <Text style={styles.disclaimerCardText}>
              Published as an unverified civic observation. Appearance or odor alone cannot replace certified laboratory water testing.
            </Text>
          </View>

          <TouchableOpacity
            style={styles.primaryBtn}
            onPress={() => router.navigate('/(tabs)')}
          >
            <Text style={styles.primaryBtnText}>{t.view_live_map}</Text>
            <ArrowRight size={16} color="#ffffff" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.secondaryBtn} onPress={handleReset}>
            <Text style={styles.secondaryBtnText}>{t.submit_another}</Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      
      {/* Header with Language Switcher */}
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <Text style={styles.screenTitle}>{t.report_title}</Text>
          <Text style={styles.screenSubtitle}>{t.report_subtitle}</Text>
        </View>

        <TouchableOpacity onPress={handleToggleLang} style={styles.langPill}>
          <Globe size={13} color={Colors.primary} />
          <Text style={styles.langPillText}>{t.lang_toggle}</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.formContent} showsVerticalScrollIndicator={false}>
        
        {/* Offline Queue Toggle Bar */}
        {offlineDrafts.length > 0 && (
          <View style={styles.offlineAlertBar}>
            <View style={{ flex: 1 }}>
              <Text style={styles.offlineAlertTitle}>
                {offlineDrafts.length} Local Draft(s) / Pending Sync
              </Text>
              <Text style={styles.offlineAlertSub}>
                Tap to review offline submissions or retry synchronization
              </Text>
            </View>
            <TouchableOpacity 
              onPress={() => setShowOfflineQueue(!showOfflineQueue)}
              style={styles.offlineToggleBtn}
            >
              <Text style={styles.offlineToggleText}>
                {showOfflineQueue ? 'Hide Queue' : 'View Queue'}
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Offline Queue Expanded List */}
        {showOfflineQueue && offlineDrafts.length > 0 && (
          <View style={styles.offlineQueueContainer}>
            <View style={styles.queueHeader}>
              <Text style={styles.queueHeading}>{t.offline_section}</Text>
              <TouchableOpacity 
                onPress={handleSyncAll} 
                disabled={syncingAll}
                style={styles.syncAllBtn}
              >
                {syncingAll ? (
                  <ActivityIndicator size="small" color="#ffffff" />
                ) : (
                  <>
                    <RefreshCw size={12} color="#ffffff" />
                    <Text style={styles.syncAllBtnText}>{t.offline_sync_all}</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>

            {offlineDrafts.map((draft) => (
              <View key={draft.localId} style={styles.queueItem}>
                <View style={{ flex: 1, gap: 2 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Text style={styles.draftId}>{draft.serverReportId || draft.localId}</Text>
                    <View style={[
                      styles.statusPill, 
                      draft.syncStatus === 'submitted' ? styles.statusSubmitted :
                      draft.syncStatus === 'syncing' ? styles.statusSyncing :
                      draft.syncStatus === 'failed' ? styles.statusFailed :
                      styles.statusPending
                    ]}>
                      <Text style={styles.statusPillText}>
                        {draft.syncStatus === 'submitted' ? t.offline_submitted :
                         draft.syncStatus === 'syncing' ? t.offline_syncing :
                         draft.syncStatus === 'failed' ? t.offline_failed :
                         t.offline_pending}
                      </Text>
                    </View>
                  </View>
                  <Text style={styles.draftSummary}>
                    {draft.data.village} • {draft.data.category}
                  </Text>
                  {draft.syncError && (
                    <Text style={styles.draftError}>{draft.syncError}</Text>
                  )}
                </View>

                <View style={{ flexDirection: 'row', gap: 6 }}>
                  {draft.syncStatus !== 'submitted' && (
                    <TouchableOpacity
                      onPress={() => handleSyncItem(draft.localId)}
                      style={styles.retryBtn}
                    >
                      <RefreshCw size={12} color={Colors.primary} />
                    </TouchableOpacity>
                  )}
                  <TouchableOpacity
                    onPress={() => handleDeleteDraft(draft.localId)}
                    style={styles.deleteDraftBtn}
                  >
                    <X size={12} color={Colors.error} />
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Locality */}
        <View style={styles.fieldGroup}>
          <Text style={styles.fieldLabel}>{t.field_village}</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.pillRow}>
            {villageOptions.map((v) => {
              const isSelected = village === v;
              return (
                <TouchableOpacity
                  key={v}
                  onPress={() => setVillage(v)}
                  style={[styles.selectPill, isSelected && styles.selectPillActive]}
                >
                  <Text style={[styles.selectPillText, isSelected && styles.selectPillTextActive]}>{v}</Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {village === 'Other' && (
            <TextInput
              placeholder="Specify Village / Locality name..."
              placeholderTextColor={Colors.slate400}
              value={customVillage}
              onChangeText={setCustomVillage}
              style={[styles.input, { marginTop: 8 }]}
            />
          )}
        </View>

        {/* Issue Category */}
        <View style={styles.fieldGroup}>
          <Text style={styles.fieldLabel}>{t.field_category}</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.pillRow}>
            {categoryOptions.map((c) => {
              const isSelected = category === c;
              return (
                <TouchableOpacity
                  key={c}
                  onPress={() => setCategory(c)}
                  style={[styles.selectPill, isSelected && styles.selectPillActive]}
                >
                  <Text style={[styles.selectPillText, isSelected && styles.selectPillTextActive]}>{c}</Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* Water Source */}
        <View style={styles.fieldGroup}>
          <Text style={styles.fieldLabel}>{t.field_water_source}</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.pillRow}>
            {waterSourceOptions.map((s) => {
              const isSelected = waterSource === s;
              return (
                <TouchableOpacity
                  key={s}
                  onPress={() => setWaterSource(s)}
                  style={[styles.selectPill, isSelected && styles.selectPillActive]}
                >
                  <Text style={[styles.selectPillText, isSelected && styles.selectPillTextActive]}>{s}</Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* Landmark & Date */}
        <View style={styles.fieldGroup}>
          <Text style={styles.fieldLabel}>{t.field_landmark}</Text>
          <TextInput
            placeholder="e.g. Near Ramalayam Temple, Old Panchayat well"
            placeholderTextColor={Colors.slate400}
            value={landmark}
            onChangeText={setLandmark}
            style={styles.input}
          />
        </View>

        {/* GPS Coordinates Picker */}
        <View style={styles.fieldGroup}>
          <View style={styles.labelRow}>
            <Text style={styles.fieldLabel}>{t.field_gps}</Text>
            <TouchableOpacity onPress={handleGetLocation} style={styles.gpsDetectBtn} disabled={locating}>
              <Navigation size={12} color={Colors.primary} />
              <Text style={styles.gpsDetectText}>{locating ? 'Detecting...' : t.field_detect_gps}</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.coordDisplayBox}>
            <MapPin size={14} color={Colors.primary} />
            <Text style={styles.coordText}>
              {latitude && longitude
                ? `${latitude.toFixed(4)}° N, ${longitude.toFixed(4)}° E`
                : 'No coordinates selected'}
            </Text>
          </View>

          {/* Quick Presets */}
          <View style={styles.presetsRow}>
            <Text style={styles.presetLabel}>Presets:</Text>
            <TouchableOpacity onPress={() => handlePresetLocation(16.4382, 80.6010)} style={styles.presetChip}>
              <Text style={styles.presetChipText}>Nutakki Center</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => handlePresetLocation(16.4410, 80.6035)} style={styles.presetChip}>
              <Text style={styles.presetChipText}>ZP School</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => handlePresetLocation(16.4355, 80.6080)} style={styles.presetChip}>
              <Text style={styles.presetChipText}>River Bund</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Detailed Observation */}
        <View style={styles.fieldGroup}>
          <Text style={styles.fieldLabel}>{t.field_description}</Text>
          <TextInput
            placeholder={t.field_description_placeholder}
            placeholderTextColor={Colors.slate400}
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={4}
            style={[styles.input, styles.textArea]}
          />
        </View>

        {/* Evidence Photo */}
        <View style={styles.fieldGroup}>
          <Text style={styles.fieldLabel}>{t.field_photo}</Text>
          {photoUri ? (
            <View style={styles.photoPreviewWrapper}>
              <Image source={{ uri: photoUri }} style={styles.photoPreview} />
              <TouchableOpacity onPress={() => setPhotoUri(null)} style={styles.photoRemoveBtn}>
                <X size={14} color="#ffffff" />
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity onPress={handlePickPhoto} style={styles.photoUploadBtn}>
              <Camera size={20} color={Colors.primary} />
              <Text style={styles.photoUploadText}>{t.field_choose_photo}</Text>
              <Text style={styles.photoUploadSubtext}>JPG, PNG, WEBP (Max 5MB)</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Reporter Privacy Info */}
        <View style={styles.fieldGroup}>
          <Text style={styles.fieldLabel}>{t.field_name}</Text>
          <TextInput
            placeholder="Leave blank to remain completely Anonymous"
            placeholderTextColor={Colors.slate400}
            value={reporterName}
            onChangeText={setReporterName}
            style={styles.input}
          />
        </View>

        {/* Ethics Confirmation */}
        <TouchableOpacity
          onPress={() => setEthicsAgreed(!ethicsAgreed)}
          style={styles.ethicsContainer}
          activeOpacity={0.8}
        >
          <View style={[styles.checkbox, ethicsAgreed && styles.checkboxActive]}>
            {ethicsAgreed && <CheckCircle size={14} color="#ffffff" />}
          </View>
          <Text style={styles.ethicsText}>{t.field_ethics}</Text>
        </TouchableOpacity>

        {/* Actions Row */}
        <View style={styles.actionButtonsRow}>
          <TouchableOpacity
            onPress={handleSaveOfflineDraft}
            style={styles.draftBtn}
            activeOpacity={0.8}
          >
            <Save size={16} color={Colors.slate700} />
            <Text style={styles.draftBtnText}>{t.btn_save_draft}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleSubmit}
            disabled={submitting}
            style={[styles.submitBtn, submitting && styles.btnDisabled]}
            activeOpacity={0.8}
          >
            {submitting ? (
              <ActivityIndicator size="small" color="#ffffff" />
            ) : (
              <>
                <AlertTriangle size={16} color="#ffffff" />
                <Text style={styles.submitBtnText}>{t.btn_submit}</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  header: {
    paddingHorizontal: 18,
    paddingTop: 8,
    paddingBottom: 10,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  screenTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: Colors.slate900,
  },
  screenSubtitle: {
    fontSize: 11,
    color: Colors.slate500,
    marginTop: 2,
  },
  langPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 16,
    backgroundColor: '#f0fdfa',
    borderWidth: 1,
    borderColor: '#ccfbf1',
  },
  langPillText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.primary,
  },
  formContent: {
    padding: 18,
    gap: 16,
    backgroundColor: '#f8fafc',
    paddingBottom: 40,
  },
  offlineAlertBar: {
    backgroundColor: '#fffbeb',
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: '#fef3c7',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  offlineAlertTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#92400e',
  },
  offlineAlertSub: {
    fontSize: 10,
    color: '#b45309',
    marginTop: 1,
  },
  offlineToggleBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: '#fde68a',
    borderRadius: 10,
  },
  offlineToggleText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#78350f',
  },
  offlineQueueContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    gap: 10,
  },
  queueHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    paddingBottom: 8,
  },
  queueHeading: {
    fontSize: 12,
    fontWeight: '800',
    color: Colors.slate800,
  },
  syncAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.primary,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  syncAllBtnText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#ffffff',
  },
  queueItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 10,
    borderRadius: 12,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  draftId: {
    fontSize: 11,
    fontWeight: '800',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    color: Colors.slate800,
  },
  draftSummary: {
    fontSize: 11,
    color: Colors.slate600,
  },
  draftError: {
    fontSize: 10,
    color: Colors.error,
  },
  statusPill: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  statusPending: {
    backgroundColor: '#fef3c7',
  },
  statusSyncing: {
    backgroundColor: '#e0f2fe',
  },
  statusFailed: {
    backgroundColor: '#fee2e2',
  },
  statusSubmitted: {
    backgroundColor: '#d1fae5',
  },
  statusPillText: {
    fontSize: 9,
    fontWeight: '700',
    color: Colors.slate800,
  },
  retryBtn: {
    padding: 6,
    borderRadius: 8,
    backgroundColor: '#f0fdfa',
    borderWidth: 1,
    borderColor: '#ccfbf1',
  },
  deleteDraftBtn: {
    padding: 6,
    borderRadius: 8,
    backgroundColor: '#fef2f2',
    borderWidth: 1,
    borderColor: '#fee2e2',
  },
  fieldGroup: {
    gap: 6,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: '800',
    color: Colors.slate700,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  pillRow: {
    gap: 6,
    paddingVertical: 2,
  },
  selectPill: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 12,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  selectPillActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  selectPillText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.slate700,
  },
  selectPillTextActive: {
    color: '#ffffff',
  },
  input: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 13,
    color: Colors.slate900,
  },
  textArea: {
    minHeight: 90,
    textAlignVertical: 'top',
  },
  gpsDetectBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: '#f0fdfa',
  },
  gpsDetectText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.primary,
  },
  coordDisplayBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#ffffff',
    padding: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  coordText: {
    fontSize: 12,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    color: Colors.slate700,
  },
  presetsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
  },
  presetLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.slate400,
  },
  presetChip: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: '#ffffff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  presetChipText: {
    fontSize: 10,
    fontWeight: '600',
    color: Colors.slate700,
  },
  photoUploadBtn: {
    backgroundColor: '#ffffff',
    borderWidth: 1.5,
    borderColor: '#ccfbf1',
    borderStyle: 'dashed',
    borderRadius: 16,
    padding: 18,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  photoUploadText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.primary,
  },
  photoUploadSubtext: {
    fontSize: 10,
    color: Colors.slate400,
  },
  photoPreviewWrapper: {
    position: 'relative',
    borderRadius: 14,
    overflow: 'hidden',
    height: 160,
  },
  photoPreview: {
    width: '100%',
    height: '100%',
  },
  photoRemoveBtn: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(0,0,0,0.6)',
    padding: 6,
    borderRadius: 12,
  },
  ethicsContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    padding: 12,
    backgroundColor: '#f1f5f9',
    borderRadius: 14,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: Colors.slate400,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffffff',
    marginTop: 2,
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
  actionButtonsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 6,
  },
  draftBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 16,
    paddingVertical: 14,
  },
  draftBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.slate700,
  },
  submitBtn: {
    flex: 1.5,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: Colors.primary,
    borderRadius: 16,
    paddingVertical: 14,
  },
  btnDisabled: {
    opacity: 0.6,
  },
  submitBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#ffffff',
  },
  successContainer: {
    padding: 24,
    alignItems: 'center',
    gap: 16,
  },
  successIconCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: '#ecfdf5',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#a7f3d0',
  },
  successHeading: {
    fontSize: 22,
    fontWeight: '900',
    color: Colors.slate900,
  },
  successSubtext: {
    fontSize: 12,
    color: Colors.slate600,
    textAlign: 'center',
    lineHeight: 18,
  },
  idBox: {
    width: '100%',
    backgroundColor: '#f8fafc',
    borderRadius: 18,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    gap: 4,
  },
  idBoxLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: Colors.slate400,
    letterSpacing: 0.5,
  },
  idBoxValue: {
    fontSize: 22,
    fontWeight: '900',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    color: Colors.primary,
  },
  idBoxHint: {
    fontSize: 10,
    color: Colors.slate500,
  },
  whatsAppBtn: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#25D366',
    borderRadius: 14,
    paddingVertical: 12,
  },
  whatsAppBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#ffffff',
  },
  disclaimerCard: {
    flexDirection: 'row',
    gap: 8,
    backgroundColor: '#fffbeb',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: '#fef3c7',
  },
  disclaimerCardText: {
    flex: 1,
    fontSize: 11,
    color: '#92400e',
    lineHeight: 15,
  },
  primaryBtn: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: Colors.primary,
    borderRadius: 16,
    paddingVertical: 14,
  },
  primaryBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#ffffff',
  },
  secondaryBtn: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f1f5f9',
    borderRadius: 16,
    paddingVertical: 14,
  },
  secondaryBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.slate700,
  },
});
