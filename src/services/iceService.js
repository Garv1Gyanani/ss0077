/**
 * iceService.js - WebRTC ICE & TURN Configuration Utilities
 * 
 * Provides fallback STUN servers and validation utilities for WebRTC peer connections.
 */

export const DEFAULT_ICE_SERVERS = [
  { urls: 'stun:stun.cloudflare.com:3478' },
  { urls: 'stun:stun.cloudflare.com:53' },
  { urls: 'stun:stun.l.google.com:19302' },
  { urls: 'stun:stun1.l.google.com:19302' },
  { urls: 'stun:stun2.l.google.com:19302' },
  { urls: 'stun:stun.services.mozilla.com' }
];

/**
 * Resolves and sanitizes ICE server configurations.
 * If dynamic TURN servers are provided by backend matchmaking, uses them.
 * Otherwise returns the high-reliability default STUN list.
 * 
 * @param {Array<Object>|Object|null} customIceServers 
 * @returns {RTCConfiguration} WebRTC configuration object
 */
export function resolveRTCConfiguration(customIceServers) {
  let servers = DEFAULT_ICE_SERVERS;

  if (customIceServers) {
    if (Array.isArray(customIceServers) && customIceServers.length > 0) {
      servers = customIceServers;
    } else if (Array.isArray(customIceServers.iceServers) && customIceServers.iceServers.length > 0) {
      servers = customIceServers.iceServers;
    }
  }

  return {
    iceServers: servers,
    iceCandidatePoolSize: 10,
    bundlePolicy: 'max-bundle',
    rtcpMuxPolicy: 'require'
  };
}
