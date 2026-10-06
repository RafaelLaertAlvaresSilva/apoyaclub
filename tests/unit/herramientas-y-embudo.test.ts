import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const RAIZ = process.cwd();
const SECCIONES = readFileSync(
  join(RAIZ, "src", "app", "[locale]", "components", "secciones.tsx"),
  "utf8",
);
const TEXTOS = JSON.parse(readFileSync(join(RAIZ, "messages", "es", "home.json"), "utf8"));

/**
 * Las doce herramientas de "Para clubes".
 *
 * La tarjeta de cada una enseña la línea corta y guarda el párrafo
 * largo dentro de un `<details>`. Eso solo funciona si CADA
 * herramienta tiene las dos cosas escritas.
 *
 * Y aquí no avisa nadie. Las herramientas se leen con `t.raw(...)`,
 * que devuelve la lista tal cual: si a la número trece se le olvida el
 * `corto`, TypeScript no se entera —el tipo lo pone el código, no el
 * archivo de textos— y la prueba de claves tampoco, porque esa busca
 * `t("clave")` sueltas y aquí no hay ninguna. Lo que saldría es una
 * tarjeta con el título y un hueco en blanco, en la web pública.
 */
describe("las herramientas de la página para clubes", () => {
  const lista = TEXTOS.herramientas.lista as {
    clave: string;
    titulo: string;
    corto: string;
    texto: string;
  }[];

  it("siguen siendo doce", () => {
    // Escrito a mano a propósito: si alguien añade o quita una, que se
    // entere y mire si el resto sigue cuadrando.
    expect(lista).toHaveLength(12);
  });

  it("cada una tiene clave, título, línea corta y párrafo largo", () => {
    for (const h of lista) {
      expect(h.clave, "una herramienta sin clave").toBeTruthy();
      expect(h.titulo, `${h.clave}: sin título`).toBeTruthy();
      expect(h.corto, `${h.clave}: sin línea corta`).toBeTruthy();
      expect(h.texto, `${h.clave}: sin párrafo largo`).toBeTruthy();
    }
  });

  it("la línea corta es de verdad más corta que el párrafo", () => {
    // Si fueran iguales, abrir la tarjeta no enseñaría nada nuevo y el
    // desplegable sería un adorno que solo estorba.
    for (const h of lista) {
      expect(h.corto.length, `${h.clave}: corto y largo miden casi lo mismo`)
        .toBeLessThan(h.texto.length);
    }
  });

  it("la tarjeta enseña la corta y guarda la larga", () => {
    const bloque = SECCIONES.slice(SECCIONES.indexOf("export async function SeccionPanelYHerramientas"));
    expect(bloque).toContain("{herramienta.corto}");
    expect(bloque).toContain("{herramienta.texto}");
    expect(bloque).toContain("<details");
  });

  /**
   * La maqueta de las dos hojas es la única vez en toda la web que se
   * ve qué pinta tiene un dossier. Cuando la sección suelta del dossier
   * se quitó por repetir lo que ya decía esta herramienta, la maqueta
   * se mudó aquí dentro. Si alguien la borra, el argumento se queda sin
   * su única prueba visual.
   */
  it("la maqueta del dossier sigue en pie, y fuera del desplegable", () => {
    const bloque = SECCIONES.slice(SECCIONES.indexOf("export async function SeccionPanelYHerramientas"));
    expect(bloque).toContain("<HojaDeDossier pequena />");

    // Fuera del `<details>`: dentro, nadie la vería sin pulsar.
    const tarjeta = bloque.slice(0, bloque.indexOf("</div>\n          ))}"));
    expect(tarjeta.indexOf("</details>")).toBeLessThan(tarjeta.indexOf("<HojaDeDossier"));
  });
});

/**
 * El embudo: la misma lista con dos formas según el ancho.
 */
describe("el embudo de solicitudes", () => {
  it("no dice hacia dónde se mueve", () => {
    // En el teléfono las cuatro casillas van una debajo de otra, así
    // que "de izquierda a derecha" era falso justo donde más gente lo
    // lee. "Paso a paso" vale para las dos formas.
    expect(TEXTOS.embudo.comoSeLee).not.toContain("izquierda");
    expect(TEXTOS.embudo.comoSeLee).not.toContain("derecha");
  });

  it("sigue teniendo los cuatro estados y el descartado", () => {
    expect(TEXTOS.embudo.estados).toHaveLength(4);
    expect(TEXTOS.embudo.descartada).toBeTruthy();
    expect(TEXTOS.embudo.descartadaTexto).toBeTruthy();
    expect(TEXTOS.embudo.cierre).toBeTruthy();
  });

  it("es una sola lista que cambia de forma, no dos listas", () => {
    const bloque = SECCIONES.slice(
      SECCIONES.indexOf("export async function SeccionEmbudo"),
      SECCIONES.indexOf("export async function SeccionEmbudo") + 4000,
    );
    // Un solo `estadosEmbudo.map`: si hubiera dos, el texto estaría dos
    // veces en la página y habría que cambiar cada palabra dos veces.
    expect(bloque.split("estadosEmbudo.map").length - 1).toBe(1);
  });
});
