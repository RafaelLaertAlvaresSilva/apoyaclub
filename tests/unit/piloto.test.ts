import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { PLAZAS_PILOTO, esDelPiloto, origenDeCampana, plazasPilotoLibres } from "@/lib/piloto";

/** Un cliente de Supabase de mentira que solo sabe contestar a `rpc`. */
function cliente(respuesta: { data: unknown; error: unknown } | Error) {
  return {
    rpc: async () => {
      if (respuesta instanceof Error) throw respuesta;
      return respuesta;
    },
  } as never;
}

describe("programa piloto (migración 0057)", () => {
  it("cuenta las plazas que quedan y nunca baja de cero", async () => {
    expect(await plazasPilotoLibres(cliente({ data: 3, error: null }))).toBe(PLAZAS_PILOTO - 3);
    expect(await plazasPilotoLibres(cliente({ data: PLAZAS_PILOTO + 5, error: null }))).toBe(0);
  });

  it("si no se puede contar (migración sin ejecutar), no lo sabe: null", async () => {
    expect(await plazasPilotoLibres(cliente({ data: null, error: { message: "no existe" } }))).toBeNull();
    expect(await plazasPilotoLibres(cliente(new Error("sin red")))).toBeNull();
  });

  it("solo es del piloto si lo dice app_metadata con un true de verdad", () => {
    expect(esDelPiloto({ role: "club", piloto: true })).toBe(true);
    expect(esDelPiloto({ role: "club", piloto: "true" })).toBe(false);
    expect(esDelPiloto({ role: "club" })).toBe(false);
    expect(esDelPiloto(undefined)).toBe(false);
  });

  it("el registro marca el piloto en app_metadata, que el usuario no puede tocar", () => {
    const accion = readFileSync(
      join(process.cwd(), "src", "app", "[locale]", "(auth)", "registro-club", "actions.ts"),
      "utf8",
    );
    expect(accion).toMatch(/app_metadata:\s*\{\s*role:\s*"club",\s*\.\.\.\(piloto\s*\?\s*\{\s*piloto:\s*true\s*\}\s*:\s*\{\}\)/);
    // El anuncio de origen también va en app_metadata, nunca en user_metadata.
    expect(accion).toMatch(/\.\.\.\(origen\s*\?\s*\{\s*origen_campana:\s*origen\s*\}\s*:\s*\{\}\)/);
    // Y solo si quedan plazas.
    expect(accion).toContain("plazasPilotoLibres(admin)");
    // Ni el piloto ni el anuncio en los datos que manda el registro
    // (`data` de signUp = user_metadata, que el usuario sí puede cambiar).
    expect(accion).not.toMatch(/(?<!app_meta)data:\s*\{[^}]*(piloto|origen)/);
  });

  it("la migración da 6 meses al piloto y 30 días al resto", () => {
    const sql = readFileSync(join(process.cwd(), "supabase", "migrations", "0057_programa_piloto.sql"), "utf8");
    expect(sql).toMatch(/raw_app_meta_data\s*->>\s*'piloto'/);
    expect(sql).toContain("interval '6 months'");
    expect(sql).toContain("interval '30 days'");
    expect(sql).toMatch(/revoke all on function public\.plazas_piloto_ocupadas\(\) from public, anon, authenticated/);
  });

  it("la página está en /6mesesgratis y la dirección vieja /piloto lleva a ella", () => {
    const config = readFileSync(join(process.cwd(), "next.config.ts"), "utf8");
    expect(config).toContain('{ source: "/piloto", destination: "/6mesesgratis", permanent: true }');
    expect(() =>
      readFileSync(join(process.cwd(), "src", "app", "[locale]", "6mesesgratis", "page.tsx"), "utf8"),
    ).not.toThrow();
  });
});

describe("origenDeCampana", () => {
  it("acepta la letra del anuncio y la pasa a mayúsculas", () => {
    expect(origenDeCampana("A")).toBe("A");
    expect(origenDeCampana(" b ")).toBe("B");
    expect(origenDeCampana("reel2")).toBe("REEL2");
  });

  it("descarta lo que no es un código corto de letras y números", () => {
    expect(origenDeCampana(undefined)).toBeNull();
    expect(origenDeCampana(null)).toBeNull();
    expect(origenDeCampana("")).toBeNull();
    expect(origenDeCampana("A&piloto=1")).toBeNull();
    expect(origenDeCampana("<script>")).toBeNull();
    expect(origenDeCampana("ABCDEFGHI")).toBeNull();
    expect(origenDeCampana(["A"])).toBeNull();
  });
});
