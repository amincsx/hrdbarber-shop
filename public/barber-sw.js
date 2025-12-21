// Service Worker for Barber PWA
const CACHE_NAME = 'hrd-barber-v1';
const BARBER_CACHE_NAME = 'hrd-barber-data-v1';

// Resources to cache for offline functionality
const urlsToCache = [
  '/barber-login',
  '/icon-192x192.png',
  '/icon-512x512.png',
  '/apple-touch-icon.png'
];

// Install event - cache resources
self.addEventListener('install', (event) => {
  console.log('🔧 Barber Service Worker: Installing...');

  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('✅ Barber Service Worker: Caching resources');
        return cache.addAll(urlsToCache);
      })
      .catch((error) => {
        console.error('❌ Barber Service Worker: Cache error:', error);
      })
  );

  // Force the waiting service worker to become the active service worker
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('🔧 Barber Service Worker: Activating...');

  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME && cacheName !== BARBER_CACHE_NAME) {
            console.log('🗑️ Barber Service Worker: Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );

  // Take control of all clients immediately
  return self.clients.claim();
});

// Fetch event - serve from cache when possible, with network fallback
self.addEventListener('fetch', (event) => {
  // Only handle GET requests
  if (event.request.method !== 'GET') {
    return;
  }

  // Skip caching for activity APIs - always fetch fresh
  if (event.request.url.includes('/api/barber-activities/')) {
    console.log('🚫 Skipping cache for activity API:', event.request.url);
    event.respondWith(
      fetch(event.request).catch(() => {
        return new Response('در حال حاضر آفلاین هستید', {
          headers: { 'Content-Type': 'text/plain; charset=utf-8' }
        });
      })
    );
    return;
  }

  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Return cached version or fetch from network
        if (response) {
          return response;
        }

        return fetch(event.request).then((response) => {
          // Don't cache non-successful responses
          if (!response || response.status !== 200 || response.type === 'error') {
            return response;
          }

          // Cache other API responses for barber data (but not activities)
          if (event.request.url.includes('/api/barber/') && !event.request.url.includes('/api/barber-activities/')) {
            const responseToCache = response.clone();
            caches.open(BARBER_CACHE_NAME).then((cache) => {
              cache.put(event.request, responseToCache);
            });
          }

          return response;
        });
      })
      .catch(() => {
        // Return offline page or placeholder if needed
        return new Response('در حال حاضر آفلاین هستید', {
          headers: { 'Content-Type': 'text/plain; charset=utf-8' }
        });
      })
  );
});

// Push notification event
self.addEventListener('push', (event) => {
  console.log('🔔 Barber Service Worker: Push notification received');

  let data = {
    title: '🎉 رزرو جدید!',
    body: 'یک رزرو جدید ثبت شد',
    icon: '/icon-192x192.png',
    badge: '/icon-192x192.png',
    tag: 'new-booking',
    requireInteraction: true,
    data: {}
  };

  if (event.data) {
    try {
      const pushData = event.data.json();
      data = {
        ...data,
        ...pushData
      };
    } catch (e) {
      console.error('❌ Error parsing push data:', e);
    }
  }

  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: data.icon,
      badge: data.badge,
      // Ensure unique tag to avoid replacement unless an explicit tag is provided
      tag: data.tag || `notif-${Date.now()}`,
      renotify: true,
      requireInteraction: data.requireInteraction,
      vibrate: [200, 100, 200, 100, 200], // Vibration pattern
      data: data.data,
      actions: [
        {
          action: 'view',
          title: '👁️ مشاهده',
          icon: '/icon-192x192.png'
        },
        {
          action: 'close',
          title: '❌ بستن',
          icon: '/icon-192x192.png'
        }
      ]
    })
  );
});

// Notification click event
self.addEventListener('notificationclick', (event) => {
  console.log('🔔 Barber Service Worker: Notification clicked');
  console.log('🔔 Event action:', event.action);
  console.log('🔔 Notification data:', event.notification.data);

  event.notification.close();

  if (event.action === 'view' || !event.action) {
    // Open the app when notification is clicked
    event.waitUntil(
      clients.matchAll({ type: 'window', includeUncontrolled: true })
        .then((clientList) => {
          console.log('🔔 Found clients:', clientList.length);

          // If app is already open, focus it
          for (const client of clientList) {
            console.log('🔔 Client URL:', client.url);
            if ((client.url.includes('/barber-dashboard/') || client.url.includes('/barber-app')) && 'focus' in client) {
              console.log('🔔 Focusing existing client');
              return client.focus();
            }
          }

          // Otherwise open new window with proper URL construction
          if (clients.openWindow) {
            const barberId = event.notification.data?.barberId || '';
            // Use self.location.origin for proper domain handling in production
            const baseUrl = self.location.origin;
            let targetUrl;

            if (barberId) {
              targetUrl = `${baseUrl}/barber-dashboard/${encodeURIComponent(barberId)}?pwa=1&notification=1`;
            } else {
              targetUrl = `${baseUrl}/barber-app?pwa=1`;
            }

            console.log('🔔 Opening URL:', targetUrl);
            return clients.openWindow(targetUrl);
          } else {
            console.error('❌ clients.openWindow not available');
          }
        })
        .catch((error) => {
          console.error('❌ Error handling notification click:', error);
        })
    );
  }
});

// Background sync event for offline booking updates
self.addEventListener('sync', (event) => {
  console.log('🔄 Barber Service Worker: Background sync triggered');

  if (event.tag === 'sync-barber-bookings') {
    event.waitUntil(
      // Fetch latest bookings when back online
      fetch('/api/barber/sync')
        .then((response) => response.json())
        .then((data) => {
          console.log('✅ Barber bookings synced:', data);
          // Send message to all clients
          return self.clients.matchAll().then((clients) => {
            clients.forEach((client) => {
              client.postMessage({
                type: 'BOOKINGS_SYNCED',
                data: data
              });
            });
          });
        })
        .catch((error) => {
          console.error('❌ Sync error:', error);
        })
    );
  }
});

// Message event - handle messages from clients
self.addEventListener('message', (event) => {
  console.log('💬 Barber Service Worker: Message received:', event.data);

  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }

  if (event.data && event.data.type === 'REFRESH_BOOKINGS') {
    // Broadcast to all clients to refresh their bookings
    self.clients.matchAll().then((clients) => {
      clients.forEach((client) => {
        client.postMessage({
          type: 'REFRESH_BOOKINGS_REQUEST'
        });
      });
    });
  }
});

console.log('🚀 Barber Service Worker: Loaded and ready');

