import type { DatosDeAlcance } from "@/lib/alcance";
import { clubRowToProfile, clubTeamRowToTeam } from "@/lib/club-mappers";
import type { ClubRow, ClubTeamRow } from "@/lib/club-mappers";
import { obtenerPartidosDelClub } from "@/lib/partidos-datos";
import type { createClient } from "@/lib/supabase/server";

/**
 * Lo que hace falta para calcular el alcance de un club: su ficha, sus
 * equipos y su registro de público.
 *
 * Siempre con la sesión del propio club. El cálculo vive aparte, en
 * `alcance.ts`, y no toca la base de datos: así se puede probar entero
 * sin levantar nada.
 */
export async function reunirDatosDeAlcance(
  supabase: Awaited<ReturnType<typeof createClient>>,
  clubId: string,
): Promise<DatosDeAlcance> {
  const [{ data: filaClub }, { data: filasEquipos }, partidos] = await Promise.all([
    supabase.from("clubs").select("*").eq("id", clubId).maybeSingle<ClubRow>(),
    supabase
      .from("club_teams")
      .select("*")
      .eq("club_id", clubId)
      .order("created_at", { ascending: true })
      .returns<ClubTeamRow[]>(),
    obtenerPartidosDelClub(supabase, clubId),
  ]);

  return {
    perfil: filaClub ? clubRowToProfile(filaClub) : null,
    equipos: (filasEquipos ?? []).map(clubTeamRowToTeam),
    partidos,
  };
}
