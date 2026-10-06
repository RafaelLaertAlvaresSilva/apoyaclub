import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const RAIZ = process.cwd();

function leer(...trozos: string[]): string {
  return readFileSync(join(RAIZ, ...trozos), "utf8");
}

const CABECERA = leer("src", "components", "Header.tsx");
const MENU_CABECERA = leer("src", "components", "MenuDeLaCabecera.tsx");
const MENU_PANEL = leer("src", "app", "[locale]", "panel", "components", "MenuDelPanel.tsx");
const DATOS = leer(
  "src",
  "app",
  "[locale]",
  "club",
  "[slug]",
  "components",
  "DatosDestacados.tsx",
);

/**
 * Tres cosas que se rompen sin dar ningún error: la salida de la
 * sesión, el menú del panel que no se puede bajar y la fila de datos
 * del club que se parte.
 */
describe("salir de la sesión desde las páginas públicas", () => {
  it("la cabecera la ofrece cuando hay sesión", () => {
    // Hasta ahora no había ninguna forma de cerrar sesión sin entrar al
    // panel: quien se quedaba en la portada no tenía salida.
    // `<CerrarSesionBoton` y no solo el nombre: con el nombre a secas
    // bastaba la línea del `import` para dar la prueba por buena,
    // aunque el botón no se pintara en ninguna parte.
    expect(CABECERA).toContain("<CerrarSesionBoton");
    // Y solo con sesión: a quien no ha entrado no se le ofrece salir.
    expect(CABECERA).toContain("{accesoDirecto && (");
  });

  it("en el teléfono está dentro del cajón, con el botón de entrar", () => {
    // En el teléfono el botón verde vive dentro del menú, así que su
    // pareja tiene que estar ahí también. Si se queda solo en la barra
    // con `hidden sm:block`, en el móvil no la ve nadie.
    expect(MENU_CABECERA).toContain("<CerrarSesionBoton");
    expect(MENU_CABECERA).toContain("sm:hidden");
  });
});

describe("el menú del panel", () => {
  it("se puede desplazar por dentro", () => {
    // Es `sticky`, así que no baja con la página. Con los cuatro grupos
    // y "Perfil del club" desplegado pasa de lo que mide una pantalla de
    // portátil, y sin esto las últimas opciones —incluida "Cerrar
    // sesión"— no hay forma de alcanzarlas.
    expect(MENU_PANEL).toContain("overflow-y-auto");
    expect(MENU_PANEL).toMatch(/max-h-\[calc\(100vh-/);
  });
});

describe("los datos destacados del club", () => {
  it("van en rejilla, no en una fila que se reparte sola", () => {
    // Con `flex`, cada tarjeta medía lo que medía su texto y la quinta
    // se descolgaba a una segunda fila, suelta y a media anchura.
    expect(DATOS).toContain("md:grid-cols-5");
    expect(DATOS).not.toContain("flex flex-wrap items-stretch");
  });

  it("en el teléfono el último dato no se queda solo a medias", () => {
    // Van de dos en dos: con cinco datos, el quinto ocuparía media fila
    // y dejaría un hueco al lado.
    expect(DATOS).toContain("col-span-2 md:col-span-1");
  });
});
