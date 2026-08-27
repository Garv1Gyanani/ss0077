import React from 'react';

/**
 * SEOBreadcrumbs Component - Visual navigational path with schema integration
 */
export default function SEOBreadcrumbs({ breadcrumbs = [], onNavigate }) {
  if (!breadcrumbs || breadcrumbs.length === 0) return null;

  return (
    <nav aria-label="Breadcrumb" className="w-full flex items-center gap-2 text-xs text-white/50 mb-6 flex-wrap">
      {breadcrumbs.map((crumb, idx) => {
        const isLast = idx === breadcrumbs.length - 1;
        return (
          <React.Fragment key={crumb.path || idx}>
            {idx > 0 && <span className="text-white/30">/</span>}
            {isLast ? (
              <span className="text-violet-300 font-medium truncate max-w-[200px] sm:max-w-none">
                {crumb.label}
              </span>
            ) : (
              <button
                type="button"
                onClick={() => onNavigate && onNavigate(crumb.path)}
                className="hover:text-white transition-colors cursor-pointer"
              >
                {crumb.label}
              </button>
            )}
          </React.Fragment>
        );
      })}
    </nav>
  );
}
