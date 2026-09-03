import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { obtenerRecomendaciones } from "@/lib/recomendaciones";

const ENLACE = "https://prospectpro.app/?ref=apoyaclub";

/**
 * Dos cosas que no pueden fallar aquí, y las dos son de confianza, no de
 * funcionamiento: que no se anuncie una herramienta que el club no puede
 * usar, y que no se le cobre comisión a su espalda.
 */
describe("herramientas del panel", () => {
  const entornoOriginal = { ...process.env };

  beforeEach(() => {
    delete process.env.NEXT_PUBLIC_PROSPECTPRO_URL;
    delete process.env.NEXT_PUBLIC_PROSPECTPRO_MODO;
  });

  afterEach(() => {
    process.env = { ...entornoOriginal };
  });

  it("no enseña nada si no hay enlace configurado", () => {
    expect(obtenerRecomendaciones()).toEqual([]);
  });

  it("por defecto es una recomendación, y declara la comisión", () => {
    process.env.NEXT_PUBLIC_PROSPECTPRO_URL = ENLACE;
    const [herramienta] = obtenerRecomendaciones();

    expect(herramienta.modo).toBe("recomendada");
    expect(herramienta.conComision).toBe(true);
    expect(herramienta.precio).toBeTruthy();
  });

  it("en modo incluida no hay comisión que declarar ni precio que enseñar", () => {
    process.env.NEXT_PUBLIC_PROSPECTPRO_URL = ENLACE;
    process.env.NEXT_PUBLIC_PROSPECTPRO_MODO = "incluida";
    const [herramienta] = obtenerRecomendaciones();

    expect(herramienta.modo).toBe("incluida");
    // Si ApoyaClub compra la licencia, no cobra comisión: anunciar las
    // dos cosas a la vez sería mentirle al club en una de ellas.
    expect(herramienta.conComision).toBe(false);
    expect(herramienta.precio).toBeNull();
    expect(herramienta.comoSeActiva).toBeTruthy();
  });

  it("un modo desconocido no se cuela como incluida", () => {
    process.env.NEXT_PUBLIC_PROSPECTPRO_URL = ENLACE;
    process.env.NEXT_PUBLIC_PROSPECTPRO_MODO = "gratis-total";

    expect(obtenerRecomendaciones()[0].modo).toBe("recomendada");
  });

  it("cada herramienta explica qué es y para qué le sirve al club", () => {
    process.env.NEXT_PUBLIC_PROSPECTPRO_URL = ENLACE;

    for (const herramienta of obtenerRecomendaciones()) {
      expect(herramienta.queEs.length).toBeGreaterThan(20);
      expect(herramienta.paraQue.length).toBeGreaterThan(20);
    }
  });
});
