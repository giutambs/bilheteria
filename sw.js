// Service worker simples do Tevelisão — cacheia o essencial para o app abrir
// rápido e funcionar como PWA/APK. Filmes, séries e dados continuam vindo da
// rede (TMDB/OMDb/Firestore) normalmente.
const CACHE_NAME = 'tevelisao-v1';
const CORE_ASSETS = ['./index.html', './manifest.json'];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(CORE_ASSETS)).catch(() => {})
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((names) =>
      Promise.all(names.filter((n) => n !== CACHE_NAME).map((n) => caches.delete(n)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if(req.method !== 'GET') return;
  // Só cacheia o essencial do próprio app; tudo que é de outros domínios
  // (TMDB, OMDb, Firebase) sempre vai direto pra rede.
  const url = new URL(req.url);
  if(url.origin !== self.location.origin) return;

  event.respondWith(
    caches.match(req).then((cached) => {
      const network = fetch(req).then((res) => {
        if(res && res.ok){
          const copy = res.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(req, copy));
        }
        return res;
      }).catch(() => cached);
      return cached || network;
    })
  );
});
