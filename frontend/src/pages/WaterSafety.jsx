import React, { useState } from 'react';
import { 
  ShieldCheck, AlertTriangle, Droplets, FlaskConical, Phone, 
  HelpCircle, CheckCircle2, XCircle, ExternalLink, Info, Filter,
  Layers, Waves, Home, Sparkles, Building
} from 'lucide-react';

export default function WaterSafety() {
  const [activeTab, setActiveTab] = useState('anomalies'); // 'anomalies' | 'testing' | 'drainage' | 'authorities'

  const sensoryAnomalies = [
    {
      title: 'Black or Dark Grey Water',
      likelyCauses: 'Naturally occurring Manganese minerals, dissolved anaerobic organic matter, or underground septic tank seepage into shallow borewells.',
      healthRisk: 'Manganese in high concentrations can cause neurological issues in children. Sewage seepage introduces pathogenic bacteria like E. coli and Salmonella.',
      recommendation: 'Cease drinking immediately. Test for microbial coliforms, heavy metals (Manganese/Iron), and Electrical Conductivity (EC).'
    },
    {
      title: 'Rotten Egg / Sulfur Smell',
      likelyCauses: 'Hydrogen Sulfide (H₂S) gas produced by anaerobic sulfur-reducing bacteria feeding on organic waste or sewage in low-oxygen groundwater strata.',
      healthRisk: 'Causes nausea, headaches, and digestive distress. Highly corrosive to plumbing fixtures and indicates lack of aquifer aeration.',
      recommendation: 'Check nearby septic pits and open drains. Collect water sample for biological oxygen demand and fecal contamination testing.'
    },
    {
      title: 'Foaming or Detergent Scent',
      likelyCauses: 'Synthetic surfactants from domestic laundry wastewater, dishwashing detergents, or industrial packaging washouts draining directly into open ground.',
      healthRisk: 'Surfactants facilitate the transport of toxic organic compounds into deep aquifers and cause gastrointestinal inflammation.',
      recommendation: 'Trace surface drainage paths. Construct household soak pits to filter greywater before it reaches the water table.'
    },
    {
      title: 'Yellowish or Reddish-Brown Rust',
      likelyCauses: 'Iron oxidization, corroded mild-steel borewell casings, or high geological iron content in alluvial soil.',
      healthRisk: 'Generally low toxicity at moderate levels, but stains clothing, damages fixtures, and fosters iron-related bio-slime bacteria.',
      recommendation: 'Inspect casing pipes. Install gravel-sand filter or aeration unit after confirming safe bacterial levels via lab tests.'
    }
  ];

  const localAuthorities = [
    {
      name: 'Andhra Pradesh Spandana Grievance Portal',
      role: 'Unified State Public Grievance Redressal System',
      contact: 'Toll-free: 1902',
      action: 'File an official civic petition for drinking water contamination or village drainage stagnation.'
    },
    {
      name: 'AP Pollution Control Board (Regional Office, Vijayawada)',
      role: 'Environmental Regulation & Industrial Discharge Oversight',
      contact: 'Phone: 0866-2463200 | RO Vijayawada',
      action: 'Report suspected illegal industrial waste dumping, hazardous chemical runoff, or canal contamination.'
    },
    {
      name: 'Rural Water Supply & Sanitation (RWS&S) Department',
      role: 'Drinking Water Infrastructure & Village Water Testing',
      contact: 'District Laboratory, Guntur / Vijayawada Division',
      action: 'Request routine potable water quality checks, chlorination inspection, and Jal Jeevan Mission tap audits.'
    },
    {
      name: 'Nutakki Gram Panchayat Office',
      role: 'Local Village Administration & Street Drainage Maintenance',
      contact: 'Panchayat Secretary / Village Sarpanch Desk',
      action: 'Escalate open drain blockages, borewell pump repair, and soak pit construction subsidies.'
    }
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-12">
      
      {/* Header */}
      <div className="text-center max-w-3xl mx-auto space-y-3">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-teal-50 border border-teal-200 text-teal-800 text-xs font-semibold">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>Scientific Awareness & Testing Guidelines</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 font-['Outfit']">
          Water Safety & Ground Reality Guide
        </h1>
        <p className="text-sm text-slate-600 leading-relaxed">
          Groundwater is an invisible community asset. Learn how to interpret water quality signs, understand laboratory testing procedures, and safeguard rural water tables.
        </p>
      </div>

      {/* Critical Scientific Advisory Alert */}
      <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-rose-500/10 border-2 border-amber-300 text-slate-800 shadow-sm space-y-3">
        <div className="flex items-center gap-2.5 text-amber-900 font-bold text-base">
          <AlertTriangle className="w-6 h-6 text-amber-600 shrink-0" />
          <span>CRITICAL SCIENTIFIC PRINCIPLE: Appearance Alone Cannot Verify Safety</span>
        </div>
        <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
          It is a dangerous misconception that water is safe simply because it looks clear and odorless. Many of the most hazardous groundwater contaminants—including <strong>pathogenic bacteria (E. coli, Cholera), Arsenic, Fluoride, and pesticide residues</strong>—are completely colorless, tasteless, and odorless.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2 text-xs">
          <div className="p-3 rounded-xl bg-white/80 border border-amber-200">
            <span className="font-semibold text-rose-700 block mb-1">❌ What Visual/TDS Tests Cannot Detect:</span>
            <span>Handheld TDS pens only measure total dissolved mineral ions—they cannot differentiate harmless calcium from toxic heavy metals, nor detect microscopic fecal pathogens.</span>
          </div>
          <div className="p-3 rounded-xl bg-white/80 border border-amber-200">
            <span className="font-semibold text-emerald-700 block mb-1">✓ The Only Valid Method:</span>
            <span>Suspected contaminated water must undergo certified biological and chemical analysis at a state RWS&S or NABL-accredited testing laboratory.</span>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex flex-wrap items-center justify-center gap-2 border-b border-slate-200 pb-4">
        {[
          { id: 'anomalies', label: '1. Decoding Water Anomalies', icon: Droplets },
          { id: 'testing', label: '2. How to Request Lab Testing', icon: FlaskConical },
          { id: 'drainage', label: '3. Drainage & Soak Pits', icon: Waves },
          { id: 'authorities', label: '4. Official AP Authorities', icon: Building },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-xs sm:text-sm font-bold transition-all ${
                isActive
                  ? 'bg-teal-600 text-white shadow-md shadow-teal-600/20'
                  : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab 1: Water Anomalies */}
      {activeTab === 'anomalies' && (
        <div className="space-y-6 animate-in fade-in">
          <div className="max-w-2xl">
            <h3 className="text-xl font-bold text-slate-900 font-['Outfit']">
              Common Sensory Indicators in Village Groundwater
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Field observations recorded in Nutakki and Guntur rural aquifers and their potential scientific causes.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {sensoryAnomalies.map((item, idx) => (
              <div key={idx} className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4 flex flex-col justify-between">
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-2">
                    <h4 className="font-bold text-slate-900 text-base flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-brand-500"></span>
                      {item.title}
                    </h4>
                  </div>
                  <div>
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Possible Causes:</span>
                    <p className="text-xs text-slate-700 mt-0.5 leading-relaxed">{item.likelyCauses}</p>
                  </div>
                  <div>
                    <span className="text-[11px] font-bold text-rose-500 uppercase tracking-wider block">Potential Health Risk:</span>
                    <p className="text-xs text-slate-700 mt-0.5 leading-relaxed">{item.healthRisk}</p>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 bg-slate-50/70 p-3 rounded-xl text-xs text-brand-900">
                  <span className="font-semibold block text-brand-800">Action:</span>
                  <span className="text-slate-600">{item.recommendation}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 2: Lab Testing Guide */}
      {activeTab === 'testing' && (
        <div className="space-y-8 animate-in fade-in">
          <div className="max-w-3xl space-y-2">
            <h3 className="text-xl font-bold text-slate-900 font-['Outfit']">
              How to Get Groundwater Tested in Andhra Pradesh
            </h3>
            <p className="text-xs text-slate-500">
              Follow these standard scientific protocols to obtain actionable, legally valid water quality reports.
            </p>
          </div>

          {/* Step by step cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-3">
              <div className="w-9 h-9 rounded-xl bg-brand-50 text-brand-600 font-bold flex items-center justify-center font-['Outfit']">
                Step 1
              </div>
              <h4 className="font-bold text-slate-800 text-sm">Sterile Bottle Collection</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Use a clean, sterile 1-liter plastic or glass container provided by the laboratory. Do not rinse the bottle with detergent or tap water.
              </p>
            </div>

            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-3">
              <div className="w-9 h-9 rounded-xl bg-teal-50 text-teal-600 font-bold flex items-center justify-center font-['Outfit']">
                Step 2
              </div>
              <h4 className="font-bold text-slate-800 text-sm">Purge Before Sampling</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Run the borewell or hand pump continuously for 5–10 minutes to clear stagnant water inside casing pipes. Fill container directly without touching nozzle.
              </p>
            </div>

            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-3">
              <div className="w-9 h-9 rounded-xl bg-sky-50 text-sky-600 font-bold flex items-center justify-center font-['Outfit']">
                Step 3
              </div>
              <h4 className="font-bold text-slate-800 text-sm">Submit Within 24 Hours</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Keep the bottle cool (preferably on ice pack) and deliver to the RWS&S or APPCB laboratory within 24 hours to prevent bacterial degradation.
              </p>
            </div>
          </div>

          {/* Test parameters info table */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
            <h4 className="font-bold text-slate-800 text-base">Key Testing Parameters to Request</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                <span className="font-bold text-slate-800 block">1. Microbiological</span>
                <span className="text-slate-600">Total Coliforms & E. coli count (Indicates sewage/fecal infiltration).</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                <span className="font-bold text-slate-800 block">2. Heavy Metals</span>
                <span className="text-slate-600">Iron, Manganese, Lead, Arsenic (Evaluates industrial/soil dissolution).</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                <span className="font-bold text-slate-800 block">3. Chemical Ions</span>
                <span className="text-slate-600">Nitrates (NO₃), Fluoride (F), Chlorides, Sulfates (Agriculture & septic indicators).</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                <span className="font-bold text-slate-800 block">4. Physical Standards</span>
                <span className="text-slate-600">pH, Turbidity (NTU), Electrical Conductivity (EC), Total Dissolved Solids.</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Drainage & Wastewater Management */}
      {activeTab === 'drainage' && (
        <div className="space-y-8 animate-in fade-in">
          <div className="max-w-3xl space-y-2">
            <h3 className="text-xl font-bold text-slate-900 font-['Outfit']">
              Village Wastewater Management & Soak Pits
            </h3>
            <p className="text-xs text-slate-500">
              Field observations in Nutakki highlighted that lack of covered drains creates major groundwater pollution risks.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
              <div className="flex items-center gap-2 text-rose-600 font-bold text-base">
                <XCircle className="w-5 h-5" />
                <span>The Unmanaged Drainage Hazard</span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                In many villages like Nutakki, kitchen greywater and bathroom sullage drain into unlined earthen side-ditches. During monsoon spells or heavy morning use:
              </p>
              <ul className="text-xs text-slate-600 space-y-2 list-disc pl-5">
                <li>Untreated greywater pools and stagnates for days.</li>
                <li>Permeable topsoils allow blackish organic pollutants and bacteria to seep downwards into shallow unconfined aquifers.</li>
                <li>Domestic borewells drilled within 5–10 meters of open gutters pull in contaminated subsurface recharge.</li>
              </ul>
            </div>

            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
              <div className="flex items-center gap-2 text-emerald-600 font-bold text-base">
                <CheckCircle2 className="w-5 h-5" />
                <span>The Soak Pit Solution</span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                A simple, low-cost individual or community soak pit acts as a natural subsurface biological filter:
              </p>
              <ul className="text-xs text-slate-600 space-y-2 list-disc pl-5">
                <li>Excavate a 1m × 1m pit filled with graded boulder, brickbats, and coarse river sand.</li>
                <li>Direct household greywater through a preliminary grease trap mesh.</li>
                <li>Beneficial aerobic bacteria in the gravel layer digest organic waste before clean water naturally recharges the groundwater.</li>
                <li><strong>Crucial Rule:</strong> Always keep soak pits at least <strong>15 meters away</strong> from drinking water borewells.</li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Tab 4: Local Authorities Directory */}
      {activeTab === 'authorities' && (
        <div className="space-y-6 animate-in fade-in">
          <div className="max-w-2xl">
            <h3 className="text-xl font-bold text-slate-900 font-['Outfit']">
              Official Reporting Channels in Andhra Pradesh
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Contact these authorized governmental bodies for formal escalation, testing, or regulatory enforcement.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {localAuthorities.map((auth, idx) => (
              <div key={idx} className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <h4 className="font-bold text-slate-900 text-sm">{auth.name}</h4>
                  <Building className="w-4 h-4 text-brand-600 shrink-0 mt-0.5" />
                </div>
                <div className="text-xs text-brand-700 font-medium bg-brand-50/80 px-2.5 py-1 rounded-lg border border-brand-100 inline-block">
                  {auth.contact}
                </div>
                <p className="text-xs text-slate-500">{auth.role}</p>
                <div className="text-xs text-slate-700 pt-2 border-t border-slate-100">
                  <strong className="text-slate-800">When to Contact:</strong> {auth.action}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
}
