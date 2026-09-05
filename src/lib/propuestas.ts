import { clubProposalRowToProposal, type ClubProposalRow } from "@/lib/company-mappers";
import { avisarDeFallo } from "@/lib/monitoring";
import { createClient } from "@/lib/supabase/server";
import type { ClubProposal, Role } from "@/lib/types";

/**
 * Las propuestas que un club le manda a una empresa del directorio
 * (migración 0033).
 *
 * Los datos del club se leen de `club_public_profiles` y no de `clubs`:
 * la empresa no tiene permiso sobre esa tabla, y la vista ya trae lo
 * que se puede enseñar.
 */

export type PropuestaConClub = ClubProposal & {
  clubNombre: string;
  clubSlug: string | null;
  clubCiudad: string | null;
  clubLogo: string | null;
};

type FilaClub = { id: string; slug: string; name: string; city: string | null; logo_url: string | null };

export async function obtenerPropuestasDeEmpresa(
  supabase: Awaited<ReturnType<typeof createClient>>,
  companyId: string,
): Promise<PropuestaConClub[]> {
  const { data, error } = await supabase
    .from("club_proposals")
    .select("*")
    .eq("company_id", companyId)
    .order("created_at", { ascending: false })
    .returns<ClubProposalRow[]>();

  if (error) {
    avisarDeFallo("tareas", "No se han podido leer las propuestas de la empresa", error);
    return [];
  }

  const propuestas = (data ?? []).map(clubProposalRowToProposal);
  if (propuestas.length === 0) return [];

  const { data: clubes } = await supabase
    .from("club_public_profiles")
    .select("id, slug, name, city, logo_url")
    .in("id", [...new Set(propuestas.map((propuesta) => propuesta.clubId))])
    .returns<FilaClub[]>();

  const porId = new Map((clubes ?? []).map((club) => [club.id, club]));

  return propuestas.map((propuesta) => {
    const club = porId.get(propuesta.clubId);

    return {
      ...propuesta,
      // Un club puede haber dejado de estar publicado después de
      // escribir. Su propuesta no desaparece: sería perder un mensaje
      // que alguien mandó.
      clubNombre: club?.name ?? "Club no disponible",
      clubSlug: club?.slug ?? null,
      clubCiudad: club?.city ?? null,
      clubLogo: club?.logo_url ?? null,
    };
  });
}

/** Cuántas siguen sin abrir, para el contador de la navegación. */
export async function contarPropuestasNuevas(): Promise<number> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user || (user.app_metadata?.role as Role | undefined) !== "empresa") return 0;

    const { count } = await supabase
      .from("club_proposals")
      .select("id", { count: "exact", head: true })
      .eq("company_id", user.id)
      .eq("status", "new");

    return count ?? 0;
  } catch {
    return 0;
  }
}
