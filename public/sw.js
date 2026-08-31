const CACHE_NAME = 'logiflow-v3';
const API_CACHE_NAME = 'logiflow-api-v2';
const OFFLINE_URL = '/offline.html';

// Disable aggressive SW caching in Lovable preview to avoid stale bundles / infinite loading.
const PREVIEW_HOST_PATTERNS = ['lovableproject.com', 'id-preview--'];
const IS_PREVIEW = PREVIEW_HOST_PATTERNS.some((pattern) => self.location.hostname.includes(pattern));

// Static assets - cache first
const STATIC_ASSETS = [
  '/',
  '/offline.html',
  '/manifest.json',
  '/favicon.ico',
];

// Install event - precache static assets
self.addEventListener('install', (event) => {
  if (IS_PREVIEW) {
    self.skipWaiting();
    return;
  }

  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[SW] Precaching static assets');
      return cache.addAll(STATIC_ASSETS);
    })
  );
  self.skipWaiting();
});

// Activate event - cleanup old caches
self.addEventListener('activate', (event) => {
  if (IS_PREVIEW) {
    event.waitUntil(
      caches.keys().then((cacheNames) => Promise.all(cacheNames.map((name) => caches.delete(name))))
    );
    self.clients.claim();
    return;
  }

  const validCaches = [CACHE_NAME, API_CACHE_NAME];
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => !validCaches.includes(name))
          .map((name) => {
            console.log('[SW] Deleting old cache:', name);
            return caches.delete(name);
          })
      );
    })
  );
  self.clients.claim();
});

/**
 * Determine caching strategy based on request type.
 */
function getStrategy(url) {
  const { pathname, hostname } = new URL(url);

  // Skip: Supabase auth, realtime, edge functions
  if (hostname.includes('supabase') && (
    pathname.includes('/auth/') ||
    pathname.includes('/realtime/') ||
    pathname.includes('/functions/')
  )) {
    return 'network-only';
  }

  // Supabase REST API (data queries) → stale-while-revalidate
  if (hostname.includes('supabase') && pathname.includes('/rest/')) {
    return 'stale-while-revalidate';
  }

  // External APIs (Mapbox tiles, etc.) → cache-first with 1h expiry
  if (hostname.includes('mapbox') || hostname.includes('tile')) {
    return 'cache-first';
  }

  // JS, CSS, images, fonts → cache-first (hashed filenames = immutable)
  if (pathname.match(/\.(js|css|woff2?|ttf|png|jpg|jpeg|svg|webp|ico)$/)) {
    return 'cache-first';
  }

  // HTML pages → network-first
  return 'network-first';
}

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  // In preview, always use network to prevent stale app shell/chunks.
  if (IS_PREVIEW) return;

  const strategy = getStrategy(event.request.url);

  if (strategy === 'network-only') return;

  if (strategy === 'cache-first') {
    event.respondWith(
      caches.match(event.request).then((cached) => {
        if (cached) return cached;
        return fetch(event.request).then((response) => {
          if (response.status === 200) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          }
          return response;
        });
      })
    );
    return;
  }

  if (strategy === 'stale-while-revalidate') {
    event.respondWith(
      caches.open(API_CACHE_NAME).then(async (cache) => {
        const cached = await cache.match(event.request);
        const fetchPromise = fetch(event.request)
          .then((response) => {
            if (response.status === 200) {
              cache.put(event.request, response.clone());
            }
            return response;
          })
          .catch(() => cached || new Response('Offline', { status: 503 }));

        return cached || fetchPromise;
      })
    );
    return;
  }

  // network-first (default for HTML)
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        const requestUrl = new URL(event.request.url);
        const hasPreviewToken = requestUrl.searchParams.has('__lovable_token');

        if (response.status === 200 && !hasPreviewToken) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
        }
        return response;
      })
      .catch(async () => {
        const cached = await caches.match(event.request);
        if (cached) return cached;
        if (event.request.mode === 'navigate') {
          const offline = await caches.match(OFFLINE_URL);
          if (offline) return offline;
        }
        return new Response('Offline', { status: 503, statusText: 'Service Unavailable' });
      })
  );
});

// Background sync
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-data') {
    console.log('[SW] Syncing data...');
  }
});

// Push notifications
self.addEventListener('push', (event) => {
  if (event.data) {
    const data = event.data.json();
    const options = {
      body: data.body || 'Nova notificação',
      icon: '/icons/icon-192.png',
      badge: '/icons/icon-192.png',
      vibrate: [100, 50, 100],
      data: { url: data.url || '/' },
    };
    event.waitUntil(
      self.registration.showNotification(data.title || 'LogiFlow', options)
    );
  }
});

// Notification click
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = event.notification.data?.url || '/';
  event.waitUntil(
    self.clients.matchAll({ type: 'window' }).then((clientList) => {
      for (const client of clientList) {
        if (client.url === url && 'focus' in client) return client.focus();
      }
      if (self.clients.openWindow) return self.clients.openWindow(url);
    })
  );
});
