import { describe, expect, it } from "vitest";
import {
  MAXIMO_CON_LOGO,
  NOMBRES_EN_PORTADA,
  enFilas,
  nivelesValidos,
  nombresDePortada,
  patrocinadoresDelDossier,
} from "@/lib/dossier-patrocinadores";
import { dossierRowToConfig, type DossierRow } from "@/lib/dossier-mappers";
import type { ClubSponsor, SponsorTier } from "@/lib/types";

let contador = 0;
function patrocinador(name: string, tier: SponsorTier, tierLabel: string | null = null): ClubSponsor {
  contador += 1;
  return {
    id: `s${contador}`,
    clubId: "c1",
    name,
    logoUrl: null,
    website: null,
    tier,
    tierLabel,
    description: null,
    sinceYear: null,
    // Al revés del alfabeto a propósito: el dossier no debe hacerle caso.
    sortOrder: 100 - contador,
    contactEmail: null,
    notifiedAt: null,
    renewalDate: null,
    agreementEndsOn: null,
    renewalNotes: null,
  };
}

const lista = [
  patrocinador("Zapatería Paso", "colaborador"),
  patrocinador("Hotel Mar", "principal"),
  patrocinador("Óptica Visión", "oficial"),
  patrocinador("ferretería el clavo", "colaborador"),
  patrocinador("Bar Amigos", "otro", "Amigos del club"),
  patrocinador("Academia Sol", "colaborador"),
  patrocinador("Farmacia Centro", "oficial"),
  patrocinador("Imprenta Sur", "otro", "Proveedores"),
];

describe("patrocinadores del dossier", () => {
  it("con todos los niveles: por nivel y por orden alfabético dentro de cada uno", () => {
    const grupos = patrocinadoresDelDossier(lista, null);
    expect(grupos.map((grupo) => grupo.nivel)).toEqual(["principal", "oficial", "colaborador", "otro", "otro"]);
    expect(grupos[1].patrocinadores.map((p) => p.name)).toEqual(["Farmacia Centro", "Óptica Visión"]);
    // Sin distinguir mayúsculas ni tildes: "ferretería" va entre "Academia" y "Zapatería".
    expect(grupos[2].patrocinadores.map((p) => p.name)).toEqual(["Academia Sol", "ferretería el clavo", "Zapatería Paso"]);
    expect(grupos.slice(3).map((grupo) => grupo.etiqueta)).toEqual(["Amigos del club", "Proveedores"]);
  });

  it("solo los niveles elegidos", () => {
    const grupos = patrocinadoresDelDossier(lista, ["principal", "oficial"]);
    expect(grupos.flatMap((grupo) => grupo.patrocinadores).map((p) => p.name)).toEqual([
      "Hotel Mar",
      "Farmacia Centro",
      "Óptica Visión",
    ]);
    expect(patrocinadoresDelDossier(lista, [])).toEqual([]);
  });

  it("principal y oficiales con logo; el resto, solo con el nombre", () => {
    const grupos = patrocinadoresDelDossier(lista, null);
    expect(grupos.map((grupo) => grupo.conLogo)).toEqual([true, true, false, false, false]);
  });

  it("un nivel con logo pasa a ir solo con el nombre si son demasiados", () => {
    const muchos = Array.from({ length: MAXIMO_CON_LOGO + 1 }, (_, indice) => patrocinador(`Oficial ${indice}`, "oficial"));
    expect(patrocinadoresDelDossier(muchos, null)[0].conLogo).toBe(false);
    expect(patrocinadoresDelDossier(muchos.slice(1), null)[0].conLogo).toBe(true);
  });

  it("la portada lleva los de más nivel primero y dice cuántos quedan", () => {
    const muchos = [
      ...lista,
      ...Array.from({ length: 6 }, (_, indice) => patrocinador(`Colaborador ${indice}`, "colaborador")),
    ];
    const { nombres, resto } = nombresDePortada(patrocinadoresDelDossier(muchos, null));
    expect(nombres).toHaveLength(NOMBRES_EN_PORTADA);
    expect(nombres.slice(0, 3)).toEqual(["Hotel Mar", "Farmacia Centro", "Óptica Visión"]);
    expect(resto).toBe(muchos.length - NOMBRES_EN_PORTADA);
  });

  it("niveles válidos: sin inventados, sin repetir y en orden", () => {
    expect(nivelesValidos(["otro", "inventado", "principal", "principal"])).toEqual(["principal", "otro"]);
  });

  it("parte en filas para las rejillas", () => {
    expect(enFilas([1, 2, 3, 4, 5], 3)).toEqual([[1, 2, 3], [4, 5]]);
  });

  it("lo guardado: sin la columna (antes de la migración 0056) salen todos", () => {
    const fila: DossierRow = {
      id: "c1",
      sections: [],
      opportunity_ids: [],
      share_token: null,
      share_enabled: false,
      share_expires_at: null,
      updated_at: "",
    };
    expect(dossierRowToConfig(fila).sponsorTiers).toBeNull();
    expect(dossierRowToConfig({ ...fila, sponsor_tiers: ["oficial", "x"] }).sponsorTiers).toEqual(["oficial"]);
    expect(dossierRowToConfig({ ...fila, sponsor_tiers: [] }).sponsorTiers).toEqual([]);
  });
});

describe("maqueta del PDF", () => {
  it("ningún apartado entero va sin partir (las letras se pisaban al no caber en una página)", async () => {
    const { readFileSync } = await import("node:fs");
    const fuente = readFileSync("src/lib/dossier-pdf.tsx", "utf8");
    const seccion = fuente.slice(fuente.indexOf("function Seccion("), fuente.indexOf("function GrupoDePatrocinadoresEnPdf"));
    expect(seccion).toMatch(/<View style=\{estilos\.seccion\}>/);
    expect(seccion).not.toMatch(/<View style=\{estilos\.seccion\}[^>]*wrap=\{false\}/);
  });
});
