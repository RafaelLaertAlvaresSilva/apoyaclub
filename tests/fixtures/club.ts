import type { ClubProfile, ClubSponsor, ClubTeam } from "@/lib/types";

/**
 * Club vacío: solo lo que la aplicación garantiza que existe siempre
 * (id, slug, nombre y localidad). Cada test rellena lo que necesita con
 * `perfilDePrueba({ ... })`.
 */
const CLUB_VACIO: ClubProfile = {
  id: "11111111-1111-1111-1111-111111111111",
  slug: "club-de-prueba",
  name: "Club de Prueba",
  city: "Valencia",
  province: "Valencia",
  postalCode: null,
  latitude: null,
  longitude: null,
  facilities: null,
  facilitiesAddress: null,
  facilitiesPhotos: [],
  website: null,
  socialLinks: {},
  description: null,
  logoUrl: null,
  coverUrl: null,
  coverPosition: 50,
  photoUrls: [],
  videoUrl: null,
  contactName: null,
  contactPhone: null,
  contactEmail: null,
  contactHours: null,
  contactPublicConsent: false,
  verified: false,
  topCategory: null,
  topCategoryMale: null,
  topCategoryFemale: null,
  competitions: null,
  achievements: null,
  youthTeamsCount: null,
  youthPlayersCount: null,
  youthFamiliesCount: null,
  foundingYear: null,
  milestones: [],
  followersByNetwork: {},
  estimatedReach: null,
  averageAttendance: null,
  communityActions: [],
  profileScore: 0,
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
};

export function perfilDePrueba(cambios: Partial<ClubProfile> = {}): ClubProfile {
  return { ...CLUB_VACIO, ...cambios };
}

export function equipoDePrueba(cambios: Partial<ClubTeam> = {}): ClubTeam {
  return {
    id: "22222222-2222-2222-2222-222222222222",
    clubId: CLUB_VACIO.id,
    sport: "Balonmano",
    category: "Senior",
    gender: "Masculino",
    teamLevel: "primer_equipo",
    playerCount: 16,
    ...cambios,
  };
}

export function patrocinadorDePrueba(cambios: Partial<ClubSponsor> = {}): ClubSponsor {
  return {
    id: "33333333-3333-3333-3333-333333333333",
    clubId: CLUB_VACIO.id,
    name: "Ferretería del barrio",
    logoUrl: null,
    website: null,
    tier: "colaborador",
    tierLabel: null,
    description: null,
    sinceYear: null,
    sortOrder: 0,
    contactEmail: null,
    notifiedAt: null,
    ...cambios,
  };
}
