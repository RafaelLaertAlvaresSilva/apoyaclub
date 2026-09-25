import { describe, expect, it } from "vitest";
import {
  calcularAlcance,
  cifrasDePortada,
  cifraLlana,
  cifrasDelInforme,
  resumenLlano,
  unidadEnTexto,
  type CifraDeAlcance,
} from "@/lib/alcance";
import type { Partido } from "@/lib/publico-partidos";
import { equipoDePrueba, perfilDePrueba } from "../fixtures/club";

function partido(parcial: Partial<Partido> & { fecha: string; publico: number }): Partido {
  return {
    id: `${parcial.fecha}-${parcial.publico}`,
    clubId: "club-1",
    rival: "C.D. Ejemplo",
    competicion: null,
    equipo: null,
    equipoId: null,
    enCasa: true,
    notas: null,
    ...parcial,
  };
}

const buscar = (cifras: CifraDeAlcance[], id: string) => cifras.find((c) => c.id === id);

describe("calcularAlcance", () => {
  it("no devuelve nada cuando el club está vacío", () => {
    const informe = calcularAlcance({ perfil: perfilDePrueba(), equipos: [], partidos: [] });

    expect(informe.hayCifras).toBe(false);
    expect(informe.bloques).toHaveLength(0);
    expect(informe.titular).toBeNull();
  });

  it("cuenta la media de los partidos en casa y dice de cuántos sale", () => {
    const informe = calcularAlcance({
      perfil: perfilDePrueba(),
      equipos: [],
      partidos: [
        partido({ fecha: "2025-09-14", publico: 200 }),
        partido({ fecha: "2025-10-05", publico: 280 }),
        partido({ fecha: "2025-10-19", publico: 300, enCasa: false }),
      ],
    });

    const media = buscar(cifrasDelInforme(informe), "publicoMedio");
    expect(media?.valor).toBe(240);
    expect(media?.origen).toBe("contado");
    expect(media?.procedencia).toContain("2 partidos apuntados");
    // El partido de fuera no entra en la media de casa, pero sí en el
    // recuento de partidos apuntados.
    expect(buscar(cifrasDelInforme(informe), "partidosApuntados")?.valor).toBe(3);
  });

  it("nunca suma grupos de personas: el mínimo es el mayor, no el total", () => {
    const informe = calcularAlcance({
      perfil: perfilDePrueba({
        membersCount: 320,
        youthFamiliesCount: 150,
        followersByNetwork: { instagram: 800, facebook: 500 },
      }),
      equipos: [equipoDePrueba({ playerCount: 120 })],
      partidos: [],
    });

    const minimo = buscar(cifrasDelInforme(informe), "personasDistintas");
    // Los socios, que es el grupo de personas más grande. Los 800
    // seguidores de Instagram son más, pero no cuentan (ver abajo).
    expect(minimo?.valor).toBe(320);
    expect(minimo?.valor).not.toBe(320 + 150 + 800 + 500 + 120);
    expect(minimo?.cuenta).toContain("No se suman");
  });

  it("los seguidores de redes no entran en las personas distintas", () => {
    // Un club de barrio con 12.000 seguidores no tiene 12.000 personas
    // alrededor: tiene cuentas, muchas de fuera del pueblo. Meterlas
    // aquí convertía la única cifra que se presenta como "gente de
    // verdad del club" en la más inflada del dossier.
    const informe = calcularAlcance({
      perfil: perfilDePrueba({
        membersCount: 320,
        followersByNetwork: { instagram: 12437 },
      }),
      equipos: [],
      partidos: [],
    });

    const cifras = cifrasDelInforme(informe);
    expect(buscar(cifras, "personasDistintas")?.valor).toBe(320);

    // Pero siguen estando, con su nombre y sin disfraz.
    expect(buscar(cifras, "seguidores-instagram")?.valor).toBe(12437);
  });

  it("sin socios ni familias, el mínimo es el público contado y no los seguidores", () => {
    const informe = calcularAlcance({
      perfil: perfilDePrueba({ followersByNetwork: { instagram: 9000 } }),
      equipos: [equipoDePrueba({ playerCount: 60 })],
      partidos: [partido({ fecha: "2025-09-14", publico: 240 })],
    });

    expect(buscar(cifrasDelInforme(informe), "personasDistintas")?.valor).toBe(240);
  });

  it("lista los seguidores red por red y no los suma", () => {
    const informe = calcularAlcance({
      perfil: perfilDePrueba({ followersByNetwork: { instagram: 800, facebook: 500 } }),
      equipos: [],
      partidos: [],
    });

    const cifras = cifrasDelInforme(informe);
    expect(buscar(cifras, "seguidores-instagram")?.valor).toBe(800);
    expect(buscar(cifras, "seguidores-facebook")?.valor).toBe(500);
    expect(cifras.some((c) => c.valor === 1300)).toBe(false);
  });

  it("las asistencias son veces, no personas, y enseñan la multiplicación", () => {
    const partidos = Array.from({ length: 4 }, (_, i) =>
      partido({ fecha: `2025-1${i}-01`, publico: 200 }),
    );
    const informe = calcularAlcance({ perfil: perfilDePrueba(), equipos: [], partidos });

    const asistencias = buscar(cifrasDelInforme(informe), "asistencias");
    expect(asistencias?.valor).toBe(800);
    expect(asistencias?.unidad).toBe("asistencias");
    expect(asistencias?.cuenta).toContain("200 personas × 4 partidos en casa");
    expect(asistencias?.cuenta).toContain("no personas distintas");
  });

  it("titula con lo contado antes que con lo declarado, aunque sea menor", () => {
    const informe = calcularAlcance({
      perfil: perfilDePrueba({ membersCount: 5000 }),
      equipos: [],
      partidos: [partido({ fecha: "2025-09-14", publico: 90 })],
    });

    expect(informe.titular?.id).toBe("publicoMedio");
    expect(informe.titular?.valor).toBe(90);
  });

  it("la estimación escrita a mano nunca es el titular ni entra en el mínimo", () => {
    const informe = calcularAlcance({
      perfil: perfilDePrueba({ estimatedReach: 99999, membersCount: 300 }),
      equipos: [],
      partidos: [],
    });

    expect(informe.titular?.id).not.toBe("alcanceEscrito");
    expect(buscar(cifrasDelInforme(informe), "personasDistintas")?.valor).toBe(300);
    // Pero sigue apareciendo, marcada como lo que es.
    expect(buscar(cifrasDelInforme(informe), "alcanceEscrito")?.procedencia).toContain("escrita");
  });

  it("cada cifra dice de dónde viene", () => {
    const informe = calcularAlcance({
      perfil: perfilDePrueba({ membersCount: 300, youthFamiliesCount: 150 }),
      equipos: [equipoDePrueba({ playerCount: 20 })],
      partidos: [partido({ fecha: "2025-09-14", publico: 200 })],
    });

    for (const cifra of cifrasDelInforme(informe)) {
      expect(cifra.procedencia.length).toBeGreaterThan(0);
      expect(["contado", "declarado", "deducido"]).toContain(cifra.origen);
      if (cifra.origen === "deducido") expect(cifra.cuenta).toBeTruthy();
    }
  });

  it("compara con la temporada anterior solo cuando hay partidos suficientes", () => {
    const pocos = calcularAlcance({
      perfil: perfilDePrueba(),
      equipos: [],
      partidos: [
        partido({ fecha: "2025-09-14", publico: 200 }),
        partido({ fecha: "2024-09-14", publico: 100 }),
      ],
    });
    expect(pocos.comparacion).toBeNull();

    const bastantes = calcularAlcance({
      perfil: perfilDePrueba(),
      equipos: [],
      partidos: [
        partido({ fecha: "2025-09-14", publico: 200 }),
        partido({ fecha: "2025-10-14", publico: 200 }),
        partido({ fecha: "2025-11-14", publico: 200 }),
        partido({ fecha: "2024-09-14", publico: 100 }),
        partido({ fecha: "2024-10-14", publico: 100 }),
        partido({ fecha: "2024-11-14", publico: 100 }),
      ],
    });
    expect(bastantes.comparacion?.porcentaje).toBe(100);
    expect(bastantes.comparacion?.temporadaActual).toBe("2025/26");
    expect(bastantes.comparacion?.temporadaAnterior).toBe("2024/25");
  });

  it("dice lo que falta, y lo primero es apuntar partidos", () => {
    const informe = calcularAlcance({ perfil: perfilDePrueba(), equipos: [], partidos: [] });

    expect(informe.faltan[0]?.id).toBe("publico");
    expect(informe.faltan.map((f) => f.id)).toContain("socios");
    expect(informe.faltan.every((f) => f.ruta.startsWith("/panel"))).toBe(true);
  });
});

describe("cifrasDePortada", () => {
  it("coge la red con más seguidores, nunca la suma de todas", () => {
    const informe = calcularAlcance({
      perfil: perfilDePrueba({ followersByNetwork: { instagram: 800, facebook: 500 } }),
      equipos: [],
      partidos: [],
    });

    const portada = cifrasDePortada(informe);
    expect(portada.filter((c) => c.id.startsWith("seguidores-"))).toHaveLength(1);
    expect(portada.find((c) => c.id.startsWith("seguidores-"))?.valor).toBe(800);
  });

  it("nunca devuelve más de cuatro cifras y pone el público contado primero", () => {
    const informe = calcularAlcance({
      perfil: perfilDePrueba({
        membersCount: 320,
        youthFamiliesCount: 150,
        followersByNetwork: { instagram: 800, facebook: 500, tiktok: 300 },
      }),
      equipos: [equipoDePrueba({ playerCount: 120 })],
      partidos: [partido({ fecha: "2025-09-14", publico: 240 })],
    });

    const portada = cifrasDePortada(informe);
    expect(portada).toHaveLength(4);
    expect(portada[0]?.id).toBe("publicoMedio");
  });
});

describe("unidadEnTexto", () => {
  it("distingue personas de asistencias", () => {
    expect(unidadEnTexto("personas", 240)).toBe("personas");
    expect(unidadEnTexto("personas", 1)).toBe("persona");
    expect(unidadEnTexto("asistencias", 4320)).toBe("asistencias");
  });
});

describe("cifraLlana", () => {
  it("dice entera cualquier cifra por debajo de diez mil", () => {
    // Redondear una media contada partido a partido tira a la basura
    // justo lo que la hace creíble.
    expect(cifraLlana(240)).toBe("240");
    expect(cifraLlana(9999)).toBe("9999");
  });

  it("redondea al millar a partir de diez mil, que es donde deja de leerse", () => {
    expect(cifraLlana(12437)).toBe("12.000");
    expect(cifraLlana(48320)).toBe("48.000");
  });

  it("sigue separando los millares cuando la cifra es enorme", () => {
    // Pegarle ".000" al millar redondeado daba "1234.000" aquí.
    expect(cifraLlana(1234000)).toBe("1.234.000");
  });
});

describe("resumenLlano", () => {
  it("no dice nada de un club sin cifras", () => {
    const informe = calcularAlcance({ perfil: perfilDePrueba(), equipos: [], partidos: [] });
    expect(resumenLlano(informe)).toEqual([]);
  });

  it("habla de lo que gana la empresa, no de lo que tiene el club", () => {
    const informe = calcularAlcance({
      perfil: perfilDePrueba({
        youthFamiliesCount: 150,
        followersByNetwork: { instagram: 800 },
      }),
      equipos: [equipoDePrueba({ playerCount: 120 })],
      partidos: [
        partido({ fecha: "2025-09-14", publico: 240 }),
        partido({ fecha: "2025-09-21", publico: 240 }),
      ],
    });

    const frases = resumenLlano(informe);

    expect(frases[0]).toBe("Cada partido en casa lo ven unas 240 personas.");
    expect(frases).toContain("120 jugadores visten la equipación del club cada semana.");
    expect(frases).toContain(
      "Detrás de la cantera hay 150 familias: padres, abuelos y hermanos que van al campo.",
    );
    expect(frases).toContain("Cuando el club publica en Instagram, lo pueden ver 800 personas.");
  });

  it("nunca pasa de cuatro frases: la quinta ya no se lee", () => {
    const informe = calcularAlcance({
      perfil: perfilDePrueba({
        membersCount: 320,
        youthFamiliesCount: 150,
        estimatedReach: 9000,
        followersByNetwork: { instagram: 800, facebook: 500, tiktok: 300 },
      }),
      equipos: [equipoDePrueba({ playerCount: 120 })],
      partidos: [partido({ fecha: "2025-09-14", publico: 240 })],
    });

    expect(resumenLlano(informe).length).toBeLessThanOrEqual(4);
  });

  it("nombra solo la red mayor, nunca la suma de todas", () => {
    const informe = calcularAlcance({
      perfil: perfilDePrueba({ followersByNetwork: { instagram: 800, facebook: 500 } }),
      equipos: [],
      partidos: [],
    });

    const frases = resumenLlano(informe);
    const deRedes = frases.filter((frase) => frase.includes("publica en"));

    expect(deRedes).toHaveLength(1);
    expect(deRedes[0]).toContain("800");
    // 1.300 sería sumar a la misma persona dos veces.
    expect(frases.join(" ")).not.toContain("1.300");
  });

  it("cae a los socios cuando el club no ha dicho cuántas familias tiene", () => {
    const informe = calcularAlcance({
      perfil: perfilDePrueba({ membersCount: 320 }),
      equipos: [],
      partidos: [],
    });

    expect(resumenLlano(informe)).toContain("El club tiene 320 socios en el pueblo.");
  });

  it("dice \"por partido\" y no \"en casa\" cuando no hay partidos en casa", () => {
    const informe = calcularAlcance({
      perfil: perfilDePrueba(),
      equipos: [],
      partidos: [partido({ fecha: "2025-09-14", publico: 90, enCasa: false })],
    });

    expect(resumenLlano(informe)[0]).toBe("Cada partido lo ven unas 90 personas.");
  });
});
