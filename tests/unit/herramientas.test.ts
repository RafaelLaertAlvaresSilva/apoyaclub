import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

/**
 * Las doce herramientas, sus claves y sus iconos.
 *
 * Esto existe por un fallo que estuvo meses en la web sin que nadie lo
 * viera venir: el icono de cada herramienta se elegía por POSICIÓN en
 * la lista. El día que alguien reordenara los textos —algo que se hace
 * sin pensar— las doce se habrían quedado con el icono de la de al
 * lado. Ni el compilador ni ninguna prueba lo habrían dicho.
 *
 * Ahora el icono va atado a la clave, y estas pruebas comprueban que
 * las tres piezas siguen cuadrando: los textos, los iconos y las seis
 * que salen en la portada. Si alguien renombra una clave en un sitio y
 * se olvida del otro, falla aquí en vez de dejar un hueco en la página.
 */

const RAIZ = path.resolve(__dirname, "../..");

const HERRAMIENTAS = JSON.parse(
  readFileSync(path.join(RAIZ, "messages/es/home.json"), "utf8"),
).herramientas as {
  lista: { clave: string; titulo: string; corto: string; texto: string }[];
  destacadas: string[];
  hayMas: string;
  verTodas: string;
};

const SECCIONES = readFileSync(
  path.join(RAIZ, "src/app/[locale]/components/secciones.tsx"),
  "utf8",
);

/** Las claves que tienen dibujo en `ICONO_DE_HERRAMIENTA`. Se leen del
 * propio archivo: una lista escrita a mano aquí sería otra cosa más que
 * se queda desfasada. */
function clavesConIcono(): string[] {
  const mapa = SECCIONES.slice(
    SECCIONES.indexOf("const ICONO_DE_HERRAMIENTA"),
    SECCIONES.indexOf("const ICONO_POR_DEFECTO"),
  );

  // Cada entrada es `clave: "M..."` o `"clave-con-guion": "M..."`, y el
  // valor puede bajar a la línea siguiente cuando es largo.
  return [...mapa.matchAll(/^\s{2}"?([a-z-]+)"?:\s*$|^\s{2}"?([a-z-]+)"?:\s*"/gm)].map(
    (coincidencia) => coincidencia[1] ?? coincidencia[2],
  );
}

describe("las herramientas", () => {
  it("hay doce y ninguna repetida", () => {
    const claves = HERRAMIENTAS.lista.map((herramienta) => herramienta.clave);
    expect(claves.length).toBeGreaterThanOrEqual(12);
    expect(new Set(claves).size).toBe(claves.length);
  });

  it("todas tienen clave, título, línea corta y texto largo", () => {
    for (const herramienta of HERRAMIENTAS.lista) {
      expect(herramienta.clave, JSON.stringify(herramienta)).toMatch(/^[a-z-]+$/);
      expect(herramienta.titulo.length).toBeGreaterThan(3);
      expect(herramienta.corto.length).toBeGreaterThan(3);
      expect(herramienta.texto.length).toBeGreaterThan(herramienta.corto.length);
    }
  });

  it("la línea corta de la portada cabe de verdad en una línea", () => {
    for (const herramienta of HERRAMIENTAS.lista) {
      expect(`${herramienta.clave}: ${herramienta.corto}`.length).toBeLessThan(90);
    }
  });

  it("cada herramienta tiene su icono", () => {
    const conIcono = clavesConIcono();
    expect(conIcono.length).toBeGreaterThan(0);

    for (const herramienta of HERRAMIENTAS.lista) {
      expect(conIcono, `falta el icono de "${herramienta.clave}"`).toContain(herramienta.clave);
    }
  });

  it("no sobran iconos de herramientas que ya no existen", () => {
    const claves = HERRAMIENTAS.lista.map((herramienta) => herramienta.clave);
    for (const clave of clavesConIcono()) {
      expect(claves, `sobra el icono de "${clave}"`).toContain(clave);
    }
  });
});

describe("las seis de la portada", () => {
  it("son seis", () => {
    expect(HERRAMIENTAS.destacadas).toHaveLength(6);
  });

  it("todas existen en la lista larga", () => {
    const claves = HERRAMIENTAS.lista.map((herramienta) => herramienta.clave);
    for (const clave of HERRAMIENTAS.destacadas) {
      // Sin esto, una clave mal escrita no rompe nada: la herramienta
      // simplemente no sale en la portada, y eso no se ve.
      expect(claves, `"${clave}" no es ninguna herramienta`).toContain(clave);
    }
  });

  it("no se repite ninguna", () => {
    expect(new Set(HERRAMIENTAS.destacadas).size).toBe(HERRAMIENTAS.destacadas.length);
  });

  it("dejan alguna fuera, que es de lo que habla el \"y hay más\"", () => {
    expect(HERRAMIENTAS.lista.length).toBeGreaterThan(HERRAMIENTAS.destacadas.length);
  });

  it("los números de los textos se calculan, no se escriben a mano", () => {
    expect(HERRAMIENTAS.hayMas).toContain("{cuantas}");
    expect(HERRAMIENTAS.verTodas).toContain("{total}");
    expect(HERRAMIENTAS.hayMas).not.toMatch(/\b(seis|6)\b/);
  });
});
