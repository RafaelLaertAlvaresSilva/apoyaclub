import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

/**
 * Contraste de los colores de marca (WCAG AA).
 *
 * No sustituye a una auditoría con navegador, pero sí evita la
 * regresión que ya ocurrió una vez: elegir un teal bonito para los
 * botones y dejar el texto blanco encima en 2,5:1. Lee los tokens del
 * propio `globals.css`, así que si alguien cambia un color y baja del
 * mínimo, el test falla.
 */

const CSS = readFileSync(path.resolve(__dirname, "../../src/app/globals.css"), "utf8");

function token(nombre: string): string {
  const encontrado = CSS.match(new RegExp(`--${nombre}:\\s*(#[0-9a-fA-F]{6})`));
  if (!encontrado) throw new Error(`Falta el token --${nombre} en globals.css`);
  return encontrado[1];
}

function luminancia(hex: string): number {
  const canales = [1, 3, 5].map((inicio) => parseInt(hex.slice(inicio, inicio + 2), 16) / 255);
  const ajustados = canales.map((c) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
  return 0.2126 * ajustados[0] + 0.7152 * ajustados[1] + 0.0722 * ajustados[2];
}

export function contraste(a: string, b: string): number {
  const [claro, oscuro] = [luminancia(a), luminancia(b)].sort((x, y) => y - x);
  return (claro + 0.05) / (oscuro + 0.05);
}

const BLANCO = "#ffffff";

describe("contraste de los colores de marca", () => {
  it("el azul marino con texto blanco pasa AA de sobra", () => {
    expect(contraste(BLANCO, token("brand-navy"))).toBeGreaterThanOrEqual(4.5);
    expect(contraste(BLANCO, token("brand-navy-dark"))).toBeGreaterThanOrEqual(4.5);
  });

  it("el teal oscuro sirve para texto blanco encima y para texto sobre blanco", () => {
    const teal = token("brand-teal-dark");
    expect(contraste(BLANCO, teal)).toBeGreaterThanOrEqual(4.5);
    expect(contraste(teal, BLANCO)).toBeGreaterThanOrEqual(4.5);
  });

  it("el teal claro solo vale como relleno decorativo, nunca con texto blanco", () => {
    // Se comprueba a propósito: si algún día alguien lo usa de fondo de
    // un botón, este test recuerda por qué no.
    expect(contraste(BLANCO, token("brand-teal"))).toBeLessThan(4.5);
  });

  it("el teal oscuro sobre el teal claro sigue siendo legible (etiquetas de nivel)", () => {
    expect(contraste(token("brand-teal-dark"), token("brand-teal-light"))).toBeGreaterThanOrEqual(4.5);
  });
});
