import { describe, expect, it } from "vitest";
import { agruparEquiposPorSexo } from "@/lib/club-mappers";
import { leerCategoriaNecesidad, porcentajeDePlazas } from "@/lib/opportunities";
import { equipoDePrueba } from "../fixtures/club";

describe("porcentajeDePlazas", () => {
  it("va de vacía a llena como espera cualquiera", () => {
    expect(porcentajeDePlazas({ slotsTotal: 10, slotsTaken: 0 })).toBe(0);
    expect(porcentajeDePlazas({ slotsTotal: 10, slotsTaken: 2 })).toBe(20);
    expect(porcentajeDePlazas({ slotsTotal: 10, slotsTaken: 4 })).toBe(40);
    expect(porcentajeDePlazas({ slotsTotal: 10, slotsTaken: 10 })).toBe(100);
  });

  it("no se pasa del 100 % aunque el club apunte más de las que hay", () => {
    expect(porcentajeDePlazas({ slotsTotal: 3, slotsTaken: 7 })).toBe(100);
  });

  it("no baja de 0 con un número negativo", () => {
    expect(porcentajeDePlazas({ slotsTotal: 4, slotsTaken: -2 })).toBe(0);
  });

  it("sin plazas no hay barra que pintar", () => {
    expect(porcentajeDePlazas({ slotsTotal: null, slotsTaken: 3 })).toBe(0);
    expect(porcentajeDePlazas({ slotsTotal: 0, slotsTaken: 0 })).toBe(0);
  });

  it("redondea al entero: una barra no tiene decimales", () => {
    expect(porcentajeDePlazas({ slotsTotal: 3, slotsTaken: 1 })).toBe(33);
    expect(porcentajeDePlazas({ slotsTotal: 3, slotsTaken: 2 })).toBe(67);
  });
});

describe("leerCategoriaNecesidad", () => {
  it("acepta las del catálogo y rechaza lo demás", () => {
    expect(leerCategoriaNecesidad("fisioterapia")).toBe("fisioterapia");
    expect(leerCategoriaNecesidad("transporte")).toBe("transporte");
    expect(leerCategoriaNecesidad("lo-que-sea")).toBeNull();
    expect(leerCategoriaNecesidad("")).toBeNull();
  });
});

describe("agruparEquiposPorSexo", () => {
  it("separa femeninos, masculinos y mixtos, con el femenino delante", () => {
    const grupos = agruparEquiposPorSexo([
      equipoDePrueba({ id: "1", gender: "Masculino" }),
      equipoDePrueba({ id: "2", gender: "Femenino" }),
      equipoDePrueba({ id: "3", gender: "Mixto" }),
    ]);

    expect(grupos.map((grupo) => grupo.titulo)).toEqual([
      "Equipos femeninos",
      "Equipos masculinos",
      "Equipos mixtos",
    ]);
  });

  it("no monta grupos cuando todos son del mismo sexo", () => {
    const grupos = agruparEquiposPorSexo([
      equipoDePrueba({ id: "1", gender: "Masculino" }),
      equipoDePrueba({ id: "2", gender: "Masculino" }),
    ]);

    expect(grupos).toHaveLength(1);
    expect(grupos[0].titulo).toBeNull();
    expect(grupos[0].equipos).toHaveLength(2);
  });

  it("aguanta lo que ya hay escrito a mano, en cualquier caja", () => {
    const grupos = agruparEquiposPorSexo([
      equipoDePrueba({ id: "1", gender: "femenino" }),
      equipoDePrueba({ id: "2", gender: "MASCULINO" }),
      equipoDePrueba({ id: "3", gender: "Masc." }),
    ]);

    const femenino = grupos.find((grupo) => grupo.titulo === "Equipos femeninos");
    const masculino = grupos.find((grupo) => grupo.titulo === "Equipos masculinos");
    expect(femenino?.equipos).toHaveLength(1);
    expect(masculino?.equipos).toHaveLength(2);
  });

  it("los que no tienen sexo puesto no se pierden", () => {
    const grupos = agruparEquiposPorSexo([
      equipoDePrueba({ id: "1", gender: "Femenino" }),
      equipoDePrueba({ id: "2", gender: null }),
    ]);

    const otros = grupos.find((grupo) => grupo.titulo === "Otros equipos");
    expect(otros?.equipos.map((equipo) => equipo.id)).toEqual(["2"]);
  });

  it("un club sin equipos devuelve un grupo vacío, no revienta", () => {
    expect(agruparEquiposPorSexo([])).toEqual([{ titulo: null, equipos: [] }]);
  });
});
