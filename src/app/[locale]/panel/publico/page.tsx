import { getLocale } from "next-intl/server";
import { redirect } from "@/i18n/navigation";
import { CerrarSesionBoton } from "@/components/CerrarSesionBoton";
import { etiquetaEquipo } from "@/lib/opportunities";
import { obtenerPartidosDelClub } from "@/lib/partidos-datos";
import { createClient } from "@/lib/supabase/server";
import { PanelNav } from "../components/PanelNav";
import { RegistroDePublico } from "./components/RegistroDePublico";

type FilaEquipo = { id: string; sport: string; category: string | null; gender: string | null };

/**
 * El registro de público en los partidos (migración 0037).
 *
 * Antes de esto, la asistencia media de la ficha era un número escrito
 * a mano y punto. Una empresa no tiene forma de distinguir un recuento
 * de una corazonada, y el club que sí cuenta a su gente no tenía manera
 * de demostrarlo. Aquí se apunta partido a partido y de ahí salen la
 * media, el total de la temporada y el mejor partido.
 */
export default async function PublicoPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    const locale = await getLocale();
    return redirect({ href: "/login", locale });
  }

  const [partidos, { data: club }, { data: equipos }] = await Promise.all([
    obtenerPartidosDelClub(supabase, user.id),
    supabase
      .from("clubs")
      .select("average_attendance")
      .eq("id", user.id)
      .maybeSingle<{ average_attendance: number | null }>(),
    supabase
      .from("club_teams")
      .select("id, sport, category, gender")
      .eq("club_id", user.id)
      .order("created_at", { ascending: true })
      .returns<FilaEquipo[]>(),
  ]);

  // Los equipos de la ficha, que es lo que se elige en el desplegable.
  //
  // Esta consulta pedía antes una columna `name` que `club_teams` no
  // tiene: un equipo se llama por su deporte, su categoría y su sexo.
  // Fallaba en silencio, la lista salía vacía y el club acababa
  // escribiendo el nombre a mano, distinto cada vez.
  const equiposDelClub = (equipos ?? []).map((equipo) => ({
    id: equipo.id,
    etiqueta: etiquetaEquipo(equipo) ?? equipo.sport,
  }));

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-6 bg-zinc-50 px-4 sm:px-6 py-8">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-teal-700">Panel del club</p>
          <h1 className="mt-1 text-2xl font-semibold text-zinc-900">Público en los partidos</h1>
          <p className="mt-1 text-sm text-zinc-600">
            Apunta cuánta gente hubo en cada partido. Con eso, la asistencia media de tu ficha deja
            de ser un número puesto a ojo y pasa a ser un dato que puedes defender delante de una
            empresa.
          </p>
        </div>
        <CerrarSesionBoton />
      </div>

      <PanelNav activo="publico" />

      <RegistroDePublico
        partidos={partidos}
        equiposDelClub={equiposDelClub}
        mediaEnLaFicha={club?.average_attendance ?? null}
      />
    </div>
  );
}
