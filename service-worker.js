/* ===========================
   Service Worker – Cache-first for offline PWA
   =========================== */

const CACHE_NAME = 'castalia-report-v43';
const ASSETS_TO_CACHE = [
    './',
    './index.html',
    './css/style.css?v=42',
    './js/app.js',
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

// Fetch – serve from cache, fallback to network
self.addEventListener('fetch', (event) => {
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
        }).catch(() => {
            // Fallback for navigations
            if (event.request.mode === 'navigate') {
                return caches.match('./index.html');
            }
        })
    );
});
