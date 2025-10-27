// Service Worker for StreamFlix PWA
const CACHE_NAME = 'streamflix-v1.7.3';
const STATIC_CACHE = 'streamflix-static-v1.7.3';
const DYNAMIC_CACHE = 'streamflix-dynamic-v1.7.3';
const IMAGE_CACHE = 'streamflix-images-v1.7.3';

// Resources to cache immediately
const STATIC_ASSETS = [
  '/',
  '/manifest.json',
  '/index.html',
  // PWA Icons
  '/apple-icon-180.png',
  '/favicon-196.png',
  '/manifest-icon-192.maskable.png',
  '/manifest-icon-512.maskable.png',
  '/icon-192x192.png',
  '/icon-512x512.png',
  '/mstile-icon-128.png',
  '/mstile-icon-270.png',
  '/mstile-icon-558.png',
  '/mstile-icon-558-270.png'
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

  // Allow requests to PayPal, Google, Zupload, HilltopAds and silent-basis domains
  const allowedExternalDomains = [
    'www.paypal.com',
    'www.paypalobjects.com',
    'api.paypal.com',
    'www.sandbox.paypal.com',
    'www.googletagmanager.com',
    'www.google-analytics.com',
    'zupload.co',
    'zupload.cc',
    'zupload.io',
    '*.zupload.co',
    '*.zupload.cc',
    '*.zupload.io',
    'hilltopads.net',
    '*.hilltopads.net',
    'selfishzone.com',
    '*.selfishzone.com',
    'silent-basis.pro',
    '*.silent-basis.pro',
    'frembed.fun',
    '*.frembed.fun'
  ];

  // Check if the request is to an allowed external domain
  const isAllowedDomain = allowedExternalDomains.some(domain => {
    if (domain.startsWith('*.')) {
      // Handle wildcard domains
      const domainWithoutWildcard = domain.substring(2);
      return url.hostname.endsWith(domainWithoutWildcard);
    } else {
      // Handle exact match domains
      return url.hostname === domain;
    }
  });

  if (isAllowedDomain) {
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
    // For TMDB API, use cache-first strategy with client-side cache validation
    if (url.pathname.includes('/api/tmdb/')) {
      event.respondWith(
        caches.match(request)
          .then((cachedResponse) => {
            // If we have a cached response, check if it's still fresh
            if (cachedResponse) {
              const cacheTime = cachedResponse.headers.get('sw-cache-time');
              const now = Date.now();
              const cacheDuration = 5 * 60 * 1000; // 5 minutes

              if (cacheTime && (now - parseInt(cacheTime)) < cacheDuration) {
                console.log('[SW] TMDB cache hit:', url.href);
                return cachedResponse;
              } else {
                console.log('[SW] TMDB cache stale, fetching fresh:', url.href);
              }
            }

            // Fetch fresh data and cache it
            return fetch(request)
              .then((response) => {
                if (response && response.status === 200) {
                  console.log('[SW] TMDB fresh response:', response.status, url.href);

                  // Clone response and add cache timestamp
                  const responseClone = response.clone();
                  const responseWithCacheTime = new Response(responseClone.body, {
                    status: responseClone.status,
                    statusText: responseClone.statusText,
                    headers: {
                      ...Object.fromEntries(responseClone.headers.entries()),
                      'sw-cache-time': Date.now().toString()
                    }
                  });

                  // Cache the response
                  caches.open(DYNAMIC_CACHE)
                    .then((cache) => {
                      cache.put(request, responseClone);
                    })
                    .catch((error) => {
                      console.error('[SW] Failed to cache TMDB response:', error);
                    });

                  return responseWithCacheTime;
                }
                return response;
              })
              .catch((error) => {
                console.error('[SW] TMDB fetch failed:', error);
                // If fetch fails, try to return cached response even if stale
                if (cachedResponse) {
                  console.log('[SW] Returning stale TMDB cache due to network error');
                  return cachedResponse;
                }
                return new Response(null, { status: 503, statusText: 'Offline' });
              });
          })
      );
      return;
    }
    
    // For other API requests, use network-first strategy
    event.respondWith(
      fetch(request)
        .then((response) => {
          // If successful, cache the response
          if (response && response.status === 200) {
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
          console.error('[SW] API fetch failed:', error);
          // If network fails, try to return cached response
          return caches.match(request)
            .then((cachedResponse) => {
              if (cachedResponse) {
                console.log('[SW] Returning cached API response due to network error');
                return cachedResponse;
              }
              return new Response(null, { status: 503, statusText: 'Offline' });
            });
        })
    );
    return;
  }

  // Handle static assets with cache-first strategy
  // Check if this is a static asset (CSS, JS, images, etc.)
  const isStaticAsset = /\.(css|js|png|jpg|jpeg|gif|svg|ico|webp|woff|woff2|ttf|eot)$/i.test(url.pathname) ||
    STATIC_ASSETS.includes(url.pathname) ||
    url.pathname === '/' ||
    url.pathname === '/index.html';

  if (isStaticAsset) {
    event.respondWith(
      caches.match(request)
        .then((cachedResponse) => {
          // Return cached response if available
          if (cachedResponse) {
            console.log('[SW] Cache hit for static asset:', url.href);
            return cachedResponse;
          }
          
          // Fetch from network and cache
          console.log('[SW] Cache miss for static asset, fetching from network:', url.href);
          return fetch(request)
            .then((response) => {
              // Check if we received a valid response
              if (!response || response.status !== 200 || response.type !== 'basic') {
                return response;
              }
              
              // Clone response and cache it
              const responseClone = response.clone();
              caches.open(STATIC_CACHE)
                .then((cache) => {
                  cache.put(request, responseClone);
                })
                .catch((error) => {
                  console.error('[SW] Failed to cache static asset:', error);
                });
              
              return response;
            })
            .catch((error) => {
              console.error('[SW] Static asset fetch failed:', error);
              return new Response(null, { status: 503, statusText: 'Offline' });
            });
        })
    );
    return;
  }

  // For all other requests, use network-first strategy
  event.respondWith(
    fetch(request)
      .then((response) => {
        // If successful, cache the response for dynamic content
        if (response && response.status === 200 && response.type === 'basic') {
          const responseClone = response.clone();
          caches.open(DYNAMIC_CACHE)
            .then((cache) => {
              cache.put(request, responseClone);
            })
            .catch((error) => {
              console.error('[SW] Failed to cache dynamic content:', error);
            });
        }
        return response;
      })
      .catch((error) => {
        console.error('[SW] Network request failed:', error);
        // If network fails, try to return cached response
        return caches.match(request)
          .then((cachedResponse) => {
            if (cachedResponse) {
              console.log('[SW] Returning cached response due to network error');
              return cachedResponse;
            }
            return new Response(null, { status: 503, statusText: 'Offline' });
          });
      })
  );
});