import { describe, expect, it } from "vitest";
import {
  esEstadoValido,
  esOrigenValido,
  estaAbierto,
  fechaDelPaso,
  ordenarParaTrabajar,
  prospectoRowToProspecto,
  resumirProspectos,
  type Prospecto,
  type ProspectoRow,
} from "@/lib/prospectos";

const HOY = "2026-09-13";

function prospecto(parcial: Partial<Prospecto> & { id: string }): Prospecto {
  return {
    clubId: "club-1",
    nombre: "Ferretería Martínez",
    sector: null,
    contactoNombre: null,
    contactoDatos: null,
    origen: "familia",
    estado: "pendiente",
    notas: null,
    proximoPaso: null,
    creadoEn: "2026-09-01T10:00:00.000Z",
    ...parcial,
  };
}

describe("prospectoRowToProspecto", () => {
  const fila: ProspectoRow = {
    id: "p1",
    club_id: "club-1",
    name: "Bar Paco",
    sector: "Hostelería",
    contact_name: "Paco",
    contact_info: "600 000 000",
    origin: "barrio",
    status: "contactado",
    notes: "Nos dio jamón para la gala",
    next_action_on: "2026-10-03",
    created_at: "2026-09-01T10:00:00.000Z",
  };

  it("traduce la fila entera", () => {
    const resultado = prospectoRowToProspecto(fila);
    expect(resultado.nombre).toBe("Bar Paco");
    expect(resultado.origen).toBe("barrio");
    expect(resultado.estado).toBe("contactado");
    expect(resultado.proximoPaso).toBe("2026-10-03");
  });

  it("un valor desconocido en la base de datos no rompe la pantalla", () => {
    const raro = prospectoRowToProspecto({ ...fila, origin: "inventado", status: "vete a saber" });
    expect(raro.origen).toBe("otro");
    expect(raro.estado).toBe("pendiente");
  });
});

describe("estaAbierto", () => {
  it("sigue viva mientras no se cierre", () => {
    expect(estaAbierto(prospecto({ id: "a", estado: "pendiente" }))).toBe(true);
    expect(estaAbierto(prospecto({ id: "b", estado: "contactado" }))).toBe(true);
    expect(estaAbierto(prospecto({ id: "c", estado: "interesado" }))).toBe(true);
  });

  it("un acuerdo o un no ya no piden nada", () => {
    expect(estaAbierto(prospecto({ id: "d", estado: "acuerdo" }))).toBe(false);
    expect(estaAbierto(prospecto({ id: "e", estado: "descartado" }))).toBe(false);
  });
});

describe("resumirProspectos", () => {
  const lista = [
    prospecto({ id: "1", estado: "pendiente" }),
    prospecto({ id: "2", estado: "contactado", proximoPaso: "2026-09-10" }),
    prospecto({ id: "3", estado: "interesado", proximoPaso: "2026-09-13" }),
    prospecto({ id: "4", estado: "interesado", proximoPaso: "2026-12-01" }),
    prospecto({ id: "5", estado: "acuerdo" }),
    prospecto({ id: "6", estado: "descartado", proximoPaso: "2026-01-01" }),
  ];

  it("cuenta cada grupo", () => {
    const resumen = resumirProspectos(lista, HOY);
    expect(resumen.total).toBe(6);
    expect(resumen.porContactar).toBe(1);
    expect(resumen.enConversacion).toBe(3);
    expect(resumen.acuerdos).toBe(1);
  });

  it("toca hoy lo vencido y lo de hoy mismo, no lo futuro", () => {
    expect(resumirProspectos(lista, HOY).tocanHoy).toBe(2);
  });

  it("una fecha vencida de algo ya cerrado no reclama nada", () => {
    const soloCerrado = [prospecto({ id: "x", estado: "descartado", proximoPaso: "2020-01-01" })];
    expect(resumirProspectos(soloCerrado, HOY).tocanHoy).toBe(0);
  });

  it("sin nada apuntado, todo a cero", () => {
    expect(resumirProspectos([], HOY)).toEqual({
      total: 0,
      porContactar: 0,
      enConversacion: 0,
      acuerdos: 0,
      tocanHoy: 0,
    });
  });
});

describe("ordenarParaTrabajar", () => {
  it("lo que toca hoy manda, aunque esté recién apuntado", () => {
    const lista = [
      prospecto({ id: "nuevo", estado: "pendiente", creadoEn: "2026-09-12T10:00:00.000Z" }),
      prospecto({ id: "vencido", estado: "contactado", proximoPaso: "2026-09-01" }),
    ];
    expect(ordenarParaTrabajar(lista, HOY)[0].id).toBe("vencido");
  });

  it("entre lo vencido, primero lo más antiguo", () => {
    const lista = [
      prospecto({ id: "menos", estado: "contactado", proximoPaso: "2026-09-12" }),
      prospecto({ id: "mas", estado: "contactado", proximoPaso: "2026-08-01" }),
    ];
    expect(ordenarParaTrabajar(lista, HOY).map((p) => p.id)).toEqual(["mas", "menos"]);
  });

  it("lo cerrado se va al final", () => {
    const lista = [
      prospecto({ id: "acuerdo", estado: "acuerdo" }),
      prospecto({ id: "no", estado: "descartado" }),
      prospecto({ id: "vivo", estado: "pendiente" }),
    ];
    const orden = ordenarParaTrabajar(lista, HOY).map((p) => p.id);
    expect(orden[0]).toBe("vivo");
    expect(orden[orden.length - 1]).toBe("no");
  });

  it("no toca la lista que le dan", () => {
    const lista = [prospecto({ id: "a" }), prospecto({ id: "b", estado: "acuerdo" })];
    const copia = [...lista];
    ordenarParaTrabajar(lista, HOY);
    expect(lista).toEqual(copia);
  });
});

describe("validación de catálogos", () => {
  it("solo pasan los valores conocidos", () => {
    expect(esOrigenValido("familia")).toBe(true);
    expect(esOrigenValido("amigo del alcalde")).toBe(false);
    expect(esEstadoValido("acuerdo")).toBe(true);
    expect(esEstadoValido("regular")).toBe(false);
  });
});

describe("fechaDelPaso", () => {
  it("lo escribe como lo diría una persona", () => {
    expect(fechaDelPaso("2026-10-03")).toBe("3 de octubre de 2026");
  });

  it("con algo que no es una fecha, lo devuelve tal cual", () => {
    expect(fechaDelPaso("pronto")).toBe("pronto");
  });
});
