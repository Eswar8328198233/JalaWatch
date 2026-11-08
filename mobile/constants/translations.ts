import AsyncStorage from '@react-native-async-storage/async-storage';

export type LanguageCode = 'en' | 'te';

const LANG_STORAGE_KEY = '@jalawatch_app_lang';

export const translations = {
  en: {
    // Tabs & Navigation
    tab_map: 'Live Map',
    tab_reports: 'Reports',
    tab_report: 'Report',
    tab_safety: 'Safety',
    tab_about: 'About',

    // Language switcher
    lang_toggle: 'తెలుగు',
    lang_current: 'English',

    // Report Screen
    report_title: 'Report a Concern',
    report_subtitle: 'Log discoloured borewells, foul smell, or drainage seepage',
    field_village: 'Village or Locality *',
    field_category: 'Type of Issue *',
    field_water_source: 'Water Source *',
    field_date: 'Date of Observation',
    field_landmark: 'Nearby Landmark (Street / Pole / Shop)',
    field_description: 'Observation Details * (Min 15 chars)',
    field_description_placeholder: 'Describe water color, smell intensity, nearby drain pooling, or duration of the issue...',
    field_gps: 'Attach Exact GPS Coordinates',
    field_detect_gps: 'Detect Current Location',
    field_photo: 'Attach Photo Evidence',
    field_choose_photo: 'Select Photo from Gallery',
    field_name: 'Your Name (Optional)',
    field_contact: 'Phone / Email (Kept strictly private)',
    field_ethics: 'I confirm this is an honest observational report. I understand visual inspection does not replace laboratory water testing.',
    btn_submit: 'Submit Report',
    btn_submitting: 'Submitting Report...',
    btn_save_draft: 'Save Offline Draft',

    // Offline Sync
    offline_section: 'Offline Drafts & Sync Queue',
    offline_pending: 'Pending Sync',
    offline_syncing: 'Syncing...',
    offline_failed: 'Failed - Tap to retry',
    offline_submitted: 'Submitted to Portal',
    offline_draft: 'Draft',
    offline_sync_all: 'Sync All Pending',
    offline_no_drafts: 'No offline drafts pending.',
    offline_saved_alert: 'Draft Saved Locally',
    offline_saved_desc: 'Your report is saved on this device and can be submitted when you are online.',

    // Success screen
    success_title: 'Report Recorded',
    success_desc: 'Thank you for helping protect community aquifers. Your observation has been saved to the database.',
    unique_id: 'UNIQUE REPORT ID',
    view_live_map: 'View on Live Map',
    submit_another: 'Submit Another Observation',
    share_report: 'Share via WhatsApp',

    // Validation
    val_village: 'Please specify a village or locality.',
    val_desc: 'Please write a descriptive observation (at least 15 characters).',
    val_ethics: 'Please confirm that this is an honest observational submission.'
  },

  te: {
    // Tabs & Navigation
    tab_map: 'లైవ్ మ్యాప్',
    tab_reports: 'నివేదికలు',
    tab_report: 'నమోదు',
    tab_safety: 'నీటి భద్రత',
    tab_about: 'వివరాలు',

    // Language switcher
    lang_toggle: 'English',
    lang_current: 'తెలుగు',

    // Report Screen
    report_title: 'సమస్యను నివేదించండి',
    report_subtitle: 'బోరుబావి నీటి రంగు మారడం, దుర్వాసన లేదా మురుగునీటి సమస్యలను నమోదు చేయండి',
    field_village: 'గ్రామం లేదా ప్రాంతం *',
    field_category: 'సమస్య రకం *',
    field_water_source: 'నీటి వనరు *',
    field_date: 'పరిశీలించిన తేదీ',
    field_landmark: 'సమీపంలోని ముఖ్య ప్రదేశం (స్ట్రీట్ / పోల్ / షాప్)',
    field_description: 'సమస్య పూర్తి వివరాలు * (కనీసం 15 అక్షరాలు)',
    field_description_placeholder: 'నీటి రంగు ఎలా ఉంది, వాసన వస్తుందా, డ్రైనేజీ మురుగునీరు నిల్వ ఉందా అనే వివరాలను రాయండి...',
    field_gps: 'ఖచ్చితమైన GPS లొకేషన్ జోడించండి',
    field_detect_gps: 'ప్రస్తుత లొకేషన్ గుర్తించండి',
    field_photo: 'ఫోటో సాక్ష్యం జతచేయండి',
    field_choose_photo: 'గ్యాలరీ నుండి ఫోటో ఎంచుకోండి',
    field_name: 'మీ పేరు (ఐచ్ఛికం)',
    field_contact: 'ఫోన్ / ఈమెయిల్ (పూర్తిగా గోప్యంగా ఉంచబడుతుంది)',
    field_ethics: 'ఇది వాస్తవ ప్రజా పరిశీలన అని ధృవీకరిస్తున్నాను. ఇది అధికారిక ల్యాబ్ పరీక్షకు ప్రత్యామ్నాయం కాదని గ్రహించాను.',
    btn_submit: 'నివేదికను సమర్పించండి',
    btn_submitting: 'సమర్పిస్తున్నాము...',
    btn_save_draft: 'ఆఫ్‌లైన్ డ్రాఫ్ట్‌గా సేవ్ చేయండి',

    // Offline Sync
    offline_section: 'ఆఫ్‌లైన్ డ్రాఫ్ట్‌లు & పెండింగ్ నివేదికలు',
    offline_pending: 'సర్వర్‌కి పంపడానికి వేచి ఉంది',
    offline_syncing: 'పంపుతున్నాము...',
    offline_failed: 'విఫలమైంది - మళ్లీ ప్రయత్నించండి',
    offline_submitted: 'పోర్టల్‌కి చేరింది',
    offline_draft: 'డ్రాఫ్ట్',
    offline_sync_all: 'అన్నింటినీ ఇప్పుడే పంపండి',
    offline_no_drafts: 'పెండింగ్ ఆఫ్‌లైన్ డ్రాఫ్ట్‌లు ఏవీ లేవు.',
    offline_saved_alert: 'డ్రాఫ్ట్ ఫోన్‌లో సేవ్ చేయబడింది',
    offline_saved_desc: 'ఇంటర్నెట్ అందుబాటులోకి వచ్చినప్పుడు మీరు దీనిని నేరుగా సమర్పించవచ్చు.',

    // Success screen
    success_title: 'నివేదిక నమోదైంది',
    success_desc: 'భూగర్భ జలాల పరిరక్షణలో పాల్గొన్నందుకు ధన్యవాదాలు. మీ పరిశీలన డేటాబేస్‌లో చేర్చబడింది.',
    unique_id: 'ప్రత్యేక రిపోర్ట్ ఐడీ',
    view_live_map: 'లైవ్ మ్యాప్‌లో చూడండి',
    submit_another: 'మరొక నివేదికను నమోదు చేయండి',
    share_report: 'వాట్సాప్‌లో షేర్ చేయండి',

    // Validation
    val_village: 'దయచేసి గ్రామం లేదా ప్రాంతాన్ని ఎంచుకోండి.',
    val_desc: 'దయచేసి సమస్య గురించి కనీసం 15 అక్షరాలలో వివరంగా రాయండి.',
    val_ethics: 'దయచేసి ఈ పరిశీలన నిజమైనదని నిర్ధారించండి.'
  }
};

export async function getSavedLanguage(): Promise<LanguageCode> {
  try {
    const saved = await AsyncStorage.getItem(LANG_STORAGE_KEY);
    if (saved === 'te' || saved === 'en') {
      return saved;
    }
  } catch (e) {
    // fallback
  }
  return 'en';
}

export async function saveLanguage(lang: LanguageCode): Promise<void> {
  try {
    await AsyncStorage.setItem(LANG_STORAGE_KEY, lang);
  } catch (e) {
    // fallback
  }
}

