import { describe, expect, it } from "vitest";
import {
  ETIQUETA_NIVEL_PATROCINIO,
  NIVELES_PATROCINIO,
  etiquetaEquipo,
  formatoValorOportunidad,
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
      archived_at: null,
      created_at: "2026-01-01T00:00:00.000Z",
      updated_at: "2026-01-01T00:00:00.000Z",
    });

    expect(oportunidad.value).toBe(250);
    expect(oportunidad.sponsorLevel).toBe("libre");
    expect(oportunidad.objectives).toEqual([]);
  });
});
