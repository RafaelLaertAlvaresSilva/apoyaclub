import type {
  BudgetPeriod,
  CollaborationType,
  ObjectiveTag,
  OpportunityStatus,
  OpportunityType,
  SponsorLevel,
} from "@/lib/types";

/**
 * Constantes, plantillas y helpers compartidos por el panel del club
 * (creación y catálogo de oportunidades) y por la página pública del
 * club, donde se muestran las oportunidades disponibles (Fase 6).
 */

export const TIPOS_OPORTUNIDAD: { id: OpportunityType; etiqueta: string }[] = [
  { id: "equipment", etiqueta: "Equipación" },
  { id: "venue_matches", etiqueta: "Pabellón y partidos" },
  { id: "social_content", etiqueta: "Redes y contenido" },
  { id: "events_tournaments", etiqueta: "Eventos y torneos" },
  { id: "youth", etiqueta: "Cantera" },
  { id: "in_kind", etiqueta: "Servicios en especie" },
];

export const ETIQUETA_TIPO_OPORTUNIDAD: Record<OpportunityType, string> = TIPOS_OPORTUNIDAD.reduce(
  (acumulado, tipo) => ({ ...acumulado, [tipo.id]: tipo.etiqueta }),
  {} as Record<OpportunityType, string>,
);

export const ESTADOS_OPORTUNIDAD: { id: OpportunityStatus; etiqueta: string }[] = [
  { id: "available", etiqueta: "Disponible" },
  { id: "reserved", etiqueta: "Reservada" },
  { id: "closed", etiqueta: "Cerrada" },
];

export const ETIQUETA_ESTADO_OPORTUNIDAD: Record<OpportunityStatus, string> = ESTADOS_OPORTUNIDAD.reduce(
  (acumulado, estado) => ({ ...acumulado, [estado.id]: estado.etiqueta }),
  {} as Record<OpportunityStatus, string>,
);

// ---------------------------------------------------------------------
// Nivel de patrocinador y exclusividad
// ---------------------------------------------------------------------

export const NIVELES_PATROCINIO: { id: SponsorLevel; etiqueta: string; ayuda: string }[] = [
  {
    id: "principal",
    etiqueta: "Patrocinador principal",
    ayuda: "El patrocinio de mayor visibilidad del club.",
  },
  {
    id: "oficial",
    etiqueta: "Patrocinador oficial",
    ayuda: "Patrocinador destacado, normalmente en exclusiva dentro de su sector.",
  },
  {
    id: "colaborador",
    etiqueta: "Colaborador",
    ayuda: "Colaboración de menor tamaño, sin exclusividad.",
  },
  { id: "libre", etiqueta: "Sin categoría", ayuda: "No encaja en ninguno de los niveles anteriores." },
];

export const ETIQUETA_NIVEL_PATROCINIO: Record<SponsorLevel, string> = NIVELES_PATROCINIO.reduce(
  (acumulado, nivel) => ({ ...acumulado, [nivel.id]: nivel.etiqueta }),
  {} as Record<SponsorLevel, string>,
);

/** Colores de la etiqueta de nivel, del más destacado al más discreto. */
export const CLASES_NIVEL_PATROCINIO: Record<SponsorLevel, string> = {
  principal: "bg-brand-navy text-white",
  oficial: "bg-brand-teal-light text-brand-teal-dark",
  colaborador: "bg-zinc-100 text-zinc-700",
  libre: "bg-zinc-100 text-zinc-500",
};

/** Descripción corta de un equipo asociado, para mostrarla en una tarjeta. */
export function etiquetaEquipo(partes: {
  sport?: string | null;
  category?: string | null;
  gender?: string | null;
}): string | null {
  const texto = [partes.sport, partes.category, partes.gender]
    .map((parte) => parte?.trim())
    .filter((parte): parte is string => !!parte)
    .join(" · ");
  return texto || null;
}

// ---------------------------------------------------------------------
// Fase 7: buscador (forma de colaboración, objetivo y periodo)
// ---------------------------------------------------------------------

export const FORMAS_COLABORACION: { id: CollaborationType; etiqueta: string }[] = [
  { id: "money", etiqueta: "Dinero" },
  { id: "product", etiqueta: "Producto" },
  { id: "service", etiqueta: "Servicio" },
  { id: "mixed", etiqueta: "Mixta" },
];

export const ETIQUETA_FORMA_COLABORACION: Record<CollaborationType, string> =
  FORMAS_COLABORACION.reduce(
    (acumulado, forma) => ({ ...acumulado, [forma.id]: forma.etiqueta }),
    {} as Record<CollaborationType, string>,
  );

export const PERIODOS_OPORTUNIDAD: { id: BudgetPeriod; etiqueta: string }[] = [
  { id: "match", etiqueta: "Por partido" },
  { id: "month", etiqueta: "Por mes" },
  { id: "season", etiqueta: "Por temporada" },
  { id: "event", etiqueta: "Por evento" },
];

export const ETIQUETA_PERIODO: Record<BudgetPeriod, string> = PERIODOS_OPORTUNIDAD.reduce(
  (acumulado, periodo) => ({ ...acumulado, [periodo.id]: periodo.etiqueta }),
  {} as Record<BudgetPeriod, string>,
);

export const OBJETIVOS_OPORTUNIDAD: { id: ObjectiveTag; etiqueta: string }[] = [
  { id: "familias", etiqueta: "Familias" },
  { id: "jovenes", etiqueta: "Jóvenes" },
  { id: "comunidad_local", etiqueta: "Comunidad local" },
  { id: "deporte_femenino", etiqueta: "Deporte femenino" },
  { id: "deporte_base", etiqueta: "Deporte base" },
  { id: "visibilidad", etiqueta: "Visibilidad de marca" },
  { id: "contenido", etiqueta: "Contenido" },
  { id: "clientes", etiqueta: "Captación de clientes" },
  { id: "empleados", etiqueta: "Empleados" },
  { id: "rsc", etiqueta: "RSC" },
];

export const ETIQUETA_OBJETIVO: Record<ObjectiveTag, string> = OBJETIVOS_OPORTUNIDAD.reduce(
  (acumulado, objetivo) => ({ ...acumulado, [objetivo.id]: objetivo.etiqueta }),
  {} as Record<ObjectiveTag, string>,
);

export const formatoValorOportunidad = new Intl.NumberFormat("es-ES", {
  style: "currency",
  currency: "EUR",
  maximumFractionDigits: 2,
});

/**
 * Plantillas rápidas para no partir de cero al crear una oportunidad,
 * agrupadas por tipo. Solo rellenan título y descripción: el valor lo
 * decide siempre el club, así que las plantillas nunca sugieren un
 * precio ni un rango.
 */
export type PlantillaOportunidad = {
  title: string;
  description: string;
};

export const PLANTILLAS_OPORTUNIDAD: Record<OpportunityType, PlantillaOportunidad[]> = {
  equipment: [
    {
      title: "Patrocinador de la camiseta principal",
      description:
        "Tu logo en la parte delantera de la camiseta del primer equipo durante toda la temporada.",
    },
    {
      title: "Camiseta de entrenamiento de la cantera",
      description: "Tu marca en las camisetas de entrenamiento de uno o varios equipos de cantera.",
    },
    {
      title: "Patrocinador del chándal o la bolsa de deporte",
      description: "Tu logo en el chándal, la bolsa o la equipación de calle del equipo.",
    },
  ],
  venue_matches: [
    {
      title: "Patrocinio del descanso de los partidos de casa",
      description:
        "Mención y presencia de tu marca durante el descanso de cada partido que el club juega en casa.",
    },
    {
      title: "Naming del pabellón o campo",
      description: "Tu marca en el nombre del recinto deportivo del club durante la temporada.",
    },
    {
      title: "Publicidad estática en el terreno de juego",
      description: "Una valla o lona con tu marca visible durante los partidos de casa.",
    },
  ],
  social_content: [
    {
      title: "Marca patrocinadora en redes sociales",
      description: "Menciones y tu logo en las publicaciones del club durante toda la temporada.",
    },
    {
      title: "Vídeo o reel patrocinado",
      description: "Una pieza de contenido en redes dedicada a presentar tu marca a la comunidad del club.",
    },
  ],
  events_tournaments: [
    {
      title: "Patrocinador oficial de un torneo",
      description: "Tu marca asociada a un torneo o evento puntual organizado por el club.",
    },
    {
      title: "Photocall con tu marca en la presentación de la temporada",
      description: "Presencia de tu marca en el evento de presentación de equipos ante la afición.",
    },
  ],
  youth: [
    {
      title: "Equipación de un equipo de cantera",
      description: "Patrocinio íntegro de un equipo de las categorías inferiores del club.",
    },
    {
      title: "Beca deportiva para familias de la cantera",
      description: "Ayuda a que una familia pueda mantener a su hijo o hija en el club durante la temporada.",
    },
  ],
  in_kind: [
    {
      title: "Colaboración en especie con material deportivo",
      description: "Aportación de material, equipación o productos en lugar de una aportación económica.",
    },
    {
      title: "Servicios profesionales para el club",
      description:
        "Un servicio (fisioterapia, transporte, catering, imprenta…) a cambio de visibilidad para tu marca.",
    },
  ],
};

/**
 * ¿Esta oportunidad se reparte entre varias empresas? (migración 0017).
 * Una plaza sola no es un reparto: es una oportunidad normal.
 */
export function esPorPlazas(oportunidad: { slotsTotal: number | null }): boolean {
  return (oportunidad.slotsTotal ?? 0) >= 2;
}

/** Plazas que quedan libres, nunca negativas. */
export function plazasLibres(oportunidad: { slotsTotal: number | null; slotsTaken: number }): number {
  if (!esPorPlazas(oportunidad)) return 0;
  return Math.max((oportunidad.slotsTotal ?? 0) - oportunidad.slotsTaken, 0);
}

/** Aportación total que busca el club: lo que pone cada empresa por el número de plazas. */
export function valorTotalDeLasPlazas(oportunidad: {
  slotsTotal: number | null;
  value: number;
}): number {
  return (oportunidad.slotsTotal ?? 1) * oportunidad.value;
}
