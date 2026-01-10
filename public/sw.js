const CACHE_NAME = 'dump-splitter-cache-v4'; // Burayı v3 yap ki tarayıcı değişikliği anlasın!
const urlsToCache = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icon-192.png',
  '/icon-512.png'
  // app.js veya style.css varsa buraya ekle
];

// 1. Yükleme (Install) - Eski sürümü bekleme, hemen yenisini al!
self.addEventListener('install', (event) => {
  self.skipWaiting(); // <--- İŞTE SİHİRLİ KOD BU! (Beklemeyi atla)
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Önbellek açıldı');
        return cache.addAll(urlsToCache);
      })
  );
});

// 2. Aktifleştirme (Activate) - Eski önbellekleri temizle ve kontrolü hemen ele al
self.addEventListener('activate', (event) => {
  event.waitUntil(
    Promise.all([
      self.clients.claim(), // <--- SİHİRLİ KOD 2: Açık sekmelerin kontrolünü anında al!
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== CACHE_NAME) {
              console.log('Eski önbellek siliniyor:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
    ])
  );
});

// 3. Fetch - İnternet yoksa cache'den ver, varsa internetten çekip cache'i güncelle (Network First)
self.addEventListener('fetch', (event) => {
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // İnternetten başarılı cevap geldiyse, cache'i güncelle ve cevabı dön
        if (!response || response.status !== 200 || response.type !== 'basic') {
          return response;
        }
        const responseToCache = response.clone();
        caches.open(CACHE_NAME)
          .then((cache) => {
            cache.put(event.request, responseToCache);
          });
        return response;
      })
      .catch(() => {
        // İnternet yoksa cache'den dön
        return caches.match(event.request);
      })
  );
});

