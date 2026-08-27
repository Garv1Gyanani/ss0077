import React, { useEffect, useRef } from 'react';
import { auth, signOut } from '../firebase';
import SEOHead from './seo/SEOHead';

const HOMEPAGE_SEO = {
  path: '/',
  primaryKeyword: 'random video chat + talk to strangers',
  metaTitle: 'Mingzy – Random Video & Text Chat with Strangers',
  metaDescription: 'Free random video and text chat with real people worldwide. Language matching, region filters, instant skip. Safe, no signup required.',
  h1: 'Talk to Strangers Instantly',
  breadcrumbs: [{ label: 'Home', path: '/' }],
  schemaType: 'SoftwareApplication',
  faqs: [
    { question: 'What is Mingzy?', answer: 'Mingzy is a modern random video and text chat platform where you can instantly connect with strangers worldwide with language and region filters.' },
    { question: 'Is Mingzy free?', answer: 'Yes! Mingzy is 100% free with unlimited calls, text messages, and instant skips.' },
    { question: 'How do I start chatting?', answer: 'Simply select Video Chat or Text Chat above. No registration or software downloads are required.' }
  ]
};

export default function LandingPage({ user, onStartChat, onOpenAuth, onNavigate, theme, toggleTheme }) {
  const heroRef = useRef(null);
  const bentoRef = useRef(null);

  const handleSignOut = () => {
    signOut(auth).catch(err => console.error("Error signing out:", err));
  };

  // Bento card mouse tracking for radial glow
  useEffect(() => {
    const cards = document.querySelectorAll('.bento-card');
    const handleMouseMove = (e) => {
      cards.forEach(card => {
        const rect = card.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        card.style.setProperty('--mouse-x', `${x}px`);
        card.style.setProperty('--mouse-y', `${y}px`);
      });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  const navigateTo = (path) => {
    if (onNavigate) {
      onNavigate(path);
    } else {
      window.location.pathname = path;
    }
  };

  return (
    <div className="w-full min-h-screen flex flex-col bg-ambient-gradient noise-overlay relative overflow-x-hidden text-white">
      
      {/* 1. SEO Head & Structured Data Schema */}
      <SEOHead pageData={HOMEPAGE_SEO} />

      {/* Floating Background Particles & Premium Blobs */}
      <div className="particles-container">
        <div className="glow-blob-1"></div>
        <div className="glow-blob-2"></div>
        {[...Array(6)].map((_, i) => (
          <div
            key={i}
            className="particle"
            style={{
              left: `${15 + i * 14}%`,
              top: `${10 + (i % 3) * 30}%`,
              width: `${2 + (i % 3)}px`,
              height: `${2 + (i % 3)}px`,
              animationDelay: `${i * 2}s`,
              animationDuration: `${10 + i * 3}s`,
              opacity: 0.2 + (i % 3) * 0.1,
            }}
          />
        ))}
      </div>

      {/* TopNavBar */}
      <header className="glass-panel-strong sticky top-0 z-50">
        <div className="flex justify-between items-center w-full px-5 md:px-10 h-[72px] max-w-[1280px] mx-auto">
          <div className="flex items-center gap-3 cursor-pointer group" onClick={() => navigateTo('/')}>
            <div className="relative">
              <img 
                alt="Mingzy Logo" 
                className="w-9 h-9 rounded-xl object-cover ring-1 ring-white/10 group-hover:ring-violet-500/30 transition-all duration-300" 
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuDSqhTmsH8QdDGueXPgSZzO2UoBA5BkL3dfgiVDIF5lKy2IRtZKNlulTQnxuhPzg7hZFdBR7zKmhfZ1vbsueu8Gi2YSRDcdtrP0SN_PrUTV_PgJ8vpK4x0yLJ8dznlYjgCZwnxmOTqtYnZORGf-32J9iDRoJUO9wYds33nWC0Ji_ZqOP1JeHry0Q5cGC5YTKkPRMLmVeQkQhbWU25jtIIaH3Mwjh4jtiqtIO3nI5TplQYUqfMZ4Nn-B"
              />
              <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 rounded-full border-2 border-[#0a0a0a] animate-pulse"></div>
            </div>
            <span className="text-xl md:text-2xl font-bold text-white tracking-tight group-hover:text-violet-200 transition-colors">
              Mingzy
            </span>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-1">
            {[
              { label: 'Video Chat', path: '/random-video-chat' },
              { label: 'Text Chat', path: '/random-text-chat' },
              { label: 'Languages', path: '/languages/english' },
              { label: 'Countries', path: '/countries/usa' },
              { label: 'Alternatives', path: '/alternatives/omegle-alternative' },
              { label: 'Safety', path: '/safety' }
            ].map((item) => (
              <button
                key={item.path}
                onClick={() => navigateTo(item.path)}
                className="px-3.5 py-2 text-xs text-white/50 hover:text-white hover:bg-white/5 rounded-lg transition-all duration-200"
              >
                {item.label}
              </button>
            ))}
          </nav>

          <div className="flex items-center gap-3">
            {user ? (
              <div className="flex items-center gap-3">
                <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10">
                  {user.photoURL ? (
                    <img src={user.photoURL} alt="" className="w-6 h-6 rounded-full" />
                  ) : (
                    <div className="w-6 h-6 rounded-full bg-violet-600 flex items-center justify-center text-[10px] font-bold text-white">
                      {user.email ? user.email[0].toUpperCase() : 'U'}
                    </div>
                  )}
                  <span className="text-xs text-white/60 font-medium max-w-[100px] truncate">
                    {user.displayName || user.email?.split('@')[0]}
                  </span>
                </div>
                <button 
                  onClick={handleSignOut} 
                  className="hidden md:block text-xs text-white/40 hover:text-white transition-colors px-3 py-1.5"
                >
                  Sign Out
                </button>
              </div>
            ) : (
              <button 
                onClick={onOpenAuth} 
                className="hidden md:block text-xs text-white/60 hover:text-white transition-colors px-3 py-1.5"
              >
                Sign In
              </button>
            )}

            {/* Download Android APK Button */}
            <a 
              href="https://www.dropbox.com/scl/fi/5q3hmh674wtdf3yxlogbu/app-release.apk?rlkey=174k5u1sinqnuguxvybxraeve&st=6e7b325k&dl=1"
              target="_blank"
              rel="noopener noreferrer"
              className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20 transition-all mr-1"
            >
              <span className="material-symbols-outlined text-[16px]">android</span>
              Get App
            </a>

            {/* Theme Toggle Button */}
            <button 
              onClick={toggleTheme}
              className="w-9 h-9 rounded-xl flex items-center justify-center hover:bg-white/5 border border-white/[0.06] text-white/40 hover:text-white transition-all active:scale-95 mr-1"
              title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            >
              <span className="material-symbols-outlined text-[20px]">
                {theme === 'dark' ? 'light_mode' : 'dark_mode'}
              </span>
            </button>

            <button 
              onClick={() => onStartChat('video')}
              className="btn-primary px-5 py-2.5 rounded-xl text-xs font-semibold relative z-10"
            >
              <span className="relative z-10 flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[18px]" style={{ fontVariationSettings: "'FILL' 1" }}>videocam</span>
                Start Chat
              </span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-grow flex flex-col items-center w-full px-5 md:px-10 max-w-[1280px] mx-auto relative z-10">
        
        {/* Hero Section */}
        <section className="text-center w-full max-w-3xl flex flex-col items-center pt-20 md:pt-32 pb-8">
          
          {/* Tiny Badge */}
          <div className="animate-fade-in-up opacity-0 mb-8 inline-flex items-center gap-2 px-4 py-1.5 rounded-full glass-panel text-xs text-white/60 font-medium">
            <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse"></div>
            <span>Fast Matching • 100% Free • No Account</span>
          </div>

          <h1 
            ref={heroRef}
            className="animate-fade-in-up opacity-0 delay-100 text-5xl md:text-7xl lg:text-8xl font-extrabold tracking-tight mb-8 leading-[0.95] text-center"
          >
            <span className="text-gradient-hero">Meet Someone</span>
            <br />
            <span className="text-white">New.</span>
          </h1>
          
          <p className="animate-fade-in-up opacity-0 delay-200 text-base md:text-lg text-white/40 mb-12 max-w-lg leading-relaxed font-light">
            Instantly connect with people around the world through anonymous video & text chat. Free, private, available on Web & Android.
          </p>

          <div className="animate-fade-in-up opacity-0 delay-300 flex flex-col sm:flex-row items-center gap-3 mb-6 w-full justify-center">
            <button 
              onClick={() => onStartChat('video')}
              className="btn-primary w-full sm:w-auto px-8 py-4 rounded-2xl font-semibold text-base flex items-center justify-center gap-3 relative z-10"
            >
              <span className="relative z-10 flex items-center gap-3">
                <span className="material-symbols-outlined text-[22px]" style={{ fontVariationSettings: "'FILL' 1" }}>videocam</span>
                Start Video Chat
              </span>
            </button>
            <button 
              onClick={() => onStartChat('text')}
              className="btn-outline w-full sm:w-auto px-8 py-4 rounded-2xl font-semibold text-base text-white flex items-center justify-center gap-3"
            >
              <span className="material-symbols-outlined text-[22px]">chat</span>
              Text Chat
            </button>
            <a 
              href="https://www.dropbox.com/scl/fi/5q3hmh674wtdf3yxlogbu/app-release.apk?rlkey=174k5u1sinqnuguxvybxraeve&st=6e7b325k&dl=1"
              target="_blank"
              rel="noopener noreferrer"
              className="btn-outline w-full sm:w-auto px-6 py-4 rounded-2xl font-semibold text-sm text-emerald-300 border-emerald-500/30 hover:bg-emerald-500/10 flex items-center justify-center gap-2"
            >
              <span className="material-symbols-outlined text-[20px] text-emerald-400">android</span>
              Download APK
            </a>
          </div>

          <div className="animate-fade-in-up opacity-0 delay-400 flex items-center justify-center gap-4 text-white/30 text-xs mb-16">
            <span className="flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[14px]">lock</span>
              Anonymous
            </span>
            <span className="w-1 h-1 rounded-full bg-white/20"></span>
            <span>Free Forever</span>
            <span className="w-1 h-1 rounded-full bg-white/20"></span>
            <span>No Downloads</span>
          </div>
        </section>

        {/* Official Hero Banner */}
        <section 
          onClick={() => onStartChat('video')}
          className="animate-fade-in-up opacity-0 delay-500 w-full relative rounded-3xl overflow-hidden mb-24 max-w-5xl group cursor-pointer border border-white/10 hover:border-violet-500/40 transition-all duration-500 shadow-2xl hover:shadow-violet-600/20"
        >
          {/* Glow behind image */}
          <div className="absolute -inset-4 bg-gradient-to-r from-violet-600/20 via-fuchsia-600/10 to-indigo-600/20 rounded-[2.5rem] blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-700 z-0"></div>
          
          <div className="relative rounded-3xl overflow-hidden bg-[#0A0A0E]">
            <img 
              alt="Mingzy Random Video Chat Banner" 
              className="w-full h-auto object-cover transition-transform duration-700 group-hover:scale-[1.01]" 
              src="/images/mingzy-hero-banner.png"
            />
            {/* Subtle interactive hover highlight */}
            <div className="absolute inset-0 bg-white/[0.02] opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
          </div>
        </section>

        {/* Visual App Showcase Cards */}
        <section className="w-full max-w-5xl mb-32">
          <div className="text-center mb-10">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-3 tracking-tight">The Modern Stranger Chat Experience</h2>
            <p className="text-white/35 text-sm max-w-md mx-auto">Designed for crystal-clear video, instant matching, and absolute privacy.</p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { title: 'Live Video Streams', desc: 'Crystal-clear HD video calls', img: '/images/showcase-1.png' },
              { title: 'Smart Matchmaking', desc: 'Instant matching algorithm', img: '/images/showcase-2.png' },
              { title: 'Rich Text Chat', desc: 'Instant messaging with typing signals', img: '/images/showcase-3.png' },
              { title: 'Global Discovery', desc: 'Filter by languages and regions', img: '/images/showcase-4.png' }
            ].map((card, idx) => (
              <div key={idx} className="group glass-panel rounded-2xl p-3 border border-white/10 hover:border-violet-500/30 transition-all flex flex-col">
                <div className="relative aspect-[9/16] rounded-xl overflow-hidden mb-3 bg-[#0a0a0a]">
                  <img 
                    src={card.img} 
                    alt={card.title} 
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" 
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent"></div>
                  <div className="absolute bottom-2 left-2 right-2 text-left">
                    <span className="text-xs font-bold text-white block">{card.title}</span>
                    <span className="text-[10px] text-white/60 block">{card.desc}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Features Bento Grid */}
        <section id="features" ref={bentoRef} className="w-full max-w-5xl mb-32">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4 tracking-tight">Why Mingzy?</h2>
            <p className="text-white/35 text-sm max-w-md mx-auto">Built for connection, designed for safety.</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              {
                icon: 'bolt',
                title: 'Instant Matching',
                desc: 'Get paired with someone in seconds. Our smart queue finds the perfect match from thousands of people online worldwide.',
                gradient: 'from-amber-500/10 to-orange-500/5',
                link: '/features/instant-matching'
              },
              {
                icon: 'forum',
                title: 'Video + Text',
                desc: 'Talk however you want. Switch seamlessly between high-quality video streams and instant text messages in real-time.',
                gradient: 'from-violet-500/10 to-indigo-500/5',
                link: '/features/video-chat'
              },
              {
                icon: 'shield',
                title: 'Safety First',
                desc: 'Report, block, and skip anytime. End-to-end connection management puts you in full control of every interaction.',
                gradient: 'from-emerald-500/10 to-teal-500/5',
                link: '/safety'
              }
            ].map((feature, i) => (
              <div 
                key={feature.title}
                onClick={() => navigateTo(feature.link)}
                className={`bento-card rounded-2xl p-7 flex flex-col items-start animate-fade-in-up opacity-0 cursor-pointer hover:border-violet-500/30 transition-all`}
                style={{ animationDelay: `${i * 100 + 100}ms` }}
              >
                <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${feature.gradient} flex items-center justify-center mb-5 ring-1 ring-white/5`}>
                  <span className="material-symbols-outlined text-[20px] text-white/80">{feature.icon}</span>
                </div>
                <h3 className="text-lg font-semibold text-white mb-2 tracking-tight">{feature.title}</h3>
                <p className="text-sm text-white/35 leading-relaxed mb-4">{feature.desc}</p>
                <span className="text-xs text-violet-400 flex items-center gap-1 font-medium mt-auto">
                  Learn more
                  <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
                </span>
              </div>
            ))}
          </div>
        </section>

        {/* Stats Banner */}
        <section className="w-full max-w-5xl mb-32">
          <div className="glass-panel rounded-2xl p-8 md:p-10 flex flex-col md:flex-row items-center justify-between gap-8 glow-indigo">
            {[
              { value: '4.2M+', label: 'Conversations', icon: 'chat_bubble' },
              { value: '180+', label: 'Countries', icon: 'public' },
              { value: '99.9%', label: 'Uptime', icon: 'speed' },
              { value: '<2s', label: 'Avg. Match Time', icon: 'timer' },
            ].map((stat) => (
              <div key={stat.label} className="flex flex-col items-center text-center flex-1">
                <span className="material-symbols-outlined text-violet-400/60 text-[20px] mb-2">{stat.icon}</span>
                <span className="text-2xl md:text-3xl font-bold text-white tracking-tight">{stat.value}</span>
                <span className="text-xs text-white/30 mt-1 uppercase tracking-wider">{stat.label}</span>
              </div>
            ))}
          </div>
        </section>

        {/* How it Works Section */}
        <section id="how-it-works" className="w-full max-w-4xl text-center flex flex-col items-center mb-32">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4 tracking-tight">How it works</h2>
          <p className="text-white/35 text-sm max-w-md mx-auto mb-14">Four simple steps to your next conversation.</p>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 w-full relative">
            {/* Connecting Gradient Line */}
            <div className="hidden md:block absolute top-7 left-[15%] right-[15%] h-px z-0">
              <div className="w-full h-full bg-gradient-to-r from-transparent via-violet-500/20 to-transparent"></div>
            </div>
            
            {[
              { step: 1, label: 'Choose Mode', sublabel: 'Video or Text', icon: 'touch_app' },
              { step: 2, label: 'Get Matched', sublabel: 'In seconds', icon: 'group_add' },
              { step: 3, label: 'Start Talking', sublabel: 'Real-time chat', icon: 'record_voice_over' },
              { step: 4, label: 'Skip to Next', sublabel: 'Anytime', icon: 'skip_next' },
            ].map((item, i) => (
              <div 
                key={item.step} 
                className="flex flex-col items-center relative z-10 group animate-fade-in-up opacity-0"
                style={{ animationDelay: `${i * 120 + 100}ms` }}
              >
                <div className="w-14 h-14 rounded-2xl bg-[#0E0E0E] border border-white/[0.06] flex items-center justify-center mb-4 group-hover:border-violet-500/30 group-hover:glow-violet transition-all duration-300 relative">
                  <span className="material-symbols-outlined text-[22px] text-white/60 group-hover:text-violet-300 transition-colors">{item.icon}</span>
                  <div className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-md bg-violet-600 flex items-center justify-center text-[9px] font-bold text-white shadow-lg">
                    {item.step}
                  </div>
                </div>
                <span className="text-sm text-white font-semibold mb-0.5">{item.label}</span>
                <span className="text-[11px] text-white/30">{item.sublabel}</span>
              </div>
            ))}
          </div>
        </section>

        {/* Safety Section */}
        <section id="safety" className="w-full max-w-4xl mb-32">
          <div className="bento-card rounded-2xl p-8 md:p-12 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-red-500/5 rounded-full blur-3xl pointer-events-none"></div>
            
            <div className="flex flex-col md:flex-row items-center gap-8 relative z-10">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-red-500/15 to-orange-500/10 flex items-center justify-center shrink-0 ring-1 ring-red-500/10">
                <span className="material-symbols-outlined text-[32px] text-red-400/80" style={{ fontVariationSettings: "'FILL' 1" }}>verified_user</span>
              </div>
              <div className="flex-1 text-left">
                <h3 className="text-xl md:text-2xl font-bold text-white mb-3 tracking-tight">Your Safety, Our Priority</h3>
                <p className="text-white/35 text-sm leading-relaxed mb-5">
                  We are committed to a safe community. Never share personal information, social handles, or location. Report malicious behaviour instantly — every report is reviewed.
                </p>
                <div className="flex flex-wrap gap-3 mb-4">
                  <span className="inline-flex items-center gap-1.5 text-xs text-white/40 bg-white/5 px-3 py-1.5 rounded-lg">
                    <span className="material-symbols-outlined text-[14px] text-emerald-400/70">check_circle</span>
                    One-click reporting
                  </span>
                  <span className="inline-flex items-center gap-1.5 text-xs text-white/40 bg-white/5 px-3 py-1.5 rounded-lg">
                    <span className="material-symbols-outlined text-[14px] text-emerald-400/70">check_circle</span>
                    Instant block
                  </span>
                  <span className="inline-flex items-center gap-1.5 text-xs text-white/40 bg-white/5 px-3 py-1.5 rounded-lg">
                    <span className="material-symbols-outlined text-[14px] text-emerald-400/70">check_circle</span>
                    Anonymous by default
                  </span>
                </div>
                <button 
                  onClick={() => navigateTo('/safety')}
                  className="text-xs text-violet-400 hover:text-violet-300 font-semibold flex items-center gap-1"
                >
                  Visit Safety Center
                  <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* Mobile App Download Showcase Section */}
        <section className="w-full max-w-5xl mb-32">
          <div className="glass-panel rounded-3xl p-8 md:p-12 border border-white/10 flex flex-col md:flex-row items-center justify-between gap-8 relative overflow-hidden bg-gradient-to-r from-violet-950/20 via-black to-emerald-950/20">
            <div className="flex-1 text-left">
              <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-xs font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 mb-4">
                <span className="material-symbols-outlined text-[16px]">android</span>
                Official Android App Available
              </span>
              <h2 className="text-3xl md:text-4xl font-extrabold text-white mb-4 tracking-tight">
                Take Mingzy With You Everywhere
              </h2>
              <p className="text-white/60 text-sm md:text-base leading-relaxed mb-6 max-w-lg">
                Enjoy 60fps HD video calls, background notifications, and instant language matching right in your pocket. Free direct APK download (no wait).
              </p>
              <div className="flex flex-wrap items-center gap-4">
                <a 
                  href="https://www.dropbox.com/scl/fi/5q3hmh674wtdf3yxlogbu/app-release.apk?rlkey=174k5u1sinqnuguxvybxraeve&st=6e7b325k&dl=1"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-primary px-8 py-4 rounded-2xl font-semibold text-sm flex items-center gap-3 shadow-lg shadow-violet-600/30"
                >
                  <span className="material-symbols-outlined text-[22px]">download</span>
                  Download Android APK (82 MB)
                </a>
                <span className="text-xs text-white/40 flex items-center gap-1">
                  <span className="material-symbols-outlined text-[16px] text-emerald-400">verified</span>
                  Direct Cloud Download • v1.0
                </span>
              </div>
            </div>
            <div className="w-full md:w-64 aspect-[9/16] rounded-2xl overflow-hidden shadow-2xl border border-white/10 relative">
              <img src="/images/showcase-1.png" alt="Mingzy Mobile App" className="w-full h-full object-cover" />
            </div>
          </div>
        </section>

        {/* CTA Banner */}
        <section className="w-full max-w-4xl mb-32 text-center">
          <div className="glass-panel rounded-3xl p-10 md:p-16 relative overflow-hidden glow-indigo">
            <div className="absolute inset-0 bg-gradient-to-br from-violet-600/5 to-indigo-600/5 pointer-events-none"></div>
            <div className="relative z-10">
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-4 tracking-tight">Ready to Meet Someone?</h2>
              <p className="text-white/35 text-sm max-w-md mx-auto mb-8">No sign-up required. Jump in and start chatting with someone new in seconds.</p>
              <button 
                onClick={() => onStartChat('video')}
                className="btn-primary px-10 py-4 rounded-2xl font-semibold text-base inline-flex items-center gap-3 relative z-10"
              >
                <span className="relative z-10 flex items-center gap-3">
                  <span className="material-symbols-outlined text-[22px]" style={{ fontVariationSettings: "'FILL' 1" }}>videocam</span>
                  Start Chatting Now
                </span>
              </button>
            </div>
          </div>
        </section>

      </main>

      {/* Global Comprehensive Footer */}
      <footer className="border-t border-white/[0.04] mt-auto relative z-10 bg-[#080808]/80">
        <div className="w-full px-5 md:px-10 py-12 max-w-[1280px] mx-auto flex flex-col gap-10">
          
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 lg:grid-cols-8 gap-6 text-left">
            
            {/* Col 1: Core */}
            <div>
              <h4 className="text-xs font-semibold text-white/70 uppercase tracking-wider mb-3">Core Chat</h4>
              <ul className="space-y-2 text-xs text-white/40">
                <li><button onClick={() => navigateTo('/random-video-chat')} className="hover:text-white transition-colors">Random Video</button></li>
                <li><button onClick={() => navigateTo('/talk-to-strangers')} className="hover:text-white transition-colors">Talk to Strangers</button></li>
                <li><button onClick={() => navigateTo('/anonymous-video-chat')} className="hover:text-white transition-colors">Anonymous Video</button></li>
                <li><button onClick={() => navigateTo('/random-text-chat')} className="hover:text-white transition-colors">Random Text</button></li>
                <li><button onClick={() => navigateTo('/meet-new-people')} className="hover:text-white transition-colors">Meet People</button></li>
                <li><button onClick={() => navigateTo('/stranger-chat')} className="hover:text-white transition-colors">Stranger Chat</button></li>
              </ul>
            </div>

            {/* Col 2: Alternatives */}
            <div>
              <h4 className="text-xs font-semibold text-white/70 uppercase tracking-wider mb-3">Alternatives</h4>
              <ul className="space-y-2 text-xs text-white/40">
                <li><button onClick={() => navigateTo('/alternatives/omegle-alternative')} className="hover:text-white transition-colors">Omegle Alt</button></li>
                <li><button onClick={() => navigateTo('/alternatives/ome-tv-alternative')} className="hover:text-white transition-colors">OmeTV Alt</button></li>
                <li><button onClick={() => navigateTo('/alternatives/chatroulette-alternative')} className="hover:text-white transition-colors">Chatroulette Alt</button></li>
                <li><button onClick={() => navigateTo('/alternatives/monkey-alternative')} className="hover:text-white transition-colors">Monkey Alt</button></li>
                <li><button onClick={() => navigateTo('/alternatives/emerald-chat-alternative')} className="hover:text-white transition-colors">Emerald Chat Alt</button></li>
                <li><button onClick={() => navigateTo('/alternatives/chatrandom-alternative')} className="hover:text-white transition-colors">Chatrandom Alt</button></li>
                <li><button onClick={() => navigateTo('/alternatives/camsurf-alternative')} className="hover:text-white transition-colors">Camsurf Alt</button></li>
                <li><button onClick={() => navigateTo('/alternatives/coomeet-alternative')} className="hover:text-white transition-colors">CooMeet Alt</button></li>
                <li><button onClick={() => navigateTo('/alternatives/shagle-alternative')} className="hover:text-white transition-colors">Shagle Alt</button></li>
                <li><button onClick={() => navigateTo('/alternatives/tinychat-alternative')} className="hover:text-white transition-colors">TinyChat Alt</button></li>
                <li><button onClick={() => navigateTo('/alternatives/bazoocam-alternative')} className="hover:text-white transition-colors">Bazoocam Alt</button></li>
              </ul>
            </div>

            {/* Col 3: Languages */}
            <div>
              <h4 className="text-xs font-semibold text-white/70 uppercase tracking-wider mb-3">Languages</h4>
              <ul className="space-y-2 text-xs text-white/40">
                <li><button onClick={() => navigateTo('/languages/english')} className="hover:text-white transition-colors">English Chat</button></li>
                <li><button onClick={() => navigateTo('/languages/hindi')} className="hover:text-white transition-colors">Hindi Chat</button></li>
                <li><button onClick={() => navigateTo('/languages/spanish')} className="hover:text-white transition-colors">Spanish Chat</button></li>
                <li><button onClick={() => navigateTo('/languages/french')} className="hover:text-white transition-colors">French Chat</button></li>
                <li><button onClick={() => navigateTo('/languages/german')} className="hover:text-white transition-colors">German Chat</button></li>
                <li><button onClick={() => navigateTo('/languages/portuguese')} className="hover:text-white transition-colors">Portuguese Chat</button></li>
                <li><button onClick={() => navigateTo('/languages/japanese')} className="hover:text-white transition-colors">Japanese Chat</button></li>
                <li><button onClick={() => navigateTo('/languages/arabic')} className="hover:text-white transition-colors">Arabic Chat</button></li>
                <li><button onClick={() => navigateTo('/languages/italian')} className="hover:text-white transition-colors">Italian Chat</button></li>
                <li><button onClick={() => navigateTo('/languages/korean')} className="hover:text-white transition-colors">Korean Chat</button></li>
                <li><button onClick={() => navigateTo('/languages/turkish')} className="hover:text-white transition-colors">Turkish Chat</button></li>
              </ul>
            </div>

            {/* Col 4: Countries */}
            <div>
              <h4 className="text-xs font-semibold text-white/70 uppercase tracking-wider mb-3">Countries</h4>
              <ul className="space-y-2 text-xs text-white/40">
                <li><button onClick={() => navigateTo('/countries/usa')} className="hover:text-white transition-colors">USA</button></li>
                <li><button onClick={() => navigateTo('/countries/india')} className="hover:text-white transition-colors">India</button></li>
                <li><button onClick={() => navigateTo('/countries/uk')} className="hover:text-white transition-colors">UK</button></li>
                <li><button onClick={() => navigateTo('/countries/canada')} className="hover:text-white transition-colors">Canada</button></li>
                <li><button onClick={() => navigateTo('/countries/australia')} className="hover:text-white transition-colors">Australia</button></li>
                <li><button onClick={() => navigateTo('/countries/germany')} className="hover:text-white transition-colors">Germany</button></li>
                <li><button onClick={() => navigateTo('/countries/france')} className="hover:text-white transition-colors">France</button></li>
                <li><button onClick={() => navigateTo('/countries/brazil')} className="hover:text-white transition-colors">Brazil</button></li>
                <li><button onClick={() => navigateTo('/countries/japan')} className="hover:text-white transition-colors">Japan</button></li>
                <li><button onClick={() => navigateTo('/countries/philippines')} className="hover:text-white transition-colors">Philippines</button></li>
                <li><button onClick={() => navigateTo('/countries/mexico')} className="hover:text-white transition-colors">Mexico</button></li>
                <li><button onClick={() => navigateTo('/countries/indonesia')} className="hover:text-white transition-colors">Indonesia</button></li>
              </ul>
            </div>

            {/* Col 5: Cities */}
            <div>
              <h4 className="text-xs font-semibold text-white/70 uppercase tracking-wider mb-3">Cities</h4>
              <ul className="space-y-2 text-xs text-white/40">
                <li><button onClick={() => navigateTo('/cities/new-york')} className="hover:text-white transition-colors">New York</button></li>
                <li><button onClick={() => navigateTo('/cities/london')} className="hover:text-white transition-colors">London</button></li>
                <li><button onClick={() => navigateTo('/cities/tokyo')} className="hover:text-white transition-colors">Tokyo</button></li>
              </ul>
            </div>

            {/* Col 6: Features */}
            <div>
              <h4 className="text-xs font-semibold text-white/70 uppercase tracking-wider mb-3">Features</h4>
              <ul className="space-y-2 text-xs text-white/40">
                <li><button onClick={() => navigateTo('/features/video-chat')} className="hover:text-white transition-colors">HD Video Chat</button></li>
                <li><button onClick={() => navigateTo('/features/text-chat')} className="hover:text-white transition-colors">Live Text Chat</button></li>
                <li><button onClick={() => navigateTo('/features/language-matching')} className="hover:text-white transition-colors">Language Match</button></li>
                <li><button onClick={() => navigateTo('/features/instant-matching')} className="hover:text-white transition-colors">Instant Queue</button></li>
                <li><button onClick={() => navigateTo('/features/global-chat')} className="hover:text-white transition-colors">Global Chat</button></li>
                <li><button onClick={() => navigateTo('/features/skip-and-match')} className="hover:text-white transition-colors">Skip & Next</button></li>
              </ul>
            </div>

            {/* Col 7: Safety & Legal */}
            <div>
              <h4 className="text-xs font-semibold text-white/70 uppercase tracking-wider mb-3">Trust & Safety</h4>
              <ul className="space-y-2 text-xs text-white/40">
                <li><button onClick={() => navigateTo('/safety')} className="hover:text-white transition-colors">Safety Center</button></li>
                <li><button onClick={() => navigateTo('/safety/reporting')} className="hover:text-white transition-colors">Report Abuse</button></li>
                <li><button onClick={() => navigateTo('/safety/blocking')} className="hover:text-white transition-colors">Instant Block</button></li>
                <li><button onClick={() => navigateTo('/community-guidelines')} className="hover:text-white transition-colors">Guidelines</button></li>
                <li><button onClick={() => navigateTo('/privacy')} className="hover:text-white transition-colors">Privacy Policy</button></li>
                <li><button onClick={() => navigateTo('/terms')} className="hover:text-white transition-colors">Terms of Service</button></li>
              </ul>
            </div>

            {/* Col 8: Guides */}
            <div>
              <h4 className="text-xs font-semibold text-white/70 uppercase tracking-wider mb-3">Guides</h4>
              <ul className="space-y-2 text-xs text-white/40">
                <li><button onClick={() => navigateTo('/guides/how-random-video-chat-works')} className="hover:text-white transition-colors">How Chat Works</button></li>
                <li><button onClick={() => navigateTo('/guides/random-video-chat-safety-guide')} className="hover:text-white transition-colors">Safety Guide</button></li>
                <li><button onClick={() => navigateTo('/guides/best-conversation-starters-stranger-chat')} className="hover:text-white transition-colors">50 Starters</button></li>
                <li><button onClick={() => navigateTo('/guides/language-matching-explained')} className="hover:text-white transition-colors">Language Match</button></li>
                <li><button onClick={() => navigateTo('/guides/overcoming-stranger-chat-anxiety')} className="hover:text-white transition-colors">Overcome Anxiety</button></li>
                <li><button onClick={() => navigateTo('/guides/how-to-spot-scams-and-bots-on-video-chat')} className="hover:text-white transition-colors">Spot Scams</button></li>
              </ul>
            </div>

          </div>

          <div className="flex flex-col md:flex-row justify-between items-center pt-8 border-t border-white/[0.04] text-xs text-white/30 gap-4">
            <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigateTo('/')}>
              <span className="text-sm font-bold text-white/70 hover:text-white transition-colors">Mingzy</span>
              <span>— Talk to strangers around the world.</span>
            </div>
            <div className="flex items-center gap-6">
              <a 
                href="https://www.dropbox.com/scl/fi/5q3hmh674wtdf3yxlogbu/app-release.apk?rlkey=174k5u1sinqnuguxvybxraeve&st=6e7b325k&dl=1"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-emerald-400 hover:text-emerald-300 font-semibold transition-colors"
              >
                <span className="material-symbols-outlined text-[16px]">android</span>
                Download Android APK (v1.0)
              </a>
              <span>© 2026 Mingzy. All rights reserved.</span>
            </div>
          </div>

        </div>
      </footer>
    </div>
  );
}
