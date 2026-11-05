import { readFileSync } from "node:fs";
import { afterEach, describe, expect, it, vi } from "vitest";
import { fueraDelIvaEspanol, llevaIvaEspanol, tipoDeIvaDeStripe } from "@/lib/iva-espana";

describe("IVA español en las facturas", () => {
  afterEach(() => vi.unstubAllEnvs());

  it("España peninsular y Baleares, sí", () => {
    expect(llevaIvaEspanol({ pais: "ES", province: "Alicante", postalCode: "03501" })).toBe(true);
    expect(llevaIvaEspanol({ pais: "ES", province: "Illes Balears", postalCode: "07001" })).toBe(true);
    expect(llevaIvaEspanol({ pais: "ES", province: null, postalCode: null })).toBe(true);
  });

  it("Canarias, Ceuta y Melilla, no (por código postal o, si no hay, por provincia)", () => {
    expect(fueraDelIvaEspanol({ province: "Las Palmas", postalCode: "35500" })).toBe(true);
    expect(fueraDelIvaEspanol({ province: null, postalCode: "38001" })).toBe(true);
    expect(fueraDelIvaEspanol({ province: null, postalCode: "51001" })).toBe(true);
    expect(fueraDelIvaEspanol({ province: null, postalCode: "52001" })).toBe(true);
    expect(fueraDelIvaEspanol({ province: "Lanzarote", postalCode: null })).toBe(true);
    expect(fueraDelIvaEspanol({ province: "Santa Cruz de Tenerife", postalCode: "" })).toBe(true);
    expect(llevaIvaEspanol({ pais: "ES", province: "Las Palmas", postalCode: "35500" })).toBe(false);
  });

  it("Portugal y Brasil, no (a la espera del gestor)", () => {
    expect(llevaIvaEspanol({ pais: "PT", province: "Lisboa", postalCode: "1000-001" })).toBe(false);
    expect(llevaIvaEspanol({ pais: "BR", province: null, postalCode: null })).toBe(false);
  });

  it("sin la variable de Vercel, no se pone ningún impuesto", () => {
    vi.stubEnv("STRIPE_TAX_RATE_IVA_ES", "");
    expect(tipoDeIvaDeStripe()).toBeNull();
    vi.stubEnv("STRIPE_TAX_RATE_IVA_ES", "algo-raro");
    expect(tipoDeIvaDeStripe()).toBeNull();
    vi.stubEnv("STRIPE_TAX_RATE_IVA_ES", " txr_123 ");
    expect(tipoDeIvaDeStripe()).toBe("txr_123");
  });

  it("el pago lo aplica solo en euros y a clubes de España con IVA", () => {
    const acciones = readFileSync("src/app/[locale]/panel/suscripcion/actions.ts", "utf8");
    expect(acciones).toMatch(/moneda === "EUR" &&\s*llevaIvaEspanol\(/);
    expect(acciones).toContain("tax_rates: [tipoDeIva]");
  });

  it("la comisión del representante no resta IVA a un club de Canarias", () => {
    const comisiones = readFileSync("src/lib/comisiones-stripe.ts", "utf8");
    expect(comisiones).toContain("!fueraDelIvaEspanol(");
  });
});
