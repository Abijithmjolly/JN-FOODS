const CACHE_NAME = 'jn-foods-v1';
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/pages/login.html',
  '/pages/billing.html',
  '/pages/driver_entry.html',
  '/pages/items_management.html',
  '/pages/owner_dashboard.html',
  '/pages/stores_management.html',
  '/manifest.json',
  '/icons/icon.svg',
  '/js/auth.js',
  '/js/billing.js',
  '/js/dashboard.js',
  '/js/driver.js',
  '/js/items.js',
  '/js/stores.js',
  '/js/supabase.js'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      // We use addAll but silently ignore errors if some files don't exist yet, to prevent install failure
      return Promise.allSettled(ASSETS_TO_CACHE.map(url => cache.add(url)));
    }).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            return caches.delete(cache);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      // Return cached response if found, else fetch from network.
      return response || fetch(event.request);
    }).catch(() => {
      // Optional: Add logic here to return an offline.html if network fails and not in cache
      console.error("Fetch failed; returning offline page instead.", event.request.url);
    })
  );
});
