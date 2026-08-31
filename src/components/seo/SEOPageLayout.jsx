import React, { useState } from 'react';
import SEOHead from './SEOHead';
import SEOProductCapabilities from './SEOProductCapabilities';
import SEOBreadcrumbs from './SEOBreadcrumbs';
import SEORelatedGrid from './SEORelatedGrid';
import { trackSEOCTAClick } from '../../utils/telemetry';

export default function SEOPageLayout({ 
  pageData, 
  onStartChat, 
  onNavigate, 
  user, 
  onOpenAuth, 
  theme, 
  toggleTheme 
}) {
  const [openFaq, setOpenFaq] = useState(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  if (!pageData) return null;

  const {
    h1,
    heroSubtitle,
    badgeText,
    breadcrumbs = [],
    highlights = [],
    contentSections = [],
    comparisonData,
    faqs = [],
    relatedLinks = [],
    capabilities = [],
    cta,
    presetPreferences = { language: 'Any', region: 'Worldwide', mode: 'video' }
  } = pageData;

  const handleStartWithPreset = (mode) => {
    const targetMode = mode || presetPreferences.mode || 'video';
    trackSEOCTAClick('seo_page_cta', targetMode, pageData.path);
    const prefs = {
      ...presetPreferences,
      mode: targetMode
    };
    onStartChat(targetMode, prefs);
  };

  return (
    <div className="w-full min-h-screen flex flex-col bg-ambient-gradient noise-overlay relative overflow-x-hidden text-white font-body-md">
      
      {/* 1. Dynamic Head & Schema injection */}
      <SEOHead pageData={pageData} />

      {/* Floating Background Particles & Ambient Blobs */}
      <div className="particles-container">
        <div className="glow-blob-1"></div>
        <div className="glow-blob-2"></div>
      </div>

      {/* 2. Sticky Top Navigation Bar */}
      <header className="glass-panel-strong sticky top-0 z-50">
        <div className="flex justify-between items-center w-full px-5 md:px-10 h-[72px] max-w-[1280px] mx-auto">
          
          {/* Logo */}
          <div className="flex items-center gap-3 cursor-pointer group" onClick={() => onNavigate('/')}>
            <div className="relative">
              <img 
                alt="Mingzy Logo" 
                className="w-9 h-9 rounded-2xl object-cover ring-1 ring-white/10 group-hover:ring-mingzy-pink/40 transition-all duration-300 shadow-[0_0_12px_rgba(255,46,147,0.3)]" 
                src="/images/mingzy-logo.jpg"
              />
              <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-mingzy-pink rounded-full border border-[#09060F] shadow-[0_0_8px_#FF2E93] animate-pulse"></div>
            </div>
            <span className="text-xl md:text-2xl font-bold text-white tracking-tight group-hover:text-mingzy-pink transition-colors">
              Mingzy
            </span>
          </div>

          {/* Desktop Navigation Cluster Links */}
          <nav className="hidden lg:flex items-center gap-1">
            {[
              { label: 'Video Chat', path: '/random-video-chat' },
              { label: 'Text Chat', path: '/random-text-chat' },
              { label: 'No Login', path: '/omegle-alternative-no-login' },
              { label: 'Languages', path: '/languages/english' },
              { label: 'Countries', path: '/countries/usa' },
              { label: 'Alternatives', path: '/alternatives/omegle-alternative' },
              { label: 'Safety', path: '/safety' },
              { label: 'Guides', path: '/guides/how-random-video-chat-works' }
            ].map(item => (
              <button
                key={item.path}
                onClick={() => onNavigate(item.path)}
                className="px-3 py-1.5 text-xs text-white/60 hover:text-white hover:bg-white/5 rounded-lg transition-all duration-200"
              >
                {item.label}
              </button>
            ))}
          </nav>

          {/* Right Controls */}
          <div className="flex items-center gap-2 md:gap-3">
            {user ? (
              <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10">
                <span className="text-xs text-white/70 font-medium">
                  {user.displayName || user.email?.split('@')[0]}
                </span>
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
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20 transition-all"
            >
              <span className="material-symbols-outlined text-[15px]">android</span>
              Get App
            </a>

            {/* Theme Toggle Button */}
            <button 
              onClick={toggleTheme}
              className="w-9 h-9 rounded-xl flex items-center justify-center hover:bg-white/5 border border-white/[0.06] text-white/40 hover:text-white transition-all active:scale-95"
              title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            >
              <span className="material-symbols-outlined text-[20px]">
                {theme === 'dark' ? 'light_mode' : 'dark_mode'}
              </span>
            </button>

            {/* Primary Action Button */}
            <button 
              onClick={() => handleStartWithPreset('video')}
              className="btn-primary px-3.5 sm:px-4 py-2 rounded-xl text-xs font-semibold relative z-10"
            >
              <span className="relative z-10 flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[16px]" style={{ fontVariationSettings: "'FILL' 1" }}>videocam</span>
                Start Chat
              </span>
            </button>

            {/* Mobile Menu Hamburger Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden w-9 h-9 rounded-xl flex items-center justify-center hover:bg-white/5 border border-white/[0.08] text-white/70 hover:text-white transition-all active:scale-95"
              aria-label="Toggle navigation menu"
            >
              <span className="material-symbols-outlined text-[20px]">
                {mobileMenuOpen ? 'close' : 'menu'}
              </span>
            </button>
          </div>

        </div>

        {/* Collapsible Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="lg:hidden w-full border-t border-white/[0.08] bg-[#0d0714]/95 backdrop-blur-xl px-5 py-4 flex flex-col gap-3 animate-fade-in">
            <div className="flex flex-col gap-1 text-sm font-medium">
              <button 
                onClick={() => { setMobileMenuOpen(false); handleStartWithPreset('video'); }} 
                className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-mingzy-pink/15 text-mingzy-pink hover:bg-mingzy-pink/20 transition-all font-semibold text-left mb-1"
              >
                <span className="material-symbols-outlined text-[18px]">videocam</span>
                Start Video Chat Now
              </button>
              <button 
                onClick={() => { setMobileMenuOpen(false); onNavigate('/random-video-chat'); }} 
                className="flex items-center gap-2 px-3 py-2 rounded-lg text-white/80 hover:text-white hover:bg-white/5 transition-all text-left"
              >
                Random Video Chat
              </button>
              <button 
                onClick={() => { setMobileMenuOpen(false); onNavigate('/alternatives/omegle-alternative'); }} 
                className="flex items-center gap-2 px-3 py-2 rounded-lg text-white/80 hover:text-white hover:bg-white/5 transition-all text-left"
              >
                Omegle Alternatives
              </button>
              <button 
                onClick={() => { setMobileMenuOpen(false); onNavigate('/omegle-alternative-no-login'); }} 
                className="flex items-center gap-2 px-3 py-2 rounded-lg text-white/80 hover:text-white hover:bg-white/5 transition-all text-left"
              >
                No Login Chat
              </button>
              
              <div className="pt-2 pb-1 px-3 text-[11px] font-semibold uppercase tracking-wider text-white/40">
                Language Exchange
              </div>
              <button 
                onClick={() => { setMobileMenuOpen(false); onNavigate('/language-exchange/english-spanish'); }} 
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-white/70 hover:text-white hover:bg-white/5 transition-all text-left pl-5"
              >
                English ↔ Spanish
              </button>
              <button 
                onClick={() => { setMobileMenuOpen(false); onNavigate('/language-exchange/hindi-english'); }} 
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-white/70 hover:text-white hover:bg-white/5 transition-all text-left pl-5"
              >
                Hindi ↔ English
              </button>

              <div className="pt-2 pb-1 px-3 text-[11px] font-semibold uppercase tracking-wider text-white/40">
                Guides & Safety
              </div>
              <button 
                onClick={() => { setMobileMenuOpen(false); onNavigate('/guides/omegle-alternatives-guide'); }} 
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-white/70 hover:text-white hover:bg-white/5 transition-all text-left pl-5"
              >
                Omegle Alternatives Guide
              </button>
              <button 
                onClick={() => { setMobileMenuOpen(false); onNavigate('/guides/anonymous-video-chat-guide'); }} 
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-white/70 hover:text-white hover:bg-white/5 transition-all text-left pl-5"
              >
                Anonymous Video Chat Guide
              </button>
              <button 
                onClick={() => { setMobileMenuOpen(false); onNavigate('/safety'); }} 
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-white/70 hover:text-white hover:bg-white/5 transition-all text-left pl-5"
              >
                Safety Center
              </button>
              
              <div className="pt-3 mt-1 border-t border-white/[0.06] flex items-center justify-between px-3 text-xs text-white/40">
                <button onClick={() => { setMobileMenuOpen(false); onNavigate('/privacy'); }} className="hover:text-white">Privacy</button>
                <span>•</span>
                <button onClick={() => { setMobileMenuOpen(false); onNavigate('/terms'); }} className="hover:text-white">Terms</button>
                <span>•</span>
                <button onClick={() => { setMobileMenuOpen(false); onNavigate('/community-guidelines'); }} className="hover:text-white">Guidelines</button>
              </div>
            </div>
          </div>
        )}
      </header>

      {/* 3. Main Content Container */}
      <main className="flex-grow flex flex-col items-center w-full px-5 md:px-10 max-w-[1200px] mx-auto relative z-10">
        
        {/* Breadcrumb Navigation */}
        <div className="w-full max-w-4xl pt-6 pb-2">
          <SEOBreadcrumbs breadcrumbs={breadcrumbs} onNavigate={onNavigate} />
        </div>

        {/* 4. Hero Section */}
        <section className="text-center w-full max-w-4xl flex flex-col items-center pt-8 md:pt-12 pb-10">
          
          {/* Badge */}
          <div className="mb-6 inline-flex items-center gap-2 px-4 py-1.5 rounded-full glass-panel text-xs text-violet-300 font-semibold border border-violet-500/20">
            <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse"></div>
            <span>{badgeText || 'Encrypted Video • 100% Free • No Account'}</span>
          </div>

          {/* Dynamic H1 Headline */}
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-extrabold tracking-tight mb-6 leading-[1.05] text-center">
            <span className="text-gradient-hero">{h1}</span>
          </h1>

          {/* Hero Subtitle */}
          <p className="text-base md:text-lg text-white/50 mb-10 max-w-2xl leading-relaxed font-light">
            {heroSubtitle}
          </p>

          {/* Dual Action Conversion Buttons */}
          <div className="flex flex-col sm:flex-row items-center gap-3.5 mb-6 w-full justify-center">
            {presetPreferences.mode === 'text' ? (
              <>
                <button 
                  onClick={() => handleStartWithPreset('text')}
                  className="btn-primary w-full sm:w-auto px-8 py-4 rounded-2xl font-semibold text-base flex items-center justify-center gap-3 relative z-10 shadow-lg shadow-violet-600/30"
                >
                  <span className="relative z-10 flex items-center gap-3">
                    <span className="material-symbols-outlined text-[22px]">chat</span>
                    {cta?.buttonText || 'Start Text Chat'}
                  </span>
                </button>

                <button 
                  onClick={() => handleStartWithPreset('video')}
                  className="btn-outline w-full sm:w-auto px-8 py-4 rounded-2xl font-semibold text-base text-white flex items-center justify-center gap-3"
                >
                  <span className="material-symbols-outlined text-[22px]" style={{ fontVariationSettings: "'FILL' 1" }}>videocam</span>
                  {cta?.secondaryButtonText || 'Try Video Chat'}
                </button>
              </>
            ) : (
              <>
                <button 
                  onClick={() => handleStartWithPreset('video')}
                  className="btn-primary w-full sm:w-auto px-8 py-4 rounded-2xl font-semibold text-base flex items-center justify-center gap-3 relative z-10 shadow-lg shadow-violet-600/30"
                >
                  <span className="relative z-10 flex items-center gap-3">
                    <span className="material-symbols-outlined text-[22px]" style={{ fontVariationSettings: "'FILL' 1" }}>videocam</span>
                    {cta?.buttonText || 'Start Video Chat'}
                  </span>
                </button>

                <button 
                  onClick={() => handleStartWithPreset('text')}
                  className="btn-outline w-full sm:w-auto px-8 py-4 rounded-2xl font-semibold text-base text-white flex items-center justify-center gap-3"
                >
                  <span className="material-symbols-outlined text-[22px]">chat</span>
                  {cta?.secondaryButtonText || 'Start Text Chat'}
                </button>
              </>
            )}
          </div>

          {/* Trust indicators */}
          <div className="flex flex-wrap items-center justify-center gap-3 md:gap-6 text-white/30 text-xs">
            <span className="flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[14px]">lock</span>
              100% Anonymous
            </span>
            <span className="w-1 h-1 rounded-full bg-white/20"></span>
            <span>Zero Sign-up Required</span>
            <span className="w-1 h-1 rounded-full bg-white/20"></span>
            <span>Free Forever</span>
            <span className="w-1 h-1 rounded-full bg-white/20"></span>
            <span>Instant Skip</span>
          </div>
        </section>

        {/* 5. Verified Product Capabilities Component */}
        <SEOProductCapabilities capabilities={capabilities} />

        {/* Visual Interface Preview */}
        <section className="w-full max-w-4xl mb-16 rounded-3xl overflow-hidden glass-panel border border-white/10 p-2 relative group">
          <div className="relative aspect-[21/9] sm:aspect-[24/9] rounded-2xl overflow-hidden bg-[#090909]">
            <img 
              src={presetPreferences.mode === 'text' ? '/images/showcase-3.png' : '/images/showcase-1.png'} 
              alt={h1}
              className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-all duration-700" 
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-transparent to-transparent"></div>
            <div className="absolute bottom-4 left-6 right-6 flex items-center justify-between text-xs text-white/80">
              <span className="font-semibold flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                Mingzy Live Interface
              </span>
              <span className="text-white/40 hidden sm:inline">Fast Peer Matching</span>
            </div>
          </div>
        </section>

        {/* 6. Key Highlights Grid */}
        {highlights.length > 0 && (
          <section className="w-full max-w-4xl mb-16">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              {highlights.map((item, idx) => (
                <div key={idx} className="bento-card rounded-2xl p-5 flex flex-col items-start text-left">
                  <div className="w-10 h-10 rounded-xl bg-violet-600/10 border border-violet-500/20 flex items-center justify-center mb-3">
                    <span className="material-symbols-outlined text-[20px] text-violet-400">{item.icon}</span>
                  </div>
                  <h3 className="text-sm font-semibold text-white mb-1">{item.title}</h3>
                  <p className="text-xs text-white/40 leading-relaxed">{item.desc}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* 7. Structured In-Depth Content Sections */}
        <section className="w-full max-w-4xl mb-16 flex flex-col gap-10">
          {contentSections.map((section, idx) => (
            <div key={idx} className="glass-panel rounded-3xl p-8 md:p-10 text-left">
              <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-white mb-6">
                {section.title}
              </h2>
              
              {section.paragraphs && section.paragraphs.map((p, pIdx) => (
                <p key={pIdx} className="text-sm md:text-base text-white/60 leading-relaxed mb-4 last:mb-0">
                  {p}
                </p>
              ))}

              {section.listItems && (
                <ul className="space-y-3 mt-4">
                  {section.listItems.map((item, lIdx) => (
                    <li key={lIdx} className="flex items-start gap-3 text-sm md:text-base text-white/70">
                      <span className="material-symbols-outlined text-violet-400 text-[20px] shrink-0 mt-0.5">
                        check_circle
                      </span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              )}

              {section.callout && (
                <div className="mt-6 p-4 rounded-2xl bg-violet-600/10 border border-violet-500/20 text-xs md:text-sm text-violet-200 flex items-start gap-3">
                  <span className="material-symbols-outlined text-violet-400 shrink-0">info</span>
                  <p>{section.callout}</p>
                </div>
              )}
            </div>
          ))}
        </section>

        {/* 8. Comparison Table (For Competitor Alternative Pages) */}
        {comparisonData && (
          <section className="w-full max-w-4xl mb-16">
            <div className="glass-panel rounded-3xl p-8 md:p-10 text-left">
              <div className="mb-6">
                <span className="text-xs uppercase tracking-widest text-violet-400 font-semibold">Side-by-Side Comparison</span>
                <h2 className="text-2xl md:text-3xl font-bold text-white mt-1">
                  Mingzy vs {comparisonData.competitorName}
                </h2>
                {comparisonData.competitorSubtitle && (
                  <p className="text-xs text-white/40 mt-1">{comparisonData.competitorSubtitle}</p>
                )}
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs md:text-sm border-collapse">
                  <thead>
                    <tr className="border-b border-white/10 text-white/40">
                      <th className="py-3 px-4 font-semibold">Feature / Capability</th>
                      <th className="py-3 px-4 font-semibold text-violet-300 bg-violet-500/10 rounded-t-xl">Mingzy</th>
                      <th className="py-3 px-4 font-semibold text-white/50">{comparisonData.competitorName}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {comparisonData.rows.map((row, rIdx) => (
                      <tr key={rIdx} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                        <td className="py-3.5 px-4 font-medium text-white/80">{row.feature}</td>
                        <td className="py-3.5 px-4 font-semibold text-violet-200 bg-violet-500/5">{row.mingzy}</td>
                        <td className="py-3.5 px-4 text-white/40">{row.competitor}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {comparisonData.verdict && (
                <div className="mt-6 p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-xs md:text-sm text-emerald-200 flex items-start gap-3">
                  <span className="material-symbols-outlined text-emerald-400 shrink-0">verified</span>
                  <div>
                    <span className="font-semibold block mb-0.5">The Verdict:</span>
                    <p>{comparisonData.verdict}</p>
                  </div>
                </div>
              )}
            </div>
          </section>
        )}

        {/* 9. Interactive FAQ Accordion */}
        {faqs.length > 0 && (
          <section className="w-full max-w-4xl mb-16">
            <div className="glass-panel rounded-3xl p-8 md:p-10 text-left">
              <span className="text-xs uppercase tracking-widest text-violet-400 font-semibold">Common Questions</span>
              <h2 className="text-2xl md:text-3xl font-bold text-white mt-1 mb-8">
                Frequently Asked Questions
              </h2>

              <div className="space-y-4">
                {faqs.map((faq, idx) => (
                  <div 
                    key={idx} 
                    className="border border-white/10 rounded-2xl overflow-hidden bg-white/[0.02] transition-all"
                  >
                    <button
                      onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                      className="w-full px-6 py-4 text-left flex items-center justify-between gap-4 hover:bg-white/5 transition-colors"
                    >
                      <span className="text-sm md:text-base font-semibold text-white/90">
                        {faq.question}
                      </span>
                      <span className={`material-symbols-outlined text-violet-400 shrink-0 transition-transform duration-200 ${openFaq === idx ? 'rotate-180' : ''}`}>
                        expand_more
                      </span>
                    </button>
                    {openFaq === idx && (
                      <div className="px-6 pb-5 pt-1 text-xs md:text-sm text-white/60 leading-relaxed border-t border-white/5">
                        {faq.answer}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* 10. Contextual Internal Linking Grid */}
        <SEORelatedGrid relatedLinks={relatedLinks} onNavigate={onNavigate} />

        {/* 11. Final High-Conversion Bottom CTA Banner */}
        <section className="w-full max-w-4xl mb-20 text-center">
          <div className="glass-panel rounded-3xl p-10 md:p-14 border border-violet-500/30 relative overflow-hidden glow-indigo">
            <div className="relative z-10 max-w-xl mx-auto flex flex-col items-center">
              <span className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-semibold mb-4 border border-emerald-500/20">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
                Instant Match Queue Active
              </span>
              <h2 className="text-3xl md:text-4xl font-extrabold text-white mb-4">
                {cta?.headline || 'Ready to Start Chatting with Strangers?'}
              </h2>
              <p className="text-sm md:text-base text-white/50 mb-8 leading-relaxed">
                {cta?.subtext || 'No accounts. No credit cards. Just genuine conversations in seconds.'}
              </p>
              <button
                onClick={() => handleStartWithPreset('video')}
                className="btn-primary px-10 py-4 rounded-2xl font-bold text-base flex items-center gap-3 relative z-10 shadow-xl shadow-violet-600/40"
              >
                <span className="relative z-10 flex items-center gap-2">
                  <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>videocam</span>
                  {cta?.buttonText || 'Start Chatting Now'}
                </span>
              </button>
            </div>
          </div>
        </section>

      </main>

      {/* 12. Global Comprehensive Footer */}
      <footer className="border-t border-white/[0.04] mt-auto relative z-10 bg-[#080808]/80">
        <div className="w-full px-5 md:px-10 py-12 max-w-[1280px] mx-auto flex flex-col gap-10">
          
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 lg:grid-cols-8 gap-6 text-left">
            
            {/* Col 1: Core */}
            <div>
              <h4 className="text-xs font-semibold text-white/70 uppercase tracking-wider mb-3">Core Chat</h4>
              <ul className="space-y-2 text-xs text-white/40">
                <li><button onClick={() => onNavigate('/random-video-chat')} className="hover:text-white transition-colors">Random Video</button></li>
                <li><button onClick={() => onNavigate('/talk-to-strangers')} className="hover:text-white transition-colors">Talk to Strangers</button></li>
                <li><button onClick={() => onNavigate('/anonymous-video-chat')} className="hover:text-white transition-colors">Anonymous Video</button></li>
                <li><button onClick={() => onNavigate('/random-text-chat')} className="hover:text-white transition-colors">Random Text</button></li>
                <li><button onClick={() => onNavigate('/meet-new-people')} className="hover:text-white transition-colors">Meet People</button></li>
                <li><button onClick={() => onNavigate('/stranger-chat')} className="hover:text-white transition-colors">Stranger Chat</button></li>
              </ul>
            </div>

            {/* Col 2: Alternatives */}
            <div>
              <h4 className="text-xs font-semibold text-white/70 uppercase tracking-wider mb-3">Alternatives</h4>
              <ul className="space-y-2 text-xs text-white/40">
                <li><button onClick={() => onNavigate('/alternatives/omegle-alternative')} className="hover:text-white transition-colors">Omegle Alt</button></li>
                <li><button onClick={() => onNavigate('/alternatives/ome-tv-alternative')} className="hover:text-white transition-colors">OmeTV Alt</button></li>
                <li><button onClick={() => onNavigate('/alternatives/chatroulette-alternative')} className="hover:text-white transition-colors">Chatroulette Alt</button></li>
                <li><button onClick={() => onNavigate('/alternatives/monkey-alternative')} className="hover:text-white transition-colors">Monkey Alt</button></li>
                <li><button onClick={() => onNavigate('/alternatives/emerald-chat-alternative')} className="hover:text-white transition-colors">Emerald Chat Alt</button></li>
                <li><button onClick={() => onNavigate('/alternatives/chatrandom-alternative')} className="hover:text-white transition-colors">Chatrandom Alt</button></li>
                <li><button onClick={() => onNavigate('/alternatives/camsurf-alternative')} className="hover:text-white transition-colors">Camsurf Alt</button></li>
                <li><button onClick={() => onNavigate('/alternatives/coomeet-alternative')} className="hover:text-white transition-colors">CooMeet Alt</button></li>
                <li><button onClick={() => onNavigate('/alternatives/shagle-alternative')} className="hover:text-white transition-colors">Shagle Alt</button></li>
                <li><button onClick={() => onNavigate('/alternatives/tinychat-alternative')} className="hover:text-white transition-colors">TinyChat Alt</button></li>
                <li><button onClick={() => onNavigate('/alternatives/bazoocam-alternative')} className="hover:text-white transition-colors">Bazoocam Alt</button></li>
              </ul>
            </div>

            {/* Col 3: Languages */}
            <div>
              <h4 className="text-xs font-semibold text-white/70 uppercase tracking-wider mb-3">Languages</h4>
              <ul className="space-y-2 text-xs text-white/40">
                <li><button onClick={() => onNavigate('/languages/english')} className="hover:text-white transition-colors">English Chat</button></li>
                <li><button onClick={() => onNavigate('/languages/hindi')} className="hover:text-white transition-colors">Hindi Chat</button></li>
                <li><button onClick={() => onNavigate('/languages/spanish')} className="hover:text-white transition-colors">Spanish Chat</button></li>
                <li><button onClick={() => onNavigate('/languages/french')} className="hover:text-white transition-colors">French Chat</button></li>
                <li><button onClick={() => onNavigate('/languages/german')} className="hover:text-white transition-colors">German Chat</button></li>
                <li><button onClick={() => onNavigate('/languages/portuguese')} className="hover:text-white transition-colors">Portuguese Chat</button></li>
                <li><button onClick={() => onNavigate('/languages/japanese')} className="hover:text-white transition-colors">Japanese Chat</button></li>
                <li><button onClick={() => onNavigate('/languages/arabic')} className="hover:text-white transition-colors">Arabic Chat</button></li>
                <li><button onClick={() => onNavigate('/languages/italian')} className="hover:text-white transition-colors">Italian Chat</button></li>
                <li><button onClick={() => onNavigate('/languages/korean')} className="hover:text-white transition-colors">Korean Chat</button></li>
                <li><button onClick={() => onNavigate('/languages/turkish')} className="hover:text-white transition-colors">Turkish Chat</button></li>
              </ul>
            </div>

            {/* Col 4: Countries */}
            <div>
              <h4 className="text-xs font-semibold text-white/70 uppercase tracking-wider mb-3">Countries</h4>
              <ul className="space-y-2 text-xs text-white/40">
                <li><button onClick={() => onNavigate('/countries/usa')} className="hover:text-white transition-colors">USA</button></li>
                <li><button onClick={() => onNavigate('/countries/india')} className="hover:text-white transition-colors">India</button></li>
                <li><button onClick={() => onNavigate('/countries/uk')} className="hover:text-white transition-colors">UK</button></li>
                <li><button onClick={() => onNavigate('/countries/canada')} className="hover:text-white transition-colors">Canada</button></li>
                <li><button onClick={() => onNavigate('/countries/australia')} className="hover:text-white transition-colors">Australia</button></li>
                <li><button onClick={() => onNavigate('/countries/germany')} className="hover:text-white transition-colors">Germany</button></li>
                <li><button onClick={() => onNavigate('/countries/france')} className="hover:text-white transition-colors">France</button></li>
                <li><button onClick={() => onNavigate('/countries/brazil')} className="hover:text-white transition-colors">Brazil</button></li>
                <li><button onClick={() => onNavigate('/countries/japan')} className="hover:text-white transition-colors">Japan</button></li>
                <li><button onClick={() => onNavigate('/countries/philippines')} className="hover:text-white transition-colors">Philippines</button></li>
                <li><button onClick={() => onNavigate('/countries/mexico')} className="hover:text-white transition-colors">Mexico</button></li>
                <li><button onClick={() => onNavigate('/countries/indonesia')} className="hover:text-white transition-colors">Indonesia</button></li>
              </ul>
            </div>

            {/* Col 5: Cities */}
            <div>
              <h4 className="text-xs font-semibold text-white/70 uppercase tracking-wider mb-3">Cities</h4>
              <ul className="space-y-2 text-xs text-white/40">
                <li><button onClick={() => onNavigate('/cities/new-york')} className="hover:text-white transition-colors">New York</button></li>
                <li><button onClick={() => onNavigate('/cities/london')} className="hover:text-white transition-colors">London</button></li>
                <li><button onClick={() => onNavigate('/cities/tokyo')} className="hover:text-white transition-colors">Tokyo</button></li>
              </ul>
            </div>

            {/* Col 6: Features */}
            <div>
              <h4 className="text-xs font-semibold text-white/70 uppercase tracking-wider mb-3">Features</h4>
              <ul className="space-y-2 text-xs text-white/40">
                <li><button onClick={() => onNavigate('/features/video-chat')} className="hover:text-white transition-colors">HD Video Chat</button></li>
                <li><button onClick={() => onNavigate('/features/text-chat')} className="hover:text-white transition-colors">Live Text Chat</button></li>
                <li><button onClick={() => onNavigate('/features/language-matching')} className="hover:text-white transition-colors">Language Match</button></li>
                <li><button onClick={() => onNavigate('/features/instant-matching')} className="hover:text-white transition-colors">Instant Queue</button></li>
                <li><button onClick={() => onNavigate('/features/global-chat')} className="hover:text-white transition-colors">Global Chat</button></li>
                <li><button onClick={() => onNavigate('/features/skip-and-match')} className="hover:text-white transition-colors">Skip & Next</button></li>
              </ul>
            </div>

            {/* Col 7: Safety & Legal */}
            <div>
              <h4 className="text-xs font-semibold text-white/70 uppercase tracking-wider mb-3">Trust & Safety</h4>
              <ul className="space-y-2 text-xs text-white/40">
                <li><button onClick={() => onNavigate('/safety')} className="hover:text-white transition-colors">Safety Center</button></li>
                <li><button onClick={() => onNavigate('/safety/reporting')} className="hover:text-white transition-colors">Report Abuse</button></li>
                <li><button onClick={() => onNavigate('/safety/blocking')} className="hover:text-white transition-colors">Instant Block</button></li>
                <li><button onClick={() => onNavigate('/community-guidelines')} className="hover:text-white transition-colors">Guidelines</button></li>
                <li><button onClick={() => onNavigate('/privacy')} className="hover:text-white transition-colors">Privacy Policy</button></li>
                <li><button onClick={() => onNavigate('/terms')} className="hover:text-white transition-colors">Terms of Service</button></li>
              </ul>
            </div>

            {/* Col 8: Guides */}
            <div>
              <h4 className="text-xs font-semibold text-white/70 uppercase tracking-wider mb-3">Guides</h4>
              <ul className="space-y-2 text-xs text-white/40">
                <li><button onClick={() => onNavigate('/guides/how-random-video-chat-works')} className="hover:text-white transition-colors">How Chat Works</button></li>
                <li><button onClick={() => onNavigate('/guides/random-video-chat-safety-guide')} className="hover:text-white transition-colors">Safety Guide</button></li>
                <li><button onClick={() => onNavigate('/guides/best-conversation-starters-stranger-chat')} className="hover:text-white transition-colors">50 Starters</button></li>
                <li><button onClick={() => onNavigate('/guides/language-matching-explained')} className="hover:text-white transition-colors">Language Match</button></li>
                <li><button onClick={() => onNavigate('/guides/overcoming-stranger-chat-anxiety')} className="hover:text-white transition-colors">Overcome Anxiety</button></li>
                <li><button onClick={() => onNavigate('/guides/how-to-spot-scams-and-bots-on-video-chat')} className="hover:text-white transition-colors">Spot Scams</button></li>
              </ul>
            </div>

          </div>

          <div className="flex flex-col md:flex-row justify-between items-center pt-8 border-t border-white/[0.04] text-xs text-white/30 gap-4">
            <div className="flex items-center gap-2 cursor-pointer" onClick={() => onNavigate('/')}>
              <span className="text-sm font-bold text-white/70 hover:text-white transition-colors">Mingzy</span>
              <span>— Talk to strangers around the world.</span>
            </div>
            <div>
              © 2026 Mingzy. All rights reserved.
            </div>
          </div>

        </div>
      </footer>

    </div>
  );
}
