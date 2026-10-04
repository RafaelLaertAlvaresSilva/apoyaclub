import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const RAIZ = process.cwd();

function leer(...trozos: string[]): string {
  return readFileSync(join(RAIZ, ...trozos), "utf8");
}

const FONDO = leer("src", "components", "FondoDeAcceso.tsx");
const LAYOUT_AUTH = leer("src", "app", "[locale]", "(auth)", "layout.tsx");
const ELEGIR = leer("src", "app", "[locale]", "registro", "page.tsx");

/**
 * La foto del pabellón va detrás de las pantallas de entrar y de darse
 * de alta.
 *
 * Son cuatro páginas que llegan por sitios distintos —/login,
 * /registro, /registro-club y /registro-empresa— y comparten el fondo
 * a través de dos archivos: el layout del grupo (auth) y la página de
 * la bifurcación, que vive fuera de ese grupo. Es fácil tocar uno y
 * olvidarse del otro, y entonces una de las cuatro se queda con el
 * gris de antes sin que nada falle.
 */
describe("el fondo de las pantallas de acceso", () => {
  it("lo pintan las dos partes que lo necesitan", () => {
    expect(LAYOUT_AUTH, "falta en /login, /registro-club y /registro-empresa").toContain(
      "<FondoDeAcceso />",
    );
    expect(ELEGIR, "falta en la bifurcación /registro").toContain("<FondoDeAcceso />");
  });

  it("el contenedor lo sujeta: sin `relative` la foto se iría a la ventana", () => {
    // `absolute inset-0` se posiciona respecto al primer antepasado
    // posicionado. Si el contenedor pierde `relative`, la foto se
    // estira sobre toda la ventana y tapa el pie y la cabecera.
    for (const [nombre, archivo] of [
      ["el layout de acceso", LAYOUT_AUTH],
      ["la bifurcación", ELEGIR],
    ] as const) {
      expect(archivo, `${nombre} no sujeta el fondo`).toContain("relative isolate");
    }
  });

  it("la foto va por detrás del formulario", () => {
    // Sin `-z-10` la capa del velo queda por encima de los campos y no
    // se puede escribir en ellos: se ven, pero no responden.
    expect(FONDO).toContain("-z-10");
    expect(FONDO).toContain("pointer-events-none");
  });

  it("se ve, no es un adorno apagado del todo", () => {
    // El velo por encima del 70 % deja la foto en nada y entonces son
    // 68 KB que se descargan para no enseñar nada.
    const velo = FONDO.match(/bg-white\/(\d+)/)?.[1];
    expect(velo, "no se encuentra el velo blanco").toBeDefined();
    expect(Number(velo)).toBeLessThanOrEqual(60);
  });

  it("la imagen existe en public", () => {
    expect(FONDO).toContain('src="/fondo-acceso.webp"');
    expect(() => readFileSync(join(RAIZ, "public", "fondo-acceso.webp"))).not.toThrow();
  });
});
