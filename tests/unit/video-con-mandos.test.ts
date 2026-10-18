import { describe, expect, it } from "vitest";
import { readFileSync, statSync } from "node:fs";
import { join } from "node:path";

const RAIZ = process.cwd();
const COMPONENTE = readFileSync(
  join(RAIZ, "src", "app", "[locale]", "components", "VideoDeLaPortada.tsx"),
  "utf8",
);
const PORTADA = readFileSync(
  join(RAIZ, "src", "app", "[locale]", "page.tsx"),
  "utf8",
);
const CLUBES = readFileSync(
  join(RAIZ, "src", "app", "[locale]", "para-clubes", "page.tsx"),
  "utf8",
);
const EMPRESAS = readFileSync(
  join(RAIZ, "src", "app", "[locale]", "para-empresas", "page.tsx"),
  "utf8",
);

function sinComentarios(fuente: string): string {
  return fuente.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");
}
const CODIGO = sinComentarios(COMPONENTE);

/**
 * Los mandos del vídeo: pausar, retroceder y adelantar.
 *
 * El fallo que esto protege no avisa de ninguna manera, y por poco se
 * publica: el `<video>` viene en el HTML del servidor, el navegador
 * empieza a cargarlo antes de que React enganche nada, y para cuando
 * React llega, `loadedmetadata` YA HA SALTADO. Sin ponerse al día en
 * el montaje, la duración se queda a cero: la barra no se puede
 * arrastrar y el reloj marca "0:00 / 0:00" encima de un vídeo de 57
 * segundos que se ve correr. Ni error en consola, ni aviso, ni nada.
 */
describe("los mandos del vídeo", () => {
  it("se pone al día de los eventos que se perdió", () => {
    // `readyState >= 1` es HAVE_METADATA: los metadatos ya llegaron,
    // así que su evento no va a volver a saltar y hay que leerlos a
    // mano. Si esta comprobación desaparece, vuelve la barra muerta.
    expect(CODIGO, "sin esto la barra y el reloj se quedan a cero").toContain(
      "readyState >= 1",
    );
    expect(CODIGO).toMatch(
      /useEffect\([\s\S]*?readyState >= 1[\s\S]*?\}, \[\]\)/,
    );
  });

  it("la duración no se mete en la barra siendo NaN", () => {
    // `duration` es NaN hasta que llegan los metadatos, y un `max` en
    // NaN deja la barra imposible de arrastrar.
    expect(CODIGO).toContain("Number.isFinite(elemento.duration)");
  });

  it("están los tres mandos que se pidieron", () => {
    // Los nombres viven en `home.video`, en cada idioma; el código los
    // pide por su clave.
    const textos = JSON.parse(
      readFileSync(join(RAIZ, "messages", "es", "home.json"), "utf8"),
    ) as { video: Record<string, string> };
    for (const [clave, nombre] of [
      ["pausar", "Pausar el vídeo"],
      ["reanudar", "Reanudar el vídeo"],
      ["retroceder", "Retroceder 10 segundos"],
      ["avanzar", "Avanzar 10 segundos"],
    ]) {
      expect(textos.video[clave], `falta el mando "${nombre}"`).toBe(nombre);
      expect(CODIGO, `el reproductor no usa "${clave}"`).toContain(`t("${clave}")`);
    }
    expect(CODIGO).toContain("saltar(-10)");
    expect(CODIGO).toContain("saltar(10)");
  });

  it("saltar no se sale del vídeo", () => {
    // Pedirle el segundo −4, o uno más allá del final, no da error:
    // se queda donde estaba y el botón parece roto.
    // Tolerante a cómo lo parta prettier: lo que importa es que el
    // destino se acote por abajo en 0 y por arriba en la duración.
    expect(CODIGO).toMatch(
      /Math\.min\(\s*Math\.max\(destino, 0\),\s*elemento\.duration \|\| 0,?\s*\)/,
    );
  });

  it("si está en marcha lo dice el vídeo, no el botón", () => {
    // El navegador para el vídeo él solo (pestaña de fondo, batería);
    // un estado que solo cambiara al pulsar enseñaría "pausa" sobre un
    // vídeo quieto.
    expect(CODIGO).toContain("onPlay={alPonerse}");
    expect(CODIGO).toContain("onPause={alPararse}");
  });

  it("la barra es un control de verdad, no un dibujo", () => {
    // Un div pintado no se arrastra, no se mueve con las flechas del
    // teclado y un lector de pantalla no sabe decir por dónde va.
    expect(CODIGO).toContain('type="range"');
    expect(CODIGO).toContain('aria-label={t("irAUnMomento")}');
  });

  it("los dibujos están dibujados, no escritos", () => {
    // ▶ ⏸ ⏪ 🔊 salen de otro tamaño en cada sistema, el altavoz sale
    // de color, y en Windows varios no salen.
    expect(CODIGO).not.toMatch(/[▶⏸⏮⏭⏪⏩🔊🔇⏯]/);
    expect(CODIGO).toContain("<svg");
  });

  it("sigue parándose para quien no quiere movimiento", () => {
    expect(CODIGO).toContain("prefers-reduced-motion: reduce");
    expect(CODIGO).toContain("elemento.pause()");
  });
});

/**
 * Y que el vídeo exista de verdad.
 *
 * Esto ya falló una vez de la peor manera: el middleware de idiomas se
 * tragaba el .mp4 y lo redirigía, así que el vídeo no cargaba NUNCA en
 * producción sin que apareciera ningún error.
 */
describe("los tres vídeos de la web", () => {
  it.each([
    ["la portada", "portada-video"],
    ["para clubes", "para-clubes-video"],
    ["para empresas", "para-empresas-video"],
  ])("%s tiene su vídeo y su imagen de espera", (_, base) => {
    const video = statSync(join(RAIZ, "public", `${base}.mp4`));
    const poster = statSync(join(RAIZ, "public", `${base}-poster.webp`));
    expect(video.size).toBeGreaterThan(100_000);
    // Más de 6 MB en la portada es medio minuto de espera con datos
    // móviles antes de ver nada.
    expect(video.size, `${base}.mp4 pesa demasiado`).toBeLessThan(6_000_000);
    expect(poster.size).toBeGreaterThan(5_000);
  });

  it("el middleware deja pasar los .mp4", () => {
    // Si `mp4` sale de esta lista, el vídeo se va por el enrutado de
    // idiomas, devuelve un 307 y no carga. Sin ruido ninguno.
    const middleware = readFileSync(join(RAIZ, "src", "middleware.ts"), "utf8");
    expect(middleware).toContain("mp4");
  });

  it("las tres páginas usan el mismo reproductor", () => {
    for (const [nombre, pagina] of [
      ["la portada", PORTADA],
      ["para clubes", CLUBES],
      ["para empresas", EMPRESAS],
    ] as const) {
      expect(pagina, `${nombre} no usa VideoDeLaPortada`).toContain(
        "<VideoDeLaPortada",
      );
      expect(pagina).toContain("VideoDeLaPortada }");
    }
    // La portada elige el vídeo según el idioma (la voz cambia).
    expect(PORTADA).toContain('"/portada-video.mp4"');
    expect(PORTADA).toContain('"/portada-video-en.mp4"');
    expect(PORTADA).toContain('"/portada-video-pt.mp4"');
    expect(PORTADA).toContain("src={VIDEO_DE_LA_PORTADA[locale]");
    expect(CLUBES).toContain('src="/para-clubes-video.mp4"');
    expect(EMPRESAS).toContain('src="/para-empresas-video.mp4"');
  });

  it("cada vídeo lleva su propia descripción para quien no lo ve", () => {
    // La misma etiqueta en los tres sería mentir en dos de ellos.
    expect(PORTADA).toContain('t("video.etiquetaPortada")');
    expect(CLUBES).toContain('t("video.etiquetaParaClubes")');
    // En esta página `t` está acotado a `home.paraEmpresas`, así que
    // el texto del vídeo —que vive en `home.video`— se pide con un
    // segundo traductor. Si alguien lo cambia por `t(...)` a secas,
    // next-intl no encuentra la clave y la página revienta entera.
    expect(EMPRESAS).toContain('tVideo("etiquetaParaEmpresas")');
    expect(EMPRESAS).toContain('getTranslations("home.video")');

    const textos = JSON.parse(
      readFileSync(join(RAIZ, "messages", "es", "home.json"), "utf8"),
    ) as {
      video: Record<string, string>;
    };
    expect(textos.video.etiquetaPortada.length).toBeGreaterThan(40);
    expect(textos.video.etiquetaParaClubes.length).toBeGreaterThan(40);
    expect(textos.video.etiquetaParaEmpresas.length).toBeGreaterThan(40);
    const etiquetas = [
      textos.video.etiquetaPortada,
      textos.video.etiquetaParaClubes,
      textos.video.etiquetaParaEmpresas,
    ];
    expect(new Set(etiquetas).size).toBe(3);
  });

  it("las tres portadas llevan el texto a la izquierda y el vídeo a la derecha", () => {
    // Lo mismo que la portada: una rejilla de dos columnas sólo a
    // partir de `lg`, porque a 390 px no caben uno al lado del otro.
    expect(CLUBES).toContain("lg:grid-cols-[minmax(0,1fr)_auto]");
    expect(PORTADA).toContain("lg:grid-cols-[minmax(0,1fr)_auto]");
    // El vídeo va DESPUÉS del bloque de texto, que es lo que lo pone a
    // la derecha.
    expect(CLUBES.indexOf("<VideoDeLaPortada")).toBeGreaterThan(
      CLUBES.indexOf('t("paraClubes.titulo")'),
    );

    expect(EMPRESAS).toContain("lg:grid-cols-[minmax(0,1fr)_auto]");
    expect(EMPRESAS.indexOf("<VideoDeLaPortada")).toBeGreaterThan(
      EMPRESAS.indexOf('t("titulo")'),
    );
  });

  it("la página de empresas no se trae las funciones del club", () => {
    // Las cuatro pastillas del héroe de clubes hablan de ideas de
    // patrocinio, tareas y dossier: son las herramientas que compra el
    // club. Puestas aquí, al comercio de barrio no le dicen nada y le
    // devuelven la idea —que esta página existe justo para quitarle—
    // de que esto es un producto de pago para él.
    // Sin comentarios: ahí arriba, en la propia página, hay uno que
    // explica justamente por qué NO están, y nombrarlas basta para
    // que esta comprobación se dispare sola.
    expect(sinComentarios(EMPRESAS)).not.toContain("FuncionesDestacadas");
  });
});
