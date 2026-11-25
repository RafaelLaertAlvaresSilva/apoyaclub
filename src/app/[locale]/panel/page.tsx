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
import { obtenerMetricasClub, obtenerResumenDeVisitas } from "@/lib/club-metrics";
import { estadoVisible, hoyISO } from "@/lib/tareas-patrocinio";
import { onboardingCompleto } from "@/lib/onboarding";
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
import { RecordatorioInforme } from "./tareas/components/RecordatorioInforme";
import { TareasDeHoy } from "./components/TareasDeHoy";
import { CabeceraDelInicio } from "./components/CabeceraDelInicio";
import { CifrasDelInicio } from "./components/CifrasDelInicio";
import { tituloDelPanel } from "@/lib/titulo-del-panel";

export async function generateMetadata() {
  return tituloDelPanel("inicio");
}

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
    { count: dossiers },
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
      // Solo si existe: es el cuarto de los primeros pasos.
      supabase.from("club_dossiers").select("id", { count: "exact", head: true }).eq("id", user.id),
    ]);

  // Las métricas se piden aparte porque van con la clave de servicio
  // (el club no lee las tablas de eventos, solo sus números agregados).
  const [metricas, resumenDeVisitas, tareas, ultimosInformes, sinAbrir] =
    await Promise.all([
      obtenerMetricasClub(user.id),
      obtenerResumenDeVisitas(user.id),
      // Las tareas y los informes van con la sesión del club: son su
      // agenda privada y de eso se encarga RLS (migraciones 0030, 0031).
      obtenerTareasDelClub(supabase, user.id),
      obtenerUltimosInformes(supabase, user.id),
      contarSolicitudesNuevas(),
    ]);

  const perfil = filaClub ? clubRowToProfile(filaClub) : null;
  const equipos = (filasEquipos ?? []).map(clubTeamRowToTeam);
  const patrocinadores = (filasPatrocinadores ?? []).map(clubSponsorRowToSponsor);

  const pasosIniciales = primerosPasos(perfil, equipos, oportunidadesPublicadas ?? 0, (dossiers ?? 0) > 0);

  // Mientras no haya ficha, el título grande era la dirección de correo
  // con la que el club se registró. Es lo primero que se ve al entrar y
  // daba sensación de página a medio hacer, justo en el momento en que
  // hay que generar confianza. El correo sigue estando, debajo y en
  // pequeño, que es donde sirve.
  const nombreProvisional = (user.user_metadata?.name as string | undefined) ?? t("tuClub");
  // El porcentaje lo calcula la base de datos (migración 0020) y es el
  // mismo que usa el buscador para ordenar; aquí solo se lee.
  const porcentaje = perfil?.profileScore ?? 0;
  const huecos = huecosDelPerfil(perfil, equipos, patrocinadores);

  // Las mismas que cuenta el aviso rojo de "Hoy toca esto".
  const hoy = hoyISO();
  const tareasVencidas = tareas.filter((tarea) => estadoVisible(tarea, hoy) === "caducada").length;

  // La dirección de "Ver mi página": la pública si se ve, la vista previa
  // si está en pruebas u oculta (lo mismo que hace el menú).
  const locale = await getLocale();
  const filaVisibilidad = filaClub as (ClubRow & { admin_test_mode?: boolean | null; hidden_by_club?: boolean | null }) | null;
  const escondido = filaVisibilidad?.admin_test_mode === true || filaVisibilidad?.hidden_by_club === true;
  const paginaPublica = filaClub?.slug
    ? escondido
      ? `/${locale}/vista-previa`
      : `/${locale}/club/${filaClub.slug}`
    : null;

  // La columna de la derecha solo existe si tiene algo dentro: con los
  // primeros pasos hechos y la ficha completa, lo de la izquierda ocupa
  // todo el ancho en vez de dejar un hueco esperando.
  const hayColumnaDerecha = !onboardingCompleto(pasosIniciales) || huecos.length > 0;

  return (
    <div className="flex w-full flex-1 flex-col gap-6 py-6">
      <CabeceraDelInicio
        nombre={perfil?.name ?? nombreProvisional}
        logoUrl={perfil?.logoUrl ?? null}
        correo={perfil ? null : (user.email ?? null)}
        paginaPublica={paginaPublica}
        hayFicha={perfil !== null}
      />

      <CifrasDelInicio
        visitas={metricas.visitas.actual}
        contactos={metricas.contactos.actual}
        dias={metricas.dias}
        solicitudesSinAbrir={sinAbrir}
        tareasVencidas={tareasVencidas}
      />

      <div className={hayColumnaDerecha ? "grid items-start gap-6 lg:grid-cols-3" : "flex flex-col gap-6"}>
        {/* Lo que pide hacer algo, a la izquierda y arriba. */}
        <div className="flex min-w-0 flex-col gap-6 lg:col-span-2">
          <AvisoSolicitudes sinAbrir={sinAbrir} />

          <TareasDeHoy tareas={tareas} />

          {/* Dos veces por temporada y solo mientras quede alguna empresa
              sin su informe. Va también aquí, en la portada, porque es
              donde entra el club: si solo estuviera en la pestaña de
              tareas, se lo perdería justo quien menos entra a mirarlas. */}
          <RecordatorioInforme tareas={tareas} ultimosInformes={ultimosInformes} hoy={hoy} />

          <MetricasClub metricas={metricas} resumen={resumenDeVisitas} />
        </div>

        {/* Lo que va completando la cuenta, a la derecha: los primeros
            pasos con su barra y lo que le falta a la ficha. */}
        {hayColumnaDerecha && (
          <div className="flex min-w-0 flex-col gap-6">
            <PrimerosPasos pasos={pasosIniciales} />
            <BarraProgreso porcentaje={porcentaje} huecos={huecos} />
          </div>
        )}
      </div>

      <Recomendaciones recomendaciones={obtenerRecomendaciones()} />
    </div>
  );
}
