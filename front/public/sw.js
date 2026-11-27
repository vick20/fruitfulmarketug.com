// Fruitful Market UG - Service Worker with Caching & Web Push Notifications
const CACHE_NAME = 'fruitful-market-v1';
const OFFLINE_URL = '/offline.html';

const STATIC_PRECACHE = [
  '/',
  '/offline.html',
  '/pwa-192x192.png',
  '/pwa-512x512.png',
  '/pwa-maskable-512x512.png',
  '/apple-touch-icon.png',
  '/full_logo.png'
];

// Install event: cache offline fallback and core static assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_PRECACHE).catch((err) => {
        console.warn('[SW] Precache partial error:', err);
      });
    })
  );
  self.skipWaiting();
});

// Activate event: clean old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch event: network-first for pages and API, stale-while-revalidate for static assets
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET and chrome-extension/schemes
  if (request.method !== 'GET' || !url.protocol.startsWith('http')) {
    return;
  }

  // API calls & admin requests: network only (never return stale pricing or cached admin mutations)
  if (url.pathname.startsWith('/api/') || url.pathname.startsWith('/admin/api')) {
    event.respondWith(
      fetch(request).catch(() => {
        return new Response(JSON.stringify({ error: 'Network unavailable. Please reconnect.' }), {
          status: 503,
          headers: { 'Content-Type': 'application/json' },
        });
      })
    );
    return;
  }

  // Static images and fonts: Cache First with network fallback
  if (
    request.destination === 'image' ||
    request.destination === 'font' ||
    url.pathname.match(/\.(png|jpg|jpeg|webp|svg|ico|woff2?)$/i)
  ) {
    event.respondWith(
      caches.match(request).then((cached) => {
        if (cached) return cached;
        return fetch(request).then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const clone = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          }
          return networkResponse;
        }).catch(() => {
          return caches.match('/pwa-192x192.png');
        });
      })
    );
    return;
  }

  // HTML Navigation: Network first, fallback to cache, then offline page
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          return response;
        })
        .catch(async () => {
          const cached = await caches.match(request);
          if (cached) return cached;
          const offlinePage = await caches.match(OFFLINE_URL);
          return offlinePage || new Response('You are offline. Please check your internet connection.', {
            status: 503,
            headers: { 'Content-Type': 'text/html' },
          });
        })
    );
    return;
  }

  // Other requests: Network with cache fallback
  event.respondWith(
    fetch(request).catch(() => caches.match(request))
  );
});

// ==========================================
// Web Push Notifications
// ==========================================

self.addEventListener('push', (event) => {
  let data = {
    title: 'Fruitful Market UG - New Order!',
    body: 'A customer has placed a new order.',
    url: '/admin/orders',
    orderId: '',
  };

  if (event.data) {
    try {
      const parsed = event.data.json();
      data = { ...data, ...parsed };
    } catch {
      data.body = event.data.text() || data.body;
    }
  }

  const title = data.title || 'Fruitful Market UG - New Order!';
  const options = {
    body: data.body,
    icon: '/pwa-192x192.png',
    badge: '/pwa-192x192.png',
    tag: data.orderId ? `order-${data.orderId}` : `fruitful-notice-${Date.now()}`,
    renotify: true,
    requireInteraction: true,
    vibrate: [200, 100, 200, 100, 200],
    data: {
      url: data.url || (data.orderId ? `/admin/orders/${data.orderId}` : '/admin/orders'),
      orderId: data.orderId,
    },
    actions: [
      { action: 'open_order', title: 'Open Order' },
      { action: 'dismiss', title: 'Dismiss' },
    ],
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'dismiss') {
    return;
  }

  const targetUrl = event.notification.data?.url || '/admin/orders';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // If an existing admin tab is open, focus it and navigate
      for (const client of clientList) {
        if (client.url.includes('/admin') && 'focus' in client) {
          if ('navigate' in client) {
            client.navigate(targetUrl);
          }
          return client.focus();
        }
      }
      // Otherwise open a new window
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});
