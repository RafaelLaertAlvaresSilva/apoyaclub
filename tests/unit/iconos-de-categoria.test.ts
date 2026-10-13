import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { CATEGORIAS_CON_SIMBOLO } from "@/components/IconoDeCategoria";
import { CATEGORIAS_IDEA } from "@/lib/catalogo-ideas";

/**
 * Un símbolo por categoría, y el mismo en los dos sitios.
 *
 * ESTE FALLO NO AVISA. Si se añade una categoría al catálogo y no se
 * le dibuja símbolo, `IconoDeCategoria` recurre a un círculo genérico:
 * no falla nada, no sale ningún error, y en la web aparece una
 * categoría con una pelota gris al lado mientras las otras quince
 * tienen su dibujo. Nadie lo ve hasta que lo ve un club.
 *
 * Es el mismo fallo que ya pasó con la lista de categorías, que estuvo
 * meses siendo de catorce en los textos y de dieciséis en el catálogo.
 */
describe("los símbolos de las categorías", () => {
  it("hay exactamente uno por categoría del catálogo", () => {
    const delCatalogo = CATEGORIAS_IDEA.map((c) => c.id).sort();
    expect(CATEGORIAS_CON_SIMBOLO.slice().sort()).toEqual(delCatalogo);
  });

  it("siguen siendo dieciséis", () => {
    // A mano a propósito: si alguien añade o quita una, que se entere.
    expect(CATEGORIAS_IDEA).toHaveLength(16);
  });
});

/**
 * Y que los dos sitios lo pidan al mismo sitio.
 *
 * Copiar los dibujos es lo fácil, y es justo lo que no puede pasar: el
 * día que alguien cambie el de "Retransmisiones" lo cambiaría en un
 * sitio y no en el otro, y el club vería un símbolo en la página
 * pública y otro distinto en su panel para lo mismo.
 */
describe("de dónde salen los símbolos", () => {
  const RAIZ = process.cwd();
  const PUBLICA = readFileSync(
    join(RAIZ, "src", "app", "[locale]", "components", "QuePuedesOfrecer.tsx"),
    "utf8",
  );
  const PANEL = readFileSync(
    join(RAIZ, "src", "app", "[locale]", "panel", "oportunidades", "components", "CatalogoDeIdeas.tsx"),
    "utf8",
  );

  it.each([
    ["la rejilla de la página pública", () => PUBLICA],
    ["las pastillas del panel", () => PANEL],
  ])("%s usa el componente común", (_, leer) => {
    const archivo = leer();
    expect(archivo).toContain('from "@/components/IconoDeCategoria"');
    expect(archivo).toContain("<IconoDeCategoria");
  });

  it.each([
    ["la rejilla de la página pública", () => PUBLICA],
    ["las pastillas del panel", () => PANEL],
  ])("%s no tiene dibujos propios copiados", (_, leer) => {
    // Un `<path d="…">` suelto aquí significa que alguien volvió a
    // pegar los dibujos en vez de pedirlos al componente común.
    expect(leer()).not.toMatch(/<path\s+d="/);
  });
});
