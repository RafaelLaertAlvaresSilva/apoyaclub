import { describe, expect, it } from "vitest";
import { AREAS_PRIVADAS, areaPrivadaDe } from "@/lib/areas-privadas";
import { RUTA_POR_ROL } from "@/lib/types";

describe("areaPrivadaDe", () => {
  it("protege el panel del club y el de administración", () => {
    expect(areaPrivadaDe("/panel")?.[0]).toBe("club");
    expect(areaPrivadaDe("/panel/tareas")?.[0]).toBe("club");
    expect(areaPrivadaDe("/admin")?.[0]).toBe("admin");
    expect(areaPrivadaDe("/admin/clubes")?.[0]).toBe("admin");
  });

  it("deja pasar todo lo público", () => {
    for (const ruta of [
      "/",
      "/buscar",
      "/club/mi-club",
      "/login",
      "/registro-club",
      "/dossier/abc123",
      "/privacidad",
    ]) {
      expect(areaPrivadaDe(ruta), `${ruta} debería ser pública`).toBeNull();
    }
  });

  it("no confunde una ruta que solo empieza igual", () => {
    // "/paneles-solares" no es el panel del club.
    expect(areaPrivadaDe("/paneles-solares")).toBeNull();
    expect(areaPrivadaDe("/administracion")).toBeNull();
  });

  it("ningún área privada puede ser la raíz", () => {
    // Este es el test que importa. Si alguna vez un prefijo acaba
    // siendo "/", toda la web se vuelve privada: las páginas públicas
    // empiezan a pedir sesión y a un club con sesión abierta se le
    // devuelve a su panel al pulsar el logo. Pasó una vez.
    for (const [rol, prefijo] of AREAS_PRIVADAS) {
      expect(prefijo, `el área de ${rol} no puede ser la raíz`).not.toBe("/");
      expect(prefijo.startsWith("/")).toBe(true);
      expect(prefijo.length).toBeGreaterThan(1);
    }
  });

  it("cada área privada tiene su destino en RUTA_POR_ROL", () => {
    // El middleware manda a RUTA_POR_ROL[rol] a quien entra donde no
    // le toca; si faltara, redirigiría a undefined.
    for (const [rol] of AREAS_PRIVADAS) {
      expect(RUTA_POR_ROL[rol]).toBeTruthy();
    }
  });
});
