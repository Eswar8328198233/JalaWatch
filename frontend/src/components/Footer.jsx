import React from 'react';
import { Droplets, ShieldAlert, Phone, ExternalLink, Heart } from 'lucide-react';

export default function Footer({ setActivePage }) {
  return (
    <footer className="bg-slate-900 text-slate-300 pt-16 pb-12 border-t border-slate-800 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Top Disclaimer Box */}
        <div className="mb-12 p-5 rounded-2xl bg-slate-800/80 border border-slate-700/80 flex flex-col md:flex-row items-start md:items-center gap-4 text-xs text-slate-300">
          <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 shrink-0">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div className="space-y-1">
            <span className="font-semibold text-slate-100 uppercase tracking-wider text-[11px] block">
              CSP Academic Prototype & Disclaimer Notice
            </span>
            <p className="leading-relaxed">
              <strong>JalaWatch</strong> is a student-built Community Service Project (CSP) prototype designed to facilitate civic observation, environmental awareness, and public education. 
              <strong> It is not an official government service</strong> and does not possess authority to verify contamination claims independently. Always submit samples to an accredited environmental testing laboratory for legal drinkability verification.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 pb-12 border-b border-slate-800">
          
          {/* Col 1: Brand & Project Background */}
          <div className="space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-brand-500 to-teal-400 flex items-center justify-center text-white">
                <Droplets className="w-5 h-5" />
              </div>
              <span className="text-xl font-bold tracking-tight text-white font-['Outfit']">
                JalaWatch
              </span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Inspired by field visits to Nutakki Village near Vijayawada, Andhra Pradesh. Empowering local communities to log water quality anomalies, study recharge risks, and bridge the gap with civic authorities.
            </p>
            <div className="text-xs text-teal-400 font-medium">
              Community Service Project (CSP) 2026
            </div>
          </div>

          {/* Col 2: Navigation */}
          <div>
            <h4 className="text-sm font-semibold text-white tracking-wider uppercase mb-4">
              Explore Portal
            </h4>
            <ul className="space-y-2.5 text-xs text-slate-400">
              <li>
                <button onClick={() => { setActivePage('home'); window.scrollTo(0, 0); }} className="hover:text-brand-400 transition-colors">
                  Home Overview
                </button>
              </li>
              <li>
                <button onClick={() => { setActivePage('report'); window.scrollTo(0, 0); }} className="hover:text-brand-400 transition-colors">
                  Report Groundwater Concern
                </button>
              </li>
              <li>
                <button onClick={() => { setActivePage('reports'); window.scrollTo(0, 0); }} className="hover:text-brand-400 transition-colors">
                  Community Reports Database
                </button>
              </li>
              <li>
                <button onClick={() => { setActivePage('safety'); window.scrollTo(0, 0); }} className="hover:text-brand-400 transition-colors">
                  Water Testing & Safety Guide
                </button>
              </li>
              <li>
                <button onClick={() => { setActivePage('about'); window.scrollTo(0, 0); }} className="hover:text-brand-400 transition-colors">
                  Nutakki Field Study & Team
                </button>
              </li>
            </ul>
          </div>

          {/* Col 3: Government Water Authorities */}
          <div>
            <h4 className="text-sm font-semibold text-white tracking-wider uppercase mb-4">
              Official AP Channels
            </h4>
            <ul className="space-y-3 text-xs text-slate-400">
              <li className="flex items-start gap-2">
                <Phone className="w-3.5 h-3.5 text-teal-400 mt-0.5 shrink-0" />
                <div>
                  <span className="text-slate-200 font-medium block">AP Spandana Public Grievance</span>
                  <span>Toll-free Dial: 1902</span>
                </div>
              </li>
              <li className="flex items-start gap-2">
                <Phone className="w-3.5 h-3.5 text-teal-400 mt-0.5 shrink-0" />
                <div>
                  <span className="text-slate-200 font-medium block">AP Pollution Control Board (Vijayawada)</span>
                  <span>0866-2463200 / Regional Office</span>
                </div>
              </li>
              <li className="flex items-start gap-2">
                <ExternalLink className="w-3.5 h-3.5 text-teal-400 mt-0.5 shrink-0" />
                <div>
                  <span className="text-slate-200 font-medium block">RWS&S Rural Water Supply</span>
                  <span>District Water Quality Testing Lab</span>
                </div>
              </li>
            </ul>
          </div>

          {/* Col 4: Privacy & Ethics */}
          <div>
            <h4 className="text-sm font-semibold text-white tracking-wider uppercase mb-4">
              Privacy & Reporting Ethics
            </h4>
            <p className="text-xs text-slate-400 leading-relaxed mb-3">
              We practice strict data minimization. Citizen reports do not require mandatory personal identification. Submissions are documented as observations to encourage scientific water sampling rather than speculative blame.
            </p>
            <div className="p-2.5 rounded-lg bg-slate-800 text-[11px] text-slate-400 border border-slate-700">
              🛡️ No commercial ads or data monetization.
            </div>
          </div>

        </div>

        {/* Bottom Bar */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <p>© 2026 JalaWatch – Community Service Project (CSP). All rights reserved.</p>
          <p className="flex items-center gap-1.5">
            Built with <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500" /> for Nutakki Village community welfare.
          </p>
        </div>

      </div>
    </footer>
  );
}
