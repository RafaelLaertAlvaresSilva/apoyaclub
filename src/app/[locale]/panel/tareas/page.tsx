import { redirect } from "@/i18n/navigation";
import { getLocale } from "next-intl/server";
import { CerrarSesionBoton } from "@/components/CerrarSesionBoton";
import { createClient } from "@/lib/supabase/server";
import { hoyISO } from "@/lib/tareas-patrocinio";
import { obtenerTareasDelClub, obtenerUltimosInformes } from "@/lib/tareas-datos";
import type { ClubSponsorRow } from "@/lib/club-mappers";
import { PanelNav } from "../components/PanelNav";
import { TareasDeHoy } from "../components/TareasDeHoy";
import { RecordatorioInforme } from "./components/RecordatorioInforme";
import { TareasManager } from "./components/TareasManager";

/**
 * La agenda de compromisos con los patrocinadores (migración 0030).
 *
 * Vive en el panel del club y no la ve nadie más: ni el público, ni las
 * empresas. Es la libreta del club, no un escaparate.
 */
export default async function TareasPage() {
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
      .select("name")
      .eq("club_id", user.id)
      .returns<Pick<ClubSponsorRow, "name">[]>(),
  ]);

  // Para el desplegable de empresas: las que ya tiene como
  // patrocinadores en su ficha, más las que haya escrito antes aquí.
  const empresasConocidas = [
    ...new Set([
      ...(patrocinadores ?? []).map((patrocinador) => patrocinador.name.trim()),
      ...tareas.map((tarea) => tarea.empresa.trim()),
    ]),
  ]
    .filter(Boolean)
    .sort((a, b) => a.localeCompare(b, "es"));

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-6 bg-zinc-50 px-4 py-8">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-teal-700">Panel del club</p>
          <h1 className="mt-1 text-2xl font-semibold text-zinc-900">Tareas con tus patrocinadores</h1>
          <p className="mt-1 text-sm text-zinc-600">
            Lo que le has prometido a cada empresa y para cuándo. Es lo que hace que en junio puedas
            enseñar qué recibieron a cambio — y que renueven.
          </p>
        </div>
        <CerrarSesionBoton />
      </div>

      <PanelNav activo="tareas" />

      <TareasDeHoy tareas={tareas} />

      <RecordatorioInforme tareas={tareas} ultimosInformes={ultimosInformes} hoy={hoyISO()} />

      <TareasManager tareas={tareas} empresasConocidas={empresasConocidas} />
    </div>
  );
}
