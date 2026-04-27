# 🎯 MVDroiD v211 — Melhorias e correções

## ✅ O que mudou (4 itens)

### 1. Scroll do mouse / Android funciona agora
- Removido `overscroll-behavior: none` global do `index.html` que bloqueava scroll do mouse e do Android Chrome
- iPhone continua funcionando normal

### 2. Layout dos vestígios reorganizado
- **Descrição** ocupa toda a largura
- **Suporte / Local** vai logo abaixo da Descrição, com o mesmo tamanho
- **Recolhido | Destino | Placa** agora ficam lado a lado (3 colunas)
- Especialmente melhor visualizado em celular

### 3. Dropdown de placa simplificado
- Era: `Placa 01`, `Placa 02`, `Placa 03`...
- Agora: `01`, `02`, `03`...
- Aplica em Vestígios e em Papiloscopia

### 4. "— Selecione —" removido dos selects
- Visual mais limpo
- Antes ficava cortado em telas pequenas (`— Sele...`)
- Mantido apenas em selects que precisam de contexto educativo (ex: "— Selecione ou digite —" pra avisar que pode digitar manualmente)

---

## 📦 Apenas 2 arquivos

```
mvdroid-v211/
├── INSTALACAO.md
├── src/App.jsx          ← SUBSTITUIR
└── index.html           ← SUBSTITUIR
```

## 🚦 Como subir

### GitHub Web (mais rápido)

1. **Substituir `index.html`** (raiz):
   - Lápis ✏️ → apaga tudo → cola novo → Commit

2. **Substituir `src/App.jsx`**:
   - `src/` → lápis ✏️ → apaga tudo → cola novo → Commit

Vercel deploya em ~30s.

### GitHub Desktop (1 commit)

1. Substituir `App.jsx` e `index.html` na pasta local
2. Commit: `v211: scroll do mouse, layout vestígios, placa numérica, selects limpos`
3. Push

---

## ✅ Verificações que fiz no código

Conferi que essas exportações continuam funcionando corretamente:

- ✅ **DOCX**: Vestígios usam `supPlaca(suporte, placa)` que combina os dois campos no laudo
- ✅ **Croqui**: campos `desc`, `suporte`, `placa`, `destino`, `recolhido` continuam sendo passados
- ✅ **ZIP completo**: todas as fotos + DOCX + PDF entram no zip
- ✅ **Fotos em alta resolução**: o botão "📷 ✨" (laranja) na barra superior ativa o modo HQ por sessão (2400px / 92% qualidade JPEG vs 1200px / 78% padrão). Lembrando que a HQ só vale pra **fotos tiradas depois de ativar**.

---

## ⚠️ Sobre alta resolução de fotos

Existe um botão **📷 ✨** (laranja quando ativo) na barra superior. Ele alterna entre:
- **Padrão**: 1200px largura, 78% qualidade — ~150KB por foto
- **Alta**: 2400px largura, 92% qualidade — ~600KB por foto

A **alta resolução é resetada a cada sessão** (não persiste). Isso é proposital — pra evitar que o usuário esqueça ligado e estoure a memória do navegador. Se quiser que persista entre sessões, posso fazer essa mudança numa próxima.

Para fotos boas no laudo final, **ative antes de tirar fotos importantes** (ex: lesões, vestígios pequenos). Pra fotos panorâmicas e gerais, padrão é suficiente.
