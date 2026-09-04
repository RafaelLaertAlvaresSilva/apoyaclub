import { describe, expect, it } from "vitest";
import {
  agruparPorEmpresa,
  contarCaducadas,
  cuantoFalta,
  estadoVisible,
  hoyISO,
  prepararLineas,
  sumarDias,
  tareasParaHoy,
  type TareaPatrocinio,
} from "@/lib/tareas-patrocinio";

const HOY = "2026-09-04";

function tarea(cambios: Partial<TareaPatrocinio> = {}): TareaPatrocinio {
  return {
    id: "t1",
    clubId: "c1",
    empresa: "Ferretería Ramírez",
    patrocinadorId: null,
    accion: "2 publicaciones en Instagram",
    notas: null,
    inicio: null,
    fin: HOY,
    estado: "pendiente",
    hechaEn: null,
    pruebaUrl: null,
    creadaEn: "2026-08-01T00:00:00Z",
    ...cambios,
  };
}

describe("estadoVisible", () => {
  it("marca caducada la que se pasó de fecha y sigue pendiente", () => {
    expect(estadoVisible(tarea({ fin: "2026-09-03" }), HOY)).toBe("caducada");
  });

  it("no marca caducada la que ya está hecha o cancelada", () => {
    const vencida = { fin: "2026-08-01" };
    expect(estadoVisible(tarea({ ...vencida, estado: "hecho", hechaEn: "x" }), HOY)).toBe("hecha");
    expect(estadoVisible(tarea({ ...vencida, estado: "cancelado" }), HOY)).toBe("cancelada");
  });

  it("distingue hoy, esta semana y más adelante", () => {
    expect(estadoVisible(tarea({ fin: HOY }), HOY)).toBe("hoy");
    expect(estadoVisible(tarea({ fin: "2026-09-09" }), HOY)).toBe("pronto");
    expect(estadoVisible(tarea({ fin: "2026-09-11" }), HOY)).toBe("pronto");
    expect(estadoVisible(tarea({ fin: "2026-09-12" }), HOY)).toBe("programada");
  });

  it("no se equivoca al cambiar de mes ni de año", () => {
    expect(sumarDias("2026-12-28", 7)).toBe("2027-01-04");
    expect(sumarDias("2026-02-25", 7)).toBe("2026-03-04");
    // 2028 es bisiesto: el 29 de febrero existe.
    expect(sumarDias("2028-02-28", 1)).toBe("2028-02-29");
  });
});

describe("tareasParaHoy", () => {
  it("coge lo vencido y lo de hoy, con lo más viejo delante", () => {
    const lista = [
      tarea({ id: "futura", fin: "2026-10-01" }),
      tarea({ id: "hoy", fin: HOY }),
      tarea({ id: "vieja", fin: "2026-08-20" }),
      tarea({ id: "hecha", fin: "2026-08-01", estado: "hecho", hechaEn: "x" }),
    ];

    expect(tareasParaHoy(lista, HOY).map((t) => t.id)).toEqual(["vieja", "hoy"]);
  });

  it("no devuelve nada cuando el club va al día", () => {
    expect(tareasParaHoy([tarea({ fin: "2026-12-01" })], HOY)).toEqual([]);
  });
});

describe("contarCaducadas", () => {
  it("cuenta solo las pendientes con la fecha pasada", () => {
    const lista = [
      tarea({ id: "a", fin: "2026-08-01" }),
      tarea({ id: "b", fin: "2026-08-02" }),
      tarea({ id: "c", fin: "2026-08-03", estado: "hecho", hechaEn: "x" }),
      tarea({ id: "d", fin: "2026-12-01" }),
    ];

    expect(contarCaducadas(lista, HOY)).toBe(2);
  });
});

describe("agruparPorEmpresa", () => {
  it("pone delante las empresas con algo vencido", () => {
    const lista = [
      tarea({ id: "1", empresa: "Panadería", fin: "2026-12-01" }),
      tarea({ id: "2", empresa: "Ferretería", fin: "2026-08-01" }),
    ];

    expect(agruparPorEmpresa(lista, HOY).map((g) => g.empresa)).toEqual(["Ferretería", "Panadería"]);
  });

  it("dentro de una empresa deja lo cerrado al final", () => {
    const lista = [
      tarea({ id: "hecha", fin: "2026-08-01", estado: "hecho", hechaEn: "x" }),
      tarea({ id: "pendiente", fin: "2026-12-01" }),
    ];

    const grupo = agruparPorEmpresa(lista, HOY)[0];
    expect(grupo.tareas.map((t) => t.id)).toEqual(["pendiente", "hecha"]);
    expect(grupo.pendientes).toBe(1);
  });

  it("junta las que se escribieron con espacios de más", () => {
    const lista = [
      tarea({ id: "1", empresa: "Ferretería Ramírez" }),
      tarea({ id: "2", empresa: "  Ferretería Ramírez  " }),
    ];

    expect(agruparPorEmpresa(lista, HOY)).toHaveLength(1);
  });
});

describe("cuantoFalta", () => {
  it("dice lo que queda en palabras", () => {
    expect(cuantoFalta(HOY, HOY)).toBe("vence hoy");
    expect(cuantoFalta("2026-09-05", HOY)).toBe("vence mañana");
    expect(cuantoFalta("2026-09-03", HOY)).toBe("vencía ayer");
    expect(cuantoFalta("2026-09-14", HOY)).toBe("vence en 10 días");
    expect(cuantoFalta("2026-08-25", HOY)).toBe("vencía hace 10 días");
  });

  it("cuenta bien aunque el cambio de hora caiga en medio", () => {
    // El último domingo de octubre se atrasa el reloj en España. Con
    // fechas convertidas a Date en UTC esto salía 6 días o 8.
    expect(cuantoFalta("2026-11-01", "2026-10-25")).toBe("vence en 7 días");
  });
});

describe("hoyISO", () => {
  it("usa la fecha local, no la de UTC", () => {
    // 23:30 hora local del 4 de septiembre. En UTC ya sería día 5 en
    // España (UTC+2 en verano), y el club vería vencer sus tareas un
    // día antes de tiempo.
    expect(hoyISO(new Date(2026, 8, 4, 23, 30))).toBe("2026-09-04");
  });
});

describe("prepararLineas", () => {
  const campos = (
    acciones: string[],
    fines: string[],
    inicios: string[] = [],
    notas: string[] = [],
  ) => ({ acciones, fines, inicios, notas });

  it("acepta varias cosas de una vez para la misma empresa", () => {
    const resultado = prepararLineas(
      campos(
        ["2 publicaciones en Instagram", "Vídeo", "Visita de los jugadores"],
        ["2026-11-30", "2026-12-15", "2026-12-20"],
      ),
    );

    expect("lineas" in resultado && resultado.lineas).toHaveLength(3);
    expect("lineas" in resultado && resultado.lineas[1].accion).toBe("Vídeo");
    expect("lineas" in resultado && resultado.lineas[2].fin).toBe("2026-12-20");
  });

  it("tira las líneas que quedaron del todo vacías", () => {
    const resultado = prepararLineas(
      campos(["Vídeo", "", ""], ["2026-12-15", "", ""], ["", "", ""], ["", "", ""]),
    );

    expect("lineas" in resultado && resultado.lineas).toHaveLength(1);
  });

  it("avisa de la línea a medias en vez de guardarla mal", () => {
    const sinFecha = prepararLineas(campos(["Vídeo"], [""]));
    expect("error" in sinFecha && sinFecha.error).toContain("Vídeo");

    const sinAccion = prepararLineas(campos([""], ["2026-12-15"]));
    expect("error" in sinAccion && sinAccion.error).toContain("qué hay que hacer");
  });

  it("no deja poner el inicio después de la fecha límite", () => {
    const resultado = prepararLineas(
      campos(["Valla"], ["2026-10-01"], ["2026-11-01"], [""]),
    );

    expect("error" in resultado && resultado.error).toContain("posterior");
  });

  it("no acepta una fecha con otra forma", () => {
    const resultado = prepararLineas(campos(["Vídeo"], ["15/12/2026"]));
    expect("error" in resultado).toBe(true);
  });

  it("se queja si no ha quedado ninguna línea", () => {
    const resultado = prepararLineas(campos([], []));
    expect("error" in resultado && resultado.error).toContain("al menos una");
  });

  it("recorta los textos larguísimos en vez de dejar que falle la base", () => {
    const resultado = prepararLineas(
      campos(["x".repeat(400)], ["2026-12-15"], [""], ["y".repeat(2000)]),
    );

    expect("lineas" in resultado && resultado.lineas[0].accion).toHaveLength(200);
    expect("lineas" in resultado && resultado.lineas[0].notas).toHaveLength(1000);
  });
});
