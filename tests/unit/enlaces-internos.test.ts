import { describe, expect, it } from "vitest";
import { readdirSync, readFileSync } from "node:fs";
import { join, relative, sep } from "node:path";

const APP = join(process.cwd(), "src", "app");
const SRC = join(process.cwd(), "src");

/** Todos los archivos bajo `raiz` cuyo nombre esté en `nombres`. */
function buscar(raiz: string, nombres: (ruta: string) => boolean, prefijo = ""): string[] {
  const encontrados: string[] = [];
  for (const entrada of readdirSync(join(raiz, prefijo), { withFileTypes: true })) {
    const relativa = prefijo ? join(prefijo, entrada.name) : entrada.name;
    if (entrada.isDirectory()) encontrados.push(...buscar(raiz, nombres, relativa));
    else if (nombres(entrada.name)) encontrados.push(relativa);
  }
  return encontrados;
}

/**
 * Las direcciones que el App Router sirve de verdad, sacadas de dónde
 * está cada `page.tsx` y cada `route.ts`.
 *
 * Se quitan dos cosas que no salen en la URL: el segmento de idioma
 * (`[locale]`, que next-intl pone solo) y los grupos entre paréntesis
 * como `(auth)`.
 */
const RUTAS = new Set(
  buscar(APP, (nombre) => nombre === "page.tsx" || nombre === "route.ts").map((archivo) => {
    const carpeta = archivo.split(sep).slice(0, -1).join("/");
    const limpia = carpeta
      .replace(/^\[locale\]\/?/, "")
      .replace(/\([^)]+\)\/?/g, "")
      .replace(/\/$/, "");
    return `/${limpia}`;
  }),
);

/** Si el destino encaja con alguna ruta, contando los `[parametros]`. */
function existe(destino: string): boolean {
  const limpio = destino.split("#")[0].split("?")[0].replace(/\/$/, "") || "/";
  if (RUTAS.has(limpio)) return true;

  const partes = limpio.split("/").filter(Boolean);
  for (const ruta of RUTAS) {
    const suyas = ruta.split("/").filter(Boolean);
    if (suyas.length !== partes.length) continue;
    if (suyas.every((parte, i) => parte.startsWith("[") || parte === partes[i])) return true;
  }
  return false;
}

/**
 * Un enlace a una página que no existe no da error en ningún sitio: se
 * compila, se despliega, y el club pulsa y aterriza en un "no
 * encontrado". Ya pasó al mover el formulario de `/panel` a
 * `/panel/perfil`, con doce enlaces que se quedaron apuntando a la
 * portada del panel.
 */
describe("los enlaces internos", () => {
  // Coge `href=`, y también los campos con los que el código guarda un
  // destino para pintarlo luego (`ruta:`, `donde:`).
  const PATRON = /(?:href|ruta|donde|destino)\s*[=:]\s*[{"'`]{1,2}(\/[^"'`{}\s]*)/g;

  const destinos = buscar(SRC, (nombre) => nombre.endsWith(".ts") || nombre.endsWith(".tsx"))
    .flatMap((archivo) => {
      const texto = readFileSync(join(SRC, archivo), "utf8");
      return [...texto.matchAll(PATRON)].map((encontrado) => ({
        archivo,
        destino: encontrado[1],
      }));
    })
    // `/${locale}/club/...` y compañía: la dirección la arma una
    // variable y aquí solo se ve el trozo de delante.
    .filter(({ destino }) => !destino.startsWith("/$") && !destino.startsWith("//"));

  it("encuentra las rutas y los enlaces (si no, no está comprobando nada)", () => {
    expect(RUTAS.size).toBeGreaterThan(40);
    expect(destinos.length).toBeGreaterThan(100);
  });

  it("todos llevan a una página que existe", () => {
    const rotos = destinos
      .filter(({ destino }) => !existe(destino))
      .map(({ archivo, destino }) => `${destino}  (${relative(process.cwd(), join(SRC, archivo))})`);

    expect(rotos).toEqual([]);
  });
});
