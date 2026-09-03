import { describe, expect, it } from "vitest";
import { filtrosAQueryString, parametrosAFiltros } from "@/lib/buscar-params";
import type { FiltrosBusqueda } from "@/lib/search-types";

/**
 * Requisito de la Fase 7: una búsqueda se tiene que poder compartir con
 * su URL. Es decir, filtros -> query string -> filtros debe devolver lo
 * mismo, y cualquier basura en la URL debe ignorarse en vez de romper.
 */
describe("filtros del buscador y URL", () => {
  const filtros: FiltrosBusqueda = {
    provincia: "Valencia",
    ubicacion: "46001",
    radioKm: 50,
    deporte: "Balonmano",
    categoria: "Senior",
    genero: "Femenino",
    nivelEquipo: "cantera",
    tipos: ["equipment", "youth"],
    presupuestoMin: 50,
    presupuestoMax: 500,
    periodo: "season",
    formasColaboracion: ["money", "mixed"],
    objetivos: ["familias", "deporte_base"],
    niveles: ["principal", "oficial"],
    orden: "valor",
  };

  it("va y vuelve sin perder ningún filtro", () => {
    const qs = filtrosAQueryString(filtros, "oportunidad");
    const params = Object.fromEntries(new URLSearchParams(qs));
    const { filtros: recuperados, vista } = parametrosAFiltros(params);

    expect(recuperados).toEqual(filtros);
    expect(vista).toBe("oportunidad");
  });

  it("conserva la vista por club", () => {
    const qs = filtrosAQueryString({ deporte: "Rugby" }, "club");
    expect(new URLSearchParams(qs).get("vista")).toBe("club");
    expect(parametrosAFiltros(Object.fromEntries(new URLSearchParams(qs))).vista).toBe("club");
  });

  it("ignora valores inventados en la URL en vez de romperse", () => {
    const { filtros: recuperados } = parametrosAFiltros({
      tipo: "equipment,inventado",
      patrocinio: "principal,jefazo",
      forma: "bitcoin",
      periodo: "milenio",
      nivel: "profesional",
      orden: "aleatorio",
      radio: "-30",
    });

    expect(recuperados.tipos).toEqual(["equipment"]);
    expect(recuperados.niveles).toEqual(["principal"]);
    expect(recuperados.formasColaboracion).toEqual([]);
    expect(recuperados.periodo).toBeUndefined();
    expect(recuperados.nivelEquipo).toBeUndefined();
    expect(recuperados.radioKm).toBeUndefined();
    // Sin orden válido se cae al orden por defecto, no a undefined.
    expect(recuperados.orden).toBe("recomendado");
  });

  it("no ensucia la URL con el orden por defecto ni con la vista por defecto", () => {
    const qs = filtrosAQueryString({ orden: "recomendado" }, "oportunidad");
    expect(qs).toBe("");
  });

  it("el nivel de patrocinador viaja en el parámetro patrocinio", () => {
    const qs = filtrosAQueryString({ niveles: ["colaborador"] }, "oportunidad");
    expect(qs).toBe("patrocinio=colaborador");
  });
});
