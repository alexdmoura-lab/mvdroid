# 📦 MVDroiD v208 — Pacote ENXUTO (só o que mudou)

Esse zip tem **só os arquivos que precisam ser atualizados**. Quase tudo do seu repo continua igual e não precisa mexer.

---

## 🎯 O que tem aqui (9 arquivos)

### 3 arquivos PARA SUBSTITUIR no GitHub
- `src/App.jsx` — código principal v208
- `index.html` — **FIX da tela azul**
- `public/sw.js` — Service Worker v2 (força limpar cache antigo)

### 5 arquivos NOVOS (não existem no repo ainda) + 1 substituir
- `public/icon.svg` — ícone vetorial
- `public/icon-180.png` — Apple Touch Icon
- `public/icon-192.png` — PWA pequeno
- `public/icon-512.png` — PWA grande
- `public/manifest.webmanifest` — manifest PWA

---

## 🚀 Como subir (GitHub web — sem instalar nada)

### Passo 1: Substituir `index.html` (raiz do repo)
1. Vai em https://github.com/alexdmoura-lab/mvdroid
2. Clica em `index.html` na lista de arquivos
3. Clica no ícone do **lápis** (✏️) no canto superior direito
4. **Apaga TODO o conteúdo** (Ctrl+A → Delete)
5. **Cola o conteúdo** do `index.html` deste zip
6. Lá embaixo: **"Commit changes"** → mensagem: `v208: fix tela azul + manifest`

### Passo 2: Substituir `src/App.jsx`
1. Entra na pasta `src/`
2. Clica em `App.jsx`
3. Clica no lápis ✏️
4. **Apaga TODO o conteúdo**
5. **Cola o conteúdo** do `App.jsx` deste zip
6. Commit changes

⚠️ **Atenção:** se o GitHub web der erro `RESULT_CODE_KILLED_BAD_MESSAGE`, isso acontece porque o `App.jsx` é grande (~620 KB). Nesse caso usa GitHub Desktop (instruções no fim).

### Passo 3: Substituir `public/sw.js`
1. Entra na pasta `public/`
2. Clica em `sw.js` (se já existir) → lápis → apaga conteúdo → cola novo
3. Se NÃO existir: botão **"Add file"** → "Create new file" → nome `public/sw.js` → cola conteúdo
4. Commit

### Passo 4: Subir os 5 arquivos novos
1. Entra na pasta `public/`
2. Clica em **"Add file"** → **"Upload files"**
3. Arrasta os 5 arquivos de uma vez:
   - `icon.svg`
   - `icon-180.png`
   - `icon-192.png`
   - `icon-512.png`
   - `manifest.webmanifest`
4. Commit changes

**Pronto!** Vercel detecta os commits e faz build em ~30s.

---

## 🚀 Alternativa: GitHub Desktop (1 commit só)

Se quiser fazer tudo num commit único:

1. https://desktop.github.com (gratuito)
2. Clone `mvdroid` pra uma pasta no PC
3. Abre essa pasta no Finder/Explorer
4. **Descompacta este zip**
5. Arrasta o conteúdo da pasta `mvdroid-minimo/` pra dentro do repo clonado:
   - `src/App.jsx` → substitui o existente
   - `index.html` → substitui o existente
   - `public/` → arquivos vão se juntar com os existentes (substituindo `sw.js` se houver)
6. GitHub Desktop detecta as mudanças
7. Commit message: `v208: fix tela azul + manifest novos icones`
8. **Commit to main** → **Push origin**

---

## ⚠️ DEPOIS do deploy: limpar cache do Safari

Esse passo é **fundamental** porque o Service Worker antigo (v1) pode segurar a versão velha do `index.html`:

1. **Configurações iPhone** → **Safari** → **Avançado** → **Dados de Sites**
2. Procura **"vercel.app"** → desliza pra esquerda → **Apagar**
3. Abre `mvdroid.vercel.app` no Safari de novo

Se você adicionou o ícone PWA na tela inicial, **apaga o ícone primeiro** (segura → Remover) e depois adiciona de novo.

---

## ✅ Como testar

1. Recarrega a página
2. Loga
3. Toca em **"Próximo"** repetidamente — não pode mais aparecer tela azul presa
4. Faz **swipe lateral** em várias abas — também não pode travar
5. Volta com **"Anterior"** — deve fluir normal
