// Testes das funções puras de src/utils/forensic.js
// Rodar: npm test (modo watch) | npm run test:run (1×)
import { describe, it, expect } from "vitest";
import { tpStr, tpHas, normMat, lookupPerito, toTitleCase, escHtml } from "../src/utils/forensic.js";

describe("tpStr", () => {
  it("retorna string como veio", () => {
    expect(tpStr("Via pública")).toBe("Via pública");
  });
  it("junta array com vírgula", () => {
    expect(tpStr(["Via pública", "Residência"])).toBe("Via pública, Residência");
  });
  it("retorna string vazia para null/undefined", () => {
    expect(tpStr(null)).toBe("");
    expect(tpStr(undefined)).toBe("");
  });
  it("retorna string vazia para array vazio", () => {
    expect(tpStr([])).toBe("");
  });
});

describe("tpHas", () => {
  it("acha em string igual", () => {
    expect(tpHas("Via pública", "Via pública")).toBe(true);
  });
  it("não acha em string diferente", () => {
    expect(tpHas("Residência", "Via pública")).toBe(false);
  });
  it("acha dentro de array", () => {
    expect(tpHas(["Residência", "Via pública"], "Via pública")).toBe(true);
  });
  it("não acha quando não está no array", () => {
    expect(tpHas(["Residência"], "Via pública")).toBe(false);
  });
});

describe("normMat", () => {
  it("remove pontos e hífens", () => {
    expect(normMat("244.649-9")).toBe("2446499");
  });
  it("remove espaços", () => {
    expect(normMat("244 649 9")).toBe("2446499");
  });
  it("trim e uppercase", () => {
    expect(normMat("  226.823-x  ")).toBe("226823X");
  });
  it("preserva já-normalizado", () => {
    expect(normMat("2446499")).toBe("2446499");
  });
  it("retorna string vazia para null", () => {
    expect(normMat(null)).toBe("");
    expect(normMat(undefined)).toBe("");
    expect(normMat("")).toBe("");
  });
});

describe("lookupPerito", () => {
  const PERITOS = {
    "244.649-9": "Alexandre Moura",
    "226.823-X": "Kellen Maia",
  };
  it("acha por matrícula exata", () => {
    expect(lookupPerito("244.649-9", PERITOS)).toBe("Alexandre Moura");
  });
  it("acha por variação sem hífen", () => {
    expect(lookupPerito("2446499", PERITOS)).toBe("Alexandre Moura");
  });
  it("acha por variação case insensitive", () => {
    expect(lookupPerito("226.823-x", PERITOS)).toBe("Kellen Maia");
  });
  it("retorna vazio para matrícula desconhecida", () => {
    expect(lookupPerito("999.999-9", PERITOS)).toBe("");
  });
  it("retorna vazio sem dict", () => {
    expect(lookupPerito("244.649-9", null)).toBe("");
  });
});

describe("toTitleCase", () => {
  it("capitaliza nomes simples", () => {
    expect(toTitleCase("alexandre moura")).toBe("Alexandre Moura");
  });
  it("capitaliza UPPERCASE", () => {
    expect(toTitleCase("ALEXANDRE MOURA")).toBe("Alexandre Moura");
  });
  it("preserva acentos", () => {
    expect(toTitleCase("ávila ínício")).toBe("Ávila Ínício");
  });
  it("retorna vazio para null", () => {
    expect(toTitleCase(null)).toBe("");
  });
});

describe("escHtml", () => {
  it("escapa caracteres especiais HTML", () => {
    expect(escHtml('<b>"a"</b> & b')).toBe("&lt;b&gt;&quot;a&quot;&lt;/b&gt; &amp; b");
  });
  it("remove control chars (proteção XSS via XML inválido)", () => {
    expect(escHtml("a\x00b\x07c")).toBe("abc");
  });
  it("preserva acentos", () => {
    expect(escHtml("ção")).toBe("ção");
  });
  it("retorna não-string como veio", () => {
    expect(escHtml(42)).toBe(42);
    expect(escHtml(null)).toBe(null);
  });
});
