import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const MENU = readFileSync(
  join(
    process.cwd(),
    "src",
    "app",
    "[locale]",
    "panel",
    "components",
    "MenuDelPanel.tsx",
  ),
  "utf8",
);

/** El archivo sin sus comentarios: las comprobaciones de "aquí ya no
 * aparece tal clase" miran el código, no lo que se cuenta sobre él. */
function sinComentarios(fuente: string): string {
  return fuente.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");
}
const CODIGO = sinComentarios(MENU);

/** Las clases comunes a todas las entradas del menú. */
const CLASES_COMUNES =
  CODIGO.match(/const CLASES_ENLACE =\s*\n?\s*"([^"]*)"/)?.[1] ?? "";

/**
 * Las dos ramas del estado de una entrada de primer nivel.
 *
 * Atado a `const clases = ` y no a la palabra `abierto` a secas: hay
 * otro `abierto ? … : …` antes en el archivo, el de la pastilla de
 * notificaciones, y la prueba estaba midiendo aquel.
 */
const ESTADOS = CODIGO.match(
  /const clases = `\$\{CLASES_ENLACE\}[\s\S]*?\?\s*"([^"]*)"\s*:\s*"([^"]*)"/,
);

/**
 * Cada entrada del menú del panel va recuadrada.
 *
 * Antes solo se veía el recuadro de la entrada abierta y las demás eran
 * una lista de palabras seguidas: había que leerlas para saber dónde
 * acababa una y empezaba la siguiente. Lo pidió el usuario después de
 * verlo en su teléfono.
 */
describe("los bordes del menú", () => {
  it("el borde está en las clases comunes, no en un estado", () => {
    // Si el borde lo pusiera solo el estado apagado, al encenderse la
    // entrada perdería 2 px de alto y daría un salto al pulsarla.
    expect(CLASES_COMUNES, "no se encuentran las clases comunes").not.toBe("");
    expect(
      CLASES_COMUNES.split(/\s+/),
      "falta `border` en las clases comunes",
    ).toContain("border");
  });

  it("cada estado dice de qué color es su borde", () => {
    expect(ESTADOS, "no se encuentran los dos estados").not.toBeNull();
    const [, encendido, apagado] = ESTADOS!;
    for (const [nombre, clases] of [
      ["abierto", encendido],
      ["apagado", apagado],
    ] as const) {
      expect(clases, `el estado ${nombre} no dice el color del borde`).toMatch(
        /border-[a-z]/,
      );
    }
  });

  it("el borde del abierto es de su propio color", () => {
    // Un borde gris alrededor del relleno verde se ve como un cerco.
    const [, encendido] = ESTADOS!;
    const fondo = encendido.match(/bg-([\w-]+)/)?.[1];
    const borde = encendido.match(/border-([\w-]+)/)?.[1];
    expect(fondo, "el estado abierto no tiene relleno").toBeDefined();
    expect(
      borde,
      `el borde (${borde}) no es del color del relleno (${fondo})`,
    ).toBe(fondo);
  });

  it("las secciones de la ficha también van recuadradas", () => {
    // Son las de dentro de "Perfil del club": Identidad, Equipos…
    const seccion = CODIGO.match(
      /className=\{`rounded-lg border[\s\S]*?activa === seccion\.id[\s\S]*?\}`\}/,
    );
    expect(
      seccion,
      "las secciones de la ficha se han quedado sin borde",
    ).not.toBeNull();
    expect(seccion![0]).toMatch(/border-teal-\d+ bg-teal-\d+/);
    expect(seccion![0]).toMatch(/border-zinc-\d+ font-medium/);
  });

  it("ya no queda el raíl vertical al lado de las secciones", () => {
    // Con cada sección recuadrada, la línea vertical de al lado se leía
    // como una segunda caja pegada a las primeras.
    expect(CODIGO, "ha vuelto el raíl").not.toContain(
      "border-l border-zinc-200 pl-2",
    );
  });

  it("las entradas no van pegadas unas a otras", () => {
    // Con los bordes tocándose, la lista se lee como una tabla y no
    // como botones sueltos, que es justo lo que se quería evitar.
    const separacion = CODIGO.match(/flex flex-col gap-([\d.]+)">/)?.[1];
    expect(
      separacion,
      "no se encuentra la separación de la lista",
    ).toBeDefined();
    expect(Number(separacion)).toBeGreaterThanOrEqual(1);
  });
});
