import React from 'react';

/**
 * SEORelatedGrid Component - Renders contextual internal linking cards
 */
export default function SEORelatedGrid({ relatedLinks = [], onNavigate }) {
  if (!relatedLinks || relatedLinks.length === 0) return null;

  return (
    <section className="w-full max-w-4xl mx-auto my-12">
      <h3 className="text-xl md:text-2xl font-bold text-white mb-6">
        Explore Related Topics & Chat Rooms
      </h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {relatedLinks.map((link) => (
          <div
            key={link.path}
            onClick={() => onNavigate && onNavigate(link.path)}
            className="p-5 rounded-2xl glass-panel border border-white/10 hover:border-violet-500/40 hover:bg-white/10 transition-all duration-300 cursor-pointer group flex flex-col justify-between"
          >
            <div>
              <h4 className="text-base font-semibold text-white group-hover:text-violet-300 transition-colors flex items-center justify-between">
                <span>{link.title}</span>
                <span className="material-symbols-outlined text-sm text-white/40 group-hover:text-violet-300 transition-transform group-hover:translate-x-1">
                  arrow_forward
                </span>
              </h4>
              {link.desc && (
                <p className="text-xs text-white/60 mt-2 line-clamp-2 leading-relaxed">
                  {link.desc}
                </p>
              )}
            </div>
            <span className="text-[11px] text-violet-400 font-medium mt-3 inline-block">
              {link.path}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}
