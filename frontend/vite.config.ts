import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    // v4.10.0 — installable PWA: precached app shell + offline-tolerant
    // runtime caching. The API stays network-only (worship data must never be
    // stale-served); the free Quran text CDN and fonts cache aggressively.
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'og-image.jpg', 'robots.txt'],
      manifest: {
        name: 'Ihsan — Muslim Worship & Productivity Tracker',
        short_name: 'Ihsan',
        description:
          'Track your zikr, salat, fasting and Quran reading — with authentic references, streaks, prayer times and a friends leaderboard. Free, private, ad-free.',
        theme_color: '#0a1a0d',
        background_color: '#030609',
        display: 'standalone',
        orientation: 'portrait',
        start_url: '/',
        scope: '/',
        categories: ['lifestyle', 'productivity'],
        icons: [
          { src: '/pwa-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/pwa-512.png', sizes: '512x512', type: 'image/png' },
          { src: '/pwa-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,woff2}'],
        // SPA offline routing: serve the cached index.html for any navigation
        // that misses the precache (e.g. /zikr while offline).
        navigateFallback: 'index.html',
        // Never intercept the API — worship logs must always hit the server.
        navigateFallbackDenylist: [/^\/api\//],
        // THE MOBILE STALENESS FIX. With autoUpdate alone a new service worker
        // installs but then WAITS for every tab to close before activating. On
        // a phone the app is basically never fully closed, so users kept being
        // served the previous precached bundle — features worked on desktop
        // and silently didn't on mobile until a hard reload (this is what broke
        // "Log missed counts" there). skipWaiting + clientsClaim let the new
        // worker take over on the next load; cleanupOutdatedCaches drops the
        // superseded precache instead of letting it accumulate.
        skipWaiting: true,
        clientsClaim: true,
        cleanupOutdatedCaches: true,
        runtimeCaching: [
          {
            // Quran text + surah meta (immutable content) — cache-first, 30 days
            urlPattern: /^https:\/\/api\.alquran\.cloud\/.*/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'quran-text',
              expiration: { maxEntries: 300, maxAgeSeconds: 30 * 24 * 60 * 60 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          {
            // Google Fonts stylesheets + woff2 (Arabic reading faces)
            urlPattern: /^https:\/\/fonts\.(googleapis|gstatic)\.com\/.*/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'fonts',
              expiration: { maxEntries: 30, maxAgeSeconds: 365 * 24 * 60 * 60 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
        ],
      },
    }),
  ],
  server: { port: 5173 },
  build: {
    rollupOptions: {
      output: {
        // Split the heaviest dependencies into their own long-cacheable chunks
        // so a small app change doesn't re-download all of them.
        manualChunks: {
          // React changes far less often than our code — keeping it separate
          // means an app deploy doesn't invalidate it. It landed back in the
          // main bundle when the recharts chunk was removed, which is what
          // pushed index past the 500 kB warning.
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          firebase: ['firebase/app', 'firebase/auth', 'firebase/storage'],
          motion: ['framer-motion'],
        },
      },
    },
    // The only chunk near this line is `xlsx`, which is behind a dynamic
    // import() and downloads solely when someone exports a spreadsheet — it
    // never touches first paint. Raised so the build log stays meaningful
    // instead of crying wolf on every deploy.
    chunkSizeWarningLimit: 600,
  },
});
