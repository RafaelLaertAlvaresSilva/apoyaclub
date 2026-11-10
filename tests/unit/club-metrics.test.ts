import { describe, expect, it } from "vitest";
import { sinDatos, variacion, type MetricasClub } from "@/lib/club-metrics";

function metricas(
  cambios: Partial<
    Record<
      "apariciones" | "visitas" | "dossieres" | "solicitudes" | "contactos" | "visitasTotales",
      number
    >
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
    visitasTotales: cambios.visitasTotales ?? 0,
  };
}

describe("variación entre los dos periodos", () => {
  it("calcula el porcentaje de subida y de bajada", () => {
    expect(variacion({ actual: 60, anterior: 30 })).toBe(100);
    expect(variacion({ actual: 15, anterior: 30 })).toBe(-50);
    expect(variacion({ actual: 30, anterior: 30 })).toBe(0);
  });

  it("no inventa un porcentaje cuando el periodo anterior estaba a cero", () => {
    expect(variacion({ actual: 9, anterior: 0 })).toBeNull();
    expect(variacion({ actual: 0, anterior: 0 })).toBeNull();
    // Con cifras pequeñas, sin porcentaje: de 17 a 2 no es "−88 %".
    expect(variacion({ actual: 2, anterior: 17 })).toBeNull();
    expect(variacion({ actual: 40, anterior: 19 })).toBeNull();
    expect(variacion({ actual: 10, anterior: 20 })).toBe(-50);
  });
});

describe("sinDatos", () => {
  it("es true solo cuando no hay absolutamente nada este periodo", () => {
    expect(sinDatos(metricas())).toBe(true);
    expect(sinDatos(metricas({ visitas: 1 }))).toBe(false);
    expect(sinDatos(metricas({ solicitudes: 2 }))).toBe(false);
    expect(sinDatos(metricas({ contactos: 1 }))).toBe(false);
  });

  it("sigue siendo true si el total histórico tiene visitas pero este mes no", () => {
    // El acumulado no cuenta aquí a propósito: "no hay movimiento este
    // mes" es cierto aunque el club llevara cien visitas el año pasado,
    // y es justo el aviso que necesita ver.
    expect(sinDatos(metricas({ visitasTotales: 120 }))).toBe(true);
  });
});
