/* ===========================
   Service Worker – Cache-first for offline PWA
   =========================== */

const CACHE_NAME = 'castalia-report-v69';
const ASSETS_TO_CACHE = [
    './',
    './index.html',
    './css/style.css?v=69',
    './js/app.js?v=69',
    './manifest.webmanifest',
    './assets/logo.png',
    './assets/header.png',
    './assets/footer.png',
    './assets/icon-192.png',
    './assets/icon-512.png',
];

// Install – precache all app shell assets
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            console.log('[SW] Precaching app shell');
            return cache.addAll(ASSETS_TO_CACHE);
        })
    );
    self.skipWaiting();
});

// Activate – clean up old caches
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((keys) => {
            return Promise.all(
                keys
                    .filter((key) => key !== CACHE_NAME)
                    .map((key) => caches.delete(key))
            );
        })
    );
    self.clients.claim();
});

// Fetch navigations from network first, then fall back to cache for offline use.
self.addEventListener('fetch', (event) => {
    if (event.request.mode === 'navigate') {
        event.respondWith(
            fetch(event.request).then((response) => {
                if (response.ok) {
                    const clone = response.clone();
                    caches.open(CACHE_NAME).then((cache) => {
                        cache.put(event.request, clone);
                    });
                }
                return response;
            }).catch(() => caches.match(event.request).then((cached) => cached || caches.match('./index.html')))
        );
        return;
    }

    event.respondWith(
        caches.match(event.request).then((cached) => {
            return cached || fetch(event.request).then((response) => {
                // Optionally cache new requests on the fly
                if (response.ok && event.request.method === 'GET') {
                    const clone = response.clone();
                    caches.open(CACHE_NAME).then((cache) => {
                        cache.put(event.request, clone);
                    });
                }
                return response;
            });
        }).catch(() => caches.match('./index.html'))
    );
});
