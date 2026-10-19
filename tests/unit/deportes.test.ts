import { describe, expect, it } from "vitest";
import {
  DEPORTES,
  deporteDeLaLista,
  nombreDelDeporte,
  normalizarDeporte,
  variantesDelDeporte,
} from "@/lib/deportes";
import { traductorDePrueba } from "./traductor-de-prueba";

describe("la lista de deportes", () => {
  it("reconoce lo que los clubes escribían a mano", () => {
    // El fallo que arregla: tres formas de escribir lo mismo salían en
    // el buscador como tres deportes distintos.
    expect(normalizarDeporte("voley")).toBe("Voleibol");
    expect(normalizarDeporte("Vóley")).toBe("Voleibol");
    expect(normalizarDeporte("VOLEIBOL ")).toBe("Voleibol");
    expect(normalizarDeporte("handball")).toBe("Balonmano");
    expect(normalizarDeporte("futbol sala")).toBe("Fútbol sala");
    expect(normalizarDeporte("Fútbol-Sala")).toBe("Fútbol sala");
    expect(normalizarDeporte("rugby")).toBe("Rugby");
  });

  it("lo que no está en la lista se queda como lo escribió, con mayúscula", () => {
    expect(normalizarDeporte("  petanca  ")).toBe("Petanca");
    expect(deporteDeLaLista("petanca")).toBeNull();
  });

  it("no confunde fútbol con fútbol sala", () => {
    expect(normalizarDeporte("fútbol")).toBe("Fútbol");
    expect(normalizarDeporte("futsal")).toBe("Fútbol sala");
  });

  it("el filtro del buscador encuentra también lo escrito antes de la lista", () => {
    const variantes = variantesDelDeporte("Voleibol");
    for (const forma of ["Voleibol", "voleibol", "voley", "Vóley", "VOLEY"]) {
      expect(variantes, forma).toContain(forma);
    }
  });

  it("ningún sinónimo apunta a dos deportes", () => {
    const vistos = new Map<string, string>();
    for (const deporte of DEPORTES) {
      for (const texto of [deporte.nombre, ...deporte.sinonimos]) {
        const llave = texto.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]/g, "");
        expect(vistos.get(llave) ?? deporte.clave, texto).toBe(deporte.clave);
        vistos.set(llave, deporte.clave);
      }
    }
  });

  it("cada deporte tiene su nombre en los tres idiomas", () => {
    for (const idioma of ["es", "pt", "en"]) {
      const t = traductorDePrueba(idioma, "common", "etiquetas");
      for (const deporte of DEPORTES) {
        expect(() => t(`deporte.${deporte.clave}`), `${idioma} ${deporte.clave}`).not.toThrow();
      }
    }
    const tIngles = traductorDePrueba("en", "common", "etiquetas");
    expect(nombreDelDeporte("Balonmano", tIngles)).toBe("Handball");
    expect(nombreDelDeporte("voley", tIngles)).toBe("Volleyball");
    expect(nombreDelDeporte("Petanca", tIngles)).toBe("Petanca");
  });
});
