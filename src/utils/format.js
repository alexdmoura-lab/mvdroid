// ════════════════════════════════════════════════════════════════
// Formatadores puros — datas, durações, suporte/local de vestígio.
// Refactor v296 (Camada 2): extraídos do App.jsx pra módulo próprio.
// Sem dependência de React/DOM. Testáveis em isolamento via Vitest.
// ════════════════════════════════════════════════════════════════

// Formata um Date (ou ISO string) como "DD/MM/YY HH:mm".
// Retorna string vazia para entrada inválida.
export const fmtDt = (d) => {
  if (!d) return "";
  const dt = d instanceof Date ? d : new Date(d);
  if (isNaN(dt.getTime())) return "";
  const dd = String(dt.getDate()).padStart(2, "0");
  const mm = String(dt.getMonth() + 1).padStart(2, "0");
  const yy = String(dt.getFullYear()).slice(-2);
  const hh = String(dt.getHours()).padStart(2, "0");
  const mi = String(dt.getMinutes()).padStart(2, "0");
  return `${dd}/${mm}/${yy} ${hh}:${mi}`;
};

// Inverso de fmtDt — aceita "DD/MM/YY HH:mm" e retorna Date (ou null).
// Usado por v247 pra calcular tempo decorrido desde a chegada do perito.
export const parseFmtDt = (s) => {
  if (!s || typeof s !== "string") return null;
  const m = s.match(/^(\d{2})\/(\d{2})\/(\d{2})\s+(\d{2}):(\d{2})$/);
  if (!m) return null;
  const yy = parseInt(m[3]);
  const year = yy >= 70 ? 1900 + yy : 2000 + yy;
  const d = new Date(year, parseInt(m[2]) - 1, parseInt(m[1]), parseInt(m[4]), parseInt(m[5]));
  return isNaN(d.getTime()) ? null : d;
};

// Formata duração em milissegundos como "Xh Ym" ou "Ym".
// Negativo retorna "0m" (proteção contra clock drift).
export const fmtDur = (ms) => {
  if (ms < 0) return "0m";
  const totalMin = Math.floor(ms / 60000);
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
};

// Combina suporte + placa de veículo em string única.
// Ex: ("Roda anterior esquerda", "ABC1234") →
//     "Roda anterior esquerda — Vestígio correlacionado à placa ABC1234"
export const supPlaca = (sup, placa) => {
  const s = (sup || "").trim();
  const p = (placa || "").trim();
  if (!p) return s;
  return s
    ? `${s} — Vestígio correlacionado à placa ${p}`
    : `Vestígio correlacionado à placa ${p}`;
};

// Combina suporte + placa + coordenadas (D1, D2, h) em string única.
// Usado nos exports de cadeia de custódia para preservar as distâncias
// medidas pelo perito no local. v236.
export const supLoc = (v) => {
  const base = supPlaca(v.suporte, v.placa);
  const c1 = (v.coord1 || "").trim();
  const c2 = (v.coord2 || "").trim();
  const h = (v.altura || "").trim();
  const parts = [];
  if (c1) parts.push(`D1: ${c1}`);
  if (c2) parts.push(`D2: ${c2}`);
  if (h) parts.push(`h: ${h}`);
  const coords = parts.length ? ` (${parts.join(", ")})` : "";
  return `${base}${coords}`;
};
