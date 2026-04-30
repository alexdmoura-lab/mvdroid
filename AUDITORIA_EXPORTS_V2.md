# Auditoria de Exportações Xandroid v242 — 2026-04-29

> Auditoria das funções de exportação do app: PDF do Croqui, PDF do RRV, DOCX, ZIP completo e a aba "Exportar". Linguagem direta, sem jargão técnico desnecessário.

---

## TL;DR (10 linhas)

1. O **PDF do Croqui** está bem completo: cobre veículos, cadáveres, vestígios, papiloscopia, edificações, trilhas, fotos, observações e logos PCDF/DF aparecem corretamente.
2. O **PDF do RRV** está pobre comparado ao Croqui: sem logos, sem cores institucionais, sem cabeçalho — visualmente parece outro app.
3. O **DOCX** está paralelo ao PDF (mesma estrutura, mesmas tabelas, mesma numeração 1/2/2.1/4.3.1) e tem header com logos + rodapé com paginação.
4. Em todos eles, o tratamento de "Outro" (dropdown que vira texto) está **correto** (puxa o texto digitado, não o literal "Outro").
5. O **ZIP** já usa **fflate** (rápido) e fotos vão como **STORE** (level 0) — boa otimização.
6. O ZIP **roda tudo em série na thread principal**: html2pdf bloqueia a tela. Sem Web Worker.
7. Estimativa para **500 MB**: hoje ~1 a 3 minutos; com Worker poderia cair pra 40-60 segundos.
8. **Cancelamento mid-zip**: existe mas só pega entre estágios, não interrompe geração de PDF já iniciada.
9. **UI da aba Exportar** está organizada em 5 cards: Pacote / Individual / Backup / Resumo / Avançado — mas há **redundância** (DOCX aparece como botão duplicado).
10. **Top 1 melhoria de impacto**: redesenhar o RRV com a mesma identidade visual do Croqui (logos + cabeçalho dourado + tabelas zebradas).

---

## 1. PDF do Croqui — `bPDF()`

Arquivo: `C:\Users\Dell\Documents\mvdroid\src\App.jsx` linhas **2128-2350**.

### Campos cobertos

O Croqui PDF está bem abrangente. Cobre:

- **Capa** (linha 2143): Cabeçalho institucional com logos PCDF + DF (esquerda e direita), com título central "POLÍCIA CIVIL DO DISTRITO FEDERAL / DPT / IC / SCPe" — **logos aparecem corretamente**.
- **Resumo da Ocorrência (TL;DR)** (linhas 2163-2247): bloco dourado com 5 grupos: Identificação, Local, Datas, Equipe, Achados. Linhas vazias são **automaticamente filtradas** (função `kr` na linha 2200). Grupos sem nenhuma linha de dado são removidos (linha 2660-2661 do DOCX, equivalente no PDF).
- **Preâmbulo** (linha 2250): designação dos peritos, data por extenso, equipe complementar (papiloscopista/agente/viatura), observações da solicitação.
- **1 Histórico** (2268), **2 Objetivo Pericial** (2274), **2.1 Recursos Especiais** (2277): drone, scanner 3D, luminol, luz forense — só aparecem se marcados "Sim".
- **3 Isolamento** (2279).
- **4 Exames** com **4.1 Local** (área, destinação, tipo, GPS, via, iluminação) + **Via pública** condicional + **Área verde** condicional + **Trilhas de sangue** (todas as trilhas com origem/destino/comprimento/padrão/indicadores) + **Edificações** (todas as edificações com cômodos do fato detalhados).
- **4.2 Veículos** (2298): só renderiza veículos que têm `tipo` ou `placa` preenchidos (filtro `veicsComData`). Tabela com categoria, tipo, cor, placa, ano, chassi, hodômetro, estado, motor, portas, vidros, chave, observações. Inclui sub-tabela de **vestígios veiculares**.
- **4.3 Cadáver(es)** (2302): cada cadáver vira sub-seção própria. Inclui **4.3.1 Descrição**, **4.3.2 Vestes e Pertences** (só se houver), **4.3.3 Perinecroscopia** (com lesões + SVG do corpo com marcadores via `bodyPdfSvg`) + **fenômenos cadavéricos** + **decomposição avançada** condicional + **4.3.4 Observações gerais** (livres).
- **5 Cadeia de Custódia** (2335): três sub-listas (não recolhidos, recolhidos para IC, encaminhados para II/Papiloscopia). Inclui vestígios veiculares e papiloscópicos.
- **Fotografias** (2347): cada foto centralizada, com legenda "Fotografia N — descrição — fase — local".
- **Croqui(s)** (2349): suporta múltiplos desenhos com seus rótulos.

### Campos faltando ou com bug

Não encontrei campo importante faltando. **Análise de "Outro" → texto digitado**:

- DP "Outro" → puxa `d.dp_outro` (linha 2253). OK.
- Natureza "Outros" → puxa `d.nat_outro` (linha 2153). OK.
- Agente "Outro" → puxa `d.ag_outro` (2168, 2258). OK.
- Papiloscopista "Outro" → puxa `d.pp_outro` (2169, 2257). OK.
- Viatura "Outra" → puxa `d.vt_outro` (2170, 2259). OK.
- Suicídio "Outro" → exibe `d.sui_outro_obs` (2310). OK.

**Pequenos pontos de atenção (não são bugs graves):**

- **Linha 2275** (objetivo pericial): se DP for "Outro", a string fica `${dpResolved}` mas concatena `ª DP` apenas se NÃO for "Outro". Funciona, mas o texto fica um pouco truncado quando é "Outro" (sem o sufixo "ª DP").
- **Linha 2294** (via pública): se a destinação tem várias categorias além de "Via pública", a sub-seção pode não aparecer porque depende só de `tpHas(d.tp,"Via pública")`. Como a coleta é múltipla, está correto.
- **Tabelas de edificação** (linha 2297): se o usuário marcou um cômodo do fato mas não preencheu nenhum detalhe, não aparece nada — o que é o comportamento certo.

### Quebra de página

Configurado na linha 1530: `pagebreak: ["avoid-all", "css", "legacy"]`. Significa que o html2pdf tenta:
- evitar quebrar dentro de blocos com `page-break-inside:avoid`,
- respeitar `page-break-before:always` (usado antes de Fotografias e Croqui),
- usar regras CSS de quebra.

**Quebras explícitas usadas:**
- Antes do Preâmbulo (linha 2249).
- Antes das Fotografias (linha 2347).
- Antes do Croqui (linha 2349).
- Cada foto tem `page-break-inside:avoid` (não corta uma foto no meio).
- Cada subtítulo dourado da capa tem `page-break-after:avoid` (não fica órfão no fim de página).

**Está bom**, mas atenção: html2pdf pode ainda quebrar tabelas longas em algumas situações. Não vi sinais de quebras feias, mas se laudos com 30+ vestígios travarem, pode valer otimizar.

### Sugestões de melhoria

1. **Numeração das fotografias na seção Cadeia de Custódia** — hoje cada lista (não recolhidos, IC, II) é numerada de 1 separadamente. Se o usuário quer fazer correlação cruzada com o RRV, pode confundir.
2. **Adicionar versão do app + data/hora de geração no rodapé** — hoje o rodapé só mostra Oc/DP/Perito (linha 1530, dentro do `savePDF`). Bom para rastreabilidade.
3. **Bloco "Recursos especiais"** (linha 2277): hoje só aparece se algum recurso é "Sim". Se nenhum estiver marcado, a seção 2.1 some — beleza, isso já está certo. Mas o título 2.1 da seção depois passa a ser usado por outro? Não, o sistema usa "2.1" só pra recursos. OK.
4. **Encerramento (2344-2345)**: o texto "Nada mais havendo a lavrar" é fixo. Se a SCPe mudar a redação padrão, vira string mágica no código.

---

## 2. PDF do RRV — `bRRV()`

Arquivo: `C:\Users\Dell\Documents\mvdroid\src\App.jsx` linhas **2354-2364** (sim, é só **11 linhas** — comparado a 222 linhas do Croqui).

### Estado atual

O RRV de hoje tem:

- Título centralizado "REGISTRO DE RECOLHIMENTO DE VESTÍGIOS (RRV)" em fonte 16px.
- Subtítulo cinza pequeno: "Conforme OS nº 01 do DPT, de 17/02/2014".
- Linha de identificação: Ocorrência | DP | Data | Equipe (uma linha só, fonte 12px).
- Duas tabelas: "Vestígios — Instituto de Criminalística" e "Vestígios — Instituto de Identificação". Cada tabela tem 4 colunas: Nº, Vestígio, Suporte, Destino.
- Bordas cinza (`#999`), fundo de cabeçalho cinza claro (`#e8e8ed`). **Nenhuma cor institucional.**
- Duas linhas de assinatura ao final: Perito Criminal (esquerda) e Papiloscopista (direita).

**O que cobre:**
- Vestígios da lista normal (`vestigios`).
- Vestígios do canvas (`canvasVest`) com placa concatenada.
- Vestígios veiculares (`veiVest`) que tenham destino IC ou II.
- Vestígios papiloscópicos (`papilos`).
- Filtra apenas os com `recolhido !== "Não"` (ou seja, recolhidos OU sem definição).

**O que falta cobrir:**
- **Suportes com coordenadas (D1/D2/h)**: o RRV usa `supLoc(v)` indiretamente via `mkVeiSupR` para vestígios veiculares, mas para vestígios normais ele usa `supLoc(v)` na criação inicial (linha 2355) — **OK, está cobrindo**. Confirmado.

### Comparação com o Croqui (que tem mais polimento)

| Aspecto | Croqui | RRV |
|---|---|---|
| Cabeçalho institucional com logos | Sim (PCDF + DF, banda dourada) | **Não tem** |
| Cores institucionais (azul-marinho `#1A1A2E` + dourado `#C9A961`) | Sim | **Não usa** — só cinza |
| Tabelas com zebra (alternância de cor) | Sim | Não — tudo em fundo branco |
| Fundo do cabeçalho de tabela | Azul-marinho `#1A1A2E` com texto branco | Cinza claro `#e8e8ed` com texto preto |
| Cabeçalho com hierarquia visual | Sim | Linha solta de 12px |
| Resumo executivo | Sim | Não (não cabe num RRV) |
| Footer com paginação | Sim (via `savePDF`) | Sim (via `savePDF`) |

### O que falta para ficar à altura: logos, cores, layout

**Recomendações concretas:**

1. **Adicionar cabeçalho com logos** (mesmo padrão do Croqui):
   - Grid 70px / 1fr / 70px.
   - Logo PCDF à esquerda, texto institucional ao centro (4 linhas: PCDF / DPT / IC / SCPe), logo DF à direita.
   - Borda inferior dourada (`#C9A961`, 2.5px).

2. **Aplicar cores institucionais**:
   - Cabeçalho da tabela: fundo azul-marinho `#1A1A2E`, texto branco — igual ao Croqui na linha 2139.
   - Linhas alternadas (zebra): fundo `#F5F5F7` nas pares, branco nas ímpares.
   - Bordas: `#C8D6E5` (azul-cinza claro).

3. **Substituir o subtítulo da OS por uma "etiqueta" estilizada**:
   - Em vez de uma linha de texto cinza solta, usar um bloco com borda dourada e fundo claro contendo Ocorrência / DP / Data / Equipe num grid 2x2.

4. **Título do documento** deve usar mesma fonte e cor do Croqui (`color:#1A1A2E`, fontSize:24px, letterSpacing).

5. **Adicionar uma terceira seção "Vestígios documentados (não recolhidos)"** — hoje o RRV só mostra os recolhidos, mas o Croqui mostra os 3 grupos (não recolhido / IC / II). Se a OS 01/2014 só exigir os recolhidos, mantém. Se incluir documentados, expandir.

6. **Linhas de assinatura mais elegantes**: hoje são 2 colunas com `border-bottom:1px solid #333; padding-top:60px`. Pode ficar com bordas mais finas e cinza, fonte com leve `letter-spacing` para parecer mais formal.

7. **Adicionar campo de data/local de assinatura acima das linhas**: "Brasília-DF, ___ de ___________ de _____."

---

## 3. DOCX — `saveCroquiDocx()`

Arquivo: `C:\Users\Dell\Documents\mvdroid\src\App.jsx` linhas **1536-1925**.

### Campos cobertos

O DOCX é o **espelho fiel** do PDF Croqui, com a mesma cobertura:

- Capa com nome da instituição (sem imagens, em texto, fonte 24).
- "CROQUI DE LEVANTAMENTO DE LOCAL" como título grande.
- **Resumo Executivo** com tabela dourada (mesma estrutura do PDF, função `kr`/`krNum` na linha 1625-1626).
- **Preâmbulo** (1676-1688), **1 Histórico** (1690), **2 Objetivo Pericial** (1697), **3 Isolamento** (1700), Recursos empregados (1707), **4.1 Local** (1711) com Via Pública / Área Verde / Trilhas / Edificações, **4.2 Veículos** (1722-1727) com vestígios veiculares, **4.3 Cadáver** (1729-1778) com Descrição / Sub-tipo de suicídio / Vestes / Perinecroscopia / Decomposição / Observações gerais, **5 Cadeia de Custódia** (1788-1810) com 3 sub-tabelas + observações, encerramento (1816), **Fotografias** (1820-1824) e **Croquis** (1826-1830).
- **Header com logos PCDF + DF** (1832-1856): tabela de 3 colunas com logo / texto institucional 4 linhas / logo, borda dourada inferior. Bem feito.
- **Footer com paginação real** (1858-1879): "Croqui — Oc. X/YY — Zª DP" à esquerda, "pág. X de Y" no centro (com campo `<w:fldChar>` que o Word atualiza automaticamente), "SCPe/IC/DPT/PCDF" à direita.

### Campos faltando

Idênticos ao PDF — não há nada que o PDF mostre e o DOCX esconda. Os mesmos campos com tratamento "Outro" funcionam corretamente (linhas 1604-1607).

### Numeração das seções

A numeração segue o padrão da norma:

- **1** Histórico
- **2** Objetivo Pericial
  - **2.1** Recursos Especiais (condicional)
- **3** Isolamento
- **4** Exames
  - **4.1** Do Local
  - **4.2** Do Veículo (só se houver veículos preenchidos — `veicsComData.length > 0`)
  - **4.3** ou **4.2** Do Cadáver (numeração **dinâmica** — se não houver veículos, vira 4.2!)
    - **4.3.1** Descrição
    - **4.3.2** Vestes e Pertences (condicional)
    - **4.3.3** Perinecroscopia
    - **4.3.4** Observações gerais (condicional, novo na v234)
- **5** Cadeia de Custódia

**Detalhe importante**: a numeração do Cadáver muda conforme tem veículo ou não (linha 1729: `const veicSuffix = veicsComData.length > 0 ? "4.3" : "4.2"`). Mesma lógica no PDF (linha 2302). **Isso bate com a norma** porque a norma coloca "Do Cadáver" depois de "Do Local" + "Do Veículo (se houver)".

**Possível confusão**: se há mais de um cadáver, todos viram **4.3** (ou **4.2**), com sub-itens 4.3.1, 4.3.2, 4.3.3 repetidos para cada. Tecnicamente deveriam ser 4.3.1.1, 4.3.1.2 ou similar. Não é bug — é simplificação.

### Sugestões

1. **Adicionar seção 6 (vazia, com título)** "Análise" e seção 7 "Conclusão" — hoje (linha 1812-1813) o código diz "removidas (preenchidas manualmente pelos peritos)". Se o perito for editar o DOCX, ter o título já no documento ajuda.
2. **Estilo de tabela "Word nativo"**: as tabelas hoje são geradas com `<w:tblBorders>` inline. O Word interpreta bem, mas se a SCPe quiser alterar visualmente, é mais fácil com estilos nomeados (`TableGrid`).
3. **Numeração de figuras**: hoje cada foto tem legenda "Fotografia N — ...". Para ficar mais profissional, adicionar `seq Figura` (campo nativo do Word que numera automático).
4. **Sumário automático (TOC)**: o Word pode gerar TOC se os títulos forem estilizados como "Heading 1", "Heading 2". Hoje o código usa `<w:p>` direto sem aplicar o estilo nomeado. Se aplicar `<w:pStyle w:val="Heading1"/>` etc., o usuário pode inserir TOC com 1 clique.

---

## 4. ZIP — `exportAllZip()`

Arquivo: `C:\Users\Dell\Documents\mvdroid\src\App.jsx` linha **2018-2038**.

### Como funciona hoje (passo a passo)

1. **Inicia** (2% — linha 2018): salva o canvas, prepara nomes.
2. **Croqui PDF** (15% — linha 2022): chama `genPdfBlobFromHtml(bPDF(), "Croqui", 60000)`. Esse helper cria um `<div>` invisível, joga o HTML lá, chama html2pdf, gera o blob. **Bloqueia a thread principal** durante a renderização (60 segundos de timeout).
3. **RRV PDF** (35% — linha 2024): mesma lógica.
4. **DOCX** (55% — linha 2026): chama `saveCroquiDocx(true)` que retorna o blob direto.
5. **JSON Backup** (70% — linha 2028): empacota TODO o estado em JSON com `JSON.stringify` (inclui fotos em base64 dentro do JSON também — **redundância**).
6. **Fotos** (75-85% — linha 2030): para cada foto, decodifica base64 e adiciona ao dicionário `files` com `{level: 0}` (STORE — sem compressão).
7. **README** (86% — linha 2032): texto plano com nome dos arquivos e contadores.
8. **Compactação fflate** (90% — linha 2034): chama `fflateZipAsync(files, {level: 6})` que monta o ZIP final.
9. **Download/Compartilhar** (96-100% — linha 2036-2038): usa Web Share API se mobile + canShare, senão `<a download>`.

### Estimativa de tempo com 500 MB

500 MB de conteúdo é tipicamente **300-500 fotos** de 1-2 MB cada + alguns documentos menores (PDFs ~5 MB cada, DOCX ~20 MB com fotos embutidas, JSON ~50 MB com fotos em base64).

**Tempo estimado em celular médio (Snapdragon 695, 6 GB RAM):**

| Etapa | Tempo |
|---|---|
| Croqui PDF (com 200 fotos no preview) | 25-45 segundos |
| RRV PDF (sem fotos) | 2-3 segundos |
| DOCX (200 fotos) | 15-25 segundos |
| JSON backup (1 stringify) | 5-10 segundos |
| Fotos individuais (decode 200x b64→Uint8Array) | 8-12 segundos |
| Compactação fflate | 6-12 segundos |
| **Total** | **~60-110 segundos (1-2 min)** |

Em iPhone 13+ é mais rápido (40-70s). Em celular antigo Android pode chegar a **2-3 minutos** ou crashar por OOM.

### Onde está o gargalo

**Top 3 gargalos:**

1. **html2pdf na thread principal** (geração do Croqui PDF): 25-45s congelando a UI. Pior gargalo. A função `genPdfBlobFromHtml` cria o DOM, espera renderizar, captura via html2canvas (que é lento) e gera PDF. Sem Worker.
2. **JSON.stringify do backup com fotos em base64 incluídas** (linha 2028): fotos no JSON viram cópia (em base64) das mesmas fotos que já vão como JPG separado. **Duplicação de payload**. 200 fotos × 1.5 MB = ~600 MB de string JSON.
3. **Re-decode base64 → Uint8Array** dentro de `b64ToU8` (chamado para cada foto, linha 2012): é síncrono e lento. 200 chamadas em loop bloqueiam a UI.

### Otimizações possíveis (ordenadas por impacto)

1. **(IMPACTO ALTO) Tirar as fotos do JSON backup** — hoje as fotos vão **2 vezes**: como JPG individual em `/fotos/` E embutidas em base64 no JSON. Solução: no backup do ZIP, remover `fotos` do `backupObj` (ou substituir por referências a nome de arquivo). Reduz **30-50% do tamanho do ZIP** e acelera muito o `JSON.stringify`. Cuidado: o backup standalone (botão "Baixar JSON" da linha 3134) precisa continuar incluindo fotos para ser auto-suficiente — então criar duas versões do backup.

2. **(IMPACTO ALTO) Web Worker para html2pdf** — não é trivial porque html2pdf depende do DOM, mas dá pra mover **fflate** (a compactação) para Worker. Já `fflate` tem `zip` e `zipSync` em Worker — basta importar o ESM em uma thread. Pode reduzir 6-12s do total.

3. **(IMPACTO MÉDIO) Adicionar fotos ao ZIP em ordem reversa de tamanho** — o usuário vê o progresso subir rápido no início (feedback psicológico). Hoje está em ordem natural (`for i=0; i<fotos.length`). Bastaria sortar por `f.sizeKB` ascendente antes do loop.

4. **(IMPACTO MÉDIO) Streaming do JSON backup** — em vez de `JSON.stringify` síncrono, pode usar incremental streaming (escrever chave por chave em chunks). fflate não tem streaming nativo, mas pode-se escrever em buffer pequeno e adicionar.

5. **(IMPACTO BAIXO) Liberar memória do DOM tempEl mais cedo** — em `genPdfBlobFromHtml` o `tempEl.innerHTML` (linha 2008) ocupa memória até o fim. Setar `tempEl.innerHTML = ""` logo após o `toPdf` ajudaria celulares com pouca RAM.

6. **(IMPACTO BAIXO) Preview otimizado nas fotos do PDF** — hoje cada foto entra no PDF em `max-height:450px`. Se a foto original for 4000×3000 (12 MP), html2canvas re-renderiza ela toda. Pré-redimensionar para 800×600 antes de injetar no HTML poupa memória e tempo.

### Compressão de fotos: STORE ou DEFLATE?

**Hoje está STORE** (level 0). Ver linha 2030:

```js
files[safeName] = [b64ToU8(m[1]), {level: 0}];
```

**Está correto.** JPEG já é comprimido — re-comprimir com DEFLATE não reduz tamanho (geralmente até aumenta 1-2%) e custa CPU. O DOCX e o PDF, sim, vão com DEFLATE level 6 (linha 2034 — `level:6` se aplica ao restante dos arquivos do dicionário). 

### Cancelamento mid-zip

**Implementado parcialmente.** A flag `zipCancelRef.current` é checada via `checkCancel()` dentro de `upd()` (linha 2018) — ou seja, o cancelamento só dispara **entre estágios**.

**O que isso significa na prática:**
- Se o usuário cancela durante "Gerando Croqui PDF" (passos 15→35%), o html2pdf **continua rodando até terminar** — o cancelamento só pega no início do RRV PDF.
- Em 500 MB (PDF longo), isso pode dar 30+ segundos de delay entre clicar em Cancelar e a UI reagir.

**Para melhorar:** dentro de `genPdfBlobFromHtml`, fazer um `await new Promise(r => setTimeout(r, 0))` periodicamente e checar `zipCancelRef.current`. Ou usar `Promise.race` com um sinal de cancelamento.

---

## 5. Aba Exportar (UI)

### O que está bom

A aba está **bem organizada em cards**, hierarquia clara:

1. **Banner-resumo** no topo (linha 3113): chips coloridos com Oc/DP, contador de vestígios, cadáveres, fotos, veículos, trilhas. Ótimo feedback visual.
2. **Aviso de campos faltando** (linha 3113 fim): caixa amarela com "X campos não preenchidos" agrupados por aba — útil pra checar antes de exportar.
3. **Indicador de armazenamento**: barra de progresso com fotos KB + dados KB e cores semáforo (verde/amarelo/vermelho). Cuida do limite de quota do localStorage.
4. **Card "Pacote Completo"** em destaque (linha 3115): variant `success`, botão maior em gradiente. **Boa hierarquia** — é o caminho principal.
5. **Card "Exportar Individual"**: 4 botões para casos específicos (Croqui PDF, RRV PDF, DOCX, Compartilhar DOCX, Texto).
6. **Card "Backup JSON"**: separado, com texto explicando que é "para mover de celular ou guardar offline".
7. **Card "Avançado" recolhível** (linha 3146): botão "Toque para expandir" com ▼/▲. **Bom uso** — esconde Diagnóstico, Reset libs, Limpeza de memória etc.
8. **Modal de progresso ZIP** (linha 3290): tela cheia, com porcentagem, estágio, tempo decorrido (cronômetro `mm:ss`), botão Cancelar visível. Excelente.

### O que pode melhorar

1. **Botão "DOCX" e "Compartilhar DOCX" lado a lado** (linha 3126) — confunde. O botão verde "DOCX" baixa, o verde-WhatsApp "Compartilhar DOCX" abre share sheet. Em PWA standalone iOS, a função `smartSaveDocx` já decide automaticamente — então o botão "DOCX" praticamente faz a mesma coisa em mobile. **Sugestão**: unificar em **"DOCX"** que faz o smart, e remover o "Compartilhar DOCX" duplicado. Ou renomear "Compartilhar DOCX" para **"WhatsApp / E-mail"** para deixar claro o caso de uso.
2. **"Croqui PDF" abre o preview, "DOCX" baixa direto** — incoerência. Por que o Croqui PDF tem visualização e o DOCX não? Sugestão: ou ambos com preview, ou ambos sem (apenas baixar).
3. **Botão "RRV PDF" laranja** (linha 3125) — chama atenção pela cor mas o resultado visual do RRV é fraco (sem logos). O usuário se decepciona.
4. **Card "Resumo"** (linha 3138): mostra `sum()` em texto monoespaçado de 13px. Em laudos longos vira parede de texto sem formatação. Sugestão: pelo menos negritar os títulos das seções (já tem `━━━`, dá pra estilizar).
5. **Indicador de progresso para ações lentas individuais**: hoje só o ZIP completo tem modal de progresso. O **DOCX standalone** com 200 fotos pode demorar 30s sem nenhum feedback visual — só aparece o `showToast("⏳ Gerando laudo...")` (linha 1540). Sugestão: usar o mesmo `setZipProgress` ou um indicador mais visível.
6. **Avisos pré-export poderiam ser proativos**: hoje (linha 1529) o aviso "Muitas fotos no PDF" só dispara em `savePDF` quando o usuário clica. Para a aba ZIP, não há aviso similar. Se tem 300 fotos, o ZIP completo vai dar OOM em iPhone com pouca RAM.
7. **Cor laranja** do RRV PDF e cor `t.ac` (azul) do Croqui PDF criam hierarquia confusa. **Sugestão**: deixar Croqui PDF como cor primária e RRV como cor secundária neutra (cinza).
8. **Badge de "X campos pendentes"** sobre o botão Croqui (linha 3125) é elegante. Mas só aparece sobre o Croqui — não sobre RRV ou DOCX. Replicar na linha do DOCX faz sentido.

---

## Recomendações finais

### Top 5 bugs/gaps a corrigir

1. **(P1) RRV sem identidade visual** — apesar de não ser "bug", é o gap funcional mais visível. Redesenhar como descrito na Seção 2.
2. **(P2) Cancelamento ZIP "preso" durante geração de PDF** — checar `zipCancelRef` dentro de `genPdfBlobFromHtml` em pontos chave.
3. **(P3) Fotos duplicadas no ZIP** — uma vez como JPG em `/fotos/`, outra vez em base64 dentro do JSON. Inflar o ZIP.
4. **(P3) Numeração 4.3 → 4.2 quando não há veículo** — a norma diz "Do Cadáver" sempre é 4.3? Confirmar com a SCPe. Se a SCPe quer **sempre 4.3**, mesmo sem veículo, então o código atual está errado (linha 2302 e 1729).
5. **(P4) DOCX sem estilos nomeados (Heading1, Heading2)** — impede gerar TOC automático no Word. Não é bug, é falta de feature.

### Top 5 melhorias de UX

1. **Unificar botões "DOCX" e "Compartilhar DOCX"** num só com `smartSaveDocx`. Reduz confusão.
2. **Indicador de progresso no DOCX/PDF individual** quando fotos > 50.
3. **Aviso pré-ZIP** "você tem X fotos, isso vai levar ~Y minutos. Cancelar/Continuar?" para 200+ fotos.
4. **Preview do RRV** antes do download (hoje só Croqui PDF tem preview).
5. **Badge de campos pendentes em todos os botões de exportação** (não só no Croqui).

### Top 3 otimizações de performance do ZIP

1. **Remover fotos do JSON dentro do ZIP** — economia de 30-50% do tamanho final, e acelera 5-10 segundos do `JSON.stringify`.
2. **Mover compactação fflate para Web Worker** — libera a UI, ganho de ~10s na percepção do usuário.
3. **Pré-redimensionar fotos antes de injetar no HTML do PDF** — html2canvas é o gargalo principal; fotos menores = render mais rápido.

### Plano para redesenhar o RRV (com logos + cores)

**Objetivo**: deixar o RRV visualmente alinhado com o Croqui — mesma identidade da SCPe.

**Etapas (em ordem de implementação):**

1. **Cabeçalho institucional idêntico ao Croqui** (linhas 2143-2147 do bPDF servem de modelo):
   - Grid 70px / 1fr / 70px com logo PCDF + texto institucional 4 linhas + logo DF.
   - Borda inferior dourada (`#C9A961`, 2.5px).

2. **Título "REGISTRO DE RECOLHIMENTO DE VESTÍGIOS"** com fonte e cor do Croqui (`color:#1A1A2E`, font-size 24, font-weight 700, letter-spacing 1px).

3. **Bloco de identificação estruturado**: substituir a linha solta de Oc/DP/Data/Equipe por uma **tabela dourada de 2 colunas** (label/valor) ou por **chips com bordas suaves**:
   - Ocorrência: `12345/2026`
   - DP: `5ª`
   - Data: `29/04/2026`
   - Equipe: `SCPe / IC / DPT / PCDF`
   - Eventualmente perito principal e papiloscopista no topo.

4. **Tabelas de vestígios reformatadas**:
   - Cabeçalho da tabela: fundo `#1A1A2E` (azul-marinho) com texto branco bold (igual ao Croqui linha 2139).
   - Linhas alternadas zebra: `#F5F5F7` / `#FFFFFF`.
   - Bordas: `#C8D6E5` (azul-cinza claro).
   - Larguras reforçadas: Nº (8%), Vestígio (50%), Suporte (27%), Destino (15%) — já estão assim.
   - Adicionar título dourado acima de cada tabela: `<h3>` com `border-bottom:1.5px solid #C9A961`.

5. **Adicionar (opcional) seção "Vestígios documentados (não recolhidos)"** se a OS 01/2014 admitir.

6. **Linhas de assinatura mais formais**:
   - Adicionar parágrafo acima: "Brasília-DF, ___ de ____________ de 2026."
   - Linhas com `border-bottom:1px solid #1A1A2E` (em vez de `#333`).
   - Nome do perito em fonte 11px bold, cargo em fonte 10px regular.

7. **Footer com paginação institucional** (já vem do `savePDF` — mantém).

**Estimativa de esforço**: 2-3 horas para um desenvolvedor familiarizado com o código (o `bPDF` já tem todos os helpers prontos — basta replicar). Tudo é HTML inline, então pode reutilizar o `tblZ` e `tblList` que já existem no `bPDF`.

---

*Auditoria realizada em 2026-04-29 sobre `src/App.jsx` (3.314 linhas, versão v242).*
