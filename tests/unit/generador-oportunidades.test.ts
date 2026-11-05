import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import type { RequisitoIdea } from "@/lib/catalogo-ideas";
import {
  CATEGORIAS_DEL_GENERADOR,
  IDEAS_DEL_GENERADOR,
  MAXIMO_DE_PROPUESTAS,
  equipoPrincipal,
  generarPropuestas,
} from "@/lib/generador-oportunidades";
import type { ClubTeam } from "@/lib/types";

const mensajes = JSON.parse(readFileSync("messages/es/ideas.json", "utf8"));
const tIdeas = (clave: string) =>
  clave.split(".").reduce<unknown>((actual, parte) => (actual as Record<string, unknown>)?.[parte], mensajes) as string;

function equipo(id: string, gender: string, teamLevel: ClubTeam["teamLevel"] = "primer_equipo", photoUrl: string | null = null): ClubTeam {
  return { id, clubId: "c", sport: "balonmano", category: "Senior", gender, teamLevel, playerCount: 13, photoUrl } as ClubTeam;
}

const perfil = { topCategoryMalePhoto: "https://x/masc.jpg", topCategoryFemalePhoto: "https://x/fem.jpg" };
const todo = new Set<RequisitoIdea>(["equipos", "cantera", "instalaciones", "redes", "publico"]);
const base = {
  perfil,
  equipos: [equipo("f", "Femenino"), equipo("m", "Masculino")],
  requisitos: todo,
  existentes: [],
  tIdeas,
  nombreDelEquipo: (e: ClubTeam) => `${e.category} ${e.gender}`,
  lineaDeDatos: "Datos del Club X: Jugadores: 52.",
};

describe("generar mis oportunidades", () => {
  it("todas las ideas del generador existen en el catálogo y tienen texto", () => {
    for (const id of IDEAS_DEL_GENERADOR) expect(tIdeas(`ideas.${id}.titulo`)).toBeTruthy();
  });

  it("propone como mucho 8 ofertas marcadas y las necesidades sin marcar", () => {
    const propuestas = generarPropuestas(base);
    const ofertas = propuestas.filter((p) => !p.esNecesidad);
    expect(ofertas).toHaveLength(MAXIMO_DE_PROPUESTAS);
    expect(ofertas.every((p) => p.marcada)).toBe(true);
    expect(propuestas.filter((p) => p.esNecesidad).every((p) => !p.marcada)).toBe(true);
  });

  it("las de equipo van con el equipo principal (masculino si hay los dos), su nombre y su foto", () => {
    const pecho = generarPropuestas(base).find((p) => p.ideaId === "equipacion-pecho")!;
    expect(pecho.title).toBe("Pecho de la camiseta de juego · Senior Masculino");
    expect(pecho.teamId).toBe("m");
    expect(pecho.fotos).toEqual(["https://x/masc.jpg"]);
  });

  it("la foto propia del equipo va antes que la del perfil", () => {
    expect(equipoPrincipal([equipo("m", "Masculino", "primer_equipo", "https://x/propia.jpg")])?.photoUrl).toBe(
      "https://x/propia.jpg",
    );
    const conPropia = generarPropuestas({ ...base, equipos: [equipo("m", "Masculino", "primer_equipo", "https://x/propia.jpg")] });
    expect(conPropia.find((p) => p.ideaId === "equipacion-pecho")!.fotos).toEqual(["https://x/propia.jpg"]);
  });

  it("los textos llevan los datos del club, pero las necesidades no", () => {
    const propuestas = generarPropuestas(base);
    expect(propuestas.find((p) => p.ideaId === "equipacion-pecho")!.description).toContain("Datos del Club X");
    expect(propuestas.find((p) => p.esNecesidad)!.description).not.toContain("Datos del Club X");
  });

  it("solo propone lo que el club puede cumplir con su ficha", () => {
    const sinNada = generarPropuestas({ ...base, equipos: [], requisitos: new Set() });
    expect(sinNada.map((p) => p.ideaId)).not.toContain("equipacion-pecho");
    expect(sinNada.map((p) => p.ideaId)).not.toContain("instalaciones-lona");
    expect(sinNada.every((p) => p.teamId === null)).toBe(true);
  });

  it("no repite lo que el club ya tiene, por idea o por título", () => {
    const yaTiene = generarPropuestas({
      ...base,
      existentes: [
        { title: "Empresa del mes", ideaId: null },
        { title: "Lo que sea", ideaId: "instalaciones-lona" },
      ],
    });
    const ids = yaTiene.map((p) => p.ideaId);
    expect(ids).not.toContain("equipo-empresa-del-mes");
    expect(ids).not.toContain("instalaciones-lona");
  });

  it("eligiendo una categoría, solo las de esa categoría, todas marcadas", () => {
    const redes = generarPropuestas({ ...base, eleccion: "redes" });
    expect(redes.length).toBeGreaterThan(0);
    expect(redes.length).toBeLessThanOrEqual(MAXIMO_DE_PROPUESTAS);
    expect(redes.every((p) => p.ideaId.startsWith("redes-"))).toBe(true);
    expect(redes.every((p) => p.marcada)).toBe(true);

    const necesita = generarPropuestas({ ...base, eleccion: "servicios" });
    expect(necesita.every((p) => p.esNecesidad && p.marcada)).toBe(true);
  });

  it("una categoría que el club no puede cumplir no da ninguna", () => {
    expect(generarPropuestas({ ...base, requisitos: new Set(), eleccion: "redes" })).toEqual([]);
  });

  it("todas las categorías del generador tienen nombre para enseñarlas", () => {
    const home = JSON.parse(readFileSync("messages/es/home.json", "utf8"));
    for (const categoria of CATEGORIAS_DEL_GENERADOR) {
      expect(home.categoriasIdea[categoria]?.etiqueta).toBeTruthy();
    }
  });

  it("no vuelve a pedir lo que el club ya pide, aunque lo haya titulado de otra forma", () => {
    const necesita = generarPropuestas({
      ...base,
      eleccion: "servicios",
      existentes: [{ title: "Buscamos servicio de Fisioterapia", ideaId: null, esNecesidad: true, categoriaNecesidad: "fisioterapia" as never }],
    });
    expect(necesita.map((p) => p.ideaId)).not.toContain("necesita-fisioterapia");
  });

  it("lo que es de todo el club no lleva el nombre de un equipo", () => {
    const equipaciones = generarPropuestas({ ...base, eleccion: "equipaciones" });
    const mochilas = equipaciones.find((p) => p.ideaId === "equipacion-mochilas")!;
    expect(mochilas.title).not.toContain("Senior");
    expect(mochilas.teamId).toBeNull();
    expect(generarPropuestas(base).find((p) => p.ideaId === "equipo-empresa-oficial")?.teamId ?? null).toBeNull();
  });

  it("nunca lleva precio: eso lo pone el club", () => {
    expect(generarPropuestas(base).every((p) => !("value" in p))).toBe(true);
  });
});

describe("publicar las propuestas", () => {
  const acciones = readFileSync("src/app/[locale]/panel/oportunidades/actions.ts", "utf8");
  const publicar = acciones.slice(acciones.indexOf("export async function publicarPropuestas"));

  it("el tipo, el periodo y si es necesidad salen de la idea, no del formulario", () => {
    expect(publicar).toContain("opportunity_type: idea.tipo");
    expect(publicar).toContain("is_need: !!idea.esNecesidad");
    expect(publicar).not.toMatch(/formData\.get\("opportunityType"\)/);
  });

  it("el equipo tiene que ser del club", () => {
    expect(publicar).toContain("equiposDelClub.has(equipo) ? equipo : null");
  });

  it("sin precio guarda 0 (precio a convenir)", () => {
    expect(publicar).toContain('textoPrecio === "" ? 0');
  });
});
