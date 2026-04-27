// ════════════════════════════════════════════════════════════════
// MVDroiD — main.jsx (entry point Vite)
// ════════════════════════════════════════════════════════════════
// Inclui:
//  1. Shim do window.storage (CORREÇÃO DO BUG do backup sumindo)
//  2. Render normal do App
//  3. Service Worker para PWA offline (só em produção)
//  4. Detecção de versão nova com atualização silenciosa (Opção A)
// ════════════════════════════════════════════════════════════════

import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';

// ───────── SHIM DO window.storage ─────────
// O App.jsx foi originalmente escrito pra rodar dentro do Claude artifacts,
// onde existe uma API `window.storage` async. Em produção, essa API NÃO existe —
// então o app silenciosamente parava de salvar.
//
// Esse shim cria um window.storage falso que usa localStorage por baixo,
// com a mesma interface async. App funciona idêntico em ambos os ambientes.
if (typeof window !== 'undefined' && !window.storage) {
  window.storage = {
    __isLocalStorageShim: true,
    async get(key) {
      try {
        const value = localStorage.getItem(key);
        return value !== null ? { value } : null;
      } catch (e) {
        console.warn('[storage shim] get error:', e);
        return null;
      }
    },
    async set(key, value) {
      try {
        localStorage.setItem(key, value);
        return { ok: true };
      } catch (e) {
        console.warn('[storage shim] set error:', e);
        return null;
      }
    },
    async delete(key) {
      try {
        localStorage.removeItem(key);
        return { ok: true };
      } catch (e) {
        console.warn('[storage shim] delete error:', e);
        return null;
      }
    },
    async list() {
      try {
        const keys = [];
        for (let i = 0; i < localStorage.length; i++) {
          const k = localStorage.key(i);
          if (k) keys.push(k);
        }
        return { keys };
      } catch (e) {
        console.warn('[storage shim] list error:', e);
        return { keys: [] };
      }
    }
  };
  console.log('[MVDroiD] window.storage shim ativado (modo localStorage)');
}

// ───────── RENDER ─────────
ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// ════════════════════════════════════════════════════════════════
// SERVICE WORKER + ATUALIZAÇÃO SILENCIOSA (Opção A)
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
  const tryApplyUpdate = () => {
    if (!waitingWorker) return;
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
    let refreshing = false;
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (refreshing) return;
      refreshing = true;
      console.log('[MVDroiD] Recarregando para usar nova versão...');
      window.location.reload();
    });
  });
}
