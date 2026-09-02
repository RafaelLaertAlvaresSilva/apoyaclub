import { describe, expect, it } from "vitest";
import {
  agruparPatrocinadoresPorNivel,
  clubSponsorRowToSponsor,
  ordenarPatrocinadores,
} from "@/lib/club-mappers";
import { etiquetaNivelPatrocinador } from "@/lib/types";
import { patrocinadorDePrueba } from "../fixtures/club";

/**
 * Los patrocinadores actuales son la prueba social de la ficha: si se
 * pintan en cualquier orden, un colaborador pequeño puede acabar por
 * encima del patrocinador principal. Estas pruebas fijan el orden y el
 * agrupado, que es lo único con lógica de verdad.
 */
describe("orden de los patrocinadores", () => {
  it("pone antes el principal aunque se haya dado de alta el último", () => {
    const colaborador = patrocinadorDePrueba({ id: "a", tier: "colaborador", sortOrder: 1 });
    const principal = patrocinadorDePrueba({ id: "b", tier: "principal", sortOrder: 9 });

    const orden = ordenarPatrocinadores([colaborador, principal]).map((p) => p.id);

    expect(orden).toEqual(["b", "a"]);
  });

  it("respeta el orden manual dentro de una misma categoría", () => {
    const segundo = patrocinadorDePrueba({ id: "a", tier: "oficial", sortOrder: 5 });
    const primero = patrocinadorDePrueba({ id: "b", tier: "oficial", sortOrder: 2 });

    const orden = ordenarPatrocinadores([segundo, primero]).map((p) => p.id);

    expect(orden).toEqual(["b", "a"]);
  });

  it("no modifica el array que recibe", () => {
    const lista = [
      patrocinadorDePrueba({ id: "a", tier: "colaborador" }),
      patrocinadorDePrueba({ id: "b", tier: "principal" }),
    ];

    ordenarPatrocinadores(lista);

    expect(lista.map((p) => p.id)).toEqual(["a", "b"]);
  });
});

describe("agrupado por categoría", () => {
  it("agrupa cada nivel bajo su etiqueta, en orden de importancia", () => {
    const grupos = agruparPatrocinadoresPorNivel([
      patrocinadorDePrueba({ id: "a", tier: "colaborador" }),
      patrocinadorDePrueba({ id: "b", tier: "principal" }),
      patrocinadorDePrueba({ id: "c", tier: "oficial" }),
    ]);

    expect(grupos.map((grupo) => grupo.etiqueta)).toEqual([
      "Patrocinador principal",
      "Patrocinador oficial",
      "Colaborador",
    ]);
  });

  it("junta en un mismo grupo los que comparten etiqueta libre", () => {
    const grupos = agruparPatrocinadoresPorNivel([
      patrocinadorDePrueba({ id: "a", tier: "otro", tierLabel: "Patrocinador técnico" }),
      patrocinadorDePrueba({ id: "b", tier: "otro", tierLabel: "Patrocinador técnico" }),
      patrocinadorDePrueba({ id: "c", tier: "otro", tierLabel: "Proveedor oficial" }),
    ]);

    expect(grupos).toHaveLength(2);
    expect(grupos[0].etiqueta).toBe("Patrocinador técnico");
    expect(grupos[0].patrocinadores).toHaveLength(2);
  });
});

describe("lectura de la fila de la base de datos", () => {
  it("cae a colaborador si la categoría no es una de las conocidas", () => {
    const patrocinador = clubSponsorRowToSponsor({
      id: "1",
      club_id: "2",
      name: "Bar Manolo",
      logo_url: null,
      website: null,
      tier: "inventado",
      tier_label: null,
      description: null,
      since_year: null,
      sort_order: null,
    });

    expect(patrocinador.tier).toBe("colaborador");
    expect(patrocinador.sortOrder).toBe(0);
  });

  it("ignora la etiqueta libre cuando la categoría no es 'otro'", () => {
    const patrocinador = clubSponsorRowToSponsor({
      id: "1",
      club_id: "2",
      name: "Bar Manolo",
      logo_url: null,
      website: null,
      tier: "principal",
      tier_label: "Sobra",
      description: null,
      since_year: null,
      sort_order: 3,
    });

    expect(patrocinador.tierLabel).toBeNull();
    expect(etiquetaNivelPatrocinador(patrocinador)).toBe("Patrocinador principal");
  });
});
