import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { Role } from "@/lib/types";

/**
 * Exporta en un único JSON todos los datos del club autenticado (Fase
 * 11: derecho de acceso y portabilidad). Cada tabla se lee con el
 * cliente normal, así que las políticas de RLS ya se encargan de que
 * solo se devuelvan las filas del propio club.
 */
export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || (user.app_metadata?.role as Role | undefined) !== "club") {
    return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  }

  const [
    { data: club },
    { data: equipos },
    { data: patrocinadores },
    { data: oportunidades },
    { data: dossier },
    { data: solicitudesContacto },
    { data: consentimientos },
  ] = await Promise.all([
    supabase.from("clubs").select("*").eq("id", user.id).maybeSingle(),
    supabase.from("club_teams").select("*").eq("club_id", user.id),
    supabase.from("club_sponsors").select("*").eq("club_id", user.id),
    supabase.from("opportunities").select("*").eq("club_id", user.id),
    supabase.from("club_dossiers").select("*").eq("id", user.id).maybeSingle(),
    supabase.from("contact_requests").select("*").eq("club_id", user.id),
    supabase.from("consent_records").select("*").eq("user_id", user.id),
  ]);

  const exportacion = {
    generadoEl: new Date().toISOString(),
    cuenta: { id: user.id, email: user.email, rol: "club" },
    club,
    equipos: equipos ?? [],
    patrocinadores: patrocinadores ?? [],
    oportunidades: oportunidades ?? [],
    dossier,
    solicitudesDeContactoRecibidas: solicitudesContacto ?? [],
    consentimientos: consentimientos ?? [],
  };

  const json = JSON.stringify(exportacion, null, 2);

  return new NextResponse(json, {
    headers: {
      "Content-Type": "application/json",
      "Content-Disposition": `attachment; filename="apoyaclub-datos-club-${user.id}.json"`,
    },
  });
}
