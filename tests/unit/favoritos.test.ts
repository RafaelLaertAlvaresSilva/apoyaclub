import { describe, expect, it } from "vitest";
import { estaGuardado, limpiar, type Favorito } from "@/lib/favoritos";

/**
 * Lo que hay dentro del navegador no es de fiar: lo escribió una
 * versión anterior de la web, o cualquiera con la consola abierta. Si
 * entra tal cual, un objeto raro rompe la página de favoritos entera —
 * y encima en la de alguien que ni siquiera tiene cuenta, así que no
 * hay forma de que nos enteremos.
 */
describe("limpiar lo que había guardado en el navegador", () => {
  it("deja pasar lo que tiene la forma correcta", () => {
    const favoritos: Favorito[] = [
      { tipo: "club", id: "abc" },
      { tipo: "oportunidad", id: "def" },
    ];
    expect(limpiar(favoritos)).toEqual(favoritos);
  });

  it("descarta lo que no es una lista", () => {
    expect(limpiar(null)).toEqual([]);
    expect(limpiar("club")).toEqual([]);
    expect(limpiar({ tipo: "club", id: "abc" })).toEqual([]);
  });

  it("descarta los tipos que no existen", () => {
    expect(limpiar([{ tipo: "empresa", id: "abc" }])).toEqual([]);
  });

  it("descarta los identificadores vacíos o absurdamente largos", () => {
    expect(limpiar([{ tipo: "club", id: "" }])).toEqual([]);
    expect(limpiar([{ tipo: "club", id: "x".repeat(65) }])).toEqual([]);
  });

  it("descarta la basura sin llevarse por delante lo bueno", () => {
    expect(
      limpiar([{ tipo: "club", id: "abc" }, null, 42, { tipo: "oportunidad", id: "def" }]),
    ).toEqual([
      { tipo: "club", id: "abc" },
      { tipo: "oportunidad", id: "def" },
    ]);
  });

  it("no repite el mismo dos veces", () => {
    expect(limpiar([{ tipo: "club", id: "abc" }, { tipo: "club", id: "abc" }])).toEqual([
      { tipo: "club", id: "abc" },
    ]);
  });

  it("un club y una oportunidad con el mismo id son cosas distintas", () => {
    expect(limpiar([{ tipo: "club", id: "abc" }, { tipo: "oportunidad", id: "abc" }])).toHaveLength(2);
  });

  it("pone un tope, para que nadie llene el navegador", () => {
    const muchos = Array.from({ length: 500 }, (_, i) => ({ tipo: "club", id: `club-${i}` }));
    expect(limpiar(muchos)).toHaveLength(200);
  });
});

describe("saber si algo ya está guardado", () => {
  const favoritos: Favorito[] = [{ tipo: "club", id: "abc" }];

  it("lo encuentra", () => {
    expect(estaGuardado(favoritos, "club", "abc")).toBe(true);
  });

  it("no confunde el tipo", () => {
    expect(estaGuardado(favoritos, "oportunidad", "abc")).toBe(false);
  });

  it("no encuentra lo que no está", () => {
    expect(estaGuardado(favoritos, "club", "xyz")).toBe(false);
  });
});
