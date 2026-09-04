import { describe, expect, it } from "vitest";
import { fraseDeResumen, prepararInforme } from "@/lib/informe-patrocinio";
import type { TareaPatrocinio } from "@/lib/tareas-patrocinio";

const HOY = "2027-01-10";

const base = {
  clubId: "c1",
  patrocinadorId: null,
  notas: null,
  inicio: null,
  hechaEn: null,
  pruebaUrl: null,
  creadaEn: "2026-01-01T00:00:00Z",
};

function tarea(cambios: Partial<TareaPatrocinio> & { id: string }): TareaPatrocinio {
  return {
    ...base,
    empresa: "Ferretería Ramírez",
    accion: "Publicación en Instagram",
    fin: "2026-10-15",
    estado: "pendiente",
    ...cambios,
  };
}

describe("prepararInforme", () => {
  const todas = [
    tarea({ id: "1", estado: "hecho", hechaEn: "x", pruebaUrl: "https://instagram.com/p/a" }),
    tarea({ id: "2", estado: "hecho", hechaEn: "x", fin: "2026-11-30" }),
    tarea({ id: "3", fin: "2026-12-26" }),
    tarea({ id: "4", fin: "2027-06-30" }),
    tarea({ id: "5", estado: "cancelado", fin: "2026-10-01" }),
    tarea({ id: "otra", empresa: "Panadería La Espiga", estado: "hecho", hechaEn: "x" }),
  ];

  it("solo coge las de esa empresa", () => {
    const informe = prepararInforme("Ferretería Ramírez", todas, HOY);
    expect(informe.total).toBe(4);
    expect([...informe.cumplidas, ...informe.enMarcha, ...informe.vencidas].map((t) => t.id)).not.toContain(
      "otra",
    );
  });

  it("no le importan las mayúsculas ni los espacios al buscar la empresa", () => {
    expect(prepararInforme("  ferretería ramírez ", todas, HOY).total).toBe(4);
  });

  it("deja fuera las canceladas: son cosas que se acordó no hacer", () => {
    const informe = prepararInforme("Ferretería Ramírez", todas, HOY);
    const ids = [...informe.cumplidas, ...informe.enMarcha, ...informe.vencidas].map((t) => t.id);
    expect(ids).not.toContain("5");
  });

  it("separa cumplidas, en marcha y vencidas", () => {
    const informe = prepararInforme("Ferretería Ramírez", todas, HOY);
    expect(informe.cumplidas.map((t) => t.id)).toEqual(["1", "2"]);
    expect(informe.vencidas.map((t) => t.id)).toEqual(["3"]);
    expect(informe.enMarcha.map((t) => t.id)).toEqual(["4"]);
  });

  it("cuenta cuántas cumplidas llevan prueba", () => {
    expect(prepararInforme("Ferretería Ramírez", todas, HOY).conPrueba).toBe(1);
  });

  it("saca el periodo de la primera y la última fecha", () => {
    const informe = prepararInforme("Ferretería Ramírez", todas, HOY);
    expect(informe.desde).toBe("2026-10-15");
    expect(informe.hasta).toBe("2027-06-30");
  });

  it("no se rompe con una empresa sin nada apuntado", () => {
    const informe = prepararInforme("Nadie", todas, HOY);
    expect(informe.total).toBe(0);
    expect(informe.desde).toBeNull();
  });
});

describe("fraseDeResumen", () => {
  const informe = (cumplidas: number, total: number) =>
    prepararInforme(
      "X",
      [
        ...Array.from({ length: cumplidas }, (_, i) =>
          tarea({ id: `c${i}`, empresa: "X", estado: "hecho", hechaEn: "x" }),
        ),
        ...Array.from({ length: total - cumplidas }, (_, i) =>
          tarea({ id: `p${i}`, empresa: "X", fin: "2027-12-01" }),
        ),
      ],
      HOY,
    );

  it("dice la verdad cuando está todo hecho", () => {
    expect(fraseDeResumen(informe(3, 3))).toBe("Se han cumplido las 3 acciones acordadas.");
    expect(fraseDeResumen(informe(1, 1))).toBe("Se ha cumplido la acción acordada.");
  });

  it("y también cuando falta algo", () => {
    expect(fraseDeResumen(informe(2, 5))).toBe("2 de 5 acciones acordadas ya están cumplidas.");
  });

  it("avisa si no hay nada apuntado", () => {
    expect(fraseDeResumen(informe(0, 0))).toBe("Todavía no hay acciones registradas.");
  });
});
