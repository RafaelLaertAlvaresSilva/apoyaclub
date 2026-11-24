import { describe, expect, it } from "vitest";
import { GUIAS, guiaPorSlug, guiasRelacionadas, indiceDe, minutosDeLectura, textoPlano, trozosDe } from "@/lib/guias";
import { cabeceraLinkSeo } from "@/lib/enlaces-seo";
import { existsSync } from "node:fs";
import { join } from "node:path";

describe("las guías publicadas", () => {
  it("tienen slugs únicos y en minúsculas con guiones", () => {
    const slugs = GUIAS.map((g) => g.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
    for (const slug of slugs) expect(slug).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/);
  });

  for (const guia of GUIAS) {
    describe(guia.slug, () => {
      it("tiene resumen, preguntas frecuentes y portada que existe", () => {
        expect(guia.resumen.length).toBeGreaterThanOrEqual(3);
        expect(guia.preguntas.length).toBeGreaterThanOrEqual(3);
        expect(existsSync(join(process.cwd(), "public", guia.portada))).toBe(true);
      });

      it("tiene título y descripción del tamaño que muestra Google", () => {
        expect(guia.tituloSeo.length).toBeLessThanOrEqual(75);
        expect(guia.descripcion.length).toBeGreaterThanOrEqual(110);
        expect(guia.descripcion.length).toBeLessThanOrEqual(165);
      });

      it("tiene apartados con anclas únicas para el índice", () => {
        const ids = indiceDe(guia).map((a) => a.id);
        expect(ids.length).toBeGreaterThanOrEqual(3);
        expect(new Set(ids).size).toBe(ids.length);
      });

      it("da un tiempo de lectura razonable", () => {
        expect(minutosDeLectura(guia)).toBeGreaterThanOrEqual(3);
      });

      it("no promete precios de patrocinio en euros", () => {
        // Las oportunidades salen "a convenir" y cada club decide; las
        // guías no dan cifras que el club no ha puesto.
        expect(JSON.stringify(guia)).not.toMatch(/\d\s?€|€\s?\d/);
      });

      it("solo enlaza a rutas internas sin idioma delante", () => {
        const enlaces = [...JSON.stringify(guia).matchAll(/\]\((\/[^)]*)\)/g)].map((m) => m[1]);
        for (const href of enlaces) expect(href).not.toMatch(/^\/(es|pt|en|br)\//);
      });
    });
  }

  it("busca por slug y sugiere relacionadas sin repetir la propia", () => {
    const guia = GUIAS[0];
    expect(guiaPorSlug(guia.slug)).toBe(guia);
    expect(guiaPorSlug("no-existe")).toBeUndefined();
    expect(guiasRelacionadas(guia).map((g) => g.slug)).not.toContain(guia.slug);
  });
});

describe("el texto de las guías", () => {
  it("separa negritas y enlaces", () => {
    expect(trozosDe("Hola **mundo** y [ver](/para-clubes) fin")).toEqual([
      { tipo: "texto", texto: "Hola " },
      { tipo: "negrita", texto: "mundo" },
      { tipo: "texto", texto: " y " },
      { tipo: "enlace", texto: "ver", href: "/para-clubes" },
      { tipo: "texto", texto: " fin" },
    ]);
  });

  it("quita las marcas para contar palabras", () => {
    expect(textoPlano("Un **club** y [ApoyaClub](/x)")).toBe("Un club y ApoyaClub");
  });
});

describe("enlaces para Google en las guías", () => {
  it("solo anuncian la versión en español", () => {
    const link = cabeceraLinkSeo("https://apoyaclub.com", "/es/guias/una-guia") ?? "";
    expect(link).toContain('<https://apoyaclub.com/es/guias/una-guia>; rel="canonical"');
    expect(link).not.toContain("/pt/guias");
    expect(link).not.toContain("/en/guias");
  });

  it("el resto de páginas siguen anunciando los cuatro idiomas", () => {
    const link = cabeceraLinkSeo("https://apoyaclub.com", "/es/para-clubes") ?? "";
    expect(link).toContain("/pt/para-clubes");
    expect(link).toContain("/br/para-clubes");
  });
});
