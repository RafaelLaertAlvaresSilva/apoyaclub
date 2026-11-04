import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

/**
 * La vista previa (`/vista-previa`): el club ve su ficha y sus
 * oportunidades aunque no se vean en público (modo de pruebas, oculta,
 * reservadas o cerradas). Lo importante es que solo vea la SUYA.
 */
const APP = join(process.cwd(), "src", "app", "[locale]");
const leer = (...partes: string[]) => readFileSync(join(APP, ...partes), "utf8");

const DATOS = leer("vista-previa", "datos.ts");
const CARGA = leer("club", "[slug]", "data.ts");
const TARJETA = leer("panel", "oportunidades", "components", "TarjetaOportunidad.tsx");

describe("vista previa del club", () => {
  it("el club sale de la sesión, no de la dirección", () => {
    expect(DATOS).toContain("obtenerClubVistaPrevia(user.id)");
    expect(DATOS).not.toMatch(/params|searchParams/);
  });

  it("solo para cuentas de club; si no, al acceso", () => {
    expect(DATOS).toMatch(/role[^\n]*!== "club"/);
    expect(DATOS).toContain('href: "/login"');
  });

  it("quita el teléfono y el nombre de contacto si el club no dio permiso, como la vista pública", () => {
    expect(CARGA).toMatch(/contact_public_consent\s*\?\s*fila\s*:\s*\{ \.\.\.fila, contact_name: null, contact_phone: null \}/);
  });

  it("la ficha pública sigue enseñando solo las oportunidades disponibles", () => {
    expect(CARGA).toContain("obtenerClubPublico");
    expect(CARGA).toMatch(/completarClub\(supabase, filaClub, \{ soloDisponibles: true \}\)/);
    expect(leer("club", "[slug]", "components", "FichaDelClub.tsx")).toContain('una.status === "available"');
  });

  it("no cuenta la visita del propio club", () => {
    expect(leer("club", "[slug]", "components", "FichaDelClub.tsx")).toContain(
      "{!vistaPrevia && <RegistrarVisita",
    );
  });

  it("no la indexa Google", () => {
    for (const ruta of [
      ["vista-previa", "page.tsx"],
      ["vista-previa", "oportunidad", "[id]", "page.tsx"],
      ["vista-previa", "oportunidades", "page.tsx"],
      ["vista-previa", "necesidades", "page.tsx"],
    ]) {
      expect(leer(...ruta)).toContain("index: false");
    }
  });
});

describe("el botón Visualizar del panel", () => {
  it("abre la página pública solo si se ve en público y está disponible; si no, la vista previa", () => {
    expect(TARJETA).toMatch(/fichaPublica && oportunidad\.status === "available"/);
    expect(TARJETA).toContain("`/vista-previa/oportunidad/${oportunidad.id}`");
  });
});
