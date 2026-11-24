import { describe, expect, it } from "vitest";
import {
  grafoDeLaPortada,
  grafoDePreguntas,
  serializarParaScript,
} from "@/lib/datos-estructurados";
import robots from "@/app/robots";

describe("datos estructurados de la portada", () => {
  const grafo = grafoDeLaPortada("https://apoyaclub.com", "es", "Descripción") as {
    "@graph": Record<string, unknown>[];
  };
  const tipos = grafo["@graph"].map((n) => n["@type"]);

  it("describe la organización, su fundador, la web y la aplicación", () => {
    expect(tipos).toEqual(["Organization", "Person", "WebSite", "SoftwareApplication"]);
  });

  it("enlaza el fundador con la organización por su @id", () => {
    const org = grafo["@graph"][0];
    const persona = grafo["@graph"][1];
    expect(org.founder).toEqual({ "@id": persona["@id"] });
    expect(persona.url).toBe("https://apoyaclub.com/es/quienes-somos");
  });

  it("publica los tres precios del club en euros", () => {
    const app = grafo["@graph"][3] as { offers: { price: string; priceCurrency: string }[] };
    expect(app.offers.map((o) => o.price)).toEqual(["199.00", "249.00", "29.90"]);
    expect(app.offers.every((o) => o.priceCurrency === "EUR")).toBe(true);
  });
});

describe("preguntas frecuentes", () => {
  it("convierte cada pregunta en Question con su respuesta", () => {
    const datos = grafoDePreguntas([{ pregunta: "¿Cuesta algo?", respuesta: "No." }]) as {
      "@type": string;
      mainEntity: { name: string; acceptedAnswer: { text: string } }[];
    };
    expect(datos["@type"]).toBe("FAQPage");
    expect(datos.mainEntity[0].name).toBe("¿Cuesta algo?");
    expect(datos.mainEntity[0].acceptedAnswer.text).toBe("No.");
  });

  it("no deja que un texto cierre la etiqueta <script>", () => {
    const json = serializarParaScript(
      grafoDePreguntas([{ pregunta: "x", respuesta: "</script><script>alert(1)</script>" }]),
    );
    expect(json).not.toContain("</script>");
    expect(JSON.parse(json).mainEntity[0].acceptedAnswer.text).toBe("</script><script>alert(1)</script>");
  });
});

/**
 * Reproduce cómo compara Google las reglas de robots.txt: por el
 * principio de la ruta, con `*` como comodín y `$` como final.
 */
function bloqueada(ruta: string, reglas: string[]): boolean {
  return reglas.some((regla) => {
    const patron = regla
      .replace(/[.+?^{}()|[\]\\]/g, "\\$&")
      .replace(/\*/g, ".*");
    return new RegExp(`^${patron}`).test(ruta);
  });
}

describe("robots.txt", () => {
  const reglas = robots().rules as { disallow: string[] };
  const disallow = Array.isArray(reglas) ? reglas[0].disallow : reglas.disallow;

  it("deja que Google vea el directorio de empresas y sus fichas", () => {
    expect(bloqueada("/es/empresas", disallow)).toBe(false);
    expect(bloqueada("/es/empresas/ferreteria-martinez", disallow)).toBe(false);
  });

  it("sigue cerrando el panel de empresa y el resto de zonas privadas", () => {
    for (const ruta of ["/es/empresa", "/es/empresa/ficha", "/es/panel", "/es/admin", "/es/dossier/abc"]) {
      expect(bloqueada(ruta, disallow), ruta).toBe(true);
    }
  });
});
