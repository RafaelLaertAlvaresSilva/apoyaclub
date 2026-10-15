import { describe, expect, it } from "vitest";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import {
  cabenMas,
  esFotoDeLaCasa,
  fotoDePortada,
  fotosLimpias,
  MAXIMO_FOTOS,
  mensajeDelProblema,
  problemaConLasFotos,
  sinLaFoto,
} from "@/lib/fotos-de-oportunidad";

const RAIZ = process.cwd();
const l = (...p: string[]) => readFileSync(join(RAIZ, ...p), "utf8");

const BUENA =
  "https://abc.supabase.co/storage/v1/object/public/club-media/club-1/oportunidades/a.jpg";
const OTRA =
  "https://abc.supabase.co/storage/v1/object/public/club-media/club-1/oportunidades/b.jpg";
const TERCERA =
  "https://abc.supabase.co/storage/v1/object/public/club-media/club-1/oportunidades/c.jpg";
const CUARTA =
  "https://abc.supabase.co/storage/v1/object/public/club-media/club-1/oportunidades/d.jpg";

describe("de dónde puede venir una foto", () => {
  it("acepta las del almacén de la casa", () => {
    expect(esFotoDeLaCasa(BUENA)).toBe(true);
  });

  it("rechaza las de fuera", () => {
    // Sin esto, quien mande el formulario a mano podría dejar escrita
    // la dirección de una imagen de otro servidor: el catálogo
    // enseñaría algo que no controlamos y que puede cambiar o
    // desaparecer cualquier día.
    for (const mala of [
      "https://otrositio.com/foto.jpg",
      "https://abc.supabase.co/storage/v1/object/public/otro-bucket/x.jpg",
      "http://abc.supabase.co/storage/v1/object/public/club-media/x.jpg", // sin https
      "javascript:alert(1)",
      "no es una direccion",
      "",
    ]) {
      expect(esFotoDeLaCasa(mala), `debería rechazar ${mala}`).toBe(false);
    }
  });
});

describe("el tope de fotos", () => {
  it("son tres", () => {
    // A mano a propósito: si alguien lo sube, que se entere, porque la
    // base de datos tiene su propia regla y hay que cambiar las dos.
    expect(MAXIMO_FOTOS).toBe(3);
  });

  it("la base de datos comprueba el mismo número", () => {
    // La comprobación de la aplicación vive en un formulario y se la
    // salta cualquiera que llame a la base por otro camino. Si las dos
    // dejan de coincidir, una de las dos miente.
    const migracion = l(
      "supabase",
      "migrations",
      "0052_fotos_de_la_oportunidad.sql",
    );
    expect(migracion).toContain(`<= ${MAXIMO_FOTOS}`);
  });

  it("el array vacío no se cuela por la regla de la base de datos", () => {
    // `array_length` de un array vacío devuelve NULL, no 0, y en SQL
    // `NULL <= 3` no es verdadero: es NULL, que un CHECK deja pasar.
    // Sin el coalesce la regla se vuelve inútil en cuanto se vacía.
    const migracion = l(
      "supabase",
      "migrations",
      "0052_fotos_de_la_oportunidad.sql",
    );
    expect(migracion).toMatch(/coalesce\(array_length\(photos, 1\), 0\)/);
  });

  it("corta en el tope aunque lleguen más", () => {
    expect(fotosLimpias([BUENA, OTRA, TERCERA, CUARTA])).toEqual([
      BUENA,
      OTRA,
      TERCERA,
    ]);
  });

  it("el botón de subir se apaga al llegar al tope", () => {
    expect(cabenMas([])).toBe(true);
    expect(cabenMas([BUENA, OTRA])).toBe(true);
    expect(cabenMas([BUENA, OTRA, TERCERA])).toBe(false);
  });
});

describe("dejar las fotos en condiciones antes de guardar", () => {
  it("quita las repetidas", () => {
    // Sale sola de pulsar dos veces el botón de subir.
    expect(fotosLimpias([BUENA, BUENA, OTRA])).toEqual([BUENA, OTRA]);
  });

  it("quita las vacías y las de fuera", () => {
    expect(
      fotosLimpias(["", null, undefined, "https://otro.com/x.jpg", BUENA]),
    ).toEqual([BUENA]);
  });

  it("respeta el orden, porque la primera es la miniatura", () => {
    expect(fotosLimpias([TERCERA, BUENA, OTRA])).toEqual([
      TERCERA,
      BUENA,
      OTRA,
    ]);
  });

  it("sin fotos devuelve una lista vacía, no revienta", () => {
    expect(fotosLimpias([])).toEqual([]);
  });
});

describe("la miniatura de los listados", () => {
  it("es la primera", () => {
    expect(fotoDePortada([OTRA, BUENA])).toBe(OTRA);
  });

  it("sin fotos devuelve null y no una imagen de relleno", () => {
    // Casi ninguna oportunidad tendrá fotos el primer día: veinte
    // huecos grises seguidos en el buscador se ven peor que la lista de
    // texto que había.
    expect(fotoDePortada([])).toBeNull();
    expect(fotoDePortada(null)).toBeNull();
    expect(fotoDePortada(undefined)).toBeNull();
  });

  it("se salta una dirección rara en vez de enseñarla", () => {
    expect(fotoDePortada(["https://otro.com/x.jpg", BUENA])).toBe(BUENA);
  });
});

describe("quitar una foto", () => {
  it("quita solo esa", () => {
    expect(sinLaFoto([BUENA, OTRA, TERCERA], OTRA)).toEqual([BUENA, TERCERA]);
  });

  it("quitar una que no está no cambia nada", () => {
    expect(sinLaFoto([BUENA], CUARTA)).toEqual([BUENA]);
  });
});

describe("los avisos", () => {
  it("cada problema tiene su texto", () => {
    expect(problemaConLasFotos([BUENA, OTRA, TERCERA, CUARTA])).toBe(
      "demasiadas",
    );
    expect(problemaConLasFotos(["https://otro.com/x.jpg"])).toBe(
      "direccion-no-valida",
    );
    expect(problemaConLasFotos([BUENA])).toBeNull();
    for (const problema of ["demasiadas", "direccion-no-valida"] as const) {
      expect(mensajeDelProblema(problema).length).toBeGreaterThan(20);
    }
  });
});

/**
 * Y que todo esté enchufado.
 *
 * Cada una de estas comprobaciones corresponde a un fallo que NO da
 * ningún error: la foto se sube, se ve en el formulario, el club guarda
 * tan contento… y luego no aparece en ningún sitio.
 */
describe("las fotos llegan de punta a punta", () => {
  it("la vista del buscador trae la columna", () => {
    // El buscador pide `select *` sobre una VISTA, no sobre la tabla.
    // Si la columna no está en la vista, no llega, y no se entera nadie.
    const migracion = l(
      "supabase",
      "migrations",
      "0052_fotos_de_la_oportunidad.sql",
    );
    expect(migracion).toContain(
      "create or replace view public.opportunity_search_view",
    );
    const vista = migracion.slice(migracion.indexOf("create or replace view"));
    expect(vista, "falta o.photos en la vista").toContain("o.photos");
    // Y al final del todo: Postgres solo deja añadir columnas por ahí.
    expect(vista).toMatch(/o\.photos\s*\nfrom public\.opportunities o/);
  });

  it("se guardan al crear y al editar", () => {
    const acciones = l(
      "src",
      "app",
      "[locale]",
      "panel",
      "oportunidades",
      "actions.ts",
    );
    // Dos veces: una en el insert y otra en el update. Si solo está en
    // una, el club sube las fotos, las ve, guarda… y al editar
    // cualquier otra cosa desaparecen sin avisar.
    const guardados = acciones.match(/photos: leerFotos\(formData\)/g) ?? [];
    expect(guardados, "tiene que estar en crear Y en editar").toHaveLength(2);
  });

  it("la copia de una oportunidad se lleva las fotos", () => {
    const acciones = l(
      "src",
      "app",
      "[locale]",
      "panel",
      "oportunidades",
      "actions.ts",
    );
    const duplicar = acciones.slice(
      acciones.indexOf("export async function duplicarOportunidad"),
    );
    expect(duplicar).toContain("photos: original.photos");
    // Y la consulta tiene que pedirlas, que si no copia `undefined`.
    expect(duplicar.slice(0, duplicar.indexOf("insert"))).toContain("photos");
  });

  it("el formulario las manda como campo del formulario", () => {
    const campo = l(
      "src",
      "app",
      "[locale]",
      "panel",
      "oportunidades",
      "components",
      "FotosDeLaOportunidad.tsx",
    );
    expect(campo).toContain('name="fotos"');
    expect(campo).toContain('type="hidden"');
    const acciones = l(
      "src",
      "app",
      "[locale]",
      "panel",
      "oportunidades",
      "actions.ts",
    );
    expect(acciones).toContain('formData.getAll("fotos")');
  });

  it("al editar llegan las que ya tenía", () => {
    // Sin esto, editar el precio de una oportunidad le borraría las
    // fotos: el formulario las mandaría vacías.
    const tarjeta = l(
      "src",
      "app",
      "[locale]",
      "panel",
      "oportunidades",
      "components",
      "TarjetaOportunidad.tsx",
    );
    expect(tarjeta).toContain("fotos: oportunidad.fotos");
  });

  it("el mapeador sobrevive a una consulta sin la columna", () => {
    // Hay consultas escritas antes de la migración 0052. Si el mapeador
    // no lo contempla, la ficha revienta al recorrer `undefined`.
    const mapeador = l("src", "lib", "opportunity-mappers.ts");
    expect(mapeador).toContain("fotos: row.photos ?? []");
  });

  it("se ven en los tres sitios", () => {
    const sitios: [string, string[]][] = [
      [
        "la ficha de la oportunidad",
        [
          "src",
          "app",
          "[locale]",
          "club",
          "[slug]",
          "oportunidad",
          "[id]",
          "page.tsx",
        ],
      ],
      [
        "el buscador",
        [
          "src",
          "app",
          "[locale]",
          "buscar",
          "components",
          "ResultadosBuscador.tsx",
        ],
      ],
      [
        "la lista del club",
        [
          "src",
          "app",
          "[locale]",
          "club",
          "[slug]",
          "components",
          "ListadoDeOportunidades.tsx",
        ],
      ],
    ];
    for (const [nombre, ruta] of sitios) {
      const fuente = l(...ruta);
      expect(fuente, `${nombre} no enseña las fotos`).toMatch(
        /FotosDeLaOportunidad|oportunidad\.foto|fotoDePortada/,
      );
    }
  });

  it("sin fotos no se pinta ningún hueco", () => {
    const galeria = l(
      "src",
      "app",
      "[locale]",
      "club",
      "[slug]",
      "components",
      "FotosDeLaOportunidad.tsx",
    );
    expect(galeria).toContain("return null");
  });
});

describe("la carpeta del almacén", () => {
  it("el subidor admite la carpeta de oportunidades", () => {
    // La política del almacén solo mira que la carpeta raíz sea el
    // identificador de quien sube, así que una subcarpeta nueva vale;
    // lo que hay que tocar es el tipo, o no compila.
    for (const archivo of [
      ["src", "lib", "club-storage.ts"],
      ["src", "app", "[locale]", "panel", "components", "ImageUploader.tsx"],
    ]) {
      expect(l(...archivo)).toContain('"oportunidades"');
    }
  });

  it("la migración no inventa un bucket nuevo", () => {
    // `club-media` ya existe y es público en lectura, que es justo lo
    // que hace falta: son fotos de catálogo. Un bucket nuevo serían
    // políticas nuevas sin motivo.
    const migracion = l(
      "supabase",
      "migrations",
      "0052_fotos_de_la_oportunidad.sql",
    );
    expect(migracion).not.toContain("storage.buckets");
    expect(migracion).toContain("club-media");
  });
});

describe("no se ha colado basura de las pruebas", () => {
  it("no quedan páginas de prueba en la aplicación", () => {
    const rutas: string[] = [];
    (function recorrer(d: string) {
      for (const e of readdirSync(d)) {
        const p = join(d, e);
        if (statSync(p).isDirectory()) recorrer(p);
        else rutas.push(p);
      }
    })(join(RAIZ, "src"));
    const sospechosas = rutas.filter((r) =>
      /zzz|prueba-tema|prueba-menu/.test(r),
    );
    expect(
      sospechosas,
      `han quedado archivos de prueba: ${sospechosas.join(", ")}`,
    ).toHaveLength(0);
  });
});
