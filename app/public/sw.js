/**
 * sw.js — The offline engine of the app ("service worker").
 *
 * A service worker is a small script the browser runs in the background.
 * This one does a simple job: the first time you open the app, every file
 * that gets downloaded is also stored in a local cache. From then on,
 * files are served from that cache first — so the app opens instantly and
 * works with no internet connection at all.
 *
 * Bump CACHE_NAME whenever you want phones to throw away old cached files
 * and download everything fresh.
 */
const CACHE_NAME = 'il-mio-francese-v1';

// Take control as soon as possible after an update.
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      // Delete caches from older versions of the app.
      const names = await caches.keys();
      await Promise.all(names.filter((n) => n !== CACHE_NAME).map((n) => caches.delete(n)));
      await self.clients.claim();
    })(),
  );
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  event.respondWith(
    (async () => {
      // 1) Try the cache first: instant and offline-friendly.
      const cached = await caches.match(event.request);
      if (cached) return cached;

      // 2) Otherwise go to the network, and keep a copy for next time.
      try {
        const response = await fetch(event.request);
        if (response.ok) {
          const cache = await caches.open(CACHE_NAME);
          cache.put(event.request, response.clone());
        }
        return response;
      } catch {
        // 3) Offline and not cached: for page navigations, fall back to the
        //    app's main page so the app still opens.
        if (event.request.mode === 'navigate') {
          const fallback = await caches.match('./index.html');
          if (fallback) return fallback;
        }
        throw new Error('Offline and not cached');
      }
    })(),
  );
});
