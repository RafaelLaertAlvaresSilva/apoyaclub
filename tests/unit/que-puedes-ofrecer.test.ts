import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { CATEGORIAS_IDEA } from "@/lib/catalogo-ideas";

const RAIZ = process.cwd();

const COMPONENTE = readFileSync(
  join(RAIZ, "src", "app", "[locale]", "components", "QuePuedesOfrecer.tsx"),
  "utf8",
);
const SECCIONES = readFileSync(
  join(RAIZ, "src", "app", "[locale]", "components", "secciones.tsx"),
  "utf8",
);
const HOME = JSON.parse(readFileSync(join(RAIZ, "messages", "es", "home.json"), "utf8")) as {
  ofrece: Record<string, unknown>;
};

/**
 * "Qué puedes ofrecer": las categorías salen del catálogo, no de una
 * lista escrita a mano.
 *
 * Esto es el arreglo de un fallo que estuvo meses publicado sin que
 * nadie lo viera. La sección pintaba una lista de catorce nombres
 * escrita a mano en `home.json`, mientras `CATEGORIAS_IDEA` tenía
 * dieciséis: faltaban "Digital" y "Retransmisiones", y otras dos
 * estaban escritas distinto ("Familias" por "Familias y socios",
 * "Servicios" por "Lo que necesitas").
 *
 * No fallaba nada porque no eran la misma lista. Ese es justo el tipo
 * de error que una prueba tiene que coger: el que no da ningún síntoma.
 */
describe("qué puede ofrecer un club", () => {
  it("las pastillas salen del catálogo", () => {
    expect(COMPONENTE).toContain("CATEGORIAS_IDEA.map");
  });

  it("no queda una lista paralela escrita a mano", () => {
    // Si vuelve `ofrece.tarjetas`, vuelve el problema: dos listas que
    // se van separando sola cada vez que se toca una.
    expect(HOME.ofrece.tarjetas, "ha vuelto la lista a mano en home.json").toBeUndefined();
    expect(SECCIONES).not.toContain('t.raw("ofrece.tarjetas")');
  });

  it("cada pastilla pide su icono al componente común", () => {
    // Los dibujos ya no viven aquí: están en
    // `src/components/IconoDeCategoria.tsx`, porque el panel pinta los
    // mismos. Que haya uno por categoría lo comprueba
    // `tests/unit/iconos-de-categoria.test.ts`, que lo mira contra la
    // lista que exporta el componente en vez de rebuscar en el código.
    //
    // Lo que se comprueba aquí es que esta sección siga pidiéndoselos a
    // él: si alguien vuelve a pegar los dibujos en este archivo, el día
    // que se cambie uno se cambiaría solo en un sitio.
    expect(COMPONENTE).toContain('from "@/components/IconoDeCategoria"');
    expect(COMPONENTE).toContain("<IconoDeCategoria categoria={");
    expect(COMPONENTE, "han vuelto los dibujos a este archivo").not.toMatch(/<path\s+d="/);
  });

  it("todas las categorías tienen pista que enseñar", () => {
    for (const categoria of CATEGORIAS_IDEA) {
      expect(categoria.pista.length, `"${categoria.id}" sin pista`).toBeGreaterThan(20);
    }
  });

  it("se abre con el ratón, con el teclado y con el dedo", () => {
    expect(COMPONENTE).toContain("group-hover:opacity-100");
    expect(COMPONENTE).toContain("group-focus-within:opacity-100");
    expect(COMPONENTE).toContain("setAbierta");
  });

  it("al tocar no se cambia de página", () => {
    // Lo pidió el usuario explícitamente. Un botón no navega; un enlace
    // sí, y basta con cambiar una etiqueta para romperlo.
    expect(COMPONENTE).toContain('type="button"');
    expect(COMPONENTE, "ha aparecido un enlace donde había un botón").not.toContain("<Link");
  });
});
