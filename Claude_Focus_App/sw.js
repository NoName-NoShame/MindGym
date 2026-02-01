// Service Worker for Mind Gym PWA
const CACHE_NAME = 'mindgym-v1';
const ASSETS_TO_CACHE = [
    './',
    './index.html',
    './styles.css',
    './manifest.json',
    './js/app.js',
    './js/analytics.js',
    './js/advanced-analytics.js',
    './js/audio.js',
    './js/beep-tracker.js',
    './js/time-estimation.js',
    './js/reaction-test.js',
    './js/memory-sequence.js',
    './js/focus-counter.js',
    './js/meditation.js',
    './js/meditation-room.js',
    './js/meditation-timer.js',
    // External CDN resources (will be cached on first load)
    'https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500&family=Playfair+Display:wght@400;500;600;700&family=Source+Sans+3:wght@300;400;500;600;700&display=swap',
    'https://unpkg.com/lucide@latest',
    'https://cdn.jsdelivr.net/npm/chart.js'
];

// Install event - cache assets
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('Caching app assets');
                return cache.addAll(ASSETS_TO_CACHE);
            })
            .then(() => self.skipWaiting())
            .catch((err) => {
                console.log('Cache failed:', err);
            })
    );
});

// Activate event - clean old caches
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheName !== CACHE_NAME) {
                        console.log('Deleting old cache:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        }).then(() => self.clients.claim())
    );
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', (event) => {
    event.respondWith(
        caches.match(event.request)
            .then((response) => {
                // Return cached version or fetch from network
                if (response) {
                    return response;
                }

                return fetch(event.request).then((networkResponse) => {
                    // Cache new resources
                    if (networkResponse && networkResponse.status === 200) {
                        const responseClone = networkResponse.clone();
                        caches.open(CACHE_NAME).then((cache) => {
                            cache.put(event.request, responseClone);
                        });
                    }
                    return networkResponse;
                });
            })
            .catch(() => {
                // Offline fallback
                if (event.request.destination === 'document') {
                    return caches.match('./index.html');
                }
            })
    );
});
