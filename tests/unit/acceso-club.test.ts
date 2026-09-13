import { describe, expect, it } from "vitest";
import {
  diasDePruebaQueQuedan,
  esRutaAbiertaSinSuscripcion,
  puedeUsarElPanel,
} from "@/lib/acceso-club";

describe("puedeUsarElPanel", () => {
  it("entra quien está en prueba o al día", () => {
    expect(puedeUsarElPanel("trialing")).toBe(true);
    expect(puedeUsarElPanel("active")).toBe(true);
  });

  it("un cobro fallido no cierra la puerta: Stripe sigue reintentando", () => {
    expect(puedeUsarElPanel("past_due")).toBe(true);
  });

  it("se cierra cuando el cobro se da por perdido o se cancela", () => {
    expect(puedeUsarElPanel("canceled")).toBe(false);
    expect(puedeUsarElPanel("unpaid")).toBe(false);
    expect(puedeUsarElPanel("incomplete_expired")).toBe(false);
    expect(puedeUsarElPanel("paused")).toBe(false);
  });

  it("sin estado ninguno, tampoco", () => {
    expect(puedeUsarElPanel(null)).toBe(false);
  });
});

describe("esRutaAbiertaSinSuscripcion", () => {
  it("la suscripción sigue abierta: es adonde se le manda", () => {
    expect(esRutaAbiertaSinSuscripcion("/panel/suscripcion")).toBe(true);
  });

  it("privacidad también, y esto no es opcional", () => {
    expect(esRutaAbiertaSinSuscripcion("/panel/privacidad")).toBe(true);
  });

  it("todo lo demás del panel, cerrado", () => {
    expect(esRutaAbiertaSinSuscripcion("/panel")).toBe(false);
    expect(esRutaAbiertaSinSuscripcion("/panel/oportunidades")).toBe(false);
    expect(esRutaAbiertaSinSuscripcion("/panel/publico")).toBe(false);
    expect(esRutaAbiertaSinSuscripcion("/panel/dossier")).toBe(false);
  });

  it("una ruta que solo empieza igual no cuela", () => {
    expect(esRutaAbiertaSinSuscripcion("/panel/privacidad-falsa")).toBe(false);
  });
});

describe("diasDePruebaQueQuedan", () => {
  const HOY = new Date("2026-09-13T10:00:00.000Z");

  it("continúa la prueba que ya corría, no empieza otra", () => {
    expect(diasDePruebaQueQuedan("2026-09-25T23:59:59.000Z", HOY)).toBe(13);
  });

  it("gastada la prueba, cero: el primer recibo se cobra al momento", () => {
    expect(diasDePruebaQueQuedan("2026-09-01T23:59:59.000Z", HOY)).toBe(0);
    expect(diasDePruebaQueQuedan(null, HOY)).toBe(0);
  });

  it("a un club invitado se le respeta el regalo entero", () => {
    expect(diasDePruebaQueQuedan("2027-06-30T23:59:59.000Z", HOY)).toBeGreaterThan(200);
  });

  it("una fecha ilegible no tumba el cobro", () => {
    expect(diasDePruebaQueQuedan("el mes que viene", HOY)).toBe(0);
  });

  it("nunca pide a Stripe más de lo que admite", () => {
    expect(diasDePruebaQueQuedan("2099-01-01T00:00:00.000Z", HOY)).toBe(730);
  });
});
