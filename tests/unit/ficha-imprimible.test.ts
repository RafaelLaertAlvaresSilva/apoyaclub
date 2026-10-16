import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import QRCode from "qrcode";

const RAIZ = join(process.cwd(), "src");
const leer = (...partes: string[]) => readFileSync(join(RAIZ, ...partes), "utf8");

const PAGINA = leer("app", "[locale]", "club", "[slug]", "oportunidad", "[id]", "page.tsx");
const PIE = leer("app", "[locale]", "club", "[slug]", "components", "PieDeLaFichaImpresa.tsx");
const CABECERA = leer("components", "Header.tsx");
const PIE_WEB = leer("components", "Footer.tsx");
const COOKIES = leer("components", "CookieBanner.tsx");

/**
 * La ficha imprimible de una oportunidad.
 *
 * Es la misma página, impresa: lo que cambia en papel lo deciden las
 * clases `print:`. Lo que se comprueba aquí es lo que, si se rompe, no
 * avisa en ninguna otra prueba: la hoja saldría con el menú, el aviso
 * de cookies o los botones encima, o sin la forma de volver a la web.
 */
describe("la ficha imprimible de una oportunidad", () => {
  it("tiene el botón de imprimir junto a los de contactar y compartir", () => {
    expect(PAGINA).toContain("<ImprimirBoton />");
  });

  it("en papel no salen la cabecera, el pie, el aviso de cookies ni los botones", () => {
    expect(CABECERA).toMatch(/<header className="[^"]*print:hidden/);
    expect(PIE_WEB).toMatch(/<footer className="[^"]*print:hidden/);
    expect(COOKIES).toContain("print:hidden");
    // La fila de botones y la miga de pan de arriba.
    expect(PAGINA).toMatch(/border-t border-zinc-100 pt-6 print:hidden/);
    expect(PAGINA).toMatch(/<nav className="[^"]*print:hidden/);
  });

  it("el pie con el QR solo sale al imprimir y apunta a esta oportunidad", () => {
    expect(PIE).toContain("hidden");
    expect(PIE).toContain("print:flex");
    expect(PAGINA).toContain("<PieDeLaFichaImpresa url={urlPublica}");
  });

  it("no pone en el papel el teléfono ni el correo del club", () => {
    expect(PIE).not.toMatch(/contactPhone|contactEmail/);
  });

  it("el QR que se genera es un SVG con la dirección dentro", async () => {
    const url = "https://www.apoyaclub.com/es/club/mi-club/oportunidad/123";
    const svg = await QRCode.toString(url, { type: "svg", margin: 0 });
    expect(svg.startsWith("<svg")).toBe(true);
    // Lo que llega a `dangerouslySetInnerHTML` no lleva scripts.
    expect(svg).not.toMatch(/<script/i);
  });
});
