# Pesquisa: Canvas vs Alternativas — 2026-04-29

> **Quem pediu:** Perito Criminal Alexandre Moura
> **App:** Xandroid (PWA, React 18 + Vite)
> **Aba:** "Desenho" — croquis com mapa importado + figuras (stamps)
> **Sintomas:** stamps minúsculos no celular; área de seleção difícil de tocar.

---

## TL;DR (resumo executivo)

1. **Canvas HTML5 NÃO é o problema.** É a tecnologia certa pro caso (croqui ~5–15 figuras por desenho).
2. O problema é **como o canvas está configurado hoje** — três bugs simultâneos: (a) tamanho dos stamps em pixels fixos (50 px) num canvas que é "esticado" pelo CSS; (b) área de toque (hit-area) considerando só o quadradinho da figura; (c) falta de DPR (Device Pixel Ratio) — o canvas fica borrado no Retina.
3. **Recomendação:** **NÃO migrar de tecnologia agora.** Aplicar 6 quick wins (2–4 horas de trabalho) e ganhar 80% da experiência de uma biblioteca como Konva.js.
4. **Se um dia quiser migrar**, **Konva.js + react-konva** é a melhor escolha: ela já resolve hit-testing, transformer (alças de redimensionar), DPR e touch nativamente. Custo: 1 a 2 dias de refactor.
5. **Excalidraw e tldraw são overkill** para o caso (bundle de MB+, UI completa que você não precisa, e o "feel" deles é de whiteboard, não de croqui pericial).
6. **Fabric.js é alternativa válida**, porém menos amigável a React e mais "antiga" em termos de DX que Konva.
7. **Pixi.js / Skia / WebGL = exagero.** São pra jogos e visualização de milhares de objetos.
8. **Leaflet/MapLibre só fazem sentido se você for a um modelo de mapa real "ao vivo"** (zoom infinito, georreferência) — mas isso muda o jogo do croqui.
9. O caminho ouro: **fase 1 quick wins (hoje) → fase 2 Konva (quando sobrar tempo)**.
10. Você **não precisa de biblioteca pra resolver os 2 problemas que reportou**. Os dois são bugs de configuração do seu próprio canvas.

---

## Problema atual em linguagem simples

### O que é "Canvas"?
`<canvas>` é uma "tela em branco" do navegador. Você desenha pixels nela com JavaScript (linhas, círculos, imagens). É **rápida** e **roda em qualquer celular**, mas tem um detalhe técnico que pega muita gente:

> **Canvas não sabe o que tem dentro dele.** Se você desenhou um boneco em x=300, y=200, depois que desenhou, o canvas só vê **pixels**. Se o usuário tocar em x=305, y=205, é **você** (programador) quem precisa decidir "esse toque acertou o boneco".

Isso se chama **hit-testing**. E é a raiz do problema 2 do Alexandre.

### O que é DPR (Device Pixel Ratio)?
Quando a Apple lançou o iPhone 4 (2010), eles dobraram a densidade de pixels da tela. Pra evitar que tudo ficasse pequeno demais, criaram a ideia de **"pontos lógicos" (CSS pixels)**: 1 ponto = 2 pixels físicos no Retina, 1 ponto = 3 pixels no flagship Android, e até 4 pixels em alguns tablets de ponta. Isso é o `window.devicePixelRatio` (DPR). Fonte: [DisplayPixels](https://displaypixels.io/learn/device-pixel-ratio-explained.html).

**Por que isso importa pro Xandroid:** o canvas dele tem `width=1200 height=850` (pixels internos), mas o CSS estica ele com `width: 100%` (pode virar 380 px de largura no celular). Com DPR=3, isso significa:
- **Tela do iPhone:** ~380 pontos lógicos × 3 pixels físicos = 1140 pixels físicos.
- **Canvas interno:** 1200 pixels — tá quase certo pelo acaso!
- **MAS**: tudo que ele desenha em "tamanho 50" (stampSz=50) vira **50 pixels do canvas → ~16 pontos lógicos na tela** = ~5–6 mm físicos. Por isso "**fica pequeno**".

### O que é a Lei de Fitts?
Lei de 1954 (Paul Fitts) que diz: **o tempo pra acertar um alvo depende do tamanho do alvo e da distância**. Tradução pro celular: **alvo pequeno = miss e frustração**.

Os padrões da indústria:
- **iOS Human Interface Guidelines:** mínimo **44 × 44 pontos** (Apple).
- **Material Design (Android):** mínimo **48 × 48 dp** (Google).
- **WCAG 2.1 (acessibilidade web):** mínimo **44 × 44 CSS px**.

Fontes: [Nielsen Norman Group](https://www.nngroup.com/articles/touch-target-size/), [Adrian Roselli — Target Size](https://adrianroselli.com/2019/06/target-size-and-2-5-5.html), [WAI/W3C](https://www.w3.org/WAI/WCAG21/Understanding/target-size.html).

**Onde o Xandroid bate nisso:** o stamp tem 50 px no canvas → na tela do celular tem ~16 pontos lógicos = **muito abaixo** dos 44 mínimos. A área de hit (`hf = sz/2 + 14 = 39 px no canvas`) ≈ **13 pontos** na tela. **Inacessível**.

---

## Análise da implementação atual do Xandroid

Localizei a aba Desenho no arquivo `C:\Users\Dell\Documents\mvdroid\src\App.jsx` (3.314 linhas).

### Como o canvas é montado (linha 3101)
```jsx
<div style={{transform:`scale(${zoomLvl})`, transformOrigin:"top center", width:..., maxWidth:1200}}>
  <div style={{position:"relative"}}>
    <canvas ref={canvasRef} width={1200} height={850}
            style={{width:"100%", display:"block", touchAction:"none", ...}}
            onPointerDown={onD} onPointerMove={onM} onPointerUp={onU}/>
    <canvas ref={overlayRef} width={1200} height={850}
            style={{position:"absolute", top:0, left:0, width:"100%", pointerEvents:"none", touchAction:"none"}}/>
  </div>
</div>
```

**O que está bom:**
- Usa **dois canvases** (um pra o desenho fixo, outro pra o overlay de stamps) — boa arquitetura.
- Usa **Pointer Events** (`onPointerDown` etc.), que é o padrão moderno e unifica mouse + touch + caneta. Fonte: [MDN — Pointer Events](https://developer.mozilla.org/en-US/docs/Web/API/Pointer_events/Using_Pointer_Events).
- Usa `touchAction: "none"` pra não scrollar a página enquanto desenha.
- Tem `pinchRef` (linha 1042) com pinch-to-zoom de dois dedos. Bom.
- Pressure sensitivity p/ Apple Pencil (linha 1169 — `e.pressure`). Excelente.

**O que tem problema:**

#### Bug 1 — Tamanho fixo em pixels do canvas, ignorando o DPR e a tela real
```js
// linha 695:
const stampSz=50;
```
**Problema:** 50 é fixo em pixels do canvas (1200×850). No celular o canvas é exibido com ~380 px de largura → cada pixel do canvas vira 0,32 ponto lógico → o stamp aparece com ~16 pontos = **muito pequeno**.

**Como deveria ser:** `stampSz` precisa ser **calculado** com base na largura real exibida, num tamanho que dê pelo menos 44×44 pontos lógicos no toque. Algo como:
```js
const minStampPx = (canvasW / displayW) * 44; // ex: 1200/380 * 44 ≈ 139 px
const stampSz = Math.max(80, minStampPx);
```

#### Bug 2 — Hit-area pequena (linha 1160)
```js
const hitStamp=(px,py)=>{
  const my=(stampObjs||[]).filter(s=>s.sheet===desenhoIdx);
  for(let i=my.length-1;i>=0;i--){
    const s=my[i];
    const hf=(s.sz||50)/2+14;  // <-- só +14 px de tolerância!
    if(px>=s.x-hf && px<=s.x+hf && py>=s.y-hf && py<=s.y+hf) return s;
  }
  return null;
};
```
**Problema:** com `sz=50` e `+14`, a caixa de hit é 78×78 px do canvas. No celular vira ~25 pontos lógicos. **Abaixo do mínimo 44**.

**Como deveria ser:** a tolerância precisa ser proporcional à **escala real** (canvas/tela). Ex.: tolerância dinâmica = `Math.max(14, (canvasW/displayW) * 22)`.

#### Bug 3 — Nenhum tratamento de DPR (resolução borrada)
Nenhum trecho do código aplica `window.devicePixelRatio`. Em telas Retina e flagships Android (DPR 2 ou 3), o canvas é renderizado em baixa resolução e o navegador escala — **resultado: linhas borradas, texto ilegível**. Fontes: [web.dev — High DPI Canvas](https://web.dev/articles/canvas-hidipi), [kirupa](https://www.kirupa.com/canvas/canvas_high_dpi_retina.htm).

**Como deveria ser** (princípio):
```js
const dpr = Math.min(window.devicePixelRatio || 1, 2); // capa em 2 pra economizar bateria
canvas.width = 1200 * dpr;
canvas.height = 850 * dpr;
canvas.style.width = "1200px";  // ou %
canvas.style.height = "850px";
ctx.scale(dpr, dpr);  // depois desenha como se fossem 1200×850 normais
```
Recomenda-se **capar em 2x** mesmo em DPR 3+ pra não derrubar a bateria — 4× DPR = 16× pixels pra renderizar (Fonte: [PlayCanvas DPR](https://developer.playcanvas.com/user-manual/optimization/runtime-devicepixelratio/)).

#### Bug 4 — Botões de excluir/girar/redimensionar com `hR=40` mas... (linha 1165)
```js
if(Math.hypot(p.x-(hit.x+hf), p.y-(hit.y-hf)) < hR){ /* deletar */ }
```
**Aqui está bom** — raio de 40 px do canvas, círculo. Por isso o usuário relatou que "**os botões são grandes**". O problema é só selecionar o stamp em si pra **fazer aparecer os botões**.

#### Bug 5 — Pointer-events:none no overlay (linha 3101)
```jsx
<canvas ref={overlayRef} ... style={{... pointerEvents:"none", ...}}/>
```
Isso é correto (pra eventos passarem pro canvas debaixo), mas combinado com o tamanho pequeno dos stamps, o usuário toca "no nada" facilmente.

### Resumo da análise
**A tecnologia (canvas 2D) está certa. O que está faltando são 4 ajustes pontuais.**

---

## Alternativas tecnológicas — comparação completa

| Lib | O que é | Pros mobile | Contras | Bundle gzip | Mantida? | PWA-friendly? |
|---|---|---|---|---|---|---|
| **Canvas 2D crú** (atual) | API nativa do navegador. Você mesmo desenha tudo. | Zero KB extra. Total controle. Funciona em qualquer device. | Você implementa **tudo** (hit-test, transform, undo). DPR manual. | 0 KB | Eterno (W3C) | Sim |
| **Konva.js + react-konva** | "Scene graph" 2D em cima do canvas. Cada figura é um objeto com x/y/eventos. Hit-testing nativo. | `hitStrokeWidth` (área de hit maior que o visual). Transformer com alças que **já vêm maiores no touch** (anchorSize ajustável). Multi-touch nativo. Filhos React declarativos. | Adiciona ~155 KB gzip. Curva: 4–8h pra dominar. | konva ~155 KB + react-konva ~40 KB ≈ **180 KB gzip** | Sim, mantida ativa, v10+ em 2026. | Sim (offline OK) |
| **Fabric.js** | Lib clássica de canvas 2D com objetos (Image, Rect, Group). Usada em editores de imagem. | Objetos manipuláveis, controles de transform nativos. | API mais "imperativa" (não casa tão bem com React). Lib grande (~300 KB se importar tudo). Estilo de eventos por-objeto pode ser limitante. | ~77 KB min, ~20 KB gzip num build mínimo. Build cheio: até 300 KB. | Sim (v6 em 2026). | Sim |
| **Excalidraw (@excalidraw/excalidraw)** | Whiteboard "estilo desenhado à mão" pronto. Drop-in component React. | Polidíssimo. Touch funciona razoavelmente. ESM tree-shakable em v0.18+. | É um **app inteiro**, não uma lib de baixo nível. Você não controla a UI fácil. Bundle muito grande (~MB+). Visual "rascunho" não é cara de croqui pericial. Rotação por toque ainda é tema de issues abertas. | ~ "vários MB" — peso pesado. | Sim, 2026. | Sim |
| **tldraw v3** | Sucessor do Excalidraw, infinite canvas SDK. | Touch e gestos polidos. APIs ricas. | Licença comercial (cuidado com uso). Bundle grande. Conceitos novos pra absorver. | Pesado (não publicado em bundlephobia padrão; estimativa 500 KB+ gzip). | Sim, v4.2 em 2026. | Sim |
| **SVG + react-spring** | Você renderiza cada stamp como `<svg><g transform=.../></g></svg>`. | DPR automático (vetor). Hit-test nativo do DOM (clique no `<g>`). Estiliza por CSS. Excelente p/ poucos objetos (5–15). | Performance cai com 1000+ objetos (não é seu caso). Drag/rotate você implementa. | Zero KB extra (DOM nativo); react-spring ~30 KB se quiser animação. | Eterno (W3C). | Sim |
| **Pixi.js** | WebGL 2D, otimizado pra muitos objetos (jogos). | Super rápido. | Overkill total p/ 5–15 stamps. WebGL no iOS antigo às vezes engasga. | ~150 KB gzip. | Sim. | Sim, mas pesado. |
| **Skia / CanvasKit (Google)** | Engine usado pelo Chrome/Flutter. WASM. | Qualidade gráfica excelente. | Bundle de **MB**. Complexo. Carrega WASM. | 2–3 MB. | Sim. | Pesado p/ PWA offline. |
| **Leaflet + plugins (Leaflet.draw)** | Mapa real (com tiles) + camada de marcadores. | Já é mapa "de verdade", georreferenciado. Plugins maduros. | Muda o paradigma: você desenha em **lat/lng**, não em pixel. Refactor profundo. | ~40 KB gzip. | Sim. | Sim (com tiles offline). |
| **MapLibre GL + Terra Draw** | Mapa vetorial moderno (sem Mapbox), WebGL. | Visual lindo. Touch nativo. | Tiles offline são mais difíceis. WebGL em iOS Safari raramente trava. | ~200 KB gzip. | Sim, ativo 2026. | Sim com cache. |
| **OpenLayers** | Mapa GIS profissional. | Muito poderoso, drawing/edit nativo. | Curva alta. Pesado. | ~150 KB gzip. | Sim. | Sim. |

**Fontes:** [Konva FAQ](https://konvajs.org/docs/faq.html), [Konva vs Fabric (PkgPulse 2026)](https://www.pkgpulse.com/blog/fabricjs-vs-konva-vs-pixijs-canvas-2d-graphics-libraries-2026), [Excalidraw v0.18 release](https://github.com/excalidraw/excalidraw/releases/tag/v0.18.0), [tldraw 4.2](https://tldraw.dev/blog/tldraw-4-2-release), [Terra Draw](https://github.com/JamesLMilner/terra-draw), [Felt — From SVG to Canvas](https://felt.com/blog/from-svg-to-canvas-part-1-making-felt-faster).

---

## Boas práticas para Canvas 2D mobile

### 1. Hit-testing tolerante (ghost area maior que a visual)
**Princípio:** a área que **detecta o toque** é maior que a área **desenhada**.
- Konva chama isso de [`hitStrokeWidth`](https://konvajs.org/api/Konva.Shape.html) — em mobile usa 10 px por padrão.
- Pra Canvas crú: aumente o `+14` da função `hitStamp` pra algo dinâmico em função da escala display/canvas.

### 2. DPR scaling correto
- `canvas.width = cssWidth * dpr`, `canvas.height = cssHeight * dpr`, `ctx.scale(dpr, dpr)`.
- Cap em **2×** em DPR ≥ 3 pra economizar bateria.
- Fonte: [web.dev — High DPI Canvas](https://web.dev/articles/canvas-hidipi).

### 3. Tamanho mínimo de stamps proporcional à viewport
- Calcule `stampSz` em função de `canvas.width / displayWidth` para garantir ≥44 pontos lógicos.

### 4. Ghost handles maiores que visual
- O **círculo de hit** dos botões (excluir/girar/redimensionar) já é 40 px (ok), mas o **desenho do botão** pode ser menor — fica mais bonito sem perder usabilidade.

### 5. Pointer Events sempre (já está OK no Xandroid)
- Já está usando `onPointerDown/Move/Up`. Fonte: [MDN](https://developer.mozilla.org/en-US/docs/Web/API/Pointer_events/Using_Pointer_Events).

### 6. Pinch-to-zoom (já está OK)
- Linha 1042 do App.jsx faz isso bem.
- Cuidado com iOS Safari, onde `touch-action` tem suporte limitado — você já faz `e.preventDefault()` corretamente. Fonte: [touch-action issue iOS](https://github.com/pmndrs/use-gesture/issues/486).

### 7. Cuidado com scroll vs drag
- `touchAction: "none"` no canvas (já está). OK.

### 8. Transformer / handles arrastáveis com alvo grande
- Os 3 botões circulares (40 px de raio) já são grandes — bom.
- **Faltou:** uma "pegada" central de 44+ px só pra arrastar o stamp sem ativar nada.

---

## Como outros apps resolvem

### Excalidraw (mobile)
- Faz hit-testing tolerante automático.
- Alças do bounding box ficam **maiores** quando detecta touch device.
- Rotação no mobile **ainda tem issue aberta** sobre rotação em passos discretos no celular. Fonte: [issue #1351](https://github.com/excalidraw/excalidraw/issues/1351).

### Figma (mobile/iPad)
- Hit-tolerance generosa: você toca "perto" do objeto e ele seleciona.
- Handles separados das figuras (overlay de UI), com size grande (~24 pt).

### Apple Notes (desenho)
- Apple Pencil first, mas dedo OK.
- Não tem stamps — só caneta. Não comparável diretamente.

### Procreate (iOS nativo)
- "Hit slop" enorme, alças com **raio invisível 30+ pt** maior que o visual.
- Inspiração: **separar a área de hit da área visual** é o segredo.

### Konva (lib)
- Default hitStrokeWidth = 10 px em touch device. Anchor size do Transformer aumenta no mobile automaticamente.

**Lição comum:** todos esses apps **separam** "o que aparece" de "o que pega o toque". O segundo é sempre maior. É o que falta no Xandroid hoje.

---

## RECOMENDAÇÃO FINAL

### Tecnologia: **continue com Canvas 2D crú** (por ora)

**Por quê:**
1. Você só tem 5–15 figuras por croqui — **canvas crú dá conta com folga**.
2. A migração pra Konva custaria **1 a 2 dias** de refactor (toda a função `ds`, `hitStamp`, `onD/M/U`, `renderOverlay`). Sem tempo agora.
3. Bundle do Konva (~180 KB gzip) é dinheiro pago em **MB de dados móveis** dos peritos.
4. Os 2 problemas reportados resolvem com **~3 horas de ajuste** sem trocar a stack.
5. Excalidraw/tldraw resolvem o problema, mas trazem uma UI inteira que **briga com o resto do app** e visual de "rascunho à mão" inadequado pra um croqui pericial oficial.

### Plano em fases

#### Fase 1 — Quick wins (HOJE — 2 a 4 horas)
Ajustes pontuais no `App.jsx`. Detalhe na próxima seção. Resolve 80% da queixa.

#### Fase 2 — Migração pra Konva (FUTURO, OPCIONAL — 1 a 2 dias)
Se um dia quiser ir além:
- Refazer **só a aba Desenho** com `react-konva`.
- Stamps viram `<Group><Path /><Rect (hit area) /></Group>`.
- Seleção/transform com `<Transformer />` (alças maiores no touch automaticamente).
- Mantém o resto do app intacto.

**Esforço estimado em horas:**

| Caminho | Horas | Risco | Ganho |
|---|---|---|---|
| Quick wins (Fase 1) | 2–4h | Baixo | Resolve os 2 problemas reportados | 
| Migração Konva (Fase 2) | 8–16h | Médio (refactor da aba inteira, regressões em export PNG/PDF) | UX premium + base sólida pra futuras features |
| Excalidraw embed | 4–8h pra integrar, 8–16h pra alinhar visual + export | Alto (export PNG, integração com `imgRef.current`, look & feel) | UX boa, mas não combina com app pericial |
| Migrar pra Leaflet | 16–32h | Muito alto (paradigma de coordenadas geográficas, refazer tudo) | Só vale se for usar mapa de verdade |

**Veredicto:** **Fase 1 agora. Fase 2 só se um dia o app crescer muito.**

---

## Quick wins imediatos (sem trocar de tecnologia)

Estes são os 6 ajustes que recomendo **fazer agora** no `src/App.jsx`. Cada um é cirúrgico (poucas linhas).

### QW1 — `stampSz` dinâmico (resolve "stamps pequenos no celular")
**Onde:** linha 695, `const stampSz=50;`
**Mudar para algo como:**
```js
// Calcula em useState/useRef pra reagir a resize
const [stampSz, setStampSz] = useState(80);
useEffect(()=>{
  const calc = ()=>{
    const c = canvasRef.current; if(!c) return;
    const r = c.getBoundingClientRect();
    if(r.width<1) return;
    // 44 pt no display = quantos px no canvas?
    const targetCanvasPx = (1200/r.width) * 44;
    // Garante mínimo confortável: 80 px no canvas → ~25 pt no celular pequeno, mais no tablet
    setStampSz(Math.max(80, Math.round(targetCanvasPx)));
  };
  calc();
  const onR = ()=>calc();
  window.addEventListener("resize", onR);
  return ()=>window.removeEventListener("resize", onR);
}, []);
```
**Efeito:** stamps nascem com ~80–140 px no canvas → no celular vira ~30–45 pt lógicos → **dedo acerta**.

### QW2 — `hitStamp` com tolerância proporcional (resolve "área de seleção difícil")
**Onde:** linha 1160.
**Mudar para:**
```js
const hitStamp=(px,py)=>{
  const my=(stampObjs||[]).filter(s=>s.sheet===desenhoIdx);
  // Calcula tolerância dinâmica: garante 44 pt no display
  const c = canvasRef.current;
  const scale = c ? (1200 / c.getBoundingClientRect().width) : 1;
  const minTol = Math.max(14, scale * 22); // 22 pt = meio-44, simétrico
  for(let i=my.length-1; i>=0; i--){
    const s = my[i];
    const hf = (s.sz||50)/2 + minTol;
    if(px>=s.x-hf && px<=s.x+hf && py>=s.y-hf && py<=s.y+hf) return s;
  }
  return null;
};
```
**Efeito:** no celular, área de seleção fica ~44 pt grande **mesmo em stamps pequenos**.

### QW3 — DPR scaling no canvas (resolve linhas borradas)
**Onde:** onde você inicializa o canvas (provavelmente um useEffect que faz `ctxRef.current = canvasRef.current.getContext("2d")`).
**Adicionar:**
```js
const dpr = Math.min(window.devicePixelRatio||1, 2);
const c = canvasRef.current;
c.width = 1200 * dpr;
c.height = 850 * dpr;
c.style.width = "100%";
c.style.height = "auto";
const ctx = c.getContext("2d");
ctx.scale(dpr, dpr);
ctxRef.current = ctx;
// Idem pro overlay
const oc = overlayRef.current;
oc.width = 1200 * dpr; oc.height = 850 * dpr;
oc.getContext("2d").scale(dpr, dpr);
```
**Atenção:** todas as funções de export (`forceSaveCanvas`, PNG 4×) precisam ser revisadas — você já trabalha em `1200×850` virtual, então o `drawImage(canvas, 0, 0)` pra PNG continua funcionando, mas talvez precise fazer um canvas temporário não-DPR pra exportar. **Teste exports antes de comprometer.**

**Se for arriscado mexer em export, faça apenas no overlay (que não exporta).**

### QW4 — `cp(e)` (coordenada do ponteiro) já está certa
**Onde:** linha 1055.
```js
return{x:(cx-r.left)*(c.width/r.width), y:(cy-r.top)*(c.height/r.height)};
```
**Comentário:** com DPR, `c.width` muda. **Cuidado:** se aplicar QW3, esse cálculo passa a dividir por `1200*dpr` que **dá outro número**. Solução: usar `c.width/dpr` ou guardar `1200` como constante. Pra simplicidade:
```js
const cssW = 1200, cssH = 850;
return{x:(cx-r.left)*(cssW/r.width), y:(cy-r.top)*(cssH/r.height)};
```

### QW5 — Aumentar tamanho mínimo dos stamps existentes ao migrar
Se já tem croquis salvos com `sz=50`, considere um **upgrader** que ao carregar antigos faça `sz = max(sz, 80)`. Pequena função em `applyBackupData`.

### QW6 — Botão "selecionar" mais óbvio + feedback haptic ao acertar
- Ao tocar e **acertar** um stamp, dê `haptic("selection")` (já tem `haptic` no app pelo que vi). Confirma pro usuário "**peguei**".
- Ao **errar**, mostre um toast curto: "Toque no stamp pra selecionar".

### QW BÔNUS — Aumentar a opacidade do bounding box selecionado
Linha 1049, `ctx.strokeStyle="#007aff"; ctx.lineWidth=3;` → bom. Considere `lineWidth=4` em mobile pra ficar mais visível.

---

## Tabela de decisão rápida

| Pergunta | Resposta |
|---|---|
| Devo migrar pra Konva agora? | **Não** — fazer quick wins primeiro |
| E pra Excalidraw? | **Não** — visual e UX errados pro caso |
| E pra Leaflet/MapLibre? | **Não** — muda o paradigma do app inteiro |
| Devo manter Canvas 2D crú? | **Sim** — só ajustar configuração |
| Quanto tempo pra resolver? | **2–4 horas** com os 6 quick wins |
| Quando reabrir essa pesquisa? | Se um dia quiser **multi-stamps com gestos avançados**, **colaboração em tempo real**, ou **>50 stamps por croqui** |

---

## Fontes consultadas

### Conceitos fundamentais
- [Nielsen Norman Group — Touch Target Size](https://www.nngroup.com/articles/touch-target-size/)
- [Adrian Roselli — Target Size and 2.5.5](https://adrianroselli.com/2019/06/target-size-and-2-5-5.html)
- [WAI/W3C — Target Size Success Criterion](https://www.w3.org/WAI/WCAG21/Understanding/target-size.html)
- [DisplayPixels — Device Pixel Ratio](https://displaypixels.io/learn/device-pixel-ratio-explained.html)
- [web.dev — High DPI Canvas](https://web.dev/articles/canvas-hidipi)
- [Kirupa — Canvas High DPI Retina](https://www.kirupa.com/canvas/canvas_high_dpi_retina.htm)
- [PlayCanvas — Device Pixel Ratio Optimization](https://developer.playcanvas.com/user-manual/optimization/runtime-devicepixelratio/)
- [MDN — Pointer Events](https://developer.mozilla.org/en-US/docs/Web/API/Pointer_events/Using_Pointer_Events)
- [MDN — touch-action CSS](https://developer.mozilla.org/en-US/docs/Web/CSS/touch-action)
- [Medium — Fitts' Law in UX](https://medium.com/design-bootcamp/what-is-fitts-law-and-how-to-apply-it-in-ux-design-63f386c968ad)

### Bibliotecas — Konva.js
- [Konva FAQ oficial](https://konvajs.org/docs/faq.html)
- [Konva — Mobile Touch Events](https://konvajs.org/docs/events/Mobile_Events.html)
- [Konva — Custom Hit Region](https://konvajs.org/docs/events/Custom_Hit_Region.html)
- [Konva — Multi-touch Scale Stage (pinch zoom)](https://konvajs.org/docs/sandbox/Multi-touch_Scale_Stage.html)
- [Konva — Transformer (alças)](https://konvajs.org/api/Konva.Transformer.html)
- [Konva Issue #524 — hitStrokeWidth](https://github.com/konvajs/konva/issues/524)
- [react-konva no npm](https://www.npmjs.com/package/react-konva)
- [react-konva no Bundlephobia](https://bundlephobia.com/package/react-konva)

### Bibliotecas — comparativos
- [PkgPulse Blog — Fabric vs Konva vs PixiJS 2026](https://www.pkgpulse.com/blog/fabricjs-vs-konva-vs-pixijs-canvas-2d-graphics-libraries-2026)
- [DEV — Konva vs Fabric (Lico)](https://dev.to/lico/react-comparison-of-js-canvas-libraries-konvajs-vs-fabricjs-1dan)
- [Medium — Konva.js vs Fabric.js (Blog4j)](https://medium.com/@www.blog4j.com/konva-js-vs-fabric-js-in-depth-technical-comparison-and-use-case-analysis-9c247968dd0f)

### Bibliotecas — Excalidraw / tldraw / mapas
- [Excalidraw — Integration docs](https://docs.excalidraw.com/docs/@excalidraw/excalidraw/integration)
- [Excalidraw v0.18 release (ESM)](https://github.com/excalidraw/excalidraw/releases/tag/v0.18.0)
- [Excalidraw issue #1351 — rotação discreta no mobile](https://github.com/excalidraw/excalidraw/issues/1351)
- [tldraw SDK site](https://tldraw.dev/)
- [tldraw SDK 4.2 release](https://tldraw.dev/blog/tldraw-4-2-release)
- [Terra Draw (lib de drawing pra mapas)](https://github.com/JamesLMilner/terra-draw)
- [Geoapify — Leaflet vs MapLibre vs OpenLayers](https://www.geoapify.com/map-libraries-comparison-leaflet-vs-maplibre-gl-vs-openlayers-trends-and-statistics/)
- [Felt — From SVG to Canvas (case real de migração)](https://felt.com/blog/from-svg-to-canvas-part-1-making-felt-faster)

### iOS Safari / PWA quirks
- [touch-action issue (use-gesture)](https://github.com/pmndrs/use-gesture/issues/486)
- [PQINA — Prevent scrolling iOS Safari 15](https://pqina.nl/blog/how-to-prevent-scrolling-the-page-on-ios-safari/)
- [Ben Frain — Preventing body scroll iOS](https://benfrain.com/preventing-body-scroll-for-modals-in-ios/)

---

**Conclusão de uma frase:** Canvas 2D é a tecnologia certa pro Xandroid, e os problemas que você sentiu são **3 ajustes de configuração**, não um problema de tecnologia.
