// ════════════════════════════════════════════════════════════════
// MVDroiD — Service Worker
// ════════════════════════════════════════════════════════════════
// Faz o app funcionar 100% offline depois da primeira carga.
//
// Estratégia:
//  • App shell (HTML, JS, CSS, imagens): cache-first
//      → carrega do cache, atualiza em background
//      → app abre instantâneo, mesmo sem rede
//  • Bibliotecas externas (cdnjs, etc): stale-while-revalidate
//      → usa cache se tiver, busca rede em paralelo, atualiza pra próxima
//  • Em modo avião: app continua funcionando 100%
//
// Versão: incrementar quando atualizar este arquivo (força refresh do cache)
// ════════════════════════════════════════════════════════════════

const CACHE_VERSION = 'mvdroid-v1';
const PRECACHE_URLS = [
  '/',
  '/index.html',
  '/manifest.json',
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

// ───────── INSTALL ─────────
// Roda quando service worker é instalado pela primeira vez (ou nova versão)
self.addEventListener('install', (event) => {
  console.log('[SW] Install', CACHE_VERSION);
  event.waitUntil(
    caches.open(CACHE_VERSION).then((cache) => {
      // Pre-cache de assets críticos. Falhas individuais não derrubam tudo.
      return Promise.allSettled(
        PRECACHE_URLS.map((url) =>
          cache.add(url).catch((err) => {
            console.warn('[SW] Falha pré-cache:', url, err);
          })
        )
      );
    }).then(() => self.skipWaiting()) // ativa imediatamente
  );
});

// ───────── ACTIVATE ─────────
// Roda quando service worker passa a controlar a página
self.addEventListener('activate', (event) => {
  console.log('[SW] Activate', CACHE_VERSION);
  event.waitUntil(
    caches.keys().then((keys) => {
      // Apaga caches antigos (de versões anteriores do SW)
      return Promise.all(
        keys
          .filter((k) => k !== CACHE_VERSION && k.startsWith('mvdroid-'))
          .map((k) => {
            console.log('[SW] Deletando cache antigo:', k);
            return caches.delete(k);
          })
      );
    }).then(() => self.clients.claim()) // toma controle imediato
  );
});

// ───────── FETCH ─────────
// Intercepta todas as requisições da página
self.addEventListener('fetch', (event) => {
  const req = event.request;
  const url = new URL(req.url);

  // Ignora requisições que não sejam GET (POSTs nunca são cacheados)
  if (req.method !== 'GET') return;

  // Ignora requisições com schemas estranhos (chrome-extension, etc.)
  if (!url.protocol.startsWith('http')) return;

  // ─── Estratégia: navegação (HTML) ───
  // Network-first: tenta rede, se falhar usa cache
  // Garante que atualizações chegam rápido quando online
  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req)
        .then((response) => {
          // Atualiza cache com versão fresca
          const respClone = response.clone();
          caches.open(CACHE_VERSION).then((cache) => cache.put(req, respClone));
          return response;
        })
        .catch(() => {
          // Sem rede → usa cache
          return caches.match(req).then((cached) => {
            return cached || caches.match('/index.html');
          });
        })
    );
    return;
  }

  // ─── Estratégia: assets do próprio domínio ───
  // Cache-first: usa cache se tiver, atualiza em background
  if (url.origin === self.location.origin) {
    event.respondWith(
      caches.match(req).then((cached) => {
        if (cached) {
          // Tem em cache — retorna imediato e atualiza em background
          fetch(req).then((response) => {
            if (response && response.status === 200) {
              const respClone = response.clone();
              caches.open(CACHE_VERSION).then((cache) => cache.put(req, respClone));
            }
          }).catch(() => { /* offline, ok */ });
          return cached;
        }
        // Não tem em cache — busca na rede e cacheia
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

  // ─── Estratégia: bibliotecas externas (CDN) ───
  // Stale-while-revalidate: usa cache, atualiza em paralelo
  // (html2pdf.js, JSZip, etc. raramente mudam)
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

  // ─── Demais (analytics, etc.) ───
  // Deixa rolar normal, sem interceptar
});

// ───────── MENSAGENS DA PÁGINA ─────────
// Permite que a página force atualização do SW
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
