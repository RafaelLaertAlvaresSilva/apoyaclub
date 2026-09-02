import { Link } from "@/i18n/navigation";
import { redirect } from "@/i18n/navigation";
import { getLocale } from "next-intl/server";
import { CerrarSesionBoton } from "@/components/CerrarSesionBoton";
import { clubRowToProfile, clubTeamRowToTeam, type ClubRow, type ClubTeamRow } from "@/lib/club-mappers";
import { opportunityRowToOpportunity, type OpportunityRow } from "@/lib/opportunity-mappers";
import { createClient } from "@/lib/supabase/server";
import { PanelNav } from "../components/PanelNav";
import { OportunidadesManager } from "./components/OportunidadesManager";

export default async function OportunidadesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // El middleware ya protege esta ruta; esta comprobación es una segunda
  // capa de seguridad por si se renderiza en otro contexto.
  if (!user) {
    const locale = await getLocale();
    return redirect({ href: "/login", locale });
  }

  const [{ data: filaClub }, { data: filasOportunidades }, { data: filasEquipos }] = await Promise.all([
    supabase.from("clubs").select("*").eq("id", user.id).maybeSingle<ClubRow>(),
    supabase
      .from("opportunities")
      .select("*")
      .eq("club_id", user.id)
      .order("created_at", { ascending: false })
      .returns<OpportunityRow[]>(),
    // Los equipos del club se cargan aquí para poder asociar una
    // oportunidad a uno concreto (primer equipo, un equipo de cantera).
    supabase
      .from("club_teams")
      .select("*")
      .eq("club_id", user.id)
      .order("created_at", { ascending: true })
      .returns<ClubTeamRow[]>(),
  ]);

  const perfil = filaClub ? clubRowToProfile(filaClub) : null;
  const oportunidades = (filasOportunidades ?? []).map(opportunityRowToOpportunity);
  const equipos = (filasEquipos ?? []).map(clubTeamRowToTeam);

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-6 bg-zinc-50 px-4 py-8">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-teal-700">Panel del club</p>
          <h1 className="mt-1 text-2xl font-semibold text-zinc-900">Oportunidades de patrocinio</h1>
        </div>
        <CerrarSesionBoton />
      </div>

      <PanelNav activo="oportunidades" />

      {!perfil ? (
        <div className="rounded-xl border border-zinc-200 bg-white p-6 text-sm text-zinc-600">
          Completa primero la identidad del club (nombre y localidad) en{" "}
          <Link href="/panel" className="font-medium text-teal-700 hover:underline">
            tu perfil
          </Link>{" "}
          para poder publicar oportunidades de patrocinio.
        </div>
      ) : (
        <OportunidadesManager oportunidades={oportunidades} equipos={equipos} />
      )}
    </div>
  );
}
