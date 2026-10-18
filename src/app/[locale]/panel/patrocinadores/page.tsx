import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { redirect } from "@/i18n/navigation";
import { getLocale } from "next-intl/server";
import { clubSponsorRowToSponsor, type ClubSponsorRow } from "@/lib/club-mappers";
import { documentosDelClub } from "@/lib/documentos-datos";
import { createClient } from "@/lib/supabase/server";
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
  const t = await getTranslations("panel.patrocinadores");
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

  // Los papeles de cada patrocinio (migración 0051). Se piden todos de
  // una vez y se reparten, en vez de una consulta por empresa. Van como
  // objeto llano porque cruzan al componente de cliente, y un `Map` no
  // cruza esa frontera.
  const documentos = Object.fromEntries(await documentosDelClub(supabase, user.id));

  return (
    <div className="flex w-full flex-1 flex-col gap-6 py-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-teal-700">{t("panelClub")}</p>
          <h1 className="mt-1 text-2xl font-semibold text-zinc-900">{t("patrocinadores")}</h1>
          <p className="mt-1 max-w-2xl text-sm text-zinc-600">
            {t("empresasYaColaboranContigo")}
          </p>
        </div>
      </div>


      {/* Sin club creado no hay a qué colgar un patrocinador: la fila
          necesita un `club_id` que todavía no existe. */}
      {!filaClub ? (
        <div className="tonal tonal-auto rounded-xl border border-(--tono-borde) border-l-[6px] border-l-(--tono-fuerte) bg-white shadow-sm p-6 text-sm text-zinc-600">
          {t.rich("completaIdentidad", {
            enlace: (trozo) => (
              <Link href="/panel" className="font-medium text-teal-700 hover:underline">
                {trozo}
              </Link>
            ),
          })}
        </div>
      ) : (
        <PatrocinadoresForm
          userId={user.id}
          patrocinadores={patrocinadores}
          documentos={documentos}
        />
      )}
    </div>
  );
}
