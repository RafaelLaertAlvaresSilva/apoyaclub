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
 * Las cuatro ventajas de la sección "La página de tu club".
 *
 * Esta sección pide sus textos con una clave compuesta:
 *
 *     t(`paginaClub.ventajas.${ventaja}.titulo`)
 *
 * y ahí está el agujero. La prueba que vigila los textos
 * (`i18n-claves`) busca `t("...")` con comillas, así que una clave
 * montada con acentos graves le pasa por delante sin que la vea. El
 * día que alguien añada una quinta ventaja a la lista y se olvide del
 * texto, no fallaría nada: saldría el nombre de la clave escrito en la
 * página, en mitad de la web pública.
 *
 * Es el mismo fallo que ya pasó con las categorías de ideas, que eran
 * catorce en los textos y dieciséis en el catálogo durante meses. Dos
 * listas separadas que se van separando más.
 *
 * Así que aquí se cruzan las tres: la lista del código, los iconos y
 * los textos tienen que decir lo mismo.
 */
describe("la sección de la página del club", () => {
  const lista = SECCIONES.match(/const VENTAJAS_DE_LA_PAGINA = \[([^\]]+)\]/);
  const ventajas = [...(lista?.[1] ?? "").matchAll(/"([^"]+)"/g)].map((m) => m[1]);

  // Sin esto, un cambio en la forma del archivo dejaría la lista vacía
  // y todo lo de abajo pasaría sin comprobar nada.
  it("encuentra las cuatro ventajas en el código", () => {
    expect(ventajas).toEqual(["visibilidad", "comunidad", "oportunidades", "gestion"]);
  });

  it("cada ventaja tiene su título y su texto escritos", () => {
    for (const ventaja of ventajas) {
      expect(TEXTOS.paginaClub?.ventajas?.[ventaja]?.titulo, `falta el título de ${ventaja}`)
        .toBeTruthy();
      expect(TEXTOS.paginaClub?.ventajas?.[ventaja]?.texto, `falta el texto de ${ventaja}`)
        .toBeTruthy();
    }
  });

  it("cada ventaja tiene su icono", () => {
    const mapa = SECCIONES.slice(
      SECCIONES.indexOf("const ICONO_DE_LA_VENTAJA"),
      SECCIONES.indexOf("const VENTAJAS_DE_LA_PAGINA"),
    );
    expect(mapa.length).toBeGreaterThan(200);

    const conIcono = [...mapa.matchAll(/^ {2}([a-z]+):/gm)].map((m) => m[1]);
    expect(conIcono.sort()).toEqual([...ventajas].sort());
  });

  it("no sobra ningún texto de ventajas sin su sitio en el código", () => {
    expect(Object.keys(TEXTOS.paginaClub.ventajas).sort()).toEqual([...ventajas].sort());
  });

  /**
   * La captura es una imagen con contenido, no un adorno: lleva el
   * nombre del club, su categoría y sus números. Sin `alt`, quien use
   * un lector de pantalla no se entera de que ahí hay una página.
   */
  it("la captura de la página lleva su descripción", () => {
    // Acotado al monitor, no al archivo entero. Mirando todo el
    // archivo, esta comprobación pasaba aunque se borrara el `alt` de
    // la captura: hay otro `alt={alt}` en otra sección, y bastaba con
    // que ese siguiera ahí. Una prueba que no puede fallar no es una
    // prueba.
    const monitor = SECCIONES.slice(SECCIONES.indexOf("function MonitorConLaPagina"));
    expect(monitor).toContain('src="/pagina-club-ejemplo.webp"');
    expect(monitor).toContain("alt={alt}");
    expect(TEXTOS.paginaClub.maqueta.alt.length).toBeGreaterThan(40);
  });

  /**
   * La foto de fondo no aporta información: es decoración, y si un
   * lector de pantalla la anuncia solo molesta.
   */
  it("la foto de fondo no se anuncia", () => {
    const fondo = SECCIONES.slice(
      SECCIONES.indexOf("function FondoDeLaPaginaDelClub"),
      SECCIONES.indexOf("export async function SeccionPaginaClub"),
    );
    expect(fondo).toContain('aria-hidden="true"');
    expect(fondo).toContain('src="/fondo-pagina-club.webp"');
    expect(fondo).toContain('alt=""');
  });
});
