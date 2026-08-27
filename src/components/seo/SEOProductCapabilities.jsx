import React from 'react';

/**
 * SEOProductCapabilities Component
 * Renders user-friendly platform capabilities and benefits (clean, zero technical jargon)
 */
export default function SEOProductCapabilities({ capabilities = [] }) {
  const defaultCapabilities = [
    { label: 'Matching', value: 'Instant Connect', icon: 'bolt' },
    { label: 'Speed', value: 'Fast Matching', icon: 'timer' },
    { label: 'Privacy', value: '100% Private & Secure', icon: 'lock' },
    { label: 'Access', value: 'No Sign Up Needed', icon: 'shield' }
  ];

  const items = capabilities && capabilities.length > 0 
    ? capabilities 
    : defaultCapabilities;

  return (
    <div className="w-full max-w-4xl mx-auto my-8 p-6 rounded-2xl glass-panel border border-white/10 grid grid-cols-2 sm:grid-cols-4 gap-6 text-center">
      {items.map((item, idx) => (
        <div key={idx} className="flex flex-col items-center">
          <div className="text-violet-300 font-bold text-lg md:text-xl tracking-tight">
            {item.value}
          </div>
          <span className="text-xs text-white/50 uppercase tracking-wider font-semibold mt-1">
            {item.label}
          </span>
        </div>
      ))}
    </div>
  );
}
