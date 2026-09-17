import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { empresasConocidasDe } from "@/lib/tareas-patrocinio";

const RAIZ = join(__dirname, "..", "..");

describe("empresasConocidasDe", () => {
  it("pone delante a los patrocinadores de la ficha, con su identificador", () => {
    const empresas = empresasConocidasDe(
      [{ id: "abc", name: "Ferretería Ramírez" }],
      [{ empresa: "Bar Paco" }],
    );

    expect(empresas).toEqual([
      { id: null, nombre: "Bar Paco" },
      { id: "abc", nombre: "Ferretería Ramírez" },
    ]);
  });

  it("no repite la misma empresa escrita de otra forma", () => {
    const empresas = empresasConocidasDe(
      [{ id: "abc", name: "Ferretería Ramírez" }],
      [{ empresa: "ferretería ramírez" }, { empresa: "  Ferretería Ramírez  " }],
    );

    expect(empresas).toEqual([{ id: "abc", nombre: "Ferretería Ramírez" }]);
  });

  it("descarta los nombres vacíos", () => {
    expect(empresasConocidasDe([], [{ empresa: "   " }, { empresa: "" }])).toEqual([]);
  });

  it("ordena alfabéticamente, en español", () => {
    const empresas = empresasConocidasDe([], [
      { empresa: "Zapatería" },
      { empresa: "Óptica" },
      { empresa: "Bar" },
    ]);

    expect(empresas.map((empresa) => empresa.nombre)).toEqual(["Bar", "Óptica", "Zapatería"]);
  });
});

/**
 * El motivo de todo esto.
 *
 * El campo "Empresa" era una casilla de texto con un `<datalist>`
 * detrás. En el móvil eso no se abre, así que desde el teléfono no
 * había forma de elegir a los patrocinadores que el club ya tiene. Un
 * `<select>` sí se abre en cualquier teléfono.
 */
describe("el formulario de tareas", () => {
  // Sin los comentarios: ahí abajo se explica por qué ya no hay
  // `<datalist>`, y esa explicación no debe hacer pasar la prueba.
  const fuente = readFileSync(
    join(RAIZ, "src/app/[locale]/panel/tareas/components/TareasManager.tsx"),
    "utf8",
  ).replace(/\/\*[\s\S]*?\*\//g, "");

  it("elige la empresa con un desplegable de verdad, no con una lista de sugerencias", () => {
    expect(fuente).toContain("<select");
    expect(fuente).not.toContain("datalist");
  });

  it("manda el identificador del patrocinador junto al nombre", () => {
    expect(fuente).toContain('name="patrocinadorId"');
  });
});
