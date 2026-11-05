import {
  buscarIdea,
  categoriasDeDeporteDelClub,
  categoriasDelClub,
  deportesDeLosEquipos,
  descripcionDeLaIdea,
  ideasDeCategoria,
  type CategoriaIdea,
  textosDeLaIdea,
  type Idea,
  type RequisitoIdea,
  type TraducirIdeas,
} from "@/lib/catalogo-ideas";
import type {
  BudgetPeriod,
  CategoriaNecesidad,
  ClubProfile,
  ClubTeam,
  CollaborationType,
  Opportunity,
  OpportunityType,
} from "@/lib/types";

/**
 * "Generar mis oportunidades" (pedido por Rafael el 5-11-2026).
 *
 * Rellenar oportunidades una a una cuesta, y un club que llega nuevo no
 * sabe qué ofrecer. Esto le propone de golpe un puñado, sacadas del
 * catálogo de ideas (`lib/catalogo-ideas.ts`) y escritas con sus datos
 * reales. El club solo revisa, pone precio si quiere y publica.
 *
 * Reglas:
 *   - Solo ideas que el club puede cumplir con lo que tiene en su ficha
 *     (las mismas condiciones que el catálogo). Nada inventado.
 *   - Las de un equipo, con su equipo principal en el título y su foto.
 *   - Al final, una línea con las cifras del club (las de la portada del
 *     dossier), que es lo que hace que no parezca un texto genérico.
 *   - SIN PRECIO. Decidido por Rafael: primero sin precio (sale "precio a
 *     convenir" si el club no pone ninguno) y, cuando haya más de 20
 *     clubes con oportunidades generadas, un precio de referencia sacado
 *     de lo que han puesto otros clubes. Por eso cada una guarda de qué
 *     idea sale (`idea_id`, migración 0059).
 *   - Nunca se publica nada solo: el club ve todas y elige.
 *   - No repite lo que el club ya tiene.
 *   - El club elige de qué categoría (camiseta, redes, cantera…) o "un
 *     poco de todo", que es la mezcla de `IDEAS_DEL_GENERADOR`.
 */

/** Lo que se le pregunta al club: una categoría del catálogo, o la mezcla. */
export type EleccionDelGenerador = CategoriaIdea | "mezcla";

/**
 * Las ideas que se proponen, por orden de preferencia: un poco de todo
 * (camiseta, redes, pabellón, cantera, algo con las familias) y de
 * precios distintos, para que haya algo para cada empresa.
 */
export const IDEAS_DEL_GENERADOR = [
  "equipacion-pecho",
  "equipo-empresa-del-mes",
  "intervalo-patrocinador-del-descanso",
  "instalaciones-lona",
  "redes-publicaciones-semanales",
  "cantera-patrocinador",
  "jugadores-visita-a-empresa",
  "familias-descuento",
  // De reserva, por si falta algo de lo de arriba.
  "equipo-patrocinador-de-partido",
  "equipo-empresa-oficial",
  "digital-empresa-recomendada",
  "local-escaparate",
  "eventos-dia-del-club",
] as const;

/** Lo que el club necesita: se proponen sin marcar. */
export const NECESIDADES_DEL_GENERADOR = ["necesita-material", "necesita-fisioterapia"] as const;

/** Cuántas ofertas como mucho: más, y el club ya no las revisa. */
export const MAXIMO_DE_PROPUESTAS = 8;

/** Ideas que van con un equipo concreto. */
const CATEGORIAS_DE_EQUIPO = new Set(["equipos", "equipaciones", "jugadores", "intervalo", "speedsoft"]);

/** En "un poco de todo", cuántas de su deporte van delante, si tiene. */
const DE_SU_DEPORTE_EN_LA_MEZCLA = 4;

/**
 * Las de esas categorías que son de todo el club y no de un equipo:
 * "Mochilas y bolsas del club · Senior Masculino" no tiene sentido.
 */
const DE_TODO_EL_CLUB = new Set([
  "speedsoft-carpa",
  "speedsoft-bandera",
  "speedsoft-videos-pov",
  "speedsoft-prueba-de-material",
  "speedsoft-team-building",
  "speedsoft-material-de-juego",
  "equipo-empresa-oficial",
  "equipacion-chandal",
  "equipacion-mochilas",
  "equipacion-presentacion",
]);

export type Propuesta = {
  ideaId: string;
  title: string;
  description: string;
  duration: string;
  opportunityType: OpportunityType;
  period: BudgetPeriod | null;
  collaborationType: CollaborationType;
  esNecesidad: boolean;
  categoriaNecesidad: CategoriaNecesidad | null;
  teamId: string | null;
  fotos: string[];
  /** Si sale marcada para publicar. Las necesidades, no. */
  marcada: boolean;
};

/** El equipo principal: el primer equipo, masculino antes que femenino si hay los dos. */
export function equipoPrincipal(equipos: ClubTeam[]): ClubTeam | null {
  const primeros = equipos.filter((equipo) => equipo.teamLevel === "primer_equipo");
  const lista = primeros.length > 0 ? primeros : equipos;
  return lista.find((equipo) => equipo.gender === "Masculino") ?? lista[0] ?? null;
}

/** La foto de un equipo: la suya, o la del primer equipo de su sexo. */
function fotoDelEquipo(
  equipo: ClubTeam,
  perfil: Pick<ClubProfile, "topCategoryMalePhoto" | "topCategoryFemalePhoto">,
): string | null {
  if (equipo.photoUrl) return equipo.photoUrl;
  if (equipo.teamLevel !== "primer_equipo") return null;
  if (equipo.gender === "Femenino") return perfil.topCategoryFemalePhoto;
  return perfil.topCategoryMalePhoto;
}

/** Para comparar títulos sin que importen mayúsculas, tildes ni espacios. */
function normalizar(texto: string): string {
  return texto
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

export function generarPropuestas({
  perfil,
  equipos,
  requisitos,
  existentes,
  tIdeas,
  nombreDelEquipo,
  lineaDeDatos,
  eleccion = "mezcla",
}: {
  perfil: Pick<ClubProfile, "topCategoryMalePhoto" | "topCategoryFemalePhoto">;
  equipos: ClubTeam[];
  requisitos: Set<RequisitoIdea>;
  /** Lo que el club ya tiene, para no repetirlo. */
  existentes: (Pick<Opportunity, "title" | "ideaId"> & Partial<Pick<Opportunity, "esNecesidad" | "categoriaNecesidad">>)[];
  tIdeas: TraducirIdeas;
  /** "Senior Masculino": cómo se llama un equipo en el título. */
  nombreDelEquipo: (equipo: ClubTeam) => string;
  /** "Datos del club: unas 200 personas por partido…", o null si no hay cifras. */
  lineaDeDatos: string | null;
  eleccion?: EleccionDelGenerador;
}): Propuesta[] {
  const ideasYaUsadas = new Set(existentes.map((una) => una.ideaId).filter(Boolean));
  const titulosYaUsados = existentes.map((una) => normalizar(una.title));
  // Lo que ya pide, por lo que pide y no por cómo lo ha titulado:
  // "Buscamos servicio de Fisioterapia" es la misma que "Fisioterapeuta
  // para el equipo".
  const necesidadesYaPedidas = new Set(
    existentes.filter((una) => una.esNecesidad && una.categoriaNecesidad).map((una) => una.categoriaNecesidad),
  );
  const principal = equipoPrincipal(equipos);

  const puede = (idea: Idea) => (idea.requiere ?? []).every((requisito) => requisitos.has(requisito));
  const yaLaTiene = (idea: Idea) =>
    ideasYaUsadas.has(idea.id) ||
    (!!idea.esNecesidad && !!idea.categoriaNecesidad && necesidadesYaPedidas.has(idea.categoriaNecesidad)) ||
    titulosYaUsados.some((titulo) => titulo.startsWith(normalizar(textosDeLaIdea(idea, tIdeas).titulo)));

  const construir = (idea: Idea, marcada: boolean): Propuesta => {
    const textos = textosDeLaIdea(idea, tIdeas);
    const conEquipo =
      CATEGORIAS_DE_EQUIPO.has(idea.categoria) && !DE_TODO_EL_CLUB.has(idea.id) && principal && !idea.esNecesidad;
    const foto = conEquipo ? fotoDelEquipo(principal, perfil) : null;
    const descripcion = [descripcionDeLaIdea(idea, tIdeas), idea.esNecesidad ? null : lineaDeDatos]
      .filter(Boolean)
      .join("\n\n");

    return {
      ideaId: idea.id,
      title: conEquipo ? `${textos.titulo} · ${nombreDelEquipo(principal)}` : textos.titulo,
      description: descripcion,
      duration: textos.duracion,
      opportunityType: idea.tipo,
      period: idea.periodo,
      collaborationType: idea.colaboracion,
      esNecesidad: !!idea.esNecesidad,
      categoriaNecesidad: idea.categoriaNecesidad ?? null,
      teamId: conEquipo ? principal.id : null,
      fotos: foto ? [foto] : [],
      marcada,
    };
  };

  const elegir = (ids: readonly string[]) =>
    ids
      .map((id) => buscarIdea(id))
      .filter((idea): idea is Idea => idea !== null && puede(idea) && !yaLaTiene(idea));

  if (eleccion !== "mezcla") {
    // Una categoría: todas las suyas que el club puede ofrecer. En "Lo
    // que necesitas" salen marcadas, que es justo lo que ha pedido ver.
    return elegir(ideasDeCategoria(eleccion).map((idea) => idea.id))
      .slice(0, MAXIMO_DE_PROPUESTAS)
      .map((idea) => construir(idea, true));
  }

  // Un club de un deporte con ideas propias (speedsoft, running) ve
  // primero unas cuantas de las suyas y luego las de todos.
  const deSuDeporte = categoriasDeDeporteDelClub(deportesDeLosEquipos(equipos))
    .flatMap((categoria) => elegir(ideasDeCategoria(categoria).map((idea) => idea.id)))
    .slice(0, DE_SU_DEPORTE_EN_LA_MEZCLA);

  return [
    ...[...deSuDeporte, ...elegir(IDEAS_DEL_GENERADOR)]
      .slice(0, MAXIMO_DE_PROPUESTAS)
      .map((idea) => construir(idea, true)),
    ...elegir(NECESIDADES_DEL_GENERADOR).map((idea) => construir(idea, false)),
  ];
}

/**
 * Las categorías que se le ofrecen a un club: primero las de su deporte
 * (solo si tiene un equipo de ese deporte), luego las de todos.
 */
export function categoriasDelGenerador(equipos: Pick<ClubTeam, "sport">[]): CategoriaIdea[] {
  return categoriasDelClub(deportesDeLosEquipos(equipos));
}
