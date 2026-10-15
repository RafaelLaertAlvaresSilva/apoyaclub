import { describe, expect, it } from "vitest";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

const RAIZ = process.cwd();
const CSS = readFileSync(join(RAIZ, "src", "app", "globals.css"), "utf8");
const LAYOUT_PANEL = readFileSync(
  join(RAIZ, "src", "app", "[locale]", "panel", "layout.tsx"),
  "utf8",
);

type Fichero = { ruta: string; texto: string };

/** Todos los .tsx de src, recorriendo las carpetas a mano.
 *
 * Con un patrón no vale: los corchetes de `[locale]` significan "una
 * letra cualquiera de entre l, o, c, a, e", así que no encontraba un
 * solo archivo del panel y las pruebas pasaban por estar vacías. */
function recorrer(directorio: string, acumulado: Fichero[] = []): Fichero[] {
  for (const entrada of readdirSync(directorio)) {
    const ruta = join(directorio, entrada);
    if (statSync(ruta).isDirectory()) recorrer(ruta, acumulado);
    else if (entrada.endsWith(".tsx")) {
      acumulado.push({
        ruta: ruta.slice(RAIZ.length + 1).replace(/\\/g, "/"),
        texto: readFileSync(ruta, "utf8"),
      });
    }
  }
  return acumulado;
}

const TSX_TODO: Fichero[] = recorrer(join(RAIZ, "src"));
const TSX_PANEL: Fichero[] = TSX_TODO.filter((f) => f.ruta.includes("/panel/"));

/** El bloque oscuro, para mirar dentro de él y no en todo el fichero. */
const BLOQUE_OSCURO =
  CSS.match(
    /html\[data-tema-panel="oscuro"\] \.tema-panel \{[\s\S]*?\n\}\n/,
  )?.[0] ?? "";

/**
 * El modo oscuro del panel.
 *
 * Casi todo lo que puede romperse aquí se rompe EN SILENCIO: un color
 * escrito a mano que no se entera de que hay dos temas, un `text-white`
 * que vuelve y se pone gris encima de un botón verde, o el tema
 * escapándose a la página pública del club, que tiene que seguir clara
 * porque es lo que ve una empresa. Nada de eso da un error.
 */
describe("el tema oscuro existe y está acotado al panel", () => {
  it("se enciende con el ajuste del sistema", () => {
    // Ya no lo decide el CSS: lo decide el guion, que mira el ajuste
    // del sistema Y la elección guardada del club.
    const guion = readFileSync(
      join(
        RAIZ,
        "src",
        "app",
        "[locale]",
        "panel",
        "components",
        "GuionDelTema.tsx",
      ),
      "utf8",
    );
    expect(guion).toContain("prefers-color-scheme: dark");
    expect(BLOQUE_OSCURO, "no se encuentra el bloque oscuro").not.toBe("");
    expect(BLOQUE_OSCURO).toContain(".tema-panel");
  });

  it("la envoltura está en el panel y SOLO en el panel", () => {
    expect(LAYOUT_PANEL).toContain('className="tema-panel');

    const fuera = TSX_TODO.filter(
      (f) => f.texto.includes("tema-panel") && !f.ruta.includes("/panel/"),
    ).map((f) => f.ruta);
    expect(
      fuera,
      `el tema se ha escapado fuera del panel: ${fuera.join(", ")}`,
    ).toHaveLength(0);
  });

  it("pone color-scheme para lo que pinta el navegador", () => {
    // Sin esto, abrir un desplegable o un calendario es un fogonazo
    // blanco en medio de la pantalla oscura.
    // Con `toContain` esta prueba no servía: la propia línea del
    // @media dice "prefers-color-scheme: dark", que contiene esas
    // letras, así que pasaba aunque se borrara la declaración.
    expect(BLOQUE_OSCURO).toMatch(/\n\s*color-scheme: dark;/);
  });

  it("cambia el color del texto heredado", () => {
    // Un `<input>` no lleva clase de color: hereda la del body, que la
    // pone el layout de toda la web y es oscura. Sin esta línea, lo que
    // escribe el club en un campo es invisible. Medido: con ella, 15,8
    // de contraste; sin ella, 1,3.
    expect(BLOQUE_OSCURO, "vuelve el texto invisible en los campos").toMatch(
      /\n\s*color: var\(--gris-900\);/,
    );
  });
});

describe("las tarjetas no son blancas", () => {
  it("la superficie del panel se oscurece", () => {
    // ESTO es el modo oscuro. Si `--superficie` se queda en blanco, la
    // pantalla emite un 54 % de luz en vez de un 10 % (medido) y encima
    // pega blanco puro contra negro puro, que es lo que hace vibrar las
    // letras. Sería peor que no tener modo oscuro.
    const superficie = BLOQUE_OSCURO.match(
      /--superficie:\s*oklch\(([\d.]+)%/,
    )?.[1];
    expect(superficie, "--superficie no se redefine en oscuro").toBeDefined();
    expect(Number(superficie)).toBeLessThan(35);
  });

  it("la tarjeta es más clara que el fondo, que es como se destaca", () => {
    const lienzo = Number(
      BLOQUE_OSCURO.match(/--lienzo:\s*oklch\(([\d.]+)%/)?.[1],
    );
    const superficie = Number(
      BLOQUE_OSCURO.match(/--superficie:\s*oklch\(([\d.]+)%/)?.[1],
    );
    expect(superficie).toBeGreaterThan(lienzo);
  });
});

describe("la tinta y la superficie siguen separadas", () => {
  it("no ha vuelto ningún text-white", () => {
    // `text-white` y `bg-white` son el mismo color para el navegador.
    // Uno va ENCIMA de un botón verde y tiene que seguir siendo blanco;
    // el otro es la tarjeta y tiene que volverse carbón.
    const culpables = TSX_TODO.filter((f) =>
      /(?<![\w-])text-white(?![\w-])/.test(f.texto),
    ).map((f) => f.ruta);
    expect(
      culpables,
      `usan text-white en vez de text-sobre-color: ${culpables.join(", ")}`,
    ).toHaveLength(0);
  });

  it("los botones sólidos no usan la escala de color", () => {
    // `bg-teal-700` era el fondo de 38 botones Y el color de 55 textos.
    // Al aclarar el verde para los textos, los botones se quedaban en
    // verde pálido con letras blancas.
    for (const clase of [
      "bg-teal-700",
      "bg-teal-800",
      "bg-red-600",
      "bg-red-700",
    ]) {
      const culpables = TSX_TODO.filter((f) =>
        new RegExp(`(?<![\\w-])${clase}(?![\\w-])`).test(f.texto),
      ).map((f) => f.ruta);
      expect(
        culpables,
        `${clase} debe ser un token sólido: ${culpables.join(", ")}`,
      ).toHaveLength(0);
    }
  });

  it("no vuelve el texto blanco sobre ámbar", () => {
    // Estuvo publicado: 2,1:1 de contraste, ilegible.
    const culpables = TSX_TODO.filter((f) =>
      /bg-amber-[56]00[^"'`]*text-sobre-color|text-sobre-color[^"'`]*bg-amber-[56]00/.test(
        f.texto,
      ),
    ).map((f) => f.ruta);
    expect(
      culpables,
      `blanco sobre ámbar: ${culpables.join(", ")}`,
    ).toHaveLength(0);
  });

  it("los colores sólidos están definidos en los dos temas", () => {
    for (const token of [
      "--accion",
      "--accion-fuerte",
      "--peligro",
      "--aviso",
      "--sobre-aviso",
      "--placa",
    ]) {
      expect(CSS, `${token} sin valor de partida`).toMatch(
        new RegExp(`${token}:\\s*[^;]+;`),
      );
      expect(BLOQUE_OSCURO, `${token} no se redefine en oscuro`).toContain(
        `${token}:`,
      );
    }
    // El blanco de encima de los botones NO se redefine nunca.
    expect(
      BLOQUE_OSCURO,
      "--sobre-color no puede cambiar en oscuro",
    ).not.toMatch(/--sobre-color:/);
  });
});

describe("los logos de los clubes se siguen viendo", () => {
  it("van sobre una placa que no se invierte", () => {
    // Los suben los clubes y muchos son letras negras sobre
    // transparente: sobre una tarjeta oscura desaparecen del todo, y
    // el archivo es del usuario, así que no hay nada que arreglar ahí.
    const conLogo = TSX_PANEL.filter((f) => /src=\{[^}]*logoUrl/.test(f.texto));
    expect(
      conLogo.length,
      "no se encuentra ningún logo en el panel",
    ).toBeGreaterThan(0);
    for (const f of conLogo) {
      expect(f.texto, `${f.ruta} pinta un logo sin placa`).toContain(
        "bg-placa",
      );
    }
  });

  it("la placa sigue siendo clara en oscuro", () => {
    const placa = Number(
      BLOQUE_OSCURO.match(/--placa:\s*oklch\(([\d.]+)%/)?.[1],
    );
    expect(placa, "--placa no se define en oscuro").toBeGreaterThan(85);
    // Pero no blanco puro: un cuadrado de blanco puro sobre carbón pica.
    expect(placa).toBeLessThan(99);
  });
});

describe("el modo claro no se ha movido", () => {
  it("los grises de partida siguen siendo los de Tailwind", () => {
    // Comprobado también contra un Tailwind de fábrica: 37 de 40
    // colores idénticos, y los 3 que no ya los cambiaba el proyecto
    // antes (--lienzo y compañía).
    expect(CSS).toContain("--gris-900: oklch(21% 0.006 285.885)");
    expect(CSS).toContain("--gris-500: oklch(55.2% 0.016 285.938)");
    expect(CSS).toContain("--verde-700: oklch(51.1% 0.096 186.391)");
    expect(CSS).toContain("--rojo-600: oklch(57.7% 0.245 27.325)");
  });

  it("los botones de partida valen lo mismo que antes", () => {
    expect(CSS).toContain("--accion: #0f766e");
    expect(CSS).toContain("--accion-fuerte: #115e59");
    expect(CSS).toContain("--peligro: #dc2626");
    expect(CSS).toContain("--sobre-color: #fff");
  });
});
