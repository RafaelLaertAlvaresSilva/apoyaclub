import { describe, expect, it } from "vitest";
import {
  PLANTILLAS,
  cifrasEnTexto,
  construirCorreo,
  correoDe,
  enlaceDeCorreo,
  esPlantillaValida,
  huecosDelClub,
  type DatosDelClub,
  type DatosDeLaEmpresa,
} from "@/lib/plantillas-correo-club";
import { traductorDePrueba } from "./traductor-de-prueba";

const t = traductorDePrueba("es", "panel", "plantillas");

function club(cambios: Partial<DatosDelClub> = {}): DatosDelClub {
  return {
    nombre: "Club Balonmano Vigo",
    localidad: "Vigo",
    deporte: "balonmano",
    jugadores: 180,
    familias: 140,
    socios: null,
    publicoMedio: 120,
    urlFicha: "https://apoyaclub.com/es/club/cb-vigo",
    urlDossier: "https://apoyaclub.com/es/dossier/abc",
    firmante: "Rafa",
    ...cambios,
  };
}

function empresa(cambios: Partial<DatosDeLaEmpresa> = {}): DatosDeLaEmpresa {
  return { nombre: "Ferretería Ramírez", contactoNombre: "Marta", detalle: null, ...cambios };
}

describe("las cifras en una frase", () => {
  it("junta lo que hay con comas y una y", () => {
    expect(cifrasEnTexto(club(), t)).toBe(
      "180 jugadores, 140 familias y una media de 120 personas en cada partido en casa",
    );
  });

  it("con una sola cifra, no inventa la conjunción", () => {
    expect(cifrasEnTexto(club({ familias: null, publicoMedio: null }), t)).toBe("180 jugadores");
  });

  /**
   * La regla que manda sobre todas: no se inventa un dato ni se deja un
   * hueco. "Contamos con jugadores" es peor que no mandar nada.
   */
  it("sin ninguna cifra devuelve null, para que la frase se caiga entera", () => {
    const sinNada = club({ jugadores: null, familias: null, socios: null, publicoMedio: null });
    expect(cifrasEnTexto(sinNada, t)).toBeNull();
  });

  it("un cero no se enseña: no dice nada bueno y encima es raro", () => {
    expect(cifrasEnTexto(club({ jugadores: 0, familias: 0, socios: 0, publicoMedio: 0 }), t)).toBeNull();
  });
});

describe("el correo generado", () => {
  it("todas las plantillas dan asunto y cuerpo", () => {
    for (const plantilla of PLANTILLAS) {
      const correo = construirCorreo(plantilla.id, club(), empresa(), t);
      expect(correo.asuntos.length).toBeGreaterThanOrEqual(2);
      expect(correo.cuerpo.length).toBeGreaterThan(100);
      // Nada de marcadores sin sustituir.
      expect(correo.cuerpo).not.toContain("{");
      expect(correo.cuerpo).not.toContain("undefined");
      expect(correo.cuerpo).not.toContain("null");
    }
  });

  it("saluda por su nombre cuando se sabe", () => {
    expect(construirCorreo("conocida", club(), empresa(), t).cuerpo).toContain("Hola Marta,");
  });

  it("y sin nombre no se inventa uno", () => {
    const correo = construirCorreo("conocida", club(), empresa({ contactoNombre: null }), t);
    expect(correo.cuerpo).toContain("Hola,");
  });

  it("sin cifras, el correo sale sin esa frase y no coja", () => {
    const sinNada = club({ jugadores: null, familias: null, socios: null, publicoMedio: null });
    const correo = construirCorreo("conocida", sinNada, empresa(), t);

    expect(correo.cuerpo).not.toContain("Este año somos");
    expect(correo.cuerpo).toContain("Club Balonmano Vigo");
  });

  it("sin dossier enlaza la ficha pública, que siempre existe", () => {
    const correo = construirCorreo("conocida", club({ urlDossier: null }), empresa(), t);
    expect(correo.cuerpo).toContain("/club/cb-vigo");
  });

  it("sin firmante deja un hueco visible para que lo ponga el club", () => {
    const correo = construirCorreo("conocida", club({ firmante: null }), empresa(), t);
    expect(correo.cuerpo).toContain("[tu nombre]");
  });

  it("lo que el club apuntó de la empresa entra en el correo", () => {
    const correo = construirCorreo("servicio", club(), empresa({ detalle: "Necesitamos un fisio" }), t);
    expect(correo.cuerpo).toContain("Necesitamos un fisio");
  });
});

describe("lo que falta por rellenar", () => {
  it("un club completo no tiene huecos", () => {
    expect(huecosDelClub(club(), t)).toEqual([]);
  });

  it("avisa de las cifras, del dossier y de la firma", () => {
    const pelado = club({
      jugadores: null,
      familias: null,
      socios: null,
      publicoMedio: null,
      urlDossier: null,
      firmante: null,
    });

    const huecos = huecosDelClub(pelado, t);
    expect(huecos).toHaveLength(3);
    // Cada uno con su sitio al que ir: un aviso sin destino no sirve.
    for (const hueco of huecos) expect(hueco.donde.startsWith("/panel")).toBe(true);
  });

  it("los correos que no llevan cifras no piden nada", () => {
    expect(construirCorreo("insistir", club({ jugadores: null }), empresa(), t).faltan).toEqual([]);
    expect(construirCorreo("cierre", club({ jugadores: null }), empresa(), t).faltan).toEqual([]);
  });
});

describe("pescar el correo de lo que el club apuntó a mano", () => {
  it("lo encuentra entre el resto del texto", () => {
    expect(correoDe("Marta, 600111222, marta@ferreteria.es")).toBe("marta@ferreteria.es");
  });

  it("no se lleva la coma de detrás", () => {
    expect(correoDe("escribir a hola@bar.es, o llamar")).toBe("hola@bar.es");
  });

  it("si no hay ninguno, no se inventa uno", () => {
    expect(correoDe("El de la ferretería, preguntar por Juan")).toBeNull();
    expect(correoDe(null)).toBeNull();
  });
});

describe("el enlace que abre el correo del club", () => {
  it("lleva destinatario, asunto y cuerpo", () => {
    const enlace = enlaceDeCorreo({ para: "hola@bar.es", asunto: "Hola", cuerpo: "Qué tal" });
    expect(enlace.startsWith("mailto:hola%40bar.es?")).toBe(true);
    expect(enlace).toContain("subject=Hola");
    expect(enlace).toContain("body=Qu%C3%A9%20tal");
  });

  it("sin destinatario se abre igual, en blanco", () => {
    expect(enlaceDeCorreo({ para: null, asunto: "A", cuerpo: "B" }).startsWith("mailto:?")).toBe(true);
  });
});

describe("el catálogo de plantillas", () => {
  it("solo admite las que existen", () => {
    expect(esPlantillaValida("conocida")).toBe(true);
    expect(esPlantillaValida("loquesea")).toBe(false);
  });

  it("cada una dice cuándo se usa", () => {
    for (const plantilla of PLANTILLAS) {
      expect(t(`tipos.${plantilla.id}.etiqueta`).length).toBeGreaterThan(5);
      expect(t(`tipos.${plantilla.id}.cuando`).length).toBeGreaterThan(10);
    }
  });
});

describe("los correos en portugués y en inglés", () => {
  for (const idioma of ["pt", "en"]) {
    const tIdioma = traductorDePrueba(idioma, "panel", "plantillas");

    it(`en ${idioma} salen todas las plantillas, sin huecos sin rellenar`, () => {
      for (const plantilla of PLANTILLAS) {
        const correo = construirCorreo(plantilla.id, club(), empresa(), tIdioma, idioma === "pt" ? "pt-PT" : "en-GB");
        expect(correo.asuntos.every((asunto) => asunto.length > 5)).toBe(true);
        // Una variable sin sustituir ({club}) sería un correo roto.
        expect(correo.cuerpo).not.toMatch(/\{\w+\}/);
        expect(correo.cuerpo).toContain("Club Balonmano Vigo");
      }
    });
  }

  it("la lista de cifras usa la conjunción de cada idioma", () => {
    expect(cifrasEnTexto(club(), traductorDePrueba("pt", "panel", "plantillas"), "pt-PT")).toContain(" e ");
    expect(cifrasEnTexto(club(), traductorDePrueba("en", "panel", "plantillas"), "en-GB")).toContain(" and ");
  });
});
