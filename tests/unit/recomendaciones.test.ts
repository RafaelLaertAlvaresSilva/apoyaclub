import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { obtenerRecomendaciones } from "@/lib/recomendaciones";

/**
 * Una recomendación sin enlace configurado no debe existir: enseñarle al
 * club una herramienta que no puede contratar es ruido, y dejar el
 * bloque puesto "para cuando haya acuerdo" acaba en una web que
 * recomienda algo con un enlace roto.
 */
describe("recomendaciones", () => {
  const entornoOriginal = { ...process.env };

  beforeEach(() => {
    delete process.env.NEXT_PUBLIC_PROSPECTPRO_URL;
  });

  afterEach(() => {
    process.env = { ...entornoOriginal };
  });

  it("no recomienda nada si no hay enlace configurado", () => {
    expect(obtenerRecomendaciones()).toEqual([]);
  });

  it("recomienda ProspectPro cuando hay enlace", () => {
    process.env.NEXT_PUBLIC_PROSPECTPRO_URL = "https://prospectpro.app/?ref=apoyaclub";
    const recomendaciones = obtenerRecomendaciones();

    expect(recomendaciones).toHaveLength(1);
    expect(recomendaciones[0].url).toBe("https://prospectpro.app/?ref=apoyaclub");
  });

  it("declara la comisión: el club tiene derecho a saber si la recomendación es interesada", () => {
    process.env.NEXT_PUBLIC_PROSPECTPRO_URL = "https://prospectpro.app/?ref=apoyaclub";
    expect(obtenerRecomendaciones()[0].conComision).toBe(true);
  });

  it("cada recomendación explica qué es y para qué le sirve al club", () => {
    process.env.NEXT_PUBLIC_PROSPECTPRO_URL = "https://prospectpro.app/?ref=apoyaclub";

    for (const recomendacion of obtenerRecomendaciones()) {
      expect(recomendacion.queEs.length).toBeGreaterThan(20);
      expect(recomendacion.paraQue.length).toBeGreaterThan(20);
      expect(recomendacion.precio).toBeTruthy();
    }
  });
});
