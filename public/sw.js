const CACHE_NAME = 'eorzean-compass-v1';
const STATIC_CACHE_URLS = [
  '/',
  '/about',
  '/manifest.json',
  '/placeholder.svg',
  '/placeholder-logo.png',
];

// API endpoints that should be cached (with careful consideration)
const CACHEABLE_API_PATTERNS = [
  '/api/achievements', // Only cache when no lodestoneId parameter
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(STATIC_CACHE_URLS))
      .then(() => self.skipWaiting())
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter((cacheName) => cacheName !== CACHE_NAME)
            .map((cacheName) => caches.delete(cacheName))
        );
      })
      .then(() => self.clients.claim())
  );
});

// Fetch event - serve from cache with network fallback
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Handle API requests with careful caching strategy
  if (url.pathname.startsWith('/api/')) {
    // Only cache achievements API when no character-specific parameters
    const shouldCache = url.pathname === '/api/achievements' && !url.searchParams.has('lodestoneId');
    
    if (shouldCache) {
      // Cache-first for general achievements
      event.respondWith(
        caches.match(request)
          .then((response) => {
            if (response) {
              return response;
            }
            
            return fetch(request)
              .then((response) => {
                if (response.ok) {
                  const responseClone = response.clone();
                  caches.open(CACHE_NAME)
                    .then((cache) => cache.put(request, responseClone));
                }
                return response;
              });
          })
      );
    } else {
      // Network-first for character-specific data (no caching)
      event.respondWith(
        fetch(request)
          .catch(() => {
            // Only fallback to cache for non-character-specific requests
            if (!url.searchParams.has('lodestoneId') && !url.searchParams.has('name')) {
              return caches.match(request);
            }
            throw new Error('Network unavailable and no cache available for character-specific data');
          })
      );
    }
    return;
  }

  // Handle static assets with cache-first strategy
  event.respondWith(
    caches.match(request)
      .then((response) => {
        if (response) {
          return response;
        }
        
        return fetch(request)
          .then((response) => {
            // Cache successful responses
            if (response.ok) {
              const responseClone = response.clone();
              caches.open(CACHE_NAME)
                .then((cache) => cache.put(request, responseClone));
            }
            return response;
          });
      })
      .catch(() => {
        // Fallback for offline scenarios
        if (request.destination === 'document') {
          return caches.match('/');
        }
      })
  );
});

// Background sync for data updates (disabled to prevent excessive calls)
self.addEventListener('sync', (event) => {
  if (event.tag === 'background-sync') {
    event.waitUntil(
      // Background sync disabled to prevent excessive API calls
      Promise.resolve()
    );
  }
});

// Push notifications (for future use)
self.addEventListener('push', (event) => {
  if (event.data) {
    const data = event.data.json();
    
    event.waitUntil(
      self.registration.showNotification(data.title, {
        body: data.body,
        icon: '/placeholder-logo.png',
        badge: '/placeholder-logo.png',
        tag: 'eorzean-compass',
        renotify: true,
      })
    );
  }
});