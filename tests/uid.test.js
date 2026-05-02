// Testes de src/utils/uid.js
import { describe, it, expect } from "vitest";
import { uid, mkEdif, isSafeImgUrl, safeArr } from "../src/utils/uid.js";

describe("uid", () => {
  it("gera valor crescente em chamadas seguidas", () => {
    const a = uid();
    const b = uid();
    const c = uid();
    expect(b).toBeGreaterThan(a);
    expect(c).toBeGreaterThan(b);
  });
  it("não colide em loop apertado", () => {
    const set = new Set();
    for (let i = 0; i < 1000; i++) set.add(uid());
    expect(set.size).toBe(1000);
  });
});

describe("mkEdif", () => {
  it("retorna objeto com campos esperados", () => {
    const e = mkEdif();
    expect(e.id).toBe(1);
    expect(e.nome).toBe("");
    expect(Array.isArray(e.comodos_fato)).toBe(true);
    expect(typeof e.comodos_fato_det).toBe("object");
  });
  it("aceita id custom", () => {
    expect(mkEdif(42).id).toBe(42);
  });
  it("retorna objeto novo a cada chamada (não shared)", () => {
    const a = mkEdif();
    const b = mkEdif();
    expect(a).not.toBe(b);
    a.comodos_fato.push("x");
    expect(b.comodos_fato).toEqual([]);
  });
});

describe("isSafeImgUrl", () => {
  it("aceita data:image/*", () => {
    expect(isSafeImgUrl("data:image/jpeg;base64,abc")).toBe(true);
    expect(isSafeImgUrl("data:image/png;base64,xyz")).toBe(true);
  });
  it("aceita blob:", () => {
    expect(isSafeImgUrl("blob:https://example/abc")).toBe(true);
  });
  it("rejeita javascript:", () => {
    expect(isSafeImgUrl("javascript:alert(1)")).toBe(false);
  });
  it("rejeita http(s):", () => {
    expect(isSafeImgUrl("https://evil.com/img.jpg")).toBe(false);
  });
  it("rejeita não-string", () => {
    expect(isSafeImgUrl(null)).toBe(false);
    expect(isSafeImgUrl(undefined)).toBe(false);
    expect(isSafeImgUrl(42)).toBe(false);
    expect(isSafeImgUrl({})).toBe(false);
  });
});

describe("safeArr", () => {
  it("filtra entradas não-objeto", () => {
    expect(safeArr([{ a: 1 }, null, "x", 42, { b: 2 }], [])).toEqual([{ a: 1 }, { b: 2 }]);
  });
  it("retorna defaultArr quando não é array", () => {
    expect(safeArr(null, [{ d: 1 }])).toEqual([{ d: 1 }]);
    expect(safeArr({ x: 1 }, [])).toEqual([]);
  });
  it("aplica predicate adicional", () => {
    const items = [{ id: 1 }, { id: 2, broken: true }, { id: 3 }];
    expect(safeArr(items, [], x => !x.broken)).toEqual([{ id: 1 }, { id: 3 }]);
  });
});
