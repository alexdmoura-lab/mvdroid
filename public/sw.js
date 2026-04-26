// ════════════════════════════════════════════════════════════════
// MVDroiD — Service Worker v2
// ════════════════════════════════════════════════════════════════
// VERSÃO INCREMENTADA pra forçar invalidação do cache antigo.
// Se você notar comportamento estranho após atualizar, isso resolve.
//
// Estratégia:
//  • App shell (HTML, JS, CSS, imagens): cache-first
//  • Bibliotecas externas (cdnjs): stale-while-revalidate
//  • Em modo avião: app continua funcionando 100% após primeiro uso
// ════════════════════════════════════════════════════════════════

const CACHE_VERSION = 'mvdroid-v2';
const PRECACHE_URLS = [
  '/',
  '/index.html',
  '/manifest.webmanifest',
  '/icon.svg',
  '/icon-180.png',
  '/icon-192.png',
  '/icon-512.png',
  '/og-preview.png',
  // Imagens anatômicas (críticas pro croqui funcionar offline)
  '/img/anatomy/body-front.jpg',
  '/img/anatomy/body-back.jpg',
  '/img/anatomy/body-left.jpg',
  '/img/anatomy/body-right.jpg',
  '/img/anatomy/head-front.jpg',
  '/img/anatomy/head-back.jpg',
  '/img/anatomy/head-left.jpg',
  '/img/anatomy/head-right.jpg',
];

self.addEventListener('install', (event) => {
  console.log('[SW] Install', CACHE_VERSION);
  event.waitUntil(
    caches.open(CACHE_VERSION).then((cache) => {
      return Promise.allSettled(
        PRECACHE_URLS.map((url) =>
          cache.add(url).catch((err) => {
            console.warn('[SW] Falha pré-cache:', url, err);
          })
        )
      );
    }).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  console.log('[SW] Activate', CACHE_VERSION);
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys
          .filter((k) => k !== CACHE_VERSION && k.startsWith('mvdroid-'))
          .map((k) => {
            console.log('[SW] Deletando cache antigo:', k);
            return caches.delete(k);
          })
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  const url = new URL(req.url);

  if (req.method !== 'GET') return;
  if (!url.protocol.startsWith('http')) return;

  // Navegação (HTML): network-first, fallback cache
  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req)
        .then((response) => {
          const respClone = response.clone();
          caches.open(CACHE_VERSION).then((cache) => cache.put(req, respClone));
          return response;
        })
        .catch(() => {
          return caches.match(req).then((cached) => {
            return cached || caches.match('/index.html');
          });
        })
    );
    return;
  }

  // Assets do próprio domínio: cache-first com refresh em background
  if (url.origin === self.location.origin) {
    event.respondWith(
      caches.match(req).then((cached) => {
        if (cached) {
          fetch(req).then((response) => {
            if (response && response.status === 200) {
              const respClone = response.clone();
              caches.open(CACHE_VERSION).then((cache) => cache.put(req, respClone));
            }
          }).catch(() => {});
          return cached;
        }
        return fetch(req).then((response) => {
          if (response && response.status === 200) {
            const respClone = response.clone();
            caches.open(CACHE_VERSION).then((cache) => cache.put(req, respClone));
          }
          return response;
        });
      })
    );
    return;
  }

  // Bibliotecas externas (CDN): stale-while-revalidate
  if (url.hostname.includes('cdnjs.cloudflare.com') ||
      url.hostname.includes('unpkg.com') ||
      url.hostname.includes('jsdelivr.net')) {
    event.respondWith(
      caches.match(req).then((cached) => {
        const fetchPromise = fetch(req).then((response) => {
          if (response && response.status === 200) {
            const respClone = response.clone();
            caches.open(CACHE_VERSION).then((cache) => cache.put(req, respClone));
          }
          return response;
        }).catch(() => cached);
        return cached || fetchPromise;
      })
    );
    return;
  }
});

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
