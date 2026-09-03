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
    for (const paso of pasos.filter((candidato) => candidato.anclaDelPanel !== null)) {
      expect(PESTANAS_DEL_PANEL.has(paso.anclaDelPanel!)).toBe(true);
      // El href tiene que ir de la mano del ancla: si se separan, el
      // botón lleva a un sitio y abre otro.
      expect(paso.href).toBe(`/panel#${paso.anclaDelPanel}`);
    }
  });

  it("ningún paso apunta al panel pelado, que no haría nada", () => {
    expect(pasos.map((paso) => paso.href)).not.toContain("/panel");
  });

  it("el paso que sale del panel no lleva ancla", () => {
    const oportunidad = pasos.find((paso) => paso.id === "oportunidad");
    expect(oportunidad?.anclaDelPanel).toBeNull();
    expect(oportunidad?.href).toBe("/panel/oportunidades");
  });
});

describe("enlaces de los huecos del perfil", () => {
  it("cada hueco apunta a una pestaña que existe", () => {
    for (const hueco of huecosDelPerfil(perfilDePrueba(), [], [])) {
      expect(PESTANAS_DEL_PANEL.has(hueco.pestana)).toBe(true);
    }
  });
});
