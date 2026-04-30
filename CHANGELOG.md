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

# Changelog — Xandroid

Histórico de versões do app de documentação forense.

> **Formato:** versão · descrição curta · detalhes (quando houver)
> **Padrão:** [Keep a Changelog](https://keepachangelog.com/), adaptado.

---

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

## v202 — Exportar tudo em ZIP + Web Share API

- `saveCroquiDocx` aceita parâmetro `returnBlobOnly`
- Novo helper `genPdfBlobFromHtml()` reusa lógica de PDF
- Toast progressivo: "Gerando Croqui PDF…" → "RRV…" etc.
- Haptic feedback ao iniciar e ao completar
- Nome do ZIP: `MVDroiD_<oc>-<ano>_DP<dp>_<YYYYMMDD>.zip`

## v201 (anterior) — Limpeza pós-auditoria

## v200 (anterior) — Fim das sugestões de cartão de crédito

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
