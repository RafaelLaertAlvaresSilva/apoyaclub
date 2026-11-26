import { describe, expect, it } from "vitest";
import { debeSerPermanente } from "@/lib/redireccion-permanente";

describe("redirección permanente de las direcciones sin idioma", () => {
  it("es permanente cuando una dirección sin idioma va al español", () => {
    expect(debeSerPermanente("/buscar", "https://apoyaclub.com/es/buscar", "GET")).toBe(true);
    expect(debeSerPermanente("/", "https://apoyaclub.com/es", "GET")).toBe(true);
    expect(debeSerPermanente("/", "/es?a=IGADS2", "HEAD")).toBe(true);
  });

  it("sigue siendo temporal si el visitante va a otro idioma", () => {
    expect(debeSerPermanente("/buscar", "https://apoyaclub.com/pt/buscar", "GET")).toBe(false);
    expect(debeSerPermanente("/", "https://apoyaclub.com/en", "GET")).toBe(false);
    expect(debeSerPermanente("/", "https://apoyaclub.com/br", "GET")).toBe(false);
  });

  it("no toca las direcciones que ya llevan idioma ni los envíos de formularios", () => {
    expect(debeSerPermanente("/es/", "https://apoyaclub.com/es", "GET")).toBe(false);
    expect(debeSerPermanente("/pt/buscar", "https://apoyaclub.com/es/buscar", "GET")).toBe(false);
    expect(debeSerPermanente("/buscar", "https://apoyaclub.com/es/buscar", "POST")).toBe(false);
  });

  it("no confunde un destino que solo empieza por 'es'", () => {
    expect(debeSerPermanente("/x", "https://apoyaclub.com/estadio", "GET")).toBe(false);
  });

  it("sin destino no hay nada que cambiar", () => {
    expect(debeSerPermanente("/buscar", null, "GET")).toBe(false);
  });
});
