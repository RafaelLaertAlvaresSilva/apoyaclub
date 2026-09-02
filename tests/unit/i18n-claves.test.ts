import { readFileSync, readdirSync, statSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

/**
 * Red de seguridad de la extracción de textos (Fase 14).
 *
 * Recorre el código buscando `useTranslations("espacio")` /
 * `getTranslations("espacio")` y comprueba que todas las claves que se
 * piden después existen de verdad en `messages/es/<espacio>.json`. Una
 * clave mal escrita se ve así al instante, en vez de aparecer como un
 * texto roto en producción.
 */

const RAIZ = path.resolve(__dirname, "../..");
const DIRECTORIO_MENSAJES = path.join(RAIZ, "messages", "es");

function archivosDeCodigo(directorio: string): string[] {
  return readdirSync(directorio).flatMap((entrada) => {
    const ruta = path.join(directorio, entrada);
    if (statSync(ruta).isDirectory()) return archivosDeCodigo(ruta);
    return /\.tsx?$/.test(entrada) ? [ruta] : [];
  });
}

function mensajes(espacio: string): Record<string, unknown> | null {
  try {
    return JSON.parse(readFileSync(path.join(DIRECTORIO_MENSAJES, `${espacio}.json`), "utf8"));
  } catch {
    return null;
  }
}

function existeClave(objeto: unknown, ruta: string): boolean {
  return ruta.split(".").reduce<unknown>((actual, parte) => {
    if (actual && typeof actual === "object" && parte in (actual as Record<string, unknown>)) {
      return (actual as Record<string, unknown>)[parte];
    }
    return undefined;
  }, objeto) !== undefined;
}

/**
 * Traductores declarados en un archivo. Se guarda el nombre de la
 * variable (`const t = useTranslations("home")`) para poder atribuir
 * cada clave a su espacio, ya que un mismo archivo puede declarar
 * varios (por ejemplo, uno para los metadatos y otro para la página).
 */
type Traductor = { variable: string; espacio: string };

function traductores(contenido: string): Traductor[] {
  return [
    ...contenido.matchAll(
      /(?:const|let)\s+(\w+)\s*=\s*(?:await\s+)?(?:useTranslations|getTranslations)\(\s*"([^"]+)"\s*\)/g,
    ),
  ].map((coincidencia) => ({ variable: coincidencia[1], espacio: coincidencia[2] }));
}

function clavesUsadas(contenido: string, variable: string): string[] {
  const patron = new RegExp(`\\b${variable}(?:\\.raw|\\.rich)?\\(\\s*"([^"]+)"`, "g");
  return [...new Set([...contenido.matchAll(patron)].map((coincidencia) => coincidencia[1]))];
}

describe("claves de traducción", () => {
  const archivos = archivosDeCodigo(path.join(RAIZ, "src"));

  it("encuentra código que ya usa traducciones", () => {
    const conTraducciones = archivos.filter((archivo) => traductores(readFileSync(archivo, "utf8")).length > 0);
    expect(conTraducciones.length).toBeGreaterThan(0);
  });

  it("todas las claves usadas existen en messages/es", () => {
    const errores: string[] = [];

    for (const archivo of archivos) {
      const contenidoArchivo = readFileSync(archivo, "utf8");

      for (const { variable, espacio } of traductores(contenidoArchivo)) {
        // El espacio puede ser "home" o "home.meta": el archivo es la
        // primera parte, el resto es un prefijo dentro de él.
        const [nombreArchivo, ...prefijo] = espacio.split(".");
        const contenido = mensajes(nombreArchivo);

        if (!contenido) {
          errores.push(`${path.relative(RAIZ, archivo)}: falta messages/es/${nombreArchivo}.json`);
          continue;
        }

        for (const clave of clavesUsadas(contenidoArchivo, variable)) {
          const rutaCompleta = [...prefijo, clave].join(".");
          if (!existeClave(contenido, rutaCompleta)) {
            errores.push(`${path.relative(RAIZ, archivo)}: falta "${rutaCompleta}" en ${nombreArchivo}.json`);
          }
        }
      }
    }

    expect(errores).toEqual([]);
  });
});
