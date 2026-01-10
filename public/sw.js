const CACHE_NAME = 'dump-splitter-cache-v2';
const urlsToCache = [
  '/',
  '/index.html',
  '/app.js',
  '/style.css', // Eğer stil dosyanın adı farklıysa düzelt
  '/icon-192.png',
  '/icon-512.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        return cache.addAll(urlsToCache);
      })
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        return response || fetch(event.request);
      })
  );

});
