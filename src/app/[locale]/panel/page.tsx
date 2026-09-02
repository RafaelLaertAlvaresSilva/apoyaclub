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
import { obtenerMetricasClub } from "@/lib/club-metrics";
import { calcularPorcentajeCompletado } from "@/lib/profile-completion";
import { createClient } from "@/lib/supabase/server";
import { BarraProgreso } from "./components/BarraProgreso";
import { MetricasClub } from "./components/MetricasClub";
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

  const [{ data: filaClub }, { data: filasEquipos }, { data: filasPatrocinadores }] =
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
    ]);

  // Las métricas se piden aparte porque van con la clave de servicio
  // (el club no lee las tablas de eventos, solo sus números agregados).
  const metricas = await obtenerMetricasClub(user.id);

  const perfil = filaClub ? clubRowToProfile(filaClub) : null;
  const equipos = (filasEquipos ?? []).map(clubTeamRowToTeam);
  const patrocinadores = (filasPatrocinadores ?? []).map(clubSponsorRowToSponsor);

  const nombreProvisional = (user.user_metadata?.name as string | undefined) ?? user.email;
  const porcentaje = calcularPorcentajeCompletado(perfil, equipos, patrocinadores);

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

      <MetricasClub metricas={metricas} />

      <BarraProgreso porcentaje={porcentaje} />

      <PanelTabs
        userId={user.id}
        perfil={perfil}
        equipos={equipos}
        patrocinadores={patrocinadores}
      />
    </div>
  );
}
