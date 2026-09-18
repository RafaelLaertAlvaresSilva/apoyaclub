import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  ETIQUETA_TIPO_OFERTA,
  TIPOS_DE_OFERTA,
  filaAOferta,
  filaAOfertaPublica,
  leerEstadoOferta,
  leerTipoDeOferta,
  resumenDeOferta,
} from "@/lib/empresas";
import { CATEGORIAS_NECESIDAD } from "@/lib/opportunities";
import { AREAS_PRIVADAS, areaPrivadaDe } from "@/lib/areas-privadas";
import { RUTA_POR_ROL } from "@/lib/types";

const RAIZ = join(__dirname, "..", "..");

describe("tipos de oferta", () => {
  it("solo admite los tres del catálogo", () => {
    expect(leerTipoDeOferta("service")).toBe("service");
    expect(leerTipoDeOferta("money")).toBe("money");
    expect(leerTipoDeOferta("in_kind")).toBe("in_kind");
    expect(leerTipoDeOferta("regalo")).toBeNull();
    expect(leerTipoDeOferta("")).toBeNull();
  });

  it("todos los del catálogo tienen etiqueta", () => {
    for (const tipo of TIPOS_DE_OFERTA) {
      expect(ETIQUETA_TIPO_OFERTA[tipo.id]).toBeTruthy();
    }
  });

  it("el estado solo puede ser uno de los tres", () => {
    expect(leerEstadoOferta("available")).toBe("available");
    expect(leerEstadoOferta("borrada")).toBeNull();
  });
});

describe("leer una oferta de la base de datos", () => {
  const fila = {
    id: "of-1",
    company_id: "emp-1",
    title: "4 sesiones de fisioterapia al mes",
    description: "Con cita previa",
    offer_type: "service",
    category: "fisioterapia",
    // Postgres devuelve los `numeric` como texto.
    value: "500.00",
    wants: "Logo en la camiseta",
    province: "Alicante",
    status: "available",
    archived_at: null,
    created_at: "2026-09-01T00:00:00Z",
  };

  it("convierte el importe de texto a número", () => {
    expect(filaAOferta(fila).valor).toBe(500);
  });

  it("sin importe se queda en nulo, no en cero", () => {
    // Cero diría "es gratis"; nulo dice "no lleva precio". No es lo
    // mismo, y en un servicio lo segundo es lo correcto.
    expect(filaAOferta({ ...fila, value: null }).valor).toBeNull();
  });

  /**
   * Un tipo desconocido no puede dejar la oferta sin pintar: llegaría
   * de una fila vieja o de una categoría retirada, y perder la oferta
   * entera es peor que enseñarla como aportación en especie.
   */
  it("un tipo que no conoce cae en 'producto' en vez de romperse", () => {
    expect(filaAOferta({ ...fila, offer_type: "loquesea" }).tipo).toBe("in_kind");
  });

  it("una categoría que no está en el catálogo se queda sin categoría", () => {
    expect(filaAOferta({ ...fila, category: "brujeria" }).categoria).toBeNull();
  });

  it("la versión pública trae los datos de la empresa pegados", () => {
    const publica = filaAOfertaPublica({
      ...fila,
      company_slug: "fisio-benidorm",
      company_name: "Fisio Benidorm",
      company_sector: "Salud",
      company_city: "Benidorm",
      company_logo_url: null,
    });

    expect(publica.empresaNombre).toBe("Fisio Benidorm");
    expect(publica.empresaSlug).toBe("fisio-benidorm");
    expect(publica.titulo).toBe(fila.title);
  });
});

describe("el resumen de una línea", () => {
  it("junta tipo y categoría", () => {
    expect(resumenDeOferta({ tipo: "service", categoria: "fisioterapia" })).toBe(
      "Un servicio · Fisioterapia",
    );
  });

  it("sin categoría, solo el tipo", () => {
    expect(resumenDeOferta({ tipo: "money", categoria: null })).toBe("Dinero");
  });
});

/**
 * El panel de empresa vuelve a existir (migración 0046). Estas dos
 * cosas van juntas o no funciona: si el rol apunta a una ruta que el
 * middleware no protege, el panel queda abierto; si se protege una ruta
 * a la que no apunta nadie, la empresa entra y se queda en la portada.
 */
describe("el panel de empresa está enchufado", () => {
  it("la empresa tiene su propio panel, no la portada", () => {
    expect(RUTA_POR_ROL.empresa).toBe("/empresa");
  });

  it("esa ruta es zona privada de la empresa", () => {
    expect(areaPrivadaDe("/empresa")).toEqual(["empresa", "/empresa"]);
    expect(areaPrivadaDe("/empresa/ficha")).toEqual(["empresa", "/empresa"]);
  });

  it("el destino de cada rol es una zona protegida, salvo que sea la portada", () => {
    for (const [rol, ruta] of Object.entries(RUTA_POR_ROL)) {
      if (ruta === "/") continue;
      expect(AREAS_PRIVADAS.some(([unRol, prefijo]) => unRol === rol && prefijo === ruta)).toBe(true);
    }
  });

  /**
   * El directorio es público a propósito: un club sin sesión tiene que
   * poder mirarlo, y una empresa tiene que poder enseñar su ficha a
   * quien quiera. Si "/empresas" cayera dentro de la zona privada
   * "/empresa", el directorio pediría iniciar sesión.
   */
  it("el directorio público no se cuela en la zona privada", () => {
    expect(areaPrivadaDe("/empresas")).toBeNull();
    expect(areaPrivadaDe("/empresas/fisio-benidorm")).toBeNull();
  });
});

/**
 * Las ofertas de empresa y las necesidades de los clubes comparten
 * catálogo de categorías. Es lo único que hace que un club que busca
 * fisioterapia encuentre a la clínica que la ofrece: si se separan, las
 * dos listas siguen funcionando por su cuenta y no se cruzan nunca.
 */
describe("empresas y clubes hablan el mismo idioma", () => {
  it("la oferta usa el mismo catálogo de categorías que la necesidad", () => {
    const formulario = readFileSync(
      join(RAIZ, "src/app/[locale]/empresa/components/OfertaForm.tsx"),
      "utf8",
    );
    expect(formulario).toContain("CATEGORIAS_NECESIDAD");
    expect(CATEGORIAS_NECESIDAD.length).toBeGreaterThan(10);
  });
});
