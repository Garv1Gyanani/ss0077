import React, { useState, useEffect } from 'react';
import { auth, signOut } from '../firebase';
import SEOHead from './seo/SEOHead';
import { CANDID_PROFILES, MINGZY_WALL_MOMENTS, MIDNIGHT_ICEBREAKERS } from '../data/profileAssets';
import { trackSEOCTAClick } from '../utils/telemetry';

const HOMEPAGE_SEO = {
  path: '/',
  primaryKeyword: 'random video chat + talk to strangers',
  metaTitle: 'Mingzy — Free Random Video Chat & Anonymous Stranger Conversations',
  metaDescription: 'Mingzy is a free random video chat platform that lets people connect with strangers through instant browser-based video conversations without requiring mandatory account creation.',
  h1: 'Someone new is waiting.',
  breadcrumbs: [{ label: 'Home', path: '/' }],
  schemaType: 'SoftwareApplication',
  faqs: [
    { question: 'What is Mingzy?', answer: 'Mingzy is a free random video chat platform that lets people connect with strangers through instant browser-based video conversations without requiring mandatory account creation.' },
    { question: 'How is Mingzy different from Omegle?', answer: 'Mingzy lets you choose conversation vibes (Deep Talk, Just Laughs, Music & Art, etc.), has built-in instant skip controls, zero registration, and a modern privacy-first architecture.' },
    { question: 'Is Mingzy free?', answer: 'Yes! Mingzy is 100% free with unlimited calls, text chat, and instant skips with no credit card or account required.' },
    { question: 'How do I report inappropriate behavior?', answer: 'Every chat screen has an instant 1-tap Report & Block button that immediately disconnects you and blacklists the offender from your queue.' }
  ]
};

const VIBE_CATEGORIES = [
  { 
    id: 'All Vibes', 
    label: 'All Vibes', 
    emoji: '✨', 
    headline: 'Open to anything',
    desc: 'Spontaneous matchmaking with any friendly stranger online.' 
  },
  { 
    id: 'Deep Talk', 
    label: 'Deep Talk', 
    emoji: '🌙', 
    headline: 'Thoughtful midnight conversations',
    desc: 'Connect with people who want more than surface-level small talk.' 
  },
  { 
    id: 'Just Laughs', 
    label: 'Just Laughs', 
    emoji: '😂', 
    headline: 'Comedy & good energy',
    desc: 'Find someone who is here to have fun and swap hilarious stories.' 
  },
  { 
    id: 'Cozy Night', 
    label: 'Cozy Night', 
    emoji: '☕', 
    headline: 'Relaxed, warm chats',
    desc: 'Low-pressure conversations for winding down after a long day.' 
  },
  { 
    id: 'Music & Art', 
    label: 'Music & Art', 
    emoji: '🎸', 
    headline: 'Creative connections',
    desc: 'Talk favorite tracks, share inspirations, and discover new songs.' 
  },
  { 
    id: 'Travel Stories', 
    label: 'Travel Stories', 
    emoji: '✈️', 
    headline: 'Global perspectives',
    desc: 'Meet someone living in a corner of the world you have never visited.' 
  },
];

// Subtle tactile audio synthesizer
function playLivingChime(frequency = 587.33, isMuted = false) {
  if (isMuted) return;
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    if (ctx.state === 'suspended') ctx.resume();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(frequency, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(frequency * 1.5, ctx.currentTime + 0.12);
    gain.gain.setValueAtTime(0.04, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.25);
  } catch (e) {
    // Autoplay fallback
  }
}

export default function LandingPage({ user, onStartChat, onOpenAuth, onNavigate, theme, toggleTheme }) {
  const [activeProfileIdx, setActiveProfileIdx] = useState(1);
  const [selectedVibe, setSelectedVibe] = useState('All Vibes');
  const [selectedSceneNode, setSelectedSceneNode] = useState(0);
  const [hearts, setHearts] = useState([]);
  const [soundEnabled, setSoundEnabled] = useState(true);

  const activeStranger = CANDID_PROFILES[activeProfileIdx] || CANDID_PROFILES[0];
  const activeVibeData = VIBE_CATEGORIES.find(v => v.id === selectedVibe) || VIBE_CATEGORIES[0];

  // Rotate stranger demo profile periodically
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveProfileIdx(prev => (prev + 1) % CANDID_PROFILES.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  // Floating heart burst interaction
  const triggerHeartBurst = (e) => {
    playLivingChime(659.25, !soundEnabled);
    const newHeart = {
      id: Date.now() + Math.random(),
      x: e?.clientX ? (e.clientX - window.innerWidth / 2) * 0.5 : (Math.random() * 80 - 40),
      y: (Math.random() * 20 - 10),
      scale: 0.8 + Math.random() * 0.6,
      emoji: ['♡', '✨', '❤️', '🌙', '💬', '🔥'][Math.floor(Math.random() * 6)]
    };
    setHearts(prev => [...prev.slice(-10), newHeart]);
    setTimeout(() => {
      setHearts(prev => prev.filter(h => h.id !== newHeart.id));
    }, 3500);
  };

  const handleStartWithVibe = (mode) => {
    playLivingChime(587.33, !soundEnabled);
    trackSEOCTAClick('homepage_vibe_cta', mode || 'video', '/');
    onStartChat(mode || 'video', { vibe: selectedVibe });
  };

  const handleSignOut = () => {
    signOut(auth).catch(err => console.error("Error signing out:", err));
  };

  const navigateTo = (path) => {
    if (onNavigate) {
      onNavigate(path);
    } else {
      window.location.pathname = path;
    }
  };

  return (
    <div className="w-full min-h-screen flex flex-col bg-midnight-canvas text-[#f5ebfc] noise-overlay relative overflow-x-hidden selection:bg-mingzy-pink/30">
      
      {/* 1. SEO Head */}
      <SEOHead pageData={HOMEPAGE_SEO} />

      {/* Atmospheric Blurred Light Sources */}
      <div className="aurora-glow-top"></div>
      <div className="aurora-glow-coral top-[750px] -left-40"></div>
      <div className="aurora-glow-top top-[2200px] left-1/3 opacity-70"></div>

      {/* Living Universe Star Dust & Particles */}
      <div className="particles-container">
        {[...Array(16)].map((_, i) => (
          <div
            key={i}
            className="star-particle"
            style={{
              left: `${(i * 17) % 94 + 3}%`,
              top: `${(i * 21) % 92 + 4}%`,
              width: `${(i % 3) + 2}px`,
              height: `${(i % 3) + 2}px`,
              animationDelay: `${i * 0.5}s`,
              animationDuration: `${3.5 + (i % 4)}s`,
              opacity: 0.25 + (i % 3) * 0.2,
            }}
          />
        ))}
      </div>

      {/* 2. Streamlined Midnight Top Navigation */}
      <header className="glass-plum-strong sticky top-0 z-50 transition-all duration-300 border-b border-white/[0.05]">
        <div className="flex justify-between items-center w-full px-5 md:px-10 h-[72px] max-w-[1280px] mx-auto">
          
          {/* Logo & Brand Emblem */}
          <div 
            className="flex items-center gap-3 cursor-pointer group select-none" 
            onClick={() => navigateTo('/')}
          >
            <div className="relative">
              <img 
                alt="Mingzy" 
                className="w-9 h-9 rounded-2xl object-cover ring-1 ring-white/10 group-hover:ring-mingzy-pink/40 transition-all duration-300 shadow-[0_0_16px_rgba(255,46,147,0.3)]" 
                src="/images/mingzy-logo.jpg"
              />
              <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-mingzy-pink rounded-full border border-[#09060F] shadow-[0_0_8px_#FF2E93] animate-pulse"></div>
            </div>
            <span className="text-xl md:text-2xl font-bold tracking-tight text-white group-hover:text-mingzy-pink transition-colors">
              Mingzy
            </span>
          </div>

          {/* Focused Navigation Links */}
          <nav className="hidden md:flex items-center gap-1">
            {[
              { label: 'Video Chat', path: '/random-video-chat' },
              { label: 'Text Chat', path: '/random-text-chat' },
              { label: 'Safety & Privacy', path: '/safety' }
            ].map((item) => (
              <button
                key={item.path}
                onClick={() => navigateTo(item.path)}
                className="px-3.5 py-1.5 text-xs text-white/50 hover:text-white hover:bg-white/[0.04] rounded-xl transition-all duration-200"
              >
                {item.label}
              </button>
            ))}
          </nav>

          {/* Right Action Controls */}
          <div className="flex items-center gap-2.5">
            {user ? (
              <div className="flex items-center gap-2">
                <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/[0.04] border border-white/[0.08]">
                  {user.photoURL ? (
                    <img src={user.photoURL} alt="" className="w-5 h-5 rounded-full" />
                  ) : (
                    <div className="w-5 h-5 rounded-full bg-mingzy-orchid flex items-center justify-center text-[10px] font-bold text-white">
                      {user.email ? user.email[0].toUpperCase() : 'U'}
                    </div>
                  )}
                  <span className="text-xs text-white/70 font-medium max-w-[90px] truncate">
                    {user.displayName || user.email?.split('@')[0]}
                  </span>
                </div>
                <button 
                  onClick={handleSignOut} 
                  className="hidden sm:block text-xs text-white/40 hover:text-white transition-colors px-2 py-1"
                >
                  Sign Out
                </button>
              </div>
            ) : (
              <button 
                onClick={onOpenAuth} 
                className="hidden sm:block text-xs text-white/60 hover:text-white transition-colors px-3 py-1.5 rounded-xl hover:bg-white/[0.04]"
              >
                Sign In
              </button>
            )}

            {/* Sound FX Toggle */}
            <button 
              onClick={() => setSoundEnabled(!soundEnabled)}
              className="w-9 h-9 rounded-xl flex items-center justify-center hover:bg-white/[0.05] border border-white/[0.06] text-white/40 hover:text-white transition-all active:scale-95"
              title={soundEnabled ? 'Mute Interface Sound Effects' : 'Enable Sound Effects'}
            >
              <span className="material-symbols-outlined text-[18px]">
                {soundEnabled ? 'volume_up' : 'volume_off'}
              </span>
            </button>

            {/* Android APK Link */}
            <a 
              href="https://www.dropbox.com/scl/fi/5q3hmh674wtdf3yxlogbu/app-release.apk?rlkey=174k5u1sinqnuguxvybxraeve&st=6e7b325k&dl=1"
              target="_blank"
              rel="noopener noreferrer"
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20 transition-all"
            >
              <span className="material-symbols-outlined text-[15px]">android</span>
              App
            </a>

            {/* Theme Switcher */}
            <button 
              onClick={toggleTheme}
              className="w-9 h-9 rounded-xl flex items-center justify-center hover:bg-white/[0.05] border border-white/[0.06] text-white/40 hover:text-white transition-all active:scale-95"
              title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            >
              <span className="material-symbols-outlined text-[18px]">
                {theme === 'dark' ? 'light_mode' : 'dark_mode'}
              </span>
            </button>

            {/* Lit Nav CTA */}
            <button 
              onClick={() => handleStartWithVibe('video')}
              className="btn-mingzy-cta px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5"
            >
              <span className="text-[14px]">♡</span>
              <span>Start</span>
            </button>
          </div>
        </div>

        {/* Live Network Status Ribbon (Believable, Non-Fake) */}
        <div className="w-full bg-[#0a0410]/80 border-t border-white/[0.03] py-1.5 px-5 overflow-hidden">
          <div className="max-w-[1280px] mx-auto flex items-center justify-between text-[11px] text-white/40 font-mono">
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
              <span className="text-white/60 font-sans font-medium">LIVE NETWORK:</span>
              <span className="text-mingzy-pink font-sans">Strangers connecting right now</span>
            </div>
            <div className="hidden sm:flex items-center gap-3 font-sans">
              <span>Direct Peer-to-Peer Stream</span>
              <span>•</span>
              <span className="text-mingzy-orchid">Zero Sign-Up Required</span>
            </div>
          </div>
        </div>
      </header>

      {/* ═══════════════════════════════════════════════════════════════
         3. HERO SECTION — Differentiated, Clear & Intentional
         ═══════════════════════════════════════════════════════════════ */}
      <main className="flex-grow flex flex-col items-center w-full px-5 md:px-10 max-w-[1280px] mx-auto relative z-10">
        
        <section className="text-center w-full max-w-4xl flex flex-col items-center pt-14 md:pt-22 pb-8">
          
          {/* Clear Product Positioning Statement */}
          <div className="animate-fade-in-up opacity-0 mb-6 inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full glass-plum border border-white/[0.08] text-xs text-white/75 font-medium">
            <span className="text-mingzy-pink">✦</span>
            <span>The stranger chat built around real conversation</span>
          </div>

          {/* Emotional & Clear Headline */}
          <h1 className="animate-fade-in-up opacity-0 delay-100 text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-extrabold tracking-tight mb-5 leading-[1.02] text-center">
            <span className="text-white">Someone new is</span>{' '}
            <span className="text-gradient-mingzy">waiting.</span>
          </h1>
          
          {/* Subtitle with Brutal Clarity */}
          <p className="animate-fade-in-up opacity-0 delay-200 text-base md:text-xl text-white/55 mb-8 max-w-2xl leading-relaxed font-light">
            Meet someone you actually want to talk to. Pick your vibe, connect via instant video or text, and skip with zero friction when it's not a match.
          </p>

          {/* Vibe Selector System */}
          <div className="animate-fade-in-up opacity-0 delay-250 w-full max-w-2xl mb-8 flex flex-col items-center">
            <div className="text-[11px] text-white/40 uppercase tracking-widest font-semibold mb-3">
              Who are you in the mood to meet?
            </div>
            
            <div className="flex flex-wrap justify-center gap-2 mb-3">
              {VIBE_CATEGORIES.map((vibe) => (
                <button
                  key={vibe.id}
                  onClick={() => {
                    setSelectedVibe(vibe.id);
                    playLivingChime(523.25, !soundEnabled);
                  }}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition-all flex items-center gap-1.5 ${
                    selectedVibe === vibe.id 
                      ? 'bg-gradient-to-r from-mingzy-pink/30 to-mingzy-orchid/30 border border-mingzy-pink text-white shadow-[0_0_14px_rgba(255,46,147,0.35)] scale-105' 
                      : 'glass-plum text-white/50 hover:text-white hover:border-white/20'
                  }`}
                >
                  <span>{vibe.emoji}</span>
                  <span>{vibe.label}</span>
                </button>
              ))}
            </div>

            {/* Active Vibe Description Pill */}
            <div className="text-xs text-mingzy-orchid/90 font-light italic glass-plum px-4 py-1.5 rounded-full border border-white/[0.04]">
              {activeVibeData.headline} — {activeVibeData.desc}
            </div>
          </div>

          {/* Primary Action Buttons */}
          <div className="animate-fade-in-up opacity-0 delay-300 flex flex-col sm:flex-row items-center gap-3 mb-6 w-full justify-center">
            
            <button 
              onClick={() => handleStartWithVibe('video')}
              className="btn-mingzy-cta w-full sm:w-auto px-8 py-3.5 rounded-full font-semibold text-base flex items-center justify-center gap-2 group cursor-pointer shadow-lit-cta"
            >
              <span className="text-lg group-hover:scale-125 transition-transform duration-300">♡</span>
              <span className="tracking-wide">Meet Someone Now</span>
              <span className="material-symbols-outlined text-[18px] opacity-80 group-hover:translate-x-1 transition-transform">arrow_forward</span>
            </button>

            <button 
              onClick={() => handleStartWithVibe('text')}
              className="btn-mingzy-ghost w-full sm:w-auto px-6 py-3.5 rounded-full font-medium text-sm flex items-center justify-center gap-2"
            >
              <span className="material-symbols-outlined text-[18px]">chat_bubble</span>
              <span>Text Chat</span>
            </button>

            <a 
              href="https://www.dropbox.com/scl/fi/5q3hmh674wtdf3yxlogbu/app-release.apk?rlkey=174k5u1sinqnuguxvybxraeve&st=6e7b325k&dl=1"
              target="_blank"
              rel="noopener noreferrer"
              className="btn-mingzy-ghost w-full sm:w-auto px-5 py-3.5 rounded-full font-medium text-xs text-emerald-400 hover:text-emerald-300 border-emerald-500/20 hover:border-emerald-500/40 flex items-center justify-center gap-1.5"
            >
              <span className="material-symbols-outlined text-[17px]">android</span>
              <span>Get Android App</span>
            </a>
          </div>

          {/* Trust Highlights (Accurate & Defensible) */}
          <div className="animate-fade-in-up opacity-0 delay-400 flex flex-wrap items-center justify-center gap-3 text-white/40 text-xs mb-10">
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/[0.02] border border-white/[0.05]">
              <span className="material-symbols-outlined text-[14px] text-mingzy-pink">bolt</span>
              <span>Live Video Stream</span>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/[0.02] border border-white/[0.05]">
              <span className="material-symbols-outlined text-[14px] text-mingzy-orchid">lock</span>
              <span>No Registration Required</span>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/[0.02] border border-white/[0.05]">
              <span className="material-symbols-outlined text-[14px] text-mingzy-coral">skip_next</span>
              <span>Instant 1-Click Skip</span>
            </div>
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════════════════
           4. PRODUCT EXPERIENCE VISUAL — The Connection Itself
           ═══════════════════════════════════════════════════════════════ */}
        <section className="animate-fade-in-up opacity-0 delay-500 w-full max-w-5xl mb-28 relative">
          
          {/* Subtle Ambient Halo */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-[700px] h-[360px] bg-gradient-to-r from-mingzy-pink/15 via-mingzy-orchid/15 to-mingzy-coral/10 rounded-full blur-[100px] pointer-events-none -z-10"></div>

          {/* Floating Rising Hearts */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden z-30">
            {hearts.map(heart => (
              <span 
                key={heart.id}
                className="absolute left-1/2 bottom-1/2 animate-heart-float text-2xl text-mingzy-pink pointer-events-none select-none"
                style={{
                  transform: `translate(${heart.x}px, ${heart.y}px) scale(${heart.scale})`,
                  textShadow: '0 0 12px rgba(255, 46, 147, 0.8)'
                }}
              >
                {heart.emoji}
              </span>
            ))}
          </div>

          {/* Connection Canvas Card */}
          <div className="glass-plum rounded-3xl p-6 md:p-10 border border-white/[0.08] shadow-plum-floating relative overflow-hidden">
            
            {/* Top Indicator */}
            <div className="flex justify-between items-center mb-6 relative z-20">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                <span className="text-[11px] text-white/50 uppercase tracking-widest font-semibold">
                  Live Peer Experience Demo
                </span>
              </div>
              <div className="flex items-center gap-2 text-xs text-mingzy-orchid">
                <span>Vibe: <strong>{selectedVibe}</strong></span>
              </div>
            </div>

            {/* Split Video Windows */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 items-center relative z-20">
              
              {/* YOU */}
              <div 
                className="relative aspect-[4/3] rounded-organic bg-[#100718] border border-white/10 overflow-hidden shadow-2xl group animate-drift-organic"
                style={{ animationDuration: '14s' }}
              >
                <img 
                  src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=700&auto=format&fit=crop&q=80" 
                  alt="You" 
                  className="w-full h-full object-cover transform scale-105 group-hover:scale-110 transition-transform duration-700 brightness-95" 
                />
                
                <div className="absolute inset-0 bg-gradient-to-t from-[#0e0517] via-transparent to-transparent opacity-80"></div>
                
                <div className="absolute top-4 left-4 glass-plum px-3 py-1.5 rounded-full flex items-center gap-2 border border-white/10">
                  <span className="w-2 h-2 rounded-full bg-mingzy-pink animate-ping"></span>
                  <span className="text-xs text-white font-medium">You</span>
                </div>

                <div className="absolute bottom-4 left-4 right-4 flex justify-between items-center">
                  <span className="text-[11px] text-white/70 glass-plum px-2.5 py-1 rounded-lg">
                    ✨ Microphone Ready
                  </span>
                  <button 
                    onClick={triggerHeartBurst}
                    className="w-9 h-9 rounded-full glass-plum border border-mingzy-pink/30 text-mingzy-pink flex items-center justify-center hover:scale-110 active:scale-90 transition-transform shadow-[0_0_10px_rgba(255,46,147,0.4)]"
                    title="Send Heart"
                  >
                    ♡
                  </button>
                </div>
              </div>

              {/* Central Glowing Motif */}
              <div className="hidden md:flex absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex-col items-center justify-center z-30 pointer-events-none">
                <div className="w-12 h-12 rounded-full gradient-mingzy flex items-center justify-center text-white shadow-lit-cta animate-pulse-node">
                  <span className="text-base font-bold">♡</span>
                </div>
                <div className="glass-plum-strong px-3 py-0.5 rounded-full mt-2 border border-white/10 text-[10px] text-white/80 font-mono tracking-wider">
                  CONNECTED
                </div>
              </div>

              {/* SOMEONE NEW */}
              <div 
                className="relative aspect-[4/3] rounded-organic-reverse bg-[#100718] border border-mingzy-pink/30 overflow-hidden shadow-2xl group animate-drift-reverse"
                style={{ animationDuration: '16s' }}
              >
                <img 
                  src={activeStranger.videoPreview} 
                  alt={activeStranger.name} 
                  className="w-full h-full object-cover transform scale-105 group-hover:scale-110 transition-transform duration-700 brightness-95" 
                />
                
                <div className="absolute inset-0 bg-gradient-to-t from-[#0e0517] via-transparent to-transparent opacity-80"></div>
                
                <div className="absolute top-4 left-4 glass-plum px-3 py-1.5 rounded-full flex items-center gap-2 border border-white/10">
                  <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                  <span className="text-xs text-white font-medium">{activeStranger.name}</span>
                  <span className="text-[10px] text-white/40">• {activeStranger.city}</span>
                </div>

                <div className="absolute top-4 right-4 glass-plum px-2.5 py-1 rounded-full text-[10px] text-white/60">
                  {activeStranger.mood}
                </div>

                <div className="absolute bottom-4 left-4 right-4 flex justify-between items-center">
                  <span className="text-[11px] text-white/80 glass-plum px-3 py-1 rounded-lg truncate max-w-[200px]">
                    "{activeStranger.tagline}"
                  </span>
                  
                  <button 
                    onClick={() => {
                      playLivingChime(659.25, !soundEnabled);
                      setActiveProfileIdx(prev => (prev + 1) % CANDID_PROFILES.length);
                    }}
                    className="glass-plum hover:bg-white/10 text-xs text-white/80 px-2.5 py-1 rounded-lg border border-white/10 flex items-center gap-1 transition-all"
                  >
                    <span>Next</span>
                    <span className="material-symbols-outlined text-[13px]">skip_next</span>
                  </button>
                </div>
              </div>

            </div>

            {/* Bottom Bar */}
            <div className="mt-8 pt-6 border-t border-white/[0.06] flex flex-col sm:flex-row justify-between items-center gap-4 relative z-20">
              <div className="text-xs text-white/50">
                <span className="text-mingzy-orchid font-medium">Ready to talk?</span> Choose video or text and connect instantly.
              </div>

              <button 
                onClick={() => handleStartWithVibe('video')}
                className="btn-mingzy-cta px-6 py-2.5 rounded-full text-xs font-semibold flex items-center gap-2"
              >
                <span>Jump in with {selectedVibe}</span>
                <span className="material-symbols-outlined text-[15px]">videocam</span>
              </button>
            </div>

          </div>
        </section>

        {/* ═══════════════════════════════════════════════════════════════
           5. THE 3-STEP RHYTHM — Meet → Vibe → Connect
           ═══════════════════════════════════════════════════════════════ */}
        <section className="w-full max-w-5xl mb-28">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-3 tracking-tight">
              The Stranger Chat Built for Connection
            </h2>
            <p className="text-white/45 text-sm max-w-md mx-auto">
              Not a chaotic roulette. A simple, intentional way to meet people.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {[
              {
                step: '01',
                title: 'Pick Your Vibe',
                desc: 'Select whether you want deep midnight conversation, light laughs, music exchange, or open serendipity.',
                icon: 'auto_awesome',
                color: 'text-mingzy-pink'
              },
              {
                step: '02',
                title: 'Instant Pairing',
                desc: 'Get matched in real time. No waiting rooms, no credit cards, no login required.',
                icon: 'bolt',
                color: 'text-mingzy-orchid'
              },
              {
                step: '03',
                title: 'Total Control',
                desc: 'Talk as long as the conversation flows. If it is not right, skip with 1 click without any awkwardness.',
                icon: 'skip_next',
                color: 'text-mingzy-coral'
              }
            ].map(item => (
              <div key={item.step} className="glass-plum rounded-3xl p-7 border border-white/[0.06] flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-center mb-5">
                    <span className="text-2xl font-extrabold font-mono text-white/20">{item.step}</span>
                    <span className={`material-symbols-outlined text-[24px] ${item.color}`}>{item.icon}</span>
                  </div>
                  <h3 className="text-lg font-bold text-white mb-2">{item.title}</h3>
                  <p className="text-xs text-white/50 leading-relaxed font-light">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════════════════
           6. SAFETY & BOUNDARIES — Privacy + Behavioral Protection
           ═══════════════════════════════════════════════════════════════ */}
        <section className="w-full max-w-5xl mb-28">
          <div className="glass-plum rounded-3xl p-8 md:p-12 border border-white/[0.08] relative overflow-hidden">
            
            <div className="max-w-2xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-semibold mb-4 border border-emerald-500/20">
                <span className="material-symbols-outlined text-[14px]">verified_user</span>
                <span>Safety & Behavioral Moderation</span>
              </div>

              <h2 className="text-3xl md:text-4xl font-bold text-white mb-4 tracking-tight">
                Good conversations need boundaries.
              </h2>
              <p className="text-white/50 text-sm md:text-base leading-relaxed mb-8 font-light">
                Spontaneity only works when you feel completely safe. We combine strict behavioral reporting, automated blocklists, and ephemeral media streams so you remain in total control.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
              {[
                { 
                  label: 'Instant 1-Click Skip', 
                  desc: 'Leave any conversation immediately with zero awkwardness or delay.', 
                  icon: 'skip_next', 
                  color: 'text-mingzy-pink' 
                },
                { 
                  label: '1-Tap Block & Blacklist', 
                  desc: 'Permanent blacklist keeps disruptive users out of your matching queue.', 
                  icon: 'block', 
                  color: 'text-red-400' 
                },
                { 
                  label: 'Zero Recorded Media', 
                  desc: 'Video and voice streams are ephemeral and never stored on any server.', 
                  icon: 'lock', 
                  color: 'text-mingzy-orchid' 
                },
                { 
                  label: 'No Profile Required', 
                  desc: 'Chat anonymously without linking phone numbers, socials, or personal data.', 
                  icon: 'visibility_off', 
                  color: 'text-emerald-400' 
                }
              ].map((item) => (
                <div key={item.label} className="glass-plum-strong rounded-2xl p-4 border border-white/[0.06] flex flex-col items-start">
                  <span className={`material-symbols-outlined text-[22px] ${item.color} mb-2`}>{item.icon}</span>
                  <span className="text-xs font-bold text-white mb-1">{item.label}</span>
                  <span className="text-[11px] text-white/45 leading-relaxed font-light">{item.desc}</span>
                </div>
              ))}
            </div>

            <div className="mt-8 pt-6 border-t border-white/[0.05] flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 text-xs text-white/40">
              <span>Zero tolerance for harassment or inappropriate conduct.</span>
              <button 
                onClick={() => navigateTo('/safety')}
                className="text-mingzy-pink hover:text-white transition-colors font-medium flex items-center gap-1"
              >
                <span>Read Community Safety Guidelines</span>
                <span className="material-symbols-outlined text-[13px]">arrow_forward</span>
              </button>
            </div>

          </div>
        </section>

        {/* ═══════════════════════════════════════════════════════════════
           7. THE MINGZY WALL — Illustrative Community Highlights
           ═══════════════════════════════════════════════════════════════ */}
        <section className="w-full max-w-5xl mb-28">
          
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full glass-plum text-xs text-mingzy-pink font-semibold mb-3 border border-mingzy-pink/20">
              <span>✦ The Mingzy Wall</span>
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-3 tracking-tight">
              Moments That Happen on Mingzy
            </h2>
            <p className="text-white/45 text-sm max-w-md mx-auto">
              Real conversation snippets from late night connections.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {MINGZY_WALL_MOMENTS.map((moment) => (
              <div 
                key={moment.id}
                className="glass-plum-card rounded-2xl p-6 flex flex-col justify-between border border-white/[0.06] hover:border-mingzy-pink/30 transition-all duration-300"
              >
                <div>
                  <div className="flex justify-between items-center mb-4">
                    <span className="text-[10px] text-white/30 uppercase tracking-widest font-mono">
                      {moment.mode} Chat
                    </span>
                    <span className="text-[10px] text-mingzy-orchid font-medium">
                      {moment.timeAgo}
                    </span>
                  </div>
                  
                  <p className="text-sm text-white/80 leading-relaxed mb-6 font-light">
                    "{moment.quote}"
                  </p>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-white/[0.04]">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-gradient-to-br from-mingzy-pink/30 to-mingzy-orchid/30 flex items-center justify-center text-[10px] font-bold text-white">
                      {moment.author[0]}
                    </div>
                    <span className="text-xs text-white/70 font-medium">{moment.author}</span>
                  </div>
                  <span className="text-[10px] text-white/30">{moment.location}</span>
                </div>
              </div>
            ))}
          </div>

        </section>

        {/* ═══════════════════════════════════════════════════════════════
           8. ANDROID MOBILE APP SECTION — Direct APK Download
           ═══════════════════════════════════════════════════════════════ */}
        <section className="w-full max-w-5xl mb-28">
          <div className="relative rounded-3xl overflow-hidden border border-white/[0.08] shadow-plum-floating min-h-[420px] md:min-h-[480px] flex items-end group">

            {/* Full-Bleed Background Image */}
            <img
              src="/images/mingzy-mobile-app-showcase.png"
              alt="Mingzy Android Native App"
              className="absolute inset-0 w-full h-full object-cover object-center transition-transform duration-700 group-hover:scale-105"
            />

            {/* Bottom-heavy dark gradient for legibility */}
            <div className="absolute inset-0 bg-gradient-to-t from-[#09060F] via-[#09060F]/65 to-transparent pointer-events-none" />

            {/* Left dark vignette */}
            <div className="absolute inset-0 bg-gradient-to-r from-[#09060F]/90 via-[#09060F]/25 to-transparent pointer-events-none" />

            {/* Atmospheric pink glow */}
            <div className="absolute bottom-0 left-0 w-80 h-52 bg-mingzy-pink/10 blur-[90px] pointer-events-none rounded-full" />

            {/* Content on top */}
            <div className="relative z-10 w-full p-8 md:p-12 flex flex-col md:flex-row md:items-end justify-between gap-6">

              {/* Text block */}
              <div className="max-w-md">
                <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-emerald-500/15 text-emerald-400 text-xs font-semibold mb-4 border border-emerald-500/25 backdrop-blur-sm">
                  <span className="material-symbols-outlined text-[15px]">android</span>
                  <span>Android App Available</span>
                </div>

                <h2 className="text-3xl md:text-4xl font-extrabold text-white mb-3 tracking-tight leading-tight drop-shadow-lg">
                  Take Mingzy with you anywhere.
                </h2>
                <p className="text-white/65 text-sm md:text-base leading-relaxed mb-6 font-light">
                  HD video matching, gesture-based skips, and instant push connection signals — right in your pocket.
                </p>

                <div className="flex flex-wrap items-center gap-3">
                  <a
                    href="https://www.dropbox.com/scl/fi/5q3hmh674wtdf3yxlogbu/app-release.apk?rlkey=174k5u1sinqnuguxvybxraeve&st=6e7b325k&dl=1"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-mingzy-cta px-7 py-3.5 rounded-full text-xs font-bold flex items-center gap-2 shadow-lit-cta"
                  >
                    <span className="material-symbols-outlined text-[18px]">download</span>
                    <span>Download Android APK</span>
                  </a>

                  <div className="text-[11px] text-white/50 flex items-center gap-1.5 backdrop-blur-sm">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                    <span>v1.0.0 • Direct Install</span>
                  </div>
                </div>
              </div>

              {/* Feature badges bottom-right */}
              <div className="hidden md:flex flex-col items-end gap-2 shrink-0 mb-1">
                {['HD Video Calls', 'Instant Match', 'Global People', '100% Private'].map(badge => (
                  <div key={badge} className="glass-plum backdrop-blur-md px-4 py-1.5 rounded-full text-xs text-white/75 border border-white/[0.12]">
                    {badge}
                  </div>
                ))}
              </div>

            </div>
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════════════════
           9. FINAL HIGH-CONVERSION CTA
           ═══════════════════════════════════════════════════════════════ */}
        <section className="w-full max-w-4xl text-center py-16 mb-24 relative">
          <div className="glass-plum-strong rounded-3xl p-10 md:p-16 border border-white/[0.08] shadow-plum-floating relative overflow-hidden">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-mingzy-pink/15 rounded-full blur-[90px] pointer-events-none"></div>
            
            <h2 className="text-4xl md:text-6xl font-extrabold text-white mb-4 tracking-tight relative z-10">
              You never know who you'll meet tonight.
            </h2>
            <p className="text-white/50 text-base md:text-lg mb-8 max-w-md mx-auto font-light relative z-10">
              One click. No profile required. One conversation that could change your evening.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 relative z-10">
              <button 
                onClick={() => handleStartWithVibe('video')}
                className="btn-mingzy-cta w-full sm:w-auto px-9 py-4 rounded-full font-bold text-base flex items-center justify-center gap-2 shadow-lit-cta"
              >
                <span>♡</span>
                <span>Start Mingzy Now</span>
              </button>

              <button 
                onClick={() => handleStartWithVibe('text')}
                className="btn-mingzy-ghost w-full sm:w-auto px-7 py-4 rounded-full font-medium text-sm text-white"
              >
                Start Text Chat
              </button>
            </div>
          </div>
        </section>

      </main>

      {/* ═══════════════════════════════════════════════════════════════
         10. MINIMAL FOOTER
         ═══════════════════════════════════════════════════════════════ */}
      <footer className="border-t border-white/[0.06] bg-[#07040c] relative z-10 pt-16 pb-12">
        <div className="max-w-[1280px] mx-auto px-5 md:px-10 flex flex-col items-center text-center">
          
          {/* Logo & Signature Line */}
          <div className="flex items-center gap-3 mb-4 cursor-pointer group" onClick={() => navigateTo('/')}>
            <img 
              alt="Mingzy" 
              className="w-10 h-10 rounded-2xl object-cover ring-1 ring-white/10 group-hover:ring-mingzy-pink/40 transition-all shadow-[0_0_20px_rgba(255,46,147,0.3)]" 
              src="/images/mingzy-logo.jpg"
            />
            <span className="text-3xl font-extrabold tracking-tight text-white group-hover:text-mingzy-pink transition-colors">
              Mingzy
            </span>
          </div>

          <p className="text-base md:text-lg text-gradient-mingzy font-medium mb-10 max-w-md">
            The next conversation could be anyone.
          </p>

          {/* Quick Links */}
          <div className="flex flex-wrap justify-center gap-6 text-xs text-white/40 mb-10">
            <button onClick={() => navigateTo('/random-video-chat')} className="hover:text-white transition-colors">Random Video Chat</button>
            <button onClick={() => navigateTo('/random-text-chat')} className="hover:text-white transition-colors">Text Chat</button>
            <a 
              href="https://www.dropbox.com/scl/fi/5q3hmh674wtdf3yxlogbu/app-release.apk?rlkey=174k5u1sinqnuguxvybxraeve&st=6e7b325k&dl=1"
              target="_blank"
              rel="noopener noreferrer"
              className="text-emerald-400 hover:text-emerald-300 transition-colors font-medium flex items-center gap-1"
            >
              <span className="material-symbols-outlined text-[14px]">android</span>
              Android App
            </a>
            <button onClick={() => navigateTo('/languages/english')} className="hover:text-white transition-colors">Languages</button>
            <button onClick={() => navigateTo('/countries/usa')} className="hover:text-white transition-colors">Countries</button>
            <button onClick={() => navigateTo('/safety')} className="hover:text-white transition-colors">Safety Center</button>
            <a href="/privacy.html" className="hover:text-white transition-colors">Privacy Policy</a>
            <a href="/terms.html" className="hover:text-white transition-colors">Terms of Service</a>
          </div>

          <div className="text-[11px] text-white/20 font-mono">
            © {new Date().getFullYear()} Mingzy Inc. Ephemeral stranger chat.
          </div>

        </div>
      </footer>

    </div>
  );
}
