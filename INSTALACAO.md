# 📦 Instruções de instalação no GitHub

Este zip contém **3 arquivos** + **1 pasta** que devem ir na **raiz** do
repositório `mvdroid` no GitHub.

> O `App.jsx` (que vai em `src/`) está separado — você substitui ele
> manualmente como já fez antes.

---

## ✅ Estrutura final no GitHub (depois de subir tudo)

```
mvdroid/
├── src/
│   ├── App.jsx                       ← (substituir separadamente)
│   └── main.jsx                      (não mexer)
│
├── public/                           ← 🆕 NOVA pasta deste zip
│   └── img/
│       └── anatomy/
│           ├── body-front.jpg
│           ├── body-back.jpg
│           ├── body-left.jpg
│           ├── body-right.jpg
│           ├── head-front.jpg
│           ├── head-back.jpg
│           ├── head-left.jpg
│           └── head-right.jpg
│
├── index.html                        (não mexer)
├── package.json                      (não mexer)
├── vite.config.js                    (não mexer)
│
├── netlify.toml                      ← 🆕 deste zip
├── README.md                         ← 🔄 substitui o existente
└── CHANGELOG.md                      ← 🆕 deste zip
```

---

## 🚀 Como subir pelo GitHub web

### Passo 1 — Subir os 3 arquivos da raiz

1. Abre o repositório `mvdroid` no GitHub
2. Botão **"Add file" → "Upload files"** (canto superior direito)
3. Arrasta os 3 arquivos: `netlify.toml`, `README.md`, `CHANGELOG.md`
4. **Commit message:** `chore: configuração Netlify + docs`
5. **Commit changes**

> Se o GitHub avisar que `README.md` já existe, ele substitui (é o que queremos).

### Passo 2 — Subir a pasta `public/`

GitHub web não aceita arrastar pasta inteira. Tem 2 jeitos:

**Jeito A — pasta direto (mais rápido se funcionar no seu navegador):**
- "Add file → Upload files"
- **Arrasta a pasta `public/` inteira** — o Chrome no desktop preserva a estrutura
- Commit

**Jeito B — criar pasta primeiro (sempre funciona):**
1. "Add file → **Create new file**"
2. No nome do arquivo digita: `public/img/anatomy/.gitkeep`
   (a barra `/` cria as pastas automaticamente)
3. Deixa o conteúdo vazio
4. Commit
5. Agora navega para `public/img/anatomy/` no GitHub
6. "Add file → Upload files" lá dentro
7. Arrasta os 8 JPGs
8. Commit

### Passo 3 — Substituir o `src/App.jsx` (separadamente)

Como você já fez antes:
- Entra em `src/App.jsx`
- Lápis (Edit) → apaga tudo → cola o novo conteúdo do `App.jsx`
- Commit

---

## ⏱️ Depois de subir tudo

1. Abre o painel do **Netlify**
2. Aba **Deploys** — vai aparecer "Building" → "Published" (~1-2 min)
3. **Testa o app** no celular:
   - Aba Cadáver → Lesões: silhuetas devem aparecer normalmente
   - Aba Local → tira uma foto: câmera deve abrir
   - GPS deve funcionar
   - Geração de DOCX (laudo) deve continuar OK

Se algo der errado, é só me chamar e a gente reverte.

---

## ❓ Se o Netlify falhar no build

Pode acontecer se você esqueceu algum arquivo. No painel do Netlify, o log
mostra exatamente o que está faltando. Os mais comuns:

- **"Module not found: /img/anatomy/body-front.jpg"** → falta subir os JPGs
- **"Cannot find module"** → algum arquivo não foi commitado corretamente

Em qualquer caso, antes de tentar consertar, **clica em "Rollback to previous
deploy"** no Netlify pra voltar a versão anterior funcionando. Aí investiga
com calma.
