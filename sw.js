const CACHE_NAME = 'touchstone-v14';
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './styles.css',
  './app.js',
  './manifest.json',
  './icon-192.png',
  './icon-512.png',
  './data/topics.json'
];

// Install: cache the app shell, bypassing the HTTP cache so a new
// CACHE_NAME really does deliver fresh files.
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache =>
      cache.addAll(ASSETS_TO_CACHE.map(url => new Request(url, { cache: 'reload' })))
    )
  );
  self.skipWaiting();
});

// Activate: drop old caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => Promise.all(
      keys.map(key => (key !== CACHE_NAME ? caches.delete(key) : undefined))
    ))
  );
  self.clients.claim();
});

// Fetch: fresh content from the network, cached shell/assets for offline
self.addEventListener('fetch', event => {
  const req = event.request;

  // Let the browser handle non-GET, non-http and the dictionary API
  if (req.method !== 'GET' || !req.url.startsWith('http') || req.url.includes('api.mymemory')) return;

  const url = new URL(req.url);
  const isContent =
    req.mode === 'navigate' ||
    url.pathname.endsWith('/') ||
    url.pathname.endsWith('.html') ||
    url.pathname.endsWith('.json');

  const putInCache = res => {
    if (res && res.ok) {
      const copy = res.clone();
      caches.open(CACHE_NAME).then(cache => cache.put(req, copy)).catch(() => {});
    }
    return res;
  };

  if (isContent) {
    // Network first so a new deploy is visible immediately; fall back to cache offline
    event.respondWith(
      fetch(req, { cache: 'no-store' })
        .then(putInCache)
        .catch(() => caches.match(req).then(hit => {
          if (hit) return hit;
          if (req.mode === 'navigate') return caches.match('./index.html');
          return Response.error();
        }))
    );
    return;
  }

  // Static assets: cache first, then fill the cache from the network
  event.respondWith(
    caches.match(req).then(hit => hit || fetch(req).then(putInCache))
  );
});
