# 🩸 MVDroiD v216 — Ícone novo + quebra inteligente + campos pendentes

> Continuação do v215. Inclui tudo das versões anteriores + 3 novidades.

## ✅ Mudanças nesta versão

### 🩸 Novo ícone PWA
- **Caveira centralizada** (sem deslocamento pra cima)
- **Sem o texto "MVDroiD"** dentro do ícone
- **Lágrima de sangue** saindo do olho direito (do observador): trilha vermelha + gota grande pendurada + gota satélite

### 📄 #2 — Quebra inteligente de página no Resumo da Ocorrência
- Linhas individuais agora **não quebram entre páginas** (`cantSplit`)
- Subtítulos (Identificação, Local, Datas, Equipe, Achados) **ficam grudados com pelo menos uma linha do grupo** (`keepNext`)
- Acabou o problema de "Fotografias: 0" sozinho na 2ª página

### 🎨 #3 — Campos "A esclarecer" em itálico cinza
- Campos pendentes (`A esclarecer`, `—`, `A ser informado`, `A ser descrito`) aparecem em **itálico, cor `#9A8B6A` (bege escuro)**
- Hierarquia visual mais clara: relance no laudo dá pra identificar o que ainda falta

Aplica em ambos PDF e DOCX.

---

## 📦 Arquivos pra subir

```
mvdroid-v216/
├── src/
│   ├── App.jsx          ← SUBSTITUIR (#2 + #3 + v216)
│   └── main.jsx         ← (igual v213/v214/v215)
└── public/
    ├── sw.js            ← SUBSTITUIR (CACHE_VERSION = mvdroid-v4)
    ├── icon.svg         ← SUBSTITUIR (novo design)
    ├── icon-180.png     ← SUBSTITUIR (novo design)
    ├── icon-192.png     ← SUBSTITUIR (novo design)
    └── icon-512.png     ← SUBSTITUIR (novo design)
```

⚠️ **IMPORTANTE**: Os 4 ícones e o `sw.js` precisam ser substituídos juntos. O Service Worker bumpou pra `mvdroid-v4` justamente pra invalidar os ícones antigos cacheados.

## 🚦 Como subir no GitHub

1. **Substituir `src/App.jsx`** — texto, edição inline
2. **Substituir `public/sw.js`** — texto, edição inline
3. **Substituir os 4 ícones** — PNG e SVG, vai precisar **deletar o arquivo antigo e fazer upload do novo** (GitHub web não tem botão "substituir" pra binários):
   - Vá em `public/icon-180.png` → ⋯ (botão direito) → Delete file → Commit
   - Volte em `public/` → Add file → Upload files → arrasta o `icon-180.png` novo
   - Repita pra `icon-192.png`, `icon-512.png` e `icon.svg`
4. Aguarde Vercel buildar (~30s)

## 📱 Pra ícone novo aparecer no iPhone

O iOS guarda o ícone em cache **separado** do app. Pra ver o novo:

1. **Apague o ícone PWA** atual da tela inicial (segura, opção "Apagar")
2. **Limpa cache do Safari**: Configurações → Safari → Avançado → Dados de sites → vercel.app → Apagar
3. Abre `https://mvdroid.vercel.app/?v=216` no Safari
4. Compartilhar → Adicionar à Tela de Início

A partir desse momento, atualizações futuras chegam sozinhas (auto-update do v213).

## ℹ️ Observação sobre o nome embaixo do ícone

O iPhone mostra um nome embaixo do ícone na tela inicial (vem do `short_name: "MVDroiD"` do manifest). Quando você toca em **"Adicionar à Tela de Início"**, o iOS deixa você **editar esse nome** antes de confirmar. Então pode chamar de "Forense", "Crime", "ML" ou o que quiser — só tirar o "MVDroiD" sugerido e digitar o novo.

Se quiser mudar o padrão sugerido, me avisa e eu atualizo o `manifest.webmanifest`.

---

## 🧪 Como testar

### Ícone
1. Reinstalar PWA (apagar e reinstalar conforme acima)
2. Olhar tela inicial: caveira centralizada, sem texto, com lágrima vermelha pingando

### Quebra inteligente (#2)
1. Preenche um laudo grande (com edificação, veículo, trilha, várias fotos)
2. Exporta DOCX/PDF
3. Vê o Resumo da Ocorrência: subtítulos sempre estão junto com pelo menos uma linha do grupo
4. Linhas não cortam pela metade entre páginas

### Pendentes (#3)
1. Deixa "Diagnóstico" e "Instrumento" em "A esclarecer"
2. Exporta DOCX/PDF
3. No Resumo: essas duas linhas aparecem em **itálico cinza claro** vs. o restante em preto normal
