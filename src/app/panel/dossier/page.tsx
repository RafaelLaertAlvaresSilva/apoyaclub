import Link from "next/link";
import { redirect } from "next/navigation";
import { CerrarSesionBoton } from "@/components/CerrarSesionBoton";
import { clubRowToProfile, clubSponsorRowToSponsor, clubTeamRowToTeam } from "@/lib/club-mappers";
import type { ClubRow, ClubSponsorRow, ClubTeamRow } from "@/lib/club-mappers";
import { dossierRowToConfig, type DossierRow } from "@/lib/dossier-mappers";
import { seccionesConContenido, seccionesPorDefecto } from "@/lib/dossier";
import { opportunityRowToOpportunity, type OpportunityRow } from "@/lib/opportunity-mappers";
import { createClient } from "@/lib/supabase/server";
import { PanelNav } from "../components/PanelNav";
import { DossierManager } from "./components/DossierManager";

export default async function DossierPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // El middleware ya protege esta ruta; esta comprobación es una segunda
  // capa de seguridad por si se renderiza en otro contexto.
  if (!user) {
    redirect("/login");
  }

  const [{ data: filaClub }, { data: filasEquipos }, { data: filasPatrocinadores }, { data: filasOportunidades }, { data: filaDossier }] =
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
        .order("created_at", { ascending: true })
        .returns<ClubSponsorRow[]>(),
      // Todas las no archivadas: a diferencia de la página pública, el
      // club puede incluir en su dossier oportunidades reservadas
      // además de las disponibles (es su propio documento comercial).
      supabase
        .from("opportunities")
        .select("*")
        .eq("club_id", user.id)
        .is("archived_at", null)
        .order("value", { ascending: false })
        .returns<OpportunityRow[]>(),
      supabase.from("club_dossiers").select("*").eq("id", user.id).maybeSingle<DossierRow>(),
    ]);

  const perfil = filaClub ? clubRowToProfile(filaClub) : null;
  const equipos = (filasEquipos ?? []).map(clubTeamRowToTeam);
  const patrocinadores = (filasPatrocinadores ?? []).map(clubSponsorRowToSponsor);
  const oportunidades = (filasOportunidades ?? []).map(opportunityRowToOpportunity);
  const configuracion = filaDossier ? dossierRowToConfig(filaDossier) : null;

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-6 bg-zinc-50 px-4 py-8">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-emerald-700">Panel del club</p>
          <h1 className="mt-1 text-2xl font-semibold text-zinc-900">Dossier comercial en PDF</h1>
        </div>
        <CerrarSesionBoton />
      </div>

      <PanelNav activo="dossier" />

      {!perfil ? (
        <div className="rounded-xl border border-zinc-200 bg-white p-6 text-sm text-zinc-600">
          Completa primero la identidad del club (nombre y localidad) en{" "}
          <Link href="/panel" className="font-medium text-emerald-700 hover:underline">
            tu perfil
          </Link>{" "}
          para poder generar tu dossier de patrocinio.
        </div>
      ) : (
        <DossierManager
          perfil={perfil}
          equipos={equipos}
          patrocinadores={patrocinadores}
          oportunidades={oportunidades}
          seccionesDisponibles={Array.from(seccionesConContenido(perfil, equipos, patrocinadores))}
          configuracion={configuracion}
          seccionesPorDefecto={seccionesPorDefecto(seccionesConContenido(perfil, equipos, patrocinadores))}
        />
      )}
    </div>
  );
}
