import React from 'react';

export default function NotFoundPage({ onNavigate, onStartChat, theme, toggleTheme }) {
  return (
    <div className="w-full min-h-screen flex flex-col bg-ambient-gradient noise-overlay relative overflow-x-hidden text-white font-body-md">
      
      {/* Ambient background glow */}
      <div className="fixed top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full bg-violet-600/[0.08] blur-[120px] pointer-events-none"></div>

      {/* Top Navbar */}
      <header className="glass-panel-strong sticky top-0 z-50">
        <div className="flex justify-between items-center w-full px-5 md:px-10 h-[72px] max-w-[1280px] mx-auto">
          <div className="flex items-center gap-3 cursor-pointer group" onClick={() => onNavigate('/')}>
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

          <div className="flex items-center gap-3">
            <button 
              onClick={toggleTheme}
              className="w-9 h-9 rounded-xl flex items-center justify-center hover:bg-white/5 border border-white/[0.06] text-white/40 hover:text-white transition-all active:scale-95"
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

      {/* Main 404 Hero */}
      <main className="flex-grow flex flex-col items-center justify-center w-full px-5 py-20 max-w-[800px] mx-auto text-center relative z-10">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full glass-panel text-xs text-violet-300 font-semibold mb-6 border border-violet-500/20">
          <span className="material-symbols-outlined text-[16px]">wifi_off</span>
          <span>404 • Connection Lost</span>
        </div>

        <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-6">
          <span className="text-gradient-hero">Lost in the</span> <br />
          <span className="text-white">Strangerly Void?</span>
        </h1>

        <p className="text-base md:text-lg text-white/50 mb-10 max-w-lg leading-relaxed font-light">
          That page doesn't exist, but thousands of people are online right now waiting for a conversation. Jump straight in!
        </p>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center gap-4 mb-16 w-full justify-center">
          <button 
            onClick={() => onStartChat('video')}
            className="btn-primary w-full sm:w-auto px-8 py-4 rounded-2xl font-semibold text-base flex items-center justify-center gap-3 relative z-10"
          >
            <span className="relative z-10 flex items-center gap-3">
              <span className="material-symbols-outlined text-[22px]" style={{ fontVariationSettings: "'FILL' 1" }}>videocam</span>
              Start Random Video Chat
            </span>
          </button>

          <button 
            onClick={() => onStartChat('text')}
            className="btn-outline w-full sm:w-auto px-8 py-4 rounded-2xl font-semibold text-base text-white flex items-center justify-center gap-3"
          >
            <span className="material-symbols-outlined text-[22px]">chat</span>
            Start Text Chat
          </button>
        </div>

        {/* Helpful navigation hubs */}
        <div className="w-full glass-panel rounded-2xl p-6 md:p-8 text-left">
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
                className="text-left text-xs text-white/60 hover:text-white hover:bg-white/5 p-2.5 rounded-lg transition-colors flex items-center justify-between"
              >
                <span>{item.label}</span>
                <span className="material-symbols-outlined text-[14px] text-white/30">arrow_forward</span>
              </button>
            ))}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-white/[0.04] mt-auto relative z-10">
        <div className="flex flex-col md:flex-row justify-between items-center w-full px-5 md:px-10 py-8 max-w-[1280px] mx-auto gap-4">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => onNavigate('/')}>
            <span className="text-base font-bold text-white/60 hover:text-white transition-colors">Mingzy</span>
          </div>
          <div className="text-white/30 text-xs">
            © 2026 Mingzy • Meet Someone New
          </div>
        </div>
      </footer>

    </div>
  );
}
