import React, { useState } from 'react';
import { 
  View, Text, StyleSheet, TextInput, TouchableOpacity, 
  ScrollView, Image, ActivityIndicator, Alert, Platform 
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { 
  AlertTriangle, MapPin, Calendar, Droplets, Camera, 
  Upload, CheckCircle, Navigation, X, ShieldAlert, Sparkles, ArrowRight 
} from 'lucide-react-native';
import { Colors, Shadows } from '../../constants/theme';
import { submitNewReport } from '../../services/api';

export default function ReportScreen() {
  const router = useRouter();

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

  const [locating, setLocating] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submissionResult, setSubmissionResult] = useState<{ report_id: string } | null>(null);

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

  const handleSubmit = async () => {
    const finalVillage = village === 'Other' ? customVillage.trim() : village;

    if (!finalVillage) {
      Alert.alert('Validation', 'Please specify a village or locality.');
      return;
    }
    if (!description.trim() || description.trim().length < 15) {
      Alert.alert('Validation', 'Please write a descriptive observation (at least 15 characters).');
      return;
    }
    if (!ethicsAgreed) {
      Alert.alert('Ethics Confirmation', 'Please confirm that this is an honest observational submission.');
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
      Alert.alert('Submission Error', err.message || 'Could not connect to server.');
    } finally {
      setSubmitting(false);
    }
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

          <Text style={styles.successHeading}>Report Recorded</Text>
          <Text style={styles.successSubtext}>
            Thank you for helping protect community aquifers. Your observation has been saved to the shared database.
          </Text>

          <View style={styles.idBox}>
            <Text style={styles.idBoxLabel}>UNIQUE REPORT ID</Text>
            <Text style={styles.idBoxValue}>{submissionResult.report_id}</Text>
            <Text style={styles.idBoxHint}>Reference ID for Gram Panchayat inquiries.</Text>
          </View>

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
            <Text style={styles.primaryBtnText}>View on Live Map</Text>
            <ArrowRight size={16} color="#ffffff" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.secondaryBtn} onPress={handleReset}>
            <Text style={styles.secondaryBtnText}>Submit Another Observation</Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.screenTitle}>Report a Concern</Text>
        <Text style={styles.screenSubtitle}>Log discoloured borewells, foul smell, or drainage seepage</Text>
      </View>

      <ScrollView contentContainerStyle={styles.formContent} showsVerticalScrollIndicator={false}>
        
        {/* Locality */}
        <View style={styles.fieldGroup}>
          <Text style={styles.fieldLabel}>Village or Locality *</Text>
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
          <Text style={styles.fieldLabel}>Type of Issue *</Text>
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
          <Text style={styles.fieldLabel}>Affected Water Source</Text>
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
          <Text style={styles.fieldLabel}>Nearby Landmark / Street</Text>
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
            <Text style={styles.fieldLabel}>GPS Coordinates (Optional)</Text>
            <TouchableOpacity onPress={handleGetLocation} style={styles.gpsDetectBtn} disabled={locating}>
              <Navigation size={12} color={Colors.primary} />
              <Text style={styles.gpsDetectText}>{locating ? 'Detecting...' : 'Use My GPS'}</Text>
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
          <Text style={styles.fieldLabel}>Detailed Description * (min 15 chars)</Text>
          <TextInput
            placeholder="Describe water colour, sulfur/rotten smell, foam, duration, nearby open drainage overflows..."
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
          <Text style={styles.fieldLabel}>Evidence Photograph (Optional)</Text>
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
              <Text style={styles.photoUploadText}>Tap to Take / Attach Photo</Text>
              <Text style={styles.photoUploadSubtext}>JPG, PNG, WEBP (Max 5MB)</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Reporter Privacy Info */}
        <View style={styles.fieldGroup}>
          <Text style={styles.fieldLabel}>Your Name (Optional)</Text>
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
          <Text style={styles.ethicsText}>
            I confirm this is an honest civic observation for the Nutakki Community Service Project (CSP). I understand this is an observational tool, not a police FIR.
          </Text>
        </TouchableOpacity>

        {/* Submit Button */}
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
              <Text style={styles.submitBtnText}>Submit Observation</Text>
            </>
          )}
        </TouchableOpacity>

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
  },
  formContent: {
    padding: 18,
    gap: 16,
    backgroundColor: '#f8fafc',
    paddingBottom: 40,
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
    backgroundColor: '#ffffff',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 100,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    ...Shadows.pill,
  },
  selectPillActive: {
    backgroundColor: Colors.primaryDark,
    borderColor: Colors.primaryDark,
  },
  selectPillText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.slate700,
  },
  selectPillTextActive: {
    color: '#ffffff',
  },
  input: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: Platform.OS === 'ios' ? 12 : 10,
    fontSize: 13,
    color: Colors.slate800,
    fontWeight: '600',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
    lineHeight: 18,
  },
  gpsDetectBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.primaryBg,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.primaryBorder,
  },
  gpsDetectText: {
    fontSize: 10,
    fontWeight: '800',
    color: Colors.primaryDark,
  },
  coordDisplayBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#ffffff',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  coordText: {
    fontSize: 12,
    color: Colors.slate700,
    fontWeight: '700',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  presetsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
  },
  presetLabel: {
    fontSize: 10,
    color: Colors.slate400,
    fontWeight: '600',
  },
  presetChip: {
    backgroundColor: '#ffffff',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  presetChipText: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.slate600,
  },
  photoUploadBtn: {
    backgroundColor: '#ffffff',
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: '#cbd5e1',
    borderRadius: 16,
    paddingVertical: 20,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  photoUploadText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.primaryDark,
  },
  photoUploadSubtext: {
    fontSize: 10,
    color: Colors.slate400,
  },
  photoPreviewWrapper: {
    position: 'relative',
    borderRadius: 16,
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
    backgroundColor: 'rgba(0,0,0,0.65)',
    padding: 6,
    borderRadius: 100,
  },
  ethicsContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    backgroundColor: '#ffffff',
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginTop: 4,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: Colors.slate400,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  checkboxActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  ethicsText: {
    fontSize: 11,
    color: Colors.slate600,
    flex: 1,
    lineHeight: 16,
  },
  submitBtn: {
    backgroundColor: Colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 18,
    marginTop: 8,
    ...Shadows.card,
  },
  submitBtnText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '800',
  },
  btnDisabled: {
    opacity: 0.6,
  },
  successContainer: {
    padding: 24,
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#ffffff',
    flexGrow: 1,
    justifyContent: 'center',
  },
  successIconCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: Colors.successBg,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  successHeading: {
    fontSize: 22,
    fontWeight: '900',
    color: Colors.slate900,
    textAlign: 'center',
  },
  successSubtext: {
    fontSize: 12,
    color: Colors.slate600,
    textAlign: 'center',
    lineHeight: 18,
    paddingHorizontal: 20,
  },
  idBox: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 18,
    alignItems: 'center',
    gap: 3,
    marginVertical: 10,
    width: '100%',
  },
  idBoxLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: Colors.slate400,
    letterSpacing: 0.5,
  },
  idBoxValue: {
    fontSize: 24,
    fontWeight: '900',
    color: Colors.primaryDark,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  idBoxHint: {
    fontSize: 10,
    color: Colors.slate400,
  },
  disclaimerCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: Colors.warningBg,
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.warningBorder,
    marginBottom: 8,
  },
  disclaimerCardText: {
    fontSize: 11,
    color: Colors.warning,
    fontWeight: '600',
    flex: 1,
    lineHeight: 16,
  },
  primaryBtn: {
    backgroundColor: Colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 16,
    width: '100%',
    ...Shadows.card,
  },
  primaryBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '800',
  },
  secondaryBtn: {
    backgroundColor: '#f1f5f9',
    paddingVertical: 12,
    borderRadius: 16,
    width: '100%',
    alignItems: 'center',
  },
  secondaryBtnText: {
    color: Colors.slate700,
    fontSize: 12,
    fontWeight: '700',
  },
});
