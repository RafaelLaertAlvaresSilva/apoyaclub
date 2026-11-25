import { getTranslations } from "next-intl/server";
import { redirect } from "@/i18n/navigation";
import { getLocale } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { empresasConocidasDe, hoyISO } from "@/lib/tareas-patrocinio";
import { obtenerTareasDelClub, obtenerUltimosInformes } from "@/lib/tareas-datos";
import type { ClubSponsorRow } from "@/lib/club-mappers";
import { TareasDeHoy } from "../components/TareasDeHoy";
import { RecordatorioInforme } from "./components/RecordatorioInforme";
import { TareasManager } from "./components/TareasManager";
import { tituloDelPanel } from "@/lib/titulo-del-panel";
import { CabeceraDePagina } from "../components/CabeceraDePagina";

export async function generateMetadata() {
  return tituloDelPanel("tareas");
}

/**
 * La agenda de compromisos con los patrocinadores (migración 0030).
 *
 * Vive en el panel del club y no la ve nadie más: ni el público, ni las
 * empresas. Es la libreta del club, no un escaparate.
 */
export default async function TareasPage({
  searchParams,
}: {
  searchParams: Promise<{ empresa?: string | string[] }>;
}) {
  const t = await getTranslations("panel.tareas.cabecera");
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    const locale = await getLocale();
    return redirect({ href: "/login", locale });
  }

  const [tareas, ultimosInformes, { data: patrocinadores }] = await Promise.all([
    obtenerTareasDelClub(supabase, user.id),
    obtenerUltimosInformes(supabase, user.id),
    supabase
      .from("club_sponsors")
      .select("id, name")
      .eq("club_id", user.id)
      .returns<Pick<ClubSponsorRow, "id" | "name">[]>(),
  ]);

  // Las empresas que el club ya conoce: los patrocinadores de su ficha
  // y las que haya escrito aquí alguna vez. Van con su identificador
  // cuando lo tienen, para que la tarea quede enganchada a la ficha del
  // patrocinador y no solo a un nombre escrito.
  const empresasConocidas = empresasConocidasDe(patrocinadores ?? [], tareas);

  // Al cerrar una solicitud, su tarjeta trae aquí con el nombre de la
  // empresa (`?empresa=`): el formulario se abre ya con ella puesta.
  const { empresa } = await searchParams;
  const empresaInicial = (Array.isArray(empresa) ? empresa[0] : empresa)?.trim().slice(0, 120) || null;

  return (
    <div className="flex w-full flex-1 flex-col gap-6 py-6">
      <CabeceraDePagina icono="tareas" etiqueta={t("panel")} titulo={t("titulo")} texto={t("texto")} />


      <TareasDeHoy tareas={tareas} />

      <RecordatorioInforme tareas={tareas} ultimosInformes={ultimosInformes} hoy={hoyISO()} />

      <TareasManager tareas={tareas} empresasConocidas={empresasConocidas} empresaInicial={empresaInicial} />
    </div>
  );
}
