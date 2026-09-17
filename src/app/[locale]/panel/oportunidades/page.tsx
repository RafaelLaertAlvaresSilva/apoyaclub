import { Link } from "@/i18n/navigation";
import { redirect } from "@/i18n/navigation";
import { getLocale, getTranslations } from "next-intl/server";
import { CerrarSesionBoton } from "@/components/CerrarSesionBoton";
import { requisitosDelClub } from "@/lib/catalogo-ideas";
import { clubRowToProfile, clubTeamRowToTeam, type ClubRow, type ClubTeamRow } from "@/lib/club-mappers";
import { opportunityRowToOpportunity, type OpportunityRow } from "@/lib/opportunity-mappers";
import { filaAServicio, type FilaServicio, type ServiceNeed } from "@/lib/service-needs";
import { createClient } from "@/lib/supabase/server";
import { PanelNav } from "../components/PanelNav";
import { ServiciosForm } from "../components/ServiciosForm";
import { OportunidadesManager } from "./components/OportunidadesManager";

export default async function OportunidadesPage() {
  const t = await getTranslations("panel.oportunidades");
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

  // Lo que el club NECESITA (migración 0016) vive aquí y no en su ficha:
  // una furgoneta o un fisio que le hagan falta no describen al club, son
  // otra forma de oportunidad — la puerta de entrada para la empresa que
  // no tiene presupuesto de patrocinio pero sí un servicio que ofrecer.
  const { data: filasServicios } = await supabase
    .from("club_service_needs")
    .select("*")
    .eq("club_id", user.id)
    .order("created_at", { ascending: false })
    .returns<FilaServicio[]>();

  const servicios: ServiceNeed[] = (filasServicios ?? []).map(filaAServicio);

  const perfil = filaClub ? clubRowToProfile(filaClub) : null;
  const oportunidades = (filasOportunidades ?? []).map(opportunityRowToOpportunity);
  const equipos = (filasEquipos ?? []).map(clubTeamRowToTeam);

  // Qué ideas del catálogo puede ofrecer de verdad este club. Se calcula
  // aquí, en el servidor, y viaja como una lista corta: el catálogo
  // entero es del código, no hace falta traérselo de ningún sitio.
  const requisitos = [...requisitosDelClub(perfil, equipos)];

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-6 bg-zinc-50 px-4 py-8">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-teal-700">{t("panelDelClub")}</p>
          <h1 className="mt-1 text-2xl font-semibold text-zinc-900">{t("oportunidadesDePatrocinio")}</h1>
          <p className="mt-1 max-w-2xl text-sm text-zinc-600">
            Lo que tu club ofrece a una empresa a cambio de patrocinio, y lo que necesita a cambio de visibilidad. Es lo único de tu ficha donde una empresa puede hacer algo.
          </p>
        </div>
        <CerrarSesionBoton />
      </div>

      <PanelNav activo="oportunidades" />

      {!perfil ? (
        <div className="rounded-xl border border-zinc-200 bg-white p-6 text-sm text-zinc-600">
          Completa primero la identidad del club (nombre y localidad) en{" "}
          <Link href="/panel" className="font-medium text-teal-700 hover:underline">{t("tuPerfil")}</Link>{" "}
          para poder publicar oportunidades de patrocinio.
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          <OportunidadesManager oportunidades={oportunidades} equipos={equipos} requisitos={requisitos} />
          <ServiciosForm servicios={servicios} />
        </div>
      )}
    </div>
  );
}
