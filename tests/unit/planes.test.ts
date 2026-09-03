import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  PLANES,
  PLANES_EN_ORDEN,
  centimosAlAnio,
  centimosAlMes,
  esPlanValido,
  planDelPriceId,
  precioFormateado,
  priceIdDelPlan,
} from "@/lib/planes";

/**
 * Los precios son la parte del código donde un error se traduce
 * directamente en dinero mal cobrado, así que conviene fijarlos.
 */
describe("planes", () => {
  it("mantiene los tres precios acordados, IVA incluido", () => {
    expect(PLANES.mensual.precioCentimos).toBe(2990);
    expect(PLANES.temporada.precioCentimos).toBe(24900);
    expect(PLANES.fundador.precioCentimos).toBe(19900);
  });

  it("el plan de temporada ahorra frente a pagar doce meses", () => {
    expect(centimosAlAnio("temporada")).toBeLessThan(centimosAlAnio("mensual"));
    expect(centimosAlAnio("mensual") - centimosAlAnio("temporada")).toBe(10980);
  });

  it("convierte los anuales a ingreso mensual comparable", () => {
    expect(centimosAlMes("mensual")).toBe(2990);
    expect(centimosAlMes("temporada")).toBe(2075);
    expect(centimosAlMes("fundador")).toBe(1658);
  });

  it("solo el fundador tiene plazas limitadas", () => {
    expect(PLANES_EN_ORDEN.filter((plan) => plan.limitado).map((plan) => plan.id)).toEqual([
      "fundador",
    ]);
  });

  it("formatea el precio en euros", () => {
    expect(precioFormateado(PLANES.mensual).replace(/ /g, " ")).toBe("29,90 €");
  });

  it("reconoce solo los tres identificadores válidos", () => {
    expect(esPlanValido("temporada")).toBe(true);
    expect(esPlanValido("gratis")).toBe(false);
    expect(esPlanValido(null)).toBe(false);
  });
});

describe("precios de Stripe", () => {
  const entornoOriginal = { ...process.env };

  beforeEach(() => {
    delete process.env.STRIPE_PRICE_MENSUAL;
    delete process.env.STRIPE_PRICE_TEMPORADA;
    delete process.env.STRIPE_PRICE_FUNDADOR;
    delete process.env.STRIPE_PRICE_ID;
  });

  afterEach(() => {
    process.env = { ...entornoOriginal };
  });

  it("usa la variable propia de cada plan", () => {
    process.env.STRIPE_PRICE_TEMPORADA = "price_temporada";
    expect(priceIdDelPlan("temporada")).toBe("price_temporada");
  });

  it("acepta el STRIPE_PRICE_ID antiguo como precio mensual", () => {
    process.env.STRIPE_PRICE_ID = "price_viejo";
    expect(priceIdDelPlan("mensual")).toBe("price_viejo");
  });

  it("falla con un mensaje útil si el plan no tiene precio configurado", () => {
    expect(() => priceIdDelPlan("fundador")).toThrow(/STRIPE_PRICE_FUNDADOR/);
  });

  it("reconoce a qué plan pertenece un precio de Stripe", () => {
    process.env.STRIPE_PRICE_FUNDADOR = "price_f";
    expect(planDelPriceId("price_f")).toBe("fundador");
    expect(planDelPriceId("price_desconocido")).toBeNull();
  });
});
