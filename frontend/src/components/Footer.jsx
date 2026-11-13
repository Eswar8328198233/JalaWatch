import React from 'react';
import { Droplets, ShieldAlert, Phone, ExternalLink, Heart } from 'lucide-react';

const BASE_PATH = (import.meta.env.BASE_URL || '/').replace(/\/+$/, '');

function getNavUrl(id) {
  switch (id) {
    case 'home': return `${BASE_PATH}/` || '/';
    case 'reports': return `${BASE_PATH}/reports`;
    case 'safety': return `${BASE_PATH}/safety`;
    case 'about': return `${BASE_PATH}/about`;
    case 'report': return `${BASE_PATH}/report`;
    case 'admin-login': return `${BASE_PATH}/admin`;
    case 'admin-dashboard': return `${BASE_PATH}/admin-dashboard`;
    default: return `${BASE_PATH}/` || '/';
  }
}

export default function Footer({ setActivePage }) {
  const handleNav = (e, pageId) => {
    e.preventDefault();
    setActivePage(pageId);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

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
            <a 
              href={getNavUrl('home')}
              onClick={(e) => handleNav(e, 'home')}
              className="flex items-center gap-2.5 no-underline text-inherit"
            >
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-brand-500 to-teal-400 flex items-center justify-center text-white">
                <Droplets className="w-5 h-5" />
              </div>
              <span className="text-xl font-bold tracking-tight text-white font-['Outfit']">
                JalaWatch
              </span>
            </a>
            <p className="text-xs text-slate-400 leading-relaxed">
              Inspired by field visits to Nutakki Village near Vijayawada, Andhra Pradesh. Empowering local communities to log water quality anomalies, study recharge risks, and bridge the gap with civic authorities.
            </p>
            <div className="text-xs text-teal-400 font-medium">
              Community Service Project (CSP) 2026
            </div>
          </div>

          {/* Col 2: Navigation (Crawlable Anchor Links) */}
          <div>
            <h4 className="text-sm font-semibold text-white tracking-wider uppercase mb-4">
              Explore Portal
            </h4>
            <ul className="space-y-2.5 text-xs text-slate-400">
              <li>
                <a 
                  href={getNavUrl('home')} 
                  onClick={(e) => handleNav(e, 'home')} 
                  className="hover:text-brand-400 transition-colors no-underline text-inherit"
                >
                  Home Overview
                </a>
              </li>
              <li>
                <a 
                  href={getNavUrl('report')} 
                  onClick={(e) => handleNav(e, 'report')} 
                  className="hover:text-brand-400 transition-colors no-underline text-inherit"
                >
                  Report Groundwater Concern
                </a>
              </li>
              <li>
                <a 
                  href={getNavUrl('reports')} 
                  onClick={(e) => handleNav(e, 'reports')} 
                  className="hover:text-brand-400 transition-colors no-underline text-inherit"
                >
                  Community Reports Database
                </a>
              </li>
              <li>
                <a 
                  href={getNavUrl('safety')} 
                  onClick={(e) => handleNav(e, 'safety')} 
                  className="hover:text-brand-400 transition-colors no-underline text-inherit"
                >
                  Water Testing & Safety Guide
                </a>
              </li>
              <li>
                <a 
                  href={getNavUrl('about')} 
                  onClick={(e) => handleNav(e, 'about')} 
                  className="hover:text-brand-400 transition-colors no-underline text-inherit"
                >
                  Nutakki Field Study & Team
                </a>
              </li>
              <li>
                <a 
                  href={getNavUrl('admin-login')} 
                  onClick={(e) => handleNav(e, 'admin-login')} 
                  className="text-slate-500 hover:text-slate-400 transition-colors no-underline text-inherit"
                >
                  Admin Access Portal
                </a>
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
