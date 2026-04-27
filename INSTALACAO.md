# 🛠️ MVDroiD v219 — Diagramação corrigida + Largura removida

> Continuação do v218.

## ✅ Mudanças nesta versão

### 📐 Diagramação dos cards de trilha (labels colados)
**Problema:** primeira letra dos labels (ORIGEM, COMPRIMENTO, PADRÃO, etc) ficava cortada/colada na borda esquerda no celular.

**Correções aplicadas:**
- Padding interno do card de cada trilha: `14` → `20`px
- Padding-left dos labels: `0` → `4`px
- Margin-bottom dos labels: `4` → `6`px
- Letter-spacing dos labels: `0.5` → `0.4` (mais respiro)
- **Safe-area-inset respeitado**: html/body agora tem `padding-left: env(safe-area-inset-left)` — corrige especificamente o problema em **iPhone modo paisagem com notch**, onde a borda esquerda da tela "comia" o conteúdo

### 🛤️ Via — tudo em uma linha em telas largas
**Antes:** Tipo (linha 1) + Iluminação/Ligada (linha 2)

**Agora:** Grid responsivo `repeat(auto-fit, minmax(180px, 1fr))`:
- **Desktop/Tablet** (largura ≥ 540px): tudo em **uma linha** (Tipo, Iluminação?, Ligada?)
- **Mobile estreito** (largura < 540px): adapta automaticamente em 1 ou 2 colunas

### ✂️ Removido: campo "Largura" das trilhas
Não era utilizado na perícia. Removido de:
- UI (não aparece mais no formulário)
- Schema (TRILHA_DEF, botão "+ Trilha", template `applyTemplateAndLocal`)
- Exportação DOCX
- Exportação PDF
- Backup texto plano

Nas trilhas agora aparece: Origem, Destino, Comprimento (m), GPS Início/Fim, Padrão, Continuidade, Direcionamento.

---

## 📦 Pacote completo

```
mvdroid-v219/
├── src/App.jsx          ← SUBSTITUIR (todas as correções)
├── src/main.jsx         ← (igual v213+)
└── public/
    ├── sw.js            ← (igual v216, cache v4)
    ├── icon.svg         ← (igual v216)
    ├── icon-180.png     ← (igual v216)
    ├── icon-192.png     ← (igual v216)
    └── icon-512.png     ← (igual v216)
```

## 🚦 Como subir

**Se já subiu v218 (ou qualquer versão >=v213)**: só `src/App.jsx` — auto-update entrega o resto.

**Se ainda na v212 do GitHub**: pacote completo + cache clear no iPhone (apagar atalho + Configurações Safari → vercel.app).

## 🧪 Como testar

1. **Trilhas**: Abre uma trilha, vê labels (ORIGEM, DESTINO, COMPRIMENTO, PADRÃO, etc). **Primeira letra deve estar visível**, não cortada.
2. **Via**: Em desktop/tablet (largura ≥ 540px), Tipo + Iluminação + Ligada devem aparecer **em uma única linha**.
3. **Trilha sem largura**: O campo "Largura" não deve mais aparecer (só Origem, Destino, Comprimento, GPS, etc).

