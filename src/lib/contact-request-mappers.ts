import type { ContactRequest, ContactRequestStatus } from "@/lib/types";

/**
 * Igual que el resto de mappers: traduce entre las columnas snake_case
 * de `contact_requests` (Fase 8) y el tipo en camelCase que usa el resto
 * de la app.
 */
export type ContactRequestRow = {
  id: string;
  company_id: string;
  club_id: string;
  opportunity_id: string | null;
  message: string;
  status: ContactRequestStatus;
  created_at: string;
  updated_at: string;
};

export function contactRequestRowToContactRequest(row: ContactRequestRow): ContactRequest {
  return {
    id: row.id,
    companyId: row.company_id,
    clubId: row.club_id,
    opportunityId: row.opportunity_id,
    message: row.message,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}
