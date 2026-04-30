# Auditoria de Código Xandroid — 2026-04-29

**Versão analisada:** v239-Xandroid
**Arquivos lidos:** `src/App.jsx` (3.275 linhas), `src/main.jsx`, `public/sw.js`, `public/manifest.webmanifest`, `index.html`, `vercel.json`, `vite.config.js`, `package.json`

---

## TL;DR (resumo executivo)

O Xandroid está **muito mais sólido do que a média de PWAs** — vários cuidados raros já foram tomados (CSP forte, sanitização XML/HTML, validação de URLs em backups importados, ErrorBoundary, auto-save robusto, retry no save, IDB com migração, cleanup de Object URLs). **Não vi bugs críticos óbvios** que travem o app no uso normal.

Os pontos mais importantes são: **risco de perder fotos quando o auto-save falha (ele tenta de novo, mas o usuário pode fechar antes)**, **saída obrigatória do beforeunload todo carregamento** (mesmo sem dado dirty), **JSZip ainda no bundle apesar de estar marcado como migrado para fflate** (~30% do JS desperdiçado), e **uma vulnerabilidade XSS teórica baixíssima** no `pdf-preview` que já está documentada no código mas merece um cinto-de-segurança extra.

Também faltam alguns **quick-wins de UX importantes para campo**: confirmação antes de fechar a câmera com fotos pendentes, busca em cenas salvas, modo escuro automático, atalhos de teclado pra desktop.

---

## TOP 5 PROBLEMAS CRÍTICOS

### 1. JSZip ainda está no `package.json` e é importado no topo, apesar do código dizer que migrou para fflate

**O que é (em linguagem simples):**
O app importa **duas bibliotecas diferentes que fazem a mesma coisa** (compactar arquivos ZIP): a JSZip (a antiga) e a fflate (a nova). O comentário no código diz "v238: migrado de JSZip para fflate" mas o `import JSZip from "jszip"` continua lá no topo (linha 53), e a função `saveCroquiDocx` ainda usa JSZip (linha 1514). Você está pagando para baixar as duas — e a JSZip é a maior das duas.

**Onde está:**
- `src/App.jsx:53` — `import JSZip from "jszip";`
- `src/App.jsx:1507` — `const loadJSZip=async()=>JSZip;`
- `src/App.jsx:1514-1516` — `saveCroquiDocx` usa JSZip
- `package.json:16` — `"jszip": "^3.10.1"`

**Por que importa:**
JSZip pesa cerca de 100 KB minificado. No campo, perito num celular com 4G fraco baixando o app pela primeira vez tem ~15-20% mais espera por algo que não usa quando não exporta DOCX. Bundle inflado também sobrecarrega memória do iOS Safari, que já é apertada.

**Como arrumar:**
Migrar `saveCroquiDocx` para usar `fflate` (já está importado), remover o `import JSZip` e remover do `package.json`. O DOCX é só um ZIP com XMLs dentro — fflate faz isso.

**Esforço:** 2-3 horas (refactor + testar geração de DOCX abrindo no Word).

---

### 2. `beforeunload` mostra prompt "Dados não salvos!" mesmo quando o app está limpo

**O que é:**
Toda vez que o usuário tenta sair do app — fechar a aba, voltar pra outra, mesmo logo após abrir sem ter mexido em nada — o navegador pergunta "Dados não salvos! Tem certeza?". Isso é confuso porque dá medo no perito sem necessidade. E em iOS Safari isso pode até travar a saída.

**Onde está:**
- `src/App.jsx:761-768` — handler `beforeunload` registrado sem verificar `isDirtyRef.current`

```javascript
const h=e=>{e.preventDefault();e.returnValue="Dados não salvos!";return e.returnValue;};
window.onbeforeunload=h;window.addEventListener("beforeunload",h);
```

**Por que importa:**
"Cry wolf effect" — quando todo aviso é falso, o perito ignora o aviso real. Se um dia ele tiver dado de verdade não salvo, vai clicar em "Sair" no automático e perder.

**Como arrumar:**
Trocar `e.returnValue="Dados não salvos!"` por checagem condicional: `if(!isDirtyRef.current||saveState==="saved")return;` antes de prevenir o evento. Já existe a flag `isDirtyRef`, é só usar.

**Esforço:** 30 minutos.

---

### 3. Backup do timer auto-save tem race com a primeira chamada, e fotos podem ficar "salvas só pela metade" de forma silenciosa

**O que é:**
O auto-save escreve em 3 chaves separadas no IndexedDB: dados principais (`pfx`), fotos (`pfx_f`) e desenho (`pfx_d`). Se a chave de fotos falha (ex: quota cheia, iOS Safari evicta), o código fica em loop tentando de novo a cada 3 segundos (linha 838: `setTimeout(()=>{if(!savingRef.current)saveBackup();},3000);`). **Mas se o perito fecha o app durante esse limbo, a aba mostra "Slot atualizado" mas só o texto foi salvo — as fotos sumiram.**

**Onde está:**
- `src/App.jsx:830-838` — split entre chaves, com retry silencioso

**Por que importa:**
Crítico em campo. Perito tira 50 fotos da cena, fecha o navegador "porque achou que tinha salvo", reabre → fotos sumiram. Já houve indícios disso no código (toda a v223 e v235 são fixes nessa área), mas o problema persiste porque a interface diz "salvo" antes de confirmar as 3 chaves.

**Como arrumar:**
- Marcar `setSaveState("error")` desde o primeiro retry, não depois.
- Mostrar toast permanente "⚠ Fotos não salvaram — não feche" enquanto o retry roda.
- Bloquear o reload do Service Worker enquanto `fotosStatus !== "ok"` (já tem guard parecido).
- Considerar gravar tudo em **uma chave** (pfx_full) — só se for bem maior que o limite tradicional do IDB-store (e não é, IDB aguenta GB).

**Esforço:** 1 dia (testar bem em iOS Safari com armazenamento cheio).

---

### 4. `pdf-preview` usa `dangerouslySetInnerHTML` com HTML construído por concatenação

**O que é:**
A pré-visualização do PDF é renderizada com `dangerouslySetInnerHTML` (linha 3085). O código tem comentário avisando "SEGURANÇA: pdfHTML é gerado internamente por bPDF()/bRRV() com esc() em todos os campos do usuário". O `esc` (linha 1508) faz escape básico. **O risco é teórico baixo** porque:
1. CSP do `vercel.json` é forte (sem eval, sem inline-scripts CDN externos).
2. Já existe `esc` aplicado em campos do usuário.

**Onde está:**
- `src/App.jsx:3085` — `<div id="pdf-preview" ... dangerouslySetInnerHTML={{__html:pdfHTML}}/>`
- `src/App.jsx:1508` — `const X=(s)=>...replace(/&/g,"&amp;")...;`

**Por que importa:**
Se algum dia alguém adicionar um campo novo e esquecer de passar pelo `esc()`, abre brecha de XSS. E o `esc` não escapa atributos com aspas simples nem URLs com `javascript:`. O backup JSON aceita dados externos (importar de outro perito) — se o atacante manipular o JSON antes de passar, pode injetar.

**Como arrumar:**
- Hoje, no momento do build, instalar e usar [DOMPurify](https://github.com/cure53/DOMPurify) na hora de setar `pdfHTML` (filtra com lista branca, não dá pra escapar).
- Renomear todas as funções `esc/X` para deixar claro que são para **conteúdo de texto**, não para atributos.

**Esforço:** 2 horas (DOMPurify + testar PDF).

---

### 5. Fotos guardadas como base64 inflam IndexedDB ~33% em comparação com Blob

**O que é:**
Cada foto é guardada como string base64 (data URL: `"data:image/jpeg;base64,..."`). Mas o IndexedDB suporta nativamente `Blob` e `ArrayBuffer`. Base64 é ~33% maior que o binário. 200 fotos × 1 MB = ~270 MB no IDB em vez de 200 MB. Em iOS, isso encurta muito a vida da quota.

**Onde está:**
- `src/App.jsx:707` — `compressImg` retorna `dataUrl` (base64).
- `src/App.jsx:830` — `_fotos` salvo como JSON, virando `JSON.stringify` de array com base64s.

**Por que importa:**
- iOS Safari pode evict mais cedo (bate quota mais rápido).
- O JSON.stringify de 200 fotos é uma operação síncrona pesada que **trava a UI por segundos** durante o auto-save.
- Backup JSON que sai do export é gigante (também base64).

**Como arrumar:**
Trocar para guardar `Blob` direto no IDB (uma chave por foto, ex: `pfx_f_<id>`), e converter para data URL só no momento de mostrar (`URL.createObjectURL(blob)` — barato e libera GC). Mudança grande, sugiro deixar para uma versão futura quando for tocar nessa área.

**Esforço:** 2-3 dias (exige refactor do shim, da exportação, do display, dos backups).

---

## Bugs e problemas médios (lista numerada)

1. **Versão hardcoded em 3 lugares** — `APP_VERSION` no App.jsx (v239), `CACHE_VERSION` no SW (xandroid-v8), comentário em main.jsx (v232). Quando esquece de bumpar um, vira fonte de bug. **Fix:** centralizar via variável de ambiente do Vite (`import.meta.env.VITE_APP_VERSION`).

2. **`captureGPS` ignora o erro de permissão negada** — `src/App.jsx:715`. Retorna `null` igual a "GPS indisponível" e "GPS negado", mas a UI não distingue. Perito não sabe se é bloqueio ou só lentidão. **Fix:** propagar `e.code` (PERMISSION_DENIED vs POSITION_UNAVAILABLE vs TIMEOUT) e mostrar mensagem específica.

3. **`window.confirm` ainda em 2 lugares** — `src/App.jsx:1502` (PDF com >50 fotos) e `src/App.jsx:3138` (limpar slot ativo). Chrome/Safari mobile às vezes ignoram `confirm` em PWA standalone, e a UI fica plana. **Fix:** trocar pelo modal `confirmDel` que já existe no app.

4. **`BurstModal` não pede preview de fotos antes de fechar** — `src/App.jsx:241`. Se o usuário tira 30 fotos, dá "Cancelar" sem querer, perde tudo. **Fix:** se `captured.length>0`, pedir confirmação antes de fechar (igual o `confirmBack`).

5. **`Math.random()` é usado para ID temporário do PDF** — `src/App.jsx:1980`. Provável colisão é zero, mas em concorrência (gerar 2 PDFs ao mesmo tempo no zip) o `Date.now()` resolve. **Risco baixo, vale só notar.**

6. **`history.pushState` empilha pra "guardar back button" mas não limpa quando muda de slot** — `src/App.jsx:765`. Pequeno acúmulo. Quase imperceptível.

7. **Listener de teclado para Shift está sempre ativo** — `src/App.jsx:758`. Mesmo quando a aba ativa não é "Desenho". Quase nenhum impacto, mas é um listener desnecessário.

8. **`fetch(blobOrUrl)` em `smartSavePdf`** — `src/App.jsx:1953`. Se vier `undefined`, dá erro estranho. Adicionar `if(!blobOrUrl)return;` no início.

9. **Auto-save de 4 segundos depois de qualquer mudança em qualquer estado dispara mesmo trocando de aba sem mexer em nada** — `src/App.jsx:850`. O `useEffect` tem 17 dependências; só uma mudar (`fotos` por exemplo, que muda quando filtro de galeria altera) já dispara. **Fix:** mover `fotoFilter` para fora ou só rodar quando dado realmente mudou (deep equal).

10. **`reverseGeocoding` (Nominatim) cobre o endereço sem perguntar** — `src/App.jsx:1001`. Se o GPS pega um ponto a 30m do real (pode acontecer em prédios), vai colocar endereço errado e o perito pode não notar. **Fix:** sempre pedir confirmação antes de sobrescrever campo `end` que já tem valor.

11. **Imagens anatômicas não têm `alt=""` declarado** — várias `<img>` no canvas e em SVGs. Quem usa leitor de tela vai ouvir nada útil. **Fix:** `aria-hidden="true"` quando decorativo.

12. **Touch action no canvas é `none` mas o pinch-to-zoom é manual** — `src/App.jsx:1015`. Reinventar pinch é frágil. Funciona, mas em alguns Androids antigos pode falhar.

13. **Backup JSON contém credenciais (matrícula do perito)** — `src/App.jsx:2001`. Se compartilhar o JSON por WhatsApp para outro perito, vai a matrícula junto. **Fix:** opção "exportar sem identificação".

14. **`overscrollBehavior:"none"` em login mas não em geral** — `src/App.jsx:3152`. Login não puxa pra atualizar; resto do app sim. Inconsistente.

15. **Anti-double-click do ZIP usa `exportingZipRef` mas não bloqueia o botão visualmente** — durante a geração os botões ficam clicáveis (só toast de aviso). Visual idêntico antes e depois. **Fix:** `disabled={exportingZipRef.current}` no botão.

16. **Templates customizados não têm validação de tamanho** — `src/App.jsx:910`. Perito pode salvar 200 templates e detonar a quota. **Fix:** limite de 20.

17. **Login persiste última matrícula no IDB sem expirar** — `src/App.jsx:894-895`. Se outro perito pega o celular emprestado, vê a matrícula. Não é grande problema se matrículas não são secretas, mas vale documentar.

18. **`forceSaveCanvas` chamado dentro de `try/catch` engole erro de canvas tainted** — `src/App.jsx:1511`. Se um dia o `loadMapImg` carrega uma imagem cross-origin sem CORS, o canvas fica tainted, o `toDataURL` dá throw, e o DOCX vai sair sem desenho silenciosamente.

---

## Melhorias de UX/UI sugeridas

- **Botões "Tirar foto" / "Galeria" / "Burst" são 3 ícones lado-a-lado pequenos.** No campo, com luva ou no escuro, é confuso. Sugestão: 1 botão grande "Foto" + menu suspenso pra galeria/burst (revelar só quando precisa).
- **Toast some em 3 segundos sempre.** Mas o toast de erro deveria ficar até o usuário fechar (perdeu a notificação = perdeu o erro).
- **Indicador de save no header é só um texto pequeno.** Em campo, perito não vê. Sugestão: ícone fixo no canto da tela mudando de cor (verde=salvo, amarelo=salvando, vermelho=falha).
- **Aba "Exportar" é o ponto de saída.** Sugestão: botão "Exportar" também no header sempre visível (atalho).
- **GPS demora até 8s para timeout, mas não mostra "tentando"** durante esse período. Sugestão: spinner já com texto "buscando satélite...".
- **Lista de PERITOS hardcoded no código** — `src/App.jsx:145`. Quando entra/sai perito, precisa subir versão do app pra todo mundo. Sugestão: deixar editável pelo próprio perito (cadastro local).
- **Acentuação dos campos `placeholder` perde quando está focado** — visual jumpy em iOS. Sugestão: `aria-placeholder` + label visível sempre.
- **No Modal de slot recuperação, não mostra **fotos** preview** — só "📷 12 fotos". Sugestão: thumbnail das primeiras 4.
- **Botão "GPS Início/Fim" das trilhas tem dois estados verdes parecidos** — confuso. Sugestão: cor diferente (azul/laranja).
- **Scroll horizontal das tabs em iPhone com tela pequena pode esconder tabs** — feature deveria ter um indicador "→ mais →".

---

## Features básicas que faltam (TOP 10)

### 1. **Salvar rascunho automático de campo individual (auto-save real-time)**
- **Por quê:** Hoje só salva quando dá blur (sai do campo). Se o app trava no meio de uma observação grande, perde 200 caracteres.
- **Esforço:** 4 horas. Adicionar um `setTimeout` de 1 segundo após cada `onInput` que dispara save parcial.
- **Prioridade:** Alta.

### 2. **Histórico de cenas concluídas (arquivo permanente)**
- **Por quê:** Hoje só tem 5 slots ativos com expiração de 48 horas. Cena de 3 meses atrás você não consulta. Em laudo complementar, é comum querer "olhar a cena anterior".
- **Esforço:** 1-2 dias. Slots arquivados (não expiram, somente leitura) mais uma aba "Histórico".
- **Prioridade:** Alta.

### 3. **Busca dentro das cenas salvas**
- **Por quê:** Achar "aquela cena de feminicídio em Ceilândia em outubro" hoje é impossível, só lembrando o número do slot.
- **Esforço:** 1 dia. Indexar `data.oc`, `data.dp`, `data.nat`, `data.end` em string e fazer filter.
- **Prioridade:** Média.

### 4. **Modo escuro automático (segue o sistema)**
- **Por quê:** Hoje toggle manual. iOS muda noite/dia automaticamente; o app deveria seguir.
- **Esforço:** 1 hora. `window.matchMedia('(prefers-color-scheme: dark)')`.
- **Prioridade:** Média.

### 5. **Confirmação antes de "Cancelar" em câmera burst com fotos**
- **Por quê:** (já listado no bug #4 — mas é tão crítico em campo que repito como feature).
- **Esforço:** 1 hora.
- **Prioridade:** Alta.

### 6. **Atalhos de teclado pra desktop**
- **Por quê:** Quando perito monta laudo no escritório, navegar pelas tabs com Ctrl+1, Ctrl+2 acelera.
- **Esforço:** 4 horas.
- **Prioridade:** Baixa.

### 7. **Estatísticas básicas (dashboard pessoal)**
- **Por quê:** "Quantas perícias eu fiz esse mês?", "qual a natureza mais comum?". Motiva o uso e sustenta o app na corporação.
- **Esforço:** 1 dia. Lê todos os slots arquivados e conta.
- **Prioridade:** Baixa.

### 8. **Exportar CSV bruto pra Excel**
- **Por quê:** Coordenação muitas vezes pede planilha de produção. Hoje precisa transcrever.
- **Esforço:** 4 horas. Já tem `sum()` em texto, fazer `sumCsv()` similar.
- **Prioridade:** Média.

### 9. **Templates por DP (não só por tipo de crime)**
- **Por quê:** Cada DP tem peculiaridade. "Templates personalizados" hoje são por matrícula — bom — mas misturam tipo e DP.
- **Esforço:** 4 horas (já tem template custom, é só categorizar).
- **Prioridade:** Baixa.

### 10. **Confirmação visual pré-deleção robusta** (já parcial)
- **Por quê:** Há `reqDel` em vários lugares mas não em todos (papilo, vest, foto rápida). Padronizar.
- **Esforço:** 4 horas.
- **Prioridade:** Média.

---

## Performance e otimização

- **Lighthouse provável (estimo):** ~75 perf, ~85 a11y, ~90 PWA. Penaliza pelo bundle grande (html2pdf+JSZip+fflate juntos).
- **html2pdf.js é a maior biblioteca do bundle** — ~600 KB. Para gerar PDF do croqui, ela embarca um Chromium-like de renderização. Alternativa: `jsPDF` puro com geração estruturada, mas é trabalho. Manter por ora.
- **`useMemo` está bem aplicado** em `t` (tema) e nos estilos derivados (`inp,sel,ta,...`). Bom.
- **`React.memo` aplicado em `F_`, `TX_`, `SN_`, `Rd_`, `Ck_`, `Nw_`, `BurstModal`** — bom.
- **`fotoCountByTab` foi recém otimizado com `useMemo`** (linha 2755). Bom.
- **App.jsx é monolítico com 3.275 linhas.** O bundle não cresce por isso (Vite não remove código não usado de um arquivo só), mas o **tempo de parse no celular cresce linearmente**. Quebrar em 5-6 arquivos (Tabs, Canvas, Camera, Export, Templates) economizaria parse-time.
- **`tabHasData` calcula no render de cada toque** — não é caro, mas pode ser memo'd.
- **CSS via `dangerouslySetInnerHTML` em string gigante** (linha 3173+). Alternativa: `<style jsx>` ou arquivo separado. Não é problema, mas é difícil de manter.

---

## Acessibilidade

**Bom:**
- 85 ocorrências de `aria-label`, `aria-pressed`, `aria-expanded`, `role=`, `alt=` — boa cobertura.
- Touch targets `minHeight:44` em vários lugares (Apple HIG).
- Contraste no dark mode parece OK (testado pelo `t.t2 = "#d4d4d8"`).

**Ruim/faltando:**
- Vários `<button>` com só ícone emoji (sem texto, sem aria-label) — ex: o botão "🔄" na barra de slots.
- Não tem `:focus-visible` consistente — em todo input/botão, navegar por Tab fica sem feedback visual em alguns lugares.
- `role="dialog"` está em vários modais, mas falta `aria-labelledby` apontando pro título.
- O canvas de desenho não tem **alternativa textual** — quem usa leitor de tela não consegue interagir.
- Sliders de cor/tamanho (`<input type="range">`) sem `aria-valuemin`/`aria-valuemax`/`aria-valuenow` — não é crítico mas falha em WCAG.

**Esforço total para corrigir tudo de a11y:** 1-2 dias. Vale a pena pra cumprir LAI/WCAG 2.1 AA.

---

## Segurança

**Bom (parabéns ao código):**
- CSP forte em `vercel.json` (sem `unsafe-eval`, sem CDN externa de script).
- HSTS 1 ano.
- Permissions-Policy restritiva.
- Validação de URLs em backup importado (`isSafeImgUrl`, `isSafeDrawing`) — explicitamente bloqueia `javascript:` e schemes estranhos.
- `rel="noopener noreferrer"` no link Google Maps.
- Migração de localStorage→IDB com flag pra não duplicar.
- SW só registrado em produção; cache versionado e limpo.
- `dataref` em vez de `eval` ou `new Function`.

**Atenção:**
- O `dangerouslySetInnerHTML` no `pdf-preview` (já listado no top 5).
- O Service Worker faz `cache-first` em assets do mesmo domínio sem `integrity`. Se o build do Vercel for comprometido, o SW perpetua o código malicioso até o usuário desinstalar o PWA. Não dá pra resolver totalmente sem SRI.
- IDB não é criptografado em iOS/Android — qualquer um com acesso físico ao celular consegue ler. Tema do roadmap (criptografia AES) é o caminho.
- `style-src 'unsafe-inline'` no CSP — relaxado por causa dos `dangerouslySetInnerHTML` de styles. Aceitável dado o uso.

**Em resumo:** segurança está num nível **muito acima da média** de PWAs. Os pequenos pontos não são críticos para o uso atual.

---

## Código (refactor — só se realmente vale a pena)

**O que vale:**
- **Quebrar `App.jsx` em 4-5 arquivos** ao longo do tempo (não num push só):
  - `src/components/Tabs/SolicitacaoTab.jsx`
  - `src/components/Tabs/LocalTab.jsx`
  - `src/components/Tabs/CadaverTab.jsx`
  - `src/components/Canvas/Canvas.jsx` (canvas, stamps, drawing)
  - `src/services/export.js` (PDF, DOCX, ZIP)
  - `src/services/storage.js` (slots, backup)
- **Extrair `mkAutoLegend`** (linha 717) para um arquivo separado — função grande e isolada.
- **Mover `TEMPLATES`, `LOCAIS`, `VESTIGIOS_EXTRAS`** (linha 292+) pra um JSON. Hoje editar implica um deploy completo.
- **Constantes `WT, RF, RB, RH, RMD, RME, RPD, RPE, AR, RVE, ...`** (regiões anatômicas) em arquivo separado: `src/constants/anatomy.js`.

**O que NÃO vale:**
- Não re-escrever em TypeScript (esforço alto, ganho marginal pra projeto solo).
- Não adicionar Redux ou Zustand — `useState` está bem.
- Não migrar pra Next.js — Vite funciona bem aqui.

**Magic numbers/strings notáveis:**
- `BACKUP_EXPIRY_MS=48h` está claro.
- `IDLE_THRESHOLD_MS=30000` no main.jsx.
- `5` (número de slots) repetido em vários lugares — promover a `const NUM_SLOTS=5`.

---

## Conclusão

### Quick wins (3-5 coisas que arrumam em 1 dia e melhoram muito)

1. **Remover JSZip do bundle** (substituir por fflate em `saveCroquiDocx`) — economiza ~30% do JS. *2-3 horas.*
2. **`beforeunload` só alerta se `isDirtyRef`** — para de mentir pro usuário. *30 min.*
3. **Trocar 2 `window.confirm` pelo modal `confirmDel` existente** — visual consistente. *1 hora.*
4. **Confirmação ao cancelar `BurstModal` com fotos** — evita perda em campo. *1 hora.*
5. **Modo escuro automático** seguindo `prefers-color-scheme` — é só 1 linha de useEffect. *30 min.*

**Total:** ~6 horas. Esses 5 já tornam o app sensivelmente melhor.

### Médio prazo (1 semana de trabalho)

- Histórico de cenas (slot arquivado).
- Busca de cenas salvas.
- Salvar rascunho real-time.
- Cobrir gaps de a11y (focus-visible, aria-labelledby, alt textos).
- Refatorar `saveBackup` pra prevenir o "save parcial silencioso" (item #3 do top crítico).
- Extrair `TEMPLATES`, `LOCAIS`, `PERITOS` para JSONs editáveis.

### Longo prazo (1+ mês — só se compensa)

- Migrar fotos de base64 pra Blob (1-2 semanas de migração + período de coexistência).
- Quebrar `App.jsx` em módulos (1 mês de refactor incremental).
- DOMPurify no `pdf-preview` + auditoria de sanitização. (3-5 dias.)
- Pensar em criptografia AES das fotos no IDB (já está no roadmap).

---

**Resumo final:** O Xandroid não tem bug crítico que trave o app no uso normal. Os pontos críticos são todos de **risco em casos extremos** (quota cheia, fechar antes de salvar, JSON malicioso de outro perito) — coisas raras mas que podem custar uma cena inteira. Os quick-wins de UX listados resolvem 80% da percepção de qualidade num dia de trabalho.
