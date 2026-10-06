import { readFileSync } from "node:fs";
import { join } from "node:path";
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

/**
 * Lo encogido para el teléfono tiene que seguir siendo grande en el
 * ordenador.
 *
 * Las cinco tarjetas y la portada se hicieron más pequeñas SOLO en el
 * teléfono: ahí la portada se comía 256 px —media pantalla— antes de
 * llegar al nombre del club, y las tarjetas llevaban el relleno y la
 * letra del ordenador. En el ordenador las dos cosas estaban bien.
 *
 * El fallo que esto vigila es silencioso. Basta con que alguien quite
 * un `sm:` al retocar una clase para que el ordenador se encoja
 * también, y nadie lo vería: quien toca esto lo está mirando en el
 * teléfono, que es donde se pidió el cambio. La web se quedaría con
 * una ficha diminuta en pantalla grande hasta que un club se quejara.
 *
 * Por eso se comprueban por parejas: el tamaño pequeño y el `sm:` que
 * devuelve el de antes. Si mañana hay que cambiar una medida, se
 * cambia aquí también —ese es el trabajo que esta prueba pide a
 * cambio—, pero no se puede borrar media pareja sin enterarse.
 */
describe("las medidas de la ficha en el teléfono", () => {
  const RAIZ = join(process.cwd(), "src", "app", "[locale]", "club", "[slug]");
  const TARJETAS = readFileSync(join(RAIZ, "components", "DatosDestacados.tsx"), "utf8");
  const PAGINA = readFileSync(join(RAIZ, "page.tsx"), "utf8");

  // Sin esto, un archivo renombrado o vacío dejaría pasar todo lo demás.
  it("encuentra los dos archivos", () => {
    expect(TARJETAS).toContain("export function DatosDestacados");
    expect(PAGINA).toContain("object-cover");
  });

  it("la portada es más baja en el teléfono y sigue alta en el ordenador", () => {
    expect(PAGINA).toContain("h-44 w-full overflow-hidden");
    expect(PAGINA).toContain("sm:h-80");
  });

  it.each([
    ["el relleno de la tarjeta", "px-2.5 py-2.5", "sm:px-3.5 sm:py-3"],
    ["el hueco de dentro", "gap-1.5", "sm:gap-2"],
    ["el cuadro del icono", "h-7 w-7", "sm:h-8 sm:w-8"],
    ["el icono", "h-4 w-4", "sm:h-[18px] sm:w-[18px]"],
    ["el rótulo", "text-[10px]", "sm:text-[11px]"],
    ["el valor", "text-[13px]", "sm:text-sm"],
  ])("%s se encoge en el teléfono y vuelve a su tamaño en el ordenador", (_, movil, ordenador) => {
    expect(TARJETAS).toContain(movil);
    expect(TARJETAS).toContain(ordenador);
  });
});
