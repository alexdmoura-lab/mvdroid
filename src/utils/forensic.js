// ════════════════════════════════════════════════════════════════
// Helpers puros — funções sem dependência de React ou DOM.
// Testáveis isoladamente via Vitest (ver tests/forensic.test.js).
// v295: extraídos do App.jsx pra permitir testes automatizados.
// ════════════════════════════════════════════════════════════════

// Normaliza valor de "tipo do local" pra string. Aceita string ou array.
export const tpStr = (v) => Array.isArray(v) ? v.join(", ") : (v || "");

// Verifica se um tipo está presente. Aceita string ou array.
export const tpHas = (v, needle) => Array.isArray(v) ? v.includes(needle) : v === needle;

// Normaliza matrícula pra comparação tolerante (sem pontos/hífens/espaços).
// Ex: "244.649-9" → "2446499", "244 649 9" → "2446499", "2446499" → "2446499"
export const normMat = (m) => String(m || "").trim().toUpperCase().replace(/\s+/g, "").replace(/[.\-]/g, "");

// Lookup de perito por matrícula. peritosDict: objeto { matricula: nome }.
// Tolera variações de formatação na matrícula.
export const lookupPerito = (m, peritosDict) => {
  if (!m || !peritosDict) return "";
  if (peritosDict[m]) return peritosDict[m];
  const n = normMat(m);
  if (!n) return "";
  for (const k of Object.keys(peritosDict)) {
    if (normMat(k) === n) return peritosDict[k];
  }
  return "";
};

// Title Case para nomes (1ª letra maiúscula em cada palavra separada por espaço).
// Ex: "ALEXANDRE MOURA" → "Alexandre Moura"
// v296: alinhado com a versão usada no App.jsx (split por espaço só).
export const toTitleCase = (s) =>
  String(s || "").toLowerCase().split(" ").map(w => w ? w[0].toUpperCase() + w.slice(1) : w).join(" ");

// Escape HTML/XML — remove control chars + escapa caracteres especiais.
// Usado nos exports PDF/DOCX.
export const escHtml = (s) => {
  if (typeof s !== "string") return s;
  return s
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
};
