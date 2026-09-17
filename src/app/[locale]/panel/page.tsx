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
import { obtenerMetricasClub, obtenerResumenDeVisitas } from "@/lib/club-metrics";
import { hoyISO } from "@/lib/tareas-patrocinio";
import { obtenerTareasDelClub, obtenerUltimosInformes } from "@/lib/tareas-datos";
import { contarSolicitudesNuevas } from "@/lib/contact-requests";
import { primerosPasos } from "@/lib/onboarding";
import { obtenerRecomendaciones } from "@/lib/recomendaciones";
import { huecosDelPerfil } from "@/lib/profile-completion";
import { createClient } from "@/lib/supabase/server";
import { BarraProgreso } from "./components/BarraProgreso";
import { MetricasClub } from "./components/MetricasClub";
import { AvisoSolicitudes } from "./components/AvisoSolicitudes";
import { PrimerosPasos } from "./components/PrimerosPasos";
import { Recomendaciones } from "./components/Recomendaciones";
import { PanelNav } from "./components/PanelNav";
import { RecordatorioInforme } from "./tareas/components/RecordatorioInforme";
import { TareasDeHoy } from "./components/TareasDeHoy";
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
    ]);

  // Las métricas se piden aparte porque van con la clave de servicio
  // (el club no lee las tablas de eventos, solo sus números agregados).
  const [metricas, resumenDeVisitas, tareas, ultimosInformes] =
    await Promise.all([
      obtenerMetricasClub(user.id),
      obtenerResumenDeVisitas(user.id),
      // Las tareas y los informes van con la sesión del club: son su
      // agenda privada y de eso se encarga RLS (migraciones 0030, 0031).
      obtenerTareasDelClub(supabase, user.id),
      obtenerUltimosInformes(supabase, user.id),
    ]);

  const perfil = filaClub ? clubRowToProfile(filaClub) : null;
  const equipos = (filasEquipos ?? []).map(clubTeamRowToTeam);
  const patrocinadores = (filasPatrocinadores ?? []).map(clubSponsorRowToSponsor);

  const pasosIniciales = primerosPasos(perfil, equipos, oportunidadesPublicadas ?? 0);

  // Mientras no haya ficha, el título grande era la dirección de correo
  // con la que el club se registró. Es lo primero que se ve al entrar y
  // daba sensación de página a medio hacer, justo en el momento en que
  // hay que generar confianza. El correo sigue estando, debajo y en
  // pequeño, que es donde sirve.
  const nombreProvisional = (user.user_metadata?.name as string | undefined) ?? "Tu club";
  // El porcentaje lo calcula la base de datos (migración 0020) y es el
  // mismo que usa el buscador para ordenar; aquí solo se lee.
  const porcentaje = perfil?.profileScore ?? 0;
  const huecos = huecosDelPerfil(perfil, equipos, patrocinadores);

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-6 bg-zinc-50 px-4 sm:px-6 py-8">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-teal-700">{t("panelDelClub")}</p>
          <h1 className="mt-1 text-2xl font-semibold text-zinc-900">
            {perfil?.name ?? nombreProvisional}
          </h1>
          {!perfil && <p className="mt-1 text-sm text-zinc-500">{user.email}</p>}
        </div>
        <CerrarSesionBoton />
      </div>

      <PanelNav activo="perfil" />

      <AvisoSolicitudes sinAbrir={await contarSolicitudesNuevas()} />

      <TareasDeHoy tareas={tareas} />

      {/* Dos veces por temporada y solo mientras quede alguna empresa
          sin su informe. Va también aquí, en la portada, porque es
          donde entra el club: si solo estuviera en la pestaña de
          tareas, se lo perdería justo quien menos entra a mirarlas. */}
      <RecordatorioInforme tareas={tareas} ultimosInformes={ultimosInformes} hoy={hoyISO()} />

      <PrimerosPasos pasos={pasosIniciales} />

      {/* Las dos juntas, y el progreso a un tercio: es un recordatorio,
          no el contenido principal del panel. Cuando la ficha está
          completa, `BarraProgreso` no pinta nada, así que aquí se deja
          de partir la fila y las métricas ocupan todo el ancho — si no,
          quedaría medio panel vacío esperando a una tarjeta que ya no
          existe. */}
      {huecos.length > 0 ? (
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <MetricasClub metricas={metricas} resumen={resumenDeVisitas} />
          </div>
          <BarraProgreso porcentaje={porcentaje} huecos={huecos} />
        </div>
      ) : (
        <MetricasClub metricas={metricas} resumen={resumenDeVisitas} />
      )}

      <PanelTabs
        userId={user.id}
        perfil={perfil}
        equipos={equipos}
      />

      <Recomendaciones recomendaciones={obtenerRecomendaciones()} />
    </div>
  );
}
