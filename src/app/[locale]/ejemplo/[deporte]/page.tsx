import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { Link } from "@/i18n/navigation";
import type { AppLocale } from "@/i18n/routing";
import { clubRowToProfile, type ClubRow } from "@/lib/club-mappers";
import { generarPropuestas } from "@/lib/generador-oportunidades";
import type { ClubTeam, Opportunity } from "@/lib/types";
import type { RequisitoIdea } from "@/lib/catalogo-ideas";
import { DEPORTES_CON_EJEMPLO, tieneEjemplo } from "@/lib/ejemplos-club";
import { FichaDelClub } from "../../club/[slug]/components/FichaDelClub";

/**
 * Una página de club de ejemplo, por deporte (pedido por Rafael el
 * 26-11-2026 para los clubes de tenis y bádminton que entraban y se
 * paraban sin saber cómo quedaría lo suyo).
 *
 * Es la misma ficha que ve una empresa (`FichaDelClub`), con un club
 * inventado y, arriba, un aviso bien claro de que es un ejemplo. Las
 * oportunidades salen del mismo generador que usa el club en su panel,
 * con las ideas de su deporte: lo que ve aquí es lo que le saldrá a él.
 *
 * Todo lo de dentro va `inert`: no se puede pulsar nada, para que nadie
 * mande una solicitud a un club que no existe. Y no se indexa: no es
 * un club de verdad y no debe salir en Google.
 */
export const metadata: Metadata = { robots: { index: false, follow: false } };

/** Fotos de Pexels (licencia libre), elegidas por Rafael. */
type Fotos = { portada: string | null; galeria: string[] };

/** Un equipo del club inventado. `categoria` es una clave de
 * `club.ejemplo.categorias`; en raqueta va `grupo`, la posición en
 * `panel.perfil.gruposRaqueta`. */
type EquipoDeEjemplo = { grupo?: number; categoria: string; sexo: "Masculino" | "Femenino" | "Mixto"; cantera: boolean; jugadores: number; foto: string | null };

type Ejemplo = {
  /** Cambia los textos (instalaciones, historia…) y las ideas que salen. */
  tipo: Tipo;
  /** Las instalaciones salen de `instalacionesDe.<deporte>` (piscina,
   * pista de atletismo…) en vez del texto general de su tipo. */
  instalacionesPropias?: boolean;
  deporte: string;
  socios: number;
  cantera: number;
  /** Pistas propias (raqueta) o grada (pabellón y campo). */
  pistas?: number;
  grada?: number;
  publico?: number;
  /** Equipos de cantera en total (no todos salen en la lista). */
  equiposCantera?: number;
  fotos: Fotos;
  equipos: EquipoDeEjemplo[];
};

type Tipo = "raqueta" | "pabellon" | "campo" | "airsoft" | "paintball" | "individual" | "running";

/** Qué textos de `club.ejemplo` lleva cada tipo de club. */
const TEXTOS: Record<Tipo, { descripcion: string; competiciones: string; hitos: string }> = {
  raqueta: { descripcion: "descripcion", competiciones: "competiciones", hitos: "hitos" },
  pabellon: { descripcion: "descripcionEquipo", competiciones: "competicionesEquipo", hitos: "hitosEquipo" },
  campo: { descripcion: "descripcionEquipo", competiciones: "competicionesEquipo", hitos: "hitosEquipo" },
  airsoft: { descripcion: "descripcionAirsoft", competiciones: "competicionesAirsoft", hitos: "hitosAirsoft" },
  paintball: { descripcion: "descripcionPaintball", competiciones: "competicionesPaintball", hitos: "hitosPaintball" },
  individual: { descripcion: "descripcionIndividual", competiciones: "competicionesIndividual", hitos: "hitosIndividual" },
  running: { descripcion: "descripcionRunning", competiciones: "competicionesRunning", hitos: "hitosRunning" },
};

const ruta = (archivo: string) => `/ejemplos-club/${archivo}.webp`;

/** Las fotos de los deportes de equipo siguen todas el mismo patrón. */
const fotosDe = (clave: string): Fotos => ({
  portada: ruta(`${clave}-portada`),
  galeria: [ruta(`${clave}-1`), ruta(`${clave}-2`)],
});

/** Un club de equipo: sénior masculino, sénior femenino y uno de cantera. */
const deEquipo = (
  deporte: string,
  tipo: "pabellon" | "campo",
  cifras: { socios: number; cantera: number; grada: number; publico: number; equiposCantera: number },
  canteraCategoria: string,
  fotos: Fotos,
  instalacionesPropias = true,
  /** Sénior masculino, sénior femenino y cantera, si no van las de siempre. */
  fotosEquipos: (string | null)[] = [fotos.galeria[0] ?? null, fotos.galeria[1] ?? null, fotos.portada],
  /** El segundo equipo es el sénior femenino, salvo que las fotos que
   * tenemos sean todas de chicos (entonces, un juvenil masculino). */
  segundo: Pick<EquipoDeEjemplo, "categoria" | "sexo" | "cantera"> = { categoria: "senior", sexo: "Femenino", cantera: false },
): Ejemplo => ({
  tipo,
  deporte,
  instalacionesPropias,
  ...cifras,
  fotos,
  equipos: [
    { categoria: "senior", sexo: "Masculino", cantera: false, jugadores: 18, foto: fotosEquipos[0] ?? null },
    { ...segundo, jugadores: 16, foto: fotosEquipos[1] ?? null },
    { categoria: canteraCategoria, sexo: "Mixto", cantera: true, jugadores: 20, foto: fotosEquipos[2] ?? null },
  ],
});

/** Un deporte individual: escuela, competición y socios, como raqueta. */
const individual = (deporte: string, socios: number, escuela: number, competicion: number, fotos: Fotos): Ejemplo => ({
  tipo: "individual",
  deporte,
  instalacionesPropias: true,
  socios,
  cantera: escuela,
  fotos,
  equipos: [
    { grupo: 0, categoria: "", sexo: "Mixto", cantera: true, jugadores: escuela, foto: fotos.galeria[0] ?? null },
    { grupo: 1, categoria: "", sexo: "Mixto", cantera: false, jugadores: competicion, foto: fotos.galeria[1] ?? null },
    { grupo: 2, categoria: "", sexo: "Mixto", cantera: false, jugadores: socios, foto: fotos.portada },
  ],
});

const raqueta = (deporte: string, pistas: number, socios: number, escuela: number, competicion: number, fotos: Fotos, fotosEquipos: (string | null)[]): Ejemplo => ({
  tipo: "raqueta",
  deporte,
  pistas,
  socios,
  cantera: escuela,
  fotos,
  equipos: [
    { grupo: 0, categoria: "", sexo: "Mixto", cantera: true, jugadores: escuela, foto: fotosEquipos[0] },
    { grupo: 1, categoria: "", sexo: "Mixto", cantera: false, jugadores: competicion, foto: fotosEquipos[1] },
    { grupo: 2, categoria: "", sexo: "Mixto", cantera: false, jugadores: socios, foto: fotosEquipos[2] },
  ],
});

const EJEMPLOS: Record<(typeof DEPORTES_CON_EJEMPLO)[number], Ejemplo> = {
  tenis: raqueta(
    "Tenis", 6, 240, 70, 16,
    { portada: ruta("tenis-portada"), galeria: [ruta("tenis-pista"), ruta("tenis-bola")] },
    [ruta("tenis-pista"), ruta("tenis-portada"), ruta("tenis-raqueta")],
  ),
  padel: raqueta(
    "Pádel", 8, 320, 55, 20,
    { portada: ruta("padel-cubierta"), galeria: [ruta("padel-pala"), ruta("padel-red")] },
    [ruta("padel-red"), ruta("padel-pista"), ruta("padel-pala")],
  ),
  badminton: raqueta(
    "Bádminton", 6, 90, 45, 14,
    { portada: ruta("badminton-portada"), galeria: [ruta("badminton-juego"), ruta("badminton-volante")] },
    [ruta("badminton-volante"), ruta("badminton-juego"), ruta("badminton-portada")],
  ),
  baloncesto: {
    tipo: "pabellon", deporte: "Baloncesto", equiposCantera: 8, socios: 310, cantera: 140, grada: 400, publico: 180,
    fotos: fotosDe("baloncesto"),
    equipos: [
      { categoria: "senior", sexo: "Masculino", cantera: false, jugadores: 14, foto: ruta("baloncesto-equipo-1") },
      { categoria: "senior", sexo: "Femenino", cantera: false, jugadores: 13, foto: ruta("baloncesto-equipo-2") },
      { categoria: "infantil", sexo: "Mixto", cantera: true, jugadores: 24, foto: ruta("baloncesto-portada") },
    ],
  },
  balonmano: {
    tipo: "pabellon", deporte: "Balonmano", equiposCantera: 7, socios: 260, cantera: 120, grada: 350, publico: 150,
    fotos: fotosDe("balonmano"),
    equipos: [
      { categoria: "senior", sexo: "Masculino", cantera: false, jugadores: 16, foto: ruta("balonmano-equipo-1") },
      { categoria: "juvenil", sexo: "Femenino", cantera: true, jugadores: 15, foto: ruta("balonmano-equipo-2") },
      { categoria: "cadete", sexo: "Masculino", cantera: true, jugadores: 16, foto: ruta("balonmano-portada") },
    ],
  },
  voleibol: {
    tipo: "pabellon", deporte: "Voleibol", equiposCantera: 6, socios: 220, cantera: 110, grada: 300, publico: 120,
    fotos: fotosDe("voleibol"),
    equipos: [
      { categoria: "senior", sexo: "Femenino", cantera: false, jugadores: 13, foto: ruta("voleibol-equipo-1") },
      { categoria: "senior", sexo: "Masculino", cantera: false, jugadores: 12, foto: ruta("voleibol-equipo-2") },
      { categoria: "infantil", sexo: "Femenino", cantera: true, jugadores: 18, foto: ruta("voleibol-portada") },
    ],
  },
  futbol: {
    tipo: "campo", deporte: "Fútbol", equiposCantera: 11, socios: 450, cantera: 230, grada: 800, publico: 350,
    fotos: fotosDe("futbol"),
    equipos: [
      { categoria: "senior", sexo: "Masculino", cantera: false, jugadores: 22, foto: ruta("futbol-portada") },
      { categoria: "juvenil", sexo: "Masculino", cantera: true, jugadores: 20, foto: ruta("futbol-equipo-1") },
      { categoria: "cadete", sexo: "Masculino", cantera: true, jugadores: 20, foto: ruta("futbol-equipo-2") },
    ],
  },
  futbolSala: {
    tipo: "pabellon", deporte: "Fútbol sala", equiposCantera: 7, socios: 240, cantera: 120, grada: 350, publico: 160,
    fotos: fotosDe("futbolSala"),
    equipos: [
      { categoria: "senior", sexo: "Masculino", cantera: false, jugadores: 14, foto: ruta("futbolSala-equipo-1") },
      { categoria: "infantil", sexo: "Femenino", cantera: true, jugadores: 14, foto: ruta("futbolSala-equipo-2") },
      { categoria: "juvenil", sexo: "Masculino", cantera: true, jugadores: 15, foto: ruta("futbolSala-portada") },
    ],
  },
  airsoft: {
    tipo: "airsoft", deporte: "Airsoft", socios: 85, cantera: 0,
    fotos: fotosDe("airsoft"),
    equipos: [
      { categoria: "speedsoft", sexo: "Mixto", cantera: false, jugadores: 10, foto: ruta("airsoft-equipo-1") },
      { categoria: "partidas", sexo: "Mixto", cantera: false, jugadores: 85, foto: ruta("airsoft-equipo-2") },
    ],
  },
  tenisMesa: raqueta("Tenis de mesa", 8, 120, 40, 12, fotosDe("tenisMesa"), [ruta("tenisMesa-2"), ruta("tenisMesa-portada"), ruta("tenisMesa-1")]),
  voleyPlaya: deEquipo("Vóley playa", "campo", { socios: 140, cantera: 60, grada: 200, publico: 90, equiposCantera: 4 }, "infantil", fotosDe("voleyPlaya"), true, [ruta("voleyPlaya-1"), ruta("voleyPlaya-2"), ruta("voleyPlaya-portada")]),
  rugby: deEquipo("Rugby", "campo", { socios: 280, cantera: 130, grada: 500, publico: 200, equiposCantera: 6 }, "infantil", fotosDe("rugby"), true, [ruta("rugby-portada"), ruta("rugby-equipo-cantera"), ruta("rugby-1")]),
  hockeyHierba: deEquipo("Hockey hierba", "campo", { socios: 230, cantera: 120, grada: 300, publico: 120, equiposCantera: 6 }, "infantil", fotosDe("hockeyHierba"), true, undefined, { categoria: "juvenil", sexo: "Masculino", cantera: true }),
  hockeyPatines: deEquipo("Hockey patines", "pabellon", { socios: 200, cantera: 90, grada: 400, publico: 180, equiposCantera: 5 }, "infantil", fotosDe("hockeyPatines"), false, [ruta("hockeyPatines-portada"), ruta("hockeyPatines-2"), ruta("hockeyPatines-1")], { categoria: "juvenil", sexo: "Masculino", cantera: true }),
  waterpolo: deEquipo("Waterpolo", "pabellon", { socios: 190, cantera: 80, grada: 250, publico: 100, equiposCantera: 5 }, "infantil", fotosDe("waterpolo"), true, undefined, { categoria: "juvenil", sexo: "Masculino", cantera: true }),
  atletismo: individual("Atletismo", 260, 150, 45, fotosDe("atletismo")),
  natacion: individual("Natación", 320, 180, 40, fotosDe("natacion")),
  ciclismo: individual("Ciclismo", 180, 40, 25, fotosDe("ciclismo")),
  triatlon: individual("Triatlón", 150, 35, 30, fotosDe("triatlon")),
  gimnasia: individual("Gimnasia", 210, 160, 30, fotosDe("gimnasia")),
  patinaje: individual("Patinaje", 170, 120, 25, fotosDe("patinaje")),
  artesMarciales: individual("Artes marciales", 230, 140, 35, fotosDe("artesMarciales")),
  running: {
    tipo: "running", deporte: "Running", instalacionesPropias: true, socios: 210, cantera: 0,
    fotos: fotosDe("running"),
    equipos: [
      { grupo: 1, categoria: "", sexo: "Mixto", cantera: false, jugadores: 30, foto: ruta("running-2") },
      { grupo: 2, categoria: "", sexo: "Mixto", cantera: false, jugadores: 210, foto: ruta("running-1") },
    ],
  },
  paintball: {
    tipo: "paintball", deporte: "Paintball", instalacionesPropias: true, socios: 70, cantera: 0,
    fotos: fotosDe("paintball"),
    equipos: [
      { categoria: "speedball", sexo: "Mixto", cantera: false, jugadores: 10, foto: ruta("paintball-2") },
      { categoria: "partidas", sexo: "Mixto", cantera: false, jugadores: 70, foto: ruta("paintball-1") },
    ],
  },
};

export function generateStaticParams() {
  return DEPORTES_CON_EJEMPLO.map((deporte) => ({ deporte }));
}

export default async function PaginaDeEjemplo({ params }: { params: Promise<{ locale: AppLocale; deporte: string }> }) {
  const { locale, deporte } = await params;
  if (!tieneEjemplo(deporte)) notFound();
  const datos = EJEMPLOS[deporte as keyof typeof EJEMPLOS];
  const esRaqueta = datos.tipo === "raqueta";
  const esAirsoft = datos.tipo === "airsoft";
  const t = await getTranslations("club.ejemplo");
  const tIdeas = await getTranslations("ideas");
  const tDeporte = await getTranslations("common.etiquetas.deporte");
  const nombreDeporte = tDeporte(deporte);
  const grupos = await getTranslations("panel.perfil");
  const nombresGrupos = grupos.raw("gruposRaqueta") as { etiqueta: string; cantera: boolean }[];
  const textos = TEXTOS[datos.tipo];
  const hitos = t.raw(textos.hitos) as { year: number; text: string }[];
  // "Sénior Masculino", o "Escuela" en raqueta (que no van por sexo).
  const nombreDeCategoria = (equipo: EquipoDeEjemplo) =>
    equipo.grupo !== undefined ? (nombresGrupos[equipo.grupo]?.etiqueta ?? "") : t(`categorias.${equipo.categoria}`);
  const ahora = "2026-11-26T00:00:00Z";

  const perfil = clubRowToProfile({
    id: `ejemplo-${deporte}`,
    slug: `ejemplo-${deporte}`,
    name: t("nombreClub", { deporte: nombreDeporte }),
    city: t("ciudad"),
    province: null,
    postal_code: null,
    latitude: null,
    longitude: null,
    facilities: datos.instalacionesPropias
      ? t(`instalacionesDe.${deporte}`, { grada: datos.grada ?? 0 })
      : esRaqueta
        ? t("instalaciones", { pistas: datos.pistas ?? 0 })
        : esAirsoft
          ? t("instalacionesAirsoft")
          : t(datos.tipo === "campo" ? "instalacionesCampo" : "instalacionesPabellon", { grada: datos.grada ?? 0 }),
    website: null,
    social_links: {},
    description: t(textos.descripcion, {
      deporte: nombreDeporte.toLowerCase(),
      socios: datos.socios,
      escuela: datos.cantera,
      cantera: datos.cantera,
    }),
    logo_url: `/ejemplos-club/escudo-${deporte}.png`,
    cover_url: datos.fotos.portada,
    cover_position: 45,
    photo_urls: datos.fotos.galeria,
    milestones: hitos.map((hito) => ({ ...hito, photoUrl: null, videoUrl: null })),
    estimated_reach: datos.socios * 12,
    video_url: null,
    contact_name: null,
    contact_phone: null,
    verified: false,
    top_category: null,
    top_category_male: null,
    top_category_female: null,
    top_category_male_photo: null,
    top_category_female_photo: null,
    country: "ES",
    competitions: t(textos.competiciones),
    achievements: null,
    youth_teams_count: datos.equiposCantera ?? (datos.equipos.filter((uno) => uno.cantera).length || null),
    youth_players_count: datos.cantera || null,
    youth_families_count: datos.cantera || null,
    members_count: datos.socios,
    founding_year: hitos[0]?.year ?? null,
    average_attendance: datos.publico ?? null,
    created_at: ahora,
    updated_at: ahora,
  } as unknown as ClubRow);

  const equipos: ClubTeam[] = datos.equipos.map((uno, indice) => ({
    id: `equipo-${indice}`,
    clubId: perfil.id,
    sport: datos.deporte,
    category: nombreDeCategoria(uno),
    gender: uno.sexo,
    teamLevel: uno.cantera ? "cantera" : "primer_equipo",
    playerCount: uno.jugadores,
    photoUrl: uno.foto,
    competitionLevel: null,
    achievements: null,
  }));

  // Lo que puede ofrecer un club así, para que el generador no proponga
  // nada que no tenga (sin cantera no hay ideas de cantera).
  const requisitos = new Set<RequisitoIdea>(["equipos", "instalaciones"]);
  if (datos.cantera > 0) requisitos.add("cantera");
  if (datos.publico) requisitos.add("publico");

  // Las mismas que le saldrían a un club así al pulsar "Generar mis
  // oportunidades": en raqueta, sus ideas; en el resto, la mezcla, que
  // ya pone primero las de su deporte (speedsoft en airsoft).
  const propuestas = generarPropuestas({
    perfil: { topCategoryMalePhoto: null, topCategoryFemalePhoto: null },
    equipos,
    requisitos,
    existentes: [],
    tIdeas: (clave) => tIdeas(clave),
    nombreDelEquipo: (uno) => (uno.gender === "Mixto" ? (uno.category ?? "") : `${uno.category} ${grupos(`sexo.${uno.gender}`)}`),
    lineaDeDatos: null,
    eleccion: esRaqueta ? "raqueta" : datos.tipo === "individual" ? "individual" : "mezcla",
  });
  const oportunidades: Opportunity[] = propuestas
    .filter((propuesta) => !propuesta.esNecesidad)
    .map((propuesta, indice) => ({
      id: `ejemplo-${indice}`,
      clubId: perfil.id,
      title: propuesta.title,
      description: propuesta.description,
      opportunityType: propuesta.opportunityType,
      status: "available",
      value: 0,
      duration: propuesta.duration,
      period: propuesta.period,
      collaborationType: propuesta.collaborationType,
      objectives: [],
      sponsorLevel: "colaborador",
      exclusivity: null,
      teamId: propuesta.teamId,
      slotsTotal: null,
      slotsTaken: 0,
      esNecesidad: false,
      categoriaNecesidad: null,
      fotos: [],
      beneficios: [],
      acciones: [],
      frecuencia: null,
      desde: null,
      hasta: null,
      requisitos: null,
      ideaId: propuesta.ideaId,
    }) as unknown as Opportunity);

  return (
    <>
      <div role="note" className="sticky top-0 z-40 border-b border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-950 shadow-sm print:hidden">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-x-4 gap-y-2">
          <p>
            <span className="font-bold">{t("aviso", { deporte: nombreDeporte.toLowerCase() })}</span>{" "}
            {t("avisoTexto")}
          </p>
          <Link
            href="/panel"
            className="rounded-lg bg-accion px-3.5 py-2 text-xs font-bold text-sobre-color shadow-sm hover:bg-accion-fuerte"
          >
            {t("crearLaMia")} →
          </Link>
        </div>
      </div>
      {/* `inert`: se ve, pero no se puede pulsar nada. */}
      <div inert>
        <FichaDelClub locale={locale} datos={{ perfil, equipos, patrocinadores: [], oportunidades }} vistaPrevia />
      </div>
    </>
  );
}
