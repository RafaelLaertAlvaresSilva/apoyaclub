import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

/**
 * "Pasar a 6 meses gratis" del admin: un club que se registró por la
 * página normal (1 mes) pasa a la promoción como si hubiera entrado por
 * apoyaclub.com/6mesesgratis.
 */
const ACCIONES = readFileSync("src/app/[locale]/admin/clubes/actions.ts", "utf8");
const ACCION = ACCIONES.slice(ACCIONES.indexOf("export async function pasarASeisMesesGratis"));

describe("pasar un club a 6 meses gratis", () => {
  it("lo comprueba como cualquier acción del admin (y un representante, solo en su país)", () => {
    expect(ACCION).toContain("await obtenerAdminActual(id)");
  });

  it("ocupa una plaza de su país, y no si ya no quedan", () => {
    expect(ACCION).toContain("plazasPilotoLibres(admin, paisDeLaCuenta(usuario.app_metadata))");
    expect(ACCION).toContain('volverConAviso("sin-plazas-piloto")');
    expect(ACCION).toContain("piloto: true");
    // Sin perder el resto de su cuenta (rol, país…).
    expect(ACCION).toContain("...usuario.app_metadata");
  });

  it("cuenta los 6 meses desde el registro y nunca le quita tiempo", () => {
    expect(ACCION).toContain("new Date(usuario.created_at)");
    expect(ACCION).toContain("MESES_PILOTO");
    expect(ACCION).toContain("yaTenia > desdeElRegistro ? yaTenia : desdeElRegistro");
  });

  it("no toca a un club que ya paga por Stripe", () => {
    expect(ACCION).toContain('volverConAviso("paga-stripe")');
  });

  it("tiene sus avisos en los tres idiomas del admin", () => {
    for (const idioma of ["es", "pt", "br"]) {
      const admin = JSON.parse(readFileSync(`messages/${idioma}/admin.json`, "utf8"));
      expect(admin.clubes.avisos["pasado-a-seis-meses"]).toBeTruthy();
      expect(admin.clubes.avisos["sin-plazas-piloto"]).toBeTruthy();
      expect(admin.clubes.fila.pasarASeisMesesGratis).toBeTruthy();
    }
  });
});
