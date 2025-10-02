// Service Worker for StreamFlix PWA - Optimized Version
const CACHE_NAME = 'streamflix-v1.4.0';
const STATIC_CACHE = 'streamflix-static-v1.4.0';
const DYNAMIC_CACHE = 'streamflix-dynamic-v1.4.0';
const IMAGE_CACHE = 'streamflix-images-v1.4.0';
const VIDEO_CACHE = 'streamflix-videos-v1.4.0';
const OFFLINE_CONTENT_CACHE = 'streamflix-offline-content-v1.4.0';
const PRELOAD_CACHE = 'streamflix-preload-v1.4.0';

// Cache expiration times (in milliseconds)
const STATIC_CACHE_EXPIRATION = 7 * 24 * 60 * 60 * 1000; // 7 days
const DYNAMIC_CACHE_EXPIRATION = 24 * 60 * 60 * 1000; // 24 hours
const IMAGE_CACHE_EXPIRATION = 3 * 24 * 60 * 60 * 1000; // 3 days
const API_CACHE_EXPIRATION = 30 * 60 * 1000; // 30 minutes

// Resources to cache immediately
const STATIC_ASSETS = [
  '/',
  '/manifest.json',
  '/index.html',
  '/src/main.tsx',
  '/src/App.tsx',
  '/src/index.css'
];

// Critical resources to cache during installation
const CRITICAL_ASSETS = [
  '/src/components/layout/navbar.tsx',
  '/src/pages/home.tsx',
  '/src/components/movie-card.tsx',
  '/src/components/movie-row.tsx',
  '/src/components/hero-carousel.tsx',
  '/src/components/tv-card.tsx',
  '/src/components/tv-row.tsx'
];

// Preload resources for better performance
const PRELOAD_ASSETS = [
  '/src/pages/movie-detail.tsx',
  '/src/pages/tv-detail.tsx',
  '/src/pages/search.tsx',
  '/src/pages/favorites.tsx',
  '/src/pages/profile.tsx'
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
          console.log('[SW] Caching critical assets');
          return cache.addAll(CRITICAL_ASSETS).catch((error) => {
            console.error('[SW] Failed to cache critical assets:', error);
            return Promise.resolve();
          });
        }),
      // Pre-cache preload assets
      caches.open(PRELOAD_CACHE)
        .then((cache) => {
          console.log('[SW] Caching preload assets');
          return cache.addAll(PRELOAD_ASSETS).catch((error) => {
            console.error('[SW] Failed to cache preload assets:', error);
            return Promise.resolve();
          });
        })
    ]).then(() => {
      return self.skipWaiting();
    })
  );
});

// Activate event - clean up old caches and implement cache expiration
self.addEventListener('activate', (event) => {
  console.log('[SW] Activate event');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          // Delete old caches with different version numbers
          if (!cacheName.includes(CACHE_NAME.split('-v')[0])) {
            console.log('[SW] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
          
          // Implement cache expiration for current caches
          return expireCacheEntries(cacheName);
        })
      );
    }).then(() => {
      return self.clients.claim();
    })
  );
});

// Function to expire old cache entries
async function expireCacheEntries(cacheName) {
  try {
    const cache = await caches.open(cacheName);
    const keys = await cache.keys();
    const now = Date.now();
    
    // Determine expiration time based on cache type
    let expirationTime;
    if (cacheName === STATIC_CACHE) {
      expirationTime = STATIC_CACHE_EXPIRATION;
    } else if (cacheName === DYNAMIC_CACHE) {
      expirationTime = DYNAMIC_CACHE_EXPIRATION;
    } else if (cacheName === IMAGE_CACHE) {
      expirationTime = IMAGE_CACHE_EXPIRATION;
    } else {
      // For other caches, use default expiration
      expirationTime = DYNAMIC_CACHE_EXPIRATION;
    }
    
    // Check each cached request
    for (const request of keys) {
      // Get the cached response
      const response = await cache.match(request);
      if (response) {
        // Check if response has a date header
        const dateHeader = response.headers.get('date');
        if (dateHeader) {
          const cachedTime = new Date(dateHeader).getTime();
          // If cached entry is expired, delete it
          if (now - cachedTime > expirationTime) {
            await cache.delete(request);
            console.log('[SW] Deleted expired cache entry:', request.url);
          }
        }
      }
    }
  } catch (error) {
    console.error('[SW] Error expiring cache entries:', error);
  }
}

// Handle messages from client
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data.command === 'CLEAR_API_CACHE') {
    clearAPICache();
  }
  
  if (event.data.command === 'INVALIDATE_CONTENT_CACHE') {
    invalidateContentCache();
  }
  
  if (event.data.command === 'PREFETCH_CONTENT') {
    prefetchContent(event.data.urls);
  }
  
  // Nouvelle commande pour sauvegarder du contenu pour une consultation hors-ligne
  if (event.data.command === 'SAVE_FOR_OFFLINE') {
    saveForOffline(event.data.content);
  }
  
  // Nouvelle commande pour obtenir la liste du contenu sauvegardé
  if (event.data.command === 'GET_OFFLINE_CONTENT') {
    getOfflineContent(event.source);
  }
  
  // Nouvelle commande pour supprimer du contenu sauvegardé
  if (event.data.command === 'REMOVE_OFFLINE_CONTENT') {
    removeOfflineContent(event.data.contentId);
  }
  
  // Commande pour synchroniser les préférences utilisateur
  if (event.data.command === 'SYNC_PREFERENCES') {
    syncUserPreferences();
  }
  
  // Commande pour précharger du contenu spécifique
  if (event.data.command === 'PRELOAD_CONTENT') {
    preloadContent(event.data.urls);
  }
  
  // Commande pour invalider le cache d'une URL spécifique
  if (event.data.command === 'INVALIDATE_URL') {
    invalidateUrl(event.data.url);
  }
});

// Optimized fetch event with better caching strategies
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

  // Handle video requests with specific video cache
  if (request.destination === 'video' || url.pathname.includes('.mp4') || url.pathname.includes('.m3u8') || url.pathname.includes('.ts')) {
    event.respondWith(handleVideoRequest(request));
    return;
  }

  // Handle image requests with specific image cache
  if (url.hostname === 'image.tmdb.org' || request.destination === 'image') {
    event.respondWith(handleImageRequest(request));
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
    event.respondWith(handleAPIRequest(request, url));
    return;
  }

  // Handle static assets (JS, CSS, etc.) with optimized strategy
  if (request.destination === 'script' || request.destination === 'style' || request.destination === 'font') {
    event.respondWith(handleStaticAssetRequest(request));
    return;
  }

  // Handle navigation requests (HTML pages) with optimized stale-while-revalidate strategy
  if (request.mode === 'navigate') {
    event.respondWith(handleNavigationRequest(request));
    return;
  }

  // For other requests, use optimized network-first strategy
  event.respondWith(handleOtherRequest(request));
});

// Optimized video request handler
async function handleVideoRequest(request) {
  try {
    // Try to get from cache first
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      console.log('[SW] Video served from cache:', request.url);
      return cachedResponse;
    }
    
    // For video content, we don't cache during fetch to avoid storage issues
    // Instead, we let the browser handle video caching natively
    const networkResponse = await fetch(request);
    return networkResponse;
  } catch (error) {
    console.error('[SW] Video fetch failed:', error);
    return new Response(null, { status: 503, statusText: 'Offline' });
  }
}

// Optimized image request handler
async function handleImageRequest(request) {
  try {
    // Try to get from cache first
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      console.log('[SW] Image served from cache:', request.url);
      return cachedResponse;
    }
    
    // Fetch from network and cache
    const networkResponse = await fetch(request);
    if (networkResponse && networkResponse.status === 200) {
      const responseClone = networkResponse.clone();
      const cache = await caches.open(IMAGE_CACHE);
      await cache.put(request, responseClone);
      console.log('[SW] Image cached:', request.url);
    }
    return networkResponse;
  } catch (error) {
    console.error('[SW] Image fetch failed:', error);
    return new Response(null, { status: 503, statusText: 'Offline' });
  }
}

// Optimized API request handler
async function handleAPIRequest(request, url) {
  // For content-related API endpoints, bypass cache to ensure fresh data
  if (url.pathname.includes('/api/tmdb/') || url.pathname.includes('/api/content')) {
    try {
      const networkResponse = await fetch(request);
      console.log('[SW] API response (bypass cache):', networkResponse.status, url.href);
      return networkResponse;
    } catch (error) {
      console.log('[SW] API fetch error:', error, url.href);
      // Try to get from cache only for non-content APIs
      if (!url.pathname.includes('/api/tmdb/') && !url.pathname.includes('/api/content')) {
        const cachedResponse = await caches.match(request);
        return cachedResponse || new Response(null, { status: 503, statusText: 'Offline' });
      }
      throw error;
    }
  }
  
  // For other API requests, use cache-first strategy with expiration
  try {
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      // Check if cached response is still valid
      const dateHeader = cachedResponse.headers.get('date');
      if (dateHeader) {
        const cachedTime = new Date(dateHeader).getTime();
        const now = Date.now();
        // If cached entry is not expired, return it
        if (now - cachedTime < API_CACHE_EXPIRATION) {
          console.log('[SW] API response from cache:', request.url);
          return cachedResponse;
        }
      }
    }
    
    const networkResponse = await fetch(request);
    console.log('[SW] API response from network:', networkResponse.status, url.href);
    
    // Only cache successful API responses with a valid response
    if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'cors') {
      const responseClone = networkResponse.clone();
      const cache = await caches.open(DYNAMIC_CACHE);
      await cache.put(request, responseClone);
      console.log('[SW] API response cached:', request.url);
    }
    return networkResponse;
  } catch (error) {
    console.log('[SW] API fetch error:', error, url.href);
    // Return cached API response if available
    const cachedResponse = await caches.match(request);
    return cachedResponse || new Response(null, { status: 503, statusText: 'Offline' });
  }
}

// Optimized static asset request handler
async function handleStaticAssetRequest(request) {
  try {
    // Try to get from cache first
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      console.log('[SW] Static asset served from cache:', request.url);
      return cachedResponse;
    }
    
    // Fetch from network and cache
    const networkResponse = await fetch(request);
    if (networkResponse && networkResponse.status === 200) {
      const responseClone = networkResponse.clone();
      const cache = await caches.open(DYNAMIC_CACHE);
      await cache.put(request, responseClone);
      console.log('[SW] Static asset cached:', request.url);
    }
    return networkResponse;
  } catch (error) {
    console.error('[SW] Static asset fetch failed:', error);
    // Try to get from cache
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      console.log('[SW] Static asset served from cache (fallback):', request.url);
      return cachedResponse;
    }
    return new Response(null, { status: 503, statusText: 'Offline' });
  }
}

// Optimized navigation request handler
async function handleNavigationRequest(request) {
  try {
    // Try to get from cache first for instant loading
    const cache = await caches.open(DYNAMIC_CACHE);
    const cachedResponse = await cache.match('/index.html');
    if (cachedResponse) {
      console.log('[SW] Navigation served from cache:', request.url);
      
      // Fetch fresh version in background to update cache
      fetch(request).then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200) {
          cache.put('/index.html', networkResponse.clone());
          console.log('[SW] Navigation cache updated:', request.url);
        }
      }).catch((error) => {
        console.log('[SW] Background update failed:', error);
      });
      
      return cachedResponse;
    }
    
    // If not in cache, fetch from network
    const networkResponse = await fetch(request);
    if (networkResponse && networkResponse.status === 200) {
      const responseClone = networkResponse.clone();
      await cache.put('/index.html', responseClone);
      console.log('[SW] Navigation cached:', request.url);
    }
    return networkResponse;
  } catch (error) {
    console.error('[SW] Navigation fetch failed:', error);
    // Fallback to cache
    const cache = await caches.open(DYNAMIC_CACHE);
    const cachedResponse = await cache.match('/index.html');
    if (cachedResponse) {
      console.log('[SW] Navigation served from cache (fallback):', request.url);
      return cachedResponse;
    }
    return new Response(null, { status: 503, statusText: 'Offline' });
  }
}

// Optimized handler for other requests
async function handleOtherRequest(request) {
  try {
    // Try to get from cache first
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      console.log('[SW] Request served from cache:', request.url);
      return cachedResponse;
    }
    
    // Fetch from network and cache
    const networkResponse = await fetch(request);
    if (networkResponse && networkResponse.status === 200) {
      const responseClone = networkResponse.clone();
      const cache = await caches.open(DYNAMIC_CACHE);
      await cache.put(request, responseClone);
      console.log('[SW] Request cached:', request.url);
    }
    return networkResponse;
  } catch (error) {
    console.error('[SW] Fetch failed:', error);
    // Try to get from cache
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      console.log('[SW] Request served from cache (fallback):', request.url);
      return cachedResponse;
    }
    return new Response(null, { status: 503, statusText: 'Offline' });
  }
}

// Background sync for offline actions
self.addEventListener('sync', (event) => {
  console.log('[SW] Background sync:', event.tag);

  if (event.tag === 'background-sync') {
    event.waitUntil(doBackgroundSync());
  }
  
  if (event.tag === 'favorite-sync') {
    event.waitUntil(syncFavorites());
  }
  
  if (event.tag === 'watch-history-sync') {
    event.waitUntil(syncWatchHistory());
  }
  
  if (event.tag === 'preferences-sync') {
    event.waitUntil(syncUserPreferences());
  }
});

// Push notifications
self.addEventListener('push', (event) => {
  console.log('[SW] Push received:', event);

  if (event.data) {
    const data = event.data.json();
    const options = {
      body: data.body,
      icon: '/icon-192x192.png',
      badge: '/icon-192x192.png',
      vibrate: [100, 50, 100],
      data: {
        dateOfArrival: Date.now(),
        primaryKey: data.primaryKey,
        url: data.url || '/'
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

// Sync favorites when connection is restored
async function syncFavorites() {
  try {
    console.log('[SW] Syncing favorites');
    // Implement favorites sync logic here
  } catch (error) {
    console.error('[SW] Favorites sync failed:', error);
  }
}

// Sync watch history when connection is restored
async function syncWatchHistory() {
  try {
    console.log('[SW] Syncing watch history');
    // Implement watch history sync logic here
  } catch (error) {
    console.error('[SW] Watch history sync failed:', error);
  }
}

// Sync user preferences across devices
async function syncUserPreferences() {
  try {
    console.log('[SW] Syncing user preferences');
    // Implement user preferences sync logic here
  } catch (error) {
    console.error('[SW] User preferences sync failed:', error);
  }
}

// Periodic background sync (if supported)
self.addEventListener('periodicsync', (event) => {
  if (event.tag === 'content-sync') {
    event.waitUntil(syncContent());
  }
  
  if (event.tag === 'preferences-sync') {
    event.waitUntil(syncUserPreferences());
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

// Invalidate content cache (for when content is updated)
function invalidateContentCache() {
  Promise.all([
    caches.open(IMAGE_CACHE),
    caches.open(DYNAMIC_CACHE)
  ]).then(([imageCache, dynamicCache]) => {
    Promise.all([
      imageCache.keys(),
      dynamicCache.keys()
    ]).then(([imageKeys, dynamicKeys]) => {
      // Delete all content-related cache entries
      imageKeys.forEach(request => {
        if (request.url.includes('image.tmdb.org')) {
          imageCache.delete(request);
        }
      });
      
      dynamicKeys.forEach(request => {
        if (request.url.includes('/api/tmdb/') || request.url.includes('/api/content')) {
          dynamicCache.delete(request);
        }
      });
    });
  });
}

// Invalidate a specific URL
async function invalidateUrl(url) {
  try {
    const cachesList = await caches.keys();
    for (const cacheName of cachesList) {
      const cache = await caches.open(cacheName);
      const keys = await cache.keys();
      for (const request of keys) {
        if (request.url === url) {
          await cache.delete(request);
          console.log('[SW] Invalidated cache entry:', url);
          return;
        }
      }
    }
  } catch (error) {
    console.error('[SW] Error invalidating URL:', error);
  }
}

// Handle content prefetching
async function prefetchContent(urls) {
  try {
    console.log('[SW] Prefetching content:', urls);
    const cache = await caches.open(DYNAMIC_CACHE);
    
    // Fetch and cache each URL
    for (const url of urls) {
      try {
        const response = await fetch(url);
        if (response.ok) {
          await cache.put(url, response.clone());
          console.log('[SW] Content prefetched:', url);
        }
      } catch (error) {
        console.error('[SW] Failed to prefetch:', url, error);
      }
    }
  } catch (error) {
    console.error('[SW] Content prefetching failed:', error);
  }
}

// Handle content preloading
async function preloadContent(urls) {
  try {
    console.log('[SW] Preloading content:', urls);
    const cache = await caches.open(PRELOAD_CACHE);
    
    // Fetch and cache each URL
    for (const url of urls) {
      try {
        const response = await fetch(url);
        if (response.ok) {
          await cache.put(url, response.clone());
          console.log('[SW] Content preloaded:', url);
        }
      } catch (error) {
        console.error('[SW] Failed to preload:', url, error);
      }
    }
  } catch (error) {
    console.error('[SW] Content preloading failed:', error);
  }
}

// Fonction pour sauvegarder du contenu pour une consultation hors-ligne
async function saveForOffline(content) {
  try {
    console.log('[SW] Saving content for offline:', content.id);
    const cache = await caches.open(OFFLINE_CONTENT_CACHE);
    
    // Stocker les métadonnées du contenu
    const metadataRequest = new Request(`/offline-content/${content.id}/metadata`);
    const metadataResponse = new Response(JSON.stringify(content), {
      headers: { 'Content-Type': 'application/json' }
    });
    await cache.put(metadataRequest, metadataResponse);
    
    // Si le contenu a des images, les précharger
    if (content.poster_path || content.backdrop_path) {
      const imageUrls = [];
      if (content.poster_path) {
        imageUrls.push(`https://image.tmdb.org/t/p/w500${content.poster_path}`);
      }
      if (content.backdrop_path) {
        imageUrls.push(`https://image.tmdb.org/t/p/w1280${content.backdrop_path}`);
      }
      
      // Précharger les images
      for (const imageUrl of imageUrls) {
        try {
          const imageResponse = await fetch(imageUrl);
          if (imageResponse.ok) {
            const imageRequest = new Request(imageUrl);
            await cache.put(imageRequest, imageResponse.clone());
          }
        } catch (error) {
          console.error('[SW] Failed to cache image:', imageUrl, error);
        }
      }
    }
    
    // Notifier tous les clients que le contenu a été sauvegardé
    const clients = await self.clients.matchAll();
    clients.forEach(client => {
      client.postMessage({
        type: 'OFFLINE_CONTENT_SAVED',
        contentId: content.id
      });
    });
  } catch (error) {
    console.error('[SW] Failed to save content for offline:', error);
  }
}

// Fonction pour obtenir la liste du contenu sauvegardé
async function getOfflineContent(client) {
  try {
    const cache = await caches.open(OFFLINE_CONTENT_CACHE);
    const keys = await cache.keys();
    
    // Filtrer pour ne récupérer que les métadonnées
    const metadataKeys = keys.filter(key => key.url.includes('/offline-content/'));
    const contentList = [];
    
    for (const key of metadataKeys) {
      try {
        const response = await cache.match(key);
        const content = await response.json();
        contentList.push(content);
      } catch (error) {
        console.error('[SW] Failed to read offline content metadata:', error);
      }
    }
    
    // Envoyer la liste au client
    client.postMessage({
      type: 'OFFLINE_CONTENT_LIST',
      contentList
    });
  } catch (error) {
    console.error('[SW] Failed to get offline content list:', error);
  }
}

// Fonction pour supprimer du contenu sauvegardé
async function removeOfflineContent(contentId) {
  try {
    console.log('[SW] Removing offline content:', contentId);
    const cache = await caches.open(OFFLINE_CONTENT_CACHE);
    const keys = await cache.keys();
    
    // Supprimer toutes les entrées liées à ce contenu
    for (const key of keys) {
      if (key.url.includes(`/offline-content/${contentId}`)) {
        await cache.delete(key);
      }
    }
    
    // Notifier tous les clients que le contenu a été supprimé
    const clients = await self.clients.matchAll();
    clients.forEach(client => {
      client.postMessage({
        type: 'OFFLINE_CONTENT_REMOVED',
        contentId
      });
    });
  } catch (error) {
    console.error('[SW] Failed to remove offline content:', error);
  }
}