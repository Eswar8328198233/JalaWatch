import React, { useState } from 'react';
import { 
  Droplets, MapPin, AlertTriangle, ShieldCheck, FileText, 
  Info, Menu, X, Lock, LogOut, PlusCircle, Search
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Navbar({ activePage, setActivePage }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { isAuthenticated, admin, logout } = useAuth();

  const navItems = [
    { id: 'home', label: 'Live Map', icon: MapPin },
    { id: 'reports', label: 'Community Reports', icon: FileText },
    { id: 'safety', label: 'Water Safety', icon: ShieldCheck },
    { id: 'about', label: 'About & Field Study', icon: Info },
  ];

  const handleNavClick = (pageId) => {
    setActivePage(pageId);
    setMobileMenuOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-slate-200/90 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Left: Brand Logo & Title */}
          <div 
            onClick={() => handleNavClick('home')}
            className="flex items-center gap-2.5 cursor-pointer select-none group"
          >
            <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-teal-600 via-teal-500 to-mint-400 flex items-center justify-center text-white shadow-sm group-hover:scale-105 transition-transform">
              <Droplets className="w-5 h-5 fill-white/20" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-xl font-extrabold tracking-tight text-slate-900 font-['Outfit']">
                  JalaWatch
                </span>
                <span className="text-[10px] font-bold tracking-wide uppercase px-2 py-0.5 rounded-full bg-mint-100 text-teal-800 border border-mint-200">
                  Nutakki CSP
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-medium leading-none hidden sm:block">
                Groundwater Concern & Water Quality Monitor
              </p>
            </div>
          </div>

          {/* Center: Navigation Links (Clean tab bar matching reference image) */}
          <nav className="hidden md:flex items-center gap-1 lg:gap-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activePage === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleNavClick(item.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all duration-150 ${
                    isActive
                      ? 'bg-teal-50 text-teal-800 border border-teal-200/80 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-teal-600' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Right: Quick Report Action & Admin */}
          <div className="hidden sm:flex items-center gap-3">
            <button
              onClick={() => handleNavClick('report')}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold transition-all shadow-sm ${
                activePage === 'report'
                  ? 'bg-teal-700 text-white shadow-teal-700/20'
                  : 'bg-teal-600 hover:bg-teal-700 text-white shadow-teal-600/20 hover:-translate-y-0.5'
              }`}
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>Report Issue</span>
            </button>

            {isAuthenticated ? (
              <div className="flex items-center gap-1 pl-2 border-l border-slate-200">
                <button
                  onClick={() => handleNavClick('admin-dashboard')}
                  className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${
                    activePage === 'admin-dashboard'
                      ? 'bg-slate-900 text-white border-slate-900'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border-slate-200'
                  }`}
                >
                  <Lock className="w-3 h-3 text-teal-400" />
                  <span>Admin</span>
                </button>
                <button
                  onClick={() => {
                    logout();
                    handleNavClick('home');
                  }}
                  title="Logout"
                  className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => handleNavClick('admin-login')}
                className={`p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-full transition-colors ${
                  activePage === 'admin-login' ? 'text-teal-700 bg-teal-50' : ''
                }`}
                title="Admin Login Portal"
              >
                <Lock className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Mobile Quick Action & Hamburger */}
          <div className="flex sm:hidden items-center gap-2">
            <button
              onClick={() => handleNavClick('report')}
              className="px-3 py-1.5 text-xs font-bold rounded-full bg-teal-600 text-white shadow-sm flex items-center gap-1"
            >
              <PlusCircle className="w-3 h-3" />
              <span>Report</span>
            </button>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-slate-600 hover:text-slate-900 rounded-lg hover:bg-slate-100"
              aria-label="Toggle Menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>

        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="sm:hidden border-t border-slate-100 bg-white px-4 pt-3 pb-5 space-y-1.5 shadow-lg animate-in fade-in">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activePage === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                  isActive
                    ? 'bg-teal-50 text-teal-800'
                    : 'text-slate-700 hover:bg-slate-50'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-teal-600' : 'text-slate-400'}`} />
                <span>{item.label}</span>
              </button>
            );
          })}

          <div className="pt-2 border-t border-slate-100">
            {isAuthenticated ? (
              <div className="space-y-1">
                <button
                  onClick={() => handleNavClick('admin-dashboard')}
                  className="w-full flex items-center justify-between px-3 py-2 rounded-xl bg-slate-900 text-white text-xs font-semibold"
                >
                  <span className="flex items-center gap-1.5">
                    <Lock className="w-3.5 h-3.5 text-teal-400" />
                    Admin Dashboard ({admin?.username})
                  </span>
                </button>
                <button
                  onClick={() => {
                    logout();
                    handleNavClick('home');
                  }}
                  className="w-full text-center py-1.5 text-xs text-rose-600 font-medium"
                >
                  Sign Out
                </button>
              </div>
            ) : (
              <button
                onClick={() => handleNavClick('admin-login')}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium text-slate-500 hover:bg-slate-50"
              >
                <Lock className="w-3.5 h-3.5 text-slate-400" />
                <span>Admin Login Portal</span>
              </button>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
