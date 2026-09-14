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

/**
 * Claves que no se escriben enteras, sino armadas al vuelo:
 *
 *   {ENLACES.map((enlace) => t(`empresas.${enlace.clave}`))}
 *
 * La comprobación de arriba no las ve —no hay ningún literal que
 * empiece por `t("`— y por ahí se coló una clave inexistente en el pie
 * de página, que sale en todas las páginas de la web.
 *
 * Aquí se recogen los dos trozos: los prefijos que se usan así en el
 * archivo (`empresas.`, `clubes.`…) y todos los valores de texto de la
 * propiedad que va dentro (`clave: "queNecesitan"`). Luego se exige que
 * cada valor exista bajo ALGUNO de esos prefijos. No bajo todos: el pie
 * tiene tres listas con tres prefijos distintos y una misma propiedad,
 * y no hay forma honesta de saber desde fuera cuál va con cuál. Con
 * "alguno" basta para pillar la clave que no existe en ninguna parte,
 * que es el fallo real.
 */
function clavesArmadasAlVuelo(contenido: string, variable: string): { prefijos: string[]; valores: string[] } {
  const patron = new RegExp("\\b" + variable + "\\(\\s*`([^`$]*)\\$\\{\\s*\\w+\\.(\\w+)\\s*\\}`", "g");

  const prefijos = new Set<string>();
  const propiedades = new Set<string>();

  for (const [, prefijo, propiedad] of contenido.matchAll(patron)) {
    prefijos.add(prefijo);
    propiedades.add(propiedad);
  }

  const valores = new Set<string>();
  for (const propiedad of propiedades) {
    for (const [, valor] of contenido.matchAll(new RegExp("\\b" + propiedad + ':\\s*"([^"]+)"', "g"))) {
      valores.add(valor);
    }
  }

  return { prefijos: [...prefijos], valores: [...valores] };
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

        const { prefijos, valores } = clavesArmadasAlVuelo(contenidoArchivo, variable);

        for (const valor of valores) {
          const encaja = prefijos.some((pre) =>
            existeClave(contenido, [...prefijo, `${pre}${valor}`].join(".")),
          );

          if (prefijos.length > 0 && !encaja) {
            errores.push(
              `${path.relative(RAIZ, archivo)}: "${valor}" no existe bajo ninguno de los prefijos ${prefijos
                .map((pre) => `"${pre}"`)
                .join(", ")} en ${nombreArchivo}.json`,
            );
          }
        }
      }
    }

    expect(errores).toEqual([]);
  });
});
