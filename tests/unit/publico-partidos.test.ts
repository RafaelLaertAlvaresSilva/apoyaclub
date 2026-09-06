import { describe, expect, it } from "vitest";
import {
  agruparPorTemporada,
  fechaCorta,
  fechaLarga,
  hoyParaElFormulario,
  mediaParaLaFicha,
  resumirPublico,
  soloEnCasa,
  temporadaDe,
  type Partido,
} from "@/lib/publico-partidos";

function partido(parcial: Partial<Partido> & { fecha: string; publico: number }): Partido {
  return {
    id: `${parcial.fecha}-${parcial.publico}`,
    clubId: "club-1",
    rival: "C.D. Ejemplo",
    competicion: null,
    equipo: null,
    enCasa: true,
    notas: null,
    ...parcial,
  };
}

describe("temporadaDe", () => {
  it("mete los partidos de primavera en la temporada que empezó el verano anterior", () => {
    expect(temporadaDe("2026-05-12")).toBe("2025/26");
    expect(temporadaDe("2026-01-07")).toBe("2025/26");
    expect(temporadaDe("2026-06-30")).toBe("2025/26");
  });

  it("empieza temporada nueva el 1 de julio", () => {
    expect(temporadaDe("2026-07-01")).toBe("2026/27");
    expect(temporadaDe("2026-09-04")).toBe("2026/27");
  });

  it("rellena con cero el año que acaba en cifra baja", () => {
    expect(temporadaDe("2099-08-01")).toBe("2099/00");
    expect(temporadaDe("2100-08-01")).toBe("2100/01");
  });
});

describe("resumirPublico", () => {
  it("no inventa una media cuando no hay partidos", () => {
    expect(resumirPublico([])).toEqual({ partidos: 0, total: 0, media: null, mejor: null });
  });

  it("suma, promedia redondeando y encuentra el mejor", () => {
    const resumen = resumirPublico([
      partido({ fecha: "2026-09-01", publico: 100 }),
      partido({ fecha: "2026-09-08", publico: 301 }),
    ]);

    expect(resumen.partidos).toBe(2);
    expect(resumen.total).toBe(401);
    expect(resumen.media).toBe(201);
    expect(resumen.mejor?.publico).toBe(301);
  });
});

describe("soloEnCasa", () => {
  it("deja fuera los partidos de fuera", () => {
    const partidos = [
      partido({ fecha: "2026-09-01", publico: 100 }),
      partido({ fecha: "2026-09-08", publico: 900, enCasa: false }),
    ];

    expect(soloEnCasa(partidos)).toHaveLength(1);
    expect(resumirPublico(soloEnCasa(partidos)).media).toBe(100);
  });
});

describe("agruparPorTemporada", () => {
  const partidos = [
    partido({ fecha: "2025-10-05", publico: 120 }),
    partido({ fecha: "2026-09-01", publico: 200 }),
    partido({ fecha: "2026-03-15", publico: 180 }),
  ];

  it("pone la temporada más reciente primero", () => {
    expect(agruparPorTemporada(partidos).map((t) => t.temporada)).toEqual(["2026/27", "2025/26"]);
  });

  it("junta en la misma temporada el otoño y la primavera siguiente", () => {
    const temporada = agruparPorTemporada(partidos).find((t) => t.temporada === "2025/26");
    expect(temporada?.partidos).toHaveLength(2);
    expect(temporada?.resumen.total).toBe(300);
  });

  it("ordena cada temporada del partido más reciente al más antiguo", () => {
    const temporada = agruparPorTemporada(partidos).find((t) => t.temporada === "2025/26");
    expect(temporada?.partidos.map((p) => p.fecha)).toEqual(["2026-03-15", "2025-10-05"]);
  });
});

describe("mediaParaLaFicha", () => {
  it("no propone nada si no hay partidos", () => {
    expect(mediaParaLaFicha([])).toBeNull();
  });

  it("usa solo los de casa de la temporada más reciente", () => {
    const media = mediaParaLaFicha([
      partido({ fecha: "2025-10-05", publico: 1000 }),
      partido({ fecha: "2026-09-01", publico: 200 }),
      partido({ fecha: "2026-09-08", publico: 300 }),
      partido({ fecha: "2026-09-15", publico: 5000, enCasa: false }),
    ]);

    expect(media).toBe(250);
  });

  it("cae a todos los partidos si en la última temporada no jugó en casa", () => {
    const media = mediaParaLaFicha([
      partido({ fecha: "2026-09-01", publico: 400, enCasa: false }),
      partido({ fecha: "2026-09-08", publico: 200, enCasa: false }),
    ]);

    expect(media).toBe(300);
  });
});

describe("fechas", () => {
  it("no se va un día al formatear, pase lo que pase con la zona horaria", () => {
    expect(fechaLarga("2026-01-01")).toBe("1 de enero de 2026");
    expect(fechaCorta("2026-01-01")).toBe("01/01/2026");
  });

  it("usa la fecha local del navegador y no la de UTC", () => {
    // Las 23:30 del 31 de diciembre en España son ya el día 1 en UTC.
    const nochevieja = new Date(2026, 11, 31, 23, 30);
    expect(hoyParaElFormulario(nochevieja)).toBe("2026-12-31");
  });
});
