import { redirect } from "@/i18n/navigation";
import { getLocale, getTranslations } from "next-intl/server";
import { CerrarSesionBoton } from "@/components/CerrarSesionBoton";
import {
  clubRowToProfile,
  clubSponsorRowToSponsor,
  clubTeamRowToTeam,
  type ClubRow,
  type ClubSponsorRow,
  type ClubTeamRow,
} from "@/lib/club-mappers";
import { obtenerEmpresasInteresadas, obtenerMetricasClub } from "@/lib/club-metrics";
import { contarSolicitudesNuevas } from "@/lib/contact-requests";
import { primerosPasos } from "@/lib/onboarding";
import { obtenerRecomendaciones } from "@/lib/recomendaciones";
import { filaAServicio, type FilaServicio, type ServiceNeed } from "@/lib/service-needs";
import { huecosDelPerfil } from "@/lib/profile-completion";
import { createClient } from "@/lib/supabase/server";
import { BarraProgreso } from "./components/BarraProgreso";
import { MetricasClub } from "./components/MetricasClub";
import { AvisoSolicitudes } from "./components/AvisoSolicitudes";
import { PrimerosPasos } from "./components/PrimerosPasos";
import { Recomendaciones } from "./components/Recomendaciones";
import { PanelNav } from "./components/PanelNav";
import { PanelTabs } from "./components/PanelTabs";

export default async function PanelPage() {
  const t = await getTranslations("panel.perfil");
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
    { count: oportunidadesPublicadas },
    { data: filasServicios },
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
      // Solo el número: es para saber si ya ha publicado alguna, no para
      // enseñarlas aquí.
      supabase
        .from("opportunities")
        .select("id", { count: "exact", head: true })
        .eq("club_id", user.id)
        .is("archived_at", null),
      // Servicios que el club necesita (migración 0016). Si la tabla
      // todavía no existe, `data` viene null y la pestaña sale vacía.
      supabase
        .from("club_service_needs")
        .select("*")
        .eq("club_id", user.id)
        .order("created_at", { ascending: false })
        .returns<FilaServicio[]>(),
    ]);

  // Las métricas se piden aparte porque van con la clave de servicio
  // (el club no lee las tablas de eventos, solo sus números agregados).
  const [metricas, empresasInteresadas] = await Promise.all([
    obtenerMetricasClub(user.id),
    obtenerEmpresasInteresadas(user.id),
  ]);

  const perfil = filaClub ? clubRowToProfile(filaClub) : null;
  const equipos = (filasEquipos ?? []).map(clubTeamRowToTeam);
  const patrocinadores = (filasPatrocinadores ?? []).map(clubSponsorRowToSponsor);

  const servicios: ServiceNeed[] = (filasServicios ?? []).map(filaAServicio);

  const pasosIniciales = primerosPasos(perfil, equipos, oportunidadesPublicadas ?? 0);

  const nombreProvisional = (user.user_metadata?.name as string | undefined) ?? user.email;
  // El porcentaje lo calcula la base de datos (migración 0020) y es el
  // mismo que usa el buscador para ordenar; aquí solo se lee.
  const porcentaje = perfil?.profileScore ?? 0;
  const huecos = huecosDelPerfil(perfil, equipos, patrocinadores);

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-6 bg-zinc-50 px-4 py-8">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-teal-700">{t("panelDelClub")}</p>
          <h1 className="mt-1 text-2xl font-semibold text-zinc-900">
            {perfil?.name ?? nombreProvisional}
          </h1>
        </div>
        <CerrarSesionBoton />
      </div>

      <PanelNav activo="perfil" />

      <AvisoSolicitudes sinAbrir={await contarSolicitudesNuevas()} />

      <PrimerosPasos pasos={pasosIniciales} />

      <MetricasClub metricas={metricas} empresas={empresasInteresadas} />

      <BarraProgreso porcentaje={porcentaje} huecos={huecos} />

      <PanelTabs
        userId={user.id}
        perfil={perfil}
        equipos={equipos}
        patrocinadores={patrocinadores}
        servicios={servicios}
      />

      <Recomendaciones recomendaciones={obtenerRecomendaciones()} />
    </div>
  );
}
