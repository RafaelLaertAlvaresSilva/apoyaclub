import { Link } from "@/i18n/navigation";
import { redirect } from "@/i18n/navigation";
import { getLocale } from "next-intl/server";
import { CerrarSesionBoton } from "@/components/CerrarSesionBoton";
import { clubSponsorRowToSponsor, type ClubSponsorRow } from "@/lib/club-mappers";
import { createClient } from "@/lib/supabase/server";
import { PanelNav } from "../components/PanelNav";
import { PatrocinadoresForm } from "../components/PatrocinadoresForm";

/**
 * Los patrocinadores del club, en su propia sección del panel.
 *
 * Antes eran una pestaña más dentro del perfil, entre "Comunidad" y
 * "Servicios que buscamos". Estaba mal puesto: rellenar la ficha se
 * hace una vez, pero los patrocinadores se tocan durante toda la
 * temporada —entra uno nuevo, se le manda el agradecimiento, se
 * reordenan— y eso no puede vivir escondido en la novena pestaña de
 * otra cosa.
 */
export default async function PatrocinadoresPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    const locale = await getLocale();
    return redirect({ href: "/login", locale });
  }

  const [{ data: filaClub }, { data: filasPatrocinadores }] = await Promise.all([
    supabase.from("clubs").select("id").eq("id", user.id).maybeSingle<{ id: string }>(),
    supabase
      .from("club_sponsors")
      .select("*")
      .eq("club_id", user.id)
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: true })
      .returns<ClubSponsorRow[]>(),
  ]);

  const patrocinadores = (filasPatrocinadores ?? []).map(clubSponsorRowToSponsor);

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-6 bg-zinc-50 px-4 sm:px-6 py-8">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-teal-700">Panel del club</p>
          <h1 className="mt-1 text-2xl font-semibold text-zinc-900">Patrocinadores</h1>
          <p className="mt-1 max-w-2xl text-sm text-zinc-600">
            Las empresas que ya colaboran contigo. Salen en tu página pública y en tu dossier, y son
            la mejor carta de presentación ante la siguiente: que otros ya estén dentro es lo que
            más convence a quien todavía no lo está.
          </p>
        </div>
        <CerrarSesionBoton />
      </div>

      <PanelNav activo="patrocinadores" />

      {/* Sin club creado no hay a qué colgar un patrocinador: la fila
          necesita un `club_id` que todavía no existe. */}
      {!filaClub ? (
        <div className="rounded-xl border border-zinc-200 bg-white p-6 text-sm text-zinc-600">
          Completa primero la identidad de tu club (nombre y localidad) en{" "}
          <Link href="/panel" className="font-medium text-teal-700 hover:underline">
            tu perfil
          </Link>{" "}
          y podrás añadir tus patrocinadores.
        </div>
      ) : (
        <PatrocinadoresForm userId={user.id} patrocinadores={patrocinadores} />
      )}
    </div>
  );
}
