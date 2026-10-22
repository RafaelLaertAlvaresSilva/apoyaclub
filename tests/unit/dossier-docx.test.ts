import { describe, expect, it } from "vitest";
import { generarDossierWord } from "@/lib/dossier-docx";
import type { DatosDossier } from "@/lib/dossier-datos";
import { equipoDePrueba, patrocinadorDePrueba, perfilDePrueba } from "../fixtures/club";

function datosDePrueba(cambios: Partial<DatosDossier> = {}): DatosDossier {
  return {
    perfil: perfilDePrueba({
      name: "Club Deportivo Ejemplo",
      description: "Un club de barrio con setenta años de historia.",
      facilities: "Pabellón municipal con dos pistas.",
      facilitiesAddress: "Calle Mayor 1, Valencia",
      foundingYear: 1954,
      milestones: [{ year: 1998, text: "Ascenso a Primera Autonómica" }],
      youthTeamsCount: 8,
      youthPlayersCount: 120,
      youthFamiliesCount: 95,
      averageAttendance: 250,
      estimatedReach: 5000,
      socialLinks: { instagram: "https://instagram.com/ejemplo" },
      followersByNetwork: { instagram: 1200 },
      contactName: "Ana Ruiz",
      contactPhone: "600 000 000",
      contactHours: "De 17:00 a 21:00",
      contactPublicConsent: true,
    }),
    equipos: [equipoDePrueba({ sport: "Balonmano", category: "Senior", playerCount: 16 })],
    patrocinadores: [patrocinadorDePrueba({ name: "Ferretería Ramírez", sinceYear: 2019 })],
    oportunidades: [],
    partidos: [],
    secciones: ["identidad", "equipos", "cantera", "audiencia", "patrocinadores", "historia", "instalaciones"],
    emailContacto: "club@ejemplo.es",
    ...cambios,
  };
}

/** El texto plano del documento, sacado del XML de dentro del .docx. */
async function textoDelDocumento(buffer: Buffer): Promise<string> {
  const { execFileSync } = await import("node:child_process");
  const { mkdtempSync, writeFileSync } = await import("node:fs");
  const { tmpdir } = await import("node:os");
  const { join } = await import("node:path");

  const carpeta = mkdtempSync(join(tmpdir(), "docx-"));
  const archivo = join(carpeta, "d.docx");
  writeFileSync(archivo, buffer);
  return execFileSync("unzip", ["-p", archivo, "word/document.xml"], { maxBuffer: 32 * 1024 * 1024 }).toString();
}

describe("generarDossierWord", () => {
  it("produce un .docx válido (empieza por la firma de un ZIP)", async () => {
    const buffer = await generarDossierWord(datosDePrueba());

    expect(buffer.length).toBeGreaterThan(2000);
    expect(buffer.toString("ascii", 0, 2)).toBe("PK");
  });

  it("incluye el nombre del club y el contenido de las secciones marcadas", async () => {
    const xml = await textoDelDocumento(await generarDossierWord(datosDePrueba()));

    expect(xml).toContain("Club Deportivo Ejemplo");
    expect(xml).toContain("Quiénes somos");
    expect(xml).toContain("Balonmano");
    expect(xml).toContain("Ferretería Ramírez");
    expect(xml).toContain("Ascenso a Primera Autonómica");
    expect(xml).toContain("Calle Mayor 1, Valencia");
    expect(xml).toContain("club@ejemplo.es");
  });

  it("no suma los seguidores de varias redes en una sola cifra", async () => {
    // Quien sigue al club en Instagram y en Facebook es, muchas veces,
    // la misma persona. Sumarlos daba 1.700 seguidores donde puede que
    // haya 1.000, y la empresa que lo comprueba deja de creerse el
    // resto del dossier.
    const xml = await textoDelDocumento(
      await generarDossierWord(
        datosDePrueba({
          perfil: perfilDePrueba({
            name: "Club Deportivo Ejemplo",
            followersByNetwork: { instagram: 1200, facebook: 500 },
          }),
        }),
      ),
    );

    // Cada red en su tarjeta de "Redes sociales", con sus seguidores.
    expect(xml).toContain("Redes sociales");
    expect(xml).toContain("Instagram");
    expect(xml).toContain("Facebook");
    expect(xml).toContain("1200");
    expect(xml).toContain("500");
    expect(xml).not.toContain("1.700");
    expect(xml).not.toContain("1700");
  });

  it("marca de dónde sale cada cifra, en sencillo y sin las cuentas deducidas", async () => {
    const partido = (fecha: string, publico: number) => ({
      id: fecha,
      clubId: "club-1",
      fecha,
      rival: "C.D. Rival",
      competicion: null,
      equipo: null,
      equipoId: null,
      enCasa: true,
      publico,
      notas: null,
    });

    const xml = await textoDelDocumento(
      await generarDossierWord(
        datosDePrueba({
          partidos: [
            partido("2025-09-14", 200),
            partido("2025-10-05", 200),
            partido("2025-11-05", 200),
          ],
        }),
      ),
    );

    // Una etiqueta corta por cifra, en vez de los tres bloques
    // ("contado", "declarado", "deducido") que costaba entender.
    expect(xml).toContain("Contado en los partidos");
    expect(xml).toContain("Partidos apuntados");
    expect(xml).not.toContain("Lo que se deduce");
    expect(xml).not.toContain("200 personas × 3 partidos en casa");
    expect(xml).toContain("ApoyaClub no las verifica");
  });

  it("deja fuera las secciones que el club no ha marcado", async () => {
    const xml = await textoDelDocumento(
      await generarDossierWord(datosDePrueba({ secciones: ["identidad"] })),
    );

    expect(xml).toContain("Quiénes somos");
    expect(xml).not.toContain("Ascenso a Primera Autonómica");
    expect(xml).not.toContain("Patrocinadores actuales");
    // Tampoco en la portada: si el club no quiere enseñar a sus
    // patrocinadores, no salen en ningún sitio (antes seguían en "ya
    // confían en nosotros").
    expect(xml).not.toContain("YA CONFÍAN EN NOSOTROS");
  });

  it("solo saca los niveles de patrocinador que ha elegido el club", async () => {
    const datos = datosDePrueba();
    const nivel = datos.patrocinadores[0].tier;
    const otro = nivel === "principal" ? "oficial" : "principal";

    const conSuNivel = await textoDelDocumento(await generarDossierWord({ ...datos, nivelesPatrocinadores: [nivel] }));
    expect(conSuNivel).toContain(datos.patrocinadores[0].name);
    expect(conSuNivel).toContain("YA CONFÍAN EN NOSOTROS");

    const sinSuNivel = await textoDelDocumento(await generarDossierWord({ ...datos, nivelesPatrocinadores: [otro] }));
    expect(sinSuNivel).not.toContain(datos.patrocinadores[0].name);
    expect(sinSuNivel).not.toContain("Patrocinadores actuales");
    expect(sinSuNivel).not.toContain("YA CONFÍAN EN NOSOTROS");
  });

  it("no publica el teléfono si el club no ha autorizado enseñarlo", async () => {
    const datos = datosDePrueba();
    const xml = await textoDelDocumento(
      await generarDossierWord({
        ...datos,
        perfil: { ...datos.perfil, contactPublicConsent: false },
      }),
    );

    expect(xml).not.toContain("600 000 000");
    expect(xml).not.toContain("Ana Ruiz");
    // El correo sí: es el de la propia cuenta del club, que es quien
    // se está descargando el documento.
    expect(xml).toContain("club@ejemplo.es");
  });

  it("sale adelante aunque el club no haya rellenado casi nada", async () => {
    const buffer = await generarDossierWord({
      perfil: perfilDePrueba(),
      equipos: [],
      patrocinadores: [],
      oportunidades: [],
      partidos: [],
      secciones: [],
      emailContacto: null,
    });

    expect(buffer.toString("ascii", 0, 2)).toBe("PK");
  });

  it("sale en el idioma que se le pide, con el enlace a la ficha en ese idioma", async () => {
    const ingles = await textoDelDocumento(await generarDossierWord(datosDePrueba(), "en"));
    expect(ingles).toContain("Who we are");
    expect(ingles).toContain("Our history");
    expect(ingles).toContain("Founded in 1954.");
    expect(ingles).toContain("/en/club/");
    expect(ingles).not.toContain("Quiénes somos");

    const portugues = await textoDelDocumento(await generarDossierWord(datosDePrueba(), "pt"));
    expect(portugues).toContain("Quem somos");
    expect(portugues).toContain("/pt/club/");
    expect(portugues).not.toContain("Quiénes somos");
  });

  it("un idioma que no existe sale en español", async () => {
    const xml = await textoDelDocumento(await generarDossierWord(datosDePrueba(), "fr"));
    expect(xml).toContain("Quiénes somos");
    expect(xml).toContain("/es/club/");
  });
});
