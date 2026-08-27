// ============================================================================
// Mingzy Anonymous Telemetry & SEO Tracking Engine
// Dispatches privacy-first visitor and acquisition signals to backend
// ============================================================================

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
 * Track visitor arrival and acquisition source
 */
export function trackVisitorArrival(pathname = window.location.pathname) {
  try {
    const anonymousUserId = getAnonymousUserId();
    const referrer = document.referrer || '';
    const searchParams = new URLSearchParams(window.location.search);
    const utmSource = searchParams.get('utm_source') || '';
    const country = inferCountryFromTimezone();
    const language = navigator.language ? navigator.language.split('-')[0].toUpperCase() : 'EN';

    const backendUrl = import.meta.env.VITE_BACKEND_URL || 'https://ss0088-production.up.railway.app';

    fetch(`${backendUrl}/api/analytics/event`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        eventName: 'visitor_arrived',
        payload: {
          anonymousUserId,
          landingPage: pathname,
          referrer,
          utmSource,
          country,
          language,
          userAgent: navigator.userAgent
        }
      }),
      keepalive: true
    }).catch(() => {
      // Non-blocking telemetry
    });
  } catch {
    // Ignore telemetry errors in client
  }
}
