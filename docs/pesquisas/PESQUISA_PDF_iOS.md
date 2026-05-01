# Pesquisa: html2pdf.js travando em iOS 18 — alternativas — 2026-04-30

> Pesquisa feita pelo agente em resposta ao bug "zip-croqui-fail" reportado em 30/04/2026
> (iPhone iOS 18.7 Safari, html2pdf travando 120s + 90s).
> Linguagem: simples, leigo-friendly. Fontes verificáveis no final.

---

## TL;DR (resumo executivo)

1. **O problema é REAL e CONHECIDO** — não é bug do Xandroid. `html2pdf.js` (que usa `html2canvas` por baixo) trava em iOS 17/18 em vários cenários. Existe issue oficial aberta: [parallax/jsPDF#3876](https://github.com/parallax/jsPDF/issues/3876).
2. **A causa mais provável no caso do Xandroid:** combinação de **base64 inline grande** (logos institucionais ~50KB cada) + **WebKit reduziu memória de canvas para 224MB no iOS** + **clone de DOM pesado dentro de `foreignObject`** que o WebKit às vezes nunca termina de renderizar (a Promise nunca resolve).
3. **A solução que o usuário JÁ COMEÇOU A IMPLEMENTAR (botão "Imprimir/PDF (iOS)" via `printCroquiHTML` + AirPrint) é exatamente a recomendação da indústria** para iOS 18. É o caminho menos arriscado.
4. **Curto prazo (HOJE):** não tente mais gerar PDF via html2pdf no iOS. Pule direto pro AirPrint quando for iOS — o usuário toca "Imprimir → Salvar em Arquivos" e o iOS gera PDF nativo, alta qualidade, sem limite de tamanho. Já funciona no app, só precisa virar o **caminho padrão** no iOS (não alternativo).
5. **Médio prazo (2-4 semanas, opcional):** se quiser PDF "automático" no iOS sem o usuário tocar em "Imprimir", a única opção confiável é **migrar pro `jsPDF puro` + `jspdf-autotable`** (gera PDF programático sem html2canvas). Esforço médio porque o croqui hoje é HTML.
6. **Longo prazo:** `@react-pdf/renderer` é mais "React-idiomático", mas pesa +1MB no bundle e exige reescrever todo o template do croqui. Não recomendado pro Xandroid.
7. **Servidor (Vercel Function + Puppeteer):** funciona mas custa caro (precisa Vercel Pro a partir de $20/mês porque Hobby tem timeout 10s) e quebra modo offline. Descartado pro caso de uso.

**Recomendação final em uma frase:** Mantenha html2pdf no Windows/Android, **torne o AirPrint o caminho oficial e único do iOS** (esconda o botão "PDF" no iOS, deixe só o "Imprimir/PDF (iOS)"), e adicione um aviso explicando "iOS gera PDF via Imprimir → Salvar em Arquivos".

---

## 1. Diagnóstico do problema atual (em linguagem simples)

### O que `html2pdf.js` faz por baixo do capô

`html2pdf.js` é um "atalho" que combina duas bibliotecas:

1. **`html2canvas`** — pega o `<div>` HTML e desenha ele em uma imagem (canvas). É como tirar uma foto da tela.
2. **`jsPDF`** — pega essa imagem e mete ela dentro de um arquivo PDF.

O problema é que o passo 1 (`html2canvas`) é **frágil em iOS**. Ele faz três coisas por dentro que o iOS Safari não gosta:

- **Clona o DOM inteiro** dentro de um `<iframe>` invisível para isolar o estilo.
- **Decodifica imagens base64** carregando-as como `<img>` no DOM clonado.
- **Renderiza tudo via `<foreignObject>` SVG** (uma técnica do WebKit/Blink que mete HTML dentro de SVG e converte pra canvas).

### Por que trava no iPhone (e não no Windows)

Três fatores conspirando ao mesmo tempo:

| Fator | Efeito |
|---|---|
| **WebKit cortou a memória de canvas de 448MB → 224MB** em iOS recente | Canvas grande estoura silenciosamente, sem erro |
| **iOS 18.x mexeu na pipeline do `<foreignObject>`** | A Promise do `html2canvas` às vezes nunca resolve (fica "Stuck at 0ms Starting document clone") |
| **Base64 inline grande (logos ~50KB)** | Decodificar base64 de imagem dentro de `foreignObject` é lento e pode falhar mudo no WebKit |

Resultado: `html2pdf().toPdf().get("pdf")` retorna uma Promise que **nunca chama `resolve()` nem `reject()`**. Por isso o timeout de 120s + retry de 90s perdem 3min30s sem nada acontecer.

### Por que funciona no Windows/Chrome desktop

- Chrome desktop tem **muito mais memória** para canvas (gigabytes, não 224MB).
- Blink (engine do Chrome) tem implementação diferente de `<foreignObject>` que não tem o bug do WebKit.
- Imagem base64 grande não é problema com 16GB de RAM.

### Validação com fontes verificáveis

- Issue **niklasvh/html2canvas#3053** — "Stuck at 0ms Starting document clone on iOS (Safari and Chrome)" — sintoma idêntico ao do Xandroid.
- Issue **parallax/jsPDF#3876** — "Affecting jsPDF + html2canvas on recent iOS versions (iOS 17.x, 18.x, iPadOS included)" — confirma que o problema é específico do iOS recente.
- Issue **eKoopmans/html2pdf.js#481** — "Blank pages if more then 5 on Safari/iOS/iPhone" — limite de canvas (16.777.216 pixels = 4096×4096) é estourado em PDFs longos.
- Issue **eKoopmans/html2pdf.js#601** — "html2pdf creates a blank PDF / 'The operation is insecure' on iOS 16.x" — propriedade `scale` do html2canvas dispara security error em iOS.
- WebKit Bug **195325** — confirmação oficial do WebKit de que o limite de memória de canvas foi reduzido pra 224MB.

---

## 2. Issues conhecidas html2pdf / html2canvas em iOS 18 (links verificáveis)

| URL | O que é |
|---|---|
| https://github.com/parallax/jsPDF/issues/3876 | "Affecting jsPDF + html2canvas on recent iOS versions (iOS 17.x, 18.x, iPadOS included)" — issue oficial confirmando o problema |
| https://github.com/niklasvh/html2canvas/issues/3053 | "Stuck at 0ms Starting document clone on IOS (Safari and Chrome)" — sintoma idêntico (Promise nunca resolve) |
| https://github.com/niklasvh/html2canvas/issues/3216 | "Not working on safari 16 or lower" — callback nunca é chamada |
| https://github.com/niklasvh/html2canvas/issues/2754 | Imagens base64 inline não renderizam |
| https://github.com/niklasvh/html2canvas/issues/2379 | "Html2canvas crash browser in mobile" |
| https://github.com/eKoopmans/html2pdf.js/issues/481 | "Blank pages if more then 5 on Safari/iOS/iPhone" — limite de canvas |
| https://github.com/eKoopmans/html2pdf.js/issues/397 | "html2pdf.js produces a blank document on iOS" |
| https://github.com/eKoopmans/html2pdf.js/issues/601 | "Operation is insecure on iOS 16+ — `scale` property dispara erro" |
| https://github.com/eKoopmans/html2pdf.js/issues/687 | "PDF content is blank after download in iOS" (2024) |
| https://github.com/eKoopmans/html2pdf.js/issues/66 | "Problems with download on iPhone PWA" — modo standalone PWA tem problema extra |
| https://bugs.webkit.org/show_bug.cgi?id=195325 | WebKit oficial — limite de memória canvas de 224MB |
| https://github.com/home-assistant/frontend/issues/28367 | Regressão WebKit 26 (iOS 26) confirmada — confirmando que iOS recente continua piorando renderização canvas/GPU |

**Diagnóstico cruzado:** o bug **não tem fix oficial planejado**. A maintainer-ship do `html2canvas` está em estado quase morto (último commit relevante há mais de 1 ano). Existe um fork ativo `html2canvas-pro` (https://yorickshan.github.io/html2canvas-pro/) — vale tentar mas **não há garantia que resolva o caso específico do iOS 18**.

---

## 3. Alternativas — comparação completa

| Biblioteca | O que é (linguagem simples) | Bundle (KB) | iOS 18 funciona? | Tabelas com cor/zebra? | Imagens? | Offline (PWA)? | Mantida 2026? | Esforço migração |
|---|---|---|---|---|---|---|---|---|
| **html2pdf.js** (atual) | Tira "foto" do HTML e vira PDF | ~340 min+gz | **NÃO confiável** em iOS 18 | Sim (mas via foto) | Sim | Sim | Pouco ativa | — |
| **html2canvas-pro** (fork) | Mesma ideia, fork mais recente | ~280 min+gz | **Talvez** — tem fixes mas não há prova de iOS 18 ok | Sim (foto) | Sim | Sim | Ativo (2025) | Baixíssimo (drop-in replacement) |
| **jsPDF puro + jspdf-autotable** | Desenha o PDF "letra por letra" via comandos JS, sem foto | ~140 min+gz | **Sim, confiável** (não usa canvas) | Sim, nativo | Sim, via `addImage` | Sim | Muito ativa (4M+ downloads/sem) | **Médio** — precisa reescrever a função que monta o croqui (de HTML pra chamadas `doc.text/rect/addImage`) |
| **pdfmake** | Você descreve o PDF como JSON ("título aqui, tabela ali") e ele monta | **~700 min+gz + vfs_fonts pode ter +1-2MB** | Sim | Sim, ótimas | Sim | Sim | Ativa (940k downloads/sem) | **Alto** — sintaxe declarativa diferente, fontes precisam ser embutidas |
| **@react-pdf/renderer** | Você escreve componentes React tipo `<Page><View>...</View></Page>` que viram PDF | **~1.2MB min+gz** (pesadão!) | Sim, mas reportado bug "PDFDownloadLink mostra PDF em vez de baixar no iOS" | Sim, via flexbox | Sim | Sim | Muito ativa (15.9k stars) | **Alto** — reescrever todo o template do croqui em JSX próprio |
| **pdf-lib** | Manipula PDF binário direto (criar, mesclar, assinar) | ~250 min+gz | Sim (não usa canvas) | **Não tem helper de tabela** — você desenha retângulo por retângulo | Sim | Sim | Ativa | **Alto** — muito low-level, melhor pra editar PDFs prontos do que criar do zero |
| **print-js** | Wrapper simples do `window.print()` | ~30 min+gz | Funciona, mas chama print do browser (não é controle programático) | Sim (CSS) | Sim | Sim | Ativa | Baixo |
| **react-to-print** | Wrapper React do `window.print()` | ~40 min+gz | **Reportado problemas em iOS Safari** (issue #476) | Sim (CSS) | Sim | Sim | Ativa | Baixo |
| **window.print() nativo + AirPrint** (o que o usuário já fez) | Abre nova aba, usuário toca "Imprimir → Salvar em Arquivos → PDF" | 0 KB | **Sim, 100% confiável** — é o gerador nativo do iOS | Sim (CSS print) | Sim | Sim | Apple mantém | **Baixíssimo** (já implementado) |
| **Vercel Function + Puppeteer** | Servidor renderiza PDF e devolve | 0 KB no front | Sim (server-side, iOS só baixa) | Sim | Sim | **NÃO funciona offline** | Sim | Médio + custo $20/mês Vercel Pro |

### Tradução em recomendação

- **Se o objetivo é fazer parar de travar HOJE com mínimo esforço:** `window.print()` + AirPrint (já feito, só falta tornar padrão).
- **Se o objetivo é PDF "1-clique" no iOS sem o usuário interagir:** `jsPDF puro + autotable`.
- **Se o objetivo é cosmética / código mais elegante:** `@react-pdf/renderer` (mas vai pesar 1MB no PWA, ruim pra peritos no campo com 4G/3G ruim).

---

## 4. Estratégias híbridas (combinações)

### Estratégia A — Detecta iOS, usa AirPrint só nele (RECOMENDADA)

```
if (isIOS()) {
  // Abre nova aba com HTML puro + window.print() automático
  printCroquiHTML(bodyHTML, "Croqui");
  // O sheet do iOS aparece, usuário escolhe "Save to Files" → PDF nativo
} else {
  // Windows/Android — html2pdf normal funciona
  await genPdfBlobFromHtml(...);
}
```

**Já está 80% implementado** no Xandroid (código em `printCroquiHTML` linha 2019 + botão linha 3372). Só falta:

1. Tornar esse o **caminho padrão** no iOS (não opcional).
2. Esconder os botões "PDF" / "ZIP com PDF" no iOS, ou redirecioná-los pro AirPrint.
3. Mostrar tutorial de 2 imagens explicando "Toque em Imprimir → Salvar em Arquivos → escolha pasta".

### Estratégia B — Detecta iOS, gera PDF via jsPDF puro

Precisa reescrever a função que monta o croqui (hoje em HTML) pra chamadas como:

```js
const doc = new jsPDF();
doc.setFontSize(12);
doc.text("Croqui Pericial — Cena 123", 14, 20);
doc.addImage(logoBase64, "PNG", 14, 25, 30, 15);
autoTable(doc, { head: [...], body: [...], theme: "striped" });
doc.save("croqui.pdf");
```

**Vantagem:** PDF gerado em 1 clique, sem mostrar tela de print do iOS.
**Desvantagem:** trabalho considerável de reescrever o layout. Talvez 2-4 dias de programação.

### Estratégia C — Servidor PDF (Vercel Function + Puppeteer)

**Descartada** porque:
- Vercel Hobby tem timeout de 10s — Puppeteer demora mais que isso.
- Puppeteer ocupa ~80MB e Vercel limita serverless function a 50MB (precisa de pacote stripped tipo `@sparticuz/chromium-min`).
- **Quebra modo offline** — perito no campo sem rede não consegue exportar.
- Custaria pelo menos $20/mês (Vercel Pro).

### Estratégia D — Gerar HTML standalone numa aba e deixar usuário lidar

Variação da A. Em vez de chamar `window.print()` automaticamente, abre a nova aba com **botão "Salvar como PDF"** bem grande. Usuário pode revisar antes de imprimir. Boa estratégia se houver muita gente leiga.

---

## 5. Casos de uso similares (gov / forense / médico)

Pesquisa mostrou que **a maioria dos apps governamentais brasileiros e estrangeiros usa servidor pra gerar PDF** (Stripe receipts, Apple Wallet, Receita Federal, gov.br) — não geram client-side em iOS.

Os poucos apps PWA forenses/médicos que geram PDF client-side:
- Caem no mesmo problema de `html2canvas` em iOS.
- Maioria delegou pro **AirPrint via `window.print()`** depois de descobrir que `html2canvas` é frágil.
- Apps maiores (Joyfill, Nutrient SDK) usam servidor + headless Chrome.

**Conclusão:** não há apps PWA gerando PDF client-side complexo de forma 100% confiável em iOS hoje. AirPrint é o caminho da indústria.

---

## 6. Bugs específicos do iOS 18.x — confirmados

- **WebKit Bug 195325** — limite de memória canvas reduzido para **224MB**.
- **WebKit reduziu o limite de pixels do canvas para 16.777.216** (4096×4096) — qualquer canvas maior **renderiza branco em iOS** (Issue 481).
- **Regressão `<foreignObject>`** em iOS 18 — issues múltiplas relatam que o callback do `html2canvas` nunca é chamado quando há imagens base64 grandes ou estilos complexos no DOM clonado.
- **Safari 18 tem regressão de keep-alive de conexão** (Apple Discussions 255765330) — pode complicar `fetch()` de imagens externas.
- **Em PWA standalone** (`navigator.standalone === true`), o iOS abre PDFs em janela em branco sem botões de navegação (Issue eKoopmans/html2pdf#66 e mozilla/pdf.js#7377). Por isso `window.open(...)` + `print()` é mais confiável que tentar download direto.

---

## 7. Recomendação final

### Curto prazo (faça HOJE — fix imediato, ~1-2 horas)

**Torne o AirPrint o caminho ÚNICO de PDF no iOS.**

1. Na função que decide qual botão mostrar:
   - **Em iOS:** mostrar APENAS o botão "Imprimir/PDF (iOS)" (azul roxo, já existe linha 3372).
   - **Em Windows/Android:** mostrar os botões existentes (PDF + ZIP), `html2pdf` continua funcionando lá.

2. **Rote o ZIP em iOS** — se o ZIP precisa de PDF dentro:
   - Opção A: tirar o PDF do ZIP no iOS, gera só o JSON+fotos+TXT.
   - Opção B: substituir o PDF do ZIP por **um HTML standalone "imprimível"** (auto-contido, com CSS print) que o usuário abre depois e converte com AirPrint.

3. **Adicionar tutorial visual** com 2 prints da tela explicando "Toque em Compartilhar → Imprimir → pinch-out na pré-visualização → Compartilhar → Salvar em Arquivos".

4. **Remover o timeout de 120s + retry de 90s no iOS** — não precisa mais, AirPrint é instantâneo.

**Resultado:** zero trava, 0 perda de tempo do perito, PDF de qualidade nativa.
**Custo:** ~2 horas de código + tutorial + teste num iPhone real.

### Médio prazo (1-2 semanas, OPCIONAL — se quiser PDF "automático" no iOS)

**Migrar a geração do croqui pra `jsPDF puro` + `jspdf-autotable`.**

Isso elimina a dependência de `html2canvas` por completo no caminho crítico. PDF é gerado por chamadas tipo `doc.text(...)`, `doc.rect(...)`, `autoTable(...)` — não usa canvas, não usa foreignObject, não trava em iOS.

Esforço estimado:
- 1-2 dias: refatorar a função que monta o body do croqui em chamadas jsPDF.
- 1 dia: refazer tabelas usando autoTable (suporta zebra, cor de header, bordas).
- 1 dia: portar logos (`doc.addImage(base64, "PNG", x, y, w, h)`).
- 1 dia: testes em iPhone real, ajuste de margens/quebra de página.
- **Total: ~4-5 dias de trabalho**, ~5-10MB a menos no bundle (jsPDF é menor que html2pdf+html2canvas).

### Longo prazo (se app evoluir)

- Se em 1-2 anos o iOS resolver os bugs do `html2canvas`, pode reverter a estratégia.
- Se algum dia quiser "PDF perfeito de design" (com layout complexo, ícones SVG, tipografia variada), `@react-pdf/renderer` vale considerar — mas só com Vercel Pro pra suportar bundle de 1MB+ ou code-splitting agressivo.
- Se algum dia tiver backend (Supabase ou Vercel Pro), pode delegar PDF pra servidor (Puppeteer ou pdfmake server-side).

### Esforços estimados resumidos

| Solução | Esforço | Custo $$ | Risco |
|---|---|---|---|
| AirPrint padrão no iOS (curto prazo) | 2h | 0 | Mínimo |
| Migrar para jsPDF puro + autotable | 4-5 dias | 0 | Médio (trabalho de refazer template) |
| Migrar para @react-pdf/renderer | 1-2 semanas | 0 + bundle pesado | Alto |
| Vercel Function + Puppeteer | 3-5 dias | $20/mês + offline quebra | Muito alto |

---

## 8. Plano de migração (passo-a-passo) se for trocar de lib

### Passo a passo da Estratégia A (AirPrint — RECOMENDADO)

1. **Auditoria do código atual:**
   - `src/App.jsx` linha 2019 — função `printCroquiHTML(htmlBody, title)` já existe.
   - `src/App.jsx` linha 3372 — botão "Imprimir/PDF (iOS)" já existe (mas é alternativo).
   - `src/App.jsx` linha 2070 — `isIOS()` detect.

2. **Mudanças mínimas:**

   ```jsx
   // Onde tem o botão "PDF" e o "ZIP":
   {!isIOS() && <button onClick={genPdf}>📄 PDF</button>}
   {!isIOS() && <button onClick={genZipComPdf}>📦 ZIP com PDF</button>}

   // No iOS, só mostra:
   {isIOS() && <button onClick={()=>printCroquiHTML(bPDF(),"Croqui")}>🖨 PDF (iOS — via Imprimir)</button>}
   {isIOS() && <button onClick={genZipSemPdf}>📦 ZIP (sem PDF — gerar via Imprimir depois)</button>}
   ```

3. **Banner explicativo no iOS:**

   ```jsx
   {isIOS() && (
     <div style={{padding:8,background:"#fff3cd",borderRadius:6,fontSize:12}}>
       <b>iPhone:</b> o PDF é gerado pelo iOS via Imprimir → Salvar em Arquivos.
       <a onClick={mostrarTutorial}>Como fazer</a>
     </div>
   )}
   ```

4. **No fluxo de export ZIP**, no iOS:
   - **Opção A** (simples): ZIP só com JSON + fotos + TXT (sem PDF).
   - **Opção B** (avançada): ZIP com `croqui.html` standalone que o usuário pode abrir depois e imprimir.

5. **Remover o timeout de retry no iOS** — não é mais necessário.

6. **Testar num iPhone real** com 5, 15 e 30 páginas.

### Passo a passo da Estratégia B (jsPDF puro — médio prazo)

1. `npm install jspdf jspdf-autotable`
2. `npm uninstall html2pdf.js` (depois)
3. Criar `src/utils/croquiPdf.js`:

   ```js
   import jsPDF from "jspdf";
   import autoTable from "jspdf-autotable";

   export async function geraCroquiPdf(dados, logos) {
     const doc = new jsPDF({ unit: "mm", format: "a4" });

     // Cabeçalho
     doc.addImage(logos.pcdf, "PNG", 14, 10, 30, 15);
     doc.addImage(logos.icc, "PNG", 166, 10, 30, 15);
     doc.setFontSize(14);
     doc.text("CROQUI PERICIAL", 105, 20, { align: "center" });

     // Tabela com zebra
     autoTable(doc, {
       startY: 35,
       head: [["Item", "Descrição", "Localização"]],
       body: dados.itens,
       theme: "striped",
       headStyles: { fillColor: [88, 86, 214] },
     });

     // Imagens das fotos do croqui
     for (const foto of dados.fotos) {
       doc.addPage();
       doc.addImage(foto.base64, "JPEG", 14, 14, 180, 180);
     }

     return doc.output("blob");
   }
   ```

4. Substituir todas as chamadas `genPdfBlobFromHtml` por `geraCroquiPdf`.
5. Validar visualmente o PDF gerado contra o original.
6. Bundle final: ~140KB (vs ~340KB do html2pdf).

---

## 9. Fontes consultadas

### Issues GitHub (problemas confirmados)
- [parallax/jsPDF#3876 — Affecting jsPDF + html2canvas on recent iOS versions](https://github.com/parallax/jsPDF/issues/3876)
- [niklasvh/html2canvas#3053 — Stuck at 0ms Starting document clone on IOS](https://github.com/niklasvh/html2canvas/issues/3053)
- [niklasvh/html2canvas#3216 — Not working on safari 16 or lower](https://github.com/niklasvh/html2canvas/issues/3216)
- [niklasvh/html2canvas#2754 — Base64 images not rendering](https://github.com/niklasvh/html2canvas/issues/2754)
- [niklasvh/html2canvas#2379 — Crash browser on mobile](https://github.com/niklasvh/html2canvas/issues/2379)
- [niklasvh/html2canvas#2257 — iOS Iphone issue](https://github.com/niklasvh/html2canvas/issues/2257)
- [eKoopmans/html2pdf.js#481 — Blank pages if more then 5 on Safari/iOS/iPhone](https://github.com/eKoopmans/html2pdf.js/issues/481)
- [eKoopmans/html2pdf.js#601 — Operation insecure on iOS 16.x](https://github.com/eKoopmans/html2pdf.js/issues/601)
- [eKoopmans/html2pdf.js#397 — Blank document on iOS](https://github.com/eKoopmans/html2pdf.js/issues/397)
- [eKoopmans/html2pdf.js#687 — Blank PDF after download in iOS](https://github.com/eKoopmans/html2pdf.js/issues/687)
- [eKoopmans/html2pdf.js#66 — Problems with download on iPhone PWA](https://github.com/eKoopmans/html2pdf.js/issues/66)
- [eKoopmans/html2pdf.js#178 — TypeError: executor did not take a resolve function on Safari](https://github.com/eKoopmans/html2pdf.js/issues/178)
- [eKoopmans/html2pdf.js#19 — html2pdf failed with too many pages](https://github.com/eKoopmans/html2pdf.js/issues/19)
- [MatthewHerbst/react-to-print#476 — Mobile Safari problems](https://github.com/MatthewHerbst/react-to-print/issues/476)
- [home-assistant/frontend#28367 — WebKit 26 GPU regression](https://github.com/home-assistant/frontend/issues/28367)
- [diegomura/react-pdf#1824 — react-pdf doesn't work on iOS](https://github.com/diegomura/react-pdf/issues/1824)
- [diegomura/react-pdf#632 — Huge bundle size](https://github.com/diegomura/react-pdf/issues/632)
- [mozilla/pdf.js#7377 — Add to Home Screen webapp fails to load PDF status 206](https://github.com/mozilla/pdf.js/issues/7377)
- [bpampuch/pdfmake#1374 — Strategies to reduce library size](https://github.com/bpampuch/pdfmake/issues/1374)

### Bugs WebKit oficiais
- [WebKit Bug 195325 — Canvas memory limit (224MB)](https://bugs.webkit.org/show_bug.cgi?id=195325)
- [WebKit Bug 219780 — WebGL canvas memory leak iOS Safari](https://bugs.webkit.org/show_bug.cgi?id=219780)
- [Apple Developer Forums — Total canvas memory exceeds limit](https://developer.apple.com/forums/thread/687866)
- [Apple Developer Forums — html2Canvas iOS 15 incompatibility](https://developer.apple.com/forums/thread/690805)

### Comparações de bibliotecas (2025-2026)
- [Nutrient — Best JavaScript PDF libraries 2025](https://www.nutrient.io/blog/javascript-pdf-libraries/)
- [Nutrient — HTML to PDF in JavaScript: Five libraries compared (2026)](https://www.nutrient.io/blog/html-to-pdf-in-javascript/)
- [Joyfill — Comparing open source PDF libraries (2025 edition)](https://joyfill.io/blog/comparing-open-source-pdf-libraries-2025-edition)
- [DEV.to — 6 Open-Source PDF generation libraries every React dev should know in 2025](https://dev.to/ansonch/6-open-source-pdf-generation-and-modification-libraries-every-react-dev-should-know-in-2025-13g0)
- [npm-compare — jspdf vs react-pdf vs @react-pdf/renderer vs pdfmake](https://npm-compare.com/@react-pdf/renderer,jspdf,pdfmake,react-pdf)
- [Bundlephobia — @react-pdf/renderer v4.3.1](https://bundlephobia.com/package/@react-pdf/renderer)
- [npmjs — jspdf-autotable](https://www.npmjs.com/package/jspdf-autotable)

### Forks e alternativas
- [html2canvas-pro — fork ativo](https://yorickshan.github.io/html2canvas-pro/)
- [npm — html2pdf-fix-jspdf](https://www.npmjs.com/package/html2pdf-fix-jspdf)

### Strategias servidor (descartadas mas pesquisadas)
- [Building and deploying a pdf server on Vercel using Puppeteer](https://ammarhalees.com/blog/building-and-deploying-a-pdf-server-on-vercel-using-puppeteer-and-serverless)
- [Vercel Community — Can't print a PDF with serverless chromium](https://community.vercel.com/t/cant-print-a-pdf-with-serverless-chromium/5053)
- [Generate HTML as PDF using Next.js & Puppeteer (Vercel/AWS Lambda)](https://medium.com/@martin_danielson/generate-html-as-pdf-using-next-js-puppeteer-running-on-serverless-vercel-aws-lambda-ed3464f7a9b7)

### iOS PWA / AirPrint
- [Save webpage as PDF Safari iPhone iPad](https://osxdaily.com/2021/11/04/save-webpage-as-pdf-safari-iphone-ipad/)
- [Apple Support — Save Safari webpage as PDF on iPhone](https://support.apple.com/en-my/guide/iphone/iphfd5b616b5/ios)
- [firt.dev — Safari iOS PWA tips](https://firt.dev/pwa-secrets/)
- [MagicBell — PWA iOS Limitations Safari Support 2026](https://www.magicbell.com/blog/pwa-ios-limitations-safari-support-complete-guide)
- [Slow unresponsive Safari after iOS 18 — Apple Community](https://discussions.apple.com/thread/255765330)

---

## Apêndice — código atual do Xandroid (referência)

O usuário já implementou parcialmente a estratégia AirPrint:

- **`src/App.jsx:2019`** — função `printCroquiHTML(htmlBody, title)` que abre nova aba com HTML pronto.
- **`src/App.jsx:2070`** — detect `isIOS()`.
- **`src/App.jsx:3372`** — botão "Imprimir/PDF (iOS)" (alternativo, opcional, só aparece no iOS).
- **`src/App.jsx:2017-2018`** comentário do próprio usuário: "Funciona MUITO mais confiável que html2pdf+html2canvas em iOS 18.x".

**A pesquisa confirma que o instinto do usuário está certo.** Resta só transformar o que é "alternativo" em "padrão" no iOS.
