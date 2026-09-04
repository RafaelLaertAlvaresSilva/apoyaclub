import { describe, expect, it } from "vitest";
import {
  cuandoFueElUltimo,
  empresasPendientesDeInforme,
  ventanaDeInforme,
} from "@/lib/recordatorio-informe";

describe("ventanaDeInforme", () => {
  it("avisa a mitad de temporada, en diciembre y en enero", () => {
    expect(ventanaDeInforme("2026-12-05")?.tipo).toBe("mitad");
    expect(ventanaDeInforme("2027-01-20")?.tipo).toBe("mitad");
  });

  it("enero cuenta como la misma vuelta que diciembre, no como una nueva", () => {
    // Si la ventana de enero empezara el 1 de enero, un club que
    // descargó el informe el 20 de diciembre volvería a verse avisado
    // dos semanas después.
    expect(ventanaDeInforme("2026-12-05")?.desde).toBe("2026-12-01");
    expect(ventanaDeInforme("2027-01-20")?.desde).toBe("2026-12-01");
  });

  it("avisa al final, en mayo y en junio", () => {
    expect(ventanaDeInforme("2027-05-02")?.tipo).toBe("final");
    expect(ventanaDeInforme("2027-06-28")?.tipo).toBe("final");
    expect(ventanaDeInforme("2027-05-02")?.desde).toBe("2027-05-01");
  });

  it("calla el resto del año", () => {
    for (const fecha of ["2026-09-15", "2026-11-30", "2027-02-01", "2027-04-20", "2027-07-10"]) {
      expect(ventanaDeInforme(fecha)).toBeNull();
    }
  });
});

describe("empresasPendientesDeInforme", () => {
  const ventana = ventanaDeInforme("2026-12-05")!;

  it("saca las que no tienen ningún informe", () => {
    const pendientes = empresasPendientesDeInforme(
      ["Ferretería Ramírez", "Panadería La Espiga"],
      new Map(),
      ventana,
    );

    expect(pendientes.map((p) => p.empresa)).toEqual(["Ferretería Ramírez", "Panadería La Espiga"]);
    expect(pendientes[0].ultimoInforme).toBeNull();
  });

  it("quita las que ya lo tienen de esta ventana", () => {
    const pendientes = empresasPendientesDeInforme(
      ["Ferretería Ramírez", "Panadería La Espiga"],
      new Map([["ferretería ramírez", "2026-12-03T10:00:00Z"]]),
      ventana,
    );

    expect(pendientes.map((p) => p.empresa)).toEqual(["Panadería La Espiga"]);
  });

  it("uno de la vuelta anterior no cuenta", () => {
    const pendientes = empresasPendientesDeInforme(
      ["Ferretería Ramírez"],
      // De la temporada pasada: toca uno nuevo.
      new Map([["ferretería ramírez", "2026-05-20T10:00:00Z"]]),
      ventana,
    );

    expect(pendientes).toHaveLength(1);
    expect(pendientes[0].ultimoInforme).toBe("2026-05-20T10:00:00Z");
  });

  it("no le importan las mayúsculas ni los espacios del nombre", () => {
    const pendientes = empresasPendientesDeInforme(
      ["  Ferretería Ramírez "],
      new Map([["ferretería ramírez", "2026-12-03T10:00:00Z"]]),
      ventana,
    );

    expect(pendientes).toHaveLength(0);
  });
});

describe("cuandoFueElUltimo", () => {
  it("dice claramente que no hay ninguno", () => {
    expect(cuandoFueElUltimo(null)).toContain("todavía no");
  });

  it("y si lo hay, de qué mes es", () => {
    expect(cuandoFueElUltimo("2026-10-03T09:00:00Z")).toContain("octubre");
  });

  it("no se va de mes por la zona horaria", () => {
    // Un informe descargado el 1 de noviembre a las 00:30 en España es
    // 31 de octubre en UTC. Se lee la fecha tal cual, sin convertir.
    expect(cuandoFueElUltimo("2026-11-01T00:30:00")).toContain("noviembre");
  });
});
