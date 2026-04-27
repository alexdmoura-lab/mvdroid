# 🎯 MVDroiD v210 — FIX REAL DO BUG

## O bug verdadeiro

O console mostrou: `ReferenceError: ei is not defined at Array.map`.

**Causa:** Na linha 2553 do `App.jsx` tinha:
```jsx
label={`Observações — Edificação ${ei+1}`}  // ← "ei" não existe!
```

O `.map()` daquela seção declarava `(e,i)`, mas eu escrevi `ei` por engano (copiei sem querer da função de geração de DOCX que usa `forEach((e,ei)=>`).

**Quando acontecia:**
- Toda vez que a aba que tem Edificações renderizava → ReferenceError
- ErrorBoundary capturava o erro → tela ficava vazia
- Cor da "tela vazia" mudava conforme o background do CSS abaixo (azul/branco)
- Por isso minhas tentativas de "consertar a cor" não resolviam — eu estava tratando sintoma

## Apenas 2 arquivos pra subir

```
mvdroid-fix/
├── src/App.jsx       ← FIX do ei
└── index.html        ← versão estável (com loader azul, sem o bug do bg branco)
```

## Como subir

### Opção A: GitHub web (rápido, sem instalar nada)

1. **Substituir `src/App.jsx`**:
   - GitHub → entra em `src/` → clica em `App.jsx`
   - Lápis ✏️ → seleciona tudo (Ctrl+A) → apaga
   - Cola conteúdo do `App.jsx` deste zip
   - Commit changes

2. **Substituir `index.html`** (raiz):
   - Mesma coisa
   - Lápis ✏️ → apaga tudo → cola novo
   - Commit

### Opção B: GitHub Desktop (1 commit)

Já tem clone? Apenas:
1. Substitui `src/App.jsx` e `index.html` na pasta local
2. Commit message: `v210: fix ReferenceError ei na linha 2553`
3. Push

## ⚠️ DEPOIS do deploy

**Limpar cache do Safari:**
1. Configurações → Safari → Avançado → Dados de Sites
2. Procura "vercel.app" → Apagar
3. Reabre `mvdroid.vercel.app`

## ✅ Como confirmar

1. Abre `mvdroid.vercel.app/?v=210` (`?v=210` ignora cache)
2. Loga
3. Toca em "Próximo" várias vezes — **sem tela azul ou branca**
4. Faz swipe lateral em todas as abas
5. Especialmente: testa a aba **Local** com a seção **Edificações** (era onde o bug acontecia)

## 💭 Lição

Você tinha razão — eu deveria ter pedido o print do console na 1ª tentativa, não na 5ª. Sem o erro real, fiquei chutando "talvez é a animação", "talvez é o background"... O `ReferenceError` no console teria me apontado pra linha exata em segundos.

**Erro silencioso de variável não declarada é o bug clássico que minificação esconde.** Em desenvolvimento, esse erro mostra `ei is not defined`. Em produção minificada, vira `ei` mesmo (a minificação não renomeou porque é nome curto). Esses bugs **só aparecem em runtime** — passa no build, passa no lint padrão, e só explode quando aquela linha é executada.

Foi minha culpa não ter pedido visibilidade real antes. Obrigado por tua paciência.
