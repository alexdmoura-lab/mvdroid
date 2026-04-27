# 🎨 MVDroiD v214 — Setinhas dos selects + modal data/hora

> Continuação do v213. Inclui tudo do v213 + correções visuais.

## ✅ Mudanças nesta versão

### 🎯 Setinhas (▼) em todos os 25 selects
Muitos campos pareciam "campos comuns" porque a setinha sumiu em alguma versão anterior. Agora **todos os selects** mostram a setinha SVG (▼) à direita, indicando que são clicáveis.

**Afeta os campos:**
- **Equipe**: 2º Perito, Agente, Papiloscopista, Viatura
- **Solicitação**: DP, Ano, Natureza, Exame Externo, Drone, Scanner, Luminol, Luz forense, OIC
- **Local**: Tipo, Via, Iluminação, Ligada, Área, Destinação, Pavimento, Faixas, Mão, Canteiro, Meio-fio, Trânsito, Frenagem, Derrapagem, Debris
- **Vestígios**: Suporte, Recolhido?, Destino IC/II, Placa
- **Edificação**: Tipo, Material, Cobertura, Estado, Perímetro, Acesso, Vizinhança
- **Cadáveres**: Sexo, Faixa etária, Etnia, Diagnóstico, Estado, Posição, etc.
- **Veículos**: Categoria, Tipo, Estado, Motor, Portas, Vidros, Chave
- **Papiloscopia**: Vestígio, Placa
- **Trilhas**: Padrão, Continuidade, Direcionamento

### 📅 Modal de data/hora — mais largo + setinhas
Antes: modal de **380px** com selects "27 / Abr / 26" apertados
Agora:
- Modal alargado pra **460px** (mais respiro)
- Selects internos com **fonte 16px** (era 18px) — texto não corta mais
- Setinha SVG aplicada nos selects do modal (consistência visual)
- Padding interno reduzido pra dar mais espaço útil

### 🔄 Atualização silenciosa (mantida do v213)
Aplicar atualização em background quando você fica ocioso 30s ou minimiza o app.

### 🗑️ Template "Morte suspeita" removido (mantido do v213)

---

## 📦 3 arquivos pra subir

```
mvdroid-v214/
├── src/App.jsx          ← SUBSTITUIR (setinhas + modal ajustado)
├── src/main.jsx         ← SUBSTITUIR (lógica auto-update — só se ainda não subiu v213)
└── public/sw.js         ← SUBSTITUIR (Service Worker v3 — só se ainda não subiu v213)
```

> Se você JÁ subiu o v213 com auto-update funcionando, **só precisa atualizar o `src/App.jsx`** — os outros 2 arquivos ficaram iguais.

## 🚦 Como subir

GitHub web → editar cada arquivo → Commit. Vercel deploya em ~30s.

**Se ainda NÃO instalou v213**: precisa limpar cache uma última vez (instruções no INSTALACAO do v213).

**Se JÁ instalou v213**: a atualização chega sozinha. Abre o app, usa, minimiza. Próxima abertura vai ter as setinhas.

---

## 🧪 Como confirmar que funcionou

Depois do deploy:

1. Abrir aba **Equipe**
2. Olhar campos "Agente", "Papiloscopista", "Viatura"
3. **Deveria ter ▼ no canto direito** de cada um indicando que é dropdown
4. Tocar em qualquer campo de data ("Solicitação", "Deslocamento", etc)
5. Modal abre mais largo, selects com setinhas visíveis
6. Texto "Abr", "Mai" não corta mais

Se as setinhas aparecerem, deu certo. Se algum campo específico ainda não tiver, me avisa qual e eu corrijo.
