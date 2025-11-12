// Enhanced Barber Service Worker for Android Push Notifications
const CACHE_NAME = 'hrd-barber-android-v2';
const BARBER_CACHE_NAME = 'hrd-barber-data-android-v2';

// Resources to cache for offline functionality
const urlsToCache = [
    '/barber-login',
    '/icon-192x192.svg',
    '/icon-512x512.svg',
    '/apple-touch-icon.svg'
];

// Install event - cache resources
self.addEventListener('install', (event) => {
    console.log('🔧 Enhanced Barber Service Worker: Installing...');

    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('✅ Enhanced Barber Service Worker: Caching resources');
                return cache.addAll(urlsToCache);
            })
            .catch((error) => {
                console.error('❌ Enhanced Barber Service Worker: Cache error:', error);
            })
    );

    // Force the waiting service worker to become the active service worker
    self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
    console.log('🔧 Enhanced Barber Service Worker: Activating...');

    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheName !== CACHE_NAME && cacheName !== BARBER_CACHE_NAME) {
                        console.log('🗑️ Enhanced Barber Service Worker: Deleting old cache:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );

    // Take control of all clients immediately
    return self.clients.claim();
});

// Enhanced Push notification event for Android
self.addEventListener('push', (event) => {
    console.log('🔔 Enhanced Barber Service Worker: Push notification received');
    console.log('Push event data:', event.data ? event.data.text() : 'No data');

    // Default notification data optimized for Android
    let data = {
        title: '🎉 رزرو جدید!',
        body: 'یک رزرو جدید ثبت شد',
        icon: '/icon-192x192.svg',
        badge: '/icon-192x192.svg',
        tag: 'new-booking',
        requireInteraction: true,
        silent: false,
        timestamp: Date.now(),
        data: {
            url: '/barber-dashboard'
        },
        // Android-specific optimizations
        vibrate: [200, 100, 200, 100, 200, 100, 400],
        actions: [
            {
                action: 'view',
                title: '👁️ مشاهده',
                icon: '/icon-192x192.svg'
            },
            {
                action: 'close',
                title: '❌ بستن',
                icon: '/icon-192x192.svg'
            }
        ]
    };

    // Parse push data if available
    if (event.data) {
        try {
            const pushData = event.data.json();
            console.log('Parsed push data:', pushData);
            data = {
                ...data,
                ...pushData,
                // Ensure these Android-specific properties are preserved
                requireInteraction: true,
                silent: false,
                vibrate: pushData.vibrate || data.vibrate,
                timestamp: Date.now()
            };
        } catch (e) {
            console.error('❌ Error parsing push data:', e);
            // Use default data if parsing fails
        }
    }

    console.log('Final notification data:', data);

    event.waitUntil(
        self.registration.showNotification(data.title, {
            body: data.body,
            icon: data.icon,
            badge: data.badge,
            tag: data.tag || `notif-${Date.now()}`,
            renotify: true,
            requireInteraction: data.requireInteraction,
            silent: data.silent,
            vibrate: data.vibrate,
            timestamp: data.timestamp,
            data: data.data,
            actions: data.actions,
            // Additional Android optimizations
            dir: 'rtl',
            lang: 'fa'
        }).then(() => {
            console.log('✅ Notification displayed successfully');

            // Try to focus or open app window
            return self.clients.matchAll({
                type: 'window',
                includeUncontrolled: true
            }).then(clients => {
                // If app is already open, focus it and send message
                if (clients.length > 0) {
                    const client = clients[0];
                    client.focus();
                    client.postMessage({
                        type: 'PUSH_NOTIFICATION_RECEIVED',
                        data: data
                    });
                    console.log('📱 Focused existing app window');
                }
            });
        }).catch(error => {
            console.error('❌ Error showing notification:', error);
        })
    );
});

// Enhanced notification click event for Android
self.addEventListener('notificationclick', (event) => {
    console.log('🔔 Enhanced Barber Service Worker: Notification clicked');
    console.log('Notification action:', event.action);
    console.log('Notification data:', event.notification.data);

    event.notification.close();

    if (event.action === 'close') {
        return;
    }

    // Determine URL to open
    const baseUrl = self.location.origin;
    let urlToOpen = `${baseUrl}/barber-dashboard`;
    if (event.notification.data && event.notification.data.url) {
        // If URL is relative, make it absolute
        const dataUrl = event.notification.data.url;
        urlToOpen = dataUrl.startsWith('http') ? dataUrl : `${baseUrl}${dataUrl}`;
    }

    event.waitUntil(
        self.clients.matchAll({
            type: 'window',
            includeUncontrolled: true
        }).then(clients => {
            // Check if app is already open
            const existingClient = clients.find(client =>
                client.url.includes(urlToOpen.split('?')[0])
            );

            if (existingClient) {
                // Focus existing window
                console.log('📱 Focusing existing window');
                return existingClient.focus().then(client => {
                    // Send message to refresh data
                    client.postMessage({
                        type: 'NOTIFICATION_CLICKED',
                        action: event.action,
                        data: event.notification.data
                    });
                });
            } else {
                // Open new window with absolute URL
                console.log('🆕 Opening new window:', urlToOpen);
                return self.clients.openWindow(urlToOpen).then(client => {
                    if (client) {
                        // Send message when window is ready
                        setTimeout(() => {
                            client.postMessage({
                                type: 'NOTIFICATION_CLICKED',
                                action: event.action,
                                data: event.notification.data
                            });
                        }, 1000);
                    }
                });
            }
        }).catch(error => {
            console.error('❌ Error handling notification click:', error);
        })
    );
});

// Fetch event with enhanced caching for Android
self.addEventListener('fetch', (event) => {
    // Only handle GET requests
    if (event.request.method !== 'GET') {
        return;
    }

    // Skip non-HTTP requests
    if (!event.request.url.startsWith('http')) {
        return;
    }

    event.respondWith(
        caches.match(event.request)
            .then((response) => {
                // Return cached version if available
                if (response) {
                    return response;
                }

                // Fetch from network
                return fetch(event.request).then((response) => {
                    // Don't cache if not valid response
                    if (!response || response.status !== 200 || response.type !== 'basic') {
                        return response;
                    }

                    // Cache the response for next time
                    const responseToCache = response.clone();

                    caches.open(BARBER_CACHE_NAME)
                        .then((cache) => {
                            cache.put(event.request, responseToCache);
                        });

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

// Background sync event for Android
self.addEventListener('sync', (event) => {
    console.log('🔄 Enhanced Barber Service Worker: Background sync triggered');

    if (event.tag === 'sync-barber-bookings') {
        event.waitUntil(
            fetch('/api/barber/sync')
                .then((response) => response.json())
                .then((data) => {
                    console.log('✅ Barber bookings synced:', data);
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
    console.log('💬 Enhanced Barber Service Worker: Message received:', event.data);

    if (event.data && event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }

    if (event.data && event.data.type === 'REFRESH_BOOKINGS') {
        self.clients.matchAll().then((clients) => {
            clients.forEach((client) => {
                client.postMessage({
                    type: 'REFRESH_BOOKINGS_REQUEST'
                });
            });
        });
    }

    // Android-specific ping-pong for connection testing
    if (event.data && event.data.type === 'PING') {
        event.ports[0].postMessage({
            type: 'PONG',
            timestamp: Date.now()
        });
    }
});

console.log('🚀 Enhanced Barber Service Worker for Android: Loaded and ready');
console.log('📱 Android optimizations enabled');