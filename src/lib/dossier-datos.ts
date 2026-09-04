import { clubRowToProfile, clubSponsorRowToSponsor, clubTeamRowToTeam } from "@/lib/club-mappers";
import type { ClubRow, ClubSponsorRow, ClubTeamRow } from "@/lib/club-mappers";
import { seccionesValidas } from "@/lib/dossier-mappers";
import { opportunityRowToOpportunity, type OpportunityRow } from "@/lib/opportunity-mappers";
import type { createClient } from "@/lib/supabase/server";
import type { ClubProfile, ClubSponsor, ClubTeam, DossierSectionKey, Opportunity } from "@/lib/types";

/**
 * Todo lo que hace falta para montar un dossier, venga en PDF o en Word.
 *
 * Estaba escrito dentro de la ruta del PDF. Al aparecer la descarga en
 * Word habría habido dos copias de las mismas cuatro consultas, y la
 * segunda se habría quedado atrás en cuanto se tocara la primera.
 */
export type DatosDossier = {
  perfil: ClubProfile;
  equipos: ClubTeam[];
  patrocinadores: ClubSponsor[];
  oportunidades: Opportunity[];
  secciones: DossierSectionKey[];
  emailContacto: string | null;
};

type ClienteSupabase = Awaited<ReturnType<typeof createClient>>;

/**
 * Lee el club y lo suyo con la sesión del propio club. Las secciones y
 * las oportunidades salen del formulario, no de lo guardado: así el club
 * puede probar una combinación y descargarla sin tener que guardarla
 * antes.
 *
 * Devuelve null si el club todavía no tiene ficha: quien llama decide
 * qué contarle.
 */
export async function reunirDatosDelDossier(
  supabase: ClienteSupabase,
  clubId: string,
  formData: FormData,
  emailContacto: string | null,
): Promise<(DatosDossier & { slug: string }) | null> {
  const secciones = seccionesValidas(formData.getAll("sections"));
  const idsOportunidades = formData.getAll("opportunityIds").map(String);

  const [{ data: filaClub }, { data: filasEquipos }, { data: filasPatrocinadores }, { data: filasOportunidades }] =
    await Promise.all([
      supabase.from("clubs").select("*").eq("id", clubId).maybeSingle<ClubRow>(),
      supabase
        .from("club_teams")
        .select("*")
        .eq("club_id", clubId)
        .order("created_at", { ascending: true })
        .returns<ClubTeamRow[]>(),
      supabase
        .from("club_sponsors")
        .select("*")
        .eq("club_id", clubId)
        .order("sort_order", { ascending: true })
        .order("created_at", { ascending: true })
        .returns<ClubSponsorRow[]>(),
      idsOportunidades.length > 0
        ? supabase
            .from("opportunities")
            .select("*")
            .eq("club_id", clubId)
            .in("id", idsOportunidades)
            .order("value", { ascending: false })
            .returns<OpportunityRow[]>()
        : Promise.resolve({ data: [] as OpportunityRow[] }),
    ]);

  if (!filaClub) return null;

  return {
    slug: filaClub.slug,
    perfil: clubRowToProfile(filaClub),
    equipos: (filasEquipos ?? []).map(clubTeamRowToTeam),
    patrocinadores: (filasPatrocinadores ?? []).map(clubSponsorRowToSponsor),
    oportunidades: (filasOportunidades ?? []).map(opportunityRowToOpportunity),
    secciones,
    emailContacto,
  };
}
