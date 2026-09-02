import { NextResponse } from "next/server";
import { clubRowToProfile, clubSponsorRowToSponsor, clubTeamRowToTeam } from "@/lib/club-mappers";
import type { ClubRow, ClubSponsorRow, ClubTeamRow } from "@/lib/club-mappers";
import { dossierRowToConfig, type DossierRow } from "@/lib/dossier-mappers";
import { generarDossierPdf } from "@/lib/dossier-pdf";
import { opportunityRowToOpportunity, type OpportunityRow } from "@/lib/opportunity-mappers";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Enlace público del dossier (Fase 9): sin sesión, pensado para
 * compartirse por email o WhatsApp. Usa la clave de servicio (como ya
 * se hace para leer el email de contacto en la página pública del
 * club, `club/[slug]/data.ts`) porque `club_dossiers` no tiene ninguna
 * política de lectura pública: aquí es donde se comprueban a mano el
 * token, la activación y la caducidad antes de generar nada.
 */

function paginaNoDisponible(mensaje: string) {
  const html = `<!doctype html>
<html lang="es">
<head><meta charset="utf-8" /><title>Enlace no disponible — ApoyaClub</title></head>
<body style="font-family: sans-serif; max-width: 480px; margin: 15vh auto; text-align: center; color: #18181b;">
  <h1 style="font-size: 1.25rem;">Este enlace no está disponible</h1>
  <p style="color: #52525b;">${mensaje}</p>
</body>
</html>`;
  return new NextResponse(html, { status: 404, headers: { "Content-Type": "text/html; charset=utf-8" } });
}

type ParametrosRuta = { params: Promise<{ token: string }> };

export async function GET(_request: Request, { params }: ParametrosRuta) {
  const { token } = await params;
  if (!token) return paginaNoDisponible("El enlace no es válido.");

  const admin = createAdminClient();

  const { data: filaDossier } = await admin
    .from("club_dossiers")
    .select("*")
    .eq("share_token", token)
    .maybeSingle<DossierRow>();

  if (!filaDossier) return paginaNoDisponible("El enlace no es válido.");

  const configuracion = dossierRowToConfig(filaDossier);
  if (!configuracion.shareEnabled) {
    return paginaNoDisponible("El club ha desactivado este enlace.");
  }
  if (configuracion.shareExpiresAt && new Date(configuracion.shareExpiresAt).getTime() < Date.now()) {
    return paginaNoDisponible("Este enlace ha caducado.");
  }

  const { data: filaClub } = await admin
    .from("clubs")
    .select("*")
    .eq("id", configuracion.clubId)
    .maybeSingle<ClubRow>();

  if (!filaClub) return paginaNoDisponible("El club ya no está disponible.");

  // Métrica del panel (migración 0014): cuántas veces se ha abierto el
  // dossier que el club comparte. Si falla, el dossier se sirve igual.
  void admin
    .from("dossier_views")
    .insert({ club_id: filaClub.id })
    .then(({ error }) => {
      if (error) console.error("[dossier] No se ha podido registrar la apertura:", error.message);
    });

  const [{ data: filasEquipos }, { data: filasPatrocinadores }, { data: filasOportunidades }, { data: usuario }] =
    await Promise.all([
      admin
        .from("club_teams")
        .select("*")
        .eq("club_id", filaClub.id)
        .order("created_at", { ascending: true })
        .returns<ClubTeamRow[]>(),
      admin
        .from("club_sponsors")
        .select("*")
        .eq("club_id", filaClub.id)
        .order("created_at", { ascending: true })
        .returns<ClubSponsorRow[]>(),
      configuracion.opportunityIds.length > 0
        ? admin
            .from("opportunities")
            .select("*")
            .eq("club_id", filaClub.id)
            .in("id", configuracion.opportunityIds)
            .is("archived_at", null)
            .order("value", { ascending: false })
            .returns<OpportunityRow[]>()
        : Promise.resolve({ data: [] as OpportunityRow[] }),
      admin.auth.admin.getUserById(filaClub.id),
    ]);

  const pdf = await generarDossierPdf({
    perfil: clubRowToProfile(filaClub),
    equipos: (filasEquipos ?? []).map(clubTeamRowToTeam),
    patrocinadores: (filasPatrocinadores ?? []).map(clubSponsorRowToSponsor),
    oportunidades: (filasOportunidades ?? []).map(opportunityRowToOpportunity),
    secciones: configuracion.sections,
    emailContacto: usuario.user?.email ?? null,
  });

  return new NextResponse(new Uint8Array(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="dossier-${filaClub.slug}.pdf"`,
      "Content-Length": String(pdf.length),
      "Cache-Control": "no-store",
    },
  });
}
