const CACHE_NAME = 'proof-of-action-v2'; // Bumped to clear old cache
const urlsToCache = [
  '/',
  '/dashboard',
  '/request',
  '/respond',
  '/icons/icon-192x192.svg',
  '/icons/icon-512x512.svg'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(urlsToCache))
  );
  self.skipWaiting();
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  
  // Never cache CSS or JS files - always fetch fresh
  if (url.pathname.endsWith('.css') || url.pathname.endsWith('.js')) {
    event.respondWith(fetch(event.request));
    return;
  }
  
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        if (response) {
          return response;
        }
        return fetch(event.request);
      })
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('push', (event) => {
  const data = event.data.json();
  const options = {
    body: data.body,
    icon: '/icons/icon-192x192.svg',
    badge: '/icons/icon-192x192.svg',
    tag: data.tag,
    requireInteraction: data.requireInteraction || false,
    data: data.data || {}
  };

  if (data.actions && Array.isArray(data.actions)) {
    options.actions = data.actions;
  }

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'respond') {
    event.waitUntil(
      clients.openWindow('/respond')
    );
  } else if (event.action === 'view') {
    event.waitUntil(
      clients.openWindow(event.notification.data?.url || '/dashboard')
    );
  } else {
    // Default click - focus or open the app
    event.waitUntil(
      clients.matchAll().then((clientList) => {
        for (const client of clientList) {
          if (client.url === event.notification.data?.url && 'focus' in client) {
            return client.focus();
          }
        }
        if (clients.openWindow) {
          return clients.openWindow(event.notification.data?.url || '/dashboard');
        }
      })
    );
  }
});
