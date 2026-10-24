import { describe, expect, it } from "vitest";
import { ALTO_LOGO_DOSSIER, ANCHO_LOGO_DOSSIER, logoDelDossier } from "@/lib/dossier-marca";

/** Ancho y alto de un PNG, leídos de su cabecera. */
function medidasPng(dataUrl: string) {
  const bytes = Buffer.from(dataUrl.split(",")[1], "base64");
  expect(bytes.subarray(1, 4).toString("latin1")).toBe("PNG");
  return { ancho: bytes.readUInt32BE(16), alto: bytes.readUInt32BE(20) };
}

describe("logo de ApoyaClub en el dossier", () => {
  it("hay uno por idioma, distinto (el eslogan va en la imagen)", () => {
    const logos = ["es", "en", "pt"].map(logoDelDossier);
    expect(new Set(logos).size).toBe(3);
    for (const logo of logos) expect(logo.startsWith("data:image/png;base64,")).toBe(true);
  });

  it("un idioma desconocido usa el de español", () => {
    expect(logoDelDossier("fr")).toBe(logoDelDossier("es"));
  });

  it("las medidas declaradas son las de las imágenes, para no deformarlas", () => {
    for (const locale of ["es", "en", "pt"]) {
      expect(medidasPng(logoDelDossier(locale))).toEqual({ ancho: ANCHO_LOGO_DOSSIER, alto: ALTO_LOGO_DOSSIER });
    }
  });
});
