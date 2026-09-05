import type { ContactRequest, ContactRequestStatus } from "@/lib/types";

/**
 * Igual que el resto de mappers: traduce entre las columnas snake_case
 * de `contact_requests` (Fase 8) y el tipo en camelCase que usa el resto
 * de la app.
 */
export type ContactRequestRow = {
  id: string;
  /** Null en las solicitudes sin cuenta (migración 0034). */
  company_id: string | null;
  club_id: string;
  opportunity_id: string | null;
  message: string;
  status: ContactRequestStatus;
  sender_name: string | null;
  sender_company: string | null;
  sender_email: string | null;
  sender_phone: string | null;
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
    remitenteNombre: row.sender_name,
    remitenteEmpresa: row.sender_company,
    remitenteEmail: row.sender_email,
    remitenteTelefono: row.sender_phone,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}
