import { describe, expect, it } from "vitest";
import {
  etiquetaDeCategoria,
  loQueLeEncaja,
  MAXIMO_POR_CORREO,
  type NecesidadQueEncaja,
} from "@/lib/avisos-empresa";

function necesidad(cambios: Partial<NecesidadQueEncaja> = {}): NecesidadQueEncaja {
  return {
    id: "n1",
    titulo: "Buscamos fisioterapeuta",
    categoria: "fisioterapia",
    clubNombre: "Club Prueba",
    clubSlug: "club-prueba",
    clubProvincia: "Alicante",
    ...cambios,
  };
}

/**
 * Esta es la regla de la que depende que el correo sea útil o sea spam.
 * Un aviso que no encaja se perdona una vez; al segundo, la empresa se
 * da de baja y no vuelve.
 */
describe("qué le encaja a cada empresa", () => {
  const ofreceFisio = new Set(["fisioterapia"]);

  it("le llega lo de su categoría", () => {
    const encajan = loQueLeEncaja({ province: "Alicante" }, ofreceFisio, [necesidad()]);
    expect(encajan).toHaveLength(1);
  });

  it("no le llega lo de otra categoría", () => {
    const encajan = loQueLeEncaja({ province: "Alicante" }, ofreceFisio, [
      necesidad({ categoria: "transporte" }),
    ]);
    expect(encajan).toEqual([]);
  });

  /**
   * La provincia estrecha, no amplía: quien ha dicho dónde está no
   * quiere saber de un club a seiscientos kilómetros.
   */
  it("con provincia puesta, solo de su provincia", () => {
    const encajan = loQueLeEncaja({ province: "Alicante" }, ofreceFisio, [
      necesidad({ id: "cerca", clubProvincia: "Alicante" }),
      necesidad({ id: "lejos", clubProvincia: "Lugo" }),
    ]);

    expect(encajan.map((una) => una.id)).toEqual(["cerca"]);
  });

  it("sin provincia puesta, de toda España", () => {
    const encajan = loQueLeEncaja({ province: null }, ofreceFisio, [
      necesidad({ id: "cerca", clubProvincia: "Alicante" }),
      necesidad({ id: "lejos", clubProvincia: "Lugo" }),
    ]);

    expect(encajan).toHaveLength(2);
  });

  it("un club sin provincia no le llega a quien sí la tiene puesta", () => {
    const encajan = loQueLeEncaja({ province: "Alicante" }, ofreceFisio, [
      necesidad({ clubProvincia: null }),
    ]);
    expect(encajan).toEqual([]);
  });

  it("una empresa que ofrece varias cosas recibe de todas", () => {
    const encajan = loQueLeEncaja({ province: null }, new Set(["fisioterapia", "transporte"]), [
      necesidad({ id: "a", categoria: "fisioterapia" }),
      necesidad({ id: "b", categoria: "transporte" }),
      necesidad({ id: "c", categoria: "imprenta" }),
    ]);

    expect(encajan.map((una) => una.id)).toEqual(["a", "b"]);
  });

  it("sin ofertas con categoría no le llega nada", () => {
    expect(loQueLeEncaja({ province: null }, new Set(), [necesidad()])).toEqual([]);
  });
});

describe("cómo se nombra la categoría en el correo", () => {
  it("usa la etiqueta que ve la gente, no el código interno", () => {
    expect(etiquetaDeCategoria("fisioterapia")).toBe("Fisioterapia");
    expect(etiquetaDeCategoria("restauracion")).toBe("Restauración y catering");
  });

  it("una categoría retirada no deja el correo en blanco", () => {
    expect(etiquetaDeCategoria("lo_que_sea")).toBe("lo_que_sea");
  });
});

describe("el tope por correo", () => {
  it("es pequeño a propósito: más de esto no se lee", () => {
    expect(MAXIMO_POR_CORREO).toBeLessThanOrEqual(5);
  });
});
