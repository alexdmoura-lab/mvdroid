# Auditoria — Código Morto e Melhores Práticas — 2026-04-29
**Projeto:** Xandroid (MVDroiD) v239
**Foco:** dead code + best practices (sem duplicar AUDITORIA_CODIGO.md / AUDITORIA_CONCORRENTES.md)

---

## TL;DR (resumo executivo em 8 linhas)

- **~150 linhas** de código morto identificadas (constante `COLORS` órfã, função `scrollToCanvas` nunca chamada, `netlify.toml` inteiro obsoleto, três pares/triplas de funções clonadas).
- **package-lock.json desatualizado**: declara `html2pdf.js`, `jszip`, `fflate` no `package.json` mas o lockfile só tem `lucide-react`/`react`/`react-dom`. Build em CI vai gerar lockfile novo ou falhar conforme o flag `--ci`.
- **CSP do Vercel bloqueia o reverse-geocoding** (`fetch` para `nominatim.openstreetmap.org` violando `connect-src 'self' blob:`) — bug de segurança/funcionalidade.
- **2 chamadas `window.open(..., "_blank")`** sem `noopener,noreferrer` (linhas 1457 e 1461).
- **App.jsx com 3.275 linhas + 692 KB** num único arquivo: o maior débito técnico estrutural — afeta build, hot-reload, code review, onboarding.
- **0 elementos HTML semânticos** (`<main>`, `<nav>`, `<header>`, `<section>`); 133 botões sem `type="button"`.
- **Top 3 ações:** (1) sincronizar package-lock + remover netlify.toml + apagar `COLORS` (15 min, zero risco); (2) extrair `mkVeiSup*`, `cadDesc*`, `isPendingValue*`, `kr*` deduplicados (~80 linhas economizadas, 1 h); (3) começar refactor incremental quebrando App.jsx em pastas `components/` `hooks/` `utils/`.

---

## CÓDIGO MORTO

### 1. Imports não usados
Não foram encontrados imports completamente sem uso. Os 4 imports do topo de `App.jsx` (React, html2pdf, JSZip, fflate) e os 12 ícones de `lucide-react` são todos usados ao menos uma vez. **Zero ganho aqui.**

### 2. Funções e variáveis declaradas e nunca chamadas

| Arquivo:linha | O que é | Por que é seguro deletar | Linhas |
|---|---|---|---|
| `src/App.jsx:985` | `const scrollToCanvas=()=>setTimeout(...)` | Nenhum chamador. Confirmado por grep `scrollToCanvas\(` → 0 hits | 1 |
| `src/App.jsx:82-89` | `const COLORS={navyDark:..., bloodRed:...}` | Nenhum `COLORS.` ou `COLORS[` no código todo. Confirmado por grep | 8 |

**Funções que parecem duplicatas mas são usadas (não deletar — refatorar):**
- `isSafeDrawing` (linha 951) e `isSafeImgUrl` (linha 958) são **funções idênticas** com nomes diferentes. As duas são usadas (cada uma em um lugar), mas vale unificar (economiza 1 linha + reduz confusão).

### 3. Estados sempre com mesmo valor (sticky useState)

Análise de todos os 41 `useState`: nenhum óbvio. Todos os setters foram localizados.

Observação: vários `useState` poderiam ser `useRef` por nunca causarem re-render visível além do que já causam, mas não é dead code — é tema de "best practices" abaixo.

### 4. Branches inalcançáveis / código depois de return

Nenhum encontrado em varredura. Os blocos `try/catch` com `/* noop */` ou `/* silencioso */` são intencionais (silenciar erros opcionais).

### 5. Componentes/JSX comentado
Apenas comentários explicativos do tipo `// v201:`, `// v232:` — não há JSX morto ou `if (false)`.

### 6. Arquivos órfãos no projeto

| Arquivo | Status | Ação |
|---|---|---|
| `netlify.toml` (98 linhas) | App migrado para Vercel; netlify.toml não é usado pela Vercel | **Apagar** |
| `package-lock.json` | Lockfile desatualizado — não tem entrada de `html2pdf.js`, `jszip`, `fflate` (apenas `lucide-react`, `react`, `react-dom`). Veja seção "Dependências" abaixo | **Regenerar com `npm install`** |
| `INSTALACAO.md`, `CHANGELOG.md`, `README.md` | Documentação — manter se útil para você | Opcional |
| `icon-180.png`, `icon-192.png`, `icon-512.png`, `icon.svg` (raiz) | Existem **duplicados** em `public/` e na raiz. Os da raiz são copiados pelo Vite na build a partir de `public/`, então os da raiz não fazem nada | **Apagar os 4 da raiz** (icon-180.png, icon-192.png, icon-512.png, icon.svg) — economiza ~80 KB no repo |

### 7. Dependências não usadas / lockfile fora de sincronia

**`package.json` declara:**
```
"html2pdf.js": "^0.10.1",
"jszip": "^3.10.1",
"fflate": "^0.8.2",
"lucide-react": "^0.383.0",
"react": "^18.3.1",
"react-dom": "^18.3.1"
```

**`package-lock.json` declara apenas:**
```
"lucide-react": "^0.383.0",
"react": "^18.3.1",
"react-dom": "^18.3.1"
```

→ **html2pdf.js, jszip e fflate foram adicionados ao package.json mas o `npm install` não foi rodado depois**. Isso é grave por dois motivos:
1. Em CI/CD com `npm ci` (modo "instalação reproduzível"), o build **falha** porque o lockfile não bate com o package.json.
2. Em produção pode estar usando uma versão diferente do que você acha — Vercel roda `npm install` no zero a cada build.

**Ação:** `npm install` localmente, comitar `package-lock.json` atualizado.

**Sobre o uso real:**
- `JSZip`: usado em `App.jsx:1516` para gerar o DOCX (formato OOXML). **Manter.**
- `html2pdf.js`: usado em `App.jsx:1979` (`genPdfBlobFromHtml`) para gerar PDFs do croqui/RRV. **Manter.**
- `fflate`: usado em `App.jsx:2007` para o ZIP de exportação completa. **Manter.**

→ Então **nenhuma dependência é dead**, mas o lockfile precisa ser sincronizado.

### 8. Comentários velhos referenciando código que não existe mais

| Linha | Comentário | Status |
|---|---|---|
| `index.html:51` | `/* v211: overscroll-behavior REMOVIDO do body... */` | comentário de remoção, OK manter pequeno tempo, depois apagar |
| `App.jsx:163-170` (dentro do hook de delete em `tryApplyUpdate`, etc.) | Várias linhas com `// v223:` que referenciam alterações antigas mas o código atual continua valendo | **manter** |
| `main.jsx:49` | `const IDB_DB_NAME = 'mvdroid';` (string `mvdroid`, não `xandroid`) | Manter (renomear quebraria os dados gravados de usuários!) |
| `App.jsx:825` | `window.__mvdroidIsSaving = true` | idem (compatibilidade com versões antigas) |

### 9. Código duplicado (refactor com ganho real)

| Padrão | Lugares | Linhas para extrair | Ganho |
|---|---|---|---|
| `mkVeiSupD` (1757) ≈ `mkVeiSup` (2303) ≈ `mkVeiSupR` (2330) | 3 cópias literalmente idênticas | mover para o nível raiz como `mkVeiSup` | -2 funções (~6 linhas + 3 cópias funcionais) |
| `cadDescDx` (1574) ≡ `cadDesc` (2138) | 2 cópias 100% iguais (IIFE) | extrair como `useMemo` ou helper | -3 linhas |
| `instrumentoExecDx` (1575) ≡ `instrumentoExec` (2139) | 2 cópias iguais | idem | -2 linhas |
| `isPendingValue` (1537) ≡ `isPendingValueP` (2165) | 2 cópias literalmente iguais | helper único | -2 linhas |
| `kr` (1598) e `krP` (2173) | quase iguais — `kr` retorna array `[label,val]`, `krP` retorna `{label,val}` — só o shape muda no fim | unificar com flag de formato | -2 linhas |
| `krNum` (1599) ≡ `krNumP` (2174) (módulo o shape) | idem | idem | -1 linha |
| `isSafeDrawing` (951) ≡ `isSafeImgUrl` (958) | 2 funções iguais com nomes diferentes | um único `isSafeBlobOrDataUrl` | -1 linha |
| Loop `localStorage.setItem` em catch (200-218 do main.jsx) | mesmo `try/catch` em get/set/delete/list | helper `lsFallback` | ~6 linhas |
| `<button> tela inicial / +Vestígio / +Veículo` (~12 botões) repetem mesmo objeto `style={{...bt, background:"..."}}` | 2658, 2874 etc | extrair `<PrimaryButton>` / `<DangerButton>` componentes | ~30 linhas em JSX, mais legível |
| Rendering de `<select>` com 38 DPs (linha 2779) repetido 2x no app | 1ª e em outro modal | constante `const DP_OPTIONS=[...]` | ~60 linhas de JSX repetido |

**Total estimado de duplicação removível: ~80-100 linhas no arquivo `.jsx`** + componentização que aliviaria mais.

### TOTAL: ~150 linhas / ~5-10 KB economizáveis em código-fonte
(o ganho de bundle minificado é menor — provavelmente 2-3 KB gzipped — porque minificadores já removem muito código morto, mas a **legibilidade e manutenção** ganham bastante)

---

## MELHORES PRÁTICAS

### React

#### 1. Componente App.jsx é gigantesco demais
- **3.275 linhas, 692 KB num único arquivo `.jsx`**.
- Vite hot-reload fica mais lento. Code review impossível em PR. Onboarding quase inviável.
- Recomenda-se quebrar em pastas:
  ```
  src/
    components/
      camera/BurstModal.jsx
      camera/FotoBtn.jsx
      forms/F_.jsx, TX_.jsx, Ck_.jsx, SN_.jsx, Rd_.jsx, Nw_.jsx
      cards/Cd_.jsx, EmptyState.jsx
      svg/anatomy/BF.jsx, BB.jsx, ...
      svg/vehicles/MotoLatSvg.jsx, BusIntSvg.jsx, ...
      tabs/TabSolicitacao.jsx, TabLocal.jsx, TabVestigios.jsx, ...
    hooks/
      useStorage.js, useBackup.js, useCanvas.js
    utils/
      formatters.js (fmtDt, toTitleCase, normMat...)
      docx.js (saveCroquiDocx + helpers Pp, ROW_*, etc.)
      pdf.js (savePDF + bPDF + bRRV)
      pickers.js (TEMPLATES, LOCAIS, VESTIGIOS_EXTRAS, PERITOS)
      constants.js (TAB_*, COLORS removido, BACKUP_EXPIRY_MS, etc.)
    App.jsx (apenas o componente raiz com state + roteamento de abas)
  ```
- **Não precisa fazer tudo de uma vez.** Pode-se fazer 1 pasta por semana.

#### 2. useEffect com dependency array suprimido (`eslint-disable-line`)
- Linha 856: `}, [loggedIn]);// eslint-disable-line react-hooks/exhaustive-deps`
- Linha 790, 893: idem.
- **Por que ruim:** suprimir o lint mascara bugs de stale closure. A regra existe por bons motivos.
- **Como melhorar:** ou inclua todas as deps (e use `useCallback` nos handlers para evitar re-execução), ou use `useRef` para valores que não devem disparar re-render.

#### 3. Estado de UI que poderia ser `useRef` em vez de `useState`
- `tabDir` (linha 657): só é lido para escolher animação CSS, nunca exibido como texto. Poderia ser ref + classe CSS aplicada via `className`.
- `gpsLoading` (linha 700): só altera label de botão. Atual está OK, mas notar que cada toggle re-renderiza o app inteiro.
- **Não urgente** — só vale se você notar lag.

#### 4. `key={i}` em listas dinâmicas (anti-pattern)
- Linha 2721: `[0,1,2,3,4,5].map(ri=><g key={ri}>...)`. **Aceitável** porque o array é estático.
- Linha 3273: `tabs.map((x,i)=> <button ref={...} key={i} ...>)`. As tabs nunca são reordenadas/removidas, então OK na prática. Mesmo assim a recomendação é usar `key={x.l}` para o futuro.

#### 5. Mutação direta de state — não encontrada
Boa prática preservada.

#### 6. Side effects fora de useEffect
- Linha 765: `pushGuard()` é chamado direto no corpo. Está dentro de `useEffect` no contexto, mas a chamada inline é defensiva. OK.
- Linha 1185 (área dos handlers de canvas): chamadas `setTimeout(()=>sv(),50)` dentro de event handlers — OK por serem reativos a eventos do usuário.

#### 7. Falta de Context API / Props drilling
- O `data` (estado do croqui), `t` (tema), `dark`, `accent`, `s` (setter) são passados como props para 5+ níveis. Funciona, mas é verboso.
- Um único `<XandroidContext.Provider value={{data, s, t, dark}}>` simplificaria muito o código de cada subcomponente.

#### 8. `React.memo` com comparador customizado
- Linha 195: `F_` usa `(a,b)=>a.k===b.k && a.label===b.label && a.type===b.type && a.val===b.val`.
- **Comentário:** ignora as props `ph`, `onChange`, `styles` no comparador. Se `onChange` mudar, o componente não re-renderiza — pode causar stale closure. Para a sua arquitetura atual está funcionando porque `onChange` é o setter `s` que não muda, mas é frágil.

---

### JavaScript moderno

#### 1. `var` — nenhum encontrado. Excelente.

#### 2. `==` / `!=` — só 5 ocorrências, todas em casos seguros (`!=="ok"`, `!== "Outro"` etc.). OK.

#### 3. `JSON.parse(JSON.stringify())` para clonar — não encontrado. Bom.

#### 4. `.then().then()` encadeado vs async/await
- Linha 1001: `fetch(...).then(r=>r.json()).then(j=>...)` — **funciona, mas seria mais legível como async/await**. A função wrapping já é síncrona; converter `getCurrentPosition` para Promise + await ficaria melhor.
- Em geral o resto do código já usa `async/await` consistentemente. OK.

#### 5. Magic numbers / strings
- `1200` e `850` (dimensões fixas do canvas) aparecem ~30 vezes no arquivo. Devia ser `const CANVAS_W=1200, CANVAS_H=850;` no topo.
- `5000`, `8000`, `30000` (timeouts) — poderia ser `const GPS_TIMEOUT_MS=8000;`
- Cores hex como `"#ff3b30"`, `"#34c759"`, `"#007aff"` aparecem dezenas de vezes — estavam destinadas ao `COLORS` mas você nunca usou! Consolidar finalmente.

#### 6. Optional chaining
- O uso de `?.` é **bom**: 80+ ocorrências, defensivo.
- Em alguns lugares ainda há padrão `if (a && a.b && a.b.c)` que poderia virar `if (a?.b?.c)` (uns 5 lugares).

#### 7. `structuredClone`
- Onde apropriado, troque clones manuais por `structuredClone(obj)` (suporte global em iOS 15.4+, Chrome 98+ — todos os browsers que rodam o Xandroid).

---

### Estrutura de projeto

| Item | Status |
|---|---|
| TypeScript | ❌ Não usado. **Para um app forense onde os dados precisam ter shape estável (vestígios, feridas, fotos com gps...) o TypeScript daria muita segurança.** Migração progressiva é viável: renomear `.jsx`→`.tsx` aos poucos. |
| ESLint | ❌ Não há `.eslintrc.*`. Você usa comentários `// eslint-disable-line` mas sem o lint configurado, eles não fazem nada. Sugerir: adicionar `eslint` + `eslint-plugin-react-hooks` (essencial). |
| Prettier | ❌ Não há `.prettierrc`. O código tem **estilo inconsistente** (linhas de 5000+ caracteres misturadas com linhas curtas). Um `prettier --write src/**/*.jsx` quebraria o arquivo todo bonito. |
| Testes (Jest/Vitest) | ❌ Não há. Para app forense é grave: bug em PDF/DOCX = perícia comprometida. **Recomendo Vitest** com pelo menos: (1) teste do gerador de DOCX (string XML válido), (2) teste do gerador de PDF (HTML válido), (3) teste das funções `tpStr`, `normMat`, `lookupPerito`, `mkAutoLegend`. Cobertura mínima de 30% já dá tranquilidade. |
| Git hooks | ❌ Não há `.husky/`, `.pre-commit-config.yaml`. Bom adicionar `husky` + `lint-staged` quando ESLint estiver instalado. |
| `.github/workflows/*.yml` | A pasta existe mas não verifiquei conteúdo. CI rodando build a cada PR é o mínimo. |

---

### Acessibilidade

| Item | Status no Xandroid |
|---|---|
| HTML semântico (`<main>`, `<nav>`, `<header>`, `<section>`) | ❌ **0 ocorrências.** Tudo é `<div>`. Para PWA forense isso é OK, mas leitor de tela (TalkBack/VoiceOver) navega pior. |
| `<button type="button">` em vez do `submit` default | 6 botões com `type="button"` explícito; **133 sem.** Como não há `<form>`, o default `submit` não faz nada de errado, mas é boa prática consistente. |
| `<div onClick>` em vez de `<button>` | 6 ocorrências (linhas 271, 2873, 2876, 3115, 3173, 3271). 5 são modais/cards expansíveis. Devia virar `<button>` ou ter `role="button"` + `tabIndex={0}` + tratamento de Enter/Space. |
| `aria-live` para áreas que atualizam (toast, status) | ❌ **0 ocorrências.** O componente Toast (`setToast`) deveria estar em um container com `aria-live="polite"` para que leitores de tela leiam "✅ Vestígio duplicado" etc. |
| `aria-label` em botões só com ícone | ✅ Bem aplicado (60+ ocorrências). |
| `aria-modal="true"` em modais | ✅ Aplicado em BurstModal (linha 254). Faltam nos modais de confirmação. |
| `role="dialog"` | ✅ 1 uso (BurstModal). Demais modais usam só `className="modal-overlay"`. |
| Foco gerenciado em modais | ⚠ Parcial — não há `autoFocus` em todos os botões primários, e ao fechar modal o foco não retorna ao botão que abriu. |
| Contraste de cores no dark mode | Não auditado, mas vale rodar Lighthouse. |

---

### Segurança best-practice

#### Achados positivos
- ✅ `target="_blank"` em `<a>` JSX **sempre** vem com `rel="noopener noreferrer"` (achado: linha 2777).
- ✅ Não há `dangerouslySetInnerHTML` com dados do usuário (apenas com strings CSS estáticas, linhas 3153 e 3173).
- ✅ Funções `esc()`, `esc2()`, `X()` escapam HTML/XML antes de jogar em DOCX/PDF.
- ✅ Vercel envia HSTS, X-Frame-Options, CSP.

#### Problemas

**1. `window.open(...,"_blank")` sem `noopener`** (críticos):
- `App.jsx:1457` → `window.open(`https://...maps@${...},${...},18z\`, "_blank")`
- `App.jsx:1461` → `window.open("https://www.google.com/maps", "_blank")`
- **Por quê é problema:** a janela aberta tem acesso ao `window.opener` da janela pai e pode redirecionar o Xandroid para um site de phishing (tabnabbing). Como Maps é controlado pelo Google, o risco é baixo, mas é trivial corrigir:
  ```js
  window.open(url, "_blank", "noopener,noreferrer");
  ```

**2. CSP do Vercel quebra reverse-geocoding** (funcional!):
- `vercel.json:29` → `connect-src 'self' blob:`
- `App.jsx:1001` → `fetch("https://nominatim.openstreetmap.org/reverse?...")`
- **Resultado:** o navegador bloqueia a chamada (em produção, com CSP ativo) e a feature de auto-preencher endereço a partir do GPS **não funciona**.
- **Correção:** adicionar `https://nominatim.openstreetmap.org` em `connect-src`:
  ```json
  "connect-src 'self' blob: https://nominatim.openstreetmap.org"
  ```
  Idem para `netlify.toml:44` (se você for manter ele por enquanto).

**3. Versões das libs**
- `react@^18.3.1` → atual (18.3.x sem CVEs conhecidos).
- `vite@^5.4.16` → atual.
- `lucide-react@^0.383.0` → tem versão `^0.500+` mais nova; nada de CVE, mas vale atualizar.
- `html2pdf.js@^0.10.1` → última. Tem dependências internas (`html2canvas@1.4.1`, `jspdf`). `html2canvas@1.4.1` tem CVE conhecido de prototype pollution mas que **só afeta uso server-side** — em browser, baixo risco.
- `jszip@^3.10.1` → atual.
- `fflate@^0.8.2` → atual.

**Recomendação:** rodar `npm audit` quando o lockfile estiver sincronizado.

**4. Logs verbosos em produção**
- `console.log` aparece em `main.jsx` (7×) e `sw.js` (4×). Em produção pode revelar lógica interna. Considerar wrapper que só loga em dev:
  ```js
  const log = import.meta.env.DEV ? console.log : () => {};
  ```

---

### Build / Deploy

#### vite.config.js
```js
build: { outDir: 'dist', sourcemap: false, chunkSizeWarningLimit: 2000 }
```

**Sugestões:**
- Adicionar `splitVendorChunkPlugin()` para separar `react/react-dom` de `html2pdf/jszip/fflate` em chunks. Hoje tudo cai num bundle só.
- Usar `terser` em vez do esbuild default para minificação mais agressiva (~5% menor):
  ```js
  build: { minify: 'terser', terserOptions: { compress: { drop_console: true } } }
  ```
  → bonus: remove os `console.warn`/`console.error` do bundle de produção.
- Usar `manualChunks` para agrupar lib pesadas:
  ```js
  rollupOptions: {
    output: {
      manualChunks: {
        'pdf-libs': ['html2pdf.js', 'jszip'],
        'react': ['react', 'react-dom'],
      }
    }
  }
  ```

#### vercel.json
- ✅ Headers de segurança bons.
- ❌ Sem `headers` específicos de Cache-Control para `/img/*` ou para JS/CSS hasheados — depende do default da Vercel (que é razoável, mas explícito é melhor):
  ```json
  {
    "source": "/img/(.*)",
    "headers": [
      { "key": "Cache-Control", "value": "public, max-age=31536000, immutable" }
    ]
  },
  {
    "source": "/assets/(.*)",
    "headers": [
      { "key": "Cache-Control", "value": "public, max-age=31536000, immutable" }
    ]
  }
  ```
- ❌ A diretiva CSP `connect-src 'self' blob:` está bloqueando `nominatim.openstreetmap.org` (ver Segurança).

#### Service Worker
- ✅ Versionamento explícito (`CACHE_VERSION = 'xandroid-v8'`).
- ✅ Limpeza de caches antigos no `activate`.
- ✅ Estratégia diferenciada por tipo de recurso.
- ⚠ **Não notifica o usuário sobre nova versão.** A "atualização silenciosa" pode trocar a versão durante uso e o usuário não percebe nada. Para app forense, talvez quisesse um toast `"Nova versão disponível — toque para atualizar"`. Já existe um eventeer de `updatefound` em `main.jsx:338`; bastaria expor flag para o React mostrar UI.
- ⚠ A lista `PRECACHE_URLS` no `sw.js:28-46` é manual — se você adicionar uma 9ª imagem em `/img/anatomy/`, precisa lembrar de adicionar aqui. Considere usar Workbox ou `vite-plugin-pwa` para auto-gerar.

---

### PWA específico

#### manifest.webmanifest

| Campo | Status |
|---|---|
| `name`, `short_name`, `description` | ✅ |
| `start_url`, `display`, `scope` | ✅ |
| `theme_color`, `background_color` | ✅ |
| `icons` (192, 512, SVG, maskable) | ✅ |
| `lang`, `orientation` | ✅ |
| `categories` | ❌ ausente. Sugerido: `"categories": ["productivity", "utilities"]` |
| `shortcuts` | ❌ ausente. Para o seu caso ajudaria muito ter atalhos como "Novo croqui", "Slot 1", "Câmera" — aparecem no long-press do ícone na home screen Android. |
| `screenshots` | ❌ ausente. Importante se um dia você listar na Play Store via TWA, mas **não obrigatório**. |
| `share_target` | ❌ ausente. Vale a pena: permitiria receber fotos compartilhadas de outros apps direto no Xandroid — útil para perícia, mas exige código no SW. |
| `id` | ❌ ausente. Sem ele, mudança em `start_url` pode causar reinstalação. Adicionar `"id": "/"` resolve. |

#### iOS-específico
- ✅ `apple-mobile-web-app-capable`
- ✅ `apple-mobile-web-app-status-bar-style: black-translucent`
- ✅ `apple-mobile-web-app-title`
- ⚠ Apenas **um** apple-touch-icon (180×180). iOS aceita só esse e funciona, mas para ser exemplar adicione 152×152 (iPad) e 167×167 (iPad Pro).
- ✅ `viewport-fit=cover` configurado
- ✅ `env(safe-area-inset-*)` usado em vários estilos

#### Atualização do SW
- A "atualização silenciosa" (Opção A) está bem implementada, mas **não há feedback visual ao usuário** quando uma nova versão é instalada. Em app forense, talvez queira um toast pequeno tipo "✅ App atualizado — v240 ativa" depois do reload, ou um ícone discreto na barra de status.

---

## Recomendação final

### Quick wins (deletar/corrigir agora — ~1h, zero risco)

1. **`npm install` localmente** e comitar o `package-lock.json` atualizado. **Crítico** — sem isso o build de produção pode estar instalando versões diferentes do que você desenvolve.
2. **Apagar `netlify.toml`** (98 linhas).
3. **Apagar `icon-180.png`, `icon-192.png`, `icon-512.png`, `icon.svg` da raiz** (já existem em `public/`).
4. **Apagar `const COLORS={...}`** (linhas 82-89 de App.jsx).
5. **Apagar `const scrollToCanvas`** (linha 985 de App.jsx).
6. **Adicionar `noopener,noreferrer`** em `window.open(...)` (linhas 1457 e 1461).
7. **Corrigir CSP** em `vercel.json` para incluir `https://nominatim.openstreetmap.org` no `connect-src`.
8. **Renomear `isSafeImgUrl` → reutilizar `isSafeDrawing`** (uma única função).

### Refactor incremental (1 semana, espalhado nas próximas 2 versões)

1. Extrair os helpers duplicados (`mkVeiSup*`, `cadDesc*`, `isPendingValue*`, `kr/krP`) — **40 minutos, ~80 linhas a menos**.
2. Criar `src/utils/constants.js` com `TAB_*`, `BACKUP_EXPIRY_MS`, `QUOTA_PLACEHOLDER_KB`, `LOCALE`, dimensões do canvas — **30 minutos**.
3. Criar `src/utils/formatters.js` com `fmtDt`, `toTitleCase`, `tpStr`, `tpHas`, `normMat`, `lookupPerito`, `uid`, `esc`, `escDocx` — **30 minutos**.
4. Criar `src/data/templates.js` com `TEMPLATES`, `LOCAIS`, `PERITOS`, `VEST_GROUPS`, `VESTIGIOS_EXTRAS`, `APP_ICONS`, listas WT/RF/etc — **1 h**.
5. Mover `BurstModal`, `F_`, `TX_`, `Ck_`, `SN_`, `Rd_`, `Nw_`, `Cd_`, `EmptyState`, `AppIcon` para `src/components/forms/` — **2 h**.
6. Adicionar **ESLint + Prettier** e rodar 1× em todo o repo — **30 min**, gera 1 PR enorme mas vale ouro a partir daí.

### Longo prazo — 1-2 meses, fazer só se for evoluir muito o app

1. **Migrar para TypeScript** progressivamente. Começa renomeando `.jsx`→`.tsx` num arquivo por vez, sem `strict` no início.
2. **Quebrar App.jsx em containers por aba**: `TabSolicitacao.jsx`, `TabLocal.jsx`, `TabVestigios.jsx`, `TabCadaver.jsx`, `TabVeiculo.jsx`, `TabExportar.jsx`, `TabDesenho.jsx`. Cada um vira ~300-500 linhas (gerenciável).
3. **Criar XandroidContext** com `{data, vestigios, fotos, ...}` para parar com props drilling.
4. **Adicionar Vitest** com pelo menos 30% de cobertura nas funções críticas (geração de DOCX/PDF).
5. **Adicionar `vite-plugin-pwa`** (Workbox) e remover o `sw.js` manual — auto-precaching, atualização gerenciada, manifest tipado.
6. **Refazer CSP mais restritivo** (sem `unsafe-inline`) usando hashes/nonces — só vale se você quiser o app forense compliant com OWASP.

### Ganho consolidado se fizer tudo dos quick wins + refactor incremental

- **App.jsx:** de 3.275 para ~3.000 linhas (puro delete + dedupe).
- **Repo:** -98 linhas de netlify.toml, -80 KB de ícones duplicados.
- **Bundle:** ~3 KB gzipped a menos (deletado o que minify não pegou).
- **Confiabilidade:** package-lock alinhado evita "funciona aqui não funciona em prod".
- **Funcionalidade:** geocoding reverso volta a funcionar.
- **Segurança:** dois `window.open` corrigidos.
- **DX:** ESLint + Prettier acelera futuro desenvolvimento e previne regressões.
