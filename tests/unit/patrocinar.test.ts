import { describe, expect, it } from "vitest";
import { clubesDe, combinaciones, delPais, slugDeZona, type ClubDePatrocinio } from "@/lib/patrocinar";

const club = (datos: Partial<ClubDePatrocinio>): ClubDePatrocinio => ({
  id: "x",
  slug: "x",
  name: "X",
  city: null,
  province: null,
  country: "ES",
  logoUrl: null,
  description: null,
  deportes: [],
  oportunidades: 0,
  desde: null,
  ...datos,
});

const clubes = [
  club({ id: "1", name: "Maciot", province: "Las Palmas", deportes: ["futbol"], oportunidades: 4 }),
  club({ id: "2", name: "Alvares", province: "Alicante", deportes: ["balonmano"], oportunidades: 3 }),
  club({ id: "3", name: "Recife", province: "Pernambuco (PE)", country: "BR", deportes: ["futbol"] }),
  club({ id: "4", name: "Sin zona", deportes: ["futbol"] }),
];

describe("páginas para patrocinar por deporte y zona", () => {
  it("zonas sin tildes ni espacios", () => {
    expect(slugDeZona("Las Palmas")).toBe("las-palmas");
    expect(slugDeZona("Pernambuco (PE)")).toBe("pernambuco-pe");
    expect(slugDeZona("Ávila")).toBe("avila");
  });

  it("cada web, los clubes de su país", () => {
    expect(delPais(clubes, "BR").map((c) => c.id)).toEqual(["3"]);
    expect(delPais(clubes, "ES")).toHaveLength(3);
    expect(delPais(clubes, "todos")).toHaveLength(4);
  });

  it("solo existen las páginas con algún club", () => {
    const paginas = combinaciones(delPais(clubes, "ES")).map((c) => `${c.deporte}/${c.zona ?? ""}`);
    expect(paginas).toContain("futbol/");
    expect(paginas).toContain("futbol/las-palmas");
    expect(paginas).toContain("balonmano/alicante");
    expect(paginas).not.toContain("futbol/pernambuco-pe");
    expect(clubesDe(clubes, "futbol", "las-palmas").map((c) => c.id)).toEqual(["1"]);
    expect(clubesDe(clubes, "rugby")).toHaveLength(0);
  });
});
