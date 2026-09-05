import type {
  BudgetBand,
  ClubProposal,
  CompanyProfile,
  CompanyPublicProfile,
  Favorite,
  FavoriteList,
  ObjectiveTag,
  ProposalStatus,
} from "@/lib/types";

/**
 * Igual que `club-mappers.ts`: traduce entre las columnas snake_case de
 * las tablas `companies`, `company_favorite_lists` y `company_favorites`
 * (Fase 8) y los tipos en camelCase que usa el resto de la app.
 */
export type CompanyRow = {
  id: string;
  slug: string | null;
  name: string | null;
  sector: string | null;
  city: string | null;
  province: string | null;
  website: string | null;
  description: string | null;
  logo_url: string | null;
  open_to_sponsor: boolean | null;
  // Postgres puede devolver `numeric` como string; se normaliza abajo.
  budget_min: number | string | null;
  budget_max: number | string | null;
  objectives: ObjectiveTag[] | null;
  created_at: string;
  updated_at: string;
};

function numeroONulo(valor: number | string | null): number | null {
  if (valor === null) return null;
  return typeof valor === "string" ? Number.parseFloat(valor) : valor;
}

export function companyRowToProfile(row: CompanyRow): CompanyProfile {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    sector: row.sector,
    city: row.city,
    province: row.province,
    website: row.website,
    description: row.description,
    logoUrl: row.logo_url,
    openToSponsor: row.open_to_sponsor ?? false,
    budgetMin: numeroONulo(row.budget_min),
    budgetMax: numeroONulo(row.budget_max),
    objectives: row.objectives ?? [],
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export type FavoriteListRow = {
  id: string;
  company_id: string;
  name: string;
  created_at: string;
};

export function favoriteListRowToFavoriteList(row: FavoriteListRow): FavoriteList {
  return {
    id: row.id,
    companyId: row.company_id,
    name: row.name,
    createdAt: row.created_at,
  };
}

export type FavoriteRow = {
  id: string;
  company_id: string;
  list_id: string;
  opportunity_id: string;
  created_at: string;
};

export function favoriteRowToFavorite(row: FavoriteRow): Favorite {
  return {
    id: row.id,
    companyId: row.company_id,
    listId: row.list_id,
    opportunityId: row.opportunity_id,
    createdAt: row.created_at,
  };
}

/** Fila de la vista `company_public_profiles` (migración 0033). */
export type CompanyPublicRow = {
  id: string;
  slug: string;
  name: string;
  sector: string | null;
  city: string | null;
  province: string | null;
  website: string | null;
  description: string | null;
  logo_url: string | null;
  objectives: ObjectiveTag[] | null;
  budget_band: BudgetBand | null;
  created_at: string;
};

export function companyPublicRowToProfile(row: CompanyPublicRow): CompanyPublicProfile {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    sector: row.sector,
    city: row.city,
    province: row.province,
    website: row.website,
    description: row.description,
    logoUrl: row.logo_url,
    objectives: row.objectives ?? [],
    budgetBand: row.budget_band,
    createdAt: row.created_at,
  };
}

export type ClubProposalRow = {
  id: string;
  club_id: string;
  company_id: string;
  opportunity_id: string | null;
  message: string;
  status: string;
  created_at: string;
};

export function clubProposalRowToProposal(row: ClubProposalRow): ClubProposal {
  const estados: ProposalStatus[] = ["new", "seen", "in_conversation", "discarded"];

  return {
    id: row.id,
    clubId: row.club_id,
    companyId: row.company_id,
    opportunityId: row.opportunity_id,
    message: row.message,
    status: estados.includes(row.status as ProposalStatus) ? (row.status as ProposalStatus) : "new",
    createdAt: row.created_at,
  };
}
