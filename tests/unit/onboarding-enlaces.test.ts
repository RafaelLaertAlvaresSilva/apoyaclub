import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { SECCIONES_DOSSIER } from "@/lib/dossier";
import { primerosPasos } from "@/lib/onboarding";
import { huecosDelPerfil } from "@/lib/profile-completion";
import { perfilDePrueba } from "../fixtures/club";

/**
 * Los botones de "Empieza aquí" y la lista de "te falta por rellenar"
 * llevan a una pestaña del propio panel. Si el destino no lleva ancla,
 * el enlace apunta a la página en la que ya estás y al pulsarlo no pasa
 * nada — que es exactamente el fallo que estas pruebas evitan que vuelva.
 */
/**
 * Las pestañas de `PanelTabs`, tal cual. Faltaba "instalaciones", y un
 * enlace a una pestaña que esta lista no conociera pasaba la prueba
 * igual: la comprobación de abajo se encarga de que no vuelva a pasar.
 *
 * "patrocinadores" no es una pestaña sino una página aparte, pero
 * `huecosDelPerfil` lo usa como nombre de destino, así que entra aquí.
 */
const PESTANAS_DEL_PANEL = new Set([
  "identidad",
  "nivel",
  "equipos",
  "instalaciones",
  "cantera",
  "historia",
  "audiencia",
  "comunidad",
  "patrocinadores",
]);

/** Rutas del panel que no son pestañas, sino páginas aparte. */
const PAGINAS_DEL_PANEL = new Set(["/panel/patrocinadores", "/panel/oportunidades"]);

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

/**
 * En el dossier, una sección sin datos se pulsa y lleva al sitio donde
 * se rellena. Si el destino no existe o no lleva ancla, el club acaba
 * en el panel mirando la pestaña equivocada — que es justo lo que había
 * antes, cuando la sección vacía no llevaba a ningún sitio.
 */
describe("dónde se rellena cada sección del dossier", () => {
  it("cada sección apunta a una pestaña o a una página que existen", () => {
    for (const seccion of SECCIONES_DOSSIER) {
      if (seccion.donde.includes("#")) {
        const [ruta, ancla] = seccion.donde.split("#");
        expect(ruta).toBe("/panel");
        expect(PESTANAS_DEL_PANEL.has(ancla)).toBe(true);
      } else {
        expect(PAGINAS_DEL_PANEL.has(seccion.donde)).toBe(true);
      }
    }
  });

  it("ninguna lleva al panel pelado, que abriría la pestaña de siempre", () => {
    expect(SECCIONES_DOSSIER.map((seccion) => seccion.donde)).not.toContain("/panel");
  });
});

/**
 * La lista de arriba se escribe a mano, así que puede quedarse corta
 * —ya pasó con "instalaciones"— y entonces deja de comprobar nada. Aquí
 * se contrasta con las pestañas que el panel monta de verdad.
 */
describe("la lista de pestañas de estas pruebas", () => {
  it("son las mismas que monta el panel", () => {
    const fuente = readFileSync(
      join(__dirname, "..", "..", "src/app/[locale]/panel/components/PanelTabs.tsx"),
      "utf8",
    );
    const bloque = fuente.slice(fuente.indexOf("const IDS_PESTANA"), fuente.indexOf("const PESTANAS"));
    const delPanel = [...bloque.matchAll(/"([a-z]+)"/g)].map((encontrado) => encontrado[1]);

    expect(delPanel.length).toBeGreaterThan(0);
    for (const pestana of delPanel) expect(PESTANAS_DEL_PANEL.has(pestana)).toBe(true);
  });
});
