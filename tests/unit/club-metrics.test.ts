import { describe, expect, it } from "vitest";
import { sinDatos, variacion, type MetricasClub } from "@/lib/club-metrics";

function metricas(
  cambios: Partial<
    Record<"apariciones" | "visitas" | "dossieres" | "solicitudes" | "contactos", number>
  > = {},
): MetricasClub {
  const vacia = { actual: 0, anterior: 0 };
  return {
    dias: 30,
    apariciones: { ...vacia, actual: cambios.apariciones ?? 0 },
    visitas: { ...vacia, actual: cambios.visitas ?? 0 },
    dossieres: { ...vacia, actual: cambios.dossieres ?? 0 },
    solicitudes: { ...vacia, actual: cambios.solicitudes ?? 0 },
    contactos: { ...vacia, actual: cambios.contactos ?? 0 },
  };
}

describe("variación entre los dos periodos", () => {
  it("calcula el porcentaje de subida y de bajada", () => {
    expect(variacion({ actual: 12, anterior: 6 })).toBe(100);
    expect(variacion({ actual: 3, anterior: 6 })).toBe(-50);
    expect(variacion({ actual: 6, anterior: 6 })).toBe(0);
  });

  it("no inventa un porcentaje cuando el periodo anterior estaba a cero", () => {
    expect(variacion({ actual: 9, anterior: 0 })).toBeNull();
    expect(variacion({ actual: 0, anterior: 0 })).toBeNull();
  });
});

describe("sinDatos", () => {
  it("es true solo cuando no hay absolutamente nada este periodo", () => {
    expect(sinDatos(metricas())).toBe(true);
    expect(sinDatos(metricas({ visitas: 1 }))).toBe(false);
    expect(sinDatos(metricas({ solicitudes: 2 }))).toBe(false);
    expect(sinDatos(metricas({ contactos: 1 }))).toBe(false);
  });
});
