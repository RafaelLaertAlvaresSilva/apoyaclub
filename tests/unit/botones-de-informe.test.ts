import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const FUENTE = readFileSync(
  join(
    process.cwd(),
    "src",
    "app",
    "[locale]",
    "panel",
    "tareas",
    "components",
    "BotonInforme.tsx",
  ),
  "utf8",
);

/**
 * El archivo sin sus comentarios.
 *
 * Las comprobaciones de "aquí ya no aparece tal clase" miran el código,
 * no lo que se cuenta sobre él: el comentario que explica por qué se
 * quitó `shrink-0` contiene esas mismas letras.
 */
function sinComentarios(fuente: string): string {
  return fuente.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");
}

const CODIGO = sinComentarios(FUENTE);

/**
 * Los botones de descargar el informe.
 *
 * Lo que se protege aquí es lo que se acababa de arreglar: eran dos
 * pastillas grises de 26 px que no parecían un botón, y encima salían
 * de una manera en el aviso de arriba y de otra distinta en la lista de
 * tareas, siendo el mismo par de botones.
 */
describe("los botones del informe", () => {
  it("siguen siendo formularios que mandan al sitio de siempre", () => {
    // Si alguien los pasa a fetch, dejan de funcionar sin JavaScript y
    // hay que montar a mano la descarga. Son POST a propósito.
    expect(CODIGO).toContain('method="post" action="/panel/tareas/informe"');
    expect(CODIGO).toContain('formato="pdf"');
    expect(CODIGO).toContain('formato="word"');
    expect(CODIGO).toContain('name="formato"');
  });

  it("`compacto` cambia el tamaño, nunca el color", () => {
    // Este es EL fallo que había: el mismo par de botones se veía
    // relleno y grande en un sitio y gris y diminuto en el otro, así
    // que no se reconocían como lo mismo. El color se decide por
    // `principal` (PDF o Word) y el tamaño por `compacto`; si vuelven a
    // mezclarse, vuelve el problema.
    const tamano = CODIGO.match(/const tamano = compacto[\s\S]*?;/)?.[0] ?? "";
    const color = CODIGO.match(/const color = principal[\s\S]*?;/)?.[0] ?? "";

    expect(tamano, "no se encuentra la línea del tamaño").not.toBe("");
    expect(color, "no se encuentra la línea del color").not.toBe("");

    // El tamaño no decide colores.
    expect(tamano).not.toMatch(/\b(bg|text|border)-(teal|zinc|white)/);
    // Y el color no decide tamaños.
    expect(color).not.toMatch(/\b(px|py|text-(xs|sm|base)|gap)-/);
    // Y el color no mira si es compacto.
    expect(color).not.toContain("compacto");
  });

  it("el PDF manda y el Word acompaña", () => {
    // Relleno contra perfilado. Dos rellenos iguales obligarían a leer
    // para saber cuál es el que se le manda al patrocinador.
    expect(CODIGO).toContain("bg-brand-teal-dark text-sobre-color");
    expect(CODIGO).toContain("bg-white text-accion-tinta");
    expect(CODIGO).toContain("principal\n");
  });

  it("los dos miden igual", () => {
    // Medido: 42 px los dos en el aviso, 34 los dos en la lista. El
    // borde va en las clases comunes y el relleno lleva un borde de su
    // propio color; si se le quitara, saldría 2 px más bajo que el Word
    // y quedarían desalineados.
    expect(CODIGO).toMatch(/rounded-lg border /);
    expect(CODIGO).toContain("border-brand-teal-dark bg-brand-teal-dark");
    // El borde del relleno es de su propio color (invisible). Si fuera
    // de la TINTA, en oscuro saldría un contorno verde claro alrededor
    // del botón.
    const color = CODIGO.match(/const color = principal[\s\S]*?;/)?.[0] ?? "";
    expect(color).not.toMatch(/\bborder(?![-\w])/);
  });

  it("caben en un móvil", () => {
    // Con `shrink-0` los dos botones no podían encogerse ni bajar de
    // línea, y a 375 px se salían 75 px de la pantalla. Medido.
    expect(
      CODIGO,
      "ha vuelto shrink-0 y vuelven a salirse en el móvil",
    ).not.toContain("shrink-0");
    expect(CODIGO).toContain("flex flex-wrap items-center gap-2");
  });

  it("la flecha está dibujada, no escrita", () => {
    // Las flechas de texto (↓, ⬇) salen de otro tamaño en cada sistema
    // y en Windows a veces ni salen.
    expect(CODIGO).toContain("<svg");
    expect(CODIGO).toContain('aria-hidden="true"');
    expect(CODIGO).not.toMatch(/[↓⬇⇩🡇]/);
  });

  it("la flecha no se lee en voz alta y el botón sí", () => {
    // El icono es decoración: lo que tiene que oír quien usa un lector
    // es "Informe PDF", no "flecha hacia abajo Informe PDF".
    expect(CODIGO).toContain('aria-hidden="true"');
    expect(CODIGO).toContain("{etiqueta}");
    expect(CODIGO).toContain("title={titulo}");
  });
});
