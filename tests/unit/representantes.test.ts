import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { accesoAdminDe, puedeGestionarPais } from "@/lib/acceso-admin";
import { comisionPorMes, ivaIncluido, parteDelCobro, type Cobro } from "@/lib/comisiones";
import { areaPrivadaDe } from "@/lib/areas-privadas";
import { paisDeLaCuenta, paisDelIdioma } from "@/lib/paises";
import { RUTA_POR_ROL } from "@/lib/types";

const cobro = (fecha: string, cobradoCentimos: number, stripeCentimos: number): Cobro => ({
  id: `ch_${fecha}`,
  clubId: "club",
  clubNombre: "Clube Teste",
  fecha,
  cobradoCentimos,
  stripeCentimos,
});

describe("país del club", () => {
  it("las cuentas antiguas, sin país, son de España", () => {
    expect(paisDeLaCuenta({ role: "club" })).toBe("ES");
    expect(paisDeLaCuenta({ role: "club", pais: "XX" })).toBe("ES");
    expect(paisDeLaCuenta({ role: "club", pais: "BR" })).toBe("BR");
  });

  it("el registro marca de antemano el país del idioma", () => {
    expect(paisDelIdioma("br")).toBe("BR");
    expect(paisDelIdioma("pt")).toBe("PT");
    expect(paisDelIdioma("es")).toBe("ES");
    expect(paisDelIdioma("en")).toBe("ES");
  });
});

describe("acceso al admin", () => {
  it("el administrador lo gestiona todo", () => {
    const acceso = accesoAdminDe({ app_metadata: { role: "admin" } })!;
    expect(puedeGestionarPais(acceso, "BR")).toBe(true);
    expect(puedeGestionarPais(acceso, "ES")).toBe(true);
  });

  it("un representante solo gestiona su país", () => {
    const acceso = accesoAdminDe({ app_metadata: { role: "representante", pais: "BR", porcentaje: 30 } })!;
    expect(acceso.tipo).toBe("representante");
    expect(puedeGestionarPais(acceso, "BR")).toBe(true);
    expect(puedeGestionarPais(acceso, "ES")).toBe(false);
    expect(puedeGestionarPais(acceso, "PT")).toBe(false);
  });

  it("sin acceso: un club, una empresa, un representante desactivado o sin país", () => {
    expect(accesoAdminDe({ app_metadata: { role: "club" } })).toBeNull();
    expect(accesoAdminDe({ app_metadata: { role: "empresa" } })).toBeNull();
    expect(accesoAdminDe({ app_metadata: { role: "representante", pais: "BR", activo: false } })).toBeNull();
    expect(accesoAdminDe({ app_metadata: { role: "representante" } })).toBeNull();
    expect(accesoAdminDe(null)).toBeNull();
  });

  it("un porcentaje raro vuelve al 30 %", () => {
    const acceso = accesoAdminDe({ app_metadata: { role: "representante", pais: "BR", porcentaje: 500 } });
    expect(acceso?.tipo === "representante" && acceso.porcentaje).toBe(30);
  });

  it("el representante entra en el admin y empieza por sus clubes", () => {
    expect(areaPrivadaDe("/admin/clubes")?.[0]).toBe("admin");
    expect(RUTA_POR_ROL.representante).toBe("/admin/clubes");
  });
});

describe("comisión", () => {
  it("IVA incluido al 21 %", () => {
    expect(ivaIncluido(19900)).toBe(3454);
  });

  it("cobro menos IVA menos Stripe, y de lo que queda el 30 %", () => {
    // 199 € al año: IVA 34,54 €, Stripe 3,24 € → quedan 161,22 € → 48,37 €
    const parte = parteDelCobro(cobro("2026-11-03T10:00:00Z", 19900, 324), 30);
    expect(parte.ivaCentimos).toBe(3454);
    expect(parte.netoCentimos).toBe(16122);
    expect(parte.parteCentimos).toBe(4837);
  });

  it("un cobro devuelto entero no genera parte ni resta", () => {
    expect(parteDelCobro(cobro("2026-11-03T10:00:00Z", 0, 324), 30).parteCentimos).toBe(0);
  });

  it("agrupa por mes en hora de España y solo cuenta desde que empezó", () => {
    const meses = comisionPorMes(
      [
        cobro("2026-09-15T10:00:00Z", 2990, 70), // antes de empezar
        cobro("2026-10-31T23:30:00Z", 2990, 70), // ya es 1 de noviembre en España
        cobro("2026-11-10T10:00:00Z", 2990, 70),
        cobro("2026-10-20T10:00:00Z", 2990, 70),
      ],
      30,
      "2026-10-01T00:00:00Z",
    );
    expect(meses.map((mes) => [mes.mes, mes.cobros.length])).toEqual([
      ["2026-11", 2],
      ["2026-10", 1],
    ]);
    expect(meses[0].parteCentimos).toBe(meses[0].cobros.reduce((suma, c) => suma + c.parteCentimos, 0));
  });
});

describe("el admin del representante, en su idioma", () => {
  // Lo que ve un representante (sus clubes y su comisión) tiene que
  // estar entero en portugués: lo demás del admin sigue en español.
  const leer = (idioma: string) =>
    JSON.parse(readFileSync(join(process.cwd(), "messages", idioma, "admin.json"), "utf8")) as Record<string, unknown>;
  const hojas = (arbol: unknown, ruta = ""): string[] =>
    typeof arbol === "object" && arbol !== null
      ? Object.entries(arbol).flatMap(([clave, valor]) => hojas(valor, ruta ? `${ruta}.${clave}` : clave))
      : [ruta];
  const espanol = leer("es");

  for (const idioma of ["pt", "br"]) {
    it(`${idioma}: están todas las claves de clubes, comisión, menú y países`, () => {
      const traducido = leer(idioma);
      for (const seccion of ["nav", "paises", "clubes", "comisiones"]) {
        const faltan = hojas(espanol[seccion], seccion).filter(
          (ruta) => !hojas(traducido[seccion], seccion).includes(ruta),
        );
        expect(faltan).toEqual([]);
      }
    });
  }
});
