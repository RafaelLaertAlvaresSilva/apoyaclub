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

/**
 * El lienzo: el fondo teñido de todas las páginas.
 *
 * Tiene dos trabajos opuestos y aquí se comprueban los dos. Por un
 * lado, todo lo que se escribe encima tiene que seguir leyéndose. Por
 * otro —y esta es la razón de que exista— tiene que distinguirse del
 * blanco de las tarjetas: si alguien lo devuelve a blanco puro "para
 * limpiar", la página vuelve a ser la hoja plana que era y nadie se
 * entera hasta que lo ve un club.
 */
describe("el lienzo de fondo", () => {
  const lienzo = () => token("lienzo");

  it("el texto normal se lee encima", () => {
    expect(contraste(lienzo(), token("foreground"))).toBeGreaterThanOrEqual(4.5);
  });

  it("los títulos y las etiquetas de marca se leen encima", () => {
    expect(contraste(lienzo(), token("brand-navy"))).toBeGreaterThanOrEqual(4.5);
    expect(contraste(lienzo(), token("brand-teal-dark"))).toBeGreaterThanOrEqual(4.5);
  });

  it("se distingue del blanco de las tarjetas", () => {
    // 1,0 sería el mismo color. No hay un mínimo de la WCAG para esto
    // —no es texto—, así que el listón lo pone el ojo: por debajo de
    // 1,03 la tarjeta deja de verse como una tarjeta.
    expect(contraste(BLANCO, lienzo())).toBeGreaterThan(1.03);
  });

  it("pero no tanto como para parecer una caja gris", () => {
    expect(contraste(BLANCO, lienzo())).toBeLessThan(1.2);
  });

  it("el escalón hondo y el borde van en la misma dirección, no más claros", () => {
    const luz = (hex: string) => contraste(hex, "#000000");
    expect(luz(token("lienzo-hondo"))).toBeLessThan(luz(lienzo()));
    expect(luz(token("lienzo-borde"))).toBeLessThan(luz(token("lienzo-hondo")));
  });
});
