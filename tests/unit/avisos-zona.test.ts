import { describe, expect, it } from "vitest";
import {
  buscarUrlDelAviso,
  loNuevoParaElAviso,
  paisDelAviso,
  textoDeLaZona,
  tocaEscribir,
  type AvisoDeZona,
  type OportunidadNueva,
} from "@/lib/avisos-zona";

function aviso(parcial: Partial<AvisoDeZona> = {}): AvisoDeZona {
  return {
    id: "a1",
    email: "empresa@example.com",
    country: "ES",
    province: "Alicante",
    sport: null,
    locale: "es",
    unsubscribe_token: "tok",
    created_at: "2026-11-01T10:00:00Z",
    last_sent_at: null,
    ...parcial,
  };
}

function oportunidad(parcial: Partial<OportunidadNueva> = {}): OportunidadNueva {
  return {
    id: "o1",
    titulo: "Camiseta",
    clubId: "c1",
    clubNombre: "CB Benidorm",
    clubSlug: "cb-benidorm",
    clubProvincia: "Alicante",
    clubPais: "ES",
    creadaEl: "2026-11-05T10:00:00Z",
    ...parcial,
  };
}

describe("loNuevoParaElAviso", () => {
  const sinDeportes = new Map<string, Set<string>>();

  it("solo lo de su provincia y su país, publicado después de apuntarse", () => {
    const nuevas = loNuevoParaElAviso(
      aviso(),
      [
        oportunidad({ id: "si" }),
        oportunidad({ id: "otra-provincia", clubProvincia: "Valencia" }),
        oportunidad({ id: "otro-pais", clubPais: "BR" }),
        oportunidad({ id: "de-antes", creadaEl: "2026-10-30T10:00:00Z" }),
      ],
      sinDeportes,
    );
    expect(nuevas.map((una) => una.id)).toEqual(["si"]);
  });

  it("después del último correo, no repite lo ya contado", () => {
    const nuevas = loNuevoParaElAviso(
      aviso({ last_sent_at: "2026-11-06T00:00:00Z" }),
      [oportunidad({ id: "ya-contada" }), oportunidad({ id: "nueva", creadaEl: "2026-11-07T09:00:00Z" })],
      sinDeportes,
    );
    expect(nuevas.map((una) => una.id)).toEqual(["nueva"]);
  });

  it("con deporte, solo clubes con un equipo de ese deporte (aunque esté escrito distinto)", () => {
    const deportes = new Map([
      ["futbolero", new Set(["futbol"])],
      ["baloncestista", new Set(["baloncesto"])],
    ]);
    const nuevas = loNuevoParaElAviso(
      aviso({ sport: "Fútbol" }),
      [oportunidad({ id: "f", clubId: "futbolero" }), oportunidad({ id: "b", clubId: "baloncestista" })],
      deportes,
    );
    expect(nuevas.map((una) => una.id)).toEqual(["f"]);
  });

  it("sin provincia, todo el país; un club sin país cuenta como de España", () => {
    const nuevas = loNuevoParaElAviso(
      aviso({ province: null }),
      [oportunidad({ id: "valencia", clubProvincia: "Valencia", clubPais: null })],
      sinDeportes,
    );
    expect(nuevas).toHaveLength(1);
  });
});

describe("tocaEscribir", () => {
  const ahora = new Date("2026-11-10T08:00:00Z");
  it("nunca escrito: sí; hace 3 días: no; hace 7 días: sí", () => {
    expect(tocaEscribir({ last_sent_at: null }, ahora)).toBe(true);
    expect(tocaEscribir({ last_sent_at: "2026-11-07T08:00:00Z" }, ahora)).toBe(false);
    expect(tocaEscribir({ last_sent_at: "2026-11-03T08:00:00Z" }, ahora)).toBe(true);
  });
});

describe("paisDelAviso, textoDeLaZona y buscarUrlDelAviso", () => {
  it("el país elegido manda; si no, el del idioma", () => {
    expect(paisDelAviso("PT", "es")).toBe("PT");
    expect(paisDelAviso("todos", "br")).toBe("BR");
    expect(paisDelAviso("", "en")).toBe("ES");
  });

  it("la zona en palabras", () => {
    const deporte = (texto: string) => texto.toLowerCase();
    expect(textoDeLaZona({ province: "Alicante", sport: "Fútbol" }, "España", deporte)).toBe("Alicante · fútbol");
    expect(textoDeLaZona({ province: null, sport: null }, "España", deporte)).toBe("España");
    expect(textoDeLaZona({ province: null, sport: "Pádel" }, "España", deporte)).toBe("pádel · España");
  });

  it("el enlace lleva al buscador con lo que buscaba", () => {
    const url = buscarUrlDelAviso({ locale: "es", country: "ES", province: "Las Palmas", sport: "Fútbol" });
    expect(url).toContain("/es/buscar?");
    expect(url).toContain("pais=ES");
    expect(url).toContain("provincia=Las+Palmas");
    expect(url).toContain("deporte=F%C3%BAtbol");
  });
});
