import { describe, expect, it } from "vitest";
import { direccionDe, limpiarCabecera } from "@/lib/email/cabeceras";

/**
 * El agradecimiento al patrocinador sale a nombre del club, y ese nombre
 * lo escribe el club. Es texto arbitrario entrando en una cabecera de
 * correo: sin sanear, un salto de línea permite añadir cabeceras nuevas
 * y mandar el correo a quien quiera quien lo escribió.
 */
describe("limpiarCabecera", () => {
  it("quita los saltos de línea, que son la vía de la inyección", () => {
    const malicioso = 'Club\r\nBcc: victima@ejemplo.es\nSubject: otro';
    const limpio = limpiarCabecera(malicioso);

    expect(limpio).not.toContain("\n");
    expect(limpio).not.toContain("\r");
  });

  it("quita los caracteres que delimitan la propia cabecera", () => {
    expect(limpiarCabecera('Club <malo@ejemplo.es>')).not.toMatch(/[<>]/);
    expect(limpiarCabecera('Club "raro"')).not.toContain('"');
  });

  it("deja intacto un nombre normal de club", () => {
    expect(limpiarCabecera("CD Balonmano Vigo")).toBe("CD Balonmano Vigo");
    expect(limpiarCabecera("  Club  Rugby   Coruña ")).toBe("Club Rugby Coruña");
  });

  it("acorta los nombres desmedidos", () => {
    expect(limpiarCabecera("a".repeat(200))).toHaveLength(60);
  });
});

describe("direccionDe", () => {
  it("saca la dirección de un remitente con nombre", () => {
    expect(direccionDe("ApoyaClub <hola@apoyaclub.es>")).toBe("hola@apoyaclub.es");
  });

  it("devuelve tal cual una dirección suelta", () => {
    expect(direccionDe("hola@apoyaclub.es")).toBe("hola@apoyaclub.es");
    expect(direccionDe("  hola@apoyaclub.es  ")).toBe("hola@apoyaclub.es");
  });
});
