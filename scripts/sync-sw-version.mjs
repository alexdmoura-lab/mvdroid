// ════════════════════════════════════════════════════════════════
// Sincroniza o CACHE_VERSION do public/sw.js com src/version.js.
// Roda automaticamente em `npm run build` (via prebuild hook) e
// pode ser chamado manualmente com `npm run bump:sw`.
// ════════════════════════════════════════════════════════════════
import { readFileSync, writeFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");

// Lê src/version.js (módulo ES) e extrai CACHE_VERSION manualmente
// (evita import dinâmico que dependeria de tooling extra).
const versionFile = readFileSync(resolve(ROOT, "src/version.js"), "utf-8");
const cacheMatch = versionFile.match(/CACHE_VERSION\s*=\s*["']([^"']+)["']/);
const appMatch = versionFile.match(/APP_VERSION\s*=\s*["']([^"']+)["']/);

if (!cacheMatch || !appMatch) {
  console.error("[sync-sw-version] erro: não consegui extrair APP_VERSION/CACHE_VERSION de src/version.js");
  process.exit(1);
}

const cacheVersion = cacheMatch[1];
const appVersion = appMatch[1];

// Atualiza public/sw.js
const swPath = resolve(ROOT, "public/sw.js");
const sw = readFileSync(swPath, "utf-8");
const newSw = sw.replace(/const CACHE_VERSION\s*=\s*['"][^'"]+['"]/, `const CACHE_VERSION = '${cacheVersion}'`);

if (sw === newSw) {
  console.log(`[sync-sw-version] já em sincronia: ${cacheVersion}`);
} else {
  writeFileSync(swPath, newSw);
  console.log(`[sync-sw-version] ✓ public/sw.js sincronizado: ${cacheVersion} (app: ${appVersion})`);
}
