import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const RAIZ = join(process.cwd(), "src", "components");

function leer(archivo: string): string {
  return readFileSync(join(RAIZ, archivo), "utf8");
}

const CABECERA = leer("Header.tsx");
const MENU = leer("MenuMovil.tsx");

/**
 * En el teléfono la cabecera se reduce al logo y un botón de tres
 * líneas: todo lo demás vive dentro del cajón.
 *
 * El riesgo de esta forma es silencioso. Un enlace nuevo en
 * `ENLACES_DE_VISITA` sale solo en el ordenador y en el cajón, porque
 * los dos recorren la misma lista; pero los botones de la cuenta
 * —entrar y crear la página— están escritos dos veces, una en cada
 * sitio, porque en el ordenador son botones de la barra y en el móvil
 * son filas del cajón. Quitar uno de los dos no rompe nada: la página
 * compila, los tipos pasan y el botón simplemente desaparece de los
 * teléfonos, que es donde está casi todo el tráfico y donde nadie mira
 * mientras programa.
 */
describe("el menú del teléfono", () => {
  // Sin esto, un cambio que rompiera la forma del archivo dejaría las
  // comprobaciones de abajo pasando sobre una lista vacía.
  it("la cabecera tiene sus enlaces de visita", () => {
    const enlaces = [...CABECERA.matchAll(/href: "([^"]+)"/g)].map((m) => m[1]);
    expect(enlaces.length).toBeGreaterThanOrEqual(3);
  });

  it("lleva dentro todo lo que ya no cabe arriba", () => {
    // Los tres de la navegación llegan por la lista que le pasa la
    // cabecera; estos cuatro están escritos dentro del cajón.
    for (const destino of ["/favoritos", "/registro-club", "/login"]) {
      expect(MENU, `falta ${destino} en el cajón del móvil`).toContain(`href="${destino}"`);
    }
  });

  it("destaca buscar clubes", () => {
    // Si alguien renombra la ruta del buscador, el `find` devuelve
    // `null`, el bloque verde desaparece sin avisar y "Buscar clubes"
    // se queda como una fila gris más.
    expect(MENU).toContain('enlace.href === "/buscar"');
    expect(CABECERA).toContain('href: "/buscar"');
  });

  it("esconde en el móvil lo que ya está dentro del cajón", () => {
    // El botón de crear la página y el de iniciar sesión siguen en la
    // barra para el ordenador. Si pierden el `hidden xl:`, en el
    // teléfono salen las dos cosas a la vez.
    expect(CABECERA).toContain('<span className="hidden xl:block">');
    expect(CABECERA).toContain('hidden xl:inline ${CLASES_UTILIDAD}');
  });

  it("no deja la segunda fila de enlaces que había antes", () => {
    // La tira que se desplazaba en horizontal bajo el logo. Si vuelve,
    // el teléfono acaba con el menú y la tira a la vez.
    expect(CABECERA).not.toContain("overflow-x-auto");
  });

  it("cierra el cajón al cambiar de página", () => {
    // Al volver atrás con el botón del navegador no hay ninguna
    // pulsación que lo cierre, y se queda abierto encima de la página
    // nueva.
    expect(MENU).toContain("rutaPintada");
    expect(MENU).toContain("setAbierto(false)");
  });
});
