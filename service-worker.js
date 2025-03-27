const CACHE_NAME = 'v1';
const urlsToCache = [
  '/',
  './index.html',
  './style.css',
  './app.js',
  './assets/android-chrome-192x192.png',
  './assets/android-chrome-512x512.png'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Opened cache');
        return cache.addAll(urlsToCache);
      })
  );
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        return response || fetch(event.request);
      })
  );
});
