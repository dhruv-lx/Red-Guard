import './index.css';

import { navigateTo, requestExpandedMode } from '@devvit/web/client';
import { StrictMode, useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';

const ShieldIcon = () => (
  <svg className="w-8 h-8 text-white drop-shadow-md" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    <path d="M9 12l2 2 4-4" />
  </svg>
);

const RadioTowerIcon = () => (
  <svg className="w-4 h-4 text-emerald-400 animate-pulse" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4.9 19.1C1 15.2 1 8.8 4.9 4.9" />
    <path d="M7.8 16.2c-2.3-2.3-2.3-6.1 0-8.5" />
    <circle cx="12" cy="12" r="2" />
    <path d="M16.2 7.8c2.3 2.3 2.3 6.1 0 8.5" />
    <path d="M19.1 4.9C23 8.8 23 15.2 19.1 19.1" />
  </svg>
);

const liveIncidents = [
  { user: 'u/NovaScam', type: 'Phishing Crypto Drop', risk: '96% CRITICAL', action: 'Auto-Quarantined' },
  { user: 'u/VenomReply', type: 'Targeted Harassment', risk: '93% HIGH', action: 'Shadow-Flagged' },
  { user: 'u/SpamOrbit', type: 'Bot Army Influx', risk: '89% HIGH', action: 'Rate-Limited' },
  { user: 'u/MalicePixel', type: 'Doxxing Threat Vector', risk: '95% SEVERE', action: 'Escalated to Mods' },
];

export const Splash = () => {
  const [activeIncidentIndex, setActiveIncidentIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setActiveIncidentIndex((prev) => (prev + 1) % liveIncidents.length);
    }, 3200);
    return () => clearInterval(timer);
  }, []);

  const currentIncident = liveIncidents[activeIncidentIndex];

  return (
    <div className="relative min-h-screen bg-[#07090e] text-slate-100 flex flex-col items-center justify-between p-6 sm:p-8 overflow-hidden select-none">
      {/* Ambient background glows */}
      <div className="absolute -top-24 -left-24 w-96 h-96 bg-gradient-to-br from-[#ff4500]/25 via-red-600/15 to-transparent rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-28 -right-20 w-96 h-96 bg-gradient-to-tl from-purple-600/20 via-indigo-600/10 to-transparent rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-xl h-64 bg-radial from-orange-500/10 to-transparent blur-2xl pointer-events-none" />

      {/* Top Status Bar */}
      <div className="w-full max-w-xl flex items-center justify-between gap-3 text-xs z-10">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-900/90 border border-slate-700/60 shadow-lg backdrop-blur-md">
          <RadioTowerIcon />
          <span className="font-semibold text-emerald-400 tracking-wide">AI SENTINEL ONLINE</span>
          <span className="text-slate-500">•</span>
          <span className="text-slate-300">r/Community Protected</span>
        </div>
        <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-orange-950/40 border border-orange-500/30 text-orange-400 font-semibold text-[11px] tracking-wider uppercase">
          Devvit 2.0 Hackathon
        </div>
      </div>

      {/* Hero Section */}
      <div className="w-full max-w-xl flex flex-col items-center text-center my-auto py-4 z-10">
        {/* Animated Icon Avatar */}
        <div className="relative mb-5 group cursor-pointer">
          <div className="absolute -inset-2 bg-gradient-to-r from-[#ff4500] via-red-500 to-purple-600 rounded-3xl blur-lg opacity-60 group-hover:opacity-90 transition duration-500 animate-pulse" />
          <div className="relative flex items-center justify-center w-20 h-20 rounded-3xl bg-gradient-to-br from-[#ff4500] via-[#e03a00] to-[#b91c1c] shadow-2xl border border-white/20 transform group-hover:scale-105 transition-transform duration-300">
            <ShieldIcon />
          </div>
        </div>

        {/* Title & Tagline */}
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight bg-gradient-to-r from-orange-400 via-rose-300 to-purple-300 bg-clip-text text-transparent">
          Red-Guard
        </h1>
        <p className="text-sm sm:text-base text-slate-300 max-w-md mt-2 font-medium leading-relaxed">
          Autonomous Reddit Moderation Assistant & Real-Time Threat Radar
        </p>

        {/* Quick Metrics Strip */}
        <div className="grid grid-cols-3 gap-3 w-full my-6">
          <div className="p-3 rounded-2xl bg-slate-900/80 border border-slate-800/80 shadow-md backdrop-blur-sm flex flex-col items-center">
            <span className="text-xl sm:text-2xl font-black text-white tracking-tight">18+</span>
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mt-0.5">Triage Queue</span>
          </div>
          <div className="p-3 rounded-2xl bg-slate-900/80 border border-slate-800/80 shadow-md backdrop-blur-sm flex flex-col items-center">
            <span className="text-xl sm:text-2xl font-black text-emerald-400 tracking-tight">98.4%</span>
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mt-0.5">AI Precision</span>
          </div>
          <div className="p-3 rounded-2xl bg-slate-900/80 border border-slate-800/80 shadow-md backdrop-blur-sm flex flex-col items-center">
            <span className="text-xl sm:text-2xl font-black text-orange-400 tracking-tight">&lt; 1.5s</span>
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mt-0.5">Decision Latency</span>
          </div>
        </div>

        {/* Live Intercept Radar Box */}
        <div className="w-full p-4 rounded-2xl bg-gradient-to-r from-slate-900/90 via-slate-900/70 to-slate-900/90 border border-slate-800 shadow-xl backdrop-blur-md mb-6 text-left">
          <div className="flex items-center justify-between text-[11px] font-bold text-slate-400 tracking-wider uppercase mb-2">
            <span className="flex items-center gap-1.5 text-orange-400">
              <span className="w-2 h-2 rounded-full bg-orange-500 animate-ping" />
              Live Subreddit Radar Stream
            </span>
            <span className="text-slate-500 font-mono">LIVE FEED</span>
          </div>
          {currentIncident && (
            <div className="flex items-center justify-between gap-3 text-sm">
              <div className="min-w-0">
                <span className="font-bold text-white font-mono">{currentIncident.user}</span>
                <span className="mx-2 text-slate-600">•</span>
                <span className="text-slate-300 text-xs">{currentIncident.type}</span>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-red-950/80 text-red-400 border border-red-800/50">
                  {currentIncident.risk}
                </span>
                <span className="hidden sm:inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-emerald-300 border border-slate-700">
                  {currentIncident.action}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Big Launch CTA Button */}
        <button
          className="group relative w-full sm:w-auto inline-flex items-center justify-center gap-3 px-8 py-4 rounded-2xl bg-gradient-to-r from-[#ff4500] via-red-500 to-[#e11d48] text-white font-bold text-base shadow-xl shadow-orange-600/30 hover:shadow-orange-600/50 cursor-pointer transition-all duration-300 transform hover:-translate-y-0.5 active:translate-y-0 active:scale-98"
          onClick={(e) => requestExpandedMode(e.nativeEvent, 'game')}
        >
          <span className="tracking-wide">Launch Moderator Command Center</span>
          <svg className="w-5 h-5 transform group-hover:translate-x-1 transition-transform" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
        </button>
        <p className="text-xs text-slate-500 mt-3">Full-screen triage queue, AI summary engine, and live one-click actions</p>
      </div>

      {/* Footer */}
      <footer className="w-full max-w-xl flex items-center justify-between text-xs text-slate-500 pt-4 border-t border-slate-800/60 z-10">
        <span className="font-medium text-slate-400">DeepSeek AI + Devvit Webview</span>
        <div className="flex gap-4">
          <button className="cursor-pointer hover:text-slate-300 transition-colors" onClick={() => navigateTo('https://developers.reddit.com/docs')}>Reddit Dev Docs</button>
          <span>•</span>
          <button className="cursor-pointer hover:text-slate-300 transition-colors" onClick={() => navigateTo('https://openrouter.ai')}>OpenRouter</button>
        </div>
      </footer>
    </div>
  );
};

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Splash />
  </StrictMode>
);
