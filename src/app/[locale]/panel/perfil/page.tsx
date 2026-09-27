import { redirect } from "@/i18n/navigation";
import { getLocale, getTranslations } from "next-intl/server";
import {
  clubRowToProfile,
  clubSponsorRowToSponsor,
  clubTeamRowToTeam,
  type ClubRow,
  type ClubSponsorRow,
  type ClubTeamRow,
} from "@/lib/club-mappers";
import { huecosDelPerfil } from "@/lib/profile-completion";
import { createClient } from "@/lib/supabase/server";
import { BarraProgreso } from "../components/BarraProgreso";
import { PanelTabs } from "../components/PanelTabs";

/**
 * La ficha del club: el formulario largo.
 *
 * Hasta ahora vivía pegado debajo del panel de inicio, en la misma
 * página. El club entraba a ver sus números y, sin querer, se
 * encontraba el formulario entero de doce apartados por debajo. Ahora
 * son dos sitios distintos: aquí se edita, en "Inicio" se mira.
 */
export default async function PerfilDelClubPage() {
  const t = await getTranslations("panel.perfil");
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

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
        .order("sort_order", { ascending: true })
        .order("created_at", { ascending: true })
        .returns<ClubSponsorRow[]>(),
    ]);

  const perfil = filaClub ? clubRowToProfile(filaClub) : null;
  const equipos = (filasEquipos ?? []).map(clubTeamRowToTeam);
  const patrocinadores = (filasPatrocinadores ?? []).map(clubSponsorRowToSponsor);

  // El porcentaje lo calcula la base de datos (migración 0020) y es el
  // mismo que usa el buscador para ordenar; aquí solo se lee.
  const porcentaje = perfil?.profileScore ?? 0;
  const huecos = huecosDelPerfil(perfil, equipos, patrocinadores);

  return (
    <div className="flex w-full flex-1 flex-col gap-6 py-6">
      <div>
        <p className="text-sm font-medium text-teal-700">{t("panelDelClub")}</p>
        <h1 className="mt-1 text-2xl font-semibold text-zinc-900">Perfil del club</h1>
        <p className="mt-1 text-sm text-zinc-600">
          Todo lo que una empresa ve de ti. Cuanto más completo, más arriba sales en el buscador.
        </p>
      </div>

      {/* Lo que falta, arriba del formulario: es lo único que hay que
          hacer en esta página, y antes quedaba enterrado entre las
          métricas de la portada. */}
      {huecos.length > 0 && <BarraProgreso porcentaje={porcentaje} huecos={huecos} />}

      <PanelTabs userId={user.id} perfil={perfil} equipos={equipos} />
    </div>
  );
}
