import React, { useState, useEffect } from 'react';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import IntroSplash from './components/IntroSplash';
import Home from './pages/Home';
import ReportIssue from './pages/ReportIssue';
import CommunityReports from './pages/CommunityReports';
import WaterSafety from './pages/WaterSafety';
import About from './pages/About';
import AdminLogin from './pages/AdminLogin';
import AdminDashboard from './pages/AdminDashboard';
import { ShieldAlert, X } from 'lucide-react';

const BASE_PATH = (import.meta.env.BASE_URL || '/').replace(/\/+$/, '');

function getPageFromUrl() {
  let path = window.location.pathname;
  if (BASE_PATH && path.toLowerCase().startsWith(BASE_PATH.toLowerCase())) {
    path = path.slice(BASE_PATH.length);
  }
  path = path.replace(/^\/+|\/+$/g, '').toLowerCase();
  const hash = window.location.hash.replace(/^#\/?/, '').toLowerCase();
  const target = hash || path;
  if (target === 'report' || target === 'report-issue') return 'report';
  if (target === 'reports' || target === 'community-reports') return 'reports';
  if (target === 'safety' || target === 'water-safety') return 'safety';
  if (target === 'about') return 'about';
  if (target === 'admin' || target === 'admin-login') return 'admin-login';
  if (target === 'admin-dashboard' || target === 'dashboard') return 'admin-dashboard';
  return 'home';
}

function getPathForPage(page) {
  let sub = '/';
  switch (page) {
    case 'report': sub = '/report'; break;
    case 'reports': sub = '/reports'; break;
    case 'safety': sub = '/safety'; break;
    case 'about': sub = '/about'; break;
    case 'admin-login': sub = '/admin'; break;
    case 'admin-dashboard': sub = '/admin-dashboard'; break;
    default: sub = '/'; break;
  }
  return `${BASE_PATH}${sub}`.replace(/\/+/g, '/') || '/';
}

function AppContent() {
  const [showIntro, setShowIntro] = useState(true);
  const [activePage, setActivePageRaw] = useState(() => getPageFromUrl());
  const [initialReportToView, setInitialReportToView] = useState(null);
  const [bannerDismissed, setBannerDismissed] = useState(false);

  const setActivePage = (page, replace = false) => {
    setActivePageRaw(page);
    const newPath = getPathForPage(page);
    if (window.location.pathname !== newPath) {
      if (replace) {
        window.history.replaceState({ page }, '', newPath);
      } else {
        window.history.pushState({ page }, '', newPath);
      }
    }
  };

  useEffect(() => {
    const handlePopState = () => {
      setActivePageRaw(getPageFromUrl());
    };
    window.addEventListener('popstate', handlePopState);
    window.addEventListener('hashchange', handlePopState);
    return () => {
      window.removeEventListener('popstate', handlePopState);
      window.removeEventListener('hashchange', handlePopState);
    };
  }, []);

  const handleSelectReportFromHome = (report) => {
    setInitialReportToView(report);
    setActivePage('reports');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleReportCreated = () => {
    // When a report is created, it's already shown in ReportIssue's confirmation screen
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 font-sans selection:bg-teal-500 selection:text-white">
      {/* 5-Second Academic Intro Splash */}
      {showIntro && <IntroSplash onFinish={() => setShowIntro(false)} />}
      
      {/* Top Academic Context Alert Bar */}
      {!bannerDismissed && (
        <div className="bg-gradient-to-r from-teal-950 via-slate-900 to-teal-900 text-white text-[11px] sm:text-xs py-1.5 px-4 border-b border-slate-800">
          <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 truncate">
              <span className="px-1.5 py-0.5 rounded bg-teal-500/30 text-mint-300 font-bold uppercase tracking-wider text-[10px] shrink-0">
                CSP 2026
              </span>
              <span className="truncate">
                <strong>JalaWatch Prototype:</strong> Community Service Project study for Nutakki Village & Vijayawada region. Observational reporting portal.
              </span>
            </div>
            <button
              onClick={() => setBannerDismissed(true)}
              className="p-1 text-slate-400 hover:text-white transition-colors shrink-0"
              title="Dismiss banner"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Main Responsive Header */}
      <Navbar activePage={activePage} setActivePage={setActivePage} />

      {/* Main View Router */}
      <main className="flex-1">
        {activePage === 'home' && (
          <Home
            setActivePage={setActivePage}
            onSelectReport={handleSelectReportFromHome}
          />
        )}

        {activePage === 'report' && (
          <ReportIssue
            setActivePage={setActivePage}
            onReportCreated={handleReportCreated}
          />
        )}

        {activePage === 'reports' && (
          <CommunityReports
            setActivePage={setActivePage}
            initialReport={initialReportToView}
            onClearInitialReport={() => setInitialReportToView(null)}
          />
        )}

        {activePage === 'safety' && (
          <WaterSafety />
        )}

        {activePage === 'about' && (
          <About setActivePage={setActivePage} />
        )}

        {activePage === 'admin-login' && (
          <AdminLogin setActivePage={setActivePage} />
        )}

        {activePage === 'admin-dashboard' && (
          <AdminDashboard setActivePage={setActivePage} />
        )}
      </main>

      {/* Global Footer */}
      <Footer setActivePage={setActivePage} />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <AppContent />
      </ToastProvider>
    </AuthProvider>
  );
}
