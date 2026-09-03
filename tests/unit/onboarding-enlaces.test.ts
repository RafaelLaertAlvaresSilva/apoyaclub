import { describe, expect, it } from "vitest";
import { primerosPasos } from "@/lib/onboarding";
import { huecosDelPerfil } from "@/lib/profile-completion";
import { perfilDePrueba } from "../fixtures/club";

/**
 * Los botones de "Empieza aquí" y la lista de "te falta por rellenar"
 * llevan a una pestaña del propio panel. Si el destino no lleva ancla,
 * el enlace apunta a la página en la que ya estás y al pulsarlo no pasa
 * nada — que es exactamente el fallo que estas pruebas evitan que vuelva.
 */
const PESTANAS_DEL_PANEL = new Set([
  "identidad",
  "nivel",
  "equipos",
  "cantera",
  "historia",
  "audiencia",
  "comunidad",
  "patrocinadores",
  "servicios",
]);

describe("enlaces de los primeros pasos", () => {
  const pasos = primerosPasos(perfilDePrueba(), [], 0);

  it("los pasos que se quedan en el panel llevan ancla de pestaña", () => {
    for (const paso of pasos.filter((candidato) => candidato.href.startsWith("/panel#"))) {
      const ancla = paso.href.split("#")[1];
      expect(PESTANAS_DEL_PANEL.has(ancla)).toBe(true);
    }
  });

  it("ningún paso apunta al panel pelado, que no haría nada", () => {
    expect(pasos.map((paso) => paso.href)).not.toContain("/panel");
  });
});

describe("enlaces de los huecos del perfil", () => {
  it("cada hueco apunta a una pestaña que existe", () => {
    for (const hueco of huecosDelPerfil(perfilDePrueba(), [], [])) {
      expect(PESTANAS_DEL_PANEL.has(hueco.pestana)).toBe(true);
    }
  });
});
