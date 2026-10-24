import React, { useState, useEffect } from 'react';
import { Droplet, Waves, ChevronRight } from 'lucide-react';

export default function IntroSplash({ onFinish }) {
  const [phase, setPhase] = useState(0); // 0: 0-0.8s, 1: 0.8-2.0s, 2: 2.0-4.2s, 3: 4.2-5.0s
  const [progress, setProgress] = useState(0);
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    // Stage 1: 0.8s -> Logo scales and wordmark/badge appear
    const t1 = setTimeout(() => {
      setPhase(1);
    }, 800);

    // Stage 2: 2.0s -> Tagline and ripples activate
    const t2 = setTimeout(() => {
      setPhase(2);
    }, 2000);

    // 5-second progress bar animation (starts advancing smoothly)
    const intervalTime = 40;
    const totalDuration = 4800; // completes just before 5s
    const increment = (intervalTime / totalDuration) * 100;

    const progressTimer = setInterval(() => {
      setProgress((prev) => {
        const next = prev + increment;
        if (next >= 100) {
          clearInterval(progressTimer);
          return 100;
        }
        return next;
      });
    }, intervalTime);

    // Stage 3: 4.2s -> Fade smoothly into the existing website
    const t3 = setTimeout(() => {
      setPhase(3);
      setIsExiting(true);
    }, 4200);

    // Final finish: 5.0s -> Unmount intro splash
    const t4 = setTimeout(() => {
      onFinish();
    }, 5000);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(t4);
      clearInterval(progressTimer);
    };
  }, [onFinish]);

  const handleSkip = () => {
    setIsExiting(true);
    setTimeout(() => {
      onFinish();
    }, 250);
  };

  return (
    <div
      className={`fixed inset-0 z-[99999] flex flex-col items-center justify-between overflow-hidden select-none transition-opacity duration-700 ease-in-out ${
        isExiting ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
      style={{
        backgroundColor: '#F2FAF7',
        backgroundImage: 'radial-gradient(circle at 50% 40%, #FFFFFF 0%, #F2FAF7 65%, #E5F6F0 100%)',
      }}
      role="dialog"
      aria-label="JalaWatch Loading Introduction"
    >
      {/* Decorative ambient background water rings / ripples */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden">
        <div
          className={`w-[480px] h-[480px] rounded-full border border-[#17B8DB]/20 transition-all duration-1000 ${
            phase >= 2 ? 'scale-125 opacity-40 animate-[ping_4s_cubic-bezier(0,0,0.2,1)_infinite]' : 'scale-90 opacity-0'
          }`}
        />
        <div
          className={`absolute w-[360px] h-[360px] rounded-full border border-[#C3EDDC] transition-all duration-1000 ${
            phase >= 1 ? 'scale-110 opacity-60' : 'scale-75 opacity-0'
          }`}
        />
        <div
          className="absolute w-[600px] h-[600px] rounded-full opacity-30 blur-3xl pointer-events-none"
          style={{ background: 'radial-gradient(circle, #C3EDDC 0%, #17B8DB 35%, transparent 70%)' }}
        />
      </div>

      {/* Top Header Row with Skip Button */}
      <div className="w-full max-w-4xl mx-auto px-6 pt-6 sm:pt-8 flex items-center justify-between z-10">
        <div
          className={`transition-all duration-700 ${
            phase >= 1 ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2'
          }`}
        >
          <span
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold tracking-wider uppercase shadow-sm"
            style={{ backgroundColor: '#C3EDDC', color: '#0F766E', border: '1px solid rgba(15, 118, 110, 0.2)' }}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-[#0F766E] animate-pulse" />
            Nutakki CSP
          </span>
        </div>

        <button
          onClick={handleSkip}
          className="group flex items-center gap-1 px-3.5 py-1.5 rounded-full text-xs font-semibold text-[#0F766E] bg-white/80 hover:bg-white border border-[#C3EDDC] hover:border-[#17B8DB] shadow-sm backdrop-blur-sm transition-all active:scale-95"
          title="Skip Intro"
        >
          <span>Skip</span>
          <ChevronRight className="w-3.5 h-3.5 text-[#17B8DB] group-hover:translate-x-0.5 transition-transform" />
        </button>
      </div>

      {/* Main Center Branding Section */}
      <div className="flex flex-col items-center justify-center text-center px-6 max-w-lg mx-auto z-10 my-auto">
        {/* Centered JalaWatch Water-Drop Logo with Ripples */}
        <div className="relative flex items-center justify-center mb-6">
          {/* Subtle animated water ripple waves */}
          {phase >= 1 && (
            <>
              <div
                className="absolute w-28 h-28 sm:w-32 sm:h-32 rounded-full border-2 border-[#17B8DB]/30 animate-[ping_3s_cubic-bezier(0,0,0.2,1)_infinite]"
              />
              <div
                className="absolute w-36 h-36 sm:w-40 sm:h-40 rounded-full border border-[#C3EDDC] animate-[ping_3.8s_cubic-bezier(0,0,0.2,1)_infinite]"
              />
            </>
          )}

          {/* Central Logo Circle */}
          <div
            className={`relative w-20 h-20 sm:w-24 sm:h-24 rounded-3xl flex items-center justify-center shadow-lg transition-all duration-700 ease-out ${
              phase >= 1 ? 'scale-100 opacity-100' : 'scale-90 opacity-90'
            }`}
            style={{
              backgroundColor: '#FFFFFF',
              border: '2px solid #C3EDDC',
              boxShadow: '0 12px 28px -6px rgba(15, 118, 110, 0.18), 0 0 0 1px rgba(23, 184, 219, 0.1)',
            }}
          >
            {/* Water Drop Icon with Gentle Pulse */}
            <div className="relative">
              <Droplet
                className="w-10 h-10 sm:w-12 sm:h-12 text-[#0F766E] fill-[#17B8DB]/30 animate-pulse"
                style={{ animationDuration: '2.4s' }}
                strokeWidth={2.2}
              />
              <div
                className="absolute bottom-1 right-0 w-3 h-3 rounded-full bg-[#17B8DB] border-2 border-white"
              />
            </div>
          </div>
        </div>

        {/* Wordmark and Subtitle (Fades and scales in 0.8s - 2.0s) */}
        <div
          className={`space-y-1.5 transition-all duration-700 ${
            phase >= 1 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3'
          }`}
        >
          {/* Large, elegant JalaWatch wordmark */}
          <h1 className="text-4xl sm:text-5xl font-black tracking-tight flex items-center justify-center">
            <span style={{ color: '#0F766E' }}>Jala</span>
            <span style={{ color: '#17B8DB' }}>Watch</span>
          </h1>

          {/* Subtitle */}
          <p
            className="text-sm sm:text-base font-bold tracking-wide uppercase"
            style={{ color: '#0F766E', letterSpacing: '0.08em' }}
          >
            Groundwater & Seepage Monitor
          </p>

          {/* Small NUTAKKI CSP location indicator */}
          <div className="inline-flex items-center gap-1.5 text-xs text-slate-500 font-medium pt-0.5">
            <Waves className="w-3.5 h-3.5 text-[#17B8DB]" />
            <span>Nutakki Village • Mangalagiri Mandal • AP</span>
          </div>
        </div>

        {/* Tagline (Appears 2.0s - 4.2s) */}
        <div
          className={`mt-4 pt-2 transition-all duration-700 ${
            phase >= 2 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'
          }`}
        >
          <p
            className="text-xs sm:text-sm font-medium italic max-w-sm mx-auto"
            style={{ color: '#1E3A34' }}
          >
            “Every observation helps protect our groundwater.”
          </p>
        </div>
      </div>

      {/* Bottom Progress Bar & Loading Message */}
      <div className="w-full max-w-md mx-auto px-6 pb-8 sm:pb-12 z-10 flex flex-col items-center">
        {/* Tasteful "Loading your community map…" message */}
        <div className="flex items-center gap-2 mb-3">
          <span className="w-2 h-2 rounded-full bg-[#17B8DB] animate-ping" />
          <span className="text-xs font-semibold tracking-wide" style={{ color: '#0F766E' }}>
            Loading your community map…
          </span>
        </div>

        {/* Smooth 5-second progress bar */}
        <div
          className="w-full h-1.5 rounded-full overflow-hidden shadow-inner"
          style={{ backgroundColor: '#C3EDDC' }}
          role="progressbar"
          aria-valuenow={Math.round(progress)}
          aria-valuemin={0}
          aria-valuemax={100}
        >
          <div
            className="h-full rounded-full transition-all duration-75 ease-linear"
            style={{
              width: `${progress}%`,
              background: 'linear-gradient(90deg, #0F766E 0%, #17B8DB 100%)',
              boxShadow: '0 0 8px rgba(23, 184, 219, 0.5)',
            }}
          />
        </div>

        {/* Academic Community Service Project Footer note */}
        <div className="w-full flex items-center justify-between text-[11px] text-slate-400 mt-2 px-1">
          <span>CSP STUDY 2026</span>
          <span className="font-mono text-[#0F766E] font-medium">JALA-SEVA</span>
        </div>
      </div>
    </div>
  );
}
