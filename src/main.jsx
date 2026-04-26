// ════════════════════════════════════════════════════════════════
// MVDroiD — main.jsx (entry point Vite)
// ════════════════════════════════════════════════════════════════
// Substitua TODO o conteúdo do seu src/main.jsx atual por este.
//
// Inclui:
//  1. Shim do window.storage (CORREÇÃO DO BUG do backup sumindo)
//  2. Render normal do App
//  3. Service Worker para PWA offline (só em produção)
// ════════════════════════════════════════════════════════════════

import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';

// ───────── SHIM DO window.storage ─────────
// O App.jsx foi originalmente escrito pra rodar dentro do Claude artifacts,
// onde existe uma API `window.storage` async. Em produção (Netlify), essa
// API NÃO existe — então o app silenciosamente parava de salvar.
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

// ───────── SERVICE WORKER (PWA OFFLINE) ─────────
// Só registra em produção. App funciona 100% offline depois da primeira carga.
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then((reg) => {
        console.log('[MVDroiD] SW registrado:', reg.scope);
        reg.addEventListener('updatefound', () => {
          const newWorker = reg.installing;
          if (!newWorker) return;
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              console.log('[MVDroiD] Nova versão disponível, atualizando...');
              newWorker.postMessage({ type: 'SKIP_WAITING' });
            }
          });
        });
      })
      .catch((err) => console.warn('[MVDroiD] SW registro falhou:', err));

    let refreshing = false;
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (refreshing) return;
      refreshing = true;
      window.location.reload();
    });
  });
}
