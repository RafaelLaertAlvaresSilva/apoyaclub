import type { CompanyProfile, Favorite, FavoriteList, ObjectiveTag } from "@/lib/types";

/**
 * Igual que `club-mappers.ts`: traduce entre las columnas snake_case de
 * las tablas `companies`, `company_favorite_lists` y `company_favorites`
 * (Fase 8) y los tipos en camelCase que usa el resto de la app.
 */
export type CompanyRow = {
  id: string;
  name: string | null;
  sector: string | null;
  city: string | null;
  website: string | null;
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
    name: row.name,
    sector: row.sector,
    city: row.city,
    website: row.website,
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
