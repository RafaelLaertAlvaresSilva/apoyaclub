import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const leer = (...partes: string[]) => readFileSync(join(process.cwd(), ...partes), "utf8");

/**
 * La portada de "Para clubes" dice que, al cerrar un acuerdo, lo
 * prometido pasa a Tareas. Esto comprueba que es verdad.
 */
describe("de solicitud cerrada a Tareas", () => {
  it("la solicitud cerrada lleva a Tareas con su empresa", () => {
    const tarjeta = leer("src", "app", "[locale]", "panel", "solicitudes", "components", "SolicitudCard.tsx");
    expect(tarjeta).toContain('solicitud.status === "closed"');
    expect(tarjeta).toContain("/panel/tareas?empresa=");
    expect(tarjeta).toContain('t("cerradaApuntar")');
  });

  it("Tareas abre el formulario con esa empresa ya elegida", () => {
    const pagina = leer("src", "app", "[locale]", "panel", "tareas", "page.tsx");
    expect(pagina).toContain("empresaInicial={empresaInicial}");
    const gestor = leer("src", "app", "[locale]", "panel", "tareas", "components", "TareasManager.tsx");
    expect(gestor).toContain('id="apuntar"');
    expect(gestor).toContain("defaultValue={conocidaInicial ? undefined : (empresaInicial ?? undefined)}");
  });

  it("la portada no promete un chat ni que las tareas se crean solas", () => {
    const textos = JSON.parse(leer("messages", "es", "home.json"));
    // La conversación sigue fuera de ApoyaClub.
    expect(textos.embudo.estados[2].texto).toMatch(/teléfono|correo/);
    // Las tareas las apunta el club, con un botón; no aparecen solas.
    expect(textos.embudo.estados[3].texto).toContain("botón");
    expect(textos.embudo.estados[3].texto).not.toContain("pasa solo");
  });
});
