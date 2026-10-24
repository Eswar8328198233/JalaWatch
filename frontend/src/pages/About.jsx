import React from 'react';
import { 
  Building2, Users, ShieldAlert, Award, BookOpen, 
  MapPin, CheckCircle2, Heart, Mail, ExternalLink
} from 'lucide-react';

export default function About({ setActivePage }) {
  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-12">
      
      {/* Header */}
      <div className="text-center space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-50 border border-teal-200 text-teal-800 text-xs font-semibold">
          <BookOpen className="w-3.5 h-3.5" />
          <span>College Community Service Project (CSP)</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 font-['Outfit']">
          About JalaWatch
        </h1>
        <p className="text-sm text-slate-600 max-w-2xl mx-auto leading-relaxed">
          An academic civic initiative born from on-ground field observations in rural Andhra Pradesh to bridge community awareness and environmental stewardship.
        </p>
      </div>

      {/* Origin Story: Nutakki Village Field Visit */}
      <div className="bg-white rounded-3xl p-8 sm:p-10 border border-slate-200 shadow-sm space-y-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center">
            <MapPin className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900 font-['Outfit']">
              The Nutakki Village Field Visit
            </h2>
            <span className="text-xs text-slate-500">Vijayawada / Guntur District, Andhra Pradesh</span>
          </div>
        </div>

        <p className="text-sm text-slate-700 leading-relaxed">
          As part of our mandatory college <strong>Community Service Project (CSP)</strong>, our student team visited <strong>Nutakki Village</strong>, situated along the Krishna river plains near Vijayawada. During interactions with local elders, homemakers, and farmers, residents voiced persistent anxiety over dark grey and black-coloured water being pumped from domestic borewells.
        </p>

        <p className="text-sm text-slate-700 leading-relaxed">
          Through village transect walks, our team made two pivotal observations:
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs space-y-2">
            <span className="font-bold text-slate-800 text-sm block">1. Drainage Vulnerability</span>
            <p className="text-slate-600 leading-relaxed">
              The village lacks an underground or covered lined drainage system. Sullage and wastewater from households run in open earthen side-channels, pooling in hollow depressions and percolating continuously into shallow unconfined subsoil.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs space-y-2">
            <span className="font-bold text-slate-800 text-sm block">2. Scientific Uncertainty</span>
            <p className="text-slate-600 leading-relaxed">
              While villagers suspect specific nearby causes, <strong>the actual root cause of groundwater pollution has not been independently verified</strong>. Discoloration could stem from manganese minerals, anaerobic organic decay, septic seepage, or other factors.
            </p>
          </div>
        </div>

        <p className="text-sm text-slate-700 leading-relaxed">
          This reality revealed an urgent need: communities require a responsible platform to systematically log concerns, understand testing protocols, and present organized observations to Gram Panchayat and RWS&S officials rather than relying on unverified speculation.
        </p>
      </div>

      {/* Mandatory Scope and Non-Government Disclaimer */}
      <div className="p-6 sm:p-8 rounded-3xl bg-amber-500/10 border-2 border-amber-300 text-slate-800 space-y-3">
        <div className="flex items-center gap-2.5 text-amber-950 font-bold text-base">
          <ShieldAlert className="w-6 h-6 text-amber-600 shrink-0" />
          <span>Academic Prototype Scope & Legal Disclaimer</span>
        </div>
        <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
          <strong>JalaWatch is a student-built prototype developed purely for educational, civic awareness, and Community Service Project evaluation purposes.</strong>
        </p>
        <ul className="text-xs text-slate-700 space-y-1.5 list-disc pl-5">
          <li>It is <strong>not</strong> an official government portal, police FIR system, or statutory regulatory agency.</li>
          <li>Submitting a report on JalaWatch does <strong>not</strong> mean the report has been dispatched to government departments unless an administrator manually coordinates an official referral.</li>
          <li>JalaWatch does <strong>not</strong> claim to independently certify whether any borewell or tap water is contaminated or drinkable. Only accredited laboratory chemical analysis can provide formal certification.</li>
        </ul>
      </div>

      {/* Project Objectives & Core Tenets */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-3">
          <div className="w-9 h-9 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center">
            <Award className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-slate-900 text-base">Data Minimization</h3>
          <p className="text-xs text-slate-600 leading-relaxed">
            Citizens can submit observations anonymously. We do not require national IDs, phone numbers, or passwords from rural reporters.
          </p>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-3">
          <div className="w-9 h-9 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center">
            <Users className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-slate-900 text-base">Community Empowerment</h3>
          <p className="text-xs text-slate-600 leading-relaxed">
            Provides rural residents with accessible scientific information on how groundwater tables function, soak pit benefits, and sterile sample collection.
          </p>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-3">
          <div className="w-9 h-9 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center">
            <Building2 className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-slate-900 text-base">Civic Bridge</h3>
          <p className="text-xs text-slate-600 leading-relaxed">
            Helps Gram Panchayat members and public health officers see geographic clusters of complaints to prioritize official water testing drives.
          </p>
        </div>
      </div>

      {/* Team & Institutional Context */}
      <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm space-y-6">
        <h3 className="text-xl font-bold text-slate-900 font-['Outfit']">
          Project Team & Academic Affiliation
        </h3>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
            <span className="font-bold text-slate-800 text-sm">Community Service Project (CSP) Team</span>
            <p className="text-slate-600">Undergraduate Engineering & Science Students</p>
            <p className="text-slate-500">Andhra Pradesh Higher Education Council (APSCHE) CSP Curriculum</p>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
            <span className="font-bold text-slate-800 text-sm">Study Area & Community Partners</span>
            <p className="text-slate-600">Nutakki Gram Panchayat, Mangalagiri Mandal</p>
            <p className="text-slate-500">Guntur / Amaravati Capital Region, Andhra Pradesh</p>
          </div>
        </div>

        <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-slate-100 text-xs">
          <span className="text-slate-500">
            For academic queries or laboratory testing collaboration:
          </span>
          <a
            href="mailto:csp.jalawatch@student.edu"
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium transition-colors"
          >
            <Mail className="w-4 h-4 text-brand-600" />
            <span>csp.jalawatch@student.edu</span>
          </a>
        </div>
      </div>

    </div>
  );
}
