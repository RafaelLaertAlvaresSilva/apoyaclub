import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { Role } from "@/lib/types";

/**
 * Exporta en un único JSON todos los datos de la empresa autenticada
 * (Fase 11: derecho de acceso y portabilidad). Cada tabla se lee con el
 * cliente normal, así que las políticas de RLS ya se encargan de que
 * solo se devuelvan las filas de la propia empresa.
 */
export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || (user.app_metadata?.role as Role | undefined) !== "empresa") {
    return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  }

  const [
    { data: empresa },
    { data: listasFavoritos },
    { data: favoritos },
    { data: solicitudesContacto },
    { data: consentimientos },
  ] = await Promise.all([
    supabase.from("companies").select("*").eq("id", user.id).maybeSingle(),
    supabase.from("company_favorite_lists").select("*").eq("company_id", user.id),
    supabase.from("company_favorites").select("*").eq("company_id", user.id),
    supabase.from("contact_requests").select("*").eq("company_id", user.id),
    supabase.from("consent_records").select("*").eq("user_id", user.id),
  ]);

  const exportacion = {
    generadoEl: new Date().toISOString(),
    cuenta: { id: user.id, email: user.email, rol: "empresa" },
    empresa,
    listasDeFavoritos: listasFavoritos ?? [],
    favoritos: favoritos ?? [],
    solicitudesDeContactoEnviadas: solicitudesContacto ?? [],
    consentimientos: consentimientos ?? [],
  };

  const json = JSON.stringify(exportacion, null, 2);

  return new NextResponse(json, {
    headers: {
      "Content-Type": "application/json",
      "Content-Disposition": `attachment; filename="apoyaclub-datos-empresa-${user.id}.json"`,
    },
  });
}
