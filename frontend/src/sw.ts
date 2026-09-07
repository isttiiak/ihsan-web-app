/// <reference lib="webworker" />
// Hand-written service worker (vite-plugin-pwa "injectManifest" strategy).
//
// Migrated from the plugin's auto-generated "generateSW" mode specifically to
// add push notification handling below — generateSW has no source file to
// attach a `push` event listener to. Everything above the push handlers is a
// faithful port of the previous declarative `workbox` config in
// vite.config.ts (same cache names, same expiration, same SPA fallback) so
// existing offline/caching behavior does not regress.

import {
  precacheAndRoute,
  cleanupOutdatedCaches,
  createHandlerBoundToURL,
} from 'workbox-precaching';
import { registerRoute, NavigationRoute } from 'workbox-routing';
import { CacheFirst } from 'workbox-strategies';
import { ExpirationPlugin } from 'workbox-expiration';
import { CacheableResponsePlugin } from 'workbox-cacheable-response';

declare const self: ServiceWorkerGlobalScope;

// THE MOBILE STALENESS FIX (ported from the old config's comment). With
// autoUpdate alone a new service worker installs but then WAITS for every tab
// to close before activating. On a phone the app is basically never fully
// closed, so users kept being served the previous precached bundle. Taking
// over immediately on install/activate fixes that.
self.skipWaiting();

cleanupOutdatedCaches();
precacheAndRoute(self.__WB_MANIFEST);

// SPA offline routing: serve the cached index.html for any navigation that
// misses the precache (e.g. /zikr while offline) — except the API, which must
// always hit the network (worship logs must never be stale-served).
const navigationHandler = createHandlerBoundToURL('index.html');
registerRoute(
  new NavigationRoute(navigationHandler, {
    denylist: [/^\/api\//],
  })
);

// Quran text + surah meta (immutable content) — cache-first, 30 days
registerRoute(
  ({ url }) => url.origin === 'https://api.alquran.cloud',
  new CacheFirst({
    cacheName: 'quran-text',
    plugins: [
      new ExpirationPlugin({ maxEntries: 300, maxAgeSeconds: 30 * 24 * 60 * 60 }),
      new CacheableResponsePlugin({ statuses: [0, 200] }),
    ],
  })
);

// Google Fonts stylesheets + woff2 (Arabic reading faces)
registerRoute(
  ({ url }) =>
    url.origin === 'https://fonts.googleapis.com' || url.origin === 'https://fonts.gstatic.com',
  new CacheFirst({
    cacheName: 'fonts',
    plugins: [
      new ExpirationPlugin({ maxEntries: 30, maxAgeSeconds: 365 * 24 * 60 * 60 }),
      new CacheableResponsePlugin({ statuses: [0, 200] }),
    ],
  })
);

// ── Push notifications ──────────────────────────────────────────────────────

self.addEventListener('push', (event) => {
  if (!event.data) return;
  let payload: { title?: string; body?: string; url?: string };
  try {
    payload = event.data.json() as { title?: string; body?: string; url?: string };
  } catch {
    return;
  }

  event.waitUntil(
    self.registration.showNotification(payload.title ?? 'Ihsan', {
      body: payload.body,
      icon: '/pwa-192.png',
      badge: '/pwa-192.png',
      data: { url: payload.url ?? '/' },
    })
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = (event.notification.data as { url?: string } | undefined)?.url ?? '/';

  event.waitUntil(
    (async () => {
      const allClients = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
      const existing = allClients.find((c) => new URL(c.url).pathname === url);
      if (existing) {
        await (existing as WindowClient).focus();
        return;
      }
      await self.clients.openWindow(url);
    })()
  );
});
