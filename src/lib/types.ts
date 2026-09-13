export type Role = "club" | "empresa" | "admin";

export const RUTA_POR_ROL: Record<Role, string> = {
  club: "/panel",
  // ApoyaClub ya no tiene cuentas de empresa (migración 0034): las que
  // quedaran de antes no tienen panel al que ir, así que a la portada.
  empresa: "/",
  // Fase 12: panel de administración interno.
  admin: "/admin",
};

// ---------------------------------------------------------------------
// Fase 4: perfil del club
// ---------------------------------------------------------------------

/** Enlaces a redes sociales del club. Todas las claves son opcionales. */
export type SocialLinks = {
  instagram?: string;
  facebook?: string;
  twitter?: string;
  tiktok?: string;
  youtube?: string;
};

/** Un hito de la historia del club (sección Historia). */
export type Milestone = {
  year: number;
  text: string;
  /** Foto del hito (subida al almacén del club). Opcional. */
  photoUrl?: string | null;
  /** Enlace a un vídeo del hito: YouTube, Vimeo o cualquier otro. */
  videoUrl?: string | null;
};

/** Seguidores por red social (sección Audiencia). Solo números. */
export type FollowersByNetwork = {
  instagram?: number;
  facebook?: number;
  twitter?: number;
  tiktok?: number;
  youtube?: number;
};

/** Una acción social, educativa o benéfica (sección Comunidad). */
export type CommunityAction = {
  title: string;
  description: string;
  /** Foto de la acción. Opcional (migración 0036). */
  photo?: string;
};

/** Fila de la tabla `clubs`: el perfil completo de un club. */
export type ClubProfile = {
  id: string;

  /** Identificador único en la URL pública (`/club/[slug]`). Se asigna
   * solo una vez, en la base de datos, al crear el club. */
  slug: string;

  // Identidad
  name: string;
  city: string;
  province: string | null;
  postalCode: string | null;
  /** Coordenadas aproximadas (Fase 7), calculadas automáticamente a
   * partir de ciudad/provincia/código postal. Null si el club no se ha
   * podido geocodificar todavía. */
  latitude: number | null;
  longitude: number | null;
  facilities: string | null;
  /** Dónde juega el club (migración 0025). */
  facilitiesAddress: string | null;
  /** Fotos de las instalaciones, aparte de la galería del club. */
  facilitiesPhotos: string[];
  website: string | null;
  socialLinks: SocialLinks;
  description: string | null;
  logoUrl: string | null;
  /** Imagen de cabecera de la ficha, de lado a lado (migración 0025). */
  coverUrl: string | null;
  /** Altura del recorte de la portada, en porcentaje: 0 arriba, 100 abajo. */
  coverPosition: number;
  photoUrls: string[];
  videoUrl: string | null;

  // Contacto público (Fase 5): solo se muestran en la página pública si
  // `contactPublicConsent` es true (la vista pública ya se encarga de
  // ocultar `contactName`/`contactPhone` cuando no hay autorización).
  contactName: string | null;
  contactPhone: string | null;
  /** Correo que el club publica. Si es null se usa el de su cuenta. */
  contactEmail: string | null;
  /** Cuándo atiende el club. Texto libre: "L-V de 17 a 21 h". */
  contactHours: string | null;
  contactPublicConsent: boolean;

  // Fase 12: insignia pública de "verificado", la decide un admin.
  verified: boolean;

  // Nivel deportivo
  /**
   * Resumen de las dos siguientes, lo escribe el panel. Es lo que ven
   * el dossier y la puntuación del perfil, que existían antes de que la
   * categoría se separara por sexo (migración 0035).
   */
  topCategory: string | null;
  topCategoryMale: string | null;
  topCategoryFemale: string | null;
  /** Foto del equipo de máxima categoría de cada sexo (migración 0036). */
  topCategoryMalePhoto: string | null;
  topCategoryFemalePhoto: string | null;
  competitions: string | null;
  achievements: string | null;

  // Cantera (datos agregados)
  youthTeamsCount: number | null;
  youthPlayersCount: number | null;
  youthFamiliesCount: number | null;
  /** Socios del club (migración 0042). Nunca se suma con jugadores ni
   * familias: son conjuntos que se solapan. */
  membersCount: number | null;

  // Historia
  foundingYear: number | null;
  milestones: Milestone[];

  // Audiencia
  followersByNetwork: FollowersByNetwork;
  estimatedReach: number | null;
  averageAttendance: number | null;

  // Comunidad
  communityActions: CommunityAction[];

  /**
   * Porcentaje de ficha rellenada (0-100). Lo calcula la base de datos
   * (`clubs.profile_score`, migración 0020) y es también lo que usa el
   * buscador para ordenar: cuanta más información, más visibilidad.
   */
  profileScore: number;

  createdAt: string;
  updatedAt: string;
};

export type TeamLevel = "primer_equipo" | "cantera";

/** Fila de la tabla `club_teams`. */
export type ClubTeam = {
  id: string;
  clubId: string;
  sport: string;
  category: string | null;
  gender: string | null;
  teamLevel: TeamLevel;
  playerCount: number | null;
  /** Foto del equipo (migración 0036). La sube el club. */
  photoUrl: string | null;
  /** En qué compite este equipo: "Primera Autonómica", "Liga comarcal"
   * (migración 0038). La categoría —cadete, sénior— va en `category`. */
  competitionLevel: string | null;
  /** Logros de este equipo concreto (migración 0038). Los del club
   * entero siguen en `ClubProfile.achievements`. */
  achievements: string | null;
};

/**
 * Categoría de un patrocinador actual del club (migración 0019). Los
 * tres primeros son el catálogo común con `opportunities.sponsorLevel`;
 * "otro" deja que el club use su propia nomenclatura.
 */
export type SponsorTier = "principal" | "oficial" | "colaborador" | "otro";

export const NIVELES_PATROCINADOR: SponsorTier[] = [
  "principal",
  "oficial",
  "colaborador",
  "otro",
];

/** Fila de la tabla `club_sponsors`. */
export type ClubSponsor = {
  id: string;
  clubId: string;
  name: string;
  logoUrl: string | null;
  website: string | null;
  tier: SponsorTier;
  /** Etiqueta propia del club cuando `tier` es "otro". Null en el resto. */
  tierLabel: string | null;
  /** Dos líneas sobre la colaboración, escritas por el club. */
  description: string | null;
  /** Año en que empezó a patrocinar. */
  sinceYear: number | null;
  sortOrder: number;
  /** Correo de la empresa, que aporta el club. Nunca se publica. */
  contactEmail: string | null;
  /** Cuándo se le mandó el agradecimiento. Solo se manda una vez. */
  notifiedAt: string | null;
};

/** Nombre que se enseña para la categoría de un patrocinador. */
export function etiquetaNivelPatrocinador(patrocinador: {
  tier: SponsorTier;
  tierLabel: string | null;
}): string {
  if (patrocinador.tier === "otro") return patrocinador.tierLabel ?? "Colaborador";
  const nombres: Record<Exclude<SponsorTier, "otro">, string> = {
    principal: "Patrocinador principal",
    oficial: "Patrocinador oficial",
    colaborador: "Colaborador",
  };
  return nombres[patrocinador.tier];
}

// ---------------------------------------------------------------------
// Fase 6: oportunidades de patrocinio
// ---------------------------------------------------------------------

// ---------------------------------------------------------------------
// Fase 7: buscador (filtros de las oportunidades)
// ---------------------------------------------------------------------

/** Forma de colaboración que ofrece la oportunidad. */
export type CollaborationType = "money" | "product" | "service" | "mixed";

/** A qué público u objetivo apela la oportunidad. Una oportunidad puede
 * tener varios (o ninguno todavía). */
export type ObjectiveTag =
  | "familias"
  | "jovenes"
  | "comunidad_local"
  | "deporte_femenino"
  | "deporte_masculino"
  | "deporte_base"
  | "visibilidad"
  | "contenido"
  | "clientes"
  | "empleados"
  | "rsc";

/** Periodo al que se refiere el valor de la oportunidad. Independiente
 * del texto libre de `duration`, que sigue existiendo tal cual. */
export type BudgetPeriod = "match" | "month" | "season" | "event";

export type OpportunityType =
  | "equipment"
  | "venue_matches"
  | "social_content"
  | "events_tournaments"
  | "youth"
  | "in_kind";

export type OpportunityStatus = "available" | "reserved" | "closed";

/**
 * Qué necesita el club, cuando la oportunidad va al revés de lo normal
 * (migración 0038). Es una lista cerrada y no texto libre para que un
 * fisioterapeuta pueda buscar "fisioterapia" y encontrarlas todas, en
 * vez de depender de cómo lo escribiera cada club.
 */
export type CategoriaNecesidad =
  | "fisioterapia"
  | "medico"
  | "fotografia"
  | "video"
  | "marketing"
  | "imprenta"
  | "transporte"
  | "material"
  | "equipacion"
  | "limpieza"
  | "restauracion"
  | "alojamiento"
  | "gimnasio"
  | "nutricion"
  | "asesoria"
  | "informatica"
  | "otro";

/**
 * Nivel de patrocinador de una oportunidad (Fase 2, implementado al
 * cerrar la auditoría de la Fase 15). Es la primera pregunta que se hace
 * una empresa: "¿esto es el patrocinio principal del club o una
 * colaboración pequeña?".
 *
 * - principal: el patrocinio de mayor visibilidad del club.
 * - oficial: patrocinador oficial, normalmente con exclusividad de sector.
 * - colaborador: colaboración de menor tamaño.
 * - libre: sin categoría (el valor por defecto y el de todo lo publicado
 *   antes de que existiera este campo).
 */
export type SponsorLevel = "principal" | "oficial" | "colaborador" | "libre";

/** Fila de la tabla `opportunities`: una oportunidad de patrocinio del club. */
export type Opportunity = {
  id: string;
  clubId: string;
  title: string;
  description: string | null;
  opportunityType: OpportunityType;
  status: OpportunityStatus;
  /** Valor en euros. Lo fija libremente el club: la plataforma no sugiere ni impone precios. */
  value: number;
  duration: string | null;
  /** Periodo al que se refiere el valor (Fase 7). Null = sin especificar. */
  period: BudgetPeriod | null;
  /** Forma de colaboración (Fase 7). Null = sin especificar. */
  collaborationType: CollaborationType | null;
  /** A qué público u objetivo apela (Fase 7). Puede estar vacío. */
  objectives: ObjectiveTag[];
  /** Nivel de patrocinador. Por defecto "libre". */
  sponsorLevel: SponsorLevel;
  /** Sector en exclusiva, en texto libre. Null = sin exclusividad. */
  exclusivity: string | null;
  /** Equipo del club al que va asociada. Null = al club entero. */
  teamId: string | null;
  /**
   * Número de patrocinadores que busca esta oportunidad. Null = uno
   * solo, que es el caso normal. A partir de 2 se reparte en plazas y
   * `value` es lo que aporta cada empresa (migración 0017).
   */
  slotsTotal: number | null;
  /** Plazas ya cubiertas, que lleva el club a mano. */
  slotsTaken: number;
  /**
   * true = el club NECESITA esto y ofrece visibilidad a cambio (un
   * fisio, un autobús, material). false = lo normal: el club ofrece y
   * la empresa paga. Migración 0038.
   */
  esNecesidad: boolean;
  /** Qué clase de servicio o producto necesita. Solo cuando
   * `esNecesidad` es true. */
  categoriaNecesidad: CategoriaNecesidad | null;
  /** Fecha en la que se archivó (null = activa). Archivar no borra la oportunidad, solo la oculta. */
  archivedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

// ---------------------------------------------------------------------
// Fase 8: perfil de empresa, favoritos y solicitudes de contacto
// ---------------------------------------------------------------------

/** Fila de la tabla `companies`: el perfil de una empresa. Todo es
 * opcional: a diferencia del club, no hay ninguna sección obligatoria
 * que bloquee el resto. */
export type CompanyProfile = {
  id: string;
  /** Se genera solo a partir del nombre (migración 0033). */
  slug: string | null;
  name: string | null;
  sector: string | null;
  city: string | null;
  province: string | null;
  website: string | null;
  /** Cómo se presenta la empresa en el directorio. Máximo 600. */
  description: string | null;
  logoUrl: string | null;
  /**
   * La empresa acepta salir en el directorio público y recibir
   * propuestas de clubes. Apagado por defecto: se registró para buscar
   * clubes, no para salir en una lista.
   */
  openToSponsor: boolean;
  /** Presupuesto orientativo en euros (rango). Ambos límites son
   * opcionales e independientes entre sí. Nunca es una oferta
   * vinculante: solo una referencia para el club al leer la solicitud. */
  budgetMin: number | null;
  budgetMax: number | null;
  /** Mismo catálogo que `Opportunity.objectives` (Fase 7). */
  objectives: ObjectiveTag[];
  createdAt: string;
  updatedAt: string;
};

/** Una lista con nombre propio en la que una empresa organiza las
 * oportunidades que guarda como favoritas. */
export type FavoriteList = {
  id: string;
  companyId: string;
  name: string;
  createdAt: string;
};

/** Una oportunidad guardada por una empresa dentro de una de sus listas. */
export type Favorite = {
  id: string;
  companyId: string;
  listId: string;
  opportunityId: string;
  createdAt: string;
};

export type ContactRequestStatus = "new" | "seen" | "in_conversation" | "closed" | "discarded";

/** Fila de la tabla `contact_requests`: solicitud de contacto de una
 * empresa a un club, opcionalmente sobre una oportunidad concreta. */
export type ContactRequest = {
  id: string;
  companyId: string | null;
  clubId: string;
  /** Null si la solicitud es sobre el club en general, no sobre una oportunidad concreta. */
  opportunityId: string | null;
  message: string;
  status: ContactRequestStatus;
  /** Quién escribió, cuando la solicitud no viene de una cuenta
   *  (migración 0034). Es lo único que el club necesita para
   *  contestar. */
  remitenteNombre: string | null;
  remitenteEmpresa: string | null;
  remitenteEmail: string | null;
  remitenteTelefono: string | null;
  createdAt: string;
  updatedAt: string;
};

// ---------------------------------------------------------------------
// Fase 9: dossier comercial en PDF
// ---------------------------------------------------------------------

/** Secciones seleccionables del dossier PDF. La portada (marca del club)
 * y el pie de ApoyaClub aparecen siempre, no son seleccionables. */
export type DossierSectionKey =
  | "identidad"
  | "historia"
  | "equipos"
  | "cantera"
  | "audiencia"
  | "instalaciones"
  | "patrocinadores";

/** Configuración del dossier de un club: qué incluir y, si lo activa,
 * los datos de su enlace público. El PDF no se guarda en ningún sitio:
 * se genera al vuelo a partir de esta configuración (fila de la tabla
 * `club_dossiers`). */
export type DossierConfig = {
  clubId: string;
  sections: DossierSectionKey[];
  opportunityIds: string[];
  shareEnabled: boolean;
  shareToken: string | null;
  shareExpiresAt: string | null;
  updatedAt: string;
};

/**
 * Una empresa tal y como la ve todo el mundo en el directorio
 * (migración 0033). Sale de `company_public_profiles`, no de
 * `companies`: aquí no hay correo ni presupuesto exacto.
 */
export type CompanyPublicProfile = {
  id: string;
  slug: string;
  name: string;
  sector: string | null;
  city: string | null;
  province: string | null;
  website: string | null;
  description: string | null;
  logoUrl: string | null;
  objectives: ObjectiveTag[];
  /** Franja de presupuesto, nunca la cifra. */
  budgetBand: BudgetBand | null;
  createdAt: string;
};

export type BudgetBand = "hasta_500" | "de_500_a_2000" | "mas_2000";

export type ProposalStatus = "new" | "seen" | "in_conversation" | "discarded";

/** Propuesta de patrocinio de un club a una empresa (migración 0033). */
export type ClubProposal = {
  id: string;
  clubId: string;
  companyId: string;
  opportunityId: string | null;
  message: string;
  status: ProposalStatus;
  createdAt: string;
};
