import { describe, expect, it } from "vitest";
import { pasoQueToca } from "@/lib/emails-ciclo";

const nada = new Set<"oportunidades" | "dossier" | "queFalta">();

describe("correos que guían al club nuevo", () => {
  it("a los 2 días sin oportunidades: que las genere", () => {
    expect(pasoQueToca({ dias: 1, oportunidades: 0, dossier: false, yaMandados: nada })).toBeNull();
    expect(pasoQueToca({ dias: 2, oportunidades: 0, dossier: false, yaMandados: nada })).toBe("oportunidades");
  });

  it("a los 5 días con oportunidades y sin dossier: que lo mande a cinco conocidos", () => {
    expect(pasoQueToca({ dias: 5, oportunidades: 3, dossier: false, yaMandados: nada })).toBe("dossier");
    expect(pasoQueToca({ dias: 5, oportunidades: 3, dossier: true, yaMandados: nada })).toBeNull();
  });

  it("a los 12 días, la pregunta de Rafael, una sola vez", () => {
    expect(pasoQueToca({ dias: 12, oportunidades: 3, dossier: true, yaMandados: nada })).toBe("queFalta");
    expect(pasoQueToca({ dias: 20, oportunidades: 3, dossier: true, yaMandados: new Set(["queFalta"]) })).toBeNull();
  });

  it("cada correo una sola vez, y nada a clubes de hace meses", () => {
    expect(
      pasoQueToca({ dias: 6, oportunidades: 0, dossier: false, yaMandados: new Set(["oportunidades"]) }),
    ).toBeNull();
    expect(pasoQueToca({ dias: 90, oportunidades: 0, dossier: false, yaMandados: nada })).toBeNull();
  });
});

describe("avisos a empresas, por país", () => {
  it("una empresa de /br solo recibe clubes de Brasil; en inglés, de todos", async () => {
    const { mismoPais, paisDeEmpresa } = await import("@/lib/avisos-empresa");
    expect(paisDeEmpresa("br")).toBe("BR");
    expect(paisDeEmpresa("en")).toBeNull();
    expect(mismoPais("ES", "BR")).toBe(false);
    expect(mismoPais("BR", "BR")).toBe(true);
    expect(mismoPais(null, "ES")).toBe(true);
    expect(mismoPais("PT", null)).toBe(true);
  });
});
