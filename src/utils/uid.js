// ════════════════════════════════════════════════════════════════
// UID generator e factories de objetos vazios.
// Refactor v296 (Camada 2): extraído do App.jsx.
// ════════════════════════════════════════════════════════════════

// UID monotônico — sem colisão em loops rápidos. Combina timestamp em
// nanossegundos (Date.now()*1000) com sequência interna.
// Resultado: Number único e crescente.
let _uidSeq = 0;
export const uid = () => {
  _uidSeq = (_uidSeq + 1) % 999999;
  return Date.now() * 1000 + _uidSeq;
};

// Factory pra um novo objeto Edificação vazio.
// Default id=1 (cards no UI usam id como key React).
export const mkEdif = (id = 1) => ({
  id,
  nome: "",
  obs: "",
  tipo: "",
  andares: "",
  estado: "",
  acesso: "",
  comodos_fato: [],
  material: "",
  cobertura: "",
  muro: "",
  portao: "",
  n_entradas: "",
  ilum_int: "",
  cameras: "",
  comodos_list: [],
  comodos_fato_det: {},
  vizinhanca: "",
});

// Validador de URL "segura" pra IMG src — só aceita data:image/* e blob:.
// Bloqueia javascript:, http://, file://, etc — defesa contra XSS via
// backup JSON malicioso de outro perito.
export const isSafeImgUrl = (u) =>
  typeof u === "string" && (/^data:image\//i.test(u) || /^blob:/i.test(u));

// Filtra array vindo de backup JSON — descarta entradas que não são
// objeto, e (opcional) que falham num predicate adicional.
export const safeArr = (v, defaultArr, checkItem) => {
  if (!Array.isArray(v)) return defaultArr;
  return v.filter(x => x && typeof x === "object" && (!checkItem || checkItem(x)));
};
