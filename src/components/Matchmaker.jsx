import React, { useState, useEffect, useRef } from 'react';
import { MIDNIGHT_ICEBREAKERS } from '../data/profileAssets';

const CAMERA_FILTERS = [
  { id: 'normal', name: 'Original', style: '' },
  { id: 'warm', name: 'Warm Lamp', style: 'sepia(0.2) contrast(1.05) brightness(1.05)' },
  { id: 'midnight', name: 'Midnight Glow', style: 'hue-rotate(330deg) saturate(1.2) contrast(1.1)' },
  { id: 'soft', name: 'Soft Glow', style: 'brightness(1.08) contrast(0.95)' }
];

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
  const [icebreakerIdx, setIcebreakerIdx] = useState(0);
  const [cameraStream, setCameraStream] = useState(null);
  const [selectedFilter, setSelectedFilter] = useState('normal');
  const videoPreviewRef = useRef(null);

  const languages = ['Any', 'English', 'Spanish', 'Hindi', 'French', 'German', 'Portuguese', 'Japanese'];
  const regions = ['Worldwide', 'North America', 'Europe', 'Asia', 'South America', 'Africa', 'Oceania'];

  // Animated dots
  useEffect(() => {
    const interval = setInterval(() => {
      setDots(prev => (prev.length >= 3 ? '' : prev + '.'));
    }, 500);
    return () => clearInterval(interval);
  }, []);

  // Search timer & icebreaker rotation
  useEffect(() => {
    const timer = setInterval(() => {
      setSearchTime(prev => prev + 1);
    }, 1000);

    const icebreakerTimer = setInterval(() => {
      setIcebreakerIdx(prev => (prev + 1) % MIDNIGHT_ICEBREAKERS.length);
    }, 4500);

    return () => {
      clearInterval(timer);
      clearInterval(icebreakerTimer);
    };
  }, []);

  // Pre-warm camera preview during matchmaking
  useEffect(() => {
    let activeStream = null;
    if (chatMode === 'video' && navigator?.mediaDevices?.getUserMedia) {
      navigator.mediaDevices.getUserMedia({ video: { width: 640, height: 480 }, audio: true })
        .then(stream => {
          activeStream = stream;
          setCameraStream(stream);
          if (videoPreviewRef.current) {
            videoPreviewRef.current.srcObject = stream;
          }
        })
        .catch(err => {
          console.debug("Pre-flight camera permission notice:", err.message);
        });
    }

    return () => {
      if (activeStream) {
        activeStream.getTracks().forEach(t => t.stop());
      }
    };
  }, [chatMode]);

  const activeFilterStyle = CAMERA_FILTERS.find(f => f.id === selectedFilter)?.style || '';
  const formatTime = (s) => `${Math.floor(s / 60).toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`;

  return (
    <div className="bg-midnight-canvas text-[#f5ebfc] font-body-md h-screen w-screen overflow-hidden flex flex-col relative noise-overlay selection:bg-mingzy-pink/30">
      
      {/* Ambient Large Blurred Glows */}
      <div className="aurora-glow-top"></div>
      <div className="aurora-glow-coral top-1/3 -right-20"></div>

      {/* TopNav */}
      <header className="relative z-10 w-full px-5 md:px-10 h-[72px] flex justify-between items-center max-w-[1280px] mx-auto shrink-0">
        <div className="flex items-center gap-3 cursor-pointer" onClick={onCancel}>
          <img 
            alt="Mingzy" 
            className="w-8 h-8 rounded-2xl object-cover ring-1 ring-white/10 shadow-[0_0_12px_rgba(255,46,147,0.3)]" 
            src="/images/mingzy-logo.jpg"
          />
          <span className="text-lg font-bold text-white tracking-tight">
            Mingzy
          </span>
        </div>
        
        {/* Status Pill */}
        <div className="hidden md:flex items-center glass-plum px-4 py-2 rounded-full border border-white/[0.08]">
          <div className="w-2 h-2 rounded-full bg-mingzy-pink animate-ping mr-2.5 shadow-[0_0_8px_#FF2E93]"></div>
          <span className="text-[11px] text-white/50 uppercase tracking-widest font-medium">
            Finding Stranger{dots}
          </span>
          <span className="mx-2.5 w-px h-3 bg-white/10"></span>
          <span className="text-[11px] text-white/40 font-mono">{formatTime(searchTime)}</span>
        </div>
        
        <div className="flex items-center gap-2">
          <button 
            onClick={toggleTheme}
            className="w-9 h-9 rounded-xl flex items-center justify-center hover:bg-white/[0.05] transition-all border border-white/[0.06] text-white/40 hover:text-white"
            title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          >
            <span className="material-symbols-outlined text-[18px]">
              {theme === 'dark' ? 'light_mode' : 'dark_mode'}
            </span>
          </button>
          
          <button 
            onClick={onCancel}
            className="w-9 h-9 rounded-xl flex items-center justify-center hover:bg-white/[0.05] transition-all border border-white/[0.06] text-white/40 hover:text-white"
            title="Cancel"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>
      </header>

      {/* Main Content Canvas */}
      <main className="relative z-10 flex-grow flex flex-col items-center justify-center px-5 w-full max-w-[1280px] mx-auto">
        
        {/* Matchmaking Card */}
        <div className="animate-fade-in-scale opacity-0 glass-plum-strong rounded-3xl p-7 md:p-9 w-full max-w-[480px] flex flex-col items-center text-center relative overflow-hidden shadow-plum-floating border border-white/[0.08]">
          
          {/* Glowing Top Accent Line */}
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-mingzy-pink/40 to-transparent"></div>
          
          {/* Animated Radar & Camera Preview Container */}
          <div className="relative w-36 h-36 mb-6 flex items-center justify-center">
            {/* Outer expanding sonar rings */}
            <div className="absolute inset-0 border border-mingzy-pink/20 rounded-full animate-pulse-halo"></div>
            <div className="absolute inset-[-10px] border border-mingzy-orchid/15 rounded-full animate-pulse-halo" style={{ animationDelay: '-1s' }}></div>
            <div className="absolute inset-[-20px] border border-mingzy-violet/10 rounded-full animate-pulse-halo" style={{ animationDelay: '-2s' }}></div>
            
            {/* Spinning decorative orbit rings */}
            <svg className="absolute w-[140%] h-[140%] animate-spin-slow pointer-events-none" viewBox="0 0 100 100">
              <circle cx="50" cy="50" fill="none" r="48" stroke="rgba(217, 70, 239, 0.2)" strokeDasharray="3 8" strokeWidth="0.6"></circle>
            </svg>
            
            {/* Center: Live Camera Preview or Radar */}
            <div className="w-24 h-24 rounded-2xl bg-[#12071A] border border-mingzy-pink/30 flex items-center justify-center relative z-10 overflow-hidden shadow-[0_0_24px_rgba(255,46,147,0.25)]">
              {cameraStream ? (
                <video 
                  ref={videoPreviewRef} 
                  autoPlay 
                  playsInline 
                  muted 
                  style={{ filter: activeFilterStyle }}
                  className="w-full h-full object-cover transform -scale-x-100 transition-all duration-300" 
                />
              ) : (
                <div className="flex flex-col items-center justify-center text-mingzy-pink/60">
                  <span className="material-symbols-outlined text-[32px] animate-pulse">radar</span>
                </div>
              )}
            </div>
          </div>

          {/* Quick Camera Mood Filter Selector */}
          {cameraStream && (
            <div className="flex items-center gap-1.5 mb-5 glass-plum px-2.5 py-1 rounded-full border border-white/[0.06]">
              {CAMERA_FILTERS.map(filter => (
                <button
                  key={filter.id}
                  onClick={() => setSelectedFilter(filter.id)}
                  className={`text-[10px] px-2 py-0.5 rounded-full transition-colors ${
                    selectedFilter === filter.id 
                      ? 'bg-mingzy-pink text-white font-semibold shadow-sm' 
                      : 'text-white/40 hover:text-white'
                  }`}
                >
                  {filter.name}
                </button>
              ))}
            </div>
          )}

          <h1 className="text-xl md:text-2xl text-white mb-2 font-bold tracking-tight">
            Someone new is connecting{dots}
          </h1>
          
          {/* Icebreaker Prompt Roulette */}
          <div className="glass-plum px-4 py-2.5 rounded-2xl mb-5 w-full border border-white/[0.06] flex items-center justify-between gap-2.5">
            <span className="text-sm">💭</span>
            <p className="text-xs text-white/70 italic leading-relaxed text-left flex-1">
              "{MIDNIGHT_ICEBREAKERS[icebreakerIdx]}"
            </p>
            <button 
              onClick={() => setIcebreakerIdx(prev => (prev + 1) % MIDNIGHT_ICEBREAKERS.length)}
              className="text-white/40 hover:text-mingzy-pink transition-colors p-1"
              title="Next Icebreaker"
            >
              ↻
            </button>
          </div>

          {/* Preferences Section */}
          <div className="w-full border-t border-white/[0.05] pt-4 flex flex-col gap-1.5">
            
            <div className="flex justify-between items-center py-1.5 px-3 rounded-xl hover:bg-white/[0.02] transition-colors relative">
              <span className="text-xs text-white/35 uppercase tracking-wider font-medium">Language</span>
              <div className="relative">
                <button 
                  onClick={() => { setLangMenuOpen(!langMenuOpen); setRegionMenuOpen(false); }}
                  className="text-xs text-white/80 hover:text-white flex items-center gap-1 transition-colors focus:outline-none font-medium"
                >
                  {preferences.language}
                  <span className="material-symbols-outlined text-[14px] text-white/30">expand_more</span>
                </button>
                {langMenuOpen && (
                  <div className="absolute right-0 bottom-8 z-50 glass-plum-strong rounded-xl py-1.5 shadow-2xl min-w-[140px] border border-white/10 animate-fade-in-scale">
                    {languages.map(lang => (
                      <button
                        key={lang}
                        onClick={() => { onPreferenceChange('language', lang); setLangMenuOpen(false); }}
                        className={`w-full text-left px-3.5 py-2 text-xs hover:bg-white/[0.05] transition-colors flex items-center justify-between ${preferences.language === lang ? 'text-mingzy-pink font-semibold' : 'text-white/60'}`}
                      >
                        {lang}
                        {preferences.language === lang && <span className="material-symbols-outlined text-[14px] text-mingzy-pink">check</span>}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-between items-center py-1.5 px-3 rounded-xl hover:bg-white/[0.02] transition-colors relative">
              <span className="text-xs text-white/35 uppercase tracking-wider font-medium">Region</span>
              <div className="relative">
                <button 
                  onClick={() => { setRegionMenuOpen(!regionMenuOpen); setLangMenuOpen(false); }}
                  className="text-xs text-white/80 hover:text-white flex items-center gap-1 transition-colors focus:outline-none font-medium"
                >
                  {preferences.region}
                  <span className="material-symbols-outlined text-[14px] text-white/30">expand_more</span>
                </button>
                {regionMenuOpen && (
                  <div className="absolute right-0 bottom-8 z-50 glass-plum-strong rounded-xl py-1.5 shadow-2xl min-w-[160px] border border-white/10 animate-fade-in-scale">
                    {regions.map(reg => (
                      <button
                        key={reg}
                        onClick={() => { onPreferenceChange('region', reg); setRegionMenuOpen(false); }}
                        className={`w-full text-left px-3.5 py-2 text-xs hover:bg-white/[0.05] transition-colors flex items-center justify-between ${preferences.region === reg ? 'text-mingzy-pink font-semibold' : 'text-white/60'}`}
                      >
                        {reg}
                        {preferences.region === reg && <span className="material-symbols-outlined text-[14px] text-mingzy-pink">check</span>}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-between items-center py-1.5 px-3 rounded-xl hover:bg-white/[0.02] transition-colors relative">
              <span className="text-xs text-white/35 uppercase tracking-wider font-medium">Vibe</span>
              <span className="text-xs text-mingzy-pink font-semibold flex items-center gap-1">
                {preferences.vibe || 'All Vibes'}
              </span>
            </div>

            <div className="flex justify-between items-center py-1.5 px-3 rounded-xl">
              <span className="text-xs text-white/35 uppercase tracking-wider font-medium">Mode</span>
              <span className="text-xs text-mingzy-orchid font-semibold uppercase tracking-wider">
                {chatMode === 'video' ? '📹 HD Video' : '💬 Text Chat'}
              </span>
            </div>

          </div>

          {/* Cancel Button */}
          <div className="w-full mt-5">
            <button 
              onClick={onCancel}
              className="btn-mingzy-ghost w-full py-2.5 rounded-full text-xs font-medium text-white/60 hover:text-white"
            >
              Cancel Search
            </button>
          </div>

        </div>

      </main>

      {/* Footer */}
      <footer className="relative z-10 w-full px-5 md:px-10 py-4 flex flex-col sm:flex-row justify-between items-center max-w-[1280px] mx-auto shrink-0 border-t border-white/[0.03] text-xs text-white/30">
        <div className="flex items-center gap-4 mb-2 sm:mb-0">
          <span>Finding compatible match</span>
          <span className="w-1 h-1 rounded-full bg-white/20"></span>
          <span>Live Video Stream</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="material-symbols-outlined text-[14px] text-mingzy-pink">favorite</span>
          <span>Keep conversations respectful and spontaneous</span>
        </div>
      </footer>
    </div>
  );
}
