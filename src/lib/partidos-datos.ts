import { avisarDeFallo } from "@/lib/monitoring";
import { partidoRowToPartido, type Partido, type PartidoRow } from "@/lib/publico-partidos";
import type { createClient } from "@/lib/supabase/server";

/**
 * Lectura del registro de público (migración 0037).
 *
 * Siempre con la sesión del propio club, nunca con la clave de
 * servicio: es su libreta y RLS es quien garantiza que un club no vea
 * la de otro.
 */
export async function obtenerPartidosDelClub(
  supabase: Awaited<ReturnType<typeof createClient>>,
  clubId: string,
): Promise<Partido[]> {
  const { data, error } = await supabase
    .from("club_matches")
    .select("id, club_id, played_on, opponent, competition, team, home, attendance, notes")
    .eq("club_id", clubId)
    .order("played_on", { ascending: false })
    .returns<PartidoRow[]>();

  if (error) {
    avisarDeFallo("publico", "No se han podido leer los partidos del club", error);
    return [];
  }

  return (data ?? []).map(partidoRowToPartido);
}
