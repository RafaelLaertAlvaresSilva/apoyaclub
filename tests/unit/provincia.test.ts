import { describe, expect, it } from "vitest";
import { normalizarProvincia } from "@/lib/provincia";

describe("normalizarProvincia", () => {
  it("arregla lo escrito todo en mayúsculas o todo en minúsculas", () => {
    expect(normalizarProvincia("ALICANTE")).toBe("Alicante");
    expect(normalizarProvincia("  alicante ")).toBe("Alicante");
    expect(normalizarProvincia("santa cruz de tenerife")).toBe("Santa Cruz de Tenerife");
    expect(normalizarProvincia("LAS PALMAS")).toBe("Las Palmas");
  });

  it("respeta lo que alguien escribió a su manera", () => {
    expect(normalizarProvincia("A Coruña")).toBe("A Coruña");
    expect(normalizarProvincia("Illes Balears")).toBe("Illes Balears");
  });

  it("deja en vacío lo que no dice nada", () => {
    expect(normalizarProvincia("   ")).toBeNull();
    expect(normalizarProvincia(null)).toBeNull();
  });
});
