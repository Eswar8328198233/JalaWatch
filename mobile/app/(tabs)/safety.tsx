import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Linking,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  ShieldCheck,
  AlertTriangle,
  Droplets,
  FlaskConical,
  Phone,
  Waves,
  Building2,
  CheckCircle2,
  XCircle,
  ExternalLink,
  ChevronRight,
  Info,
} from 'lucide-react-native';
import { Colors, Shadows } from '../../constants/theme';

export default function WaterSafetyScreen() {
  const [activeTab, setActiveTab] = useState<'anomalies' | 'testing' | 'drainage' | 'authorities'>('anomalies');

  const sensoryAnomalies = [
    {
      title: 'Black or Dark Grey Water',
      badge: 'High Priority',
      badgeColor: Colors.warning,
      likelyCauses: 'Naturally occurring Manganese minerals, dissolved anaerobic organic matter, or underground septic tank seepage into shallow borewells.',
      healthRisk: 'Manganese in high concentrations can cause neurological issues in children. Sewage seepage introduces pathogenic bacteria like E. coli and Salmonella.',
      recommendation: 'Cease drinking immediately. Test for microbial coliforms, heavy metals (Manganese/Iron), and Electrical Conductivity (EC).',
    },
    {
      title: 'Rotten Egg / Sulfur Smell',
      badge: 'Hydrogen Sulfide',
      badgeColor: '#eab308',
      likelyCauses: 'Hydrogen Sulfide (H₂S) gas produced by anaerobic sulfur-reducing bacteria feeding on organic waste or sewage in low-oxygen groundwater strata.',
      healthRisk: 'Causes nausea, headaches, and digestive distress. Highly corrosive to plumbing fixtures and indicates lack of aquifer aeration.',
      recommendation: 'Check nearby septic pits and open drains. Collect water sample for biological oxygen demand and fecal contamination testing.',
    },
    {
      title: 'Foaming or Detergent Scent',
      badge: 'Greywater Seepage',
      badgeColor: Colors.primary,
      likelyCauses: 'Synthetic surfactants from domestic laundry wastewater, dishwashing detergents, or industrial packaging washouts draining directly into open ground.',
      healthRisk: 'Surfactants facilitate the transport of toxic organic compounds into deep aquifers and cause gastrointestinal inflammation.',
      recommendation: 'Trace surface drainage paths. Construct household soak pits to filter greywater before it reaches the water table.',
    },
    {
      title: 'Yellowish or Reddish-Brown Rust',
      badge: 'Iron Oxidation',
      badgeColor: '#d97706',
      likelyCauses: 'Iron oxidization, corroded mild-steel borewell casings, or high geological iron content in alluvial soil.',
      healthRisk: 'Generally low toxicity at moderate levels, but stains clothing, damages fixtures, and fosters iron-related bio-slime bacteria.',
      recommendation: 'Inspect casing pipes. Install gravel-sand filter or aeration unit after confirming safe bacterial levels via certified lab tests.',
    },
  ];

  const localAuthorities = [
    {
      name: 'Andhra Pradesh Spandana Grievance Portal',
      role: 'Unified State Public Grievance Redressal System',
      contact: '1902',
      displayContact: 'Toll-free: 1902',
      action: 'File an official civic petition for drinking water contamination or village drainage stagnation.',
      type: 'tel',
    },
    {
      name: 'AP Pollution Control Board (RO Vijayawada)',
      role: 'Environmental Regulation & Industrial Discharge Oversight',
      contact: '08662463200',
      displayContact: 'Phone: 0866-2463200',
      action: 'Report suspected illegal industrial waste dumping, hazardous chemical runoff, or canal contamination.',
      type: 'tel',
    },
    {
      name: 'Rural Water Supply & Sanitation (RWS&S)',
      role: 'Drinking Water Infrastructure & Village Water Testing',
      contact: 'District Laboratory, Guntur / Vijayawada Division',
      displayContact: 'District Lab Division',
      action: 'Request routine potable water quality checks, chlorination inspection, and Jal Jeevan Mission tap audits.',
      type: 'info',
    },
    {
      name: 'Nutakki Gram Panchayat Office',
      role: 'Local Village Administration & Street Drainage Maintenance',
      contact: 'Panchayat Secretary / Sarpanch Desk',
      displayContact: 'Panchayat Desk, Nutakki',
      action: 'Escalate open drain blockages, borewell pump repair, and soak pit construction subsidies.',
      type: 'info',
    },
  ];

  const handleCall = (phoneNumber: string) => {
    Linking.openURL(`tel:${phoneNumber}`).catch(() => {
      // ignore
    });
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      {/* Compact Top Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.headerIconCircle}>
            <ShieldCheck size={18} color="#ffffff" strokeWidth={2.5} />
          </View>
          <View>
            <Text style={styles.headerTitle}>Water Safety & Awareness</Text>
            <Text style={styles.headerSubtitle}>Nutakki Village Scientific Advisory</Text>
          </View>
        </View>
      </View>

      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Scientific Alert Card */}
        <View style={styles.alertCard}>
          <View style={styles.alertHeader}>
            <AlertTriangle size={20} color={Colors.warning} strokeWidth={2.4} />
            <Text style={styles.alertTitle}>SCIENTIFIC PRINCIPLE</Text>
          </View>
          <Text style={styles.alertStrong}>Clear Appearance Does Not Mean Safe Water</Text>
          <Text style={styles.alertBody}>
            It is a dangerous misconception that water is safe simply because it looks clear and odorless. Many hazardous groundwater contaminants—such as pathogenic bacteria (E. coli), Arsenic, Fluoride, and pesticide residues—are completely invisible.
          </Text>

          <View style={styles.alertPointsRow}>
            <View style={styles.alertPoint}>
              <View style={styles.alertPointIcon}>
                <XCircle size={14} color="#dc2626" />
              </View>
              <Text style={styles.alertPointText}>
                <Text style={{ fontWeight: '700', color: '#991b1b' }}>TDS Pens: </Text>
                Only measure total mineral conductivity, not toxic heavy metals or microbes.
              </Text>
            </View>
            <View style={styles.alertPoint}>
              <View style={styles.alertPointIcon}>
                <CheckCircle2 size={14} color="#16a34a" />
              </View>
              <Text style={styles.alertPointText}>
                <Text style={{ fontWeight: '700', color: '#166534' }}>Only Valid Method: </Text>
                Certified biological and chemical testing in an accredited state laboratory.
              </Text>
            </View>
          </View>
        </View>

        {/* Tab Selection Chips */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tabScroll}
        >
          {[
            { id: 'anomalies', label: '1. Anomalies', icon: Droplets },
            { id: 'testing', label: '2. Lab Testing', icon: FlaskConical },
            { id: 'drainage', label: '3. Drainage & Soak Pits', icon: Waves },
            { id: 'authorities', label: '4. AP Authorities', icon: Building2 },
          ].map((tab) => {
            const Icon = tab.icon;
            const isSelected = activeTab === tab.id;
            return (
              <TouchableOpacity
                key={tab.id}
                onPress={() => setActiveTab(tab.id as any)}
                style={[styles.tabButton, isSelected && styles.tabButtonActive]}
                activeOpacity={0.8}
              >
                <Icon
                  size={15}
                  color={isSelected ? '#ffffff' : Colors.slate600}
                  strokeWidth={2.2}
                />
                <Text style={[styles.tabButtonText, isSelected && styles.tabButtonTextActive]}>
                  {tab.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* TAB 1: SENSORY ANOMALIES */}
        {activeTab === 'anomalies' && (
          <View style={styles.tabContent}>
            <Text style={styles.sectionHeading}>Sensory Anomaly Guide</Text>
            <Text style={styles.sectionDesc}>
              Identifying noticeable visual and olfactory signs in groundwater sources:
            </Text>

            {sensoryAnomalies.map((item, idx) => (
              <View key={idx} style={styles.anomalyCard}>
                <View style={styles.anomalyCardHeader}>
                  <Text style={styles.anomalyTitle}>{item.title}</Text>
                  <View style={[styles.anomalyBadge, { backgroundColor: item.badgeColor + '18' }]}>
                    <Text style={[styles.anomalyBadgeText, { color: item.badgeColor }]}>
                      {item.badge}
                    </Text>
                  </View>
                </View>

                <View style={styles.anomalySection}>
                  <Text style={styles.anomalyFieldLabel}>Likely Causes:</Text>
                  <Text style={styles.anomalyFieldValue}>{item.likelyCauses}</Text>
                </View>

                <View style={styles.anomalySection}>
                  <Text style={styles.anomalyFieldLabel}>Health Risks:</Text>
                  <Text style={styles.anomalyFieldValue}>{item.healthRisk}</Text>
                </View>

                <View style={[styles.anomalySection, styles.anomalyRecBox]}>
                  <Text style={styles.anomalyRecLabel}>Immediate Recommendation:</Text>
                  <Text style={styles.anomalyRecValue}>{item.recommendation}</Text>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* TAB 2: LAB TESTING PROTOCOL */}
        {activeTab === 'testing' && (
          <View style={styles.tabContent}>
            <Text style={styles.sectionHeading}>4-Step Sterile Water Sampling</Text>
            <Text style={styles.sectionDesc}>
              How to collect a representative groundwater sample for official laboratory analysis:
            </Text>

            <View style={styles.stepCard}>
              <View style={styles.stepNumberBadge}>
                <Text style={styles.stepNumberText}>1</Text>
              </View>
              <View style={styles.stepBody}>
                <Text style={styles.stepTitle}>Flush Borewell for 5-10 Minutes</Text>
                <Text style={styles.stepDesc}>
                  Purge standing water from the riser pipes to obtain a genuine aquifer sample rather than stagnant pipe oxidation.
                </Text>
              </View>
            </View>

            <View style={styles.stepCard}>
              <View style={styles.stepNumberBadge}>
                <Text style={styles.stepNumberText}>2</Text>
              </View>
              <View style={styles.stepBody}>
                <Text style={styles.stepTitle}>Use a Sterile 1-Litre Bottle</Text>
                <Text style={styles.stepDesc}>
                  Use a brand-new or laboratory-autoclaved polyethylene container. Rinse twice with the sampled water before filling. Do not touch the inside neck or cap.
                </Text>
              </View>
            </View>

            <View style={styles.stepCard}>
              <View style={styles.stepNumberBadge}>
                <Text style={styles.stepNumberText}>3</Text>
              </View>
              <View style={styles.stepBody}>
                <Text style={styles.stepTitle}>Label with Exact Coordinates & Time</Text>
                <Text style={styles.stepDesc}>
                  Record Village name, landmark, borewell depth (feet), GPS coordinates, and timestamp. Note any recent rainfall or nearby open drainage.
                </Text>
              </View>
            </View>

            <View style={styles.stepCard}>
              <View style={styles.stepNumberBadge}>
                <Text style={styles.stepNumberText}>4</Text>
              </View>
              <View style={styles.stepBody}>
                <Text style={styles.stepTitle}>Deliver on Ice Within 6 to 24 Hours</Text>
                <Text style={styles.stepDesc}>
                  Bacterial populations mutate rapidly at room temperature. Keep sample in an insulated cool box and submit to the nearest RWS&S or NABL lab promptly.
                </Text>
              </View>
            </View>

            {/* Parameters tested card */}
            <View style={styles.paramsCard}>
              <Text style={styles.paramsTitle}>Key Lab Testing Parameters</Text>
              <View style={styles.paramGrid}>
                <View style={styles.paramItem}>
                  <Text style={styles.paramName}>pH Level</Text>
                  <Text style={styles.paramStandard}>6.5 – 8.5 (IS 10500)</Text>
                </View>
                <View style={styles.paramItem}>
                  <Text style={styles.paramName}>TDS (Dissolved Solids)</Text>
                  <Text style={styles.paramStandard}>&lt; 500 mg/L (Max 2000)</Text>
                </View>
                <View style={styles.paramItem}>
                  <Text style={styles.paramName}>Nitrate (NO₃)</Text>
                  <Text style={styles.paramStandard}>&lt; 45 mg/L (High = Seepage)</Text>
                </View>
                <View style={styles.paramItem}>
                  <Text style={styles.paramName}>E. Coli / Coliforms</Text>
                  <Text style={styles.paramStandard}>0 MPN / 100 mL (Must be Zero)</Text>
                </View>
              </View>
            </View>
          </View>
        )}

        {/* TAB 3: DRAINAGE & SOAK PITS */}
        {activeTab === 'drainage' && (
          <View style={styles.tabContent}>
            <Text style={styles.sectionHeading}>Village Drainage & Ground Seepage</Text>
            <Text style={styles.sectionDesc}>
              Why unpaved wastewater paths pollute shallow rural groundwater in Nutakki:
            </Text>

            <View style={styles.drainageIllustrationCard}>
              <View style={styles.drainageBadge}>
                <Waves size={16} color={Colors.primary} />
                <Text style={styles.drainageBadgeText}>Field Observation Context</Text>
              </View>
              <Text style={styles.drainageBodyText}>
                During our college CSP visit to Nutakki village, we identified that domestic wastewater from washing areas and cattle sheds flows through unlined earthen ditches. In alluvial soils, this greywater permeates downwards, reaching shallow aquifer layers tapped by household hand pumps.
              </Text>
            </View>

            {/* Soak pit solution card */}
            <View style={styles.soakPitCard}>
              <Text style={styles.soakPitTitle}>Household Soak Pit (Infiltration Well)</Text>
              <Text style={styles.soakPitSubtitle}>
                A low-cost, decentralized community solution to stop direct wastewater seepage:
              </Text>

              <View style={styles.soakPitStep}>
                <View style={styles.bulletDot} />
                <Text style={styles.soakPitStepText}>
                  <Text style={{ fontWeight: '700' }}>Excavate a 1m x 1m x 1.5m pit </Text>
                  at least 10 meters away from any drinking borewell or hand pump.
                </Text>
              </View>

              <View style={styles.soakPitStep}>
                <View style={styles.bulletDot} />
                <Text style={styles.soakPitStepText}>
                  <Text style={{ fontWeight: '700' }}>Layered Filtration: </Text>
                  Fill base with large gravel/boulders (40mm), middle with aggregate (20mm), and top with coarse river sand.
                </Text>
              </View>

              <View style={styles.soakPitStep}>
                <View style={styles.bulletDot} />
                <Text style={styles.soakPitStepText}>
                  <Text style={{ fontWeight: '700' }}>Pre-settling Silt Trap: </Text>
                  Install an inlet basket to filter soap grease and solids before water enters the gravel bed.
                </Text>
              </View>

              <View style={styles.soakPitStep}>
                <View style={styles.bulletDot} />
                <Text style={styles.soakPitStepText}>
                  <Text style={{ fontWeight: '700' }}>Aquifer Recharge: </Text>
                  Natural biological filtration in sand neutralizes organic matter and replenishes groundwater safely.
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* TAB 4: OFFICIAL AP AUTHORITIES */}
        {activeTab === 'authorities' && (
          <View style={styles.tabContent}>
            <Text style={styles.sectionHeading}>Official Helplines & Authorities</Text>
            <Text style={styles.sectionDesc}>
              Direct contact channels for escalating water contamination and civic issues in Andhra Pradesh:
            </Text>

            {localAuthorities.map((auth, idx) => (
              <View key={idx} style={styles.authorityCard}>
                <View style={styles.authorityHeader}>
                  <View style={styles.authorityIconBox}>
                    <Building2 size={18} color={Colors.primary} strokeWidth={2.2} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.authorityName}>{auth.name}</Text>
                    <Text style={styles.authorityRole}>{auth.role}</Text>
                  </View>
                </View>

                <Text style={styles.authorityAction}>{auth.action}</Text>

                <View style={styles.authorityFooter}>
                  <Text style={styles.authorityContactLabel}>{auth.displayContact}</Text>
                  {auth.type === 'tel' && (
                    <TouchableOpacity
                      style={styles.callButton}
                      onPress={() => handleCall(auth.contact)}
                      activeOpacity={0.8}
                    >
                      <Phone size={14} color="#ffffff" strokeWidth={2.4} />
                      <Text style={styles.callButtonText}>Call Now</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Emergency Escalation Footer Card */}
        <View style={styles.emergencyCard}>
          <Text style={styles.emergencyTitle}>Notice Severe Contamination or Illness?</Text>
          <Text style={styles.emergencyBody}>
            Immediately stop consuming water from the source and alert the Nutakki Gram Panchayat and Spandana helpline (1902). You can also document the location using the JalaWatch Report tab.
          </Text>
          <TouchableOpacity
            style={styles.emergencyCallBtn}
            onPress={() => handleCall('1902')}
            activeOpacity={0.8}
          >
            <Phone size={16} color="#ffffff" strokeWidth={2.4} />
            <Text style={styles.emergencyCallBtnText}>Call Spandana Helpline (1902)</Text>
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  headerIconCircle: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.slate900,
  },
  headerSubtitle: {
    fontSize: 11,
    color: Colors.slate500,
  },
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  alertCard: {
    backgroundColor: '#fffbeb',
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: '#fde68a',
    padding: 16,
    marginBottom: 16,
    ...Shadows.card,
  },
  alertHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  alertTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: '#b45309',
    letterSpacing: 0.5,
  },
  alertStrong: {
    fontSize: 15,
    fontWeight: '800',
    color: '#78350f',
    marginBottom: 8,
  },
  alertBody: {
    fontSize: 12,
    lineHeight: 18,
    color: '#92400e',
    marginBottom: 12,
  },
  alertPointsRow: {
    gap: 8,
  },
  alertPoint: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: '#ffffff',
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#fef3c7',
  },
  alertPointIcon: {
    marginTop: 2,
  },
  alertPointText: {
    fontSize: 11,
    lineHeight: 16,
    color: Colors.slate700,
    flex: 1,
  },
  tabScroll: {
    gap: 8,
    paddingBottom: 16,
  },
  tabButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 24,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  tabButtonActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  tabButtonText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.slate600,
  },
  tabButtonTextActive: {
    color: '#ffffff',
  },
  tabContent: {
    gap: 12,
  },
  sectionHeading: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.slate900,
  },
  sectionDesc: {
    fontSize: 12,
    color: Colors.slate500,
    lineHeight: 17,
    marginBottom: 4,
  },
  anomalyCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    gap: 10,
    ...Shadows.card,
  },
  anomalyCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  anomalyTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: Colors.slate900,
    flex: 1,
  },
  anomalyBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  anomalyBadgeText: {
    fontSize: 10,
    fontWeight: '800',
  },
  anomalySection: {
    gap: 2,
  },
  anomalyFieldLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.slate500,
    textTransform: 'uppercase',
  },
  anomalyFieldValue: {
    fontSize: 12,
    color: Colors.slate700,
    lineHeight: 17,
  },
  anomalyRecBox: {
    backgroundColor: Colors.primaryBg,
    padding: 10,
    borderRadius: 10,
    borderLeftWidth: 3,
    borderLeftColor: Colors.primary,
  },
  anomalyRecLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: Colors.primaryDark,
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  anomalyRecValue: {
    fontSize: 11,
    lineHeight: 16,
    color: Colors.slate800,
    fontWeight: '600',
  },
  stepCard: {
    flexDirection: 'row',
    gap: 12,
    backgroundColor: '#ffffff',
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    ...Shadows.card,
  },
  stepNumberBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepNumberText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '900',
  },
  stepBody: {
    flex: 1,
  },
  stepTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: Colors.slate900,
    marginBottom: 4,
  },
  stepDesc: {
    fontSize: 11,
    lineHeight: 16,
    color: Colors.slate600,
  },
  paramsCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginTop: 6,
    ...Shadows.card,
  },
  paramsTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: Colors.slate900,
    marginBottom: 10,
  },
  paramGrid: {
    gap: 8,
  },
  paramItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  paramName: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.slate800,
  },
  paramStandard: {
    fontSize: 11,
    color: Colors.primaryDark,
    fontWeight: '600',
  },
  drainageIllustrationCard: {
    backgroundColor: Colors.primaryBg,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.primaryBorder,
  },
  drainageBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  drainageBadgeText: {
    fontSize: 12,
    fontWeight: '800',
    color: Colors.primaryDark,
  },
  drainageBodyText: {
    fontSize: 12,
    lineHeight: 18,
    color: Colors.slate700,
  },
  soakPitCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    gap: 8,
    ...Shadows.card,
  },
  soakPitTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: Colors.slate900,
  },
  soakPitSubtitle: {
    fontSize: 11,
    color: Colors.slate500,
    marginBottom: 4,
  },
  soakPitStep: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'flex-start',
  },
  bulletDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.primary,
    marginTop: 6,
  },
  soakPitStepText: {
    fontSize: 11,
    lineHeight: 17,
    color: Colors.slate700,
    flex: 1,
  },
  authorityCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    gap: 10,
    ...Shadows.card,
  },
  authorityHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  authorityIconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: Colors.primaryBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  authorityName: {
    fontSize: 13,
    fontWeight: '800',
    color: Colors.slate900,
  },
  authorityRole: {
    fontSize: 10,
    color: Colors.slate500,
    marginTop: 1,
  },
  authorityAction: {
    fontSize: 11,
    color: Colors.slate600,
    lineHeight: 16,
  },
  authorityFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  authorityContactLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.primaryDark,
  },
  callButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 18,
  },
  callButtonText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '700',
  },
  emergencyCard: {
    backgroundColor: '#042f2e',
    borderRadius: 20,
    padding: 18,
    marginTop: 20,
    gap: 8,
    ...Shadows.float,
  },
  emergencyTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#ffffff',
  },
  emergencyBody: {
    fontSize: 11,
    lineHeight: 16,
    color: '#99f6e4',
  },
  emergencyCallBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.warning,
    paddingVertical: 10,
    borderRadius: 12,
    marginTop: 6,
  },
  emergencyCallBtnText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '800',
  },
});
