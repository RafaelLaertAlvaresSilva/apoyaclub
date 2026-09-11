import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

/**
 * El módulo lee las variables de entorno al cargarse, así que cada
 * prueba tiene que volver a importarlo con el entorno ya puesto.
 */
async function cargarConEntorno(entorno: Record<string, string | undefined>) {
  vi.resetModules();
  for (const [clave, valor] of Object.entries(entorno)) {
    if (valor === undefined) delete process.env[clave];
    else process.env[clave] = valor;
  }
  return import("@/lib/titular");
}

const CLAVES = [
  "NEXT_PUBLIC_TITULAR_NOMBRE",
  "NEXT_PUBLIC_TITULAR_NIF",
  "NEXT_PUBLIC_TITULAR_DIRECCION",
  "NEXT_PUBLIC_TITULAR_EMAIL",
  "NEXT_PUBLIC_TITULAR_REGISTRO",
];

const original: Record<string, string | undefined> = {};

beforeEach(() => {
  for (const clave of CLAVES) {
    original[clave] = process.env[clave];
    delete process.env[clave];
  }
});

afterEach(() => {
  for (const clave of CLAVES) {
    if (original[clave] === undefined) delete process.env[clave];
    else process.env[clave] = original[clave];
  }
  vi.resetModules();
});

const COMPLETO = {
  NEXT_PUBLIC_TITULAR_NOMBRE: "Nombre Apellido",
  NEXT_PUBLIC_TITULAR_NIF: "00000000X",
  NEXT_PUBLIC_TITULAR_DIRECCION: "Calle de Ejemplo 1, 36001 Pontevedra",
};

describe("los datos del titular", () => {
  it("sin rellenar, no se da por completo ni se inventa una frase", async () => {
    const { TITULAR_COMPLETO, fraseDeIdentificacion } = await cargarConEntorno({});
    expect(TITULAR_COMPLETO).toBe(false);
    expect(fraseDeIdentificacion()).toBeNull();
  });

  it("a medias tampoco: faltando el domicilio, no se publica nada", async () => {
    const { TITULAR_COMPLETO, fraseDeIdentificacion } = await cargarConEntorno({
      NEXT_PUBLIC_TITULAR_NOMBRE: COMPLETO.NEXT_PUBLIC_TITULAR_NOMBRE,
      NEXT_PUBLIC_TITULAR_NIF: COMPLETO.NEXT_PUBLIC_TITULAR_NIF,
    });
    expect(TITULAR_COMPLETO).toBe(false);
    expect(fraseDeIdentificacion()).toBeNull();
  });

  it("un valor con solo espacios cuenta como vacío", async () => {
    const { TITULAR_COMPLETO } = await cargarConEntorno({ ...COMPLETO, NEXT_PUBLIC_TITULAR_NIF: "   " });
    expect(TITULAR_COMPLETO).toBe(false);
  });

  it("completo, monta la frase de la LSSI con los cuatro datos", async () => {
    const { fraseDeIdentificacion } = await cargarConEntorno(COMPLETO);
    const frase = fraseDeIdentificacion();

    expect(frase).toContain("Nombre Apellido");
    expect(frase).toContain("NIF 00000000X");
    expect(frase).toContain("Calle de Ejemplo 1");
    expect(frase).toContain("info@apoyaclub.com");
    expect(frase).not.toContain("[");
  });

  it("sin correo propio, usa el de contacto de siempre", async () => {
    const { TITULAR } = await cargarConEntorno(COMPLETO);
    expect(TITULAR.email).toBe("info@apoyaclub.com");
  });

  it("el registro mercantil solo sale si lo hay", async () => {
    const sinRegistro = await cargarConEntorno(COMPLETO);
    expect(sinRegistro.fraseDeIdentificacion()).not.toContain("inscrito en");

    const conRegistro = await cargarConEntorno({
      ...COMPLETO,
      NEXT_PUBLIC_TITULAR_REGISTRO: "el Registro Mercantil de Pontevedra, tomo 1, folio 2",
    });
    expect(conRegistro.fraseDeIdentificacion()).toContain("inscrito en el Registro Mercantil");
  });
});
