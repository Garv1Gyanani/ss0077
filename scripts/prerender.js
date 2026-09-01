// ============================================================================
// Mingzy Static Pre-Rendering (SSG) Engine
// Generates fully-rendered HTML files with static metadata & semantic markup for every SEO route
// ============================================================================

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { SEO_PAGES, generateFullJsonLd, getIndexablePages } from '../src/data/seoEngine.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const distDir = path.resolve(__dirname, '../dist');
const baseUrl = 'https://www.mingzy.space';

async function prerender() {
  console.log('🚀 Starting Mingzy Static Pre-Rendering (SSG)...');

  const templatePath = path.join(distDir, 'index.html');
  if (!fs.existsSync(templatePath)) {
    console.error('❌ dist/index.html not found. Run `vite build` first.');
    process.exit(1);
  }

  const baseHtml = fs.readFileSync(templatePath, 'utf8');

  let generatedCount = 0;

  for (const [routePath, page] of Object.entries(SEO_PAGES)) {
    const fullUrl = `${baseUrl}${routePath}`;
    const defaultImage = page.openGraph?.image ? `${baseUrl}${page.openGraph.image}` : `${baseUrl}/icons.svg`;
    const robotsDirective = page.indexable ? 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1' : 'noindex, follow';

    // 1. Generate Structured Schemas
    const schemas = generateFullJsonLd(page, baseUrl);
    const jsonLdScripts = schemas.map(schema => `<script type="application/ld+json">${JSON.stringify(schema)}</script>`).join('\n  ');

    // 2. Build Head Meta Tags
    const headInjections = `
  <title>${escapeHtml(page.metaTitle)}</title>
  <meta name="description" content="${escapeHtml(page.metaDescription)}" />
  <meta name="robots" content="${robotsDirective}" />
  <link rel="canonical" href="${fullUrl}" />
  <link rel="alternate" type="text/plain" href="${baseUrl}/llms.txt" />
  <meta name="google-site-verification" content="GSC_VERIFICATION_TOKEN_PLACEHOLDER" />
  
  <!-- OpenGraph Meta Tags -->
  <meta property="og:title" content="${escapeHtml(page.openGraph?.title || page.metaTitle)}" />
  <meta property="og:description" content="${escapeHtml(page.openGraph?.description || page.metaDescription)}" />
  <meta property="og:url" content="${fullUrl}" />
  <meta property="og:site_name" content="Mingzy" />
  <meta property="og:type" content="${page.openGraph?.type || (page.schemaType === 'Article' ? 'article' : 'website')}" />
  <meta property="og:image" content="${defaultImage}" />
  <meta property="og:image:width" content="1200" />
  <meta property="og:image:height" content="630" />
  ${page.openGraph?.imageAlt ? `<meta property="og:image:alt" content="${escapeHtml(page.openGraph.imageAlt)}" />` : ''}

  <!-- Twitter Card Tags -->
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="${escapeHtml(page.openGraph?.title || page.metaTitle)}" />
  <meta name="twitter:description" content="${escapeHtml(page.openGraph?.description || page.metaDescription)}" />
  <meta name="twitter:image" content="${defaultImage}" />

  <!-- Structured Data JSON-LD Schemas -->
  ${jsonLdScripts}
`;

    // 3. Build Semantic Pre-Rendered Body
    const preRenderedBody = `
    <div id="ssr-container" class="min-h-screen bg-[#0a0a0a] text-white p-6 max-w-4xl mx-auto">
      ${page.breadcrumbs && page.breadcrumbs.length > 0 ? `
      <nav aria-label="Breadcrumb" class="mb-4 text-xs text-white/50 flex items-center gap-2">
        ${page.breadcrumbs.map((b, i) => `
          <a href="${b.path}" class="hover:text-white">${escapeHtml(b.label)}</a>
          ${i < page.breadcrumbs.length - 1 ? '<span>/</span>' : ''}
        `).join('')}
      </nav>
      ` : ''}

      <header class="mb-8">
        <span class="text-xs uppercase tracking-widest text-violet-400 font-semibold">${escapeHtml(page.badgeText || 'Instant Match • Free')}</span>
        <h1 class="text-4xl md:text-5xl font-extrabold mt-2 text-white">${escapeHtml(page.h1)}</h1>
        <p class="text-base md:text-lg text-white/70 mt-4 leading-relaxed">${escapeHtml(page.heroSubtitle)}</p>
      </header>

      ${page.highlights && page.highlights.length > 0 ? `
      <section class="grid grid-cols-1 sm:grid-cols-2 gap-4 my-8">
        ${page.highlights.map(h => `
          <div class="p-4 rounded-xl border border-white/10 bg-white/5">
            <h3 class="text-sm font-bold text-white">${escapeHtml(h.title)}</h3>
            <p class="text-xs text-white/60 mt-1">${escapeHtml(h.desc)}</p>
          </div>
        `).join('')}
      </section>
      ` : ''}

      ${page.contentSections && page.contentSections.length > 0 ? `
      <section class="space-y-6 my-8">
        ${page.contentSections.map(cs => `
          <div class="p-6 rounded-2xl border border-white/10 bg-white/[0.02]">
            <h2 class="text-2xl font-bold text-white mb-3">${escapeHtml(cs.title)}</h2>
            ${cs.paragraphs ? cs.paragraphs.map(p => `<p class="text-sm text-white/70 mb-3 leading-relaxed">${escapeHtml(p)}</p>`).join('') : ''}
            ${cs.listItems ? `<ul class="list-disc pl-5 space-y-1 text-sm text-white/70">${cs.listItems.map(li => `<li>${escapeHtml(li)}</li>`).join('')}</ul>` : ''}
          </div>
        `).join('')}
      </section>
      ` : ''}

      ${page.faqs && page.faqs.length > 0 ? `
      <section class="my-8">
        <h2 class="text-2xl font-bold text-white mb-4">Frequently Asked Questions</h2>
        <div class="space-y-3">
          ${page.faqs.map(faq => `
            <div class="p-4 rounded-xl border border-white/10 bg-white/5">
              <h3 class="text-sm font-semibold text-white">${escapeHtml(faq.question)}</h3>
              <p class="text-xs text-white/60 mt-1">${escapeHtml(faq.answer)}</p>
            </div>
          `).join('')}
        </div>
      </section>
      ` : ''}

      ${page.relatedLinks && page.relatedLinks.length > 0 ? `
      <nav aria-label="Related Topics" class="my-8 pt-6 border-t border-white/10">
        <h3 class="text-sm font-semibold text-white/80 mb-3">Explore Related Conversations</h3>
        <div class="flex flex-wrap gap-2">
          ${page.relatedLinks.map(rel => `
            <a href="${rel.path}" class="text-xs px-3 py-1.5 rounded-lg border border-white/10 hover:border-violet-500/40 text-white/70 hover:text-white transition-colors">
              ${escapeHtml(rel.label)}
            </a>
          `).join('')}
        </div>
      </nav>
      ` : ''}
    </div>
`;

    // 4. Inject into Base HTML template
    let pageHtml = baseHtml;

    // Replace <title>...</title>
    pageHtml = pageHtml.replace(/<title>.*?<\/title>/i, '');

    // Inject Head tags before </head>
    pageHtml = pageHtml.replace('</head>', `${headInjections}\n</head>`);

    // Inject semantic content into <div id="root">
    pageHtml = pageHtml.replace('<div id="root"></div>', `<div id="root">${preRenderedBody}</div>`);

    // 5. Write to Destination directory
    const cleanRoute = routePath.replace(/^\//, '');
    const outDir = path.join(distDir, cleanRoute);

    if (!fs.existsSync(outDir)) {
      fs.mkdirSync(outDir, { recursive: true });
    }

    fs.writeFileSync(path.join(outDir, 'index.html'), pageHtml, 'utf8');
    generatedCount++;
  }

  console.log(`✅ Pre-rendered ${generatedCount} static HTML pages in dist/!`);
  console.log(`📊 Tier A Indexable Pages: ${getIndexablePages().length} / ${Object.keys(SEO_PAGES).length} Total Pages`);
}

function escapeHtml(str) {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

prerender();
