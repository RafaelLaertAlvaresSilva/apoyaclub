import { describe, expect, it } from "vitest";
import {
  CATEGORIAS_IDEA,
  descripcionDeLaIdea,
  IDEAS,
  buscarIdea,
  ideasDeCategoria,
  ideasParaElClub,
  requisitosDelClub,
  textoDeLoQueFalta,
  type RequisitoIdea,
} from "@/lib/catalogo-ideas";
import { CATEGORIAS_NECESIDAD, TIPOS_OPORTUNIDAD } from "@/lib/opportunities";

describe("el catálogo, por dentro", () => {
  it("no repite identificadores: son claves y acaban en la URL", () => {
    const ids = IDEAS.map((idea) => idea.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("cada idea se guarda en uno de los seis tipos que entiende el buscador", () => {
    const tipos = new Set(TIPOS_OPORTUNIDAD.map((tipo) => tipo.id));
    for (const idea of IDEAS) {
      expect(tipos.has(idea.tipo), `${idea.id} usa un tipo desconocido`).toBe(true);
    }
  });

  it("todas las categorías del menú tienen al menos una idea", () => {
    for (const categoria of CATEGORIAS_IDEA) {
      expect(ideasDeCategoria(categoria.id).length, `${categoria.id} está vacía`).toBeGreaterThan(0);
    }
  });

  it("ninguna idea sugiere un precio: eso lo decide el club", () => {
    for (const idea of IDEAS) {
      const texto = `${idea.titulo} ${idea.queEs} ${idea.queRecibeLaEmpresa} ${idea.duracion}`;
      expect(texto, `${idea.id} menciona un importe`).not.toMatch(/\d+\s*(€|eur|euros)/i);
    }
  });

  it("las necesidades llevan su categoría, que es lo que permite buscarlas", () => {
    const categorias = new Set(CATEGORIAS_NECESIDAD.map((categoria) => categoria.id));
    for (const idea of IDEAS.filter((idea) => idea.esNecesidad)) {
      expect(idea.categoriaNecesidad, `${idea.id} no dice de qué es`).toBeDefined();
      expect(categorias.has(idea.categoriaNecesidad!)).toBe(true);
    }
  });

  it("solo las de 'lo que necesitas' van al revés", () => {
    for (const idea of IDEAS) {
      expect(Boolean(idea.esNecesidad)).toBe(idea.categoria === "servicios");
    }
  });

  /**
   * Una idea que el club no puede cumplir no se esconde: se enseña
   * apagada y con el motivo ("añade tus redes sociales"). Por eso el
   * requisito no es una restricción, es la ayuda — y olvidarlo deja al
   * club delante de una idea que no puede hacer, sin saber por qué.
   *
   * Hay categorías en las que el requisito no admite discusión: no se
   * vende el hueco de una camiseta sin equipos, ni un directo sin un
   * sitio donde retransmitir. Esto lo sujeta para la idea 113.
   */
  it("cada categoría que depende de algo lo pide", () => {
    const OBLIGATORIO: Partial<Record<(typeof IDEAS)[number]["categoria"], RequisitoIdea>> = {
      equipaciones: "equipos",
      instalaciones: "instalaciones",
      redes: "redes",
      cantera: "cantera",
      // Un directo por Instagram o YouTube sigue necesitando la cuenta.
      retransmisiones: "redes",
      // Todo lo de "contenido" se entrega publicándolo en algún sitio.
      contenido: "redes",
    };

    const sinPedirlo = IDEAS.filter((idea) => {
      const obligatorio = OBLIGATORIO[idea.categoria];
      return obligatorio != null && !(idea.requiere ?? []).includes(obligatorio);
    }).map((idea) => idea.id);

    expect(sinPedirlo).toEqual([]);
  });

  it("no pide requisitos que no existen", () => {
    const validos: RequisitoIdea[] = ["equipos", "cantera", "instalaciones", "redes", "publico"];
    for (const idea of IDEAS) {
      for (const requisito of idea.requiere ?? []) {
        expect(validos, `${idea.id} pide "${requisito}"`).toContain(requisito);
      }
    }
  });

  it("no repite el mismo requisito dos veces en una idea", () => {
    for (const idea of IDEAS) {
      const requisitos = idea.requiere ?? [];
      expect(new Set(requisitos).size, idea.id).toBe(requisitos.length);
    }
  });

  it("lo que el club necesita no le pide requisitos: lo pide él, no lo da", () => {
    // Un club puede necesitar un autobús tenga la ficha como la tenga.
    for (const idea of IDEAS.filter((una) => una.esNecesidad)) {
      expect(idea.requiere ?? [], idea.id).toEqual([]);
    }
  });

  it("ninguna descripción se queda a medias", () => {
    for (const idea of IDEAS) {
      expect(idea.queEs.length, `${idea.id}`).toBeGreaterThan(30);
      expect(idea.queRecibeLaEmpresa.length, `${idea.id}`).toBeGreaterThan(30);
    }
  });
});

describe("requisitosDelClub", () => {
  const vacio = {
    facilities: null,
    facilitiesAddress: null,
    socialLinks: {},
    youthTeamsCount: null,
    youthPlayersCount: null,
    averageAttendance: null,
  };

  it("un club con la ficha en blanco no cumple nada", () => {
    expect(requisitosDelClub(vacio, []).size).toBe(0);
  });

  it("sin ficha ninguna, tampoco se inventa nada", () => {
    expect(requisitosDelClub(null, []).size).toBe(0);
  });

  it("un equipo de cantera basta para tener cantera, aunque no haya números", () => {
    const tiene = requisitosDelClub(vacio, [{ teamLevel: "cantera" }]);
    expect(tiene.has("cantera")).toBe(true);
    expect(tiene.has("equipos")).toBe(true);
  });

  it("los datos agregados de cantera también valen", () => {
    expect(requisitosDelClub({ ...vacio, youthPlayersCount: 80 }, []).has("cantera")).toBe(true);
  });

  it("una red social vacía no cuenta como red social", () => {
    expect(requisitosDelClub({ ...vacio, socialLinks: { instagram: "   " } }, []).has("redes")).toBe(
      false,
    );
    expect(
      requisitosDelClub({ ...vacio, socialLinks: { instagram: "https://x" } }, []).has("redes"),
    ).toBe(true);
  });

  it("la dirección del campo vale como instalaciones", () => {
    expect(
      requisitosDelClub({ ...vacio, facilitiesAddress: "Pabellón municipal" }, []).has(
        "instalaciones",
      ),
    ).toBe(true);
  });

  it("hace falta público apuntado, no cero", () => {
    expect(requisitosDelClub({ ...vacio, averageAttendance: 0 }, []).has("publico")).toBe(false);
    expect(requisitosDelClub({ ...vacio, averageAttendance: 240 }, []).has("publico")).toBe(true);
  });
});

describe("ideasParaElClub", () => {
  it("marca como no disponible lo que el club todavía no puede dar", () => {
    const sinNada = new Set<RequisitoIdea>();
    const conInstalaciones = new Set<RequisitoIdea>(["instalaciones"]);

    const lona = ideasParaElClub("instalaciones", sinNada).find(
      (idea) => idea.id === "instalaciones-lona",
    );
    expect(lona?.disponible).toBe(false);
    expect(lona?.leFalta).toEqual(["instalaciones"]);

    const lonaConFicha = ideasParaElClub("instalaciones", conInstalaciones).find(
      (idea) => idea.id === "instalaciones-lona",
    );
    expect(lonaConFicha?.disponible).toBe(true);
  });

  it("no esconde nada: las que faltan van detrás, no fuera", () => {
    const todas = ideasDeCategoria("instalaciones").length;
    expect(ideasParaElClub("instalaciones", new Set()).length).toBe(todas);
  });

  it("las disponibles van primero", () => {
    const lista = ideasParaElClub("instalaciones", new Set<RequisitoIdea>(["publico"]));
    const primerNo = lista.findIndex((idea) => !idea.disponible);
    if (primerNo !== -1) {
      expect(lista.slice(primerNo).every((idea) => !idea.disponible)).toBe(true);
    }
  });
});

describe("descripcionDeLaIdea", () => {
  it("junta qué es y qué se lleva la empresa, sin huecos que rellenar", () => {
    const idea = buscarIdea("equipacion-pecho")!;
    const texto = descripcionDeLaIdea(idea);

    expect(texto).toContain(idea.queEs);
    expect(texto).toContain(idea.queRecibeLaEmpresa);
    expect(texto).not.toContain("[");
  });
});

describe("textoDeLoQueFalta", () => {
  it("lo dice en castellano y no con nombres de campos", () => {
    expect(textoDeLoQueFalta(["instalaciones"])).toBe("cuenta dónde jugáis");
    expect(textoDeLoQueFalta(["cantera", "redes"])).toBe(
      "añade los datos de tu cantera y añade tus redes sociales",
    );
  });
});

describe("buscarIdea", () => {
  it("devuelve null en vez de reventar si el id no existe", () => {
    expect(buscarIdea("no-existe")).toBeNull();
  });
});
