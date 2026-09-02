import type {
  BudgetPeriod,
  CollaborationType,
  ObjectiveTag,
  Opportunity,
  OpportunityStatus,
  OpportunityType,
  SponsorLevel,
} from "@/lib/types";

/**
 * Igual que `club-mappers.ts`: traduce entre las columnas snake_case de
 * la tabla `opportunities` (Fase 6) y el tipo `Opportunity` en camelCase
 * que usa el resto de la app.
 */
export type OpportunityRow = {
  id: string;
  club_id: string;
  title: string;
  description: string | null;
  opportunity_type: OpportunityType;
  status: OpportunityStatus;
  // Postgres puede devolver `numeric` como string; se normaliza abajo.
  value: number | string;
  duration: string | null;
  period: BudgetPeriod | null;
  collaboration_type: CollaborationType | null;
  objectives: ObjectiveTag[] | null;
  sponsor_level: SponsorLevel | null;
  exclusivity: string | null;
  team_id: string | null;
  archived_at: string | null;
  created_at: string;
  updated_at: string;
};

export function opportunityRowToOpportunity(row: OpportunityRow): Opportunity {
  return {
    id: row.id,
    clubId: row.club_id,
    title: row.title,
    description: row.description,
    opportunityType: row.opportunity_type,
    status: row.status,
    value: typeof row.value === "string" ? Number.parseFloat(row.value) : row.value,
    duration: row.duration,
    period: row.period,
    collaborationType: row.collaboration_type,
    objectives: row.objectives ?? [],
    // `sponsor_level` es NOT NULL en base de datos, pero se acepta null
    // aquí por si la fila viene de una consulta hecha antes de aplicar la
    // migración 0011.
    sponsorLevel: row.sponsor_level ?? "libre",
    exclusivity: row.exclusivity,
    teamId: row.team_id,
    archivedAt: row.archived_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}
