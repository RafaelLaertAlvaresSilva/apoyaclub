import { describe, expect, it } from "vitest";
import {
  ETIQUETA_NIVEL_PATROCINIO,
  NIVELES_PATROCINIO,
  esPorPlazas,
  etiquetaEquipo,
  formatoValorOportunidad,
  plazasLibres,
  valorTotalDeLasPlazas,
} from "@/lib/opportunities";
import { opportunityRowToOpportunity } from "@/lib/opportunity-mappers";

describe("oportunidades", () => {
  it("todos los niveles de patrocinador tienen etiqueta", () => {
    for (const nivel of NIVELES_PATROCINIO) {
      expect(ETIQUETA_NIVEL_PATROCINIO[nivel.id]).toBeTruthy();
    }
  });

  it("describe el equipo asociado juntando solo lo que hay", () => {
    expect(etiquetaEquipo({ sport: "Balonmano", category: "Cadete", gender: "Femenino" })).toBe(
      "Balonmano · Cadete · Femenino",
    );
    expect(etiquetaEquipo({ sport: "Rugby", category: null, gender: null })).toBe("Rugby");
    expect(etiquetaEquipo({ sport: null, category: null, gender: null })).toBeNull();
  });

  it("formatea el valor en euros de España", () => {
    // El espacio antes del € es un espacio duro, no uno normal.
    expect(formatoValorOportunidad.format(1500).replace(/ /g, " ")).toBe("1500,00 €");
  });

  it("una fila sin nivel (anterior a la migración 0011) se lee como libre", () => {
    const oportunidad = opportunityRowToOpportunity({
      id: "o1",
      club_id: "c1",
      title: "Lona en el pabellón",
      description: null,
      opportunity_type: "venue_matches",
      status: "available",
      // Postgres devuelve numeric como string.
      value: "250.00",
      duration: null,
      period: null,
      collaboration_type: null,
      objectives: null,
      sponsor_level: null,
      exclusivity: null,
      team_id: null,
      slots_total: null,
      slots_taken: null,
      is_need: null,
      need_category: null,
      archived_at: null,
      created_at: "2026-01-01T00:00:00.000Z",
      updated_at: "2026-01-01T00:00:00.000Z",
    });

    expect(oportunidad.value).toBe(250);
    expect(oportunidad.sponsorLevel).toBe("libre");
    expect(oportunidad.objectives).toEqual([]);
  });
});

describe("oportunidades repartidas entre varias empresas", () => {
  it("una sola plaza no es un reparto", () => {
    expect(esPorPlazas({ slotsTotal: null })).toBe(false);
    expect(esPorPlazas({ slotsTotal: 1 })).toBe(false);
    expect(esPorPlazas({ slotsTotal: 2 })).toBe(true);
  });

  it("cuenta las plazas que quedan sin bajar de cero", () => {
    expect(plazasLibres({ slotsTotal: 10, slotsTaken: 3 })).toBe(7);
    expect(plazasLibres({ slotsTotal: 10, slotsTaken: 10 })).toBe(0);
    // Si el club se pasa apuntando plazas, no se enseña un número negativo.
    expect(plazasLibres({ slotsTotal: 5, slotsTaken: 8 })).toBe(0);
    expect(plazasLibres({ slotsTotal: null, slotsTaken: 0 })).toBe(0);
  });

  it("el total que busca el club es lo que pone cada empresa por las plazas", () => {
    expect(valorTotalDeLasPlazas({ slotsTotal: 10, value: 100 })).toBe(1000);
    // Sin plazas, el total es el valor de la propia oportunidad.
    expect(valorTotalDeLasPlazas({ slotsTotal: null, value: 450 })).toBe(450);
  });
});
