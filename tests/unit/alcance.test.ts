import { describe, expect, it } from "vitest";
import {
  calcularAlcance,
  cifrasDePortada,
  cifrasDelInforme,
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
    expect(minimo?.valor).toBe(800);
    expect(minimo?.valor).not.toBe(320 + 150 + 800 + 500 + 120);
    expect(minimo?.cuenta).toContain("No se suman");
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
