# 📦 MVDroiD v206 — Pacote completo (commit único)

Esse zip contém **TODOS os arquivos** que devem estar no repositório.
Você sobe tudo de uma vez e faz **um único commit**.

---

## ✅ O que esta versão traz

### 🔥 v206 (esta versão) — FIX CRÍTICO
- **Bug da tela azul ao trocar aba corrigido**
- Causa: animações CSS começavam em `opacity:0` — se travasse, ficava invisível
- Fix: animações sem `opacity:0` (só translate). Conteúdo sempre visível.
- Service Worker v2 — invalida cache antigo automaticamente

### v205
- Manifest, favicon e ícones como arquivos físicos (não mais runtime)
- Botão "Compartilhar DOCX" via WhatsApp/AirDrop/e-mail nativo
- Slots com miniatura visual do croqui salvo + indicador de fotos

### v204
- Topbar respeita notch/Dynamic Island do iPhone PWA
- Sem flash branco ao abrir pelo atalho (PWA standalone)
- Body com fundo escuro fixo já no HTML inicial

### v203
- Layout Solicitação responsivo (Android-friendly)
- Ano em select de 2 dígitos (24, 25, 26...)
- Dark mode com mais contraste nos labels
- Ícone forca/enforcamento — laçada redonda com nó

### v202
- Microfone APENAS em textareas (campos longos)
- Botão de mic redesenhado (40×40 área, ícone visual menor)
- Labels "Observações" identificam de qual seção pertencem
- Imagens anatômicas como arquivos físicos (não mais base64)
- Service Worker registrado (PWA offline)
- **Shim do `window.storage`** — corrige bug do backup sumindo

---

## 📂 Estrutura completa

```
mvdroid/
├── .github/
│   └── workflows/
│       └── validate.yml              ← validador automático GitHub Actions
│
├── public/
│   ├── icon.svg                      ← ícone vetorial principal
│   ├── icon-180.png                  ← Apple Touch Icon (iOS)
│   ├── icon-192.png                  ← PWA Android
│   ├── icon-512.png                  ← PWA Android grande + maskable
│   ├── manifest.webmanifest          ← manifest PWA
│   ├── og-preview.png                ← preview WhatsApp/Telegram
│   ├── sw.js                         ← Service Worker v2 (offline)
│   └── img/
│       └── anatomy/                  ← 8 silhuetas anatômicas
│           ├── body-front.jpg
│           ├── body-back.jpg
│           ├── body-left.jpg
│           ├── body-right.jpg
│           ├── head-front.jpg
│           ├── head-back.jpg
│           ├── head-left.jpg
│           └── head-right.jpg
│
├── src/
│   ├── App.jsx                       ← código principal (619 KB)
│   └── main.jsx                      ← entry point (com shim storage + SW)
│
├── index.html                        ← HTML raiz (com OG tags + flash fix)
├── netlify.toml                      ← config Netlify (legado, não estorva)
├── CHANGELOG.md                      ← histórico completo
└── README.md                         ← documentação do projeto
```

> **Não incluído** porque você já tem e não muda:
> - `package.json`
> - `package-lock.json`
> - `vite.config.js`

---

## 🚦 Como subir tudo de uma vez (commit único)

### Estratégia 1: GitHub Desktop (RECOMENDADO)

1. Instala https://desktop.github.com (gratuito)
2. Login com sua conta
3. Clica em **"Clone repository"** → seleciona `mvdroid` → escolhe pasta no PC
4. Abre essa pasta no Finder/Explorer
5. **Apaga tudo de dentro** (mantém só `.git`, `package.json`, `package-lock.json`, `vite.config.js`)
6. **Descompacta este zip** e arrasta a pasta inteira pra dentro do repo clonado
7. Volta no GitHub Desktop — ele detecta todas as mudanças
8. Em **"Summary"** escreve: `v206: fix tela azul + melhorias PWA + compartilhar DOCX + miniaturas`
9. **"Commit to main"**
10. **"Push origin"**

Em ~30s o Vercel detecta e faz build.

### Estratégia 2: GitHub web (mais lenta mas funciona)

1. Vai no repositório no GitHub
2. **Apaga TUDO em `src/`**:
   - Entra em `src/`
   - Clica em `App.jsx` → ícone lixeira → commit
   - Clica em `main.jsx` → ícone lixeira → commit
3. **Apaga `index.html`** da raiz (lixeira → commit)
4. **Apaga arquivos antigos em `public/`** se houver (`manifest.json`, ícones antigos)
5. Descompacta o zip no PC
6. Faz upload dos arquivos pasta por pasta:
   - `src/` → upload de `App.jsx` e `main.jsx`
   - `public/` → upload de tudo
   - `public/img/anatomy/` → upload das 8 imagens
   - `.github/workflows/` → criar arquivo (já existe)
   - Raiz → upload de `index.html`, `CHANGELOG.md`, `README.md`
7. Cada upload é um commit (vai dar uns 5-6 commits)

A Estratégia 1 deixa tudo num commit só, como você pediu.

---

## ⚠️ IMPORTANTE: limpar cache do navegador depois

Como o Service Worker mudou de versão (v1 → v2), o iPhone pode ficar segurando a versão antiga. Pra forçar atualização:

### Se você usa pelo Safari (sem ícone na tela inicial)
1. Abre o app
2. Puxa pra baixo pra recarregar (algumas vezes)
3. Ou: aperta a URL na barra → recarregar

### Se você adicionou na tela inicial (PWA standalone)
1. **Apaga o ícone do MVDroiD da tela inicial** (segura → "Remover app")
2. Abre `mvdroid.vercel.app` no Safari
3. Compartilhar → **"Adicionar à Tela de Início"** (nome de novo)
4. Abre pelo novo ícone

Isso garante que o Service Worker novo assume.

---

## ✅ Como confirmar que funcionou

Depois do Vercel buildar (~30s):

### Teste 1 — Tela azul não aparece mais
- Abre o app
- Logue
- Toca em "Próximo" várias vezes seguidas (rápido)
- Faça swipe lateral em várias abas
- ✅ Conteúdo sempre aparece — nunca tela azul vazia

### Teste 2 — Compartilhar DOCX
- Aba Exportar
- Botão verde **"Compartilhar DOCX"** ao lado de "Croqui DOCX"
- Sheet de compartilhamento abre → escolhe WhatsApp
- ✅ Arquivo `.docx` anexado pronto pra mandar

### Teste 3 — Slots com miniatura
- Faz um croqui qualquer (desenha algo)
- Espera 4 segundos (auto-save)
- Vai na aba Exportar → seção "Slots"
- ✅ Mostra miniatura do desenho, não só texto

### Teste 4 — Preview no WhatsApp
- Cola `https://mvdroid.vercel.app/?v=2` no chat
- ✅ Aparece imagem da caveira + título

### Teste 5 — Backup persiste
- Preenche um campo, fecha o app, reabre
- ✅ Matrícula auto-preenchida + dados preservados

---

## 🆘 Se algo der errado

### Build falhou no Vercel
1. Painel Vercel → Deployments → clica no que falhou
2. Procura erro em vermelho
3. Me manda screenshot

### App não atualiza no celular
1. Apaga o ícone da tela inicial
2. Abre no Safari, compartilhar → adicionar à tela
3. Abre pelo novo ícone

### Tela azul ainda aparece em alguma aba
- Limpa cache do Safari (Configurações → Safari → Limpar Histórico)
- Reabre o app

### Backup antigo sumiu
- Backups feitos ANTES da v202 (com shim) nunca foram salvos de verdade
- A partir da v202 tudo persiste no localStorage

---

## 📝 Próximas melhorias possíveis (próxima sessão)

Se quiser continuar:

1. **Branch protection no GitHub** — impede deploy quebrado em produção
2. **Modo "trabalho rápido"** — esconde abas vazias
3. **Auto-lock por inatividade** — segurança forense
4. **Atalhos de teclado** (iPad com teclado físico)
5. **Backup JSON criptografado** — segurança extra dos dados

Mas honestamente, o app já está num ponto muito bom. Talvez o próximo passo seja **usar em alguns plantões reais** e voltar com lista de incômodos práticos.
