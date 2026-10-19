import { describe, expect, it } from "vitest";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { esVisiblePublicamente } from "@/lib/subscription-mappers";

/**
 * Modo de pruebas (migración 0053): el club conserva su panel, pero no
 * se ve en ningún sitio público.
 *
 * Lo que de verdad lo esconde son las vistas públicas de la base de
 * datos, y esas se reescriben enteras cada vez que se les añade una
 * columna (ya ha pasado diez veces con `club_public_profiles`). Una
 * migración futura que copie una versión vieja de la vista se dejaría
 * el filtro por el camino sin que nada fallase: el club de pruebas
 * volvería a salir en el buscador. Esta prueba es la que avisa.
 */
const CARPETA = join(process.cwd(), "supabase", "migrations");

/** La última definición de cada vista, leyendo las migraciones en orden. */
function ultimaDefinicionDeCadaVista(): Map<string, { archivo: string; cuerpo: string }> {
  const vistas = new Map<string, { archivo: string; cuerpo: string }>();
  const archivos = readdirSync(CARPETA)
    .filter((nombre) => nombre.endsWith(".sql"))
    .sort();

  for (const archivo of archivos) {
    const sql = readFileSync(join(CARPETA, archivo), "utf8");
    const patron = /create\s+(?:or\s+replace\s+)?view\s+public\.([a-z_0-9]+)([\s\S]*?);/gi;
    for (const encontrado of sql.matchAll(patron)) {
      vistas.set(encontrado[1], { archivo, cuerpo: encontrado[2] });
    }
  }
  return vistas;
}

describe("modo de pruebas", () => {
  const vistas = ultimaDefinicionDeCadaVista();

  // Las vistas que deciden qué club se ve: son las que filtran por el
  // estado de la suscripción.
  const vistasDeClubes = [...vistas.entries()].filter(([, { cuerpo }]) =>
    /subscription_status\s+in\s*\(/i.test(cuerpo),
  );

  it("encuentra las tres vistas públicas de clubes", () => {
    const nombres = vistasDeClubes.map(([nombre]) => nombre).sort();
    expect(nombres).toEqual(["club_public_profiles", "club_service_needs_public", "opportunity_search_view"]);
  });

  it.each(vistasDeClubes.map(([nombre, datos]) => [nombre, datos.archivo, datos.cuerpo]))(
    "la última versión de %s (%s) esconde los clubes en pruebas y los suspendidos",
    (_nombre, _archivo, cuerpo) => {
      expect(cuerpo).toMatch(/not\s+(?:c\.)?admin_test_mode/i);
      expect(cuerpo).toMatch(/not\s+(?:c\.)?admin_suspended/i);
    },
  );

  it("el panel no dice 'visible' de un club en pruebas, aunque esté en prueba o pagando", () => {
    expect(esVisiblePublicamente("trialing", true)).toBe(false);
    expect(esVisiblePublicamente("active", true)).toBe(false);
    expect(esVisiblePublicamente("active", false)).toBe(true);
  });
});
