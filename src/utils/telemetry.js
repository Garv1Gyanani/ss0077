// ============================================================================
// Mingzy Anonymous Telemetry & Multi-Channel Acquisition Engine
// Dispatches privacy-first visitor and acquisition signals to backend
// Zero Personal Identifiable Information (PII) is stored or collected
// ============================================================================

/**
 * Infer Acquisition Channel (Organic vs Social vs Direct vs Referral)
 */
export function inferAcquisitionSource(referrer = '', utmSource = '') {
  const ref = (referrer || '').toLowerCase();
  const utm = (utmSource || '').toLowerCase();

  if (utm.includes('tiktok') || ref.includes('tiktok.com') || ref.includes('bytedance')) {
    return 'tiktok';
  }
  if (utm.includes('instagram') || ref.includes('instagram.com') || ref.includes('ig')) {
    return 'instagram';
  }
  if (utm.includes('youtube') || ref.includes('youtube.com') || ref.includes('youtu.be')) {
    return 'youtube';
  }
  if (utm.includes('reddit') || ref.includes('reddit.com')) {
    return 'reddit';
  }
  if (utm.includes('twitter') || utm.includes('x') || ref.includes('t.co') || ref.includes('x.com') || ref.includes('twitter.com')) {
    return 'twitter';
  }
  if (
    utm.includes('google') ||
    ref.includes('google.') ||
    ref.includes('bing.com') ||
    ref.includes('duckduckgo.com') ||
    ref.includes('yahoo.com') ||
    ref.includes('ecosia.org') ||
    ref.includes('yandex.') ||
    ref.includes('baidu.com')
  ) {
    return 'organic';
  }
  if (!referrer && !utmSource) {
    return 'direct';
  }
  return 'referral';
}

/**
 * Infer Country from TimeZone approximation (supplemented by backend IP headers)
 */
function inferCountryFromTimezone() {
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || '';
    if (tz.includes('Calcutta') || tz.includes('Kolkata') || tz.includes('India')) return 'India';
    if (tz.includes('New_York') || tz.includes('Chicago') || tz.includes('Los_Angeles') || tz.includes('Denver')) return 'USA';
    if (tz.includes('London')) return 'UK';
    if (tz.includes('Toronto') || tz.includes('Vancouver')) return 'Canada';
    if (tz.includes('Sydney') || tz.includes('Melbourne')) return 'Australia';
    if (tz.includes('Berlin') || tz.includes('Frankfurt')) return 'Germany';
    if (tz.includes('Paris')) return 'France';
    if (tz.includes('Sao_Paulo')) return 'Brazil';
    if (tz.includes('Tokyo')) return 'Japan';
    if (tz.includes('Manila')) return 'Philippines';
    return 'Global';
  } catch {
    return 'Global';
  }
}

/**
 * Get or create ephemeral anonymous user ID
 */
export function getAnonymousUserId() {
  try {
    let id = localStorage.getItem('mingzy_anonymous_id');
    if (!id) {
      id = `usr_${Math.random().toString(36).substring(2, 11)}_${Date.now().toString(36)}`;
      localStorage.setItem('mingzy_anonymous_id', id);
    }
    return id;
  } catch {
    return `usr_${Date.now()}`;
  }
}

/**
 * Get or store first visit acquisition source
 */
export function getFirstVisitSource() {
  try {
    let firstSource = localStorage.getItem('mingzy_first_source');
    if (!firstSource) {
      const searchParams = new URLSearchParams(window.location.search);
      firstSource = inferAcquisitionSource(document.referrer, searchParams.get('utm_source') || '');
      localStorage.setItem('mingzy_first_source', firstSource);
    }
    return firstSource;
  } catch {
    return 'unknown';
  }
}

/**
 * Generic non-blocking event dispatcher
 */
import { logFirebaseEvent } from '../firebase';

export function trackEvent(eventName, customPayload = {}) {
  try {
    const anonymousUserId = getAnonymousUserId();
    const referrer = document.referrer || '';
    const searchParams = new URLSearchParams(window.location.search);
    const utmSource = searchParams.get('utm_source') || '';
    const acquisitionChannel = inferAcquisitionSource(referrer, utmSource);
    const firstVisitSource = getFirstVisitSource();
    const country = inferCountryFromTimezone();
    const language = navigator.language ? navigator.language.split('-')[0].toUpperCase() : 'EN';
    const backendUrl = import.meta.env.VITE_BACKEND_URL || 'https://ss0088-production.up.railway.app';

    const eventData = {
      anonymousUserId,
      currentPath: window.location.pathname,
      acquisitionChannel,
      firstVisitSource,
      referrer,
      utmSource,
      country,
      language,
      deviceType: window.innerWidth < 768 ? 'mobile' : 'desktop',
      timestamp: new Date().toISOString(),
      ...customPayload
    };

    // 1. Dual dispatch to Firebase Analytics
    logFirebaseEvent(eventName, eventData);

    // 2. Dispatch to custom backend telemetry endpoint
    fetch(`${backendUrl}/api/analytics/event`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        eventName,
        payload: eventData
      }),
      keepalive: true
    }).catch(() => {
      // Non-blocking telemetry failure gracefully ignored
    });
  } catch {
    // Suppress telemetry errors in client
  }
}

/**
 * Track initial visitor arrival and check for return visits
 */
export function trackVisitorArrival(pathname = window.location.pathname) {
  try {
    const searchParams = new URLSearchParams(window.location.search);
    const acquisitionChannel = inferAcquisitionSource(document.referrer, searchParams.get('utm_source') || '');
    
    trackEvent('seo_landing_view', { 
      landingPage: pathname,
      acquisitionChannel 
    });

    // Check for client-side revisit signal
    const lastVisit = localStorage.getItem('mingzy_last_visit');
    const now = Date.now();
    if (lastVisit) {
      const elapsedHours = (now - parseInt(lastVisit, 10)) / (1000 * 60 * 60);
      if (elapsedHours > 1) {
        trackEvent('client_revisit_signal', { elapsedHours: Math.round(elapsedHours) });
      }
    }
    localStorage.setItem('mingzy_last_visit', now.toString());
  } catch {
    // Ignore in client
  }
}

/**
 * Track Call-to-Action clicks from SEO and Landing pages
 */
export function trackSEOCTAClick(buttonType, targetMode, sourcePath = window.location.pathname) {
  trackEvent('seo_cta_click', {
    buttonType,
    targetMode,
    sourcePath
  });
}

/**
 * Track matchmaking queue entrance
 */
export function trackChatStart(chatMode, language = 'Any', region = 'Worldwide', vibe = 'All Vibes') {
  trackEvent('chat_start', {
    chatMode,
    language,
    region,
    vibe
  });
}

/**
 * Track successful WebRTC peer-to-peer media connection
 */
export function trackWebRTCSuccess(partnerId, initiator) {
  trackEvent('webRTC_connection_success', {
    partnerId: partnerId ? partnerId.substring(0, 6) : 'anonymous',
    initiator: !!initiator
  });
}

/**
 * Track chat session completion with duration
 */
export function trackChatSessionComplete(durationSeconds, mode = 'video', endReason = 'user_next') {
  trackEvent('chat_session_complete', {
    durationSeconds: Math.max(0, Math.round(durationSeconds)),
    mode,
    endReason
  });
}
