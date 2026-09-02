import { NextResponse } from "next/server";
import { clubRowToProfile, clubSponsorRowToSponsor, clubTeamRowToTeam } from "@/lib/club-mappers";
import type { ClubRow, ClubSponsorRow, ClubTeamRow } from "@/lib/club-mappers";
import { generarDossierPdf } from "@/lib/dossier-pdf";
import { seccionesValidas } from "@/lib/dossier-mappers";
import { opportunityRowToOpportunity, type OpportunityRow } from "@/lib/opportunity-mappers";
import { createClient } from "@/lib/supabase/server";
import type { Role } from "@/lib/types";

/**
 * Descarga autenticada del dossier (Fase 9): el propio club, desde su
 * panel, genera y descarga el PDF con la selección de secciones y
 * oportunidades que tenga marcada en ese momento en el formulario (no
 * hace falta haberla guardado antes). El PDF se genera aquí mismo, en
 * el servidor, y no se guarda en ningún sitio.
 */
export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || (user.app_metadata?.role as Role | undefined) !== "club") {
    return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  }

  const formData = await request.formData();
  const secciones = seccionesValidas(formData.getAll("sections"));
  const idsOportunidades = formData.getAll("opportunityIds").map(String);

  const [{ data: filaClub }, { data: filasEquipos }, { data: filasPatrocinadores }, { data: filasOportunidades }] =
    await Promise.all([
      supabase.from("clubs").select("*").eq("id", user.id).maybeSingle<ClubRow>(),
      supabase
        .from("club_teams")
        .select("*")
        .eq("club_id", user.id)
        .order("created_at", { ascending: true })
        .returns<ClubTeamRow[]>(),
      supabase
        .from("club_sponsors")
        .select("*")
        .eq("club_id", user.id)
        .order("sort_order", { ascending: true })
        .order("created_at", { ascending: true })
        .returns<ClubSponsorRow[]>(),
      idsOportunidades.length > 0
        ? supabase
            .from("opportunities")
            .select("*")
            .eq("club_id", user.id)
            .in("id", idsOportunidades)
            .order("value", { ascending: false })
            .returns<OpportunityRow[]>()
        : Promise.resolve({ data: [] as OpportunityRow[] }),
    ]);

  if (!filaClub) {
    return NextResponse.json({ error: "Completa primero la identidad del club." }, { status: 400 });
  }

  const pdf = await generarDossierPdf({
    perfil: clubRowToProfile(filaClub),
    equipos: (filasEquipos ?? []).map(clubTeamRowToTeam),
    patrocinadores: (filasPatrocinadores ?? []).map(clubSponsorRowToSponsor),
    oportunidades: (filasOportunidades ?? []).map(opportunityRowToOpportunity),
    secciones,
    emailContacto: user.email ?? null,
  });

  return new NextResponse(new Uint8Array(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="dossier-${filaClub.slug}.pdf"`,
      "Content-Length": String(pdf.length),
    },
  });
}
