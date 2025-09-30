// Service Worker for StreamFlix PWA
const CACHE_NAME = 'streamflix-v1.0.0';
const STATIC_CACHE = 'streamflix-static-v1.0.0';
const DYNAMIC_CACHE = 'streamflix-dynamic-v1.0.0';

// Resources to cache immediately
const STATIC_ASSETS = [
  '/',
  '/manifest.json'
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
  console.log('[SW] Install event');
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => {
        console.log('[SW] Caching static assets');
        return cache.addAll(STATIC_ASSETS).catch((error) => {
          console.error('[SW] Failed to cache static assets:', error);
          // Continue installation even if caching fails
          return Promise.resolve();
        });
      })
      .then(() => {
        return self.skipWaiting();
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[SW] Activate event');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== STATIC_CACHE && cacheName !== DYNAMIC_CACHE) {
            console.log('[SW] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
          return Promise.resolve();
        })
      );
    }).then(() => {
      return self.clients.claim();
    })
  );
});

// Fetch event - serve cached content when offline
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') return;

  // Skip Chrome extension requests
  if (url.protocol === 'chrome-extension:') return;

  // Skip TMDB image requests entirely - let the browser handle them directly
  if (url.hostname === 'image.tmdb.org') {
    return;
  }

  // Skip TMDB API requests as well
  if (url.hostname === 'api.themoviedb.org') {
    return;
  }

  // Skip requests to blocked domains
  if (url.hostname === 'overbridgenet.com') {
    console.log('[SW] Blocking request to blocked domain:', url.href);
    event.respondWith(new Response(null, { status: 403, statusText: 'Forbidden' }));
    return;
  }

  // Handle API requests differently
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          console.log('[SW] API response:', response.status, response.type, url.href);
          // Only cache successful API responses with a valid response
          if (response && response.status === 200 && response.type === 'cors') {
            const responseClone = response.clone();
            caches.open(DYNAMIC_CACHE)
              .then((cache) => {
                cache.put(request, responseClone);
              })
              .catch((error) => {
                console.error('[SW] Failed to cache API response:', error);
              });
          }
          return response;
        })
        .catch((error) => {
          console.log('[SW] API fetch error:', error, url.href);
          // Return cached API response if available
          return caches.match(request).then((cachedResponse) => {
            return cachedResponse || new Response(null, { status: 503, statusText: 'Offline' });
          });
        })
    );
    return;
  }

  // Handle static assets and pages
  event.respondWith(
    caches.match(request)
      .then((cachedResponse) => {
        // Return cached response if available
        if (cachedResponse) {
          return cachedResponse;
        }

        // Fetch from network
        return fetch(request)
          .then((response) => {
            // Validate response before caching
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }

            // Cache the response
            const responseClone = response.clone();
            caches.open(DYNAMIC_CACHE)
              .then((cache) => {
                cache.put(request, responseClone);
              })
              .catch((error) => {
                console.error('[SW] Failed to cache response:', error);
              });

            return response;
          })
          .catch((error) => {
            console.error('[SW] Fetch failed:', error);
            // Return offline fallback for navigation requests
            if (request.mode === 'navigate') {
              return caches.match('/').then((cachedResponse) => {
                return cachedResponse || new Response('Offline', { status: 503, statusText: 'Offline' });
              });
            }
            // For other requests, return a basic error response
            return new Response(null, { status: 503, statusText: 'Offline' });
          });
      })
      .catch((error) => {
        console.error('[SW] Cache match failed:', error);
        return new Response(null, { status: 503, statusText: 'Offline' });
      })
  );
});

// Background sync for offline actions
self.addEventListener('sync', (event) => {
  console.log('[SW] Background sync:', event.tag);

  if (event.tag === 'background-sync') {
    event.waitUntil(doBackgroundSync());
  }
});

// Push notifications
self.addEventListener('push', (event) => {
  console.log('[SW] Push received:', event);

  if (event.data) {
    const data = event.data.json();
    const options = {
      body: data.body,
      vibrate: [100, 50, 100],
      data: {
        dateOfArrival: Date.now(),
        primaryKey: data.primaryKey
      }
    };

    event.waitUntil(
      self.registration.showNotification(data.title, options)
    );
  }
});

// Notification click handler
self.addEventListener('notificationclick', (event) => {
  console.log('[SW] Notification click:', event);
  event.notification.close();

  event.waitUntil(
    clients.openWindow(event.notification.data.url || '/')
  );
});

// Background sync function
async function doBackgroundSync() {
  try {
    // Implement background sync logic here
    // For example, sync offline favorites, watch history, etc.
    console.log('[SW] Performing background sync');
  } catch (error) {
    console.error('[SW] Background sync failed:', error);
  }
}

// Periodic background sync (if supported)
self.addEventListener('periodicsync', (event) => {
  if (event.tag === 'content-sync') {
    event.waitUntil(syncContent());
  }
});

async function syncContent() {
  try {
    console.log('[SW] Periodic content sync');
    // Update cached content in background
  } catch (error) {
    console.error('[SW] Content sync failed:', error);
  }
}