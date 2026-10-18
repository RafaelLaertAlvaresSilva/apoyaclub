import { logosDelIdioma } from "@/lib/logos";
import { describe, expect, it } from "vitest";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

const RAIZ = process.cwd();
const l = (...p: string[]) => readFileSync(join(RAIZ, ...p), "utf8");

const GUION = l(
  "src",
  "app",
  "[locale]",
  "panel",
  "components",
  "GuionDelTema.tsx",
);
const INTERRUPTOR = l(
  "src",
  "app",
  "[locale]",
  "panel",
  "components",
  "InterruptorDeTema.tsx",
);
const RAIZ_LAYOUT = l("src", "app", "[locale]", "layout.tsx");
const BARRA = l("src", "components", "BarraLogo.tsx");
const CABECERA = l("src", "components", "Header.tsx");
const CSS = l("src", "app", "globals.css");

/** El archivo sin sus comentarios.
 *
 * El propio componente explica en un comentario por qué NO usa ☀ ni ☾,
 * así que la prueba de "no hay caracteres de estos" se caía por su
 * propia explicación. */
function sinComentarios(fuente: string): string {
  return fuente.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");
}

/**
 * El interruptor del modo oscuro.
 *
 * Casi todo lo que puede romperse aquí se rompe en silencio, y lo
 * descubriría el club antes que nosotros.
 */
describe("el interruptor del tema", () => {
  it("el guion corre antes de que React tome el control", () => {
    // Si esto pasara a ser un componente normal, el club vería la
    // pantalla clara y medio segundo después el panel oscuro, cada vez
    // que entra, y justo de noche.
    expect(GUION).toContain("dangerouslySetInnerHTML");
  });

  it("el guion está en el esqueleto de la web, no dentro del panel", () => {
    // Dentro del panel quedaba demasiado abajo en el HTML: el navegador
    // llegaba a pintar el fondo claro antes de ejecutarlo.
    expect(RAIZ_LAYOUT).toContain("<GuionDelTema />");
    const panel = l("src", "app", "[locale]", "panel", "layout.tsx");
    expect(panel, "no puede estar en los dos sitios").not.toContain(
      "<GuionDelTema",
    );
  });

  it("y por eso lleva candado: fuera del panel no toca nada", () => {
    // Vive en el esqueleto de TODA la web. Sin esta comprobación, la
    // portada y la página pública de los clubes se volverían oscuras
    // para quien tenga el móvil en modo oscuro, y esas tienen que
    // quedarse claras: las lee una empresa.
    expect(GUION, "falta el candado de la ruta").toContain("location.pathname");
    expect(GUION).toMatch(/panel\(/);
    // Y el candado va ANTES de tocar el <html>.
    const cuerpo = GUION.slice(GUION.indexOf("const GUION"));
    expect(cuerpo.indexOf("location.pathname")).toBeLessThan(
      cuerpo.indexOf("dataset.temaPanel"),
    );
  });

  it("no se cae si el navegador no deja guardar", () => {
    // En navegación privada o con las cookies bloqueadas,
    // `localStorage` lanza. Sin el try, el panel se queda en blanco.
    expect(GUION).toContain("try");
    expect(GUION).toContain("catch");
    expect(INTERRUPTOR).toMatch(/try \{\s*localStorage\.setItem/);
  });

  it("limpia al salir del panel", () => {
    // El atributo vive en el <html>, que es el mismo para toda la web.
    // Al darle a "Volver a la portada" Next no recarga: sin limpiar,
    // la portada heredaba el fondo oscuro.
    expect(GUION).toContain("export function olvidarTema");
    expect(INTERRUPTOR).toContain("olvidarTema()");
  });

  it("vuelve a aplicarse al entrar sin recargar", () => {
    // React no ejecuta los <script> que inserta él: llegando al panel
    // desde otra página, el guion no se ejecuta.
    expect(GUION).toContain("export function aplicarTema");
    expect(INTERRUPTOR).toContain("aplicarTema()");
  });

  it("el rótulo del botón no lo decide React", () => {
    // Con un estado, el botón diría "Modo oscuro" medio segundo en una
    // pantalla que ya está oscura: el servidor no sabe qué tiene
    // guardado este navegador. Se pintan los dos y manda el CSS.
    expect(INTERRUPTOR).toContain("solo-tema-claro");
    expect(INTERRUPTOR).toContain("solo-tema-oscuro");
    expect(
      INTERRUPTOR,
      "ha vuelto el estado y con él el parpadeo",
    ).not.toContain("useState");
  });

  it("los dibujos están dibujados, no escritos", () => {
    expect(sinComentarios(INTERRUPTOR)).not.toMatch(/[☀☾☽🌙🌞]/);
    expect(INTERRUPTOR).toContain("<svg");
  });
});

describe("los logos", () => {
  const ficheros = readdirSync(join(RAIZ, "public"));

  it("hay uno para cada tema", () => {
    expect(ficheros).toContain("logo-full-claro.webp");
    expect(ficheros).toContain("logo-full-oscuro.webp");
  });

  it("los dos miden exactamente igual", () => {
    // Si no, la barra da un salto al cambiar de modo. Las medidas van
    // escritas en el componente (next/image las necesita) y tienen que
    // coincidir con las de los archivos.
    const medidas = [
      ...BARRA.matchAll(/width=\{(\d+)\}\s*\n\s*height=\{(\d+)\}/g),
    ].map((m) => `${m[1]}x${m[2]}`);
    expect(medidas, "los dos logos de la barra").toHaveLength(2);
    expect(medidas[0]).toBe(medidas[1]);
  });

  it("ninguno es el PNG viejo con el fondo pegado", () => {
    // `logo-full.png` no tiene transparencia: sobre la barra oscura
    // salía un cuadrado blanco alrededor del logo. Es el fallo que
    // vio el usuario en su teléfono.
    for (const [nombre, fuente] of [
      ["la barra", BARRA],
      ["la cabecera", CABECERA],
    ] as const) {
      expect(fuente, `${nombre} sigue usando el logo con fondo`).not.toContain(
        '"/logo-full.png"',
      );
    }
  });

  it("pesan poco: se ven a 48 píxeles de alto", () => {
    for (const n of ["logo-full-claro.webp", "logo-full-oscuro.webp"]) {
      const bytes = statSync(join(RAIZ, "public", n)).size;
      expect(bytes, `${n} se ha ido de tamaño`).toBeLessThan(400_000);
      expect(bytes).toBeGreaterThan(10_000);
    }
  });

  it("cada idioma tiene sus dos logos, y existen", () => {
    // El eslogan va dentro de la imagen: en inglés y en portugués es
    // otro archivo. Si falta uno, la cabecera sale con la imagen rota.
    for (const idioma of ["es", "pt", "en"]) {
      const { claro, oscuro } = logosDelIdioma(idioma);
      for (const ruta of [claro, oscuro]) {
        const nombre = ruta.replace(/^\//, "");
        expect(ficheros, `falta ${nombre} (${idioma})`).toContain(nombre);
        const bytes = statSync(join(RAIZ, "public", nombre)).size;
        expect(bytes, `${nombre} se ha ido de tamaño`).toBeLessThan(400_000);
      }
    }
    expect(logosDelIdioma("en").claro).not.toBe(logosDelIdioma("es").claro);
    expect(logosDelIdioma("fr")).toEqual(logosDelIdioma("es"));
  });

  it("el oscuro solo se enseña dentro del panel oscuro", () => {
    expect(CSS).toMatch(/\.logo-oscuro[\s\S]{0,80}display: none/);
    expect(CSS).toContain(
      'html[data-tema-panel="oscuro"] .tema-panel .logo-oscuro',
    );
  });
});

describe("el tema oscuro obedece al botón", () => {
  it("la paleta cuelga del atributo y no de un @media", () => {
    // Con `@media` había que repetir las sesenta líneas de la paleta
    // dos veces —una para el ajuste del sistema y otra para la
    // elección a mano— y el día que se cambiara un gris se cambiaría
    // en una sola. Quien resuelve el ajuste del sistema es el guion.
    expect(CSS).toContain('html[data-tema-panel="oscuro"] .tema-panel {');
    const bloques = CSS.match(/--superficie: oklch/g) ?? [];
    expect(bloques, "la paleta oscura está escrita dos veces").toHaveLength(1);
  });

  it("el fondo de la página también cambia", () => {
    // Sin esto, al entrar se ve un fotograma con el fondo claro: el
    // `body` lleva el de toda la web y se pinta antes.
    expect(CSS).toContain('html[data-tema-panel="oscuro"] body');
  });
});
