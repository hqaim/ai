/* =========================================================
   THE AI ARTISAN — SERVICE WORKER (CLEAN + SECURE VERSION)
   Scope: root
   Strategies:
     - HTML: network-first (fresh), fallback to cache
     - CSS/JS: stale-while-revalidate
     - Images: cache-first (bounded)
   ========================================================= */

const SW_VERSION = 'aiartisan-sw-v1.0.2-2025-11-21';
const STATIC_CACHE = `${SW_VERSION}::static`;
const RUNTIME_CACHE = `${SW_VERSION}::runtime`;
const IMAGE_CACHE = `${SW_VERSION}::images`;
const CACHE_ALLOWLIST_PREFIX = 'aiartisan-sw-';

// Core assets to precache (safe, public, small)
const CORE_ASSETS = [
  '/',                       
  '/index.html',
  '/toc.html',
  '/assets/css/style.css',
  '/assets/js/theme.js',
  '/assets/js/copy.js',
  '/assets/images/HQAIM-ICON-AI.svg',
  '/assets/images/favicon.ico'
];

// ----- Install -----
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then(cache => cache.addAll(CORE_ASSETS))
      .then(() => self.skipWaiting())
  );
});

// ----- Activate -----
self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(
      keys.map(key => {
        const isOurs = key.startsWith(CACHE_ALLOWLIST_PREFIX);
        const isCurrent = key.startsWith(SW_VERSION);
        if (isOurs && !isCurrent) {
          return caches.delete(key);
        }
      })
    );
    await self.clients.claim();
  })());
});

// ----- Helpers -----
const isHTML = (request) =>
  request.mode === 'navigate' ||
  (request.headers.get('accept') || '').includes('text/html');

const isAsset = (request) => {
  const url = new URL(request.url);
  return /\.(css|js|mjs|json)$/i.test(url.pathname);
};

const isImage = (request) => {
  const url = new URL(request.url);
  return /\.(png|jpg|jpeg|gif|webp|svg|ico)$/i.test(url.pathname);
};

// Limit cache size for images
async function limitCache(cacheName, maxItems = 100) {
  const cache = await caches.open(cacheName);
  const keys = await cache.keys();
  if (keys.length > maxItems) {
    await cache.delete(keys[0]);
    return limitCache(cacheName, maxItems);
  }
}

// ----- Fetch Handler -----
self.addEventListener('fetch', event => {
  const { request } = event;

  // Only GET
  if (request.method !== 'GET') return;

  // Block caching of premium modules (security!)
  if (request.url.includes('/modules/')) {
    return; // Always fetch from network only
  }

  // HTML → Network-first
  if (isHTML(request)) {
    event.respondWith((async () => {
      try {
        const fresh = await fetch(request, { cache: 'no-store' });
        const cache = await caches.open(RUNTIME_CACHE);
        cache.put(request, fresh.clone());
        return fresh;
      } catch {
        const cache = await caches.open(RUNTIME_CACHE);
        const cached = await cache.match(request);
        if (cached) return cached;

        const staticCache = await caches.open(STATIC_CACHE);
        return (
          (await staticCache.match('/toc.html')) ||
          (await staticCache.match('/index.html')) ||
          new Response('<h1>Offline</h1><p>Content unavailable.</p>', {
            headers: { 'Content-Type': 'text/html; charset=utf-8' }
          })
        );
      }
    })());
    return;
  }

  // CSS/JS → stale-while-revalidate
  if (isAsset(request)) {
    event.respondWith((async () => {
      const cache = await caches.open(RUNTIME_CACHE);
      const cached = await cache.match(request);
      const fetchPromise = fetch(request).then(res => {
        cache.put(request, res.clone());
        return res;
      });
      return cached || fetchPromise;
    })());
    return;
  }

  // IMAGES → cache-first + limit
  if (isImage(request)) {
    event.respondWith((async () => {
      const cache = await caches.open(IMAGE_CACHE);
      const cached = await cache.match(request);
      if (cached) return cached;

      try {
        const fresh = await fetch(request);
        if (fresh && fresh.ok) {
          cache.put(request, fresh.clone());
          limitCache(IMAGE_CACHE, 120);
        }
        return fresh;
      } catch {
        const staticCache = await caches.open(STATIC_CACHE);
        return await staticCache.match('/assets/images/favicon.ico');
      }
    })());
    return;
  }

  // Default → Network fallback to cache
  event.respondWith((async () => {
    try {
      return await fetch(request);
    } catch {
      const cache = await caches.open(RUNTIME_CACHE);
      return (await cache.match(request)) || Response.error();
    }
  })());
});
