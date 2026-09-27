import { describe, expect, it } from "vitest";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

const RAIZ = join(process.cwd(), "src");
const PANEL = join(RAIZ, "app", "[locale]", "panel");

function leer(...trozos: string[]): string {
  return readFileSync(join(...trozos), "utf8");
}

/** Todos los archivos bajo `raiz` cuyo nombre termine en `final`. */
function buscar(raiz: string, final: string, prefijo = ""): string[] {
  const encontrados: string[] = [];
  for (const entrada of readdirSync(join(raiz, prefijo), { withFileTypes: true })) {
    const relativa = prefijo ? join(prefijo, entrada.name) : entrada.name;
    if (entrada.isDirectory()) encontrados.push(...buscar(raiz, final, relativa));
    else if (entrada.name.endsWith(final)) encontrados.push(relativa);
  }
  return encontrados;
}

const MENU = leer(PANEL, "components", "MenuDelPanel.tsx");

/**
 * El menú del panel se pinta una sola vez, desde el layout, y deduce
 * qué sección está abierta mirando la dirección. Antes cada página lo
 * ponía por su cuenta y decía la suya a mano; bastaba con copiar una
 * página y olvidarse de cambiar esa palabra para que el menú señalara
 * a otro sitio, sin que nada lo avisara.
 */
describe("el menú del panel", () => {
  const destinos = [...MENU.matchAll(/href: "([^"]+)"/g)].map((m) => m[1]);

  // Sin esto, un cambio que rompiera la forma del archivo dejaría la
  // lista vacía y las comprobaciones de abajo pasarían sin mirar nada.
  it("encuentra los doce destinos del menú", () => {
    expect(destinos).toHaveLength(12);
  });

  it("todos sus enlaces llevan a una página que existe", () => {
    for (const destino of destinos) {
      const relativa = destino.replace(/^\/panel\/?/, "");
      const carpeta = relativa === "" ? PANEL : join(PANEL, relativa);
      expect(() => leer(carpeta, "page.tsx"), `${destino} no existe`).not.toThrow();
    }
  });

  it("no se repite ningún destino", () => {
    expect(new Set(destinos).size).toBe(destinos.length);
  });

  it("lleva los cuatro apartados, y ninguno se queda con un solo enlace", () => {
    const titulos = [...MENU.matchAll(/titulo: "([^"]+)"/g)].map((m) => m[1]);
    expect(titulos).toEqual([
      "Mi club",
      "Buscar patrocinadores",
      "Seguimiento",
      "Cuenta",
    ]);
  });

  it("se pinta desde el layout, no desde cada página", () => {
    expect(leer(PANEL, "layout.tsx")).toContain("<PanelNav");

    // Cualquier página que se lo vuelva a poner duplicaría el menú.
    for (const pagina of buscar(PANEL, "page.tsx")) {
      expect(leer(PANEL, pagina), `${pagina} pinta el menú otra vez`).not.toContain("<PanelNav");
    }
  });
});

/**
 * El formulario del club vive en `/panel/perfil` desde que se separó
 * de la portada. Los enlaces con ancla que llevan a una de sus
 * pestañas ("te falta rellenar la historia") tienen que apuntar ahí:
 * contra `/panel` a secas caen en la portada y al pulsarlos no pasa
 * nada, que es el fallo más silencioso que hay.
 */
describe("los enlaces a las pestañas de la ficha", () => {
  it("ninguno apunta ya a la portada del panel", () => {
    const sospechosos: string[] = [];

    for (const archivo of [...buscar(RAIZ, ".ts"), ...buscar(RAIZ, ".tsx")]) {
      if (leer(RAIZ, archivo).includes('"/panel#')) sospechosos.push(archivo);
    }

    expect(sospechosos).toEqual([]);
  });
});
