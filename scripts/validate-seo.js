// ============================================================================
// Mingzy Automated SEO Integrity Test Suite
// Rigorous static and build validation for enterprise SEO conformance
// Evaluates all routes dynamically against the Tier A / Tier B Launch Gate
// ============================================================================

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { SEO_PAGES, generateFullJsonLd, getIndexablePages, validateSEOPageGate } from '../src/data/seoEngine.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const distDir = path.join(rootDir, 'dist');
const sitemapPath = path.join(rootDir, 'public/sitemap.xml');
const baseUrl = 'https://www.mingzy.space';

let totalTests = 0;
let passedTests = 0;
const errors = [];

function assert(condition, message) {
  totalTests++;
  if (condition) {
    passedTests++;
  } else {
    errors.push(`❌ ${message}`);
  }
}

console.log('🔍 Running Mingzy Enterprise SEO Integrity Test Suite...\n');

// ----------------------------------------------------------------------------
// TEST GROUP 1: Dynamic Route & Launch Gate Mathematics
// ----------------------------------------------------------------------------
const allRoutes = Object.keys(SEO_PAGES);
const indexableRoutes = getIndexablePages();
const noindexRoutes = Object.values(SEO_PAGES).filter(p => p.indexable === false);

assert(allRoutes.length > 50, `Expected comprehensive route catalog (> 50), found ${allRoutes.length}`);
assert(indexableRoutes.length > 30, `Expected active Tier A indexable routes (> 30), found ${indexableRoutes.length}`);
assert(noindexRoutes.length > 0, `Expected staged Tier B noindex routes (> 0), found ${noindexRoutes.length}`);
assert(indexableRoutes.length + noindexRoutes.length === allRoutes.length, 'Sum of indexable + noindex routes must equal total routes');

// Unique Paths & Canonical Check
const uniquePaths = new Set(allRoutes);
assert(uniquePaths.size === allRoutes.length, 'Detected duplicate path keys in SEO_PAGES');

// ----------------------------------------------------------------------------
// TEST GROUP 2: Metadata Uniqueness, Standards & Launch Gate Compliance
// ----------------------------------------------------------------------------
const titles = new Map();
const descriptions = new Map();

for (const [route, page] of Object.entries(SEO_PAGES)) {
  // Launch Gate Validation
  const gateResult = validateSEOPageGate(page);
  assert(gateResult.isValid, `Page ${route} failed Launch Gate validation: ${gateResult.issues.join(', ')}`);

  // Path conformance
  assert(page.path === route, `Route mismatch: key "${route}" !== page.path "${page.path}"`);
  assert(page.path.startsWith('/'), `Path must start with "/": ${page.path}`);

  // Title tag checks
  assert(!!page.metaTitle && page.metaTitle.trim().length > 0, `Missing metaTitle on ${route}`);
  if (page.metaTitle) {
    assert(page.metaTitle.length >= 15 && page.metaTitle.length <= 80, `Meta title length out of bounds (15-80 chars) on ${route}: "${page.metaTitle}" (${page.metaTitle.length})`);
    if (titles.has(page.metaTitle)) {
      errors.push(`❌ Duplicate metaTitle found between ${route} and ${titles.get(page.metaTitle)}`);
    } else {
      titles.set(page.metaTitle, route);
    }
  }

  // Meta description checks
  assert(!!page.metaDescription && page.metaDescription.trim().length > 0, `Missing metaDescription on ${route}`);
  if (page.metaDescription) {
    assert(page.metaDescription.length >= 50 && page.metaDescription.length <= 220, `Meta description length out of bounds (50-220 chars) on ${route}: (${page.metaDescription.length} chars)`);
    if (descriptions.has(page.metaDescription)) {
      errors.push(`❌ Duplicate metaDescription found between ${route} and ${descriptions.get(page.metaDescription)}`);
    } else {
      descriptions.set(page.metaDescription, route);
    }
  }

  // H1 and Subtitle
  assert(!!page.h1 && page.h1.trim().length > 0, `Missing H1 on ${route}`);
  assert(!!page.heroSubtitle && page.heroSubtitle.trim().length > 0, `Missing heroSubtitle on ${route}`);

  // Intent validity
  const validIntents = ['transactional', 'commercial', 'informational', 'navigational'];
  assert(validIntents.includes(page.intent), `Invalid search intent "${page.intent}" on ${route}`);

  // Forbidden Fabricated Stats check
  assert(!page.stats, `FORBIDDEN fabricated stats object found on ${route}`);

  // Internal link integrity
  if (page.relatedLinks && page.relatedLinks.length > 0) {
    for (const link of page.relatedLinks) {
      assert(link.path === '/' || SEO_PAGES[link.path] !== undefined, `Broken internal link on ${route} -> pointing to non-existent "${link.path}"`);
    }
  }
}

// ----------------------------------------------------------------------------
// TEST GROUP 3: Structured Data (JSON-LD) Validation
// ----------------------------------------------------------------------------
for (const [route, page] of Object.entries(SEO_PAGES)) {
  try {
    const schemas = generateFullJsonLd(page, baseUrl);
    assert(Array.isArray(schemas) && schemas.length > 0, `Failed to generate schemas for ${route}`);
    
    // Check no aggregate rating spam
    for (const schema of schemas) {
      assert(schema['@context'] === 'https://schema.org', `Invalid schema @context on ${route}`);
      assert(!schema.aggregateRating, `FORBIDDEN aggregateRating detected on ${route} schema`);
    }
  } catch (err) {
    errors.push(`❌ Schema generation threw error on ${route}: ${err.message}`);
  }
}

// ----------------------------------------------------------------------------
// TEST GROUP 4: Sitemap & Robots Directive Integrity
// ----------------------------------------------------------------------------
if (fs.existsSync(sitemapPath)) {
  const sitemapXml = fs.readFileSync(sitemapPath, 'utf8');

  // Ensure all Tier A pages are in sitemap
  for (const page of indexableRoutes) {
    const expectedUrl = `${baseUrl}${page.path}`;
    assert(sitemapXml.includes(`<loc>${expectedUrl}</loc>`), `Tier A indexable page missing from sitemap.xml: ${expectedUrl}`);
  }

  // Ensure ZERO Tier B (noindex) pages are in sitemap
  for (const page of noindexRoutes) {
    const forbiddenUrl = `${baseUrl}${page.path}`;
    assert(!sitemapXml.includes(`<loc>${forbiddenUrl}</loc>`), `Tier B NOINDEX page improperly present in sitemap.xml: ${forbiddenUrl}`);
  }
} else {
  errors.push(`❌ sitemap.xml not found at ${sitemapPath}`);
}

// ----------------------------------------------------------------------------
// TEST GROUP 5: Static Pre-Rendered HTML Verification (if dist/ exists)
// ----------------------------------------------------------------------------
if (fs.existsSync(distDir)) {
  const samplePagesToCheck = [
    { path: '/random-video-chat', shouldIndex: true },
    { path: '/omegle-alternative-no-login', shouldIndex: true },
    { path: '/random-video-chat-no-signup', shouldIndex: true },
    { path: '/browser-video-chat', shouldIndex: true },
    { path: '/language-exchange/english-spanish', shouldIndex: true },
    { path: '/language-exchange/hindi-english', shouldIndex: true },
    { path: '/guides/omegle-alternatives-guide', shouldIndex: true },
    { path: '/guides/anonymous-video-chat-guide', shouldIndex: true },
    { path: '/languages/hindi', shouldIndex: true },
    { path: '/countries/india', shouldIndex: true },
    { path: '/alternatives/omegle-alternative', shouldIndex: true },
    { path: '/guides/random-video-chat-safety-guide', shouldIndex: true },
    { path: '/stranger-chat-no-registration', shouldIndex: false }, // Tier B (noindex)
    { path: '/language-exchange/stranger-chat', shouldIndex: false }, // Tier B (noindex)
    { path: '/cities/new-york', shouldIndex: false } // Tier B (noindex)
  ];

  for (const sample of samplePagesToCheck) {
    const cleanRoute = sample.path.replace(/^\//, '');
    const htmlFile = path.join(distDir, cleanRoute, 'index.html');
    
    assert(fs.existsSync(htmlFile), `Pre-rendered HTML file missing at ${htmlFile}`);

    if (fs.existsSync(htmlFile)) {
      const htmlContent = fs.readFileSync(htmlFile, 'utf8');
      
      // Verify real text in body, not empty root
      assert(!htmlContent.includes('<div id="root"></div>'), `Pre-rendered HTML contains empty <div id="root"></div> on ${sample.path}`);
      assert(htmlContent.includes('<h1'), `Pre-rendered HTML missing <h1 tag on ${sample.path}`);
      assert(htmlContent.includes('application/ld+json'), `Pre-rendered HTML missing JSON-LD schema on ${sample.path}`);
      
      // Verify robots directive
      if (sample.shouldIndex) {
        assert(htmlContent.includes('content="index, follow'), `Expected "index, follow" robots meta on ${sample.path}`);
      } else {
        assert(htmlContent.includes('content="noindex, follow"'), `Expected "noindex, follow" robots meta on ${sample.path}`);
      }
    }
  }
}

// ----------------------------------------------------------------------------
// SUMMARY & EXIT
// ----------------------------------------------------------------------------
console.log(`\n======================================================`);
console.log(`📊 Total Assertions: ${totalTests} | Passed: ${passedTests} | Failed: ${errors.length}`);
console.log(`======================================================\n`);

if (errors.length > 0) {
  console.error('❌ SEO INTEGRITY VALIDATION FAILED:');
  errors.forEach(err => console.error(err));
  process.exit(1);
} else {
  console.log('✅ ALL SEO INTEGRITY TESTS PASSED FLAWLESSLY! (0 errors, 0 warnings)');
  console.log(`🏆 Launch Gate Status: ${indexableRoutes.length} Tier A Indexable • ${noindexRoutes.length} Tier B Staged • 100% Validated\n`);
}
