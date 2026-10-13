import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const RAIZ = join(process.cwd(), "src", "app", "[locale]");
const TARJETA = readFileSync(
  join(RAIZ, "panel", "oportunidades", "components", "TarjetaOportunidad.tsx"),
  "utf8",
);
const GESTOR = readFileSync(
  join(RAIZ, "panel", "oportunidades", "components", "OportunidadesManager.tsx"),
  "utf8",
);
const PAGINA = readFileSync(join(RAIZ, "panel", "oportunidades", "page.tsx"), "utf8");
const DATOS_PUBLICOS = readFileSync(join(RAIZ, "club", "[slug]", "data.ts"), "utf8");

/**
 * El botón "Visualizar" de cada oportunidad.
 *
 * Lleva a la página pública de esa oportunidad, la que ve una empresa.
 * Y esa página existe solo si se cumplen DOS cosas:
 *
 *   1. El club tiene ficha guardada, porque la dirección es
 *      `/club/<slug>/oportunidad/<id>` y sin `slug` no hay dirección.
 *   2. La oportunidad no está archivada: el listado público filtra por
 *      `archived_at is null`, así que una archivada no aparece y la
 *      página devuelve "no encontrado".
 *
 * Si se enseñara el botón sin comprobarlas, el club pulsaría y se
 * daría de bruces con una página de error en su propia web. Un botón
 * roto es peor que no tener botón, y además no falla en ninguna
 * prueba de compilación: es un enlace válido a una página que no
 * existe.
 */
describe("el botón de ver la oportunidad como la ve una empresa", () => {
  it("existe y abre en otra pestaña", () => {
    expect(TARJETA).toContain('t("visualizar")');
    expect(TARJETA).toContain('target="_blank"');
    expect(TARJETA).toContain('rel="noopener noreferrer"');
  });

  it("apunta a la página pública de esa oportunidad", () => {
    expect(TARJETA).toContain("/club/${slugDelClub}/oportunidad/${oportunidad.id}");
  });

  it("no se enseña sin ficha del club ni en las archivadas", () => {
    expect(TARJETA).toContain("{slugDelClub && !oportunidad.archivedAt && (");
  });

  /**
   * La condición de arriba solo vale si la de abajo sigue siendo
   * verdad. Si algún día el listado público dejara de filtrar las
   * archivadas, esta prueba avisa de que hay que volver a mirar el
   * botón —seguramente para quitarle esa condición—.
   */
  it("el listado público sigue dejando fuera las archivadas", () => {
    expect(DATOS_PUBLICOS).toContain('.is("archived_at", null)');
  });

  it("el slug llega desde la página hasta la tarjeta", () => {
    expect(PAGINA).toContain("slugDelClub={perfil?.slug ?? null}");
    expect(GESTOR).toContain("slugDelClub");
    expect(GESTOR).toContain("slugDelClub={slugDelClub}");
  });
});
