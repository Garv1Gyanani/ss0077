import React, { useEffect, useRef } from 'react';
import { auth, signOut } from '../firebase';

export default function LandingPage({ user, onStartChat, onOpenAuth, theme, toggleTheme }) {
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

  return (
    <div className="w-full min-h-screen flex flex-col bg-ambient-gradient noise-overlay relative overflow-x-hidden">
      
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
          <div className="flex items-center gap-3 cursor-pointer group" onClick={() => window.location.reload()}>
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
          <nav className="hidden md:flex items-center gap-1">
            {['How it works', 'Features', 'Safety'].map((label, i) => (
              <a
                key={label}
                href={`#${label.toLowerCase().replace(/ /g, '-')}`}
                className="px-4 py-2 text-sm text-white/50 hover:text-white hover:bg-white/5 rounded-lg transition-all duration-200"
              >
                {label}
              </a>
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
                className="hidden md:block text-sm text-white/60 hover:text-white transition-colors px-3 py-1.5"
              >
                Sign In
              </button>
            )}
            
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
              className="btn-primary px-5 py-2.5 rounded-xl text-sm font-semibold relative z-10"
            >
              <span className="relative z-10 flex items-center gap-2">
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
            <span>4,281 people chatting right now</span>
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
            Instantly connect with people around the world through anonymous video & text chat. Free, private, no downloads.
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

        {/* Hero Visual Mockup */}
        <section className="animate-fade-in-up opacity-0 delay-500 w-full relative rounded-3xl overflow-hidden mb-32 max-w-5xl group hero-image-overlay">
          <div className="absolute inset-0 rounded-3xl border border-white/[0.06] z-30 pointer-events-none"></div>
          
          {/* Glow behind image */}
          <div className="absolute -inset-4 bg-gradient-to-r from-violet-600/10 via-transparent to-indigo-600/10 rounded-[2.5rem] blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-700 z-0"></div>
          
          <div className="relative bg-[#0E0E0E] aspect-video rounded-3xl overflow-hidden">
            <div className="absolute inset-0 z-0 flex items-center justify-center">
              <div className="w-12 h-12 border-2 border-white/10 border-t-violet-500 rounded-full animate-spin"></div>
            </div>
            <img 
              alt="Mingzy Video Chat Interface" 
              className="absolute inset-0 w-full h-full object-cover z-10 transition-transform duration-1000 group-hover:scale-[1.03] opacity-80 group-hover:opacity-90" 
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuDM75rsK_nvOkTlpsfSOO2V_dm5uo7nm_Y8c6q6GklQWCPD1qbm4sDNVE9qf8k-WnOxybcsE7j1JAHj0NMDEcpwhn98iSEHTbRfroljAb_KKGDzpDTf22Dj0dBxfsn5q0GZrrYwoAh2nSGdMtC5vleCmG6scsBjOGe_kSHW7jvMFWE84g0nY7aIk7ha06t6QpM-XS0R1Woe4mQFHWpm5hsa_i6oyzQ6vOoemd3JJ5H63WzD6x1Eu9uJ"
            />
            
            {/* Simulated UI Overlay */}
            <div className="absolute bottom-5 left-5 right-5 z-30 flex justify-between items-end">
              <div className="flex gap-2">
                <div className="glass-panel px-3.5 py-1.5 rounded-full flex items-center gap-2 text-xs text-white/80 font-medium">
                  <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_6px_rgba(52,211,153,0.5)]"></div>
                  Live
                </div>
                <div className="glass-panel px-3.5 py-1.5 rounded-full flex items-center gap-1.5 text-xs text-white/60">
                  <span className="material-symbols-outlined text-[14px]">schedule</span>
                  02:34
                </div>
              </div>
              <div className="glass-panel px-2 py-1.5 rounded-full flex items-center gap-1">
                <button className="w-8 h-8 flex items-center justify-center rounded-full text-white/70 hover:text-white hover:bg-white/10 transition-all">
                  <span className="material-symbols-outlined text-[18px]">mic</span>
                </button>
                <button className="w-8 h-8 flex items-center justify-center rounded-full text-white/70 hover:text-white hover:bg-white/10 transition-all">
                  <span className="material-symbols-outlined text-[18px]">videocam</span>
                </button>
                <button className="bg-red-500/80 hover:bg-red-500 text-white px-3 py-1 rounded-full text-xs font-semibold ml-1 transition-colors">
                  End
                </button>
              </div>
            </div>
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
                gradient: 'from-amber-500/10 to-orange-500/5'
              },
              {
                icon: 'forum',
                title: 'Video + Text',
                desc: 'Talk however you want. Switch seamlessly between high-quality video streams and instant text messages in real-time.',
                gradient: 'from-violet-500/10 to-indigo-500/5'
              },
              {
                icon: 'shield',
                title: 'Safety First',
                desc: 'Report, block, and skip anytime. End-to-end connection management puts you in full control of every interaction.',
                gradient: 'from-emerald-500/10 to-teal-500/5'
              }
            ].map((feature, i) => (
              <div 
                key={feature.title}
                className={`bento-card rounded-2xl p-7 flex flex-col items-start animate-fade-in-up opacity-0`}
                style={{ animationDelay: `${i * 100 + 100}ms` }}
              >
                <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${feature.gradient} flex items-center justify-center mb-5 ring-1 ring-white/5`}>
                  <span className="material-symbols-outlined text-[20px] text-white/80">{feature.icon}</span>
                </div>
                <h3 className="text-lg font-semibold text-white mb-2 tracking-tight">{feature.title}</h3>
                <p className="text-sm text-white/35 leading-relaxed">{feature.desc}</p>
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
            ].map((stat, i) => (
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
            {/* Background glow accent */}
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
                <div className="flex flex-wrap gap-3">
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
              </div>
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

      {/* Footer */}
      <footer className="border-t border-white/[0.04] mt-auto relative z-10">
        <div className="flex flex-col md:flex-row justify-between items-center w-full px-5 md:px-10 py-10 max-w-[1280px] mx-auto gap-6 md:gap-0">
          <div className="flex items-center gap-2 cursor-pointer group" onClick={() => window.location.reload()}>
            <span className="text-lg font-bold text-white/60 group-hover:text-white transition-colors">Mingzy</span>
          </div>
          <nav className="flex flex-wrap justify-center gap-5">
            <a className="text-white/40 text-xs hover:text-white transition-colors" href="/privacy.html" target="_blank" rel="noopener noreferrer">Privacy Policy</a>
            <a className="text-white/40 text-xs hover:text-white transition-colors" href="/terms.html" target="_blank" rel="noopener noreferrer">Terms of Service</a>
            <a className="text-white/40 text-xs hover:text-white transition-colors" href="#safety">Safety</a>
            <a className="text-white/40 text-xs hover:text-white transition-colors" href="mailto:support@mingzy.app">Contact</a>
          </nav>
          <div className="text-white/20 text-xs">
            © 2026 Mingzy
          </div>
        </div>
      </footer>
    </div>
  );
}
