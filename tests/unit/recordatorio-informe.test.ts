import { describe, expect, it } from "vitest";
import {
  colaboracionesTerminadas,
  cuandoFueElUltimo,
  cuandoTermino,
  empresasPendientesDeInforme,
  ventanaDeInforme,
} from "@/lib/recordatorio-informe";
import type { TareaPatrocinio } from "@/lib/tareas-patrocinio";

const base = {
  clubId: "c1",
  patrocinadorId: null,
  notas: null,
  inicio: null,
  hechaEn: null,
  pruebaUrl: null,
  creadaEn: "2026-01-01T00:00:00Z",
  accion: "Publicación en Instagram",
};

function tarea(cambios: Partial<TareaPatrocinio> & { id: string }): TareaPatrocinio {
  return { ...base, empresa: "Ferretería Ramírez", fin: "2026-10-15", estado: "pendiente", ...cambios };
}

const hecha = (id: string, empresa: string, hechaEn: string) =>
  tarea({ id, empresa, estado: "hecho", hechaEn });

describe("ventanaDeInforme", () => {
  it("avisa a mitad de temporada, en diciembre y en enero", () => {
    expect(ventanaDeInforme("2026-12-05")?.tipo).toBe("mitad");
    expect(ventanaDeInforme("2027-01-20")?.tipo).toBe("mitad");
  });

  it("enero cuenta como la misma vuelta que diciembre, no como una nueva", () => {
    // Si la ventana de enero empezara el 1 de enero, un club que
    // descargó el informe el 20 de diciembre volvería a verse avisado
    // dos semanas después.
    expect(ventanaDeInforme("2026-12-05")?.desde).toBe("2026-12-01");
    expect(ventanaDeInforme("2027-01-20")?.desde).toBe("2026-12-01");
  });

  it("avisa al final, en mayo y en junio", () => {
    expect(ventanaDeInforme("2027-05-02")?.tipo).toBe("final");
    expect(ventanaDeInforme("2027-06-28")?.desde).toBe("2027-05-01");
  });

  it("calla el resto del año", () => {
    for (const fecha of ["2026-09-15", "2026-11-30", "2027-02-01", "2027-04-20", "2027-07-10"]) {
      expect(ventanaDeInforme(fecha)).toBeNull();
    }
  });
});

describe("colaboracionesTerminadas", () => {
  it("saca la empresa cuando no le queda nada pendiente", () => {
    const terminadas = colaboracionesTerminadas(
      [
        hecha("1", "Torneo Verano SL", "2026-07-06T10:00:00Z"),
        hecha("2", "Torneo Verano SL", "2026-07-08T10:00:00Z"),
      ],
      new Map(),
    );

    expect(terminadas).toHaveLength(1);
    expect(terminadas[0].terminadaEl).toBe("2026-07-08");
  });

  it("avisa en cualquier mes, no solo en las ventanas de temporada", () => {
    // Un torneo de un fin de semana en septiembre no puede esperar a
    // diciembre: es el caso que la ventana de temporada se dejaba fuera.
    const terminadas = colaboracionesTerminadas(
      [hecha("1", "Torneo Verano SL", "2026-09-06T10:00:00Z")],
      new Map(),
    );

    expect(terminadas).toHaveLength(1);
    expect(ventanaDeInforme("2026-09-10")).toBeNull();
  });

  it("no avisa si todavía queda algo pendiente", () => {
    const terminadas = colaboracionesTerminadas(
      [hecha("1", "Ferretería Ramírez", "2026-10-14T10:00:00Z"), tarea({ id: "2" })],
      new Map(),
    );

    expect(terminadas).toHaveLength(0);
  });

  it("tampoco si se canceló todo: no hay nada que contar", () => {
    const terminadas = colaboracionesTerminadas(
      [tarea({ id: "1", estado: "cancelado" }), tarea({ id: "2", estado: "cancelado" })],
      new Map(),
    );

    expect(terminadas).toHaveLength(0);
  });

  it("deja de avisar en cuanto se descarga el informe", () => {
    const tareas = [hecha("1", "Torneo Verano SL", "2026-07-08T10:00:00Z")];

    expect(
      colaboracionesTerminadas(tareas, new Map([["torneo verano sl", "2026-07-09T12:00:00Z"]])),
    ).toHaveLength(0);

    // Uno de antes de terminar no vale: no cuenta lo último que se hizo.
    expect(
      colaboracionesTerminadas(tareas, new Map([["torneo verano sl", "2026-07-01T12:00:00Z"]])),
    ).toHaveLength(1);
  });

  it("cuenta desde el día en que se marcó, no desde la fecha límite", () => {
    // Una valla contratada hasta junio que ya está puesta y marcada se
    // terminó el día que se marcó, no en junio.
    const terminadas = colaboracionesTerminadas(
      [hecha("1", "Ferretería Ramírez", "2026-09-20T10:00:00Z")].map((t) => ({
        ...t,
        fin: "2027-06-30",
      })),
      new Map(),
    );

    expect(terminadas[0].terminadaEl).toBe("2026-09-20");
  });

  it("pone delante la que se terminó más recientemente", () => {
    const terminadas = colaboracionesTerminadas(
      [hecha("1", "Vieja SL", "2026-03-01T10:00:00Z"), hecha("2", "Reciente SL", "2026-09-01T10:00:00Z")],
      new Map(),
    );

    expect(terminadas.map((t) => t.empresa)).toEqual(["Reciente SL", "Vieja SL"]);
  });
});

describe("empresasPendientesDeInforme", () => {
  const ventana = ventanaDeInforme("2026-12-05")!;

  it("saca las que no tienen ningún informe", () => {
    const pendientes = empresasPendientesDeInforme(
      [tarea({ id: "1" }), tarea({ id: "2", empresa: "Panadería La Espiga" })],
      new Map(),
      ventana,
    );

    expect(pendientes.map((p) => p.empresa)).toEqual(["Ferretería Ramírez", "Panadería La Espiga"]);
  });

  it("quita las que ya lo tienen de esta ventana", () => {
    const pendientes = empresasPendientesDeInforme(
      [tarea({ id: "1" }), tarea({ id: "2", empresa: "Panadería La Espiga" })],
      new Map([["ferretería ramírez", "2026-12-03T10:00:00Z"]]),
      ventana,
    );

    expect(pendientes.map((p) => p.empresa)).toEqual(["Panadería La Espiga"]);
  });

  it("uno de la vuelta anterior no cuenta", () => {
    const pendientes = empresasPendientesDeInforme(
      [tarea({ id: "1" })],
      new Map([["ferretería ramírez", "2026-05-20T10:00:00Z"]]),
      ventana,
    );

    expect(pendientes).toHaveLength(1);
  });

  it("no repite las que ya salen como colaboración terminada", () => {
    const tareas = [hecha("1", "Torneo Verano SL", "2026-11-30T10:00:00Z"), tarea({ id: "2" })];
    const terminadas = colaboracionesTerminadas(tareas, new Map());

    const pendientes = empresasPendientesDeInforme(tareas, new Map(), ventana, terminadas);

    expect(terminadas.map((t) => t.empresa)).toEqual(["Torneo Verano SL"]);
    expect(pendientes.map((p) => p.empresa)).toEqual(["Ferretería Ramírez"]);
  });

  it("no le importan las mayúsculas ni los espacios del nombre", () => {
    const pendientes = empresasPendientesDeInforme(
      [tarea({ id: "1", empresa: "  Ferretería Ramírez " })],
      new Map([["ferretería ramírez", "2026-12-03T10:00:00Z"]]),
      ventana,
    );

    expect(pendientes).toHaveLength(0);
  });
});

describe("textos", () => {
  it("dice claramente que no hay ningún informe", () => {
    expect(cuandoFueElUltimo(null)).toContain("todavía no");
  });

  it("y si lo hay, de qué mes es", () => {
    expect(cuandoFueElUltimo("2026-10-03T09:00:00Z")).toContain("octubre");
  });

  it("no se va de mes por la zona horaria", () => {
    // El 1 de noviembre a las 00:30 en España es 31 de octubre en UTC.
    // Se lee la fecha tal cual, sin convertir.
    expect(cuandoFueElUltimo("2026-11-01T00:30:00")).toContain("noviembre");
  });

  it("dice el día en que terminó la colaboración", () => {
    expect(cuandoTermino("2026-07-08")).toBe("terminado el 8 de julio");
  });
});
