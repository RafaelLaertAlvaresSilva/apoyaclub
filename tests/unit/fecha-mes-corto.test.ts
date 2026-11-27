import { describe, expect, it } from "vitest";
import { formatoConMesCorto } from "@/lib/format";
import { fechaMedia } from "@/lib/publico-partidos";

const UNO_DE_SEPTIEMBRE = Date.UTC(2026, 8, 1, 12);

describe("formatoConMesCorto", () => {
  it("en portugués de Portugal dice el mes con letras, no '1/09/2026'", () => {
    const texto = formatoConMesCorto("pt-PT", { timeZone: "UTC" }).format(UNO_DE_SEPTIEMBRE);
    expect(texto).not.toMatch(/\//);
    expect(texto).toMatch(/^1 set\.? 2026$/);
  });

  it("sin año, en pt-PT, solo el día y el mes", () => {
    expect(formatoConMesCorto("pt-PT", { anio: false, timeZone: "UTC" }).format(UNO_DE_SEPTIEMBRE)).toMatch(/^1 set\.?$/);
  });

  it("en el resto de idiomas lo deja en manos de Intl, con el mes en letras", () => {
    for (const idioma of ["es-ES", "en-GB", "pt-BR"]) {
      const texto = formatoConMesCorto(idioma, { timeZone: "UTC" }).format(UNO_DE_SEPTIEMBRE);
      expect(texto, idioma).not.toMatch(/\//);
      expect(texto, idioma).toMatch(/[a-z]/i);
    }
  });

  it("la lista de partidos en pt-PT también", () => {
    expect(fechaMedia("2026-09-01", "pt-PT")).not.toMatch(/\//);
  });
});
