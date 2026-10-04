import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const RAIZ = process.cwd();

function leer(...trozos: string[]): string {
  return readFileSync(join(RAIZ, ...trozos), "utf8");
}

const CABECERA = leer("src", "components", "Header.tsx");
const MENU_MOVIL = leer("src", "components", "MenuMovil.tsx");
const ELEGIR = leer("src", "app", "[locale]", "registro", "page.tsx");
const FORM_CLUB = leer(
  "src",
  "app",
  "[locale]",
  "(auth)",
  "registro-club",
  "RegistroClubForm.tsx",
);
const FORM_EMPRESA = leer(
  "src",
  "app",
  "[locale]",
  "(auth)",
  "registro-empresa",
  "RegistroEmpresaForm.tsx",
);
const SITEMAP = leer("src", "app", "sitemap.ts");

/**
 * El alta tiene dos puertas y el botón de la cabecera iba derecho a
 * una.
 *
 * El botón verde está en todas las páginas, también en /para-empresas.
 * Llevaba a /registro-club, así que una empresa que quería darse de
 * alta acababa en un formulario que le pedía el nombre de su club y le
 * hablaba de 29,90 €/mes. Su registro existía, pero estaba al final de
 * la página.
 *
 * Esto se rompe en silencio: nadie programa mirando la web como si
 * fuera una empresa, y el fallo no da ningún error.
 */
describe("elegir club o empresa al registrarse", () => {
  it("el botón de la cabecera pregunta en vez de decidir", () => {
    expect(CABECERA).toContain('href="/registro"');
    expect(CABECERA, "la cabecera vuelve a llevar derecho al alta de club").not.toContain(
      'href="/registro-club"',
    );
  });

  it("el menú del teléfono hace lo mismo", () => {
    expect(MENU_MOVIL).toContain('href="/registro"');
    expect(MENU_MOVIL).not.toContain('href="/registro-club"');
  });

  it("la bifurcación ofrece las dos puertas", () => {
    expect(ELEGIR).toContain('href: "/registro-club"');
    expect(ELEGIR).toContain('href: "/registro-empresa"');
  });

  it("cada formulario deja salir al otro", () => {
    // El de la empresa lo tuvo desde el principio; el del club se quedó
    // con el texto traducido y sin pintar, y nadie se dio cuenta
    // porque el texto sí existía.
    expect(FORM_CLUB, "el formulario del club no deja ir al de la empresa").toContain(
      'href="/registro-empresa"',
    );
    expect(FORM_EMPRESA, "el formulario de la empresa no deja ir al del club").toContain(
      'href="/registro-club"',
    );
  });

  it("google ve las tres direcciones", () => {
    for (const ruta of ["/registro", "/registro-club", "/registro-empresa"]) {
      expect(SITEMAP, `falta ${ruta} en el sitemap`).toContain(`ruta: "${ruta}"`);
    }
  });
});
