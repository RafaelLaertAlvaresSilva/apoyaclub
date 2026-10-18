import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

/**
 * Qué archivos estáticos esquivan el middleware.
 *
 * ESTE FALLO NO AVISA. Lo que no esté excluido en el `matcher` pasa
 * por el middleware, y next-intl le pone el idioma delante:
 * `/portada-video.mp4` se convierte en `/es/portada-video.mp4`, que no
 * existe. El navegador recibe un 307, el archivo nunca llega y no sale
 * ningún error en ninguna parte — simplemente no se ve el vídeo.
 *
 * Pasó de verdad: las imágenes estaban en la lista y los vídeos no. Se
 * descubrió midiendo, no mirando, porque la página se veía
 * perfectamente con el hueco del vídeo en negro.
 *
 * Por eso esta prueba comprueba la expresión del `matcher` contra
 * rutas concretas, en vez de mirar si el texto contiene "mp4".
 */
describe("el middleware y los archivos estáticos", () => {
  // El patrón se lee del archivo en vez de importarlo: `src/middleware.ts`
  // arrastra next-intl, que no arranca fuera de Next. Lo que se
  // comprueba es la misma cadena que usa el middleware de verdad.
  const fuente = readFileSync(join(process.cwd(), "src", "middleware.ts"), "utf8");
  const encontrado = fuente.match(/matcher:\s*\[\s*"([^"]+)"/);
  const patron = new RegExp(`^${(encontrado?.[1] ?? "").replace(/\\\\/g, "\\")}$`);

  // Si el matcher cambia de forma y deja de encontrarse, lo de abajo
  // pasaría sin comprobar nada.
  it("encuentra el matcher y es una expresión regular válida", () => {
    expect(encontrado).not.toBeNull();
    expect(patron.test("/es/panel")).toBe(true);
  });

  it.each([
    "/portada-video.mp4",
    "/portada-video-poster.webp",
    "/fondo-hero.webp",
    "/pagina-club-telefono.webp",
    "/algo.png",
    "/algo.jpg",
    "/algo.svg",
    "/algo.webm",
    "/favicon.ico",
    "/fuente.woff2",
  ])("%s se sirve tal cual, sin pasar por el idioma", (ruta) => {
    expect(patron.test(ruta), `${ruta} acabaría redirigida a /es${ruta}`).toBe(false);
  });

  it.each(["/", "/es", "/es/panel", "/es/club/mi-club", "/para-clubes"])(
    "%s sí pasa por el middleware",
    (ruta) => {
      expect(patron.test(ruta)).toBe(true);
    },
  );

  /**
   * Y al revés: que el archivo que la portada pide exista de verdad.
   * Un `matcher` perfecto no sirve de nada si el vídeo no está.
   */
  it("el vídeo y su imagen de portada están en public/", () => {
    const portada = readFileSync(
      join(process.cwd(), "src", "app", "[locale]", "page.tsx"),
      "utf8",
    );
    const archivos = [...portada.matchAll(/"(\/[^"]+\.(?:mp4|webp))"/g)].map(
      (m) => m[1],
    );
    expect(archivos).toContain("/portada-video.mp4");
    expect(archivos).toContain("/portada-video-poster.webp");
    expect(archivos).toContain("/portada-video-en.mp4");
    expect(archivos).toContain("/portada-video-pt.mp4");

    for (const archivo of archivos) {
      expect(() => readFileSync(join(process.cwd(), "public", archivo)), `falta ${archivo}`).not.toThrow();
    }
  });
});
