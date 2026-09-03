import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

/**
 * Toda página tiene que dejar volver a la portada.
 *
 * El panel del club se quedó meses sin ninguna salida: ni logo, ni
 * enlace. La única forma de volver era editar la dirección a mano. Esta
 * prueba recorre las páginas de verdad y comprueba que cada una llega a
 * pintar una de las dos cabeceras, ella misma o a través de su layout,
 * para que la próxima página que se añada no se quede fuera en silencio.
 */
const RAIZ = join(process.cwd(), "src/app/[locale]");

/** Rutas que no pintan interfaz: descargas, redirecciones y similares. */
const SIN_INTERFAZ = ["exportar", "dossier", "auth/callback", "panel/dossier/pdf"];

function paginas(directorio: string, acumulado: string[] = []): string[] {
  for (const entrada of readdirSync(directorio)) {
    const ruta = join(directorio, entrada);
    if (statSync(ruta).isDirectory()) paginas(ruta, acumulado);
    else if (entrada === "page.tsx") acumulado.push(ruta);
  }
  return acumulado;
}

/** Layouts que envuelven a una página, del más cercano al más lejano. */
function layoutsQueLaEnvuelven(pagina: string): string[] {
  const encontrados: string[] = [];
  let directorio = join(pagina, "..");

  while (directorio.startsWith(RAIZ)) {
    try {
      encontrados.push(readFileSync(join(directorio, "layout.tsx"), "utf8"));
    } catch {
      // Ese nivel no tiene layout propio; se sigue subiendo.
    }
    directorio = join(directorio, "..");
  }

  return encontrados;
}

describe("todas las páginas dejan volver a la portada", () => {
  const todas = paginas(RAIZ).filter(
    (ruta) => !SIN_INTERFAZ.some((excluida) => ruta.includes(excluida.replace("/", "/"))),
  );

  it("encuentra páginas que revisar", () => {
    expect(todas.length).toBeGreaterThan(10);
  });

  it.each(todas.map((ruta) => [ruta.replace(RAIZ, ""), ruta]))(
    "%s tiene cabecera",
    (_nombre, ruta) => {
      const fuentes = [readFileSync(ruta, "utf8"), ...layoutsQueLaEnvuelven(ruta)];
      const tieneCabecera = fuentes.some(
        (fuente) =>
          fuente.includes("<BarraLogo") ||
          fuente.includes("<Header") ||
          fuente.includes("LegalPageShell"),
      );

      expect(tieneCabecera).toBe(true);
    },
  );
});
