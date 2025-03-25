const CACHE_NAME = 'quiz-cache-v1';
const toCache = [
    '/',
    '/index.html',
    '/style.css',
    '/main.js',
    '/zadania.json',
    '/icon-192.png',
    '/icon-512.png'
];

self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME).then(cache => cache.addAll(toCache))
    );
});

self.addEventListener('fetch', event => {
    event.respondWith(
        caches.match(event.request).then(response => response || fetch(event.request))
    );
});
