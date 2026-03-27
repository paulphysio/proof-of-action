const CACHE_NAME = 'proof-of-action-v3'; // Bumped to clear old cache and fix caching issues
const isDevelopment = self.location.hostname === 'localhost' || self.location.hostname === '127.0.0.1';

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
  
  // Never intercept API calls - let them go directly to avoid CORS issues
  if (url.pathname.startsWith('/api/') || 
      url.hostname.includes('supabase.co') ||
      url.hostname.includes('worldcoin.org') ||
      url.hostname.includes('api.qrserver.com')) {
    return; // Don't intercept - let browser handle directly
  }
  
  // During development, bypass cache completely for live updates
  if (isDevelopment) {
    event.respondWith(fetch(event.request));
    return;
  }
  
  // Never cache CSS, JS, or HTML files during development
  if (url.pathname.endsWith('.css') || 
      url.pathname.endsWith('.js') || 
      url.pathname.endsWith('.html') ||
      url.pathname.includes('/_next/') ||
      url.pathname.startsWith('/api/')) {
    event.respondWith(fetch(event.request));
    return;
  }
  
  // For HTML pages, use network-first strategy
  if (url.pathname.endsWith('/') || url.pathname.includes('/page')) {
    event.respondWith(
      fetch(event.request)
        .then((networkResponse) => {
          // Cache the fresh response
          return caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, networkResponse.clone());
            return networkResponse;
          });
        })
        .catch(() => {
          // If network fails, try cache
          return caches.match(event.request);
        })
    );
    return;
  }
  
  // For other assets (icons, images), use cache-first
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        if (response) {
          return response;
        }
        return fetch(event.request).then((networkResponse) => {
          return caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, networkResponse.clone());
            return networkResponse;
          });
        });
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
