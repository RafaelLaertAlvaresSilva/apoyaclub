import { describe, expect, it } from "vitest";
import type { CifraDeAlcance } from "@/lib/alcance";
import {
  OPCIONES_POR_DEFECTO,
  direccionDelQr,
  enlaceValidoParaQr,
  opcionesDelFormulario,
  opcionesGuardadas,
  opcionesParaGuardar,
} from "@/lib/dossier-opciones";
import { dossierRowToConfig } from "@/lib/dossier-mappers";
import { ordenDelDossier } from "@/lib/dossier-orden";
import { repartoSinRepetir } from "@/lib/dossier-sin-repetir";

describe("opciones del dossier", () => {
  it("por defecto: con fotos, patrocinadores solo con el nombre y separados por categoría", () => {
    expect(OPCIONES_POR_DEFECTO).toEqual({
      fotosOportunidades: true,
      fotoEquipoMasculino: true,
      fotoEquipoFemenino: true,
      logosPatrocinadores: false,
      separarPatrocinadores: true,
      qr: "ficha",
      qrEnlace: null,
    });
    expect(opcionesGuardadas([])).toEqual(OPCIONES_POR_DEFECTO);
  });

  it("se guardan y se leen igual, en la columna de las secciones", () => {
    const elegidas = { ...OPCIONES_POR_DEFECTO, fotosOportunidades: false, logosPatrocinadores: true };
    const guardado = ["identidad", "oportunidades", ...opcionesParaGuardar(elegidas)];
    expect(opcionesGuardadas(guardado)).toEqual(elegidas);
    expect(dossierRowToConfig({
      id: "c1",
      sections: guardado,
      opportunity_ids: [],
      share_token: null,
      share_enabled: false,
      share_expires_at: null,
      updated_at: "",
    }).opciones).toEqual(elegidas);
  });

  it("no estorban a las secciones ni al orden", () => {
    const guardado = ["patrocinadores", "identidad", ...opcionesParaGuardar(OPCIONES_POR_DEFECTO)];
    expect(ordenDelDossier(guardado).slice(0, 2)).toEqual(["patrocinadores", "identidad"]);
    expect(dossierRowToConfig({
      id: "c1",
      sections: guardado,
      opportunity_ids: [],
      share_token: null,
      share_enabled: false,
      share_expires_at: null,
      updated_at: "",
    }).sections).toEqual(["patrocinadores", "identidad"]);
  });

  it("ignora lo que no conoce", () => {
    expect(opcionesGuardadas(["opcion:inventada=1", "opcion:fotosOportunidades=talvez"])).toEqual(OPCIONES_POR_DEFECTO);
  });

  it("del formulario: una casilla sin marcar es 'no'; sin la marca, las de por defecto", () => {
    const formulario = new FormData();
    formulario.append("opcionesEnviadas", "1");
    formulario.append("opcion", "logosPatrocinadores");
    expect(opcionesDelFormulario(formulario)).toEqual({
      fotosOportunidades: false,
      fotoEquipoMasculino: false,
      fotoEquipoFemenino: false,
      logosPatrocinadores: true,
      separarPatrocinadores: false,
      qr: "ficha",
      qrEnlace: null,
    });
    expect(opcionesDelFormulario(new FormData())).toEqual(OPCIONES_POR_DEFECTO);
  });
});

function cifra(id: string, valor: number): CifraDeAlcance {
  return { id, etiqueta: id, valor, unidad: "personas", origen: "declarado" } as CifraDeAlcance;
}

describe("el dossier no dice lo mismo dos veces", () => {
  const perfil = { description: "Club de barrio.", youthTeamsCount: 6, youthPlayersCount: 52, youthFamiliesCount: 125 };
  const portada = [cifra("publicoMedio", 200), cifra("jugadores", 52), cifra("familias", 125)];
  const audiencia = [cifra("publicoMedio", 200), cifra("mejorPartido", 200), cifra("jugadores", 52)];

  it("la descripción, en la portada solo si no va 'Quiénes somos'", () => {
    const base = { perfil, cifrasPortada: portada, cifrasAudiencia: audiencia, frasesLlanas: ["frase"] };
    expect(repartoSinRepetir({ ...base, vaIdentidad: true }).resumenEnPortada).toBe(false);
    expect(repartoSinRepetir({ ...base, vaIdentidad: false }).resumenEnPortada).toBe(true);
  });

  it("'Audiencia' enseña solo lo que la portada no ha enseñado, sin las frases que la repiten", () => {
    const reparto = repartoSinRepetir({ perfil, vaIdentidad: true, cifrasPortada: portada, cifrasAudiencia: audiencia, frasesLlanas: ["frase"] });
    expect(reparto.cifrasAudiencia.map((una) => una.id)).toEqual(["mejorPartido"]);
    expect(reparto.frasesLlanas).toEqual([]);
  });

  it("sin cifras en la portada, las frases sí van", () => {
    const reparto = repartoSinRepetir({ perfil, vaIdentidad: true, cifrasPortada: [], cifrasAudiencia: audiencia, frasesLlanas: ["frase"] });
    expect(reparto.frasesLlanas).toEqual(["frase"]);
    expect(reparto.cifrasAudiencia).toHaveLength(3);
  });

  it("'Cantera' no repite jugadores ni familias si ya están en la portada con el mismo valor", () => {
    const reparto = repartoSinRepetir({ perfil, vaIdentidad: true, cifrasPortada: portada, cifrasAudiencia: audiencia, frasesLlanas: [] });
    expect(reparto.cantera).toEqual({ equipos: true, jugadores: false, familias: false });
    // Con otro valor (los jugadores de la portada salen de sumar los equipos), sí.
    const otra = repartoSinRepetir({ perfil, vaIdentidad: true, cifrasPortada: [cifra("jugadores", 80)], cifrasAudiencia: [], frasesLlanas: [] });
    expect(otra.cantera.jugadores).toBe(true);
  });
});

describe("el código QR del dossier", () => {
  const sitios = { ficha: "https://apoyaclub.com/es/club/x", video: "https://youtu.be/abc" };

  it("abre lo que ha elegido el club", () => {
    expect(direccionDelQr({ qr: "ficha", qrEnlace: null }, sitios)).toEqual({ url: sitios.ficha, tipo: "ficha" });
    expect(direccionDelQr({ qr: "video", qrEnlace: null }, sitios)).toEqual({ url: sitios.video, tipo: "video" });
    expect(direccionDelQr({ qr: "enlace", qrEnlace: "https://www.club.es/" }, sitios)).toEqual({
      url: "https://www.club.es/",
      tipo: "enlace",
    });
    expect(direccionDelQr({ qr: "ninguno", qrEnlace: null }, sitios)).toBeNull();
  });

  it("si lo elegido no se puede, la ficha: un QR que no abre nada es peor que ninguno", () => {
    expect(direccionDelQr({ qr: "video", qrEnlace: null }, { ...sitios, video: null })?.tipo).toBe("ficha");
    expect(direccionDelQr({ qr: "enlace", qrEnlace: null }, sitios)?.tipo).toBe("ficha");
  });

  it("el enlace: completa el https y rechaza lo que no es una web", () => {
    expect(enlaceValidoParaQr("www.club.es")).toBe("https://www.club.es/");
    expect(enlaceValidoParaQr("https://instagram.com/club")).toBe("https://instagram.com/club");
    expect(enlaceValidoParaQr("javascript:alert(1)")).toBeNull();
    expect(enlaceValidoParaQr("hola")).toBeNull();
    expect(enlaceValidoParaQr("")).toBeNull();
    expect(enlaceValidoParaQr(`https://club.es/${"a".repeat(400)}`)).toBeNull();
  });

  it("se guarda y se lee, también el enlace", () => {
    const elegidas = { ...OPCIONES_POR_DEFECTO, qr: "enlace" as const, qrEnlace: "https://www.club.es/" };
    expect(opcionesGuardadas(opcionesParaGuardar(elegidas))).toEqual(elegidas);
    const formulario = new FormData();
    formulario.append("opcionesEnviadas", "1");
    formulario.append("qr", "video");
    formulario.append("qrEnlace", "www.club.es");
    expect(opcionesDelFormulario(formulario)).toMatchObject({ qr: "video", qrEnlace: "https://www.club.es/" });
  });
});
