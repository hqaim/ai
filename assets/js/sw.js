/* =========================================================
   THE AI ARTISAN — SERVICE WORKER
   Scope: root (place this file at /sw.js)
   Strategies:
     - HTML: network-first (fresh), fallback to cache
     - CSS/JS: stale-while-revalidate
     - Images: cache-first (bounded)
   Auto-clears old versions on activate.
   ========================================================= */

const SW_VERSION = 'aiartisan-sw-v1.0.0-2025-10-26';
const STATIC_CACHE = `${SW_VERSION}::static`;
const RUNTIME_CACHE = `${SW_VERSION}::runtime`;
const IMAGE_CACHE = `${SW_VERSION}::images`;
const CACHE_ALLOWLIST_PREFIX = 'aiartisan-sw-';

// Core assets to precache (safe, small, stable)
const CORE_ASSETS = [
  '/',                       // GitHub Pages will serve index.html for /
  '/index.html',
  '/toc.html',
  '/assets/style.css',
  '/assets/js/theme.js',
  '/assets/js/copy.js',
  '/assets/js/premium.js',
  '/assets/js/auth.js',
  '/assets/images/HQAIM-ICON-AI.svg',
  '/assets/images/favicon.ico'
];

// ----- Install: precache core assets -----
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then(cache => cache.addAll(CORE_ASSETS))
      .then(() => self.skipWaiting())
  );
});

// ----- Activate: remove old caches, take control -----
self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(
      keys.map(key => {
        const isOurCache = key.startsWith(CACHE_ALLOWLIST_PREFIX);
        const isCurrent = key.startsWith(SW_VERSION);
        if (isOurCache && !isCurrent) {
          return caches.delete(key);
        }
      })
    );
    await self.clients.claim();
  })());
});

// Utility: classify requests
const isNavigationRequest = (request) =>
  request.mode === 'navigate' ||
  (request.method === 'GET' &&
   request.headers.get('accept') &&
   request.headers.get('accept').includes('text/html'));

const isAssetRequest = (request) => {
  const url = new URL(request.url);
  return (
    url.pathname.endsWith('.css') ||
    url.pathname.endsWith('.js') ||
    url.pathname.endsWith('.mjs') ||
    url.pathname.endsWith('.json')
  );
};

const isImageRequest = (request) => {
  const url = new URL(request.url);
  return /\.(?:png|jpg|jpeg|gif|webp|svg|ico)$/i.test(url.pathname);
};

// Helper: limit cache entries (images)
async function limitCache(cacheName, maxItems = 80) {
  const cache = await caches.open(cacheName);
  const keys = await cache.keys();
  if (keys.length > maxItems) {
    // Delete oldest entries first
    await cache.delete(keys[0]);
    return limitCache(cacheName, maxItems);
  }
}

// Network-first for navigation/HTML
async function networkFirst(event) {
  try {
    const fresh = await fetch(event.request, { cache: 'no-store' });
    const cache = await caches.open(RUNTIME_CACHE);
    cache.put(event.request, fresh.clone());
    return fresh;
  } catch (err) {
    // Fallback to cache (index or toc)
    const cache = await caches.open(RUNTIME_CACHE);
    const cached = await cache.match(event.request);
    if (cached) return cached;

    // Final fallback to precached TOC or index
    const staticCache = await caches.open(STATIC_CACHE);
    return (await staticCache.match('/toc.html')) ||
           (await staticCache.match('/index.html')) ||
           new Response('<h1>Offline</h1><p>Content unavailable while offline.</p>', {
             headers: { 'Content-Type': 'text/html; charset=utf-8' },
             status: 200
           });
  }
}

// Stale-while-revalidate for CSS/JS
async function staleWhileRevalidate(event, cacheName = RUNTIME_CACHE) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(event.request);
  const fetchPromise = fetch(event.request).then(response => {
    cache.put(event.request, response.clone());
    return response;
  }).catch(() => null);

  return cached || fetchPromise || fetch(event.request);
}

// Cache-first for images (with limit)
async function cacheFirst(event, cacheName = IMAGE_CACHE) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(event.request);
  if (cached) return cached;

  try {
    const response = await fetch(event.request, { mode: 'no-cors' });
    // Only store successful opaque or OK responses
    if (response && (response.ok || response.type === 'opaque')) {
      await cache.put(event.request, response.clone());
      await limitCache(cacheName, 120);
    }
    return response;
  } catch (err) {
    // As a last resort, try a favicon or nothing
    const staticCache = await caches.open(STATIC_CACHE);
    return (await staticCache.match('/assets/images/favicon.ico')) || Response.error();
  }
}

// ----- Fetch handler -----
self.addEventListener('fetch', event => {
  const { request } = event;

  // Only handle GET
  if (request.method !== 'GET') return;

  if (isNavigationRequest(request)) {
    event.respondWith(networkFirst(event));
    return;
  }

  if (isAssetRequest(request)) {
    event.respondWith(staleWhileRevalidate(event));
    return;
  }

  if (isImageRequest(request)) {
    event.respondWith(cacheFirst(event));
    return;
  }

  // Default: try network, fallback to cache
  event.respondWith((async () => {
    try {
      return await fetch(request);
    } catch {
      const cache = await caches.open(RUNTIME_CACHE);
      const cached = await cache.match(request);
      return cached || new Response('', { status: 504, statusText: 'Gateway Timeout' });
    }
  })());
});

// ----- Manual update trigger from pages (optional) -----
// Call navigator.serviceWorker.controller.postMessage({type:'SKIP_WAITING'})
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
