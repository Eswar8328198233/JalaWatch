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
    tab_about: 'About & Admin',

    // Language switcher
    lang_toggle: 'తెలుగు',
    lang_current: 'English',

    // Home & KPI
    home_title: 'JalaWatch',
    home_subtitle: 'Groundwater & Seepage Surveillance',
    kpi_total: 'Total Reports',
    kpi_under_review: 'Under Review',
    kpi_resolved: 'Resolved',
    kpi_villages: 'Villages Covered',
    btn_quick_report: 'Report Water Issue',
    btn_view_safety: 'Water Safety Guide',
    recent_reports: 'Recent Community Observations',

    // Report Screen
    report_title: 'Report Water Concern',
    report_subtitle: 'Log discoloured borewells, foul smell, or drainage seepage',
    field_village: 'Village / Locality *',
    field_district: 'District',
    field_state: 'State',
    field_category: 'Type of Issue *',
    field_water_source: 'Water Source *',
    field_date: 'Date of Observation',
    field_street: 'Street / Neighborhood',
    field_landmark: 'Nearby Landmark (Pole / Shop / Tank)',
    field_description: 'Observation Details * (Min 15 chars)',
    field_description_placeholder: 'Describe water color, smell intensity, nearby drain pooling, or duration of the issue...',
    field_gps: 'Attach Exact GPS Coordinates',
    field_detect_gps: 'Detect My Location (GPS)',
    field_locating: 'Acquiring satellite fix...',
    field_resolving_addr: 'Resolving address details...',
    field_accuracy: 'Accuracy: ±',
    field_photo: 'Attach Photo Evidence',
    field_take_photo: 'Take Photo with Camera',
    field_choose_photo: 'Select from Gallery',
    field_photo_attached: 'Photo Attached',
    field_remove_photo: 'Remove Photo',
    field_name: 'Your Name (Optional)',
    field_contact: 'Phone / Email (Kept strictly private)',
    field_ethics: 'I confirm this is an honest observational report. I understand visual inspection does not replace laboratory water testing.',
    btn_submit: 'Submit Report',
    btn_submitting: 'Submitting Report...',
    btn_save_draft: 'Save Offline Draft',

    // Environmental Survey Fields
    survey_section: 'Section 3: Environmental Survey (Optional)',
    field_appearance: 'Water Appearance / Visual Clarity',
    field_smell: 'Water Odor / Smell',
    field_usage: 'Primary Water Usage',
    field_duration: 'How long has this been occurring?',
    field_wastewater: 'Nearby Wastewater / Drainage Source',
    field_distance: 'Estimated Distance to Wastewater',
    field_priority: 'Citizen Priority Assessment',

    // Overwrite Confirmation
    overwrite_title: 'Update Location Details?',
    overwrite_message: 'GPS detected new address information. Would you like to update the fields you modified or keep your manual input?',
    btn_update_detected: 'Update to Detected',
    btn_keep_input: 'Keep My Input',

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
    val_ethics: 'Please confirm that this is an honest observational submission.',

    // Admin
    admin_title: 'Administrative & Field Portal',
    admin_login_desc: 'Authorized access for Village Volunteers, Field Officers & Admins',
    admin_username: 'Username',
    admin_password: 'Password',
    btn_login: 'Log In to Admin Portal',
    admin_role_super: 'Super Administrator',
    admin_role_admin: 'Administrator',
    admin_role_officer: 'Field Officer',
    tab_admin_submissions: 'Submissions',
    tab_admin_hotspots: 'Hotspots & Clusters',
    tab_admin_logs: 'Audit Logs',
    tab_admin_users: 'Staff Accounts',
    btn_export_csv: 'Export CSV Data',
    btn_change_pwd: 'Change Password',
    btn_logout: 'Log Out',
    lab_section: 'Certified Laboratory Verification',
    lab_ref_no: 'Lab Report Ref No',
    lab_collection_date: 'Sample Collection Date',
    lab_testing_date: 'Testing Date',
    lab_tested_by: 'Authorized Testing Lab',
    lab_status_tested: 'Tested & Certified',
    lab_notes: 'Laboratory Observations',
  },

  te: {
    // Tabs & Navigation
    tab_map: 'లైవ్ మ్యాప్',
    tab_reports: 'నివేదికలు',
    tab_report: 'నమోదు',
    tab_safety: 'నీటి భద్రత',
    tab_about: 'వివరాలు & అడ్మిన్',

    // Language switcher
    lang_toggle: 'English',
    lang_current: 'తెలుగు',

    // Home & KPI
    home_title: 'జలవాచ్',
    home_subtitle: 'భూగర్భ జలాలు & మురుగునీటి పర్యవేక్షణ',
    kpi_total: 'మొత్తం నివేదికలు',
    kpi_under_review: 'పరిశీలనలో ఉన్నవి',
    kpi_resolved: 'పరిష్కరించబడినవి',
    kpi_villages: 'కవర్ చేసిన గ్రామాలు',
    btn_quick_report: 'నీటి సమస్యను నమోదు చేయండి',
    btn_view_safety: 'నీటి భద్రత మార్గదర్శకాలు',
    recent_reports: 'ఇటీవలి ప్రజా పరిశీలనలు',

    // Report Screen
    report_title: 'సమస్యను నివేదించండి',
    report_subtitle: 'బోరుబావి నీటి రంగు మారడం, దుర్వాసన లేదా మురుగునీటి సమస్యలను నమోదు చేయండి',
    field_village: 'గ్రామం లేదా ప్రాంతం *',
    field_district: 'జిల్లా',
    field_state: 'రాష్ట్రం',
    field_category: 'సమస్య రకం *',
    field_water_source: 'నీటి వనరు *',
    field_date: 'పరిశీలించిన తేదీ',
    field_street: 'వీధి / వాడ',
    field_landmark: 'సమీపంలోని ముఖ్య ప్రదేశం (పోల్ / షాప్ / వాటర్ ట్యాంక్)',
    field_description: 'సమస్య పూర్తి వివరాలు * (కనీసం 15 అక్షరాలు)',
    field_description_placeholder: 'నీటి రంగు ఎలా ఉంది, వాసన వస్తుందా, డ్రైనేజీ మురుగునీరు నిల్వ ఉందా అనే వివరాలను రాయండి...',
    field_gps: 'ఖచ్చితమైన GPS లొకేషన్ జోడించండి',
    field_detect_gps: 'నా లొకేషన్ గుర్తించండి (GPS)',
    field_locating: 'శాటిలైట్ సిగ్నల్ శోధిస్తున్నాము...',
    field_resolving_addr: 'చిరునామా వివరాలను సేకరిస్తున్నాము...',
    field_accuracy: 'ఖచ్చితత్వం: ±',
    field_photo: 'ఫోటో సాక్ష్యం జతచేయండి',
    field_take_photo: 'కెమెరాతో ఫోటో తీయండి',
    field_choose_photo: 'గ్యాలరీ నుండి ఎంచుకోండి',
    field_photo_attached: 'ఫోటో జతచేయబడింది',
    field_remove_photo: 'ఫోటో తొలగించండి',
    field_name: 'మీ పేరు (ఐచ్ఛికం)',
    field_contact: 'ఫోన్ / ఈమెయిల్ (పూర్తిగా గోప్యంగా ఉంచబడుతుంది)',
    field_ethics: 'ఇది వాస్తవ ప్రజా పరిశీలన అని ధృవీకరిస్తున్నాను. ఇది అధికారిక ల్యాబ్ పరీక్షకు ప్రత్యామ్నాయం కాదని గ్రహించాను.',
    btn_submit: 'నివేదికను సమర్పించండి',
    btn_submitting: 'సమర్పిస్తున్నాము...',
    btn_save_draft: 'ఆఫ్‌లైన్ డ్రాఫ్ట్‌గా సేవ్ చేయండి',

    // Environmental Survey Fields
    survey_section: 'విభాగం 3: పర్యావరణ పరిశీలన (ఐచ్ఛికం)',
    field_appearance: 'నీటి రంగు / స్పష్టత',
    field_smell: 'నీటి వాసన',
    field_usage: 'నీటి ప్రధాన ఉపయోగం',
    field_duration: 'ఈ సమస్య ఎంత కాలంగా ఉంది?',
    field_wastewater: 'సమీపంలోని మురుగునీటి వనరు',
    field_distance: 'మురుగునీటికి ఉన్న సుమారు దూరం',
    field_priority: 'సమస్య ప్రాధాన్యత స్థాయి',

    // Overwrite Confirmation
    overwrite_title: 'లొకేషన్ వివరాలను మార్చాలా?',
    overwrite_message: 'GPS ద్వారా కొత్త చిరునామా గుర్తించబడింది. మీరు నమోదు చేసిన వివరాలను నవీకరించాలా లేదా పాతవాటినే ఉంచాలా?',
    btn_update_detected: 'గుర్తించిన వివరాలు మార్చు',
    btn_keep_input: 'నేను రాసినవే ఉంచు',

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
    val_ethics: 'దయచేసి ఈ పరిశీలన నిజమైనదని నిర్ధారించండి.',

    // Admin
    admin_title: 'అడ్మినిస్ట్రేటివ్ & ఫీల్డ్ పోర్టల్',
    admin_login_desc: 'గ్రామ వాలంటీర్లు, ఫీల్డ్ ఆఫీసర్లు మరియు అధికారుల కొరకు',
    admin_username: 'యూజర్‌నేమ్',
    admin_password: 'పాస్‌వర్డ్',
    btn_login: 'అడ్మిన్ లాగిన్ అవ్వండి',
    admin_role_super: 'సూపర్ అడ్మినిస్ట్రేటర్',
    admin_role_admin: 'అడ్మినిస్ట్రేటర్',
    admin_role_officer: 'ఫీల్డ్ ఆఫీసర్',
    tab_admin_submissions: 'నివేదికలు',
    tab_admin_hotspots: 'హాట్‌స్పాట్‌లు',
    tab_admin_logs: 'ఆడిట్ లాగ్స్',
    tab_admin_users: 'సిబ్బంది ఖాతాలు',
    btn_export_csv: 'CSV డౌన్‌లోడ్',
    btn_change_pwd: 'పాస్‌వర్డ్ మార్చుకోండి',
    btn_logout: 'లాగౌట్',
    lab_section: 'అధికారిక ల్యాబ్ పరీక్ష వివరాలు',
    lab_ref_no: 'ల్యాబ్ రిపోర్ట్ రెఫరెన్స్ నంబర్',
    lab_collection_date: 'నమూనా సేకరించిన తేదీ',
    lab_testing_date: 'పరీక్షించిన తేదీ',
    lab_tested_by: 'ధృవీకరించిన ల్యాబ్ పేరు',
    lab_status_tested: 'పరీక్షించి ధృవీకరించబడింది',
    lab_notes: 'ల్యాబ్ పరిశీలనల వివరాలు',
  },
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
