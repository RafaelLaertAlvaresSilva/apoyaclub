import { describe, expect, it } from "vitest";
import { onboardingCompleto, primerosPasos, siguientePaso } from "@/lib/onboarding";
import { equipoDePrueba, perfilDePrueba } from "../fixtures/club";

describe("primeros pasos del club", () => {
  it("un club recién creado los tiene los tres pendientes", () => {
    const pasos = primerosPasos(perfilDePrueba(), [], 0);
    expect(pasos.map((paso) => paso.hecho)).toEqual([false, false, false]);
    expect(siguientePaso(pasos)?.id).toBe("identidad");
    expect(onboardingCompleto(pasos)).toBe(false);
  });

  it("la identidad necesita logo y descripción, no solo una de las dos", () => {
    const soloLogo = primerosPasos(perfilDePrueba({ logoUrl: "https://ejemplo/logo.png" }), [], 0);
    expect(soloLogo[0].hecho).toBe(false);

    const completa = primerosPasos(
      perfilDePrueba({ logoUrl: "https://ejemplo/logo.png", description: "Club de barrio." }),
      [],
      0,
    );
    expect(completa[0].hecho).toBe(true);
  });

  it("los datos de cantera cuentan como equipos, para un club que solo tiene base", () => {
    expect(primerosPasos(perfilDePrueba({ youthTeamsCount: 6 }), [], 0)[1].hecho).toBe(true);
    expect(primerosPasos(perfilDePrueba(), [equipoDePrueba()], 0)[1].hecho).toBe(true);
  });

  it("desaparece cuando los tres están hechos", () => {
    const pasos = primerosPasos(
      perfilDePrueba({ logoUrl: "https://ejemplo/logo.png", description: "Club de barrio." }),
      [equipoDePrueba()],
      2,
    );
    expect(onboardingCompleto(pasos)).toBe(true);
    expect(siguientePaso(pasos)).toBeNull();
  });

  it("sin club todavía, el primer paso sigue siendo la identidad", () => {
    const pasos = primerosPasos(null, [], 0);
    expect(pasos[0].hecho).toBe(false);
    expect(siguientePaso(pasos)?.href).toBe("/panel#identidad");
  });
});
