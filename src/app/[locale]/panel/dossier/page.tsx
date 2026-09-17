import { Link } from "@/i18n/navigation";
import { redirect } from "@/i18n/navigation";
import { getLocale, getTranslations } from "next-intl/server";
import { CerrarSesionBoton } from "@/components/CerrarSesionBoton";
import { clubRowToProfile, clubSponsorRowToSponsor, clubTeamRowToTeam } from "@/lib/club-mappers";
import type { ClubRow, ClubSponsorRow, ClubTeamRow } from "@/lib/club-mappers";
import { dossierRowToConfig, type DossierRow } from "@/lib/dossier-mappers";
import { seccionesConContenido, seccionesPorDefecto } from "@/lib/dossier";
import { opportunityRowToOpportunity, type OpportunityRow } from "@/lib/opportunity-mappers";
import { obtenerPartidosDelClub } from "@/lib/partidos-datos";
import { createClient } from "@/lib/supabase/server";
import { PanelNav } from "../components/PanelNav";
import { DossierManager } from "./components/DossierManager";

export default async function DossierPage() {
  const t = await getTranslations("panel.dossier");
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

  const [
    { data: filaClub },
    { data: filasEquipos },
    { data: filasPatrocinadores },
    { data: filasOportunidades },
    { data: filaDossier },
    partidos,
  ] = await Promise.all([
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
    // El registro de público: es lo que decide si la sección de
    // audiencia tiene algo que enseñar (y es lo mejor que puede
    // enseñar).
    obtenerPartidosDelClub(supabase, user.id),
  ]);

  const perfil = filaClub ? clubRowToProfile(filaClub) : null;
  const equipos = (filasEquipos ?? []).map(clubTeamRowToTeam);
  const patrocinadores = (filasPatrocinadores ?? []).map(clubSponsorRowToSponsor);
  const oportunidades = (filasOportunidades ?? []).map(opportunityRowToOpportunity);
  const configuracion = filaDossier ? dossierRowToConfig(filaDossier) : null;

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-6 bg-zinc-50 px-4 sm:px-6 py-8">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-teal-700">{t("panelDelClub")}</p>
          <h1 className="mt-1 text-2xl font-semibold text-zinc-900">{t("dossierComercialEnPdf")}</h1>
          <p className="mt-1 max-w-2xl text-sm text-zinc-600">
            El documento que le pasas a una empresa: tu club en un PDF, con las cifras y las oportunidades que tú elijas. También sale en Word, por si quieres retocarlo.
          </p>
        </div>
        <CerrarSesionBoton />
      </div>

      <PanelNav activo="dossier" />

      {!perfil ? (
        <div className="rounded-xl border border-zinc-200 bg-white p-6 text-sm text-zinc-600">
          Completa primero la identidad del club (nombre y localidad) en{" "}
          <Link href="/panel" className="font-medium text-teal-700 hover:underline">{t("tuPerfil")}</Link>{" "}
          para poder generar tu dossier de patrocinio.
        </div>
      ) : (
        <DossierManager
          perfil={perfil}
          equipos={equipos}
          patrocinadores={patrocinadores}
          oportunidades={oportunidades}
          seccionesDisponibles={Array.from(
            seccionesConContenido(perfil, equipos, patrocinadores, partidos),
          )}
          configuracion={configuracion}
          seccionesPorDefecto={seccionesPorDefecto(
            seccionesConContenido(perfil, equipos, patrocinadores, partidos),
          )}
        />
      )}
    </div>
  );
}
