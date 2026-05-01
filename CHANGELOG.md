# Changelog — Xandroid

Histórico de versões do app de documentação forense.

> **Formato:** versão · descrição curta · detalhes (quando houver)
> **Padrão:** [Keep a Changelog](https://keepachangelog.com/), adaptado.

---

## v288 — Veículo com 8 vistas no Croqui (interior + teto)

DOCX da v287 funcionou (gerou rápido, com imagens) — ✅. Mas o usuário
notou que vestígios marcados em **interior esquerdo, interior direito e
teto** não viravam imagens. Eu só tinha mapeado 4 vistas externas
(lateral E, lateral D, frente, traseira).

Adicionado mapeamento de coordenadas (POS_VEI_*) para as 4 vistas que
faltavam, totalizando 8 vistas:

- **VISTA SUPERIOR** (teto): 8 áreas (capô D/E, teto ant D/E, teto pos
  D/E, p-malas D/E)
- **INTERIOR — VISTA SUPERIOR**: volante, painel, bancos motorista/
  passageiro/traseiros, console, assoalho
- **INTERIOR — LATERAL DIREITA**: vista de dentro com painel à direita
  (porta-luvas, retrovisor, para-brisa, apoio de cabeça, cinto, forro)
- **INTERIOR — LATERAL ESQUERDA**: espelhado (painel à esquerda)

Coordenadas extraídas dos componentes JSX `VTetoSvg` e `VIntSvg` que já
renderizam essas vistas na aba Veículo do app — agora 100% das regiões
clicáveis viram bolinhas no PDF/DOCX.

Tipos cobertos: Sedan, Hatch, SUV, Caminhonete (interior compartilhado).
Moto/Bicicleta/Ônibus continuam só com tabela texto (estruturas
diferentes — mapeamento dedicado em rodada futura).

## v287 — Fix DOCX trava no zip: PNG vai como STORE (sem recompressão)

Diagnóstico v286 confirmou: rasterização ✅, mas `generateAsync timeout 30s`.
fflate travava ao tentar comprimir 6 PNGs (~150-225KB cada). Causa real
agora identificada: PNGs já são internamente compactados (Deflate). Ao
forçar `level:6` (DEFLATE) em cima, o algoritmo gasta CPU sem reduzir
muito o tamanho — em iOS Safari isso trava (provavelmente pela falta
de WebWorkers no contexto async).

Fix:
- `mkDocxZip.file()` agora aceita `opts.level`. Sem opts, detecta pela
  extensão: `.png/.jpg/.jpeg` → STORE (level 0, sem compressão), o resto
  → DEFLATE level 6 (mesma compressão antiga pra XMLs).
- DOCX final fica ~30% maior (porque imagens não são re-compactadas)
  mas a geração é ~50× mais rápida e SEM TRAVAR.
- Timeout do generateAsync subiu pra 60s só por margem (na prática termina
  em <1s agora).

Por que zipar? DOCX é tecnicamente um ZIP — formato oficial do Word.
Word abre um .docx fazendo unzip e lendo os XMLs dentro. Não dá pra fazer
DOCX sem zipar.

## v286 — Fix dois bugs do DOCX (Sedan rasterizado + zip travando)

Diagnóstico da v285 revelou dois bugs reais com causa identificada:

**1) Veículo `vei=0` mesmo com Sedan + 3 vestígios marcados**
A função `mkVeiViews` filtrava por `d["v0_tipo"]` (campo "Tipo/Modelo" texto
livre tipo "Civic 2010"). O correto era `d["v0_cat"]` (botão Categoria:
Sedan/Hatch/SUV/Caminhonete/Ônibus/Moto/Bicicleta). Como "Civic 2010" não
está em `VEI_TIPOS_COM_SVG`, todos os veículos eram filtrados fora.

Fix: ler `_cat` em vez de `_tipo` (com fallback "sedan" se não setado).
Agora o croqui visual do veículo aparece pra qualquer Sedan/Hatch/SUV/
Caminhonete cadastrado, mesmo se Tipo/Modelo for texto livre.

**2) DOCX travado em `generateAsync` (silêncio após "zip files added")**
PNGs estavam sendo gerados em scale=2x (alta nitidez) → cada PNG ~600KB,
total ~3MB. fflate travava ao zipar isso em iOS Safari. Sem timeout, o
`await` ficava infinito.

Fix:
- scale=1 (era 2): cada PNG ~150KB, total <1MB. Visualmente continua
  nítido em A4 (impresso em ~7-8cm de largura).
- Timeout de 30s no `generateAsync` via `Promise.race`. Se travar, o catch
  global pega e mostra erro em vez de hang silencioso.

## v285 — Logs após rasterização + fallback de download iOS

Diagnóstico da v284 mostrou que a rasterização TERMINA com sucesso (5 PNGs
do cadáver gerados, ok=1, ok=1...) mas o DOCX nunca chega ao usuário no
iPhone. Algo entre "raster batch done" e o download está falhando
silenciosamente.

Adicionado:
- Logs em pontos críticos depois da rasterização: zip files added (com
  body.length), blob ready (com size), download path (standalone/iOS/
  canShare flags), share start, share OK, click <a download>, catch fatal.
- Log no `mkVeiViews` pra entender por que `vei=0` mesmo com vestígios
  veiculares marcados (provavelmente tipo de veículo fora da lista
  sedan/hatch/suv/caminhonete).
- **Fallback duplo de download em iOS**: depois do `<a download>`
  tradicional disparar, em iOS o app também aciona o share sheet 400ms
  depois. Em iOS Safari não-standalone o `<a download>` falha silencioso
  com frequência; o share sheet é o backup.
- Se generateAsync falhar ou catch global pegar erro, agora é registrado
  no Diagnóstico com a stack trace (até 200 chars).

Próxima falha: o Diagnóstico vai mostrar EXATAMENTE em qual passo do
download travou (zip files, blob ready, share start, click sent, etc.).

## v284 — Telemetria + timeout global pra DOCX/PDF (debug iOS)

DOCX da v283 ainda travava em "Renderizando 5 ilustrações" no iPhone, sem
gerar nada e sem registrar erro no Diagnóstico (porque os `console.warn`
ficam silenciados em produção desde v279).

Adições pra desbloquear e instrumentar:

- **`_diagLog(type, msg, extra)`**: novo helper que registra eventos
  diretamente em `window.__xandroidErrors` (mesmo logger global que captura
  erros). Diferente do `console.warn`, esses logs APARECEM no painel
  Diagnóstico mesmo em produção. Categoria `diag-info` pra eventos OK,
  `diag-warn` pra avisos. Logs viram trilha do que aconteceu.
- **Logging detalhado em `svgToPngU8` e `inlineImagesInSvg`**: cada etapa
  (start, fetch, image.onload, toDataURL, etc.) registra no diag.
- **Timeout global de 60s no batch de rasterização**: se a soma das
  rasterizações exceder 1 minuto, a Promise.race aborta o batch e o DOCX
  é gerado **sem as ilustrações** (graceful fallback). Toast avisa o
  usuário: "⚠ Ilustrações puladas — gerando DOCX só com texto".
- **Sem mais hangs eternos**: mesmo no pior caso onde toda rasterização
  falha, o DOCX é gerado com tabelas + texto (comportamento da v279).

Próxima vez que o DOCX falhar, abrir o Diagnóstico vai mostrar EXATAMENTE
onde travou (qual fetch, qual imagem, qual etapa).

## v283 — Fix DOCX que travava + Imagem do veículo no PDF

Dois bugs reportados em teste no iPhone:

**1) DOCX não gerava (mensagem "Renderizando 5 ilustrações" e nada acontecia)**

Causa: o `inlineImagesInSvg` da v282 fazia `await fetch("/img/...")` sem
timeout. Se o iOS Safari travasse uma das requisições (qualquer motivo —
SW intermediando, rede instável, GC), o `await` ficava pendurado pra
sempre e o DOCX nunca era gerado.

Correção:
- `_fetchWithTimeout(url, ms)` envolve `fetch` com `Promise.race` contra
  setTimeout (5s padrão). Se vencer o timer, rejeita e o catch interno
  pula só essa imagem.
- `FileReader.readAsDataURL` também envolto em timeout 5s (mesma proteção).
- Pior caso: imagem demora 5s pra falhar, mas o DOCX é gerado com as
  outras imagens. Sem mais hangs eternos.

**2) Imagem do veículo (e silhueta do cadáver) não aparecia no PDF**

Mesmo bug do DOCX da v281, mas afetando o PDF: o `html2canvas` (que
o `html2pdf` usa por baixo) pré-carrega só `<img>` HTML, não pega
`<image>` dentro de SVG. Então os SVGs de cadáver/veículo iam pra
o canvas com imagens vazias.

Correção: `genPdfBlobFromHtml` agora chama `await inlineImagesInSvg(html)`
antes de inserir o HTML no DOM temporário. Mesmo helper compartilhado com
o DOCX, mesmo cache (`_IMG_DATAURL_CACHE`) — se você gerou o DOCX antes,
o PDF é mais rápido por reusar as data URLs já bufferizadas.

A regex foi expandida pra pegar também `src="/img/..."` (de tags `<img>`
HTML), além do `href` / `xlink:href` (de `<image>` SVG).

## v282 — Fix: silhuetas do corpo e veículo no DOCX + bug do modo claro

**Bug crítico do DOCX (v281):** as silhuetas do corpo e do veículo não
apareciam no Word — só as bolinhas numeradas em fundo branco. Causa: iOS
Safari não baixa as `<image href="/img/...">` internas de um SVG quando ele
é carregado via `blob:` URL. Correção:

- Nova função `inlineImagesInSvg(svgStr)` que pré-carrega cada `<image>` do
  SVG via `fetch` + `FileReader.readAsDataURL` e substitui no SVG por
  `data:image/...;base64,...` antes de criar o blob. Cache `_IMG_DATAURL_CACHE`
  evita refetch entre vistas.
- `svgToPngU8` agora é `async` e chama `inlineImagesInSvg` antes de rasterizar.

**Bug do modo claro:** os campos `<select>` (DP, Ano, Natureza, etc.)
mostravam um padrão de chevrons (▼▼▼▼▼) preenchendo o input em vez de só
1 chevron à direita. Causa: o `inp` usava `background: t.bg3` (shorthand
CSS) que resetava `background-repeat` para `repeat` (default do shorthand),
fazendo o ícone do chevron repetir. O `backgroundRepeat: "no-repeat"` do
`sel` deveria sobrescrever, mas em ordem React a ordem ficou inconsistente.
Correção: trocado `background` por `backgroundColor` (longhand) que afeta
só a cor de fundo, sem mexer nas outras props de background.



Bug detectado em teste no iPhone: o DOCX da v281 mostrava só as bolinhas
numeradas (em pé no fundo branco) sem a silhueta do corpo nem do veículo
por trás. Causa: iOS Safari não baixa as `<image href="/img/...">` internas
de um SVG quando ele é carregado via `blob:` URL — o canvas é desenhado
sem essas imagens (ficam transparentes).

Correção: nova função `inlineImagesInSvg(svgStr)` que pré-carrega cada
`<image href>` do SVG via `fetch` + `FileReader.readAsDataURL` e substitui
no SVG por `data:image/...;base64,...` antes de criar o blob. Assim quando
o canvas desenha o SVG, todas as imagens já estão embedded e renderizam
corretamente. Cache `_IMG_DATAURL_CACHE` evita refetch entre vistas (cada
veículo tem 4 vistas, mas só 1 fetch por imagem única).

`svgToPngU8` agora é `async` e chama `await inlineImagesInSvg(svg)` antes
de rasterizar.

## v281 — Croqui visual do cadáver E do veículo no DOCX (espelho do PDF)

- **DOCX agora é o espelho do PDF**: as ilustrações do cadáver com lesões marcadas e do veículo com vestígios marcados — que antes só apareciam no Croqui PDF — agora também são embedadas no Croqui DOCX. O documento Word vira a réplica fiel do PDF.
- **Como funciona internamente**: ao gerar o DOCX, o app rasteriza cada SVG (cadáver: anterior, posterior, cabeça, mãos, pés; veículo: lateral E/D, frente, traseira) em PNG via canvas, e embeda o PNG no documento Word junto com a legenda. Funciona offline (não precisa de rede pra rasterizar).
- **Robustez**: se a rasterização de uma view falhar (CORS, falta de memória em iPhone antigo), só aquela view é pulada. O DOCX continua sendo gerado com tudo o que deu certo. Toast "⏳ Renderizando X ilustrações..." durante a rasterização.
- Refatoração interna: `bodyPdfSvg` e `veiPdfSvg` agora chamam `mkCadaverViews` e `mkVeiViews` respectivamente. Uma única fonte de verdade pra views — usada tanto no PDF (HTML inline) quanto no DOCX (rasterização).

## v280 — Croqui do veículo no PDF (com vestígios marcados)

- **Croqui visual do veículo no Croqui PDF**: nova função `veiPdfSvg` similar ao `bodyPdfSvg` do cadáver. Pra cada veículo com vestígios veiculares marcados, o PDF agora mostra a imagem do carro nas vistas que têm vestígios (lateral E, lateral D, frente, traseira) com bolinhas vermelhas numeradas indicando exatamente onde cada vestígio foi marcado. Numeração bate com a tabela "Vestígios veiculares" acima.
  - Coordenadas das regiões vêm sincronizadas dos componentes JSX do app (`VLatSvg`, `VFrenteSvg`, `VTrasSvg`).
  - Funciona pra Sedan, Hatch, SUV e Caminhonete (que compartilham a mesma estrutura de regiões). Moto, bicicleta e ônibus ainda não têm coordenadas mapeadas — o vestígio aparece na tabela mas não no croqui visual.
  - Suporta múltiplos vestígios na mesma região (bolinhas empilham horizontalmente).
- **DOCX ainda não inclui o croqui visual** — fica para a v281. Embedar SVG no DOCX requer rasterização SVG→PNG via canvas (não trivial em iOS Safari), e quero fazer com testes específicos. Por enquanto, abrir o PDF é o caminho.

## v279 — Auditoria de saneamento (rodadas 4 e 5)

**Rodada 4 — qualidade de código:**

- **Helpers DOCX deduplicados**: `Pp`, `SPACER`, `PAGE_BREAK`, `ROW_GOLD_GROUP`, `esc2` e o XML do `header1.xml` (com logos PCDF/DF) viviam em duas cópias paralelas dentro de `saveCroquiDocx` e `saveRRVDocx`. Agora vivem em uma única função-helper compartilhada (`docxHelpers`). Resultado: ~150 linhas de código duplicado a menos, e correções num só lugar valem para os dois documentos.
- **Auto-save mais limpo**: removido o `setInterval(30s)` que rodava em paralelo com o auto-save por mudança (4s) e o de `visibilitychange` — eram três timers redundantes. Agora só sobram os dois eventos que importam: usuário parou de mexer ou minimizou o app.
- **`console.warn`/`log` silenciados em produção**: override de 4 linhas no `main.jsx` (entry point) — em `import.meta.env.PROD`, vira no-op. `console.error` fica intacto pra erros reais. Atinge o objetivo (não poluir console do iPhone com avisos do app + de libs terceiras como html2pdf) sem precisar reescrever as 45 chamadas individuais. O logger global (`window.__xandroidErrors`) e a tela de Diagnóstico continuam funcionando normalmente.
- **CHANGELOG.md consolidado**: header movido pro topo, duplicatas v200/v201/v202 e entradas "(anterior)" sem conteúdo removidas.

**Rodada 5 — estrutura:**

- **`AUDITORIA_*.md` movidos** para `docs/auditorias/`. Antes ficavam na raiz junto com código — atrapalhava ler o repo.
- **Lista de PERITOS externalizada** para `public/peritos.json`. O app carrega esse JSON no boot; se falhar (sem rede + cache vazio), cai num fallback hardcoded mínimo. Agora dá pra adicionar/remover perito sem abrir PR — basta editar o JSON e fazer push.
- **ESLint mínimo configurado** (`.eslintrc.json` + script `npm run lint`). Não bloqueia build — é diagnóstico opcional. Pega bugs como o do botão "Croqui DOCX" da v278 (função passada direto pro `onClick` com parâmetro default sobrescrito pelo evento).

## v278 — Auditoria de saneamento (rodadas 1 e 2)

**Rodada 2 — refatoração de bundle:**

- **JSZip removido**: a dependência `jszip` (~104 KB minificado) saiu do projeto. As funções `saveCroquiDocx` e `saveRRVDocx` agora usam `fflate` (já presente, ~28 KB) por baixo de um wrapper `mkDocxZip()` que mantém a mesma API (`.file()`, `.generateAsync()`). Resultado: ~80 KB a menos no bundle, mesmo comportamento. Os comentários de v241 que diziam "migração para fflate fica para a v242" finalmente foram cumpridos (37 versões depois).
- **Code-splitting** configurado no `vite.config.js`: `react-vendor`, `pdf` (html2pdf), `zip` (fflate), `sanitize` (dompurify) e `icons` (lucide-react) agora viram chunks separados. Em rede ruim, o primeiro carregamento fica mais leve — html2pdf só desce quando o usuário vai gerar PDF.
- **Pré-carregamento residual do JSZip removido** do `useEffect` (não fazia mais sentido com fflate sendo bundled). Painel de Diagnóstico e botão "Resetar libs" também atualizados.

**Rodada 1 — saneamento inicial:**

- **Versões sincronizadas**: `APP_VERSION` e `CACHE_VERSION` do Service Worker agora andam juntas (`v278` em ambos). A partir de agora, cada bump do App precisa bumpar o SW também — caso contrário usuários ficam presos no cache antigo e não recebem a versão nova.
- **Cabeçalho do `App.jsx` enxuto**: removido o histórico v201-v210 que estava duplicando o `CHANGELOG.md` e desorientando.
- **Termo "laudo" trocado por "Croqui"** nas mensagens do app, no DOCX e no PDF — alinha com a nomenclatura oficial (App gera Croqui de Levantamento + RRV; laudo é outra coisa).
- **`exportAllZip` removido** (~600 linhas mortas): a função "Pacote Completo" foi descontinuada em v254 mas o código ficou. Junto saíram `zipProgress`, `zipNowTick`, `exportingZipRef`, `zipCancelRef`, `zipProgressTimerRef`, `zipStartedAtRef` e o modal de progresso.
- **Service Worker mais leve**: removidas 8 entradas de pré-cache para imagens `body-*.jpg` e `head-*.jpg` que não são mais usadas (o app usa `h-*` e `m-*` desde a v256). Os arquivos físicos também foram apagados (~2-3 MB economizados).
- **Ícones duplicados na raiz removidos**: `icon-180.png`, `icon-192.png`, `icon-512.png` e `icon.svg` existiam tanto em `/raiz` quanto em `/public`. Vite só serve o que está em `/public`, então os da raiz eram lixo.
- **Imports do `fflate` enxugados**: removidos `zip as fflateZip` e `strToU8` que só eram usados pelo `exportAllZip`. Mantidos apenas `unzipSync` e `strFromU8` (usados na importação de backup ZIP).
- **Deduplicação dos helpers DOCX (`Pp`, `SPACER`, `ROW_GOLD_GROUP`, `esc2`, `header1Xml`)** ficou para a próxima rodada — exige cuidado com regex de control chars que pode corromper o arquivo se manipulado por scripts.

## v255 — Burst nativo (picker em loop), nomenclatura de fotos refeita, header limpo

- **Burst de fotos reescrito**: agora usa o **picker nativo do iOS em loop** em vez de `getUserMedia`+canvas. Cada foto abre a câmera nativa do iPhone com **0.5×, 1×, 2×, 3×, flash, HDR, modo noite, foco/exposição automática** — tudo do iPhone.
  - Trade-off: 1 toque "Usar foto" extra por foto, mas qualidade idêntica à individual.
  - Acabou o bug do landscape (não temos mais modal nosso — usamos a câmera nativa).
- **Nomenclatura de fotos nova** ao Salvar Fotos:
  - Antes: `Oc1234-2026_DP30_001_local_durante_local_xxx.jpg`
  - Agora: `Cadaver1-1234-26-30_01.jpg` · `Vestigio3-1234-26-30_02.jpg` · `FeridaCadaver1-1234-26-30_01.jpg` · `Local-1234-26-30_01.jpg`
  - Formato: `<Referência>-<Oc>-<Ano2dig>-<DP>_<seq>.jpg`. Sequência por referência (cada origem com seu próprio contador).
- **Header limpo**:
  - Removido o medidor de armazenamento `📷 X%` (estava desnecessário no header — info dele aparece na aba Exportar).
  - Removido o toggle de tema rosa/azul (💗/💙) do header.
- **Tema rosa/azul movido para o fim da aba Exportar** (entre os Slots e Avançado), em forma de card discreto com label "Tema do app" e botão de troca explícito.

## v254 — ZIP descontinuado, qualidade máxima, fix burst e bug do "+ Cadáver"

- **ZIP "Pacote Completo" REMOVIDO** da aba Exportar. Cada saída agora é um botão individual: travas grandes nunca mais.
- **Aba Exportar reorganizada em cards por documento**:
  - **Croqui de Levantamento**: Croqui PDF + Croqui DOCX + Compartilhar
  - **RRV**: RRV PDF + RRV DOCX (NOVO botão de download direto) + Compartilhar (NOVO via Web Share)
  - **Fotos**: novo botão "Salvar N fotos" — usa Web Share API para o usuário escolher destino (Arquivos, Drive, AirDrop). Sem ZIP, sem compressão extra.
  - **Outros**: Texto resumo
  - **Backup**: Baixar JSON / Importar (mantido)
- **Toggle HQ ✨ removido** — fotos sempre em qualidade máxima (2400 px / JPEG 0.92). Sem mais escolha "Normal vs HQ".
- **Bug do burst (várias fotos) corrigido**:
  - `objectFit: cover` no `<video>` — preenche a tela inteira em landscape, sem mais bordas pretas.
  - Constraints de câmera elevadas pra `width: ideal 3840`, `height: ideal 2160` — iOS entrega o melhor possível.
  - Delay de 280 ms entre clique e captura → autofoco do iOS pega o frame nítido (não borrado).
  - Qualidade de captura igual à individual (0.92 JPEG / 2400 px).
- **Bug do botão "+ Cadáver" sumindo corrigido**:
  - Reestruturação do card Cadáveres em 2 linhas: seletor + botões em cima (sticky), faixa de fotos em baixo com scroll horizontal.
  - Mesma fix aplicada à aba Veículos.
- **Função `saveRRVDocx` exposta como botão individual** ("RRV DOCX") — não fica mais escondida só dentro do antigo ZIP.

## v253 — ZIP simplificado: só DOCX + JSON + fotos + desenhos

- **Pacote ZIP refeito**: agora contém apenas
  - `Croqui_OC_*.docx` — Croqui de Levantamento de Local (DOCX editável)
  - `RRV_OC_*.docx` — Registro de Recolhimento de Vestígios (NOVO — função `saveRRVDocx` criada do zero)
  - `Backup_OC_*.json` — backup completo
  - `/fotos/*.jpg` — fotografias do laudo
  - `/fotos/croqui_NN_*.png` — desenhos do canvas (NOVO — antes ficavam só dentro do DOCX)
- **Removido do ZIP**: tentativa de gerar PDF (causava trava no iPhone) e o HTML alternativo do Croqui
- **Modal de "ZIP gerado parcial" não aparece mais** quando o usuário está em iOS — porque não há mais "falha intencional" sendo reportada como falha real
- **Para PDF**: abrir o DOCX no Word/Pages/Google Docs e usar "Salvar como PDF". Os botões individuais "Croqui PDF" e "RRV PDF" continuam funcionando (AirPrint em iOS, html2pdf no resto)
- **Card "Pacote Completo"**: texto descritivo refeito; aviso "RRV não vai no pacote" e aviso especial iOS removidos (não são mais necessários)
- **Card "Backup"**: trocado "deste laudo" por "deste croqui"
- **Tempo de geração do ZIP cai 30-90s** em qualquer plataforma (sem mais tentativa de PDF)

## v202 — Microfone só em textareas + Service Worker

- **Microfone**: apareceu apenas em campos `type="textarea"` (observações longas)
  - Antes: aparecia em **todo** input que não fosse data/número/etc. — incluindo nome, ocorrência, DP
  - Agora: input single-line normal para campos curtos, sem botão de mic
- **Botão de mic redesenhado**: 40×40 (área de toque generosa), ícone reduzido a 14
  (visualmente menor, mas mais fácil de acertar no toque)
- **Imagens anatômicas extraídas**: silhuetas (BODY_F/B/L/R, HEAD_F/B/L/R) viraram
  `/img/anatomy/*.jpg` — JSX 88 KB menor, navegador cacheia entre cargas
- **Service Worker** (`public/sw.js`): app funciona 100% offline depois da
  primeira carga. Cache inteligente para app shell, imagens e bibliotecas
- **GitHub Actions** (`.github/workflows/validate.yml`): valida build em cada
  commit/PR — bloqueia merge se a sintaxe estiver quebrada
- **Linhas-monstro quebradas**: maior linha caiu de 18.392 → 6.189 chars
- **Cabeçalho enxuto**: histórico v115-v200 movido para CHANGELOG.md

## v201 — Correções de UX e DOCX

- **RRV**: assinatura do 2º perito removida (apenas P1 + Papiloscopista)
- **Campos de texto**: TODOS extensíveis (cresce com conteúdo, estilo iOS Notes)
- **Microfone**: `scrollIntoView` mantém cursor visível acima do teclado virtual e do botão de mic
- **DOCX**: blindado contra control chars / canvas falhando (`esc2` reforçado, `generateAsync` com DEFLATE, erro detalhado)
- **Cômodo extra**: input em "Cômodos identificados" auto-pré-seleciona em "Cômodo do fato"

## v200 — ZIP de fotos planas em `/fotos/`

- Sem subpastas — tudo plano em `/fotos/`
- Nome inclui categoria e fase para ordenação natural:
  `<seq>_<categoria>_<fase>_<ref>_<descrição>.jpg`
  Ex: `003_vestigios_durante_vest_1_chao_sala.jpg`
- Categorias: `solicitacao`, `local`, `vestigios`, `cadaver`, `veiculo`, `outros`
- Fases: `antes`, `durante`, `apos`, `sem_fase`
- Sem LEIA-ME interno em `/fotos/` (estrutura mais simples)
- Versão resetada (203 → 200)

## v199 — Auto-preenche matrícula + placeholder genérico

## v198 — Tela de login com tema rosa

## v197 — Tema rosa

- Bordas gradiente + fundo ícones

## v196 — Toggle de tema azul + rosa no header

## v195 — Picker de data redesenhado

## v194 — Ano com 2 dígitos + fix overflow

## v193 — Estilo card uniforme

## v192 — Removido auto-data

## v191 — Auto-data + animação pop nos cards

## v190 — 16 ícones SVG faltantes adicionados

## v189 — 13 novos modelos base + ícones em todos

## v188 — Categoria do veículo com toggle

## v187 — Toggle universal em `Rd_` / `SN_` / checkboxes

## v186 — Sim/Não com toggle

## v185 — Animações tabs + ícone do veículo

## v184 — Templates personalizados (ajustes de campos)

## v183 — Templates personalizados por perito

## v182 — Persistência de tema por matrícula

## v181 — Modo noturno automático removido

## v180 — Ícone vestígio mais visível + gotas de sangue maiores

## v179 — Polimento visual completo (10/10)

## v178 — Caveira sangrando + header com mini caveira

## v177 — Login calibrado + pílulas + micro-interações

## v176 — Login screen com vidro fosco

## v175 — Cards com gradiente + glow lateral

## v174 — Drop-shadow nos SVGs + indicador tab ativa

## v173 — Bug "Novo Croqui" + tabs maiores + arma contraste

## v172 — Hook `useIsLargeScreen` (tabs responsivas)

## v171 — "precipitação" → "projeção"

## v170 — Seção Lesões: 8 botões de região do corpo c/ SVG

## v169 — Correção duplicação ícones em Slots/Limpeza

## v168 — Microfone, Selecionar, zoom do canvas c/ SVG

## v167 — `IconText` + toast global + 150+ substituições JSX

## v166 — Template + Local pickers com SVGs

## v165 — 79 SVGs no `APP_ICONS` + FE0F normalization

## v164 — 35 ícones (7 tabs + 27 cards + 1 stats)

## v163 — 7 ícones das tabs estilo caveira

## v162 — 💀 Rebranding: Croqui Digital → MVDroiD

- Novo nome: "Croqui Digital" → "MVDroiD"
- Nova logo: caveira moderna em SVG (substitui PNG urubu)
- Tela de login: caveira + MVDroiD + SCPe/PCDF
- Start menu: 💀 + MVDroiD
- Favicon / Apple touch icon: caveira em fundo azul-marinho
- PWA manifest, `document.title`, meta tags atualizados
- Storage prefix mantido (`cq_`) — backups antigos preservados

## v161 — Auditoria: 9 correções

PDF campos, WCAG, undo, pressure sensitivity, aria-labels, etc.

## v160 — Auditoria + limpeza + limite configurável

## v159 — 🎤 Microfone em todos os campos de Observações

## v158 — Placa dentro da coluna Suporte/Local (confirm)

## v157 — Placa agora dentro da coluna de Suporte/Local

- Vestígios: Placa fica abaixo do Suporte, mesma coluna
- Papilos: Placa fica abaixo do Local, mesma coluna
- Preview amarelo mais compacto (mesmo conteúdo)

## v156 — ✨ Compactar estendido (papilos + canvasVest)

- Papilos também compactam (1 linha: nº + desc + placa + local); toque expande
- Vestígios do Croqui (`canvasVest`) também compactam (placa + desc + destino); toggle próprio na aba Desenho
- Mesmo estado global `vestCompact` — ativar em qualquer aba reflete nos 3 tipos de lista

## v155 — UX Campo: 6 melhorias

- 🎤 Ditado por voz em textareas (pt-BR, continuous, pulse)
- 📍 Geo-tag automático nas fotos (GPS anexado ao tirar)
- 🔍 Filtro por destino em Vestígios (Todos / IC / II / Sem dest)
- ✨ Modo compacto (1 linha por vestígio, tap para expandir)
- 📋 Duplicar vestígio/papilo = cópia INTEGRAL + insere logo após o original (era "no fim e zera obs")
- 🚗 Fix: trocar veículo agora muda figura IMEDIATAMENTE (antes precisava clicar em região). Também ao trocar categoria (Moto↔Carro) — reseta view para válida

## v154 — 🏷️ Placas de identificação (01-99) em vestígios/papilos

- Select "Placa de identificação" (01-99) em vestígios e papilos, abaixo do Suporte/Local
- Preview amarelo mostra como aparecerá no PDF ao escolher
- No Croqui (PDF/DOCX/preview), RRV e Resumo texto, se tiver placa: suporte vira "Suporte — Vestígio correlacionado à placa XX"
- Sistema independente das placas do canvas (`canvasVest`)
- Backups antigos recebem `placa:""` automaticamente

## v153 — FIX UX: header + textarea auto-grow

- Modais (template / local / start) agora `z-index 2000+`, ficam ACIMA do header e tab bar (era 200-350, header 1002)
- Padding-top dos modais respeita safe-area do notch
- Textarea do `F_` agora AUTO-GROW (estilo iOS Notes) — cresce conforme digita/dita, texto NUNCA fica escondido
- `minHeight` textarea 60→72, `lineHeight` 1.45 (melhor leitura)

## v152 — 🎨 Design iOS / watchOS: 7 melhorias

- Tipografia hierárquica iOS (large title → caption)
- Top bar polida c/ glass effect + identity pill
- Tab bar c/ backdrop blur + capsule indicator ativo
- Botões c/ profundidade iOS 17 (gradient + inset + shadow)
- Cards refinados (radius 18, weight 800, accent gradient)
- Toast estilo Dynamic Island (pill flutuante topo central)
- Haptic patterns ricos (success / warning / error / select…)
- Empty states ilustrativos (SVG c/ gradient suave)

## v151 — 📱 Otimização mobile & resiliência

- CSS força fonte mín 16px em inputs (sem auto-zoom iOS)
- Viewport agora permite pinch-zoom (acessibilidade)
- PWA manifest inline (instalável: "Adicionar à tela")
- Ícone SVG inline + Apple PWA tags + status bar
- Cache de bibliotecas (html2pdf, JSZip) em `localStorage` — funciona offline 30 dias após primeiro uso
- JSZip pré-carregado no login (DOCX offline-ready)
- Detecta câmera negada (evento cancel) e abre modal com instruções específicas iOS Safari/Chrome/Android
- Indicador "📡 OFFLINE" no topbar
- `applyBackup`: defaults por item — backups antigos sem todos os campos não causam mais `undefined access`

## v150 — 🔥 Auditoria profunda: 5 fixes

- **CRÍTICO:** undo/redo dava `ReferenceError` (`frc` removido)
- **CRÍTICO:** pinch-zoom no iPad nunca funcionou (ref+id no `style` em vez de prop). `scrollToCanvas` também era no-op.
- Race condition em ~25 `onBlur`: agora `setState` funcional (vestígios, papilos, `canvasVest`, trilhas, edificações)
- `applyBackup`: defaults p/ campos faltantes (compat antiga)
- Canvas history em JPEG 0.7 (≈80% menos RAM no undo)

## v149 — 🛠️ Auditoria + UX: × padronizado

- × veste / medicamento / slot padronizados (40×36)
- Veste duplicar (mantém vínculo cadáver)
- B2: foto da veste usa o cadáver correto (por ID)
- B3: vestes antigas sem `cadaver` default → 0
- B6: `tabFotoCount` memo (rápido em cenas grandes)
- B7: preview SVG trilha só com origem AND destino
- DPs recentes REMOVIDAS (state, useEffect, optgroup)
- Fotos sempre iniciam padrão (sem persistência)
- R2: save aborta se slot trocar mid-save
- R6: warn antes de PDF >50 fotos
- Slot novo automático no "+ Novo croqui"
- Card "Limpeza de Memória" na aba Exportar
- Regiões anatômicas: leigo (técnico) padronizado
- M2 / M4: limpeza de campo morto e variável não usada

## v148 — 🧠 Memory leak fix

`compressImg` agora libera GPU (`img.close()`) e canvas (`cv.width=0`) após processar cada foto. Em modo HQ (2400px), elimina risco de iOS Safari matar a aba após muitas fotos seguidas.

## v147 — 🛡️ 5 fixes de robustez (auditoria)

- `saveBackup` agora reflete falhas reais (fotos>4.8MB ou erro IO não fingem mais "salvo")
- Auto-save inclui trilhas nas deps
- `VestPk` + input dessincroniza não acontece mais (`key={"desc-"+id+"-"+desc}`)
- Botão PDF mostra estado real (`loading` / `fail` / `ok`) com retry
- Backup importado é validado (estrutura, tipos, arrays) antes de aplicar — JSON malformado não trava o app

## v146 — 🖐️ Papiloscopia padronizada igual vestígio

- Botões `[Camera|Image]` `[Copy]` `[×]` alinhados em wrapper `gap:4` no canto direito (antes estavam espalhados); delete direto sem confirmação
- 📷 `camBtn` (FAB entre Anterior/Próximo) usa `Camera` Lucide em vez do emoji

## v145 — 🧹 Topbar limpo

Removidos: ícone da aba atual (emoji redundante c/ tab bar logo abaixo), contador 📷N de fotos (já aparece por aba), botão Save (backup fica só na aba Exportar). Menos ruído visual no header.

## v144 — 📷 `FotoBtn` padronizado

`Camera` + `Image` (Lucide) no mesmo frame 40×36 que `Copy` e `×` (borda 1.5px, radius 10, tema aplicado). Photo-pickers e action buttons formam grupo visual coerente em todo o app.

## v143 — 🧪 Vestígio remover sem confirmação; botão duplicar

## v142 — 🎨 Repaginada visual completa

Cards com sombra em vez de bordas duplas, títulos 17px 700, segmented control iOS nas subabas (cadáver / veículo / desenho), tab bar ativa com underline 3px + tint sutil, paleta de botões unificada (primary blue + utilitário gray), tokens de background (danger / warning / success / info) no tema p/ consistência dark mode, clique-fora fecha modais não-destrutivos, toast 5s→3s, ícones Lucide (`Plus`, `Save`, `Camera`) no topbar.

## v141 — PDF pré-carregado ao logar

PDF pré-carregado ao logar (offline OK em cena sem rede); ● ponto permanente de save state + 📄 do PDF no topbar; medidor de storage no 📷✨ (%); badge de pendências no botão 📑 Croqui; fontes maiores (labels 11→13, inputs 16→17); `setTimeout` dos templates virou `useEffect`; histórico do desenho 25→10 snapshots.

## v140 — 🗑️ Modal de confirmação antes de deletar

Modal de confirmação antes de deletar vestígio com dados (papilo, lesão, trilha, edificação, etc); `popstate` agora usa modal React (não `window.confirm`); `tabHasData` corrigido p/ múltiplos cadáveres / veículos.

## v139 — 🗑️ Deletar vestígio/papilo/etc sempre funciona

Lista pode ficar vazia com estado amigável; 👆 Botões × e 📷 aumentados para tap confortável no celular (40×36px mínimo, Apple HIG 44pt).

## v138 — 👥 2º Perito vira select por nome

(Matrícula preenche automaticamente); 📷✨ Toggle Alta Qualidade na barra superior (2400px/92% vs 1200px/78%); matrícula combinada com nome no resumo de texto.

## v137 — 📷 Contagem correta de fotos por aba

Fix do filtro `startsWith`; 🧹 Botão × no último vestígio/papilo limpa campos em vez de bloquear; +"Walter" em Agente; +"Carteira de cigarro" em vestígios papiloscopia.

## v125 — 🎨 Laudo oficial

Logos PCDF/DF, cabeçalho em todas as páginas, numeração oficial (1. Histórico, 2. Objetivo, 3. Isolamento, 4. Exames, 5. Cadeia, 6. Correlatos, 7. Análise, 8. Conclusão), capa com resumo executivo, zebra stripe, rodapé com pág.

## v124 — 🔧 Auditoria

Fix `stale closure` em precipitação + `tabHasData` detecta Área Verde / Trilhas.

## v123 — 📋 Arma removida dos vestígios de homicídio/feminicídio

## v122 — 📋 +5 templates

(Feminicídio, tent. homic., sui. PAF e precipitação) + sexo pré-marcado em homicídios.

## v121 — 🌳 Área Verde — campo vegetação condicional

## v120 — 📋 Templates — 6 tipos + 3 locais (18 combinações)

## v119 — 📋 Templates por natureza — 7 tipos pré-configurados

## v118 — Layout: tabs centradas, sticky, espaçamento

## v117 — Auditoria: correções de bugs e melhorias

- CSS `translateX` corrigido no indicador de foto
- Numeração de vestes por cadáver (não global)
- Checklist valida campos "Outro" preenchidos
- Dropdowns: Agente, Papiloscopista, Viatura
- Ordem campos: Ocorrência → DP → Ano
- `FotoBtn` em Descrição, Diagnóstico, Vestes

## v116 — Regiões veiculares completas (75 áreas clicáveis)

- Lateral: 17 regiões / lado (porta, vidro, p-lama, p-choque, roda, pneu, retrovisor, colunas, soleira)
- Frente: 9 regiões (p-choque E/C/D, grade, faróis)
- Traseira: 8 regiões (p-choque E/C/D, lanternas)
- Teto: 4 quadrantes (ant/pos × E/D)
- Interior: 20 regiões completas
- Chassi removido por solicitação

## v115 — Auditoria

Bugs, segurança, performance.
