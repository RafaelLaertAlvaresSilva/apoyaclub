import { describe, expect, it } from "vitest";
import { onboardingCompleto, primerosPasos, siguientePaso } from "@/lib/onboarding";
import { equipoDePrueba, perfilDePrueba } from "../fixtures/club";

/**
 * Los cinco pasos del asistente, que son también los de "Empieza por
 * aquí" del inicio: antes eran dos listas y un mismo club veía "3 de 4"
 * en un sitio y "4 de 5" en el otro.
 */
describe("primeros pasos del club", () => {
  it("sin club todavía, están los cinco pendientes y se empieza por el club", () => {
    const pasos = primerosPasos(null, [], 0);
    expect(pasos.map((paso) => paso.id)).toEqual(["club", "imagenes", "equipos", "oportunidades", "compartir"]);
    expect(pasos.every((paso) => !paso.hecho)).toBe(true);
    expect(siguientePaso(pasos)?.id).toBe("club");
    expect(onboardingCompleto(pasos)).toBe(false);
  });

  it("el club necesita nombre y descripción", () => {
    expect(primerosPasos(perfilDePrueba({ description: null }), [], 0)[0].hecho).toBe(false);
    expect(primerosPasos(perfilDePrueba({ description: "Club de barrio." }), [], 0)[0].hecho).toBe(true);
  });

  it("las imágenes necesitan escudo y portada, no solo una de las dos", () => {
    expect(primerosPasos(perfilDePrueba({ logoUrl: "https://ejemplo/logo.png" }), [], 0)[1].hecho).toBe(false);
    expect(
      primerosPasos(perfilDePrueba({ logoUrl: "https://ejemplo/logo.png", coverUrl: "https://ejemplo/portada.jpg" }), [], 0)[1].hecho,
    ).toBe(true);
  });

  it("los datos de cantera cuentan como equipos, para un club que solo tiene base", () => {
    expect(primerosPasos(perfilDePrueba({ youthTeamsCount: 6 }), [], 0)[2].hecho).toBe(true);
    expect(primerosPasos(perfilDePrueba(), [equipoDePrueba()], 0)[2].hecho).toBe(true);
  });

  it("desaparece cuando los cinco están hechos", () => {
    const pasos = primerosPasos(
      perfilDePrueba({ logoUrl: "https://ejemplo/logo.png", coverUrl: "https://ejemplo/portada.jpg", description: "Club de barrio." }),
      [equipoDePrueba()],
      2,
      true,
    );
    expect(onboardingCompleto(pasos)).toBe(true);
    expect(siguientePaso(pasos)).toBeNull();
  });

  it("el último paso queda pendiente hasta que el club abre su dossier", () => {
    expect(primerosPasos(null, [], 0).at(-1)?.hecho).toBe(false);
    expect(primerosPasos(null, [], 0, true).at(-1)?.hecho).toBe(true);
  });
});
