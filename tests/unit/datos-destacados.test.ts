import { describe, expect, it } from "vitest";
import { datosDestacados } from "@/app/[locale]/club/[slug]/components/DatosDestacados";
import { equipoDePrueba, perfilDePrueba } from "../fixtures/club";

/** Los datos, por su clave, para poder mirarlos de uno en uno. */
function porClave(datos: ReturnType<typeof datosDestacados>) {
  return Object.fromEntries(datos.map((dato) => [dato.clave, dato.valor]));
}

/**
 * La fila de datos destacados de la ficha pública del club.
 *
 * Lo que de verdad hay que vigilar aquí no es el diseño: es que NO SE
 * INVENTE NADA. Una ficha a medio rellenar tiene que enseñar dos datos
 * y verse entera, no cinco con tres ceros. Un "0 jugadores" o un
 * "Equipos de cantera: 0" en la ficha de un club dice algo falso sobre
 * ese club delante de la empresa que está decidiendo si le escribe.
 */
describe("los datos destacados de un club", () => {
  it("un club recién creado no enseña ningún número inventado", () => {
    const datos = datosDestacados(perfilDePrueba(), [], [], "");
    expect(datos).toHaveLength(0);
  });

  it("no enseña jugadores si ningún equipo ha dicho cuántos son", () => {
    const equipos = [
      equipoDePrueba({ id: "a", playerCount: null }),
      equipoDePrueba({ id: "b", playerCount: null }),
    ];
    const datos = datosDestacados(perfilDePrueba(), equipos, ["Balonmano"], "");
    expect(porClave(datos).jugadores).toBeUndefined();
  });

  it("suma los jugadores de los equipos que sí lo han dicho", () => {
    const equipos = [
      equipoDePrueba({ id: "a", playerCount: 16 }),
      equipoDePrueba({ id: "b", playerCount: null }),
      equipoDePrueba({ id: "c", playerCount: 14 }),
    ];
    const datos = datosDestacados(perfilDePrueba(), equipos, [], "");
    expect(porClave(datos).jugadores).toBe("30");
  });

  it("junta la categoría masculina y la femenina cuando hay las dos", () => {
    const datos = datosDestacados(
      perfilDePrueba({ topCategoryMale: "Primera Nacional", topCategoryFemale: "Primera Autonómica" }),
      [],
      [],
      "",
    );
    expect(porClave(datos).categoria).toBe("Primera Nacional (M) · Primera Autonómica (F)");
  });

  it("si el club no ha repartido la categoría por sexos, usa la de antes", () => {
    // Migración 0035: antes había un solo campo. Un club que no haya
    // vuelto a editar su ficha desde entonces no puede quedarse sin
    // enseñar su categoría.
    const datos = datosDestacados(perfilDePrueba({ topCategory: "Segunda Nacional" }), [], [], "");
    expect(porClave(datos).categoria).toBe("Segunda Nacional");
  });

  it("cuenta los equipos de cantera si el club no ha escrito cuántos tiene", () => {
    const equipos = [
      equipoDePrueba({ id: "a", teamLevel: "primer_equipo" }),
      equipoDePrueba({ id: "b", teamLevel: "cantera" }),
      equipoDePrueba({ id: "c", teamLevel: "cantera" }),
    ];
    const datos = datosDestacados(perfilDePrueba({ youthTeamsCount: null }), equipos, [], "");
    expect(porClave(datos).cantera).toBe("2");
  });

  it("manda lo que el club ha escrito sobre lo que se puede contar", () => {
    // El club sabe cuántos equipos de cantera tiene; la lista de equipos
    // de su ficha puede estar a medio rellenar.
    const equipos = [equipoDePrueba({ id: "a", teamLevel: "cantera" })];
    const datos = datosDestacados(perfilDePrueba({ youthTeamsCount: 9 }), equipos, [], "");
    expect(porClave(datos).cantera).toBe("9");
  });

  it("el deporte va en singular o en plural según cuántos haya", () => {
    const uno = datosDestacados(perfilDePrueba(), [], ["Balonmano"], "");
    expect(uno.find((d) => d.clave === "deporte")?.etiqueta).toBe("Deporte");

    const varios = datosDestacados(perfilDePrueba(), [], ["Balonmano", "Fútbol sala"], "");
    expect(varios.find((d) => d.clave === "deporte")?.etiqueta).toBe("Deportes");
  });

  it("enseña los cinco cuando el club los tiene todos", () => {
    const datos = datosDestacados(
      perfilDePrueba({ topCategory: "Primera Nacional", youthTeamsCount: 9 }),
      [equipoDePrueba({ id: "a", playerCount: 16 })],
      ["Balonmano"],
      "Benidorm, Alicante",
    );
    expect(datos.map((d) => d.clave)).toEqual([
      "deporte",
      "categoria",
      "jugadores",
      "cantera",
      "ubicacion",
    ]);
  });
});
