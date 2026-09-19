import { describe, expect, it } from "vitest";
import {
  accionesPorResponsable,
  beneficioEnTexto,
  condicionesEnTexto,
  leerAcciones,
  leerBeneficios,
  leerResponsable,
  tieneFicha,
} from "@/lib/ficha-oportunidad";

/**
 * Lo que llega del jsonb no es de fiar: lo escribió una versión
 * anterior del formulario o alguien tocando la petición. Si entra tal
 * cual, un objeto raro tumba la ficha pública del club — justo la
 * página que tiene que estar siempre en pie.
 */
describe("leer lo que recibe la empresa", () => {
  it("deja pasar lo que tiene forma de línea", () => {
    expect(leerBeneficios([{ texto: "Publicaciones", cantidad: 4 }])).toEqual([
      { texto: "Publicaciones", cantidad: 4 },
    ]);
  });

  it("una línea sin texto no es una línea", () => {
    expect(leerBeneficios([{ texto: "   ", cantidad: 4 }])).toEqual([]);
  });

  it("descarta la basura sin llevarse lo bueno por delante", () => {
    expect(leerBeneficios([null, 42, "texto", { texto: "Vale" }])).toEqual([
      { texto: "Vale", cantidad: null },
    ]);
  });

  it("lo que no es una lista no da nada", () => {
    expect(leerBeneficios({ texto: "Publicaciones" })).toEqual([]);
    expect(leerBeneficios(null)).toEqual([]);
  });

  /** "0 publicaciones" no es un beneficio, es una errata. */
  it("el cero no cuenta como cantidad", () => {
    expect(leerBeneficios([{ texto: "Publicaciones", cantidad: 0 }])[0].cantidad).toBeNull();
  });

  it("ni los negativos ni las barbaridades", () => {
    expect(leerBeneficios([{ texto: "A", cantidad: -3 }])[0].cantidad).toBeNull();
    expect(leerBeneficios([{ texto: "A", cantidad: 100000 }])[0].cantidad).toBeNull();
  });

  it("una cantidad que llega como texto se entiende igual", () => {
    expect(leerBeneficios([{ texto: "A", cantidad: "4" }])[0].cantidad).toBe(4);
  });

  it("pone tope al número de líneas", () => {
    const muchas = Array.from({ length: 100 }, (_, i) => ({ texto: `Línea ${i}` }));
    expect(leerBeneficios(muchas)).toHaveLength(30);
  });
});

describe("leer quién hace qué", () => {
  it("guarda el responsable", () => {
    expect(leerAcciones([{ texto: "Diseño", responsable: "empresa" }])).toEqual([
      { texto: "Diseño", responsable: "empresa" },
    ]);
  });

  /**
   * Un responsable desconocido cae en "club" y no tira la línea: es
   * mejor una acción con el dueño equivocado —que se ve y se corrige—
   * que una acción que desaparece sin que nadie se entere.
   */
  it("un responsable que no existe cae en el club", () => {
    expect(leerAcciones([{ texto: "Diseño", responsable: "vecino" }])[0].responsable).toBe("club");
    expect(leerResponsable(undefined)).toBe("club");
  });
});

describe("cómo se agrupa para enseñarlo", () => {
  const acciones = leerAcciones([
    { texto: "Publicaciones", responsable: "club" },
    { texto: "Producto", responsable: "empresa" },
    { texto: "El evento", responsable: "ambos" },
    { texto: "Fotos", responsable: "club" },
  ]);

  it("saca los tres grupos en orden fijo", () => {
    expect(accionesPorResponsable(acciones).map((grupo) => grupo.responsable)).toEqual([
      "club",
      "empresa",
      "ambos",
    ]);
  });

  it("no deja apartados vacíos", () => {
    const soloClub = leerAcciones([{ texto: "Fotos", responsable: "club" }]);
    expect(accionesPorResponsable(soloClub)).toHaveLength(1);
  });

  it("no pierde ninguna línea por el camino", () => {
    const total = accionesPorResponsable(acciones).reduce((suma, g) => suma + g.lineas.length, 0);
    expect(total).toBe(acciones.length);
  });
});

describe("la línea de un beneficio", () => {
  it("lleva la cantidad delante cuando la hay", () => {
    expect(beneficioEnTexto({ texto: "Stories", cantidad: 8 })).toBe("8 × Stories");
  });

  it("y sin cantidad va sola, sin un 1 inventado", () => {
    expect(beneficioEnTexto({ texto: "Logo en la camiseta", cantidad: null })).toBe(
      "Logo en la camiseta",
    );
  });
});

describe("las condiciones", () => {
  const vacias = {
    duracion: null,
    frecuencia: null,
    desde: null,
    hasta: null,
    exclusividad: null,
    requisitos: null,
  };

  /** Un "Frecuencia: —" no informa de nada y hace que la ficha parezca
   * a medias. */
  it("lo que no está rellenado no sale", () => {
    expect(condicionesEnTexto(vacias)).toEqual([]);
  });

  it("junta las dos fechas en una sola línea", () => {
    const lineas = condicionesEnTexto({
      ...vacias,
      desde: "2026-09-01",
      hasta: "2027-06-30",
    });

    expect(lineas).toHaveLength(1);
    expect(lineas[0].que).toBe("Fechas");
    expect(lineas[0].valor).toContain("Del 1 de septiembre de 2026");
  });

  it("con una sola fecha lo dice con la palabra correcta", () => {
    expect(condicionesEnTexto({ ...vacias, desde: "2026-09-01" })[0].que).toBe("Desde");
    expect(condicionesEnTexto({ ...vacias, hasta: "2027-06-30" })[0].que).toBe("Hasta");
  });

  it("una fecha inservible no saca una línea rota", () => {
    expect(condicionesEnTexto({ ...vacias, desde: "no es una fecha" })).toEqual([]);
  });
});

describe("si hay algo que enseñar", () => {
  it("con una lista rellenada, sí", () => {
    expect(tieneFicha({ beneficios: [{ texto: "A", cantidad: null }], acciones: [] })).toBe(true);
  });

  it("sin nada, no", () => {
    expect(tieneFicha({ beneficios: [], acciones: [] })).toBe(false);
  });
});
