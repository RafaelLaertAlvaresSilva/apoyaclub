import { Link, redirect } from "@/i18n/navigation";
import { getLocale, getTranslations } from "next-intl/server";
import { AvisoError, AvisoExito } from "@/components/AvisoError";
import { CerrarSesionBoton } from "@/components/CerrarSesionBoton";
import { obtenerUsuariosPorRol } from "@/lib/admin-users";
import { obtenerActividadPorClub } from "@/lib/admin-actividad-clubes";
import { clubRowToProfile, type ClubRow } from "@/lib/club-mappers";
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
  trial_ends_at: string | null;
  stripe_subscription_id: string | null;
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
const AVISOS: Record<string, { texto: string; bien: boolean }> = {
  suspendido: {
    texto: "Club suspendido. Su página pública ya no se ve y no puede entrar a su panel.",
    bien: true,
  },
  reactivado: { texto: "Club reactivado. Vuelve a tener su página y su panel.", bien: true },
  verificado: { texto: "Club verificado. Ya le sale la insignia en su página.", bien: true },
  "sin-verificar": { texto: "Verificación quitada.", bien: true },
  regalado: {
    texto: "Listo. Ese club ya tiene el acceso gratuito hasta la fecha que has puesto.",
    bien: true,
  },
  "sin-ficha": {
    texto:
      "Ese club todavía no ha guardado su ficha, así que no hay dónde apuntarle el acceso. En cuanto entre en su panel y guarde al menos el nombre y la localidad, podrás regalárselo.",
    bien: false,
  },
  "paga-stripe": {
    texto:
      "Ese club tiene una suscripción activa en Stripe y no se le puede poner una prueba por encima: la plataforma diría una cosa y Stripe estaría cobrando otra. Tendría que cancelarla él desde su panel.",
    bien: false,
  },
  fecha: {
    texto: "Pon una fecha de hoy en adelante: con una fecha pasada le estarías quitando el acceso.",
    bien: false,
  },
  "no-admin": {
    texto: "Tu sesión ha caducado. Vuelve a iniciar sesión e inténtalo otra vez.",
    bien: false,
  },
};

export default async function AdminClubesPage({
  searchParams,
}: {
  searchParams: Promise<{ aviso?: string; buscar?: string }>;
}) {
  const { aviso, buscar } = await searchParams;
  const busqueda = (buscar ?? "").trim().toLowerCase();
  const mensaje = aviso ? AVISOS[aviso] : undefined;
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

  // El porcentaje de ficha rellenada ya viene calculado en la propia
  // fila del club (`profile_score`, migración 0020), así que aquí no
  // hace falta traerse equipos ni patrocinadores.
  const { data: filasClubes } =
    ids.length > 0
      ? await admin.from("clubs").select("*").in("id", ids).returns<ClubRowConAdmin[]>()
      : { data: [] as ClubRowConAdmin[] };

  const clubesPorId = new Map((filasClubes ?? []).map((fila) => [fila.id, fila]));
  const actividad = await obtenerActividadPorClub(ids);

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
        trialEndsAt: filaClub?.trial_ends_at ?? null,
        tieneSuscripcionEnStripe: Boolean(filaClub?.stripe_subscription_id),
        profileCompletion: perfil?.profileScore ?? 0,
        verified: perfil?.verified ?? false,
        suspended: filaClub?.admin_suspended ?? false,
        visitas: actividad.get(usuario.id)?.visitas ?? 0,
        empresas: actividad.get(usuario.id)?.empresas ?? 0,
        contactos: actividad.get(usuario.id)?.contactos ?? 0,
      } satisfies ClubAdminRow;
    })
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  // Filtro por nombre, localidad o correo. Va por la dirección
  // (`?buscar=`) y no con JavaScript: así el resultado se puede
  // guardar en favoritos y recargar, y funciona igual en el móvil.
  const visibles = busqueda
    ? filas.filter((fila) =>
        [fila.name, fila.city, fila.email].some((campo) =>
          (campo ?? "").toLowerCase().includes(busqueda),
        ),
      )
    : filas;

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 bg-zinc-50 px-4 sm:px-6 py-8">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-teal-700">{t("panelDeAdministracion")}</p>
          <h1 className="mt-1 text-2xl font-semibold text-zinc-900">{t("clubes")}</h1>
        </div>
        <CerrarSesionBoton />
      </div>

      <AdminNav activo="clubes" />

      {mensaje &&
        (mensaje.bien ? (
          <AvisoExito mensaje={mensaje.texto} />
        ) : (
          <AvisoError mensaje={mensaje.texto} />
        ))}

      {filas.length > 0 && (
        <form className="flex flex-wrap items-center gap-2">
          <label htmlFor="buscar-club" className="sr-only">
            Buscar un club por nombre, localidad o correo
          </label>
          <input
            id="buscar-club"
            name="buscar"
            type="search"
            defaultValue={buscar ?? ""}
            placeholder="Nombre, localidad o correo"
            className="w-full max-w-xs rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-brand-teal-dark focus:outline-none focus:ring-1 focus:ring-brand-teal-dark"
          />
          <button
            type="submit"
            className="rounded-lg bg-brand-teal-dark px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-brand-navy"
          >
            Buscar
          </button>
          {busqueda && (
            <>
              <Link
                href="/admin/clubes"
                className="rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-100"
              >
                Ver todos
              </Link>
              <span className="text-sm text-zinc-500">
                {visibles.length} de {filas.length}
              </span>
            </>
          )}
        </form>
      )}

      {filas.length === 0 ? (
        <p className="text-sm text-zinc-500">{t("todaviaNoSeHa")}</p>
      ) : visibles.length === 0 ? (
        <p className="text-sm text-zinc-500">
          Ningún club coincide con «{buscar}».
        </p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-zinc-200 bg-white">
          <table className="w-full min-w-[840px] text-left text-sm">
            <thead className="border-b border-zinc-200 bg-zinc-50 text-xs uppercase tracking-wide text-zinc-500">
              <tr>
                <th className="px-4 py-3 font-medium">{t("club")}</th>
                <th className="px-4 py-3 font-medium">{t("alta")}</th>
                <th className="px-4 py-3 font-medium">{t("perfil")}</th>
                <th className="px-4 py-3 font-medium">Actividad 90d</th>
                <th className="px-4 py-3 font-medium">{t("suscripcion")}</th>
                <th className="px-4 py-3 font-medium">{t("estado")}</th>
                <th className="px-4 py-3 font-medium">{t("acciones")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {visibles.map((fila) => (
                <FilaClub key={fila.id} fila={fila} />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
