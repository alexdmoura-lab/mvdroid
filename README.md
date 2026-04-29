# Xandroid

App PWA mobile-first para perícia de local de crime — usado pela equipe da
**SCPe / PCDF** (Seção de Crimes Contra a Pessoa, Polícia Civil do Distrito Federal).

> ⚠️ Este é um projeto pessoal do Perito Criminal **Alexandre Moura**.
> Não é software oficial da PCDF.

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
5. **Fotos com geo-tag** — câmera nativa + GPS automático.
6. **Exportação** — Croqui PDF, Relatório de Recolhimento de Vestígios (RRV),
   DOCX editável, backup JSON, ZIP completo com tudo.
7. **PWA offline** — funciona sem rede após primeira carga (bibliotecas
   cacheadas em localStorage 30 dias).

---

## Tecnologia

- **React 18** carregado direto no browser via `<script>` (sem npm/build)
- **JSX** transpilado em runtime pelo Babel standalone
- **lucide-react** para ícones
- **html2pdf** + **JSZip** carregados via CDN sob demanda
- **Web Speech API** (ditado por voz pt-BR)
- **localStorage** + heurística de espaço (4.8 MB no Claude artifacts,
  40 MB hospedado externamente)

---

## Estrutura do projeto

```
.
├── index.html          ← Página principal (carrega React + Babel + App.jsx)
├── App.jsx             ← Código da aplicação (~3000 linhas, JSX)
├── netlify.toml        ← Configuração do Netlify (cache, segurança, redirects)
├── manifest.json       ← Manifest PWA (instalável "Adicionar à tela")
├── CHANGELOG.md        ← Histórico de versões (v115 → atual)
├── README.md           ← Este arquivo
└── img/                ← (futuro) Logos institucionais e imagens anatômicas
```

> **Nota sobre tamanho do `App.jsx`:** o arquivo tem ~700 KB. A maior parte
> (~150 KB) são strings base64 de imagens institucionais embutidas. Pode ser
> extraído para `/img/*.jpg` no futuro — ver `CHANGELOG.md` para discussão.

---

## Como fazer deploy (Netlify)

### Workflow recomendado

1. **Edite o `App.jsx`** pelo GitHub web (botão lápis) ou
   substitua o arquivo no repositório.
2. **Commit** com mensagem clara
   (ex: "v202: corrige scroll do microfone").
3. **Netlify detecta** o commit e gera um *Deploy Preview* automaticamente
   (URL temporária do tipo `deploy-preview-X--SEU-SITE.netlify.app`).
4. **Teste no celular** abrindo a URL do preview.
5. Se estiver OK, **promove pra produção** no painel do Netlify.

### Workflow simples (cuidado)

Para mudanças triviais (correção de typo, ajuste de cor):

1. Edite o `App.jsx` direto na branch `main` no GitHub.
2. Netlify faz deploy direto na produção.
3. **Atenção:** sem testes, qualquer erro de sintaxe deixa o app fora do ar
   até você corrigir. Use só para mudanças que você tem 100% de certeza.

---

## Branch protection (recomendado)

Para evitar deploy quebrado em produção:

1. No GitHub: **Settings → Branches → Add rule**
2. Branch name pattern: `main`
3. Marque: **"Require pull request reviews before merging"**
4. Crie uma branch `dev`. Edite sempre lá primeiro.
5. Quando estiver OK, abre pull request para `main`.

Netlify gera preview de cada PR automaticamente.

---

## Como rodar localmente (opcional)

Não precisa — o app funciona abrindo o `index.html` direto no navegador.
Se quiser servir local pra testar PWA:

```bash
# Python (já vem no Mac/Linux)
python3 -m http.server 8000

# Ou Node
npx serve .
```

Abre `http://localhost:8000` no celular (na mesma rede Wi-Fi)
ou no navegador desktop.

---

## Backup e privacidade

- **Dados ficam no celular** (localStorage). Nada é enviado pra servidor externo.
- **Backup JSON** pela aba Exportar. Faça antes de limpar storage.
- **Apagar tudo:** aba Exportar → Limpeza de Memória → confirma.
- **Câmera/GPS/microfone** pedem permissão na primeira vez. Pode revogar
  nas configurações do navegador.

---

## Convenções de versionamento

- `vNNN` (ex: v201, v202)
- Versão atualiza no `APP_VERSION` no topo do `App.jsx`
- Mudanças significativas vão pro `CHANGELOG.md`

---

## Licença

Uso pessoal e profissional do autor. Distribuição ou modificação por
terceiros requer autorização.

---

**Contato:** Alexandre Moura — Perito Criminal PCDF/SCPe
