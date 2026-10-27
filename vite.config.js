import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

/* The English catalogue (src/data/oshoData.en.js) is a lazy chunk, so normally the browser
   only asks for it after the main script has downloaded and run. Home opens on English, so
   tell the browser about it in index.html and both download in parallel. */
function preloadEnglishCatalogue() {
  return {
    name: 'preload-english-catalogue',
    apply: 'build',
    transformIndexHtml: {
      order: 'post',
      handler(html, {bundle}) {
        const chunk = bundle && Object.values(bundle).find(c => c.type === 'chunk' && c.name === 'oshoData.en');
        if (!chunk) return html;
        return [{tag: 'link', attrs: {rel: 'modulepreload', crossorigin: true, href: `/${chunk.fileName}`}, injectTo: 'head'}];
      },
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
  plugins: [react(), preloadEnglishCatalogue(), serviceWorker],
});
