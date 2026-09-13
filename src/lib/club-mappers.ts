import { NIVELES_PATROCINADOR, etiquetaNivelPatrocinador } from "@/lib/types";
import type {
  ClubProfile,
  ClubSponsor,
  ClubTeam,
  CommunityAction,
  FollowersByNetwork,
  Milestone,
  SocialLinks,
  SponsorTier,
  TeamLevel,
} from "@/lib/types";

/**
 * Las tablas de Supabase usan snake_case (convención de Postgres); el
 * código de la app usa camelCase. Estas funciones traducen entre ambos
 * mundos para que el resto del código nunca vea nombres de columna.
 */

// Tipos "en bruto" tal y como los devuelve Supabase (una fila de cada tabla).
// También describe las filas de la vista pública `club_public_profiles`
// (Fase 5), que tiene exactamente las mismas columnas.
export type ClubRow = {
  id: string;
  slug: string;
  name: string;
  city: string;
  province: string | null;
  postal_code: string | null;
  latitude: number | null;
  longitude: number | null;
  facilities: string | null;
  facilities_address?: string | null;
  facilities_photos?: string[] | null;
  website: string | null;
  social_links: SocialLinks | null;
  description: string | null;
  logo_url: string | null;
  cover_url?: string | null;
  cover_position?: number | null;
  photo_urls: string[] | null;
  video_url: string | null;
  contact_name: string | null;
  contact_phone: string | null;
  /** Opcional: la vista pública no lo expone (migración 0024). */
  contact_email?: string | null;
  contact_hours?: string | null;
  contact_public_consent: boolean | null;
  verified: boolean | null;
  top_category: string | null;
  top_category_male: string | null;
  top_category_female: string | null;
  top_category_male_photo: string | null;
  top_category_female_photo: string | null;
  competitions: string | null;
  achievements: string | null;
  youth_teams_count: number | null;
  youth_players_count: number | null;
  youth_families_count: number | null;
  /** Migración 0042. Opcional porque las filas antiguas de la vista
   * pública pueden llegar sin ella. */
  members_count?: number | null;
  founding_year: number | null;
  milestones: Milestone[] | null;
  followers_by_network: FollowersByNetwork | null;
  estimated_reach: number | null;
  average_attendance: number | null;
  community_actions: CommunityAction[] | null;
  /**
   * Porcentaje de ficha rellenada (migración 0020). Lo calcula la base de
   * datos. Opcional porque la vista pública `club_public_profiles` no lo
   * expone: allí llega undefined y se toma como 0.
   */
  profile_score?: number | null;
  created_at: string;
  updated_at: string;
};

export type ClubTeamRow = {
  id: string;
  club_id: string;
  sport: string;
  category: string | null;
  gender: string | null;
  team_level: TeamLevel;
  player_count: number | null;
  photo_url: string | null;
  competition_level: string | null;
  achievements: string | null;
};

export type ClubSponsorRow = {
  id: string;
  club_id: string;
  name: string;
  logo_url: string | null;
  website: string | null;
  tier: string | null;
  tier_label: string | null;
  description: string | null;
  since_year: number | null;
  sort_order: number | null;
  contact_email?: string | null;
  notified_at?: string | null;
};

export function clubRowToProfile(row: ClubRow): ClubProfile {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    city: row.city,
    province: row.province,
    postalCode: row.postal_code,
    latitude: row.latitude,
    longitude: row.longitude,
    facilities: row.facilities,
    facilitiesAddress: row.facilities_address ?? null,
    facilitiesPhotos: row.facilities_photos ?? [],
    website: row.website,
    socialLinks: row.social_links ?? {},
    description: row.description,
    logoUrl: row.logo_url,
    coverUrl: row.cover_url ?? null,
    coverPosition: row.cover_position ?? 50,
    photoUrls: row.photo_urls ?? [],
    videoUrl: row.video_url,
    contactName: row.contact_name,
    contactPhone: row.contact_phone,
    contactEmail: row.contact_email ?? null,
    contactHours: row.contact_hours ?? null,
    contactPublicConsent: row.contact_public_consent ?? false,
    verified: row.verified ?? false,
    topCategory: row.top_category,
    topCategoryMale: row.top_category_male,
    topCategoryFemale: row.top_category_female,
    topCategoryMalePhoto: row.top_category_male_photo,
    topCategoryFemalePhoto: row.top_category_female_photo,
    competitions: row.competitions,
    achievements: row.achievements,
    youthTeamsCount: row.youth_teams_count,
    youthPlayersCount: row.youth_players_count,
    youthFamiliesCount: row.youth_families_count,
    membersCount: row.members_count ?? null,
    foundingYear: row.founding_year,
    milestones: row.milestones ?? [],
    followersByNetwork: row.followers_by_network ?? {},
    estimatedReach: row.estimated_reach,
    averageAttendance: row.average_attendance,
    communityActions: row.community_actions ?? [],
    profileScore: row.profile_score ?? 0,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function clubTeamRowToTeam(row: ClubTeamRow): ClubTeam {
  return {
    id: row.id,
    clubId: row.club_id,
    sport: row.sport,
    category: row.category,
    gender: row.gender,
    teamLevel: row.team_level,
    playerCount: row.player_count,
    photoUrl: row.photo_url,
    competitionLevel: row.competition_level,
    achievements: row.achievements,
  };
}

export function clubSponsorRowToSponsor(row: ClubSponsorRow): ClubSponsor {
  // `tier` viene de una columna con default y constraint, pero las filas
  // anteriores a la migración 0019 (o una lectura desde una vista que no
  // la traiga) podrían llegar sin valor: se cae a "colaborador", que es
  // el nivel neutro.
  const tier = NIVELES_PATROCINADOR.includes(row.tier as SponsorTier)
    ? (row.tier as SponsorTier)
    : "colaborador";

  return {
    id: row.id,
    clubId: row.club_id,
    name: row.name,
    logoUrl: row.logo_url,
    website: row.website,
    tier,
    tierLabel: tier === "otro" ? row.tier_label : null,
    description: row.description,
    sinceYear: row.since_year,
    sortOrder: row.sort_order ?? 0,
    contactEmail: row.contact_email ?? null,
    notifiedAt: row.notified_at ?? null,
  };
}

/**
 * Orden en que se pintan los patrocinadores: primero el principal, luego
 * oficiales, colaboradores y los de etiqueta libre. Dentro de cada
 * categoría manda el orden que haya fijado el club.
 */
const PESO_NIVEL: Record<SponsorTier, number> = {
  principal: 0,
  oficial: 1,
  colaborador: 2,
  otro: 3,
};

export function ordenarPatrocinadores(patrocinadores: ClubSponsor[]): ClubSponsor[] {
  return [...patrocinadores].sort((a, b) => {
    const porNivel = PESO_NIVEL[a.tier] - PESO_NIVEL[b.tier];
    if (porNivel !== 0) return porNivel;
    return a.sortOrder - b.sortOrder;
  });
}

/**
 * Agrupa los patrocinadores por la etiqueta que se enseña, conservando
 * el orden de `ordenarPatrocinadores`. Los de nivel "otro" se agrupan por
 * su etiqueta propia, así que un club puede tener varios grupos libres.
 */
export function agruparPatrocinadoresPorNivel(
  patrocinadores: ClubSponsor[],
): { etiqueta: string; patrocinadores: ClubSponsor[] }[] {
  const grupos: { etiqueta: string; patrocinadores: ClubSponsor[] }[] = [];

  for (const patrocinador of ordenarPatrocinadores(patrocinadores)) {
    const etiqueta = etiquetaNivelPatrocinador(patrocinador);
    const grupo = grupos.find((candidato) => candidato.etiqueta === etiqueta);
    if (grupo) grupo.patrocinadores.push(patrocinador);
    else grupos.push({ etiqueta, patrocinadores: [patrocinador] });
  }

  return grupos;
}

/**
 * Los equipos del club repartidos por sexo, para que la ficha pública
 * los enseñe separados (migración 0038).
 *
 * Una empresa que quiere patrocinar deporte femenino no debería tener
 * que ir leyendo tarjeta por tarjeta a ver cuál le vale. El orden es
 * femenino, masculino, mixto y al final los que no lo tienen puesto:
 * el femenino primero a propósito, porque es el que más cuesta que se
 * vea y el que más empresas buscan expresamente.
 *
 * Si todos los equipos caen en el mismo grupo, se devuelve un único
 * grupo sin título: un club con equipos solo masculinos no necesita un
 * titular que se lo recuerde.
 */
export function agruparEquiposPorSexo(
  equipos: ClubTeam[],
): { titulo: string | null; equipos: ClubTeam[] }[] {
  const clave = (equipo: ClubTeam) => (equipo.gender ?? "").trim().toLowerCase();

  const grupos: { titulo: string; coincide: (valor: string) => boolean }[] = [
    { titulo: "Equipos femeninos", coincide: (v) => v.startsWith("fem") },
    { titulo: "Equipos masculinos", coincide: (v) => v.startsWith("masc") },
    { titulo: "Equipos mixtos", coincide: (v) => v.startsWith("mix") },
  ];

  const repartidos = grupos.map((grupo) => ({
    titulo: grupo.titulo,
    equipos: equipos.filter((equipo) => grupo.coincide(clave(equipo))),
  }));

  const resto = equipos.filter(
    (equipo) => !grupos.some((grupo) => grupo.coincide(clave(equipo))),
  );
  if (resto.length > 0) repartidos.push({ titulo: "Otros equipos", equipos: resto });

  const conEquipos = repartidos.filter((grupo) => grupo.equipos.length > 0);

  if (conEquipos.length <= 1) return [{ titulo: null, equipos }];
  return conEquipos;
}
