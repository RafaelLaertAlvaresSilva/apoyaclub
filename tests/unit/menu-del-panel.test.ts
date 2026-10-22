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
  it("encuentra los catorce destinos del menú", () => {
    // Trece desde que "Renovaciones" entró en Seguimiento (migración
    // 0050), y catorce con "Público → Apuntar un partido". Este número
    // está escrito a mano a propósito: si alguien añade o quita un
    // apartado, esta prueba se lo recuerda y le hace mirar las de abajo,
    // que son las que de verdad comprueban algo.
    expect(destinos).toHaveLength(14);
  });

  it("todos sus enlaces llevan a una página que existe", () => {
    for (const destino of destinos) {
      // Sin el ancla: "/panel/publico#apuntar" es la página de Público.
      const relativa = destino.replace(/#.*$/, "").replace(/^\/panel\/?/, "");
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
 * Las ocho secciones de la ficha cuelgan de "Perfil del club" en este
 * mismo menú. Si el formulario vuelve a montar el suyo, quedan dos
 * columnas de menú una al lado de la otra y el formulario se queda sin
 * ancho.
 */
describe("las secciones de la ficha", () => {
  const TABS = leer(PANEL, "components", "PanelTabs.tsx");

  it("las pinta el menú, no el formulario", () => {
    expect(MENU).toContain("SECCIONES_DE_LA_FICHA");
    expect(TABS).not.toContain("SECCIONES_DE_LA_FICHA");
    expect(TABS).not.toContain("<nav");
  });

  it("el menú avisa de los cambios sin guardar antes de cambiar", () => {
    expect(MENU).toContain("sePuedeSalir()");
    expect(TABS).toContain("registrarGuardia(");
  });

  it("el menú no arrastra los formularios de la ficha", () => {
    // Importar la lista desde `PanelTabs` metía sus ocho formularios en
    // el paquete de todas las páginas del panel.
    expect(MENU).not.toContain('from "./PanelTabs"');
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

/**
 * La flecha que abre las secciones de la ficha.
 *
 * Era el carácter "▾" a 12 px. Dos problemas, y los dos del mismo
 * tipo que el de las banderas de "El sector, en cifras": un símbolo
 * escrito como texto lo dibuja cada sistema a su manera, y en Windows
 * ese se queda tan pequeño que parece un punto. Además, 12 px de
 * carácter no son una zona que se pueda acertar con el dedo.
 *
 * Ahora es un icono dibujado dentro de un botón de 32 px. Esta prueba
 * está para que no se vuelva a escribir como texto.
 */
describe("la flecha de las secciones de la ficha", () => {
  const boton = MENU.slice(
    MENU.indexOf('aria-label={'),
    MENU.indexOf("</button>", MENU.indexOf('aria-label={')),
  );

  it("encuentra el botón", () => {
    // El texto está en los mensajes (panel.menu.verSeccionesFicha).
    expect(boton).toContain("SeccionesFicha");
  });

  it("es un icono dibujado y no un carácter de texto", () => {
    expect(boton).toContain("<svg");

    // Sin los comentarios: el que explica por qué se quitó el carácter
    // lo contiene, y sin esto la prueba se caía por su propia
    // explicación.
    const codigo = boton.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");
    expect(codigo).not.toContain("▾");
    expect(codigo).not.toContain("▴");
  });

  it("el botón mide lo bastante para acertarlo con el dedo", () => {
    expect(boton).toContain("h-8 w-8");
  });

  it("la flecha gira al abrirse, para decir en qué estado está", () => {
    expect(boton).toContain("rotate-180");
  });
});
