import { describe, expect, it } from "vitest";
import { TIPO_IVA, sinIva } from "@/lib/admin-finanzas";
import { centimosAlAnio, centimosAlMes } from "@/lib/planes";

/**
 * Aquí lo único que tiene lógica de verdad (y consecuencias) es el IVA:
 * confundir el bruto con el neto significa creer que el negocio gana un
 * 21 % más de lo que gana.
 */
describe("IVA", () => {
  it("es el general español", () => {
    expect(TIPO_IVA).toBe(0.21);
  });

  it("quita el IVA de un precio que ya lo lleva dentro", () => {
    // 29,90 € con IVA son 24,71 € de base imponible.
    expect(sinIva(2990)).toBe(2471);
    // 249 € con IVA son 205,79 €.
    expect(sinIva(24900)).toBe(20579);
  });

  it("devuelve siempre céntimos enteros", () => {
    for (const centimos of [1, 7, 999, 2990, 19900, 24900]) {
      expect(Number.isInteger(sinIva(centimos))).toBe(true);
    }
  });

  it("no infla el neto: siempre es menor que el bruto", () => {
    expect(sinIva(24900)).toBeLessThan(24900);
  });
});

describe("cifras que se suman en el área financiera", () => {
  it("un club anual y uno mensual se pueden sumar al mes", () => {
    const total = centimosAlMes("temporada") + centimosAlMes("mensual");
    expect(total).toBe(2075 + 2990);
  });

  it("el ingreso a doce meses del plan mensual es su cuota por doce", () => {
    expect(centimosAlAnio("mensual")).toBe(2990 * 12);
  });
});
