import { describe, expect, it } from "vitest";
import { cabeceraLinkSeo } from "@/lib/enlaces-seo";

describe("cabeceraLinkSeo", () => {
  it("canónica de la propia página, sin parámetros, y sus cuatro idiomas con pt-BR", () => {
    const link = cabeceraLinkSeo("https://apoyaclub.com", "/br/para-clubes")!;
    expect(link).toContain('<https://apoyaclub.com/br/para-clubes>; rel="canonical"');
    expect(link).toContain('<https://apoyaclub.com/br/para-clubes>; rel="alternate"; hreflang="pt-BR"');
    expect(link).toContain('<https://apoyaclub.com/pt/para-clubes>; rel="alternate"; hreflang="pt-PT"');
    expect(link).toContain('<https://apoyaclub.com/es/para-clubes>; rel="alternate"; hreflang="x-default"');
    expect(link).not.toContain('hreflang="br"');
  });

  it("la portada de cada idioma no lleva barra final", () => {
    expect(cabeceraLinkSeo("https://apoyaclub.com", "/es")).toContain('<https://apoyaclub.com/es>; rel="canonical"');
    expect(cabeceraLinkSeo("https://apoyaclub.com", "/es/")).toContain('<https://apoyaclub.com/es>; rel="canonical"');
  });

  it("sin idioma en la dirección, nada", () => {
    expect(cabeceraLinkSeo("https://apoyaclub.com", "/sitemap.xml")).toBeNull();
  });
});
