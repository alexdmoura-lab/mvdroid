# 🎯 MVDroiD v212 — Auditoria completa + correções

## ✅ Mudanças nesta versão

### 🔴 Bug corrigido — DOCX completo agora
Antes: 11 campos preenchidos pelo usuário sumiam no DOCX
- Agente
- Papiloscopista + matrícula
- Viatura
- Exame Externo (OIC)
- Observações da Solicitação
- Drone, Scanner, Luminol, Luz forense
- Observações dos Vestígios

Agora aparecem em:
- **Capa "Resumo da Ocorrência"** — Agente, Papilo, Viatura, OIC
- **Preâmbulo** — frase adicional "A equipe pericial contou com o apoio do Agente Policial X, do Papiloscopista Y, com a viatura Z."
- **Histórico (seção 1)** — observações da solicitação
- **Após Isolamento (seção 3)** — nova tabela "Recursos empregados" (drone, scanner, luminol, luz forense)
- **Cadeia de Custódia (seção 5)** — observações dos vestígios

### 🟡 A2 — Aviso de slot corrompido
Antes: se JSON do slot estivesse corrompido, retornava null silenciosamente (você perdia tudo sem saber)
Agora: mostra toast "⚠ Slot N corrompido — dados ilegíveis"

### 🟡 A5 — Vite atualizado pra 5.4.16+ (CVE-2025-31125 patcheado)
- Era: `"vite": "^5.4.10"`
- Agora: `"vite": "^5.4.16"`
- Risco zero pra produção (CVE só afeta dev server), mas boa prática manter atualizado

### 🟡 A6 — Touch targets 44px nos botões pequenos
Antes: 16 botões tinham 36×36 (abaixo da recomendação WCAG)
Agora: todos com 44×44, mais fácil acertar com luva/molhado/idoso
**Microfone preservado em 40×40 (você pediu)**

### 🟡 A7 — aria-labels completados nos buttons só-ícone
- Botão de câmera flutuante (canto inferior)
- Botões de tirar foto e galeria
- Anterior/Próximo na navegação
Cobertura: 47% → 49% (resto tem texto visível, screen reader já lê)

---

## 📦 2 arquivos pra subir

```
mvdroid-v212/
├── src/App.jsx          ← SUBSTITUIR
└── package.json         ← SUBSTITUIR (Vite 5.4.16+)
```

> Note: `vite.config.js` NÃO mudou nesta versão (já está OK no GitHub)

## 🚦 Como subir

### GitHub Web (mesmo procedimento de antes)

1. **Substituir `src/App.jsx`**:
   - `src/` → `App.jsx` → ✏️ → apagar tudo → colar novo → Commit

2. **Substituir `package.json`** (raiz):
   - `package.json` → ✏️ → apagar tudo → colar novo → Commit

Vercel deploya em ~30s. **Vai instalar Vite 5.4.16+ automaticamente** no build.

### ⚠️ Não esqueça

Limpar cache do navegador depois do deploy:
- iPhone: Configurações → Safari → Avançado → Dados de Sites → vercel.app → Apagar
- PC Chrome: Ctrl+Shift+R
- Android: Configurações Chrome → Privacidade → Limpar dados → vercel.app

Ou só usar `https://mvdroid.vercel.app/?v=212` pra forçar reload novo.

---

## 🧪 Como testar se DOCX foi corrigido

Depois do deploy:

1. Abrir o app
2. Preencher na aba Solicitação:
   - Agente: Roberto Carlos
   - Papiloscopista: Felipe (qualquer)
   - Viatura: T-118
   - Exame Externo: Sim
   - Drone: Sim, Luminol: Sim
3. Ir na aba Vestígios e adicionar uma observação geral
4. Exportar DOCX
5. Abrir no Word/Pages

**Deveria ver:**
- "Resumo da ocorrência" tem linha "Agente: Roberto Carlos" e "Papiloscopista: Felipe (mat. ___)"
- Preâmbulo diz "A equipe pericial contou com o apoio..."
- Após "3 ISOLAMENTO" aparece tabela "Recursos empregados" com Drone Sim, Luminol Sim
- Na seção 5 antes da papiloscopia aparece "Observações sobre os vestígios: [seu texto]"

Se aparecer tudo isso, está funcionando. Se faltar algo, me avisa.
