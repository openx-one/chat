const CACHE_NAME = 'openx-cache-v1';

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        return cache.addAll([
          '/',
          '/icon.png',
        ]);
      })
  );
  self.skipWaiting();
});

self.addEventListener('fetch', event => {
  // We only want to cache GET requests
  if (event.request.method !== 'GET') return;
  
  // Skip cross-origin requests
  if (!event.request.url.startsWith(self.location.origin)) return;

  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Return cached version if found
        if (response) {
            return response;
        }

        // Fetch from network
        return fetch(event.request).then(response => {
           // Optionally cache the new request here for future offline use
           return response;
        }).catch(() => {
           // On failure, return the offline fallback if it's a navigation request
           if (event.request.mode === 'navigate') {
              return caches.match('/');
           }
        });
      })
  );
});

self.addEventListener('activate', event => {
  // Clean up old caches
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});
