import { cache } from "react";
import {
  clubRowToProfile,
  clubSponsorRowToSponsor,
  clubTeamRowToTeam,
  type ClubRow,
  type ClubSponsorRow,
  type ClubTeamRow,
} from "@/lib/club-mappers";
import { opportunityRowToOpportunity, type OpportunityRow } from "@/lib/opportunity-mappers";
import { createAdminClient } from "@/lib/supabase/admin";
import { createPublicClient } from "@/lib/supabase/public";
import type { ClubProfile, ClubSponsor, ClubTeam, Opportunity } from "@/lib/types";

export type ClubPublico = {
  perfil: ClubProfile;
  equipos: ClubTeam[];
  patrocinadores: ClubSponsor[];
  /** Solo las disponibles y no archivadas (Fase 6), ordenadas de mayor a menor valor. */
  oportunidades: Opportunity[];
};

/**
 * Datos de la página pública de un club (Fase 5). Envuelto en `cache()`
 * para que, dentro de la misma petición, `generateMetadata` y la propia
 * página compartan la misma consulta en vez de duplicarla.
 *
 * Lee de la vista `club_public_profiles` (no de la tabla `clubs`
 * directamente): esa vista es la que ya oculta el teléfono y el nombre
 * de contacto cuando el club no ha dado su autorización.
 */
export const obtenerClubPublico = cache(
  async (slug: string): Promise<ClubPublico | null> => {
    const supabase = createPublicClient();

    const { data: filaClub } = await supabase
      .from("club_public_profiles")
      .select("*")
      .eq("slug", slug)
      .maybeSingle<ClubRow>();

    if (!filaClub) return null;

    const [{ data: filasEquipos }, { data: filasPatrocinadores }, { data: filasOportunidades }] =
      await Promise.all([
        supabase
          .from("club_teams")
          .select("*")
          .eq("club_id", filaClub.id)
          .order("created_at", { ascending: true })
          .returns<ClubTeamRow[]>(),
        supabase
          .from("club_sponsors")
          .select("*")
          .eq("club_id", filaClub.id)
          .order("created_at", { ascending: true })
          .returns<ClubSponsorRow[]>(),
        // Solo las disponibles y no archivadas: son las únicas que debe
        // ver un visitante sin sesión (Fase 6). La RLS de `opportunities`
        // ya aplica el mismo filtro; se repite aquí para aprovechar el
        // índice y dejar la intención explícita en el código.
        supabase
          .from("opportunities")
          .select("*")
          .eq("club_id", filaClub.id)
          .eq("status", "available")
          .is("archived_at", null)
          .order("value", { ascending: false })
          .returns<OpportunityRow[]>(),
      ]);

    return {
      perfil: clubRowToProfile(filaClub),
      equipos: (filasEquipos ?? []).map(clubTeamRowToTeam),
      patrocinadores: (filasPatrocinadores ?? []).map(clubSponsorRowToSponsor),
      oportunidades: (filasOportunidades ?? []).map(opportunityRowToOpportunity),
    };
  },
);

/**
 * El correo de contacto es siempre el de la cuenta del club (no se
 * guarda en `clubs`), así que hay que pedirlo aparte con la clave de
 * servicio. Solo se usa para construir el enlace "mailto:" del botón de
 * contacto; nunca se expone como dato consultable.
 */
export const obtenerEmailContacto = cache(async (clubId: string): Promise<string | null> => {
  try {
    const admin = createAdminClient();
    const { data } = await admin.auth.admin.getUserById(clubId);
    return data.user?.email ?? null;
  } catch {
    return null;
  }
});

/**
 * No hay un campo "deporte" a nivel de club (Fase 4 solo lo guarda por
 * equipo), así que en la portada se muestra el deporte (o deportes) que
 * practican sus equipos.
 */
export function deportesDelClub(equipos: ClubTeam[]): string[] {
  return Array.from(new Set(equipos.map((equipo) => equipo.sport.trim()).filter(Boolean)));
}
