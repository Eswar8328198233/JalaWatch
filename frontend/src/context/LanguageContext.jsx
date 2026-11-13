import React, { createContext, useContext, useState, useEffect } from 'react';

const LanguageContext = createContext(null);

export const translations = {
  en: {
    // Navigation
    nav_live_map: 'Live Map',
    nav_reports: 'Community Reports',
    nav_safety: 'Water Safety',
    nav_about: 'About CSP',
    nav_report_btn: 'Report Issue',
    nav_admin: 'Admin',
    nav_logout: 'Logout',
    nav_track: 'Track Report',
    csp_badge: 'NUTAKKI CSP',

    // Hero
    hero_pill: 'Nutakki Village Community Service Project (CSP) • Live Aquifer Monitor',
    hero_title: 'Protect Groundwater.',
    hero_title_highlight: 'Make Concerns Visible.',
    hero_desc: 'Explore community-logged groundwater discoloration, wastewater seepage, and drainage concerns across Nutakki Village and surrounding mandals.',
    hero_report_btn: 'Report an Issue',
    hero_all_reports: 'All Reports',

    // Track Report Widget
    track_title: 'Track My Report Status',
    track_subtitle: 'Enter your tracking ID (e.g. JW-2026-0101) to check real-time verification and investigation progress.',
    track_placeholder: 'Enter Report ID (JW-2026-XXXX)',
    track_btn: 'Check Status',
    track_searching: 'Verifying ID...',
    track_error_not_found: 'Report not found. Please verify the tracking ID and try again.',
    track_result_heading: 'Report Investigation Status',
    track_latest_update: 'Latest Progress Update',
    track_water_source: 'Water Source',
    track_location: 'Location',
    track_date: 'Date Logged',
    track_lab_results: 'Certified Laboratory Test Results',
    track_share_btn: 'Share via WhatsApp',

    // Map & Home
    map_heading: 'Interactive Community Observation Map',
    map_subheading: 'Click any colored pin to inspect observation details & photo evidence',
    map_search_placeholder: 'Search landmark, concern, or ID...',
    all_localities: 'All Localities',
    all_issues: 'All Issues',
    hotspots: 'Reported Locations & Observations',
    hotspots_desc: 'Select any card below to pan the map and display the details panel.',
    view_catalog: 'Catalog View',
    view_on_map: 'View on Map',
    unverified_badge: 'Unverified Community Report',

    // Stats
    stat_total: 'Total Reports Logged',
    stat_submitted: 'Newly Submitted',
    stat_under_review: 'Under Review',
    stat_resolved: 'Addressed & Resolved',
    stat_villages: 'Villages Covered',
    stat_verified: 'Lab Verified Records',
    stat_resolution_rate: 'Resolution Rate',

    // Case Study Banner
    case_study_title: 'Case Study: Nutakki Village (Vijayawada / Guntur District)',
    case_study_heading: 'Understanding the Rural Groundwater Reality',
    case_study_desc: 'During our Community Service Project (CSP) field survey, residents reported black-coloured groundwater in local borewells. Our team observed that the village lacks a proper covered drainage network, causing domestic wastewater to stagnate and continuously seep into the shallow water table.',
    case_study_disclaimer: 'Scientific Reminder: The reported cause of groundwater pollution has not been independently verified. Visual discoloration or bad odor cannot replace qualified laboratory chemical and bacteriological testing.',
    read_methodology: 'Read Field Methodology',
    testing_guidelines: 'Testing Guidelines',

    // Form
    form_title: 'Report a Groundwater Concern',
    form_subtitle: 'Submit an observational record of water discoloration, chemical odor, or wastewater drainage pooling in your village.',
    form_village: 'Village / Mandal',
    form_custom_village: 'Specify Village Name',
    form_category: 'Observed Issue Category',
    form_water_source: 'Affected Water Source',
    form_date: 'Date Observed',
    form_landmark: 'Nearby Landmark / Street',
    form_landmark_placeholder: 'e.g. Near Panchayat Office, Main Road Borewell',
    form_desc: 'Detailed Observation',
    form_desc_placeholder: 'Describe water colour, odor intensity, continuous pumping behavior, and nearby open drain stagnation (minimum 15 characters)...',
    form_gps: 'Observation Coordinates (GPS)',
    form_photo: 'Attach Photo Evidence (Optional)',
    form_photo_hint: 'Upload clear photo of water in container, borewell head, or drain trench (JPG/PNG/WEBP, Max 5MB).',
    form_name: 'Your Name (Optional)',
    form_name_placeholder: 'Anonymous or Citizen Name',
    form_contact: 'Phone / Email (Private for Inspector Verification)',
    form_contact_placeholder: 'Kept strictly confidential from public portal',
    form_ethics: 'I confirm that this is an honest civic observation conducted with ethical intent.',
    form_submit_btn: 'Submit Report to Community Portal',
    form_submitting: 'Submitting Report...',
    form_success_title: 'Submission Received Successfully',
    form_copy_id: 'Copy Report ID',
    form_copied: 'Copied!',
    form_submit_another: 'Submit Another Report',

    // Categories
    cat_colour: 'Unusual water colour',
    cat_smell: 'Bad smell or taste',
    cat_dumping: 'Suspected waste dumping',
    cat_drainage: 'Drainage problems',
    cat_pipes: 'Leaking pipes',
    cat_runoff: 'Agricultural runoff',
    cat_other: 'Other',

    // Statuses
    status_submitted: 'Submitted',
    status_under_review: 'Under Review',
    status_resolved: 'Resolved',
    status_archived: 'Archived',

    // Common Actions
    btn_close: 'Close',
    btn_share: 'Share',
    btn_print: 'Print Report',
    btn_details: 'View Details',
    btn_reset: 'Reset Filters',
    btn_download_csv: 'Export CSV',
    btn_save: 'Save Changes',
    btn_cancel: 'Cancel',

    // Lightbox & Media
    photo_evidence: 'Proof Photograph',
    click_to_expand: 'Click to expand image',
    no_photo: 'No photograph attached with this submission.',

    // Lab
    lab_section_title: 'Laboratory Testing Parameters',
    lab_not_tested: 'Awaiting formal laboratory chemical testing',
    lab_tested: 'Laboratory Certified Results',

    // Extended Location & Survey Fields
    form_district: 'District',
    form_state: 'State',
    form_water_appearance: 'Water Visual Appearance',
    form_water_smell: 'Water Odor / Smell',
    form_water_usage: 'Primary Water Usage',
    form_issue_duration: 'How long has this issue existed?',
    form_nearby_wastewater: 'Nearby Wastewater / Drainage Source',
    form_suspected_distance: 'Estimated Distance to Wastewater Source',
    form_additional_notes: 'Additional Field Observations',
    form_priority: 'Issue Priority',
    form_auto_detected: 'Automatically Detected',
    form_accuracy: 'GPS Accuracy',
    form_update_location_prompt: 'Update locality fields to newly detected location?'
  },

  te: {
    // Navigation
    nav_live_map: 'లైవ్ మ్యాప్',
    nav_reports: 'ప్రజా నివేదికలు',
    nav_safety: 'నీటి భద్రత',
    nav_about: 'ప్రాజెక్ట్ వివరాలు',
    nav_report_btn: 'సమస్యను నివేదించండి',
    nav_admin: 'అడ్మిన్ లాగిన్',
    nav_logout: 'లాగౌట్',
    nav_track: 'నివేదిక స్థితి',
    csp_badge: 'నూతక్కి CSP',

    // Hero
    hero_pill: 'నూతక్కి గ్రామం కమ్యూనిటీ సర్వీస్ ప్రాజెక్ట్ (CSP) • భూగర్భ జలాల పర్యవేక్షణ',
    hero_title: 'భూగర్భ జలాలను రక్షించండి.',
    hero_title_highlight: 'సమస్యలను వెలుగులోకి తీసుకురండి.',
    hero_desc: 'నూతక్కి గ్రామం మరియు పరిసర ప్రాంతాలలో నీటి రంగు మారడం, మురుగునీరు భూమిలోకి చేరడం మరియు డ్రైనేజీ సమస్యలను సులభంగా నమోదు చేయండి.',
    hero_report_btn: 'సమస్యను నమోదు చేయండి',
    hero_all_reports: 'మొత్తం నివేదికలు',

    // Track Report Widget
    track_title: 'మీ నివేదిక స్థితిని పరిశీలించండి',
    track_subtitle: 'మీ రిపోర్ట్ ఐడీ (ఉదాహరణ: JW-2026-0101) నమోదు చేసి ప్రస్తుత పురోగతిని తెలుసుకోండి.',
    track_placeholder: 'రిపోర్ట్ ఐడీ నమోదు చేయండి (JW-2026-XXXX)',
    track_btn: 'స్థితి చూడండి',
    track_searching: 'పరిశీలిస్తున్నాము...',
    track_error_not_found: 'ఈ ఐడీతో నివేదిక కనుగొనబడలేదు. దయచేసి ఐడీని సరిచూసుకోండి.',
    track_result_heading: 'నివేదిక పరిశీలన వివరాలు',
    track_latest_update: 'ప్రస్తుత పురోగతి',
    track_water_source: 'నీటి వనరు',
    track_location: 'గ్రామం / ప్రాంతం',
    track_date: 'నమోదు చేసిన తేదీ',
    track_lab_results: 'ధృవీకరించబడిన ల్యాబ్ పరీక్ష ఫలితాలు',
    track_share_btn: 'వాట్సాప్‌లో షేర్ చేయండి',

    // Map & Home
    map_heading: 'కమ్యూనిటీ అబ్జర్వేషన్ లైవ్ మ్యాప్',
    map_subheading: 'పూర్తి వివరాలు మరియు ఫోటో చూడటానికి మ్యాప్‌లోని గుర్తుపై క్లిక్ చేయండి',
    map_search_placeholder: 'ప్రాంతం, సమస్య లేదా ఐడీ ద్వారా వెతకండి...',
    all_localities: 'అన్ని గ్రామాలు',
    all_issues: 'అన్ని సమస్యలు',
    hotspots: 'నమోదైన ప్రాంతాలు & వివరాలు',
    hotspots_desc: 'మ్యాప్‌లో వివరాలు చూడటానికి క్రింది కార్డులపై క్లిక్ చేయండి.',
    view_catalog: 'జాబితా చూడండి',
    view_on_map: 'మ్యాప్‌లో చూడండి',
    unverified_badge: 'ధృవీకరించబడని ప్రజా పరిశీలన',

    // Stats
    stat_total: 'మొత్తం నివేదికలు',
    stat_submitted: 'కొత్తగా వచ్చినవి',
    stat_under_review: 'పరిశీలనలో ఉన్నవి',
    stat_resolved: 'పరిష్కరించబడినవి',
    stat_villages: 'కవర్ అయిన గ్రామాలు',
    stat_verified: 'ల్యాబ్ ధృవీకరించినవి',
    stat_resolution_rate: 'పరిష్కార రేటు',

    // Case Study Banner
    case_study_title: 'కేస్ స్టడీ: నూతక్కి గ్రామం (విజయవాడ / గుంటూరు జిల్లా)',
    case_study_heading: 'గ్రామీణ భూగర్భ జలాల వాస్తవికత',
    case_study_desc: 'మా కళాశాల కమ్యూనిటీ సర్వీస్ ప్రాజెక్ట్ (CSP) సర్వేలో నూతక్కి గ్రామ ప్రజలు బోరు నీరు నల్లగా వస్తున్నట్లు తెలిపారు. గ్రామంలో సరైన డ్రైనేజీ పైప్‌లైన్ లేకపోవడంతో ఇళ్ల మురుగునీరు రోడ్ల పక్కనే నిలిచి భూమిలోకి ఇంకిపోతుందని గుర్తించాము.',
    case_study_disclaimer: 'శాస్త్రీయ గమనిక: ఈ నీటి కాలుష్యానికి ఖచ్చితమైన కారణం ఇంకా అధికారికంగా ధృవీకరించబడలేదు. రంగు లేదా వాసన ఆధారంగా మాత్రమే నీరు తాగడానికి పనికివస్తుందా లేదా అనేది చెప్పలేము. అధికారిక ల్యాబ్ పరీక్ష తప్పనిసరి.',
    read_methodology: 'సర్వే వివరాలు చదవండి',
    testing_guidelines: 'పరీక్ష మార్గదర్శకాలు',

    // Form
    form_title: 'భూగర్భ జలాల సమస్యను నివేదించండి',
    form_subtitle: 'మీ గ్రామంలోని బోరుబావి నీటి రంగు మారడం, దుర్వాసన లేదా మురుగునీటి నిల్వల గురించి సమాచారం నమోదు చేయండి.',
    form_village: 'గ్రామం / మండలం',
    form_custom_village: 'గ్రామం పేరు రాయండి',
    form_category: 'సమస్య రకం',
    form_water_source: 'ప్రభావిత నీటి వనరు',
    form_date: 'గమనించిన తేదీ',
    form_landmark: 'సమీప ల్యాండ్‌మార్క్ / వీధి',
    form_landmark_placeholder: 'ఉదా: పంచాయతీ కార్యాలయం దగ్గర, మెయిన్ రోడ్డు బోరుబావి',
    form_desc: 'సమస్య పూర్తి వివరాలు',
    form_desc_placeholder: 'నీటి రంగు, వాసన తీవ్రత, బోరుబావి ప్రవర్తన మరియు సమీప మురుగు కాలువల వివరాలు రాయండి (కనీసం 15 అక్షరాలు)...',
    form_gps: 'లొకేషన్ కోఆర్డినేట్స్ (GPS)',
    form_photo: 'ఫోటో జతచేయండి (ఐచ్ఛికం)',
    form_photo_hint: 'బోరు నీరు లేదా మురుగు కాలువ ఫోటో అప్‌లోడ్ చేయండి (గరిష్టంగా 5MB).',
    form_name: 'మీ పేరు (ఐచ్ఛికం)',
    form_name_placeholder: 'పేరు లేదా అజ్ఞాత పౌరుడు',
    form_contact: 'ఫోన్ నంబర్ / ఇమెయిల్ (గోప్యంగా ఉంచబడుతుంది)',
    form_contact_placeholder: 'అధికారుల పరిశీలన కొరకు మాత్రమే',
    form_ethics: 'ఇది వాస్తవమైన ప్రజా పరిశీలన అని నేను ధృవీకరిస్తున్నాను.',
    form_submit_btn: 'పోర్టల్‌లో నివేదిక సమర్పించండి',
    form_submitting: 'సమర్పిస్తున్నాము...',
    form_success_title: 'మీ నివేదిక విజయవంతంగా అందింది',
    form_copy_id: 'రిపోర్ట్ ఐడీ కాపీ చేయండి',
    form_copied: 'కాపీ అయ్యింది!',
    form_submit_another: 'మరొక నివేదిక ఇవ్వండి',

    // Categories
    cat_colour: 'నీటి రంగు మారడం',
    cat_smell: 'దుర్వాసన లేదా చెడు రుచి',
    cat_dumping: 'వ్యర్థాలు వేయడం',
    cat_drainage: 'మురుగునీటి సమస్యలు',
    cat_pipes: 'పైపుల లీకేజీ',
    cat_runoff: 'వ్యవసాయ రసాయనాలు',
    cat_other: 'ఇతర సమస్యలు',

    // Statuses
    status_submitted: 'సమర్పించబడింది',
    status_under_review: 'పరిశీలనలో ఉంది',
    status_resolved: 'పరిష్కరించబడింది',
    status_archived: 'ఆర్కైవ్ చేయబడింది',

    // Common Actions
    btn_close: 'మూసివేయి',
    btn_share: 'షేర్ చేయండి',
    btn_print: 'ప్రింట్ తీసుకోండి',
    btn_details: 'పూర్తి వివరాలు',
    btn_reset: 'ఫిల్టర్లు రీసెట్ చేయండి',
    btn_download_csv: 'CSV డౌన్‌లోడ్',
    btn_save: 'సేవ్ చేయండి',
    btn_cancel: 'రద్దు చేయండి',

    // Lightbox & Media
    photo_evidence: 'సాక్ష్యపు ఫోటో',
    click_to_expand: 'ఫోటోను పెద్దదిగా చూడటానికి క్లిక్ చేయండి',
    no_photo: 'ఈ నివేదికకు ఫోటో జతచేయబడలేదు.',

    // Lab
    lab_section_title: 'ప్రయోగశాల (ల్యాబ్) పరీక్ష ఫలితాలు',
    lab_not_tested: 'అధికారిక ల్యాబ్ పరీక్ష ఇంకా జరగవలసి ఉంది',
    lab_tested: 'ల్యాబ్ ధృవీకరించిన ఫలితాలు',

    // Extended Location & Survey Fields
    form_district: 'జిల్లా',
    form_state: 'రాష్ట్రం',
    form_water_appearance: 'నీటి రూపం / రంగు',
    form_water_smell: 'నీటి వాసన',
    form_water_usage: 'నీటి ప్రాథమిక ఉపయోగం',
    form_issue_duration: 'ఈ సమస్య ఎంత కాలంగా ఉంది?',
    form_nearby_wastewater: 'సమీపంలోని మురుగునీటి / డ్రైనేజ్ వనరు',
    form_suspected_distance: 'మురుగు నిల్వకు సుమారు దూరం',
    form_additional_notes: 'అదనపు పరిశీలన వివరాలు',
    form_priority: 'సమస్య ప్రాధాన్యత',
    form_auto_detected: 'ఆటోమేటిక్‌గా గుర్తించబడింది',
    form_accuracy: 'GPS ఖచ్చితత్వం',
    form_update_location_prompt: 'కొత్తగా గుర్తించిన ప్రాంతం వివరాలను అప్‌డేట్ చేయాలా?'
  }
};

export function LanguageProvider({ children }) {
  const [lang, setLang] = useState(() => {
    return localStorage.getItem('jalawatch_lang') || 'en';
  });

  const toggleLanguage = () => {
    const nextLang = lang === 'en' ? 'te' : 'en';
    setLang(nextLang);
    localStorage.setItem('jalawatch_lang', nextLang);
  };

  const changeLanguage = (newLang) => {
    setLang(newLang);
    localStorage.setItem('jalawatch_lang', newLang);
  };

  const t = (key) => {
    return translations[lang]?.[key] || translations['en']?.[key] || key;
  };

  return (
    <LanguageContext.Provider value={{ lang, toggleLanguage, changeLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}

