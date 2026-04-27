// ════════════════════════════════════════════════════════════════
// MVDroiD — main.jsx (entry point Vite) — v223
// ════════════════════════════════════════════════════════════════
// Inclui:
//  1. Shim do window.storage usando IndexedDB
//     • Sem limite artificial: usa a quota inteira do dispositivo
//     • Migração automática one-shot dos dados antigos do localStorage
//     • Fallback automático para localStorage se IDB falhar (modo privado)
//     • API idêntica: get/set/delete/list mantêm assinatura anterior
//     • Adicionado: estimate() expõe quota real do dispositivo
//  2. Pedido de armazenamento persistente (navigator.storage.persist)
//     para que o iOS não despeje os dados sob pressão de espaço
//  3. Render normal do App
//  4. Service Worker para PWA offline (só em produção)
//  5. Detecção de versão nova com atualização silenciosa (Opção A)
//     v223: não aplica update enquanto há save em andamento
//     (window.__mvdroidIsSaving), e espera até 10s no controllerchange
//     antes de recarregar — evita corte de gravação no IDB.
// ════════════════════════════════════════════════════════════════

import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';

// ════════════════════════════════════════════════════════════════
// SHIM DO window.storage — IndexedDB com fallback para localStorage
// ════════════════════════════════════════════════════════════════
// Antes (até v220): window.storage usava localStorage por baixo. No iOS, o
// Safari limita localStorage a ~5–50 MB por origem — o app batia no teto e
// parava de salvar fotos / backups grandes.
//
// Agora (v221+): usamos IndexedDB. Em iOS 17+ a quota disponível é da ordem
// de gigabytes (varia conforme o espaço livre do dispositivo). A API
// pública do shim — get/set/delete/list — mantém a mesma assinatura, então
// nenhum código do App.jsx precisou ser alterado para isso.
//
// v222: removido o cap de tamanho por chave. A quantidade de fotos é
// limitada apenas pelo espaço real do dispositivo. Acrescentado pedido de
// armazenamento persistente (storage.persist) — em PWA instalado no iOS,
// isso é concedido automaticamente e protege os dados de eviction.
//
// Migração: na primeira vez que o app abre depois do upgrade, lemos tudo
// que estiver em localStorage e copiamos para o IDB. Marcamos uma flag em
// localStorage para nunca repetir. Não apagamos os dados antigos do
// localStorage (segurança extra: se algo der errado, eles continuam lá
// como backup). Limpeza pode ser feita manualmente em versão futura.
// ════════════════════════════════════════════════════════════════

const IDB_DB_NAME = 'mvdroid';
const IDB_STORE_NAME = 'kv';
const IDB_VERSION = 1;
const MIGRATION_FLAG = '__mvdroid_idb_migrated__';

let _dbPromise = null;
function _openDB() {
  if (_dbPromise) return _dbPromise;
  _dbPromise = new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      reject(new Error('IndexedDB indisponível'));
      return;
    }
    const req = indexedDB.open(IDB_DB_NAME, IDB_VERSION);
    req.onupgradeneeded = (e) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains(IDB_STORE_NAME)) {
        db.createObjectStore(IDB_STORE_NAME);
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error || new Error('IDB open falhou'));
    req.onblocked = () => reject(new Error('IDB bloqueado'));
  });
  // Em caso de falha, libera a promise pra permitir retry em chamadas futuras
  _dbPromise.catch(() => { _dbPromise = null; });
  return _dbPromise;
}

async function _idbGet(key) {
  const db = await _openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(IDB_STORE_NAME, 'readonly');
    const r = tx.objectStore(IDB_STORE_NAME).get(key);
    r.onsuccess = () => resolve(r.result);
    r.onerror = () => reject(r.error);
  });
}
async function _idbSet(key, value) {
  const db = await _openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(IDB_STORE_NAME, 'readwrite');
    const r = tx.objectStore(IDB_STORE_NAME).put(value, key);
    r.onsuccess = () => resolve();
    r.onerror = () => reject(r.error);
    tx.onerror = () => reject(tx.error);
    tx.onabort = () => reject(tx.error || new Error('IDB tx abort'));
  });
}
async function _idbDelete(key) {
  const db = await _openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(IDB_STORE_NAME, 'readwrite');
    const r = tx.objectStore(IDB_STORE_NAME).delete(key);
    r.onsuccess = () => resolve();
    r.onerror = () => reject(r.error);
    tx.onerror = () => reject(tx.error);
  });
}
async function _idbKeys() {
  const db = await _openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(IDB_STORE_NAME, 'readonly');
    const r = tx.objectStore(IDB_STORE_NAME).getAllKeys();
    r.onsuccess = () => resolve(r.result || []);
    r.onerror = () => reject(r.error);
  });
}

// Migração one-shot: copia tudo de localStorage para IDB, sem sobrescrever
// dado já existente no IDB (proteção contra re-execução acidental).
async function _migrateFromLocalStorage() {
  let migrated = 0;
  try {
    if (typeof localStorage === 'undefined') return { migrated: 0 };
    if (localStorage.getItem(MIGRATION_FLAG) === '1') return { migrated: 0 };

    const keysToMigrate = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && k !== MIGRATION_FLAG) keysToMigrate.push(k);
    }

    for (const k of keysToMigrate) {
      const v = localStorage.getItem(k);
      if (v === null) continue;
      try {
        const existing = await _idbGet(k);
        if (existing === undefined) {
          await _idbSet(k, v);
          migrated++;
        }
      } catch (e) {
        console.warn('[MVDroiD] migração: falha em', k, e);
      }
    }

    try { localStorage.setItem(MIGRATION_FLAG, '1'); } catch (_) { /* ignore */ }
    if (migrated > 0) {
      console.log('[MVDroiD] Migrados ' + migrated + ' item(s) de localStorage → IndexedDB');
    }
  } catch (e) {
    console.warn('[MVDroiD] Erro na migração localStorage→IDB:', e);
  }
  return { migrated };
}

let _migrationPromise = null;
function _ensureMigrated() {
  if (!_migrationPromise) _migrationPromise = _migrateFromLocalStorage();
  return _migrationPromise;
}

// Pede armazenamento persistente — best-effort, não bloqueia.
// Em PWA instalado no iOS / Android isso geralmente é concedido sem
// prompt, e protege os dados de serem despejados pelo sistema.
async function _requestPersistence() {
  try {
    if (typeof navigator !== 'undefined' && navigator.storage && typeof navigator.storage.persist === 'function') {
      const already = navigator.storage.persisted ? await navigator.storage.persisted() : false;
      if (already) {
        console.log('[MVDroiD] Storage já está persistente');
        return true;
      }
      const granted = await navigator.storage.persist();
      console.log('[MVDroiD] navigator.storage.persist() →', granted ? 'concedido' : 'negado');
      return granted;
    }
  } catch (e) {
    console.warn('[MVDroiD] persist() falhou:', e);
  }
  return false;
}

if (typeof window !== 'undefined' && !window.storage) {
  // Inicia migração imediatamente em background; toda operação aguarda antes de prosseguir
  _ensureMigrated();
  // Pede persistência em paralelo (não bloqueia)
  _requestPersistence();

  window.storage = {
    __isIndexedDBShim: true,
    async get(key) {
      try {
        await _ensureMigrated();
        const value = await _idbGet(key);
        if (value === undefined || value === null) return null;
        return { value: typeof value === 'string' ? value : String(value) };
      } catch (e) {
        console.warn('[storage shim] get error:', e);
        // Fallback: tenta localStorage se IDB falhar (ex: modo privado restritivo)
        try {
          const v = localStorage.getItem(key);
          return v !== null ? { value: v } : null;
        } catch (_) { return null; }
      }
    },
    async set(key, value) {
      try {
        await _ensureMigrated();
        const v = typeof value === 'string' ? value : String(value);
        await _idbSet(key, v);
        return { ok: true };
      } catch (e) {
        console.warn('[storage shim] set error:', e);
        try {
          const v = typeof value === 'string' ? value : String(value);
          localStorage.setItem(key, v);
          return { ok: true };
        } catch (_) { return null; }
      }
    },
    async delete(key) {
      try {
        await _ensureMigrated();
        await _idbDelete(key);
        return { ok: true };
      } catch (e) {
        console.warn('[storage shim] delete error:', e);
        try { localStorage.removeItem(key); return { ok: true }; } catch (_) { return null; }
      }
    },
    async list(prefix) {
      try {
        await _ensureMigrated();
        const keys = await _idbKeys();
        const filtered = keys.filter((k) => typeof k === 'string' && (!prefix || k.startsWith(prefix)));
        return { keys: filtered };
      } catch (e) {
        console.warn('[storage shim] list error:', e);
        try {
          const ks = [];
          for (let i = 0; i < localStorage.length; i++) {
            const k = localStorage.key(i);
            if (k && k !== MIGRATION_FLAG && (!prefix || k.startsWith(prefix))) ks.push(k);
          }
          return { keys: ks };
        } catch (_) { return { keys: [] }; }
      }
    },
    // Retorna quota e uso real do dispositivo (em bytes)
    async estimate() {
      try {
        if (typeof navigator !== 'undefined' && navigator.storage && navigator.storage.estimate) {
          const est = await navigator.storage.estimate();
          return {
            usage: typeof est.usage === 'number' ? est.usage : 0,
            quota: typeof est.quota === 'number' ? est.quota : 0
          };
        }
      } catch (e) {
        console.warn('[storage shim] estimate error:', e);
      }
      return null;
    }
  };
  console.log('[MVDroiD] window.storage shim ativado (modo IndexedDB)');
}

// ───────── RENDER ─────────
ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// ════════════════════════════════════════════════════════════════
// SERVICE WORKER + ATUALIZAÇÃO SILENCIOSA (Opção A)
// (sem mudanças vs v220)
// ════════════════════════════════════════════════════════════════
// Estratégia:
// 1. Registra SW em produção
// 2. Quando detecta nova versão, baixa em background SEM interromper
// 3. Quando o usuário NÃO está editando dados (sem mexer há >30s ou
//    quando minimiza o app), aplica a atualização e recarrega
// 4. Se o usuário está digitando ativamente, espera ele parar
// ════════════════════════════════════════════════════════════════

if ('serviceWorker' in navigator && import.meta.env.PROD) {
  let waitingWorker = null;
  let lastUserActivity = Date.now();
  const IDLE_THRESHOLD_MS = 30000; // 30 segundos sem mexer = "ocioso"

  // Detecta atividade do usuário
  ['mousedown', 'keydown', 'touchstart', 'scroll'].forEach((evt) => {
    document.addEventListener(evt, () => {
      lastUserActivity = Date.now();
    }, { passive: true });
  });

  // Tenta aplicar a atualização quando seguro
  // v223: NÃO aplica se há um save em andamento (window.__mvdroidIsSaving)
  // — espera o próximo ciclo. Evita reload cortar gravação no IDB pela metade.
  const tryApplyUpdate = () => {
    if (!waitingWorker) return;
    if (typeof window !== 'undefined' && window.__mvdroidIsSaving) return;
    const idleFor = Date.now() - lastUserActivity;
    if (idleFor >= IDLE_THRESHOLD_MS || document.visibilityState === 'hidden') {
      console.log('[MVDroiD] Aplicando atualização silenciosa...');
      waitingWorker.postMessage({ type: 'SKIP_WAITING' });
    }
  };

  // Verifica a cada 5 segundos se pode aplicar a atualização
  setInterval(tryApplyUpdate, 5000);

  // Quando minimiza o app, atualiza imediatamente
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') {
      tryApplyUpdate();
    }
  });

  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then((reg) => {
        console.log('[MVDroiD] SW registrado:', reg.scope);

        // Verifica atualização imediatamente ao abrir
        reg.update().catch((e) => console.warn('[MVDroiD] SW update check:', e));

        // Verifica novamente quando o app volta do background
        document.addEventListener('visibilitychange', () => {
          if (document.visibilityState === 'visible') {
            reg.update().catch((e) => console.warn('[MVDroiD] SW update on visible:', e));
          }
        });

        // Quando uma nova versão é detectada
        reg.addEventListener('updatefound', () => {
          const newWorker = reg.installing;
          if (!newWorker) return;
          console.log('[MVDroiD] Nova versão detectada, baixando em background...');

          newWorker.addEventListener('statechange', () => {
            // Quando o novo SW terminou de instalar e está esperando
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              console.log('[MVDroiD] Nova versão pronta. Aplicando quando o app estiver ocioso.');
              waitingWorker = newWorker;
              // Tenta aplicar imediatamente se estiver ocioso
              tryApplyUpdate();
            }
          });
        });

        // Se já tem worker esperando ao iniciar (versão pendente)
        if (reg.waiting && navigator.serviceWorker.controller) {
          console.log('[MVDroiD] Versão pendente encontrada. Aplicando quando ocioso.');
          waitingWorker = reg.waiting;
          tryApplyUpdate();
        }
      })
      .catch((err) => console.warn('[MVDroiD] SW registro falhou:', err));

    // Quando o controller muda (atualização aplicada), recarrega a página
    // v223: se houver save em andamento, espera terminar antes de recarregar
    // — máximo 10s para não travar indefinidamente em caso de save preso.
    let refreshing = false;
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (refreshing) return;
      refreshing = true;
      const reloadStart = Date.now();
      const safeReload = () => {
        const waited = Date.now() - reloadStart;
        if (window.__mvdroidIsSaving && waited < 10000) {
          setTimeout(safeReload, 500);
          return;
        }
        if (window.__mvdroidIsSaving) {
          console.warn('[MVDroiD] Reload forçado: save passou de 10s sem terminar');
        }
        console.log('[MVDroiD] Recarregando para usar nova versão...');
        window.location.reload();
      };
      safeReload();
    });
  });
}
