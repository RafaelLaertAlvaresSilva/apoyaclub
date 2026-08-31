import type {
  ClubProfile,
  ClubSponsor,
  ClubTeam,
  CommunityAction,
  FollowersByNetwork,
  Milestone,
  SocialLinks,
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
  website: string | null;
  social_links: SocialLinks | null;
  description: string | null;
  logo_url: string | null;
  photo_urls: string[] | null;
  video_url: string | null;
  contact_name: string | null;
  contact_phone: string | null;
  contact_public_consent: boolean | null;
  verified: boolean | null;
  top_category: string | null;
  competitions: string | null;
  achievements: string | null;
  youth_teams_count: number | null;
  youth_players_count: number | null;
  youth_families_count: number | null;
  founding_year: number | null;
  milestones: Milestone[] | null;
  followers_by_network: FollowersByNetwork | null;
  estimated_reach: number | null;
  average_attendance: number | null;
  community_actions: CommunityAction[] | null;
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
};

export type ClubSponsorRow = {
  id: string;
  club_id: string;
  name: string;
  logo_url: string | null;
  website: string | null;
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
    website: row.website,
    socialLinks: row.social_links ?? {},
    description: row.description,
    logoUrl: row.logo_url,
    photoUrls: row.photo_urls ?? [],
    videoUrl: row.video_url,
    contactName: row.contact_name,
    contactPhone: row.contact_phone,
    contactPublicConsent: row.contact_public_consent ?? false,
    verified: row.verified ?? false,
    topCategory: row.top_category,
    competitions: row.competitions,
    achievements: row.achievements,
    youthTeamsCount: row.youth_teams_count,
    youthPlayersCount: row.youth_players_count,
    youthFamiliesCount: row.youth_families_count,
    foundingYear: row.founding_year,
    milestones: row.milestones ?? [],
    followersByNetwork: row.followers_by_network ?? {},
    estimatedReach: row.estimated_reach,
    averageAttendance: row.average_attendance,
    communityActions: row.community_actions ?? [],
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
  };
}

export function clubSponsorRowToSponsor(row: ClubSponsorRow): ClubSponsor {
  return {
    id: row.id,
    clubId: row.club_id,
    name: row.name,
    logoUrl: row.logo_url,
    website: row.website,
  };
}
