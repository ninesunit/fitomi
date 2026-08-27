/* Fitomi service worker.
 *
 * Two caching strategies, chosen to match how the build is deployed:
 *
 *  - /assets/* are content-hashed and served immutable, so they are cached
 *    forever and served cache-first. A new deploy produces new filenames, so
 *    there is no staleness risk.
 *  - Everything else (the shell, the manifest, icons) is network-first with a
 *    cache fallback, so a deploy always reaches the user on their next online
 *    load, and the app still opens on the Underground with no signal.
 *
 * Firebase traffic is never intercepted — the SDK has its own offline layer
 * and caching auth or Firestore responses here would actively break it.
 */
// Replaced at build time with the build's own id. This is what makes updates
// work at all: a service worker is only reinstalled when its BYTES change, and
// a hardcoded version ships a byte-identical file on every deploy — so the new
// worker never installs and the installed app is frozen forever.
const VERSION = '__BUILD_ID__';
const SHELL = `${VERSION}-shell`;
const ASSETS = `${VERSION}-assets`;
const PRECACHE = ['/', '/index.html', '/manifest.webmanifest', '/icon-192.png', '/icon.svg'];

self.addEventListener('install', (event) => {
  // Deliberately no skipWaiting() here. Activating immediately would swap the
  // asset set underneath a hunter mid-set. The new worker waits, the app offers
  // the update, and the swap happens on their word.
  event.waitUntil(caches.open(SHELL).then((cache) => cache.addAll(PRECACHE)));
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      // Purge every cache from a previous build.
      const keys = await caches.keys();
      await Promise.all(keys.filter((k) => !k.startsWith(VERSION)).map((k) => caches.delete(k)));

      // Navigation preload shaves the worker's startup off the first request.
      if (self.registration.navigationPreload) {
        await self.registration.navigationPreload.enable().catch(() => {});
      }

      await self.clients.claim();
    })(),
  );
});

// The page asks the waiting worker to take over when the user accepts an update.
self.addEventListener('message', (event) => {
  if (event.data?.type === 'SKIP_WAITING') self.skipWaiting();
});

// Tapping a rest-timer notification should surface the session already open,
// not launch a second copy of the app.
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
      for (const client of clients) {
        if ('focus' in client) return client.focus();
      }
      return self.clients.openWindow('/workout');
    }),
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);

  // Leave Firebase, Google and font traffic entirely alone.
  if (url.origin !== self.location.origin) return;

  // Hashed build output: cache-first, forever.
  if (url.pathname.startsWith('/assets/')) {
    event.respondWith(
      caches.match(request).then(
        (hit) =>
          hit ||
          fetch(request).then((res) => {
            const copy = res.clone();
            caches.open(ASSETS).then((c) => c.put(request, copy));
            return res;
          }),
      ),
    );
    return;
  }

  // Navigations and the shell: network-first so a deploy is picked up, with the
  // cache as the offline fallback.
  event.respondWith(
    fetch(request)
      .then((res) => {
        const copy = res.clone();
        caches.open(SHELL).then((c) => c.put(request, copy));
        return res;
      })
      .catch(() =>
        caches.match(request).then((hit) => hit || caches.match('/index.html')),
      ),
  );
});
