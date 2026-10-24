import { describe, expect, it } from "vitest";
import { ORDEN_POR_DEFECTO, moverBloque, ordenDelDossier, seccionesParaGuardar } from "@/lib/dossier-orden";
import { seccionesValidas } from "@/lib/dossier-mappers";

describe("orden de los apartados del dossier", () => {
  it("sin nada guardado, el orden de siempre", () => {
    expect(ordenDelDossier([])).toEqual(ORDEN_POR_DEFECTO);
  });

  it("respeta lo guardado y mete lo que falta en su sitio de siempre", () => {
    // Un dossier guardado antes de poder ordenar: solo secciones marcadas,
    // sin "oportunidades". Sale igual que antes.
    expect(ordenDelDossier(["identidad", "equipos", "patrocinadores"])).toEqual(ORDEN_POR_DEFECTO);

    // Patrocinadores subido arriba del todo: lo demás detrás, en su orden.
    expect(ordenDelDossier(["patrocinadores", "identidad"])).toEqual([
      "patrocinadores",
      "identidad",
      "historia",
      "instalaciones",
      "oportunidades",
      "equipos",
      "cantera",
      "audiencia",
    ]);
  });

  it("ignora lo que no es un apartado y no repite", () => {
    const orden = ordenDelDossier(["audiencia", "nada", "audiencia", 7, null]);
    expect(orden).toHaveLength(ORDEN_POR_DEFECTO.length);
    expect([...orden].sort()).toEqual([...ORDEN_POR_DEFECTO].sort());
  });

  it("guarda solo las marcadas, en su orden, y lo que lee las secciones no nota el cambio", () => {
    const orden = ordenDelDossier(["audiencia", "oportunidades", "identidad"]);
    const guardado = seccionesParaGuardar(orden, ["identidad", "audiencia"]);
    expect(guardado).toEqual(["audiencia", "oportunidades", "identidad"]);
    // Quien solo pregunta qué secciones van no ve "oportunidades".
    expect(seccionesValidas(guardado)).toEqual(["audiencia", "identidad"]);
    // Y al leerlo, las tres siguen en ese orden (las demás se meten en
    // su sitio de siempre, que no cambia nada porque no van).
    const leido = ordenDelDossier(guardado);
    expect(leido.indexOf("audiencia")).toBeLessThan(leido.indexOf("oportunidades"));
    expect(leido.indexOf("oportunidades")).toBeLessThan(leido.indexOf("identidad"));
  });

  it("subir y bajar mueve un puesto, sin salirse de la lista", () => {
    expect(moverBloque(ORDEN_POR_DEFECTO, "historia", -1).slice(0, 2)).toEqual(["historia", "identidad"]);
    expect(moverBloque(ORDEN_POR_DEFECTO, "identidad", -1)).toEqual(ORDEN_POR_DEFECTO);
    expect(moverBloque(ORDEN_POR_DEFECTO, "patrocinadores", 1)).toEqual(ORDEN_POR_DEFECTO);
  });

  it("se salta los que no se ven (secciones sin datos)", () => {
    // Sin historia ni instalaciones en la lista, subir "oportunidades" la
    // pone delante de identidad, que es la de encima que sí se ve.
    const visibles = ORDEN_POR_DEFECTO.filter((bloque) => bloque !== "historia" && bloque !== "instalaciones");
    const nuevo = moverBloque(ORDEN_POR_DEFECTO, "oportunidades", -1, visibles);
    expect(nuevo.indexOf("oportunidades")).toBeLessThan(nuevo.indexOf("identidad"));
    expect(nuevo).toHaveLength(ORDEN_POR_DEFECTO.length);
  });
});
