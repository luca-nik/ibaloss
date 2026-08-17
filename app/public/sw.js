/**
 * sw.js — The offline engine of the app ("service worker").
 *
 * A service worker is a small script the browser runs in the background.
 * This one makes the app work with no internet connection:
 *
 *   - PAGE NAVIGATIONS (opening the app) are NETWORK-FIRST: the phone always
 *     tries to download the newest version; if there is no connection, it
 *     falls back to the saved copy. This is what makes app updates arrive
 *     on their own.
 *   - STATIC FILES (the hashed JS/CSS bundles, fonts, icons) are
 *     CACHE-FIRST: their file names change with every build, so a cached
 *     copy is always the right one, and serving it is instant.
 *
 * Bump CACHE_NAME only if you want phones to throw away all cached files
 * and start fresh (it is normally NOT needed for updates anymore).
 */
const CACHE_NAME = 'ibaloss-v3';

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

/** Save a copy of the app's main page, for the next time we're offline. */
async function cacheIndex(response) {
  if (response.ok) {
    const cache = await caches.open(CACHE_NAME);
    await cache.put('./index.html', response.clone());
  }
  return response;
}

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  // Never cache API calls (cloud sync): they must always hit the network.
  if (new URL(event.request.url).pathname.startsWith('/api/')) return;

  // Opening the app: try the network first so updates show up right away;
  // offline, serve the saved copy of the main page.
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .then(cacheIndex)
        .catch(async () => {
          const cached = await caches.match('./index.html');
          if (cached) return cached;
          throw new Error('Offline and not cached');
        }),
    );
    return;
  }

  // Static files: cache first, network otherwise (and keep a copy).
  event.respondWith(
    (async () => {
      const cached = await caches.match(event.request);
      if (cached) return cached;
      const response = await fetch(event.request);
      if (response.ok) {
        const cache = await caches.open(CACHE_NAME);
        cache.put(event.request, response.clone());
      }
      return response;
    })(),
  );
});
