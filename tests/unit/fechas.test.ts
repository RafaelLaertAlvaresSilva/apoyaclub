import { describe, expect, it } from "vitest";
import { avisoPendiente, diasDesde, diasHasta } from "@/lib/fechas";

const AHORA = new Date("2026-03-10T09:00:00.000Z");

describe("diasHasta", () => {
  it("redondea hacia arriba: lo que pasa hoy más tarde es 1 día", () => {
    expect(diasHasta("2026-03-10T23:00:00.000Z", AHORA)).toBe(1);
    expect(diasHasta("2026-03-13T09:00:00.000Z", AHORA)).toBe(3);
  });

  it("es negativo si la fecha ya pasó y null si no hay fecha", () => {
    expect(diasHasta("2026-03-08T09:00:00.000Z", AHORA)).toBeLessThan(0);
    expect(diasHasta(null, AHORA)).toBeNull();
    expect(diasHasta("no es una fecha", AHORA)).toBeNull();
  });
});

describe("diasDesde", () => {
  it("cuenta días completos", () => {
    expect(diasDesde("2026-03-08T09:00:00.000Z", AHORA)).toBe(2);
    expect(diasDesde("2026-03-10T08:00:00.000Z", AHORA)).toBe(0);
    expect(diasDesde(null, AHORA)).toBeNull();
  });
});

describe("avisoPendiente", () => {
  const UMBRALES = [1, 3, 7];

  it("elige el umbral más urgente que quede por enviar", () => {
    expect(avisoPendiente(6, UMBRALES, [])).toBe(7);
    expect(avisoPendiente(3, UMBRALES, [7])).toBe(3);
    expect(avisoPendiente(1, UMBRALES, [7, 3])).toBe(1);
  });

  it("no repite un aviso ya enviado", () => {
    expect(avisoPendiente(6, UMBRALES, [7])).toBeNull();
    expect(avisoPendiente(1, UMBRALES, [1, 3, 7])).toBeNull();
  });

  it("no avisa si falta más que el umbral mayor, ni si la fecha ya pasó", () => {
    expect(avisoPendiente(30, UMBRALES, [])).toBeNull();
    expect(avisoPendiente(0, UMBRALES, [])).toBeNull();
    expect(avisoPendiente(-4, UMBRALES, [])).toBeNull();
    expect(avisoPendiente(null, UMBRALES, [])).toBeNull();
  });

  it("con un solo umbral pendiente, salta el intermedio si el cron no corrió un día", () => {
    // El cron no se ejecutó cuando quedaban 3 días: al quedar 1, manda
    // el de 1 día, no el de 3.
    expect(avisoPendiente(1, UMBRALES, [7])).toBe(1);
  });
});
