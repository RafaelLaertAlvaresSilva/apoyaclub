import { describe, expect, it } from "vitest";
import { agruparPorClub } from "@/lib/search-types";
import type { ResultadoOportunidad } from "@/lib/search-types";

function oportunidad(cambios: Partial<ResultadoOportunidad> = {}): ResultadoOportunidad {
  return {
    opportunityId: "o1",
    clubId: "c1",
    clubSlug: "club-uno",
    clubName: "Club Uno",
    clubCity: "Valencia",
    clubProvince: "Valencia",
    clubLogoUrl: null,
    title: "Camiseta de entrenamiento",
    description: null,
    opportunityType: "equipment",
    value: 300,
    duration: null,
    period: "season",
    collaborationType: "money",
    objectives: [],
    sponsorLevel: "libre",
    slotsTotal: null,
    slotsTaken: 0,
    esNecesidad: false,
    categoriaNecesidad: null,
    profileScore: 0,
    visibilityBucket: 0,
    exclusivity: null,
    teamLabel: null,
    createdAt: "2026-01-01T00:00:00.000Z",
    distanceKm: null,
    ...cambios,
  };
}

describe("agruparPorClub", () => {
  it("agrupa las oportunidades de un mismo club en una sola tarjeta", () => {
    const clubes = agruparPorClub([
      oportunidad({ opportunityId: "o1", value: 100 }),
      oportunidad({ opportunityId: "o2", value: 900 }),
      oportunidad({ opportunityId: "o3", clubId: "c2", clubSlug: "club-dos", clubName: "Club Dos" }),
    ]);

    expect(clubes).toHaveLength(2);
    const primero = clubes.find((club) => club.clubId === "c1")!;
    expect(primero.opportunitiesCount).toBe(2);
    expect(primero.minValue).toBe(100);
    expect(primero.maxValue).toBe(900);
  });

  it("enseña como vista previa las de mayor valor, y como mucho tres", () => {
    const clubes = agruparPorClub([
      oportunidad({ opportunityId: "o1", value: 50 }),
      oportunidad({ opportunityId: "o2", value: 400 }),
      oportunidad({ opportunityId: "o3", value: 1200 }),
      oportunidad({ opportunityId: "o4", value: 80 }),
    ]);

    const club = clubes[0];
    expect(club.topOpportunities).toHaveLength(3);
    expect(club.topOpportunities.map((o) => o.value)).toEqual([1200, 400, 80]);
  });

  it("no repite los tipos de oportunidad del club", () => {
    const clubes = agruparPorClub([
      oportunidad({ opportunityId: "o1", opportunityType: "equipment" }),
      oportunidad({ opportunityId: "o2", opportunityType: "equipment" }),
      oportunidad({ opportunityId: "o3", opportunityType: "youth" }),
    ]);

    expect(clubes[0].opportunityTypes.sort()).toEqual(["equipment", "youth"]);
  });
});
