import { Link } from "@/i18n/navigation";
import { redirect } from "@/i18n/navigation";
import { getLocale, getTranslations } from "next-intl/server";
import { requisitosDelClub } from "@/lib/catalogo-ideas";
import {
  clubRowToProfile,
  clubTeamRowToTeam,
  type ClubRow,
  type ClubTeamRow,
} from "@/lib/club-mappers";
import {
  opportunityRowToOpportunity,
  type OpportunityRow,
} from "@/lib/opportunity-mappers";
import { createClient } from "@/lib/supabase/server";
import { OportunidadesManager } from "./components/OportunidadesManager";

export default async function OportunidadesPage() {
  const t = await getTranslations("panel.oportunidades");
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
    { data: filasOportunidades },
    { data: filasEquipos },
  ] = await Promise.all([
    supabase.from("clubs").select("*").eq("id", user.id).maybeSingle<ClubRow>(),
    supabase
      .from("opportunities")
      .select("*")
      .eq("club_id", user.id)
      .order("created_at", { ascending: false })
      .returns<OpportunityRow[]>(),
    // Los equipos del club se cargan aquí para poder asociar una
    // oportunidad a uno concreto (primer equipo, un equipo de cantera).
    supabase
      .from("club_teams")
      .select("*")
      .eq("club_id", user.id)
      .order("created_at", { ascending: true })
      .returns<ClubTeamRow[]>(),
  ]);

  const perfil = filaClub ? clubRowToProfile(filaClub) : null;
  const oportunidades = (filasOportunidades ?? []).map(
    opportunityRowToOpportunity,
  );
  const equipos = (filasEquipos ?? []).map(clubTeamRowToTeam);

  // Qué ideas del catálogo puede ofrecer de verdad este club. Se calcula
  // aquí, en el servidor, y viaja como una lista corta: el catálogo
  // entero es del código, no hace falta traérselo de ningún sitio.
  const requisitos = [...requisitosDelClub(perfil, equipos)];

  return (
    <div className="flex w-full flex-1 flex-col gap-6 py-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-teal-700">
            {t("panelDelClub")}
          </p>
          <h1 className="mt-1 text-2xl font-semibold text-zinc-900">
            {t("oportunidadesDePatrocinio")}
          </h1>
          <p className="mt-1 max-w-2xl text-sm text-zinc-600">{t("introPagina")}</p>
        </div>
      </div>

      {!perfil ? (
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
        <OportunidadesManager
          oportunidades={oportunidades}
          equipos={equipos}
          requisitos={requisitos}
          /* Para el botón de ver la oportunidad como la ve una
             empresa. Va en `null` mientras el club no haya guardado
             su ficha: sin ficha no hay página pública a la que ir. */
          slugDelClub={perfil?.slug ?? null}
          userId={user.id}
        />
      )}
    </div>
  );
}
