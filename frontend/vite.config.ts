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
        // Never intercept the API — worship logs must always hit the server.
        navigateFallbackDenylist: [/^\/api\//],
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
        // so a small app change doesn't re-download firebase/recharts.
        manualChunks: {
          firebase: ['firebase/app', 'firebase/auth', 'firebase/storage'],
          recharts: ['recharts'],
          motion: ['framer-motion'],
        },
      },
    },
  },
});
