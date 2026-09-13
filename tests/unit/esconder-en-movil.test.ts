import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

/**
 * `hidden` tiene que esconder de verdad.
 *
 * En la ficha del club, el índice de secciones escondía en el móvil las
 * pastillas que van dentro del desplegable con `hidden sm:inline-flex`.
 * No escondía nada: la constante que venía detrás traía además
 * `inline-flex`, y `hidden` e `inline-flex` son las dos la misma
 * propiedad (`display`). Con las dos puestas gana la que el navegador
 * lea la última en la hoja de estilos, no la que se escribió antes.
 * Resultado: en el teléfono salía el menú entero suelto Y otra vez
 * dentro del desplegable.
 *
 * Nada falla cuando pasa esto —ni el compilador, ni las pruebas, ni la
 * consola del navegador—, solo se ve mal, y solo en el tamaño de
 * pantalla donde casi nunca se mira. Por eso hay una prueba.
 *
 * Y por eso la prueba resuelve las constantes antes de mirar: el fallo
 * original no estaba escrito en el `className`, estaba escondido detrás
 * de un `${...}`. Una prueba que solo leyera el literal habría pasado
 * en verde con el fallo delante.
 */
const RAIZ = join(process.cwd(), "src");

/** Los `display` de Tailwind que chocarían con `hidden`. */
const DISPLAY = [
  "block",
  "inline-block",
  "inline",
  "flex",
  "inline-flex",
  "grid",
  "inline-grid",
  "table",
  "contents",
  "flow-root",
  "list-item",
];

function componentes(directorio: string, acumulado: string[] = []): string[] {
  for (const entrada of readdirSync(directorio)) {
    const ruta = join(directorio, entrada);
    if (statSync(ruta).isDirectory()) componentes(ruta, acumulado);
    else if (entrada.endsWith(".tsx")) acumulado.push(ruta);
  }
  return acumulado;
}

/** Las constantes de texto del fichero, para poder sustituir los
 * `${...}` de dentro de un `className`. Se resuelven en cadena, porque
 * una constante puede estar hecha con otra. */
function constantesDeTexto(contenido: string): Map<string, string> {
  const constantes = new Map<string, string>();

  for (const [, nombre, entreComillas, entreTildes] of contenido.matchAll(
    /const\s+([A-Za-z_$][\w$]*)\s*=\s*(?:"([^"]*)"|`([^`]*)`)/g,
  )) {
    constantes.set(nombre, entreComillas ?? entreTildes ?? "");
  }

  // Tres vueltas bastan para cualquier anidamiento razonable y evitan
  // quedarse dando vueltas si alguien escribe una constante circular.
  for (let vuelta = 0; vuelta < 3; vuelta += 1) {
    for (const [nombre, valor] of constantes) {
      constantes.set(
        nombre,
        valor.replace(/\$\{([A-Za-z_$][\w$]*)\}/g, (original, referida: string) =>
          constantes.get(referida) ?? original,
        ),
      );
    }
  }

  return constantes;
}

/** Las clases sueltas de un `className`, con las constantes ya puestas
 * y sin las que llevan variante (`sm:`, `hover:`…), que no compiten. */
function clasesSinVariante(lista: string, constantes: Map<string, string>): string[] {
  return lista
    .replace(/\$\{([A-Za-z_$][\w$]*)\}/g, (original, nombre: string) => constantes.get(nombre) ?? original)
    .split(/\s+/)
    .filter(Boolean)
    .filter((clase) => !clase.includes(":") && !clase.includes("${"));
}

function choquesDeDisplay(contenido: string): string[] {
  const constantes = constantesDeTexto(contenido);
  const encontrados: string[] = [];

  // Tanto className="…" como className={`…`}.
  for (const [, entreComillas, entreTildes] of contenido.matchAll(
    /className=(?:"([^"]*)"|\{`([^`]*)`\})/g,
  )) {
    const clases = clasesSinVariante(entreComillas ?? entreTildes ?? "", constantes);
    if (!clases.includes("hidden")) continue;

    const choque = clases.find((clase) => DISPLAY.includes(clase));
    if (choque) encontrados.push(choque);
  }

  return encontrados;
}

describe("hidden esconde de verdad", () => {
  const ficheros = componentes(RAIZ);

  it("encuentra componentes que revisar", () => {
    expect(ficheros.length).toBeGreaterThan(20);
  });

  it("pilla el fallo original, con la clase escondida detrás de una constante", () => {
    const comoEstaba = `
      const CLASES_NORMAL = "inline-flex items-center rounded-full border px-4 py-2";
      export function Indice() {
        return <a className={\`hidden sm:inline-flex \${CLASES_NORMAL}\`}>Cantera</a>;
      }
    `;

    expect(choquesDeDisplay(comoEstaba)).toEqual(["inline-flex"]);
  });

  it("no se queja de un hidden legítimo", () => {
    const correcto = `
      const CLASES_NORMAL = "items-center rounded-full border px-4 py-2";
      export function Indice() {
        return <a className={\`hidden sm:inline-flex \${CLASES_NORMAL}\`}>Cantera</a>;
      }
    `;

    expect(choquesDeDisplay(correcto)).toEqual([]);
  });

  it("ningún className de la aplicación junta hidden con otro display", () => {
    const fallos: string[] = [];

    for (const fichero of ficheros) {
      for (const choque of choquesDeDisplay(readFileSync(fichero, "utf8"))) {
        fallos.push(`${fichero.replace(process.cwd(), "")}: "hidden" junto a "${choque}"`);
      }
    }

    expect(fallos).toEqual([]);
  });
});
