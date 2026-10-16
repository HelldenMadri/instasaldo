// service-worker.js — InstalaSaldo 2.0 PWA Service Worker
const CACHE_VERSION = 'instalasaldo-v3.0.0';
const STATIC_CACHE = `${CACHE_VERSION}-static`;
const DYNAMIC_CACHE = `${CACHE_VERSION}-dynamic`;

// Core static assets to pre-cache
const PRECACHE_ASSETS = [
  './',
  './index.html',
  './styles.css',
  './manifest.json',
  './icons/icon-192.png',
  './icons/logo.png',
];

// Install: pre-cache shell and immediately activate
self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => {
      return cache.addAll(PRECACHE_ASSETS).catch((err) => {
        console.warn('Falha parcial no pre-cache do SW:', err);
      });
    })
  );
});

// Activate: clean up older caches from v1/v2 and claim clients
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (!key.startsWith(CACHE_VERSION)) {
            console.log('Removendo cache antigo:', key);
            return caches.delete(key);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch Strategy
self.addEventListener('fetch', (event) => {
  const req = event.request;
  const url = new URL(req.url);

  // 1. Only handle GET requests
  if (req.method !== 'GET') return;

  // 2. CRITICAL: NEVER cache Supabase API, Auth, or Storage calls
  if (url.hostname.includes('supabase.co') || url.pathname.includes('/auth/') || url.pathname.includes('/rest/')) {
    return;
  }

  // 3. Exclude Chrome extensions
  if (url.protocol.startsWith('chrome-extension')) return;

  // 4. HTML Navigation: Network-First with Cache Fallback
  if (req.mode === 'navigate' || req.headers.get('accept')?.includes('text/html')) {
    event.respondWith(
      fetch(req)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const copy = networkResponse.clone();
            caches.open(DYNAMIC_CACHE).then((cache) => cache.put(req, copy));
          }
          return networkResponse;
        })
        .catch(() => {
          return caches.match(req).then((cached) => cached || caches.match('./index.html'));
        })
    );
    return;
  }

  // 5. Hashed assets (/assets/.*-[a-zA-Z0-9_-]+\.(js|css|png|jpg|svg)): Cache-First
  if (url.pathname.includes('/assets/')) {
    event.respondWith(
      caches.match(req).then((cached) => {
        if (cached) return cached;
        return fetch(req).then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const copy = networkResponse.clone();
            caches.open(STATIC_CACHE).then((cache) => cache.put(req, copy));
          }
          return networkResponse;
        });
      })
    );
    return;
  }

  // 6. Default Network-First for other requests
  event.respondWith(
    fetch(req)
      .then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic') {
          const copy = networkResponse.clone();
          caches.open(DYNAMIC_CACHE).then((cache) => cache.put(req, copy));
        }
        return networkResponse;
      })
      .catch(() => caches.match(req))
  );
});

// Broadcast update message
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
