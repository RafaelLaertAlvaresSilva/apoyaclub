import { describe, expect, it } from "vitest";
import { UMBRAL_FICHA_FLOJA, convieneAvisar, huecosDelPerfil } from "@/lib/profile-completion";
import { equipoDePrueba, patrocinadorDePrueba, perfilDePrueba } from "../fixtures/club";

/**
 * El porcentaje lo calcula la base de datos (migración 0020). Lo que se
 * prueba aquí es la lista de huecos: qué se le dice al club que le falta
 * y en qué orden, que es la parte con decisiones de producto dentro.
 */
describe("huecosDelPerfil", () => {
  it("no devuelve nada si todavía no hay club", () => {
    expect(huecosDelPerfil(null, [], [])).toEqual([]);
  });

  it("un club recién creado tiene huecos, y el logo va primero", () => {
    const huecos = huecosDelPerfil(perfilDePrueba(), [], []);

    expect(huecos.length).toBeGreaterThan(5);
    expect(huecos[0].id).toBe("logo");
  });

  it("deja de listar lo que ya está rellenado", () => {
    const conLogo = huecosDelPerfil(perfilDePrueba({ logoUrl: "https://x/logo.png" }), [], []);

    expect(conLogo.map((hueco) => hueco.id)).not.toContain("logo");
  });

  it("tiene en cuenta equipos y patrocinadores, que viven fuera del perfil", () => {
    const sinNada = huecosDelPerfil(perfilDePrueba(), [], []).map((hueco) => hueco.id);
    expect(sinNada).toContain("equipos");
    expect(sinNada).toContain("patrocinadores");

    const conAmbos = huecosDelPerfil(
      perfilDePrueba(),
      [equipoDePrueba()],
      [patrocinadorDePrueba()],
    ).map((hueco) => hueco.id);

    expect(conAmbos).not.toContain("equipos");
    expect(conAmbos).not.toContain("patrocinadores");
  });

  it("cada hueco explica por qué le conviene al club, no solo qué falta", () => {
    for (const hueco of huecosDelPerfil(perfilDePrueba(), [], [])) {
      expect(hueco.porQue.length).toBeGreaterThan(20);
      expect(hueco.titulo.length).toBeGreaterThan(5);
    }
  });

  it("no repite identificadores", () => {
    const ids = huecosDelPerfil(perfilDePrueba(), [], []).map((hueco) => hueco.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});

describe("convieneAvisar", () => {
  it("avisa por debajo del umbral y calla por encima", () => {
    expect(convieneAvisar(UMBRAL_FICHA_FLOJA - 1)).toBe(true);
    expect(convieneAvisar(UMBRAL_FICHA_FLOJA)).toBe(false);
    expect(convieneAvisar(100)).toBe(false);
  });
});

describe("máxima categoría por sexo (migración 0035)", () => {
  it("el hueco se cierra rellenando solo la masculina", () => {
    const ids = huecosDelPerfil(
      perfilDePrueba({ topCategoryMale: "Primera Nacional" }),
      [],
      [],
    ).map((hueco) => hueco.id);

    expect(ids).not.toContain("nivel");
  });

  it("y también rellenando solo la femenina", () => {
    const ids = huecosDelPerfil(
      perfilDePrueba({ topCategoryFemale: "Autonómica" }),
      [],
      [],
    ).map((hueco) => hueco.id);

    expect(ids).not.toContain("nivel");
  });

  it("un club que solo tiene la categoría de antes tampoco pierde puntos", () => {
    // Los que la rellenaron cuando había una sola casilla no pueden
    // empezar a ver un hueco que ya habían tapado.
    const ids = huecosDelPerfil(perfilDePrueba({ topCategory: "Primera Nacional" }), [], []).map(
      (hueco) => hueco.id,
    );

    expect(ids).not.toContain("nivel");
  });
});

describe("el hueco de nivel deportivo sigue apareciendo cuando toca", () => {
  it("un club sin ninguna de las tres lo tiene abierto", () => {
    const ids = huecosDelPerfil(perfilDePrueba(), [], []).map((hueco) => hueco.id);
    expect(ids).toContain("nivel");
  });
});
