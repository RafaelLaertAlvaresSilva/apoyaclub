import { describe, expect, it } from "vitest";
import { convieneEscribirle, diasSinEntrar, siguientePaso, type AvanceClub } from "@/lib/avance-club";

const base: AvanceClub = {
  correoConfirmado: true,
  ficha: 80,
  oportunidades: 3,
  generadas: 2,
  dossier: true,
  enlaceDossier: false,
  ultimoAcceso: "2026-11-01T10:00:00Z",
};
const hoy = new Date("2026-11-06T10:00:00Z");

describe("avance del club", () => {
  it("el siguiente paso es el primero que falta, en orden", () => {
    expect(siguientePaso({ ...base, correoConfirmado: false, oportunidades: 0 })).toBe("correo");
    expect(siguientePaso({ ...base, ficha: 59 })).toBe("ficha");
    expect(siguientePaso({ ...base, oportunidades: 0 })).toBe("oportunidades");
    expect(siguientePaso({ ...base, dossier: false })).toBe("dossier");
    expect(siguientePaso(base)).toBeNull();
  });

  it("días sin entrar", () => {
    expect(diasSinEntrar(null, hoy)).toBeNull();
    expect(diasSinEntrar("2026-11-01T10:00:00Z", hoy)).toBe(5);
  });

  it("conviene escribirle si le falta algo y lleva una semana sin entrar o nunca entró", () => {
    expect(convieneEscribirle({ ...base, oportunidades: 0 }, hoy)).toBe(false);
    expect(convieneEscribirle({ ...base, oportunidades: 0, ultimoAcceso: "2026-10-20T10:00:00Z" }, hoy)).toBe(true);
    expect(convieneEscribirle({ ...base, correoConfirmado: false, ultimoAcceso: null }, hoy)).toBe(true);
    expect(convieneEscribirle({ ...base, ultimoAcceso: null }, hoy)).toBe(false);
  });
});
