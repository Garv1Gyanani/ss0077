import React, { useState, useEffect } from 'react';

export default function Matchmaker({ 
  chatMode, 
  stats, 
  onCancel, 
  onPreferenceChange,
  preferences,
  theme,
  toggleTheme
}) {
  const [langMenuOpen, setLangMenuOpen] = useState(false);
  const [regionMenuOpen, setRegionMenuOpen] = useState(false);
  const [dots, setDots] = useState('');
  const [searchTime, setSearchTime] = useState(0);

  const languages = ['Any', 'English', 'Spanish', 'Hindi', 'French', 'German', 'Portuguese', 'Japanese'];
  const regions = ['Worldwide', 'North America', 'Europe', 'Asia', 'South America', 'Africa', 'Oceania'];

  // Animated dots
  useEffect(() => {
    const interval = setInterval(() => {
      setDots(prev => prev.length >= 3 ? '' : prev + '.');
    }, 500);
    return () => clearInterval(interval);
  }, []);

  // Search timer
  useEffect(() => {
    const timer = setInterval(() => setSearchTime(prev => prev + 1), 1000);
    return () => clearInterval(timer);
  }, []);

  // Pre-warm camera & mic permissions during matchmaking so connection is instantaneous
  useEffect(() => {
    if (chatMode === 'video' && navigator?.mediaDevices?.getUserMedia) {
      navigator.mediaDevices.getUserMedia({ video: true, audio: true })
        .then(stream => {
          // Release initial probe stream tracks cleanly
          stream.getTracks().forEach(t => t.stop());
        })
        .catch(err => {
          console.debug("Pre-flight permission request:", err.message);
        });
    }
  }, [chatMode]);

  const formatTime = (s) => `${Math.floor(s / 60).toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`;

  return (
    <div className="bg-ambient-matchmaker text-on-surface font-body-md h-screen w-screen overflow-hidden flex flex-col relative noise-overlay">
      
      {/* Ambient glow orb behind card */}
      <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full bg-violet-600/[0.05] blur-[100px] pointer-events-none z-0"></div>
      <div className="fixed top-1/3 left-1/4 w-[300px] h-[300px] rounded-full bg-indigo-500/[0.03] blur-[80px] pointer-events-none z-0 animate-float-slow"></div>

      {/* TopNav */}
      <header className="relative z-10 w-full px-5 md:px-10 h-[72px] flex justify-between items-center max-w-[1280px] mx-auto shrink-0">
        <div className="flex items-center gap-3">
          <img 
            alt="Mingzy" 
            className="w-8 h-8 rounded-xl object-cover ring-1 ring-white/10" 
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuDSqhTmsH8QdDGueXPgSZzO2UoBA5BkL3dfgiVDIF5lKy2IRtZKNlulTQnxuhPzg7hZFdBR7zKmhfZ1vbsueu8Gi2YSRDcdtrP0SN_PrUTV_PgJ8vpK4x0yLJ8dznlYjgCZwnxmOTqtYnZORGf-32J9iDRoJUO9wYds33nWC0Ji_ZqOP1JeHry0Q5cGC5YTKkPRMLmVeQkQhbWU25jtIIaH3Mwjh4jtiqtIO3nI5TplQYUqfMZ4Nn-B"
          />
          <span className="text-lg font-bold text-white tracking-tight">
            Mingzy
          </span>
        </div>
        
        {/* Status pill */}
        <div className="hidden md:flex items-center glass-panel px-4 py-2 rounded-full">
          <div className="w-2 h-2 rounded-full bg-violet-400 animate-pulse mr-2.5 shadow-[0_0_8px_rgba(139,92,246,0.5)]"></div>
          <span className="text-[11px] text-white/40 uppercase tracking-[0.15em] font-medium">
            Searching{dots}
          </span>
          <span className="mx-2 w-px h-3 bg-white/10"></span>
          <span className="text-[11px] text-white/30 font-mono">{formatTime(searchTime)}</span>
        </div>
        
        <div className="flex items-center gap-2">
          {/* Theme Toggle Button */}
          <button 
            onClick={toggleTheme}
            className="w-9 h-9 rounded-xl flex items-center justify-center hover:bg-white/5 transition-all duration-200 border border-white/[0.06] text-white/40 hover:text-white"
            title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          >
            <span className="material-symbols-outlined text-[20px]">
              {theme === 'dark' ? 'light_mode' : 'dark_mode'}
            </span>
          </button>
          
          <button 
            onClick={onCancel}
            className="w-9 h-9 rounded-xl flex items-center justify-center hover:bg-white/5 transition-all duration-200 border border-white/[0.06] text-white/40 hover:text-white"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>
      </header>

      {/* Main Content Canvas */}
      <main className="relative z-10 flex-grow flex flex-col items-center justify-center px-5 w-full max-w-[1280px] mx-auto">
        
        {/* Matchmaking Card */}
        <div className="animate-fade-in-scale opacity-0 glass-panel-strong rounded-3xl p-8 md:p-12 w-full max-w-[460px] flex flex-col items-center text-center relative overflow-hidden glow-indigo">
          
          {/* Gradient accent top */}
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-violet-500/30 to-transparent"></div>
          
          {/* Animated Indicator */}
          <div className="relative w-36 h-36 mb-10 flex items-center justify-center">
            {/* Outer expanding rings */}
            <div className="absolute inset-0 border border-violet-500/15 rounded-full animate-pulse-ring"></div>
            <div className="absolute inset-0 border border-violet-400/20 rounded-full animate-pulse-ring" style={{ animationDelay: '-0.8s' }}></div>
            <div className="absolute inset-[-10px] border border-violet-400/10 rounded-full animate-pulse-ring-2" style={{ animationDelay: '-1.5s' }}></div>
            
            {/* Spinning dashed ring */}
            <svg className="absolute w-[130%] h-[130%] animate-spin-slow" viewBox="0 0 100 100">
              <circle cx="50" cy="50" fill="none" r="48" stroke="rgba(139, 92, 246, 0.15)" strokeDasharray="3 6" strokeWidth="0.5"></circle>
            </svg>
            
            {/* Counter-spinning ring */}
            <svg className="absolute w-[115%] h-[115%] animate-spin-reverse" viewBox="0 0 100 100">
              <circle cx="50" cy="50" fill="none" r="48" stroke="rgba(139, 92, 246, 0.08)" strokeDasharray="8 12" strokeWidth="0.5"></circle>
            </svg>
            
            {/* Orbiting dot */}
            <div className="absolute w-full h-full animate-orbit">
              <div className="w-1.5 h-1.5 rounded-full bg-violet-400 shadow-[0_0_8px_rgba(139,92,246,0.6)]"></div>
            </div>
            
            {/* Avatar Placeholder */}
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-[#1a1a2e] to-[#0E0E0E] border border-white/[0.06] flex items-center justify-center relative z-10 overflow-hidden animate-breathing-glow">
              <span className="material-symbols-outlined text-[28px] text-white/20">person_search</span>
            </div>
          </div>

          <h1 className="text-xl md:text-2xl text-white mb-2 font-semibold tracking-tight">
            Finding someone for you{dots}
          </h1>
          <p className="text-sm text-white/30 mb-8 max-w-[280px] leading-relaxed">
            Scanning for the best match from thousands of people online.
          </p>

          {/* Status Line */}
          <div className="flex items-center gap-3 mb-10 glass-panel px-5 py-2.5 rounded-full">
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_6px_rgba(52,211,153,0.5)]"></div>
              <span className="text-[11px] text-white/40 tracking-wide font-medium">
                {(stats.onlineCount || 1).toLocaleString()} online
              </span>
            </div>
            <span className="w-px h-3 bg-white/10"></span>
            <div className="flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[13px] text-white/25">forum</span>
              <span className="text-[11px] text-white/40 tracking-wide font-medium">
                {(stats.activeChats || 0).toLocaleString()} chats
              </span>
            </div>
          </div>

          {/* Preferences Section */}
          <div className="w-full border-t border-white/[0.04] pt-6 flex flex-col gap-1">
            {/* Language */}
            <div className="flex justify-between items-center py-2.5 px-3 rounded-xl hover:bg-white/[0.02] transition-colors relative">
              <span className="text-xs text-white/30 uppercase tracking-wider font-medium">Language</span>
              <div className="relative">
                <button 
                  onClick={() => { setLangMenuOpen(!langMenuOpen); setRegionMenuOpen(false); }}
                  className="text-xs text-white/70 hover:text-white flex items-center gap-1 transition-colors focus:outline-none font-medium"
                >
                  {preferences.language}
                  <span className="material-symbols-outlined text-[14px] text-white/30">expand_more</span>
                </button>
                {langMenuOpen && (
                  <div className="absolute right-0 bottom-8 z-50 glass-panel-strong rounded-xl py-1.5 shadow-2xl min-w-[140px] animate-fade-in-scale opacity-0" style={{ animationDelay: '0ms' }}>
                    {languages.map(lang => (
                      <button
                        key={lang}
                        onClick={() => { onPreferenceChange('language', lang); setLangMenuOpen(false); }}
                        className={`w-full text-left px-3.5 py-2 text-xs hover:bg-white/5 transition-colors flex items-center justify-between ${preferences.language === lang ? 'text-violet-300 font-semibold' : 'text-white/50'}`}
                      >
                        {lang}
                        {preferences.language === lang && <span className="material-symbols-outlined text-[14px] text-violet-400">check</span>}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Region */}
            <div className="flex justify-between items-center py-2.5 px-3 rounded-xl hover:bg-white/[0.02] transition-colors relative">
              <span className="text-xs text-white/30 uppercase tracking-wider font-medium">Region</span>
              <div className="relative">
                <button 
                  onClick={() => { setRegionMenuOpen(!regionMenuOpen); setLangMenuOpen(false); }}
                  className="text-xs text-white/70 hover:text-white flex items-center gap-1 transition-colors focus:outline-none font-medium"
                >
                  {preferences.region}
                  <span className="material-symbols-outlined text-[14px] text-white/30">expand_more</span>
                </button>
                {regionMenuOpen && (
                  <div className="absolute right-0 bottom-8 z-50 glass-panel-strong rounded-xl py-1.5 shadow-2xl min-w-[160px] animate-fade-in-scale opacity-0" style={{ animationDelay: '0ms' }}>
                    {regions.map(reg => (
                      <button
                        key={reg}
                        onClick={() => { onPreferenceChange('region', reg); setRegionMenuOpen(false); }}
                        className={`w-full text-left px-3.5 py-2 text-xs hover:bg-white/5 transition-colors flex items-center justify-between ${preferences.region === reg ? 'text-violet-300 font-semibold' : 'text-white/50'}`}
                      >
                        {reg}
                        {preferences.region === reg && <span className="material-symbols-outlined text-[14px] text-violet-400">check</span>}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Chat Mode */}
            <div className="flex justify-between items-center py-2.5 px-3 rounded-xl">
              <span className="text-xs text-white/30 uppercase tracking-wider font-medium">Mode</span>
              <span className="text-xs text-violet-300 font-semibold uppercase tracking-wider">
                {chatMode === 'video' ? '📹 Video + Text' : '💬 Text Only'}
              </span>
            </div>
          </div>
        </div>

        {/* Cancel Button */}
        <div className="mt-8 animate-fade-in-up opacity-0 delay-300">
          <button 
            onClick={onCancel}
            className="btn-outline h-11 px-8 rounded-xl text-white/60 text-sm font-medium"
          >
            Cancel Search
          </button>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 w-full px-5 md:px-10 py-6 flex flex-col md:flex-row justify-between items-center max-w-[1280px] mx-auto shrink-0 border-t border-white/[0.03]">
        <div className="flex items-center gap-4 text-white/20 text-[11px] mb-3 md:mb-0">
          <div className="flex items-center gap-1.5">
            <span className="material-symbols-outlined text-[14px]">public</span>
            <span>{(stats.onlineCount || 1).toLocaleString()} online</span>
          </div>
          <span className="w-1 h-1 rounded-full bg-white/10"></span>
          <div className="flex items-center gap-1.5">
            <span className="material-symbols-outlined text-[14px]">forum</span>
            <span>{(stats.activeChats || 0).toLocaleString()} chats</span>
          </div>
        </div>
        
        <div className="flex items-center gap-1.5 text-[11px] text-white/20">
          <span className="material-symbols-outlined text-[14px] text-violet-400/40">shield</span>
          <span>Never share personal information.</span>
        </div>
      </footer>
    </div>
  );
}
