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

    expect(xml).toContain("Seguidores en Instagram");
    expect(xml).toContain("Seguidores en Facebook");
    expect(xml).not.toContain("1.700");
  });

  it("marca de dónde sale cada cifra y enseña la cuenta de las deducidas", async () => {
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

    expect(xml).toContain("Lo que se ha contado");
    expect(xml).toContain("partidos apuntados");
    expect(xml).toContain("200 personas × 3 partidos en casa");
    expect(xml).toContain("ApoyaClub no las verifica");
  });

  it("deja fuera las secciones que el club no ha marcado", async () => {
    const xml = await textoDelDocumento(
      await generarDossierWord(datosDePrueba({ secciones: ["identidad"] })),
    );

    expect(xml).toContain("Quiénes somos");
    expect(xml).not.toContain("Ascenso a Primera Autonómica");
    expect(xml).not.toContain("Patrocinadores actuales");
    // El nombre del patrocinador sigue saliendo en la portada, en "ya
    // confían en nosotros", igual que en el PDF: la prueba social vende
    // aunque el club no quiera el apartado entero.
    expect(xml).toContain("YA CONFÍAN EN NOSOTROS");
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
});
