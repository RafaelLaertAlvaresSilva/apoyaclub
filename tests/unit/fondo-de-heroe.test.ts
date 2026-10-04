import { describe, expect, it } from "vitest";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

const RAIZ = join(process.cwd(), "src", "app", "[locale]");

const SECCIONES = readFileSync(join(RAIZ, "components", "secciones.tsx"), "utf8");

/** El trozo que va de `desde` al siguiente `export` de primer nivel. */
function bloque(fuente: string, desde: string): string {
  const inicio = fuente.indexOf(desde);
  if (inicio === -1) throw new Error(`no está "${desde}" en el archivo`);
  const fin = fuente.indexOf("\nexport ", inicio + 1);
  return fuente.slice(inicio, fin === -1 ? undefined : fin);
}

/** Cada página que usa el fondo, con la llamada entera. */
function llamadas(): { pagina: string; llamada: string }[] {
  const encontradas: { pagina: string; llamada: string }[] = [];

  function recorrer(directorio: string) {
    for (const entrada of readdirSync(directorio, { withFileTypes: true })) {
      const ruta = join(directorio, entrada.name);
      if (entrada.isDirectory()) recorrer(ruta);
      else if (entrada.name === "page.tsx") {
        const texto = readFileSync(ruta, "utf8");
        // Nada de `[^/]`: las rutas de las fotos llevan barra
        // ("/fondo-hero.webp") y cortaban la captura por la mitad.
        for (const m of texto.matchAll(/<FondoDeHeroe[\s\S]*?\/>/g)) {
          encontradas.push({ pagina: ruta.slice(RAIZ.length), llamada: m[0] });
        }
      }
    }
  }
  recorrer(RAIZ);
  return encontradas;
}

/**
 * La foto de fondo de las tres portadas.
 *
 * Esto ya se rompió una vez, y de las dos maneras opuestas a la vez: el
 * bloque estaba copiado a mano en dos archivos, y al arreglar el de una
 * página la otra se quedó igual de mal. De ahí que viva en un solo
 * componente.
 *
 * El `tono` no basta. Dos fotos igual de claras pueden necesitar velos
 * distintos según DÓNDE tengan el contraste: la de "Para clubes" lleva
 * el sol de frente justo detrás del titular. Por eso hay un `velo`
 * aparte, y por eso esta prueba comprueba que cada página sigue
 * pidiendo el suyo: un cambio en el componente que se llevara por
 * delante el caso "fuerte" dejaría ese texto ilegible sin que nada
 * fallara.
 */
describe("la foto de fondo de las portadas", () => {
  const usos = llamadas();

  it("la usan las tres portadas", () => {
    expect(usos.length).toBe(3);
  });

  it("cada una pide su tono", () => {
    for (const uso of usos) {
      expect(uso.llamada, `${uso.pagina} no dice el tono`).toMatch(/tono="(claro|oscuro)"/);
    }
  });

  it("para-clubes pide el velo fuerte", () => {
    const clubes = usos.find((u) => u.pagina.includes("para-clubes"));
    expect(clubes, "no encuentro la portada de clubes").toBeDefined();
    expect(clubes!.llamada).toContain('velo="fuerte"');
  });

  it("el componente entiende los dos velos", () => {
    const fondo = bloque(SECCIONES, "export function FondoDeHeroe(");
    expect(fondo).toContain('velo?: "normal" | "fuerte"');
    expect(fondo).toContain('velo === "fuerte"');
  });

  it("el velo fuerte aprieta más que el normal", () => {
    const fondo = bloque(SECCIONES, "export function FondoDeHeroe(");
    const opacidades = [...fondo.matchAll(/rgba\(255,255,255,(0\.\d+)\)/g)].map((m) =>
      Number(m[1]),
    );
    // La más alta de todas tiene que ser la del centro del velo fuerte;
    // si alguien baja ese número, el texto vuelve a competir con el sol.
    expect(Math.max(...opacidades)).toBeGreaterThanOrEqual(0.85);
  });
});
