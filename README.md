# Xandroid

App PWA mobile-first para perícia de local de crime — usado pela equipe da
**SCPe / PCDF** (Seção de Crimes Contra a Pessoa, Polícia Civil do Distrito Federal).

> ⚠️ Este é um projeto pessoal do Perito Criminal **Alexandre Moura**.
> Não é software oficial da PCDF.

🌐 **Produção:** https://xandroid.vercel.app

---

## O que o app faz

1. **Documentação de cena** — registra solicitação, atendimento, equipe,
   isolamento, edificações, vestígios, papiloscopia.
2. **Croqui anatômico clicável** — marca lesões em corpo (frente/costas/lateral
   E/D) e cabeça, com regiões nominadas em linguagem técnica e leiga.
3. **Croqui veicular** — 75 regiões clicáveis (frente, traseira, laterais,
   teto, interior).
4. **Trilhas de sangue** — registro de origem→destino, padrão (gotejamento,
   escorrimento, arrastamento), continuidade e indicadores de dinâmica.
5. **Fotos com geo-tag** — câmera nativa + GPS automático + reverse geocoding
   pra preencher o endereço.
6. **Exportação** — Croqui PDF, Relatório de Recolhimento de Vestígios (RRV),
   DOCX editável, backup JSON, ZIP completo com tudo.
7. **PWA offline** — funciona sem rede após primeira carga (Service Worker
   com cache versionado).

---

## Tecnologia

- **React 18** + **Vite 5** (build com hash, code-splitting)
- **lucide-react** para ícones
- **html2pdf.js** para gerar PDFs no cliente
- **fflate** para gerar ZIP forense (mais rápido que JSZip)
- **docx** para gerar DOCX editáveis
- **IndexedDB** com shim e fallback para `localStorage` (em `src/main.jsx`)
- **Service Worker** com atualização silenciosa (espera idle 30s antes de aplicar)
- **Web Speech API** para ditado por voz pt-BR
- **navigator.storage.estimate()** para medir quota real do dispositivo

---

## Estrutura do projeto

```
.
├── index.html              ← Página principal (Vite injeta o bundle)
├── src/
│   ├── App.jsx             ← Aplicação completa (~3.275 linhas)
│   └── main.jsx            ← Bootstrap + IndexedDB shim + Service Worker
├── public/
│   ├── sw.js               ← Service Worker (cache xandroid-v9)
│   ├── manifest.webmanifest← Manifest PWA com shortcuts
│   ├── icon-*.png/svg      ← Ícones PWA
│   ├── og-preview.jpg      ← Banner WhatsApp/Twitter (1200×630)
│   └── img/anatomy/*.jpg   ← Imagens do croqui anatômico
├── vercel.json             ← Headers (CSP, HSTS, X-Frame-Options, etc.)
├── vite.config.js          ← Config do Vite (sourcemap off em prod)
├── package.json            ← html2pdf.js, fflate, lucide-react
├── CHANGELOG.md            ← Histórico de versões (v115 → atual)
└── README.md               ← Este arquivo
```

---

## Como fazer deploy (Vercel)

### Workflow recomendado

1. **Edite o código** localmente (ou pelo GitHub web).
2. **Commit & push** para uma branch (ex: `feature/xyz`) — gera **Preview
   Deployment** automático na Vercel com URL única do tipo
   `xandroid-git-feature-xyz.vercel.app`.
3. **Teste no celular** abrindo a URL do preview.
4. Se estiver OK, abre PR para `main` ou faz merge — vira **produção** em
   `xandroid.vercel.app` em ~2-3 minutos.

### Workflow simples (cuidado)

Para mudanças triviais (correção de typo, ajuste de cor), pode commitar
direto na `main`. A Vercel faz deploy direto na produção. **Atenção:** sem
testes, qualquer erro de sintaxe deixa o app fora do ar até você corrigir.

### Branch protection (recomendado)

1. No GitHub: **Settings → Branches → Add rule**
2. Branch name pattern: `main`
3. Marque: **"Require pull request reviews before merging"**
4. Crie uma branch `dev`. Edite sempre lá primeiro.
5. Quando estiver OK, abre pull request para `main`.

A Vercel gera preview de cada branch e cada PR automaticamente.

### Validação automática (GitHub Actions)

`.github/workflows/validate.yml` roda `npm ci` + `npm run build` em **toda
push** e em todo PR para `main`. Se o build falhar, o status do commit
mostra ❌ no GitHub — bloqueia merge antes de furar a Vercel.

---

## Como rodar localmente

```bash
npm install     # instala dependências (uma vez)
npm run dev     # sobe servidor Vite (geralmente em http://localhost:5173)
npm run build   # build de produção em dist/
npm run preview # serve o build de produção pra testar
```

Para testar no celular na mesma rede Wi-Fi, o Vite mostra a URL local
(`http://192.168.x.x:5173`). PWA e câmera **só funcionam em HTTPS** ou em
`localhost` — nas IPs da rede local não rola câmera no mobile, só no desktop.

---

## Backup e privacidade

- **Dados ficam no celular** (IndexedDB). Nada é enviado pra servidor externo.
- **Backup JSON** pela aba Exportar. Faça antes de limpar storage.
- **Apagar tudo:** aba Exportar → área **Avançado** → Limpeza de Memória → confirma.
- **Câmera/GPS/microfone** pedem permissão na primeira vez. Pode revogar
  nas configurações do navegador.
- **Reverse geocoding (endereço a partir do GPS)**: usa o serviço gratuito
  Nominatim do OpenStreetMap. Apenas latitude/longitude saem do dispositivo.

---

## Convenções de versionamento

- `vNNN` (ex: v239, v240)
- Versão atualiza em `APP_VERSION` no topo de `src/App.jsx`
- `CACHE_VERSION` em `public/sw.js` é bumpada junto (para que clientes
  antigos peguem o novo bundle)
- Mudanças significativas vão pro `CHANGELOG.md`

---

## Licença

Uso pessoal e profissional do autor. Distribuição ou modificação por
terceiros requer autorização.

---

**Contato:** Alexandre Moura — Perito Criminal PCDF/SCPe
