import React from 'react';

export default function NotFoundPage({ onNavigate, onStartChat, theme, toggleTheme }) {
  return (
    <div className="w-full min-h-screen flex flex-col bg-midnight-canvas text-[#f5ebfc] noise-overlay relative overflow-x-hidden font-body-md selection:bg-mingzy-pink/30">
      
      {/* Ambient background glow */}
      <div className="aurora-glow-top"></div>

      {/* Top Navbar */}
      <header className="glass-plum-strong sticky top-0 z-50 border-b border-white/[0.06]">
        <div className="flex justify-between items-center w-full px-5 md:px-10 h-[72px] max-w-[1280px] mx-auto">
          <div className="flex items-center gap-3 cursor-pointer group" onClick={() => onNavigate('/')}>
            <div className="relative">
              <img 
                alt="Mingzy" 
                className="w-9 h-9 rounded-2xl object-cover ring-1 ring-white/10 group-hover:ring-mingzy-pink/40 transition-all shadow-[0_0_12px_rgba(255,46,147,0.3)]" 
                src="/images/mingzy-logo.jpg"
              />
              <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-mingzy-pink rounded-full border border-[#09060F] shadow-[0_0_8px_#FF2E93] animate-pulse"></div>
            </div>
            <span className="text-xl md:text-2xl font-bold text-white tracking-tight group-hover:text-mingzy-pink transition-colors">
              Mingzy
            </span>
          </div>

          <div className="flex items-center gap-3">
            <button 
              onClick={toggleTheme}
              className="w-9 h-9 rounded-xl flex items-center justify-center hover:bg-white/[0.05] border border-white/[0.06] text-white/40 hover:text-white transition-all active:scale-95"
              title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            >
              <span className="material-symbols-outlined text-[18px]">
                {theme === 'dark' ? 'light_mode' : 'dark_mode'}
              </span>
            </button>

            <button 
              onClick={() => onStartChat('video')}
              className="btn-mingzy-cta px-5 py-2.5 rounded-full text-xs font-semibold"
            >
              <span className="flex items-center gap-1.5">
                <span>♡</span>
                <span>Start Mingzy</span>
              </span>
            </button>
          </div>
        </div>
      </header>

      {/* Main 404 Hero */}
      <main className="flex-grow flex flex-col items-center justify-center w-full px-5 py-20 max-w-[800px] mx-auto text-center relative z-10">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full glass-plum text-xs text-mingzy-pink font-semibold mb-6 border border-mingzy-pink/20">
          <span className="material-symbols-outlined text-[16px]">wifi_off</span>
          <span>404 • Connection Lost</span>
        </div>

        <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-6">
          <span className="text-white">Lost in the</span> <br />
          <span className="text-gradient-mingzy">Midnight Void?</span>
        </h1>

        <p className="text-base md:text-lg text-white/50 mb-10 max-w-lg leading-relaxed font-light">
          That page drifted away, but thousands of people are floating online right now waiting for a conversation.
        </p>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center gap-4 mb-16 w-full justify-center">
          <button 
            onClick={() => onStartChat('video')}
            className="btn-mingzy-cta w-full sm:w-auto px-8 py-4 rounded-full font-semibold text-base flex items-center justify-center gap-2.5"
          >
            <span>♡</span>
            <span>Start Video Chat</span>
          </button>

          <button 
            onClick={() => onStartChat('text')}
            className="btn-mingzy-ghost w-full sm:w-auto px-8 py-4 rounded-full font-semibold text-base text-white flex items-center justify-center gap-2"
          >
            <span className="material-symbols-outlined text-[20px]">chat</span>
            <span>Start Text Chat</span>
          </button>
        </div>

        {/* Helpful navigation hubs */}
        <div className="w-full glass-plum rounded-3xl p-6 md:p-8 text-left border border-white/[0.06]">
          <h2 className="text-sm font-semibold text-white/80 uppercase tracking-wider mb-4">
            Popular Destinations
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {[
              { label: 'Random Video Chat', path: '/random-video-chat' },
              { label: 'Talk to Strangers', path: '/talk-to-strangers' },
              { label: 'Random Text Chat', path: '/random-text-chat' },
              { label: 'Omegle Alternative', path: '/alternatives/omegle-alternative' },
              { label: 'English Chat', path: '/languages/english' },
              { label: 'Hindi Chat', path: '/languages/hindi' },
              { label: 'USA Video Chat', path: '/countries/usa' },
              { label: 'India Video Chat', path: '/countries/india' },
              { label: 'Safety Center', path: '/safety' }
            ].map(item => (
              <button
                key={item.path}
                onClick={() => onNavigate(item.path)}
                className="text-left text-xs text-white/60 hover:text-white hover:bg-white/[0.04] p-2.5 rounded-xl transition-colors flex items-center justify-between"
              >
                <span>{item.label}</span>
                <span className="material-symbols-outlined text-[14px] text-white/30">arrow_forward</span>
              </button>
            ))}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-white/[0.06] mt-auto relative z-10 bg-[#07040c] py-8">
        <div className="flex flex-col md:flex-row justify-between items-center w-full px-5 md:px-10 max-w-[1280px] mx-auto gap-4">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => onNavigate('/')}>
            <span className="text-base font-bold text-white/70 hover:text-mingzy-pink transition-colors">Mingzy</span>
          </div>
          <div className="text-white/30 text-xs">
            © 2026 Mingzy • The next conversation could be anyone.
          </div>
        </div>
      </footer>

    </div>
  );
}
