import { avisarDeFallo } from "@/lib/monitoring";
import { prospectoRowToProspecto, type Prospecto, type ProspectoRow } from "@/lib/prospectos";
import type { createClient } from "@/lib/supabase/server";

/**
 * Lectura de la libreta de empresas (migración 0041).
 *
 * Siempre con la sesión del propio club, nunca con la clave de
 * servicio: es su libreta y RLS es quien garantiza que un club no vea
 * la de otro.
 */
export async function obtenerProspectosDelClub(
  supabase: Awaited<ReturnType<typeof createClient>>,
  clubId: string,
): Promise<Prospecto[]> {
  const { data, error } = await supabase
    .from("club_prospects")
    .select(
      "id, club_id, name, sector, contact_name, contact_info, origin, status, notes, next_action_on, created_at",
    )
    .eq("club_id", clubId)
    .order("created_at", { ascending: false })
    .returns<ProspectoRow[]>();

  if (error) {
    avisarDeFallo("prospectos", "No se ha podido leer la lista de empresas del club", error);
    return [];
  }

  return (data ?? []).map(prospectoRowToProspecto);
}
