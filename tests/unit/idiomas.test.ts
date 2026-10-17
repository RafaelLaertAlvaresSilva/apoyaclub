import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { IntlMessageFormat } from "intl-messageformat";
import { routing } from "@/i18n/routing";

const RAIZ = process.cwd();

/**
 * Los tres idiomas de la web: español, portugués e inglés.
 *
 * Lo que se comprueba aquí es lo que, si se rompe, no avisa en ningún
 * otro sitio: una frase nueva escrita en español y olvidada en los
 * otros dos idiomas no da error, sale en español en mitad de la página
 * inglesa (la carga de mensajes rellena lo que falta con el español,
 * a propósito, para no romper nada). Esta prueba es la que avisa.
 *
 * Están traducidos la parte pública, el panel del club y los correos.
 * El panel de empresa y el administrador todavía no: sus archivos no
 * se comprueban.
 */
const TRADUCIDOS = ["common", "home", "auth", "club", "buscar", "servicios", "panel", "emails"] as const;
const OTROS = ["pt", "en"] as const;

/** Campos que, dentro de una lista, son identificadores y no se
 * traducen nunca: unen cada elemento con su icono o su imagen. */
const IDENTIFICADORES = new Set(["clave"]);

type Arbol = unknown;

function leer(idioma: string, nombre: string): Arbol {
  return JSON.parse(readFileSync(join(RAIZ, "messages", idioma, `${nombre}.json`), "utf8"));
}

function comparar(espanol: Arbol, otro: Arbol, ruta: string, errores: string[]) {
  if (Array.isArray(espanol)) {
    if (!Array.isArray(otro) || otro.length !== espanol.length) {
      errores.push(`${ruta}: la lista no tiene los mismos elementos`);
      return;
    }
    espanol.forEach((valor, indice) => comparar(valor, otro[indice], `${ruta}[${indice}]`, errores));
    return;
  }
  if (espanol && typeof espanol === "object") {
    if (!otro || typeof otro !== "object") {
      errores.push(`${ruta}: falta`);
      return;
    }
    for (const [clave, valor] of Object.entries(espanol)) {
      if (!(clave in (otro as Record<string, unknown>))) {
        errores.push(`${ruta}.${clave}: falta`);
        continue;
      }
      const suyo = (otro as Record<string, unknown>)[clave];
      if (ruta.endsWith("]") && IDENTIFICADORES.has(clave) && suyo !== valor) {
        errores.push(`${ruta}.${clave}: es un identificador y se ha traducido`);
      }
      comparar(valor, suyo, `${ruta}.${clave}`, errores);
    }
    return;
  }
  if (typeof espanol === "string" && espanol.trim() && (typeof otro !== "string" || !otro.trim())) {
    errores.push(`${ruta}: vacío`);
  }
}

function textos(arbol: Arbol, ruta: string, salida: [string, string][]) {
  if (typeof arbol === "string") salida.push([ruta, arbol]);
  else if (Array.isArray(arbol)) arbol.forEach((valor, indice) => textos(valor, `${ruta}[${indice}]`, salida));
  else if (arbol && typeof arbol === "object") {
    for (const [clave, valor] of Object.entries(arbol)) textos(valor, `${ruta}.${clave}`, salida);
  }
}

describe("los idiomas de la web", () => {
  it("son español, portugués e inglés, con el español por defecto", () => {
    expect([...routing.locales]).toEqual(["es", "pt", "en"]);
    expect(routing.defaultLocale).toBe("es");
  });

  for (const idioma of OTROS) {
    it(`en ${idioma} está todo lo traducido que hay en español`, () => {
      const errores: string[] = [];
      for (const nombre of TRADUCIDOS) comparar(leer("es", nombre), leer(idioma, nombre), `${idioma}/${nombre}`, errores);
      expect(errores).toEqual([]);
    });
  }

  it("ningún texto tiene el formato roto (variables, plurales, enlaces)", () => {
    const errores: string[] = [];
    for (const idioma of ["es", ...OTROS]) {
      for (const nombre of TRADUCIDOS) {
        const lista: [string, string][] = [];
        textos(leer(idioma, nombre), `${idioma}/${nombre}`, lista);
        for (const [ruta, texto] of lista) {
          try {
            new IntlMessageFormat(texto, idioma);
          } catch (error) {
            errores.push(`${ruta}: ${(error as Error).message}`);
          }
        }
      }
    }
    expect(errores).toEqual([]);
  });
});
