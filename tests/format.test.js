// Testes de src/utils/format.js
import { describe, it, expect } from "vitest";
import { fmtDt, parseFmtDt, fmtDur, supPlaca, supLoc } from "../src/utils/format.js";

describe("fmtDt", () => {
  it("formata Date com 2 dígitos de ano", () => {
    const d = new Date(2026, 4, 1, 14, 30); // 1 mai 2026 14:30
    expect(fmtDt(d)).toBe("01/05/26 14:30");
  });
  it("aceita ISO string", () => {
    const iso = new Date(2026, 4, 1, 14, 30).toISOString();
    expect(fmtDt(iso)).toBe("01/05/26 14:30");
  });
  it("retorna vazio para null/undefined/inválido", () => {
    expect(fmtDt(null)).toBe("");
    expect(fmtDt(undefined)).toBe("");
    expect(fmtDt("data inválida")).toBe("");
  });
});

describe("parseFmtDt", () => {
  it("inverso de fmtDt", () => {
    const d = parseFmtDt("01/05/26 14:30");
    expect(d).not.toBeNull();
    expect(d.getDate()).toBe(1);
    expect(d.getMonth()).toBe(4);
    expect(d.getFullYear()).toBe(2026);
    expect(d.getHours()).toBe(14);
    expect(d.getMinutes()).toBe(30);
  });
  it("aceita ano <70 como 20XX", () => {
    expect(parseFmtDt("01/05/26 14:30").getFullYear()).toBe(2026);
  });
  it("aceita ano >=70 como 19XX", () => {
    expect(parseFmtDt("01/05/85 14:30").getFullYear()).toBe(1985);
  });
  it("retorna null para formato errado", () => {
    expect(parseFmtDt("não é data")).toBeNull();
    expect(parseFmtDt("")).toBeNull();
    expect(parseFmtDt(null)).toBeNull();
    expect(parseFmtDt("2026-05-01")).toBeNull(); // formato ISO
  });
});

describe("fmtDur", () => {
  it("formata em minutos puros", () => {
    expect(fmtDur(45 * 60000)).toBe("45m");
  });
  it("formata em h+m quando >=60min", () => {
    expect(fmtDur((2 * 60 + 30) * 60000)).toBe("2h 30m");
  });
  it("0m para 0 ou negativo", () => {
    expect(fmtDur(0)).toBe("0m");
    expect(fmtDur(-1000)).toBe("0m");
  });
});

describe("supPlaca", () => {
  it("combina suporte e placa", () => {
    expect(supPlaca("Roda anterior esquerda", "ABC1234"))
      .toBe("Roda anterior esquerda — Vestígio correlacionado à placa ABC1234");
  });
  it("placa sozinha quando suporte vazio", () => {
    expect(supPlaca("", "ABC1234")).toBe("Vestígio correlacionado à placa ABC1234");
    expect(supPlaca(null, "ABC1234")).toBe("Vestígio correlacionado à placa ABC1234");
  });
  it("suporte sozinho quando placa vazia", () => {
    expect(supPlaca("Capô", "")).toBe("Capô");
    expect(supPlaca("Capô", null)).toBe("Capô");
  });
  it("trim em ambos", () => {
    expect(supPlaca("  Capô  ", "  ABC  "))
      .toBe("Capô — Vestígio correlacionado à placa ABC");
  });
});

describe("supLoc", () => {
  it("inclui coordenadas D1/D2/h", () => {
    const v = { suporte: "Piso", coord1: "1.5m", coord2: "2.0m", altura: "0.3m" };
    expect(supLoc(v)).toBe("Piso (D1: 1.5m, D2: 2.0m, h: 0.3m)");
  });
  it("omite coords vazias", () => {
    const v = { suporte: "Piso", coord1: "1.5m" };
    expect(supLoc(v)).toBe("Piso (D1: 1.5m)");
  });
  it("sem coords retorna apenas supPlaca", () => {
    const v = { suporte: "Piso", placa: "" };
    expect(supLoc(v)).toBe("Piso");
  });
  it("integra com placa", () => {
    const v = { suporte: "Roda", placa: "ABC", coord1: "1m" };
    expect(supLoc(v)).toBe("Roda — Vestígio correlacionado à placa ABC (D1: 1m)");
  });
});
