import { describe, expect, it } from "vitest";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

const RAIZ = process.cwd();

function leer(...trozos: string[]): string {
  return readFileSync(join(RAIZ, ...trozos), "utf8");
}

const TEXTOS = JSON.parse(leer("messages", "es", "home.json")) as {
  comoFunciona: { pasos: { clave: string }[]; pieDeFoto: string };
};
const SECCIONES = leer("src", "app", "[locale]", "components", "secciones.tsx");

/** El bloque `PANTALLA_DEL_PASO`, tal y como está escrito. */
function bloqueDePantallas(): string {
  const desde = SECCIONES.indexOf("const PANTALLA_DEL_PASO");
  expect(desde, "no encuentro PANTALLA_DEL_PASO en secciones.tsx").toBeGreaterThan(-1);
  const hasta = SECCIONES.indexOf("};", desde);
  return SECCIONES.slice(desde, hasta);
}

/**
 * Cada paso de "Cómo funciona" enseña una captura del panel, y la
 * pareja se hace por la clave del paso (CREA, PUBLICA…).
 *
 * Renombrar una clave en `home.json` deja ese paso sin imagen, y no
 * falla nada: la sección se pinta con un hueco y hay que verlo para
 * enterarse. Lo mismo si alguien borra un `.webp` de `public`.
 */
describe("las pantallas de «Cómo funciona»", () => {
  const bloque = bloqueDePantallas();
  const claves = TEXTOS.comoFunciona.pasos.map((paso) => paso.clave);

  it("hay cuatro pasos", () => {
    expect(claves).toHaveLength(4);
  });

  it("cada paso tiene su pantalla", () => {
    for (const clave of claves) {
      expect(bloque, `el paso "${clave}" se ha quedado sin pantalla`).toContain(`${clave}: {`);
    }
  });

  it("no sobra ninguna pantalla de un paso que ya no existe", () => {
    const enElCodigo = [...bloque.matchAll(/^ {2}([A-ZÁÉÍÓÚ]+): \{/gm)].map((m) => m[1]);
    expect(enElCodigo).toHaveLength(claves.length);
    for (const clave of enElCodigo) {
      expect(claves, `sobra la pantalla de "${clave}"`).toContain(clave);
    }
  });

  it("los archivos de las capturas existen", () => {
    const archivos = [...bloque.matchAll(/archivo: "([^"]+)"/g)].map((m) => m[1]);
    expect(archivos).toHaveLength(claves.length);
    for (const archivo of archivos) {
      expect(existsSync(join(RAIZ, "public", archivo)), `falta public${archivo}`).toBe(true);
    }
  });

  it("cada captura lleva un alt que describe lo que se ve", () => {
    const alts = [...bloque.matchAll(/alt: "([^"]+)"/g)].map((m) => m[1]);
    expect(alts).toHaveLength(claves.length);
    // Un alt de tres palabras ("captura del panel") no le sirve a nadie
    // que navegue con lector de pantalla.
    for (const alt of alts) expect(alt.length, alt).toBeGreaterThan(40);
  });

  it("el pie dice que los datos son de ejemplo", () => {
    expect(TEXTOS.comoFunciona.pieDeFoto.toLowerCase()).toContain("ejemplo");
  });
});
