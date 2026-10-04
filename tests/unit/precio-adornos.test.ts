import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const RAIZ = process.cwd();

function leer(...trozos: string[]): string {
  return readFileSync(join(RAIZ, ...trozos), "utf8");
}

const SECCIONES = leer("src", "app", "[locale]", "components", "secciones.tsx");
const LAYOUT = leer("src", "app", "[locale]", "layout.tsx");

/** El trozo del archivo que va de `desde` al siguiente `export`. */
function bloque(fuente: string, desde: string): string {
  const inicio = fuente.indexOf(desde);
  if (inicio === -1) throw new Error(`no está "${desde}" en el archivo`);
  const fin = fuente.indexOf("\nexport ", inicio);
  return fuente.slice(inicio, fin === -1 ? undefined : fin);
}

/**
 * La nota manuscrita y la franja de tres razones son de ordenador.
 *
 * En un teléfono la sección de precios ya son tres tarjetas apiladas;
 * añadirles una frase al margen —que ahí no tiene margen— y tres
 * bloques más de texto es pedirle a alguien que lea seis cosas
 * seguidas en seis pulgadas para decidir una compra.
 *
 * Esto se rompe sin hacer ruido: quitar un `lg:` no da ningún error,
 * no falla la compilación, y en el ordenador se sigue viendo igual.
 * Solo se nota en un teléfono, que es donde casi nadie mira mientras
 * programa.
 */
describe("los adornos del precio", () => {
  const nota = bloque(SECCIONES, "function NotaDelPrecio(");
  const franja = bloque(SECCIONES, "function FranjaDelPrecio(");

  it("la nota solo sale en el ordenador", () => {
    expect(nota).toContain("hidden");
    expect(nota).toContain("lg:block");
  });

  it("la franja solo sale en el ordenador", () => {
    expect(franja).toContain("hidden");
    expect(franja).toContain("lg:grid");
  });

  it("las condiciones no se dicen dos veces en el mismo pantallazo", () => {
    // En el ordenador las dice la tercera tarjeta de la franja, así que
    // las líneas sueltas se esconden. Si alguien quita ese `lg:hidden`,
    // salen las dos cosas.
    expect(SECCIONES).toContain('<div className="lg:hidden">');
  });

  it("la nota usa la letra manuscrita, no un token de tema", () => {
    // `@theme inline` mete los valores dentro de las utilidades y no
    // publica la variable: por ahí, `var(...)` llega vacía y la frase
    // sale en la tipografía de los titulares sin que nada avise.
    expect(nota).toContain("var(--font-mano)");
    expect(LAYOUT).toContain('variable: "--font-mano"');
    expect(LAYOUT).toContain("Caveat");
  });

  it("la letra manuscrita no retrasa la carga de la página", () => {
    // Es un adorno que el teléfono ni siquiera llega a ver.
    expect(LAYOUT).toContain("preload: false");
  });

  it("la foto de fondo existe y no se descarga antes de tiempo", () => {
    expect(SECCIONES).toContain('src="/fondo-precio.webp"');
    const fondo = SECCIONES.slice(
      SECCIONES.indexOf('src="/fondo-precio.webp"') - 200,
      SECCIONES.indexOf('src="/fondo-precio.webp"') + 400,
    );
    expect(fondo).toContain('loading="lazy"');
  });
});
