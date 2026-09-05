import { describe, expect, it } from "vitest";
import { ETIQUETA_FRANJA, parametrosAFiltrosEmpresas } from "@/lib/directorio-empresas";

describe("parametrosAFiltrosEmpresas", () => {
  it("lee lo que viene en la URL", () => {
    const filtros = parametrosAFiltrosEmpresas({
      q: "ferretería",
      provincia: "Valencia",
      franja: "hasta_500,de_500_a_2000",
      objetivo: "familias,deporte_base",
    });

    expect(filtros.texto).toBe("ferretería");
    expect(filtros.provincia).toBe("Valencia");
    expect(filtros.franjas).toEqual(["hasta_500", "de_500_a_2000"]);
    expect(filtros.objetivos).toEqual(["familias", "deporte_base"]);
  });

  it("acepta también un parámetro repetido, que es como los manda un formulario", () => {
    const filtros = parametrosAFiltrosEmpresas({ franja: ["hasta_500", "mas_2000"] });
    expect(filtros.franjas).toEqual(["hasta_500", "mas_2000"]);
  });

  it("tira las franjas que no existen en vez de pasárselas a la base", () => {
    const filtros = parametrosAFiltrosEmpresas({ franja: "hasta_500,inventada,'; drop table--" });
    expect(filtros.franjas).toEqual(["hasta_500"]);
  });

  it("trata el texto vacío o de solo espacios como si no viniera", () => {
    expect(parametrosAFiltrosEmpresas({ q: "   " }).texto).toBeUndefined();
    expect(parametrosAFiltrosEmpresas({}).texto).toBeUndefined();
    expect(parametrosAFiltrosEmpresas({}).franjas).toEqual([]);
  });

  it("quita los espacios de sobra del texto", () => {
    expect(parametrosAFiltrosEmpresas({ q: "  panadería  " }).texto).toBe("panadería");
  });
});

describe("ETIQUETA_FRANJA", () => {
  it("tiene texto para las tres franjas que produce la vista", () => {
    expect(ETIQUETA_FRANJA.hasta_500).toBe("Hasta 500 €");
    expect(ETIQUETA_FRANJA.de_500_a_2000).toBe("Entre 500 y 2.000 €");
    expect(ETIQUETA_FRANJA.mas_2000).toBe("Más de 2.000 €");
  });
});
