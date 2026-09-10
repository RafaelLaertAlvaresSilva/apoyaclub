import { describe, expect, it } from "vitest";
import {
  diasHasta,
  esAccesoRegalado,
  fechaDeAccesoValida,
  finalDelDia,
  hoyISO,
  unAnioDesde,
} from "@/lib/acceso-gratuito";

const HOY = new Date("2026-09-10T14:30:00.000Z");

describe("hoyISO", () => {
  it("da el día sin la hora", () => {
    expect(hoyISO(HOY)).toBe("2026-09-10");
  });
});

describe("unAnioDesde", () => {
  it("propone el mismo día del año siguiente", () => {
    expect(unAnioDesde(HOY)).toBe("2027-09-10");
  });

  it("cruza el cambio de año sin perderse", () => {
    expect(unAnioDesde(new Date("2026-12-31T23:00:00.000Z"))).toBe("2027-12-31");
  });
});

describe("diasHasta", () => {
  it("cuenta los días que faltan", () => {
    expect(diasHasta("2026-09-20T23:59:59.000Z", HOY)).toBe(11);
  });

  it("da negativo si la fecha ya pasó", () => {
    expect(diasHasta("2026-09-01T23:59:59.000Z", HOY)).toBeLessThan(0);
  });

  it("sin fecha, cero", () => {
    expect(diasHasta(null, HOY)).toBe(0);
  });

  it("con una fecha ilegible, cero y no una excepción", () => {
    expect(diasHasta("el mes que viene", HOY)).toBe(0);
  });
});

describe("esAccesoRegalado", () => {
  it("la prueba normal de 30 días no es un regalo", () => {
    expect(esAccesoRegalado("trialing", "2026-10-10T23:59:59.000Z", HOY)).toBe(false);
  });

  it("una prueba que dura un año sí lo es", () => {
    expect(esAccesoRegalado("trialing", "2027-09-10T23:59:59.000Z", HOY)).toBe(true);
  });

  it("un club que paga no está invitado, por lejos que quede su renovación", () => {
    expect(esAccesoRegalado("active", "2027-09-10T23:59:59.000Z", HOY)).toBe(false);
  });

  it("sin fecha de fin, no", () => {
    expect(esAccesoRegalado("trialing", null, HOY)).toBe(false);
  });
});

describe("fechaDeAccesoValida", () => {
  it("acepta una fecha futura", () => {
    expect(fechaDeAccesoValida("2027-06-30", HOY)).toBe("2027-06-30");
  });

  it("acepta hoy mismo, que es como se termina el regalo", () => {
    expect(fechaDeAccesoValida("2026-09-10", HOY)).toBe("2026-09-10");
  });

  it("rechaza una fecha pasada: quitaría el acceso en vez de darlo", () => {
    expect(fechaDeAccesoValida("2026-09-09", HOY)).toBeNull();
  });

  it("rechaza cualquier cosa que no sea una fecha", () => {
    expect(fechaDeAccesoValida("", HOY)).toBeNull();
    expect(fechaDeAccesoValida("30/06/2027", HOY)).toBeNull();
    expect(fechaDeAccesoValida("2027-13-45", HOY)).toBeNull();
  });
});

describe("finalDelDia", () => {
  it("el club conserva el acceso durante todo el día elegido", () => {
    expect(finalDelDia("2027-06-30")).toBe("2027-06-30T23:59:59.000Z");
  });
});
