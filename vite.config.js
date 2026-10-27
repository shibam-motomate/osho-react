import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

import { statSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';

/* Series index: the home list only needs each series' id, name, topic, talk count and total
   length — not its ~20 talk titles and audio URLs. This plugin builds that small index from the
   full catalogue at build time (so it can never go stale) and serves it as
   `virtual:osho-index/en` / `virtual:osho-index/hi`. The English index ships in the main bundle,
   so Home can draw the list and the hero photo on first paint; the full catalogue
   (src/data/oshoData.*.js) loads quietly afterwards for talk-title search and series pages. */
function seriesIndex() {
  const PREFIX = 'virtual:osho-index/';
  const RESOLVED = '\0' + PREFIX;
  const files = {en: 'src/data/oshoData.en.js', hi: 'src/data/oshoData.hi.js'};
  const secs = d => { const p = String(d || '0:00').split(':').map(Number); return p.length === 3 ? p[0] * 3600 + p[1] * 60 + p[2] : p[0] * 60 + p[1]; };
  return {
    name: 'osho-series-index',
    resolveId(id) { return id.startsWith(PREFIX) ? RESOLVED + id.slice(PREFIX.length) : null; },
    async load(id) {
      if (!id.startsWith(RESOLVED)) return null;
      const lang = id.slice(RESOLVED.length);
      const file = fileURLToPath(new URL(files[lang], import.meta.url));
      this.addWatchFile(file);
      const mod = await import(pathToFileURL(file).href + '?v=' + statSync(file).mtimeMs);
      const list = mod[lang === 'hi' ? 'OSHO_DATA_HI' : 'OSHO_DATA_EN'];
      const index = list.map(s => ({i: s.i, n: s.n, g: s.g, c: s.e.length, td: s.e.reduce((a, e) => a + secs(e.d), 0)}));
      return `export default ${JSON.stringify(index)};`;
    },
  };
}

/* Service worker: keeps the app's code, both catalogues and the small artwork on the device,
   so reopening the app (especially from the home screen) doesn't wait on the network and the
   library still opens on a weak connection.
   - Precached on first visit: the hashed JS/CSS in assets/ (incl. both catalogues) and the
     small list artwork. A new deploy swaps them in the background.
   - The page itself (index.html) is network-first with a 3 s timeout, so a new deploy shows up
     on the next launch when online, and the cached copy opens the app offline.
   - Fonts and large artwork are cached the first time they're used.
   - Audio/video (archive.org, oshoworld.com) and Supabase are never touched. */
const serviceWorker = VitePWA({
  registerType: 'autoUpdate',
  injectRegister: 'script-defer',
  manifest: false, // public/manifest.webmanifest stays the source of truth
  workbox: {
    globPatterns: ['assets/**/*.{js,css}', 'art/*-sm.webp', 'osho-signature.webp'],
    navigateFallback: null,
    cleanupOutdatedCaches: true,
    clientsClaim: true,
    skipWaiting: true,
    runtimeCaching: [
      {
        urlPattern: ({request}) => request.mode === 'navigate',
        handler: 'NetworkFirst',
        options: {cacheName: 'pages', networkTimeoutSeconds: 3, expiration: {maxEntries: 4}},
      },
      {
        urlPattern: ({url, sameOrigin}) => sameOrigin && /^\/(fonts|art)\/[^/]+\.(woff2|webp)$/.test(url.pathname),
        handler: 'CacheFirst',
        options: {cacheName: 'static-media', expiration: {maxEntries: 80, maxAgeSeconds: 60 * 60 * 24 * 365}},
      },
    ],
  },
});

export default defineConfig({
  plugins: [react(), seriesIndex(), serviceWorker],
});
