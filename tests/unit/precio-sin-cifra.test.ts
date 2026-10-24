import { describe, expect, it } from "vitest";
import { formatoDeValor, precioMasBajo, textoDelPrecio, tienePrecio } from "@/lib/format";
import { generarDossierWord } from "@/lib/dossier-docx";
import type { DatosDossier } from "@/lib/dossier-datos";
import type { Opportunity } from "@/lib/types";
import { perfilDePrueba } from "../fixtures/club";

const textos = { necesidad: "A cambio de visibilidad", aConvenir: "Precio a convenir" };
const euros = formatoDeValor("es");

describe("precio de una oportunidad sin cifra", () => {
  it("una necesidad nunca enseña 0,00 €: dice a cambio de qué", () => {
    expect(textoDelPrecio({ value: 0, esNecesidad: true }, euros, textos)).toBe("A cambio de visibilidad");
    // Aunque por error lleve una cifra, una necesidad no se cobra.
    expect(textoDelPrecio({ value: 300, esNecesidad: true }, euros, textos)).toBe("A cambio de visibilidad");
  });

  it("una oferta sin precio dice que se habla; con precio, la cifra", () => {
    expect(textoDelPrecio({ value: 0 }, euros, textos)).toBe("Precio a convenir");
    expect(textoDelPrecio({ value: 1200 }, euros, textos)).toBe(euros.format(1200));
    expect(tienePrecio({ value: 1200 })).toBe(true);
    expect(tienePrecio({ value: 0 })).toBe(false);
  });

  it("el 'desde' solo cuenta las que tienen precio", () => {
    expect(precioMasBajo([{ value: 0, esNecesidad: true }, { value: 900 }, { value: 300 }])).toBe(300);
    expect(precioMasBajo([{ value: 0, esNecesidad: true }])).toBeNull();
    expect(precioMasBajo([])).toBeNull();
  });

  it("el dossier no pone 0,00 € a una necesidad", async () => {
    const necesidad = {
      id: "n1",
      title: "Fisioterapeuta para el primer equipo",
      description: null,
      value: 0,
      esNecesidad: true,
      duration: null,
      exclusivity: null,
    } as unknown as Opportunity;
    const datos: DatosDossier = {
      perfil: perfilDePrueba({ description: "Club de barrio." }),
      equipos: [],
      patrocinadores: [],
      oportunidades: [necesidad],
      partidos: [],
      secciones: ["identidad"],
      emailContacto: null,
    };
    const { execFileSync } = await import("node:child_process");
    const { mkdtempSync, writeFileSync } = await import("node:fs");
    const { tmpdir } = await import("node:os");
    const { join } = await import("node:path");
    const archivo = join(mkdtempSync(join(tmpdir(), "docx-")), "d.docx");
    writeFileSync(archivo, await generarDossierWord(datos, "es"));
    const xml = execFileSync("unzip", ["-p", archivo, "word/document.xml"], { maxBuffer: 32 * 1024 * 1024 }).toString();

    expect(xml).not.toContain("0,00");
    expect(xml).toContain("A cambio de visibilidad");
  });
});
