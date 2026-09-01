/**
 * Mingzy Production Server
 * Serves the Vite build output with:
 *  - gzip / Brotli compression (fixes SEO audit error)
 *  - Long-lived asset caching (immutable hashed JS/CSS)
 *  - SPA fallback (React Router catches all routes)
 *  - Security headers (X-Frame-Options, CSP, etc.)
 *  - Canonical HTTPS redirect
 */

import express from 'express';
import compression from 'compression';
import { createReadStream, existsSync } from 'node:fs';
import { join, extname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const DIST = join(__dirname, 'dist');
const PORT = process.env.PORT || 3000;

const app = express();

// ── 1. Force HTTPS and Canonical WWW Domain on Production ───────────────────
app.use((req, res, next) => {
  const host = req.headers.host || '';
  const isWww = host.startsWith('www.');
  const isHttps = req.headers['x-forwarded-proto'] === 'https';

  if (process.env.NODE_ENV === 'production') {
    if (!isWww || (req.headers['x-forwarded-proto'] && !isHttps)) {
      const cleanHost = isWww ? host : `www.${host}`;
      return res.redirect(301, `https://${cleanHost}${req.url}`);
    }
  }
  next();
});

// ── 2. Gzip / Brotli compression (fixes SEO audit gzip error) ─────────────
app.use(compression({
  level: 6,          // balanced speed vs size
  threshold: 1024,   // compress anything > 1kB
  filter: (req, res) => {
    // Don't compress already-compressed images or fonts
    const ext = extname(req.path).toLowerCase();
    if (['.png', '.jpg', '.jpeg', '.gif', '.webp', '.avif', '.woff2'].includes(ext)) return false;
    return compression.filter(req, res);
  }
}));

// ── 3. Security headers & Permissions-Policy ──────────────────────────────
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  // Allow camera and microphone on self for WebRTC video/audio calls
  res.setHeader('Permissions-Policy', 'camera=(self), microphone=(self), display-capture=(self)');
  // Remove server fingerprint
  res.removeHeader('X-Powered-By');
  next();
});

// ── 4. Long-lived cache for hashed assets (JS/CSS with contenthash) ────────
app.use('/assets', express.static(join(DIST, 'assets'), {
  maxAge: '1y',
  immutable: true,
}));

// ── 5. Short cache for images & fonts ─────────────────────────────────────
app.use('/images', express.static(join(DIST, 'images'), {
  maxAge: '7d',
}));

// ── 6. No-cache for HTML (always fetch fresh) ─────────────────────────────
app.use(express.static(DIST, {
  maxAge: 0,
  setHeaders(res, filePath) {
    if (filePath.endsWith('.html')) {
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    }
  }
}));

// ── 7. SPA fallback — serve index.html for any unknown route ───────────────
app.get('/{*splat}', (req, res) => {
  const indexPath = join(DIST, 'index.html');
  if (existsSync(indexPath)) {
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.sendFile(indexPath);
  } else {
    res.status(503).send('Build not found. Run npm run build first.');
  }
});

// ── 8. Start ───────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`🚀 Mingzy production server running on port ${PORT}`);
  console.log(`   Serving: ${DIST}`);
  console.log(`   Compression: gzip enabled`);
});
