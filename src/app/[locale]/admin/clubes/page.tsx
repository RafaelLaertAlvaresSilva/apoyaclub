import { redirect } from "@/i18n/navigation";
import { getLocale, getTranslations } from "next-intl/server";
import { CerrarSesionBoton } from "@/components/CerrarSesionBoton";
import { obtenerUsuariosPorRol } from "@/lib/admin-users";
import {
  clubRowToProfile,
  clubSponsorRowToSponsor,
  clubTeamRowToTeam,
  type ClubRow,
  type ClubSponsorRow,
  type ClubTeamRow,
} from "@/lib/club-mappers";
import { calcularPorcentajeCompletado } from "@/lib/profile-completion";
import type { SubscriptionStatus } from "@/lib/subscription-mappers";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { AdminNav } from "../components/AdminNav";
import { FilaClub } from "./components/FilaClub";
import type { ClubAdminRow } from "./types";

/** `clubs.select("*")` con las columnas de Fases 10 y 12 que `ClubRow` no modela (esas viven aparte, en `subscription-mappers.ts`, porque `clubRowToProfile` no las necesita). */
type ClubRowConAdmin = ClubRow & {
  subscription_status: SubscriptionStatus;
  admin_suspended: boolean;
};

/**
 * Listado de clubes para el admin: suscripción, alta, perfil completado
 * y moderación (Fase 12).
 *
 * La lista de partida son las cuentas con rol "club" en Supabase Auth
 * (`obtenerUsuariosPorRol`), no las filas de `clubs`: esa tabla se crea
 * con `upsert` la primera vez que el club guarda su perfil (Fase 4), así
 * que un club recién registrado que todavía no ha abierto su panel no
 * tiene fila ahí y, aun así, tiene que aparecer en este listado (con
 * 0% de perfil y sin suscripción).
 */
export default async function AdminClubesPage() {
  const t = await getTranslations("admin.clubes");
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // El layout ya protege esta ruta; esta comprobación es una segunda
  // capa de seguridad por si se renderiza en otro contexto.
  if (!user) {
    const locale = await getLocale();
    return redirect({ href: "/login", locale });
  }

  const admin = createAdminClient();
  const usuarios = await obtenerUsuariosPorRol("club");
  const ids = usuarios.map((usuario) => usuario.id);

  const [{ data: filasClubes }, { data: filasEquipos }, { data: filasPatrocinadores }] =
    ids.length > 0
      ? await Promise.all([
          admin.from("clubs").select("*").in("id", ids).returns<ClubRowConAdmin[]>(),
          admin.from("club_teams").select("*").in("club_id", ids).returns<ClubTeamRow[]>(),
          admin.from("club_sponsors").select("*").in("club_id", ids).returns<ClubSponsorRow[]>(),
        ])
      : [{ data: [] as ClubRowConAdmin[] }, { data: [] as ClubTeamRow[] }, { data: [] as ClubSponsorRow[] }];

  const clubesPorId = new Map((filasClubes ?? []).map((fila) => [fila.id, fila]));

  const equiposPorClub = new Map<string, ReturnType<typeof clubTeamRowToTeam>[]>();
  for (const fila of filasEquipos ?? []) {
    const equipo = clubTeamRowToTeam(fila);
    equiposPorClub.set(equipo.clubId, [...(equiposPorClub.get(equipo.clubId) ?? []), equipo]);
  }

  const patrocinadoresPorClub = new Map<string, ReturnType<typeof clubSponsorRowToSponsor>[]>();
  for (const fila of filasPatrocinadores ?? []) {
    const patrocinador = clubSponsorRowToSponsor(fila);
    patrocinadoresPorClub.set(patrocinador.clubId, [
      ...(patrocinadoresPorClub.get(patrocinador.clubId) ?? []),
      patrocinador,
    ]);
  }

  const filas: ClubAdminRow[] = usuarios
    .map((usuario) => {
      const filaClub = clubesPorId.get(usuario.id);
      const perfil = filaClub ? clubRowToProfile(filaClub) : null;

      return {
        id: usuario.id,
        name: perfil?.name || "(perfil sin completar)",
        city: perfil?.city ?? "—",
        email: usuario.email,
        // Fecha de alta real (registro en Auth), no la de la primera vez
        // que guardó su perfil.
        createdAt: usuario.createdAt,
        subscriptionStatus: filaClub?.subscription_status ?? null,
        profileCompletion: perfil
          ? calcularPorcentajeCompletado(
              perfil,
              equiposPorClub.get(usuario.id) ?? [],
              patrocinadoresPorClub.get(usuario.id) ?? [],
            )
          : 0,
        verified: perfil?.verified ?? false,
        suspended: filaClub?.admin_suspended ?? false,
      } satisfies ClubAdminRow;
    })
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 bg-zinc-50 px-4 py-8">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-teal-700">{t("panelDeAdministracion")}</p>
          <h1 className="mt-1 text-2xl font-semibold text-zinc-900">{t("clubes")}</h1>
        </div>
        <CerrarSesionBoton />
      </div>

      <AdminNav activo="clubes" />

      {filas.length === 0 ? (
        <p className="text-sm text-zinc-500">{t("todaviaNoSeHa")}</p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-zinc-200 bg-white">
          <table className="w-full min-w-[840px] text-left text-sm">
            <thead className="border-b border-zinc-200 bg-zinc-50 text-xs uppercase tracking-wide text-zinc-500">
              <tr>
                <th className="px-4 py-3 font-medium">{t("club")}</th>
                <th className="px-4 py-3 font-medium">{t("alta")}</th>
                <th className="px-4 py-3 font-medium">{t("perfil")}</th>
                <th className="px-4 py-3 font-medium">{t("suscripcion")}</th>
                <th className="px-4 py-3 font-medium">{t("estado")}</th>
                <th className="px-4 py-3 font-medium">{t("acciones")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {filas.map((fila) => (
                <FilaClub key={fila.id} fila={fila} />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
