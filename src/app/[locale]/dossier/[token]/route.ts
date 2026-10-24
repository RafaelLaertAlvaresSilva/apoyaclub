import { NextResponse } from "next/server";
import { clubRowToProfile, clubSponsorRowToSponsor, clubTeamRowToTeam } from "@/lib/club-mappers";
import type { ClubRow, ClubSponsorRow, ClubTeamRow } from "@/lib/club-mappers";
import { dossierRowToConfig, type DossierRow } from "@/lib/dossier-mappers";
import { generarDossierPdf } from "@/lib/dossier-pdf";
import { textosDeDocumento, type TextosDocumento } from "@/lib/textos-documento";
import { opportunityRowToOpportunity, type OpportunityRow } from "@/lib/opportunity-mappers";
import { partidoRowToPartido, type PartidoRow } from "@/lib/publico-partidos";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Enlace público del dossier (Fase 9): sin sesión, pensado para
 * compartirse por email o WhatsApp. Usa la clave de servicio (como ya
 * se hace para leer el email de contacto en la página pública del
 * club, `club/[slug]/data.ts`) porque `club_dossiers` no tiene ninguna
 * política de lectura pública: aquí es donde se comprueban a mano el
 * token, la activación y la caducidad antes de generar nada.
 */

function paginaNoDisponible({ t, locale }: TextosDocumento, clave: string) {
  const mensaje = t(clave);
  const html = `<!doctype html>
<html lang="${locale}">
<head><meta charset="utf-8" /><title>${t("noDisponibleTitulo")} — ApoyaClub</title></head>
<body style="font-family: sans-serif; max-width: 480px; margin: 15vh auto; text-align: center; color: #18181b;">
  <h1 style="font-size: 1.25rem;">${t("noDisponible")}</h1>
  <p style="color: #52525b;">${mensaje}</p>
</body>
</html>`;
  return new NextResponse(html, { status: 404, headers: { "Content-Type": "text/html; charset=utf-8" } });
}

type ParametrosRuta = { params: Promise<{ locale: string; token: string }> };

export async function GET(_request: Request, { params }: ParametrosRuta) {
  const { locale, token } = await params;
  const textos = await textosDeDocumento(locale, "dossier");
  if (!token) return paginaNoDisponible(textos, "noValido");

  const admin = createAdminClient();

  const { data: filaDossier } = await admin
    .from("club_dossiers")
    .select("*")
    .eq("share_token", token)
    .maybeSingle<DossierRow>();

  if (!filaDossier) return paginaNoDisponible(textos, "noValido");

  const configuracion = dossierRowToConfig(filaDossier);
  if (!configuracion.shareEnabled) {
    return paginaNoDisponible(textos, "desactivado");
  }
  if (configuracion.shareExpiresAt && new Date(configuracion.shareExpiresAt).getTime() < Date.now()) {
    return paginaNoDisponible(textos, "caducado");
  }

  const { data: filaClub } = await admin
    .from("clubs")
    .select("*")
    .eq("id", configuracion.clubId)
    .maybeSingle<ClubRow>();

  if (!filaClub) return paginaNoDisponible(textos, "clubNoDisponible");

  // Métrica del panel (migración 0014): cuántas veces se ha abierto el
  // dossier que el club comparte. Si falla, el dossier se sirve igual.
  void admin
    .from("dossier_views")
    .insert({ club_id: filaClub.id })
    .then(({ error }) => {
      if (error) console.error("[dossier] No se ha podido registrar la apertura:", error.message);
    });

  const [
    { data: filasEquipos },
    { data: filasPatrocinadores },
    { data: filasOportunidades },
    { data: filasPartidos },
    { data: usuario },
  ] = await Promise.all([
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
        .order("sort_order", { ascending: true })
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
    // El registro de público: de aquí sale la parte contada del
    // alcance. Con la clave de servicio, igual que todo lo demás de
    // esta ruta, porque quien abre el enlace no tiene sesión.
    admin
      .from("club_matches")
      .select("id, club_id, played_on, opponent, competition, team, team_id, home, attendance, notes")
      .eq("club_id", filaClub.id)
      .order("played_on", { ascending: false })
      .returns<PartidoRow[]>(),
    admin.auth.admin.getUserById(filaClub.id),
  ]);

  const pdf = await generarDossierPdf({
    perfil: clubRowToProfile(filaClub),
    equipos: (filasEquipos ?? []).map(clubTeamRowToTeam),
    patrocinadores: (filasPatrocinadores ?? []).map(clubSponsorRowToSponsor),
    oportunidades: (filasOportunidades ?? []).map(opportunityRowToOpportunity),
    partidos: (filasPartidos ?? []).map(partidoRowToPartido),
    secciones: configuracion.sections,
    orden: configuracion.orden,
    nivelesPatrocinadores: configuracion.sponsorTiers,
    emailContacto: usuario.user?.email ?? null,
  }, locale);

  return new NextResponse(new Uint8Array(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="dossier-${filaClub.slug}.pdf"`,
      "Content-Length": String(pdf.length),
      "Cache-Control": "no-store",
    },
  });
}
