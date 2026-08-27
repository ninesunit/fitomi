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
const VERSION = 'fitomi-v1';
const SHELL = `${VERSION}-shell`;
const ASSETS = `${VERSION}-assets`;
const PRECACHE = ['/', '/index.html', '/manifest.webmanifest', '/icon-192.png', '/icon.svg'];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(SHELL).then((cache) => cache.addAll(PRECACHE)).then(() => self.skipWaiting()),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => !k.startsWith(VERSION)).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
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
