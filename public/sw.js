// ════════════════════════════════════════════════════════════════
// MVDroiD — Service Worker (Opção A — atualização silenciosa)
// CACHE_VERSION: mvdroid-v10 (acompanha App v226 — limpeza + câmera rajada)
// ════════════════════════════════════════════════════════════════
// VERSÃO INCREMENTADA pra forçar invalidação dos caches antigos.
// v226: limpeza de código morto, helper pickFile, touch targets ≥44px,
// modais com role=dialog/aria-modal, haptic na troca de aba, modal
// customizado para confirmar Apagar TODOS, e câmera rajada (modo burst)
// permitindo várias fotos seguidas sem fechar a câmera.
//
// Estratégia:
//  • HTML / index: NETWORK-FIRST (sempre busca novo, fallback offline)
//    Isso garante que mudanças cheguem rápido quando você abre o app.
//  • Assets versionados (.js/.css com hash): cache-first eterno
//    Vite gera arquivos como index-G7Vibdf1.js — o nome muda quando o conteúdo
//    muda, então cache-first é seguro e rápido.
//  • Imagens anatômicas e ícones PWA: cache-first
//  • Bibliotecas externas (cdnjs): stale-while-revalidate
//
// Em modo avião: app continua funcionando 100% após primeiro uso.
// ════════════════════════════════════════════════════════════════

const CACHE_VERSION = 'mvdroid-v10';
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

  // ──────────────────────────────────────────────────────
  // 1) NAVEGAÇÃO (HTML): network-first, fallback cache
  //    Garante que index.html sempre chega novo se tiver internet
  // ──────────────────────────────────────────────────────
  if (req.mode === 'navigate' || req.destination === 'document') {
    event.respondWith(
      fetch(req, { cache: 'no-store' })
        .then((response) => {
          if (response && response.status === 200) {
            const respClone = response.clone();
            caches.open(CACHE_VERSION).then((cache) => cache.put(req, respClone));
          }
          return response;
        })
        .catch(() => {
          return caches.match(req).then((cached) => {
            return cached || caches.match('/index.html') || caches.match('/');
          });
        })
    );
    return;
  }

  // ──────────────────────────────────────────────────────
  // 2) HTML cru (rota /index.html): network-first também
  // ──────────────────────────────────────────────────────
  if (url.pathname === '/' || url.pathname === '/index.html') {
    event.respondWith(
      fetch(req, { cache: 'no-store' })
        .then((response) => {
          if (response && response.status === 200) {
            const respClone = response.clone();
            caches.open(CACHE_VERSION).then((cache) => cache.put(req, respClone));
          }
          return response;
        })
        .catch(() => caches.match(req).then((c) => c || caches.match('/index.html')))
    );
    return;
  }

  // ──────────────────────────────────────────────────────
  // 3) Assets do próprio domínio (JS/CSS/imagens):
  //    Cache-first com refresh em background (stale-while-revalidate)
  //    JS/CSS do Vite têm hash no nome, então é seguro cachear sempre
  // ──────────────────────────────────────────────────────
  if (url.origin === self.location.origin) {
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

  // ──────────────────────────────────────────────────────
  // 4) Bibliotecas externas (CDN): stale-while-revalidate
  // ──────────────────────────────────────────────────────
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
