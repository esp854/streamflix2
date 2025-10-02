// Service Worker for StreamFlix PWA
const CACHE_NAME = 'streamflix-v1.1.0';
const STATIC_CACHE = 'streamflix-static-v1.1.0';
const DYNAMIC_CACHE = 'streamflix-dynamic-v1.1.0';
const IMAGE_CACHE = 'streamflix-images-v1.1.0';

// Resources to cache immediately
const STATIC_ASSETS = [
  '/',
  '/manifest.json',
  '/index.html'
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
  console.log('[SW] Install event');
  event.waitUntil(
    Promise.all([
      caches.open(STATIC_CACHE)
        .then((cache) => {
          console.log('[SW] Caching static assets');
          return cache.addAll(STATIC_ASSETS).catch((error) => {
            console.error('[SW] Failed to cache static assets:', error);
            // Continue installation even if caching fails
            return Promise.resolve();
          });
        }),
      // Pre-cache critical CSS/JS chunks
      caches.open(DYNAMIC_CACHE)
        .then((cache) => {
          // Add critical resources that should be cached during install
          return Promise.resolve();
        })
    ]).then(() => {
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
          if (cacheName !== STATIC_CACHE && cacheName !== DYNAMIC_CACHE && cacheName !== IMAGE_CACHE) {
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

  // Allow requests to PayPal and Google domains
  const allowedExternalDomains = [
    'www.paypal.com',
    'www.paypalobjects.com',
    'api.paypal.com',
    'www.sandbox.paypal.com',
    'www.googletagmanager.com',
    'www.google-analytics.com'
  ];

  if (allowedExternalDomains.includes(url.hostname)) {
    // For external domains, bypass service worker and fetch directly
    return;
  }

  // Handle image requests with specific image cache
  if (url.hostname === 'image.tmdb.org') {
    event.respondWith(
      caches.match(request)
        .then((cachedResponse) => {
          // Return cached response if available
          if (cachedResponse) {
            return cachedResponse;
          }
          
          // Fetch from network and cache
          return fetch(request)
            .then((response) => {
              if (response && response.status === 200) {
                const responseClone = response.clone();
                caches.open(IMAGE_CACHE)
                  .then((cache) => {
                    cache.put(request, responseClone);
                  })
                  .catch((error) => {
                    console.error('[SW] Failed to cache image:', error);
                  });
              }
              return response;
            })
            .catch((error) => {
              console.error('[SW] Image fetch failed:', error);
              return new Response(null, { status: 503, statusText: 'Offline' });
            });
        })
    );
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
    // For content-related API endpoints, bypass cache to ensure fresh data
    if (url.pathname.includes('/api/tmdb/') || url.pathname.includes('/api/content')) {
      event.respondWith(
        fetch(request)
          .then((response) => {
            console.log('[SW] API response (bypass cache):', response.status, response.type, url.href);
            return response;
          })
          .catch((error) => {
            console.log('[SW] API fetch error:', error, url.href);
            // Try to get from cache only for non-content APIs
            if (!url.pathname.includes('/api/tmdb/') && !url.pathname.includes('/api/content')) {
              return caches.match(request).then((cachedResponse) => {
                return cachedResponse || new Response(null, { status: 503, statusText: 'Offline' });
              });
            }
            throw error;
          })
      );
      return;
    }
    
    // For other API requests, use normal caching
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

  // Handle static assets (JS, CSS, etc.) - try network first
  if (request.destination === 'script' || request.destination === 'style' || request.destination === 'font' || request.destination === 'image') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          // Cache successful responses
          if (response && response.status === 200) {
            const responseClone = response.clone();
            caches.open(DYNAMIC_CACHE)
              .then((cache) => {
                cache.put(request, responseClone);
              })
              .catch((error) => {
                console.error('[SW] Failed to cache asset:', error);
              });
          }
          return response;
        })
        .catch((error) => {
          console.error('[SW] Asset fetch failed:', error);
          // Try to get from cache
          return caches.match(request);
        })
    );
    return;
  }

  // Handle navigation requests (HTML pages) with stale-while-revalidate strategy
  if (request.mode === 'navigate') {
    event.respondWith(
      caches.open(DYNAMIC_CACHE).then((cache) => {
        return cache.match('/index.html').then((cachedResponse) => {
          // Fetch fresh version in background
          const networkResponse = fetch(request).then((response) => {
            // Cache successful responses
            if (response && response.status === 200) {
              cache.put('/index.html', response.clone());
            }
            return response;
          }).catch(() => {
            // If network fails, return cached response if available
            return cachedResponse;
          });

          // Return cached version immediately if available, otherwise wait for network
          return cachedResponse || networkResponse;
        });
      }).catch((error) => {
        console.error('[SW] Cache operation failed:', error);
        // Fallback to network if cache operations fail
        return fetch(request);
      })
    );
    return;
  }

  // For other requests, try network first, then cache
  event.respondWith(
    fetch(request)
      .then((response) => {
        // Cache successful responses
        if (response && response.status === 200) {
          const responseClone = response.clone();
          caches.open(DYNAMIC_CACHE)
            .then((cache) => {
              cache.put(request, responseClone);
            })
            .catch((error) => {
              console.error('[SW] Failed to cache response:', error);
            });
        }
        return response;
      })
      .catch((error) => {
        console.error('[SW] Fetch failed:', error);
        // Try to get from cache
        return caches.match(request);
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

// Message handler for cache invalidation
self.addEventListener('message', (event) => {
  if (event.data.command === 'CLEAR_API_CACHE') {
    clearAPICache();
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

// Add a function to clear specific cached API responses
function clearAPICache() {
  caches.open(DYNAMIC_CACHE).then(cache => {
    // Delete all API responses from cache
    cache.keys().then(keys => {
      keys.forEach(request => {
        if (request.url.includes('/api/')) {
          cache.delete(request);
        }
      });
    });
  });
}