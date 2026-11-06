import { Link } from "@/i18n/navigation";
import { getTranslations } from "next-intl/server";
import { AvisoError, AvisoExito } from "@/components/AvisoError";
import { CerrarSesionBoton } from "@/components/CerrarSesionBoton";
import { obtenerUsuariosPorRol } from "@/lib/admin-users";
import { obtenerActividadPorClub } from "@/lib/admin-actividad-clubes";
import { clubRowToProfile, type ClubRow } from "@/lib/club-mappers";
import type { SubscriptionStatus } from "@/lib/subscription-mappers";
import { createAdminClient } from "@/lib/supabase/admin";
import { accesoAdminDeLaPagina } from "@/lib/acceso-admin-servidor";
import { BANDERA_DEL_PAIS, PAISES, esPaisValido } from "@/lib/paises";
import { SITE_URL } from "@/lib/site";
import { convieneEscribirle } from "@/lib/avance-club";
import { AdminNav } from "../components/AdminNav";
import { FilaClub } from "./components/FilaClub";
import type { ClubAdminRow } from "./types";
import { CABECERA_TABLA } from "../components/estilos";

/** `clubs.select("*")` con las columnas de Fases 10 y 12 que `ClubRow` no modela (esas viven aparte, en `subscription-mappers.ts`, porque `clubRowToProfile` no las necesita). */
type ClubRowConAdmin = ClubRow & {
  subscription_status: SubscriptionStatus;
  admin_suspended: boolean;
  admin_test_mode: boolean | null;
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
/** Si cada aviso es bueno o malo; el texto está en `admin.clubes.avisos`. */
const AVISOS: Record<string, { bien: boolean }> = {
  suspendido: { bien: true },
  reactivado: { bien: true },
  "modo-pruebas": { bien: true },
  "fuera-de-pruebas": { bien: true },
  verificado: { bien: true },
  "sin-verificar": { bien: true },
  regalado: { bien: true },
  "pais-cambiado": { bien: true },
  "pasado-a-seis-meses": { bien: true },
  "sin-plazas-piloto": { bien: false },
  "sin-ficha": { bien: false },
  "paga-stripe": { bien: false },
  fecha: { bien: false },
  "no-admin": { bien: false },
};

export default async function AdminClubesPage({
  searchParams,
}: {
  searchParams: Promise<{ aviso?: string; buscar?: string; pais?: string; atascados?: string }>;
}) {
  const { aviso, buscar, pais: paisPedido, atascados } = await searchParams;
  const soloAtascados = atascados === "1";
  const busqueda = (buscar ?? "").trim().toLowerCase();
  const t = await getTranslations("admin.clubes");
  const tPais = await getTranslations("admin.paises");
  const mensaje =
    aviso && AVISOS[aviso] ? { texto: t(`avisos.${aviso}` as "avisos.suspendido"), bien: AVISOS[aviso].bien } : undefined;
  // Administrador: todos los países, con filtro. Representante: solo el
  // suyo, diga lo que diga la dirección.
  const acceso = await accesoAdminDeLaPagina();
  const esAdministrador = acceso.tipo === "admin";
  const paisFiltro = acceso.tipo === "representante" ? acceso.pais : esPaisValido(paisPedido) ? paisPedido : null;

  const admin = createAdminClient();
  const [todos, representantes] = await Promise.all([
    obtenerUsuariosPorRol("club"),
    obtenerUsuariosPorRol("representante"),
  ]);
  const usuarios = paisFiltro ? todos.filter((usuario) => usuario.pais === paisFiltro) : todos;

  // Los clubes que entraron por el enlace propio de un representante
  // (`?a=BR1`): solo es un dato, la comisión es de todo su país.
  const representantePorCodigo = new Map(
    representantes
      .filter((representante) => typeof representante.appMetadata.codigo === "string")
      .map((representante) => [String(representante.appMetadata.codigo), representante.email ?? "un representante"]),
  );
  const ids = usuarios.map((usuario) => usuario.id);

  // El porcentaje de ficha rellenada ya viene calculado en la propia
  // fila del club (`profile_score`, migración 0020), así que aquí no
  // hace falta traerse equipos ni patrocinadores.
  const { data: filasClubes } =
    ids.length > 0
      ? await admin.from("clubs").select("*").in("id", ids).returns<ClubRowConAdmin[]>()
      : { data: [] as ClubRowConAdmin[] };

  const clubesPorId = new Map((filasClubes ?? []).map((fila) => [fila.id, fila]));
  const [actividad, { data: oportunidades }, { data: dossiers }] = await Promise.all([
    obtenerActividadPorClub(ids),
    // Para el avance de cada club: sus oportunidades publicadas y si ha
    // preparado el dossier.
    ids.length > 0
      ? admin
          .from("opportunities")
          .select("club_id, idea_id")
          .in("club_id", ids)
          .eq("status", "available")
          .is("archived_at", null)
          .returns<{ club_id: string; idea_id: string | null }[]>()
      : Promise.resolve({ data: [] as { club_id: string; idea_id: string | null }[] }),
    ids.length > 0
      ? admin.from("club_dossiers").select("id, share_enabled").in("id", ids).returns<{ id: string; share_enabled: boolean }[]>()
      : Promise.resolve({ data: [] as { id: string; share_enabled: boolean }[] }),
  ]);
  const oportunidadesPorClub = new Map<string, { total: number; generadas: number }>();
  for (const oportunidad of oportunidades ?? []) {
    const cuenta = oportunidadesPorClub.get(oportunidad.club_id) ?? { total: 0, generadas: 0 };
    cuenta.total += 1;
    if (oportunidad.idea_id) cuenta.generadas += 1;
    oportunidadesPorClub.set(oportunidad.club_id, cuenta);
  }
  const dossierPorClub = new Map((dossiers ?? []).map((dossier) => [dossier.id, dossier.share_enabled]));

  const filas: ClubAdminRow[] = usuarios
    .map((usuario) => {
      const filaClub = clubesPorId.get(usuario.id);
      const perfil = filaClub ? clubRowToProfile(filaClub) : null;

      return {
        id: usuario.id,
        name: perfil?.name || t("perfilSinCompletar"),
        city: perfil?.city ?? "—",
        email: usuario.email,
        contactoNombre: perfil?.contactName ?? null,
        telefono: perfil?.contactPhone ?? null,
        // Fecha de alta real (registro en Auth), no la de la primera vez
        // que guardó su perfil.
        createdAt: usuario.createdAt,
        subscriptionStatus: filaClub?.subscription_status ?? null,
        trialEndsAt: filaClub?.trial_ends_at ?? null,
        tieneSuscripcionEnStripe: Boolean(filaClub?.stripe_subscription_id),
        profileCompletion: perfil?.profileScore ?? 0,
        verified: perfil?.verified ?? false,
        suspended: filaClub?.admin_suspended ?? false,
        modoPruebas: filaClub?.admin_test_mode ?? false,
        piloto: usuario.piloto,
        origenCampana: usuario.origenCampana,
        pais: usuario.pais,
        traidoPor: usuario.origenCampana ? (representantePorCodigo.get(usuario.origenCampana) ?? null) : null,
        avance: {
          correoConfirmado: usuario.correoConfirmado,
          ficha: perfil?.profileScore ?? 0,
          oportunidades: oportunidadesPorClub.get(usuario.id)?.total ?? 0,
          generadas: oportunidadesPorClub.get(usuario.id)?.generadas ?? 0,
          dossier: dossierPorClub.has(usuario.id),
          enlaceDossier: dossierPorClub.get(usuario.id) === true,
          ultimoAcceso: usuario.ultimoAcceso,
        },
        visitas: actividad.get(usuario.id)?.visitas ?? 0,
        empresas: actividad.get(usuario.id)?.empresas ?? 0,
        contactos: actividad.get(usuario.id)?.contactos ?? 0,
      } satisfies ClubAdminRow;
    })
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  // Filtro por nombre, localidad o correo. Va por la dirección
  // (`?buscar=`) y no con JavaScript: así el resultado se puede
  // guardar en favoritos y recargar, y funciona igual en el móvil.
  const porEscribir = filas.filter((fila) => !fila.suspended && convieneEscribirle(fila.avance));
  const visiblesPorTexto = busqueda
    ? filas.filter((fila) =>
        [fila.name, fila.city, fila.email, fila.contactoNombre, fila.telefono].some((campo) =>
          (campo ?? "").toLowerCase().includes(busqueda),
        ),
      )
    : filas;
  // "Los que conviene escribir": les falta algún paso y llevan una semana
  // sin entrar (o no han entrado nunca).
  const visibles = soloAtascados ? visiblesPorTexto.filter((fila) => porEscribir.includes(fila)) : visiblesPorTexto;

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 bg-zinc-50 px-4 sm:px-6 py-8">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-teal-700">{t("panelDeAdministracion")}</p>
          <h1 className="mt-1 text-2xl font-semibold text-zinc-900">
            {paisFiltro ? (
              <>
                {t("tituloDePais", { pais: paisFiltro })}{" "}
                <span aria-hidden="true">{BANDERA_DEL_PAIS[paisFiltro]}</span>
              </>
            ) : (
              t("clubes")
            )}
          </h1>
        </div>
        <CerrarSesionBoton />
      </div>

      <AdminNav activo="clubes" esAdministrador={esAdministrador} />

      {/* El enlace propio del representante: los clubes que entren por
          él salen marcados con su nombre en la lista. */}
      {acceso.tipo === "representante" && acceso.codigo && (
        <div className="rounded-xl border border-zinc-200 bg-white p-4 text-sm text-zinc-700">
          <p className="font-medium text-zinc-900">{t("tuEnlace")}</p>
          <p className="mt-1 break-all font-mono text-xs text-accion-tinta">
            {SITE_URL}/{acceso.pais === "BR" ? "br" : acceso.pais === "PT" ? "pt" : "es"}/6mesesgratis?a={acceso.codigo}
          </p>
          <p className="mt-1 text-xs text-zinc-500">
            {t("tuEnlaceTexto")}
          </p>
        </div>
      )}

      {/* Los clubes que se han atascado: a quién escribir hoy. */}
      {porEscribir.length > 0 && (
        <div className="flex flex-wrap items-center gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          <p className="flex-1">
            <span className="font-semibold">{t("avance.porEscribir", { n: porEscribir.length })}</span>{" "}
            {t("avance.porEscribirTexto")}
          </p>
          {soloAtascados ? (
            <Link href="/admin/clubes" className="font-medium text-amber-900 underline">
              {t("verTodos")}
            </Link>
          ) : (
            <Link
              href={{ pathname: "/admin/clubes", query: { atascados: "1", ...(paisFiltro && esAdministrador ? { pais: paisFiltro } : {}) } }}
              className="rounded-lg bg-aviso px-3 py-1.5 font-medium text-sobre-aviso hover:opacity-90"
            >
              {t("avance.verlos")}
            </Link>
          )}
        </div>
      )}

      {mensaje &&
        (mensaje.bien ? (
          <AvisoExito mensaje={mensaje.texto} />
        ) : (
          <AvisoError mensaje={mensaje.texto} />
        ))}

      {(filas.length > 0 || paisFiltro) && (
        <form className="flex flex-wrap items-center gap-2">
          <label htmlFor="buscar-club" className="sr-only">
            {t("buscarEtiqueta")}
          </label>
          <input
            id="buscar-club"
            name="buscar"
            type="search"
            defaultValue={buscar ?? ""}
            placeholder={t("buscarPlaceholder")}
            className="w-full max-w-xs rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-accion-tinta focus:outline-none focus:ring-1 focus:ring-accion-tinta"
          />
          {esAdministrador && (
            <>
              <label htmlFor="pais-club" className="sr-only">
                {t("paisEtiqueta")}
              </label>
              <select
                id="pais-club"
                name="pais"
                defaultValue={paisFiltro ?? ""}
                className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm shadow-sm"
              >
                <option value="">{t("todosLosPaises")}</option>
                {PAISES.map((pais) => (
                  <option key={pais} value={pais}>
                    {tPais(pais)} ({todos.filter((usuario) => usuario.pais === pais).length})
                  </option>
                ))}
              </select>
            </>
          )}
          <button
            type="submit"
            className="rounded-lg bg-brand-teal-dark px-4 py-2 text-sm font-medium text-sobre-color transition-colors hover:bg-brand-navy"
          >
            {t("buscar")}
          </button>
          {(busqueda || (esAdministrador && paisFiltro)) && (
            <>
              <Link
                href="/admin/clubes"
                className="rounded-lg border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-700 shadow-sm hover:bg-zinc-100"
              >
                {t("verTodos")}
              </Link>
              <span className="text-sm text-zinc-500">
                {t("cuantos", { visibles: visibles.length, total: filas.length })}
              </span>
            </>
          )}
        </form>
      )}

      {filas.length === 0 ? (
        <p className="text-sm text-zinc-500">{t("todaviaNoSeHa")}</p>
      ) : visibles.length === 0 ? (
        <p className="text-sm text-zinc-500">
          {t("ningunoCoincide", { busqueda: buscar ?? "" })}
        </p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-zinc-200 bg-white">
          <table className="w-full min-w-[840px] text-left text-sm">
            <thead className={CABECERA_TABLA}>
              <tr>
                <th className="px-4 py-3 font-medium">{t("club")}</th>
                <th className="px-4 py-3 font-medium">{t("alta")}</th>
                <th className="px-4 py-3 font-medium">{t("avance.columna")}</th>
                <th className="px-4 py-3 font-medium">{t("actividad90")}</th>
                <th className="px-4 py-3 font-medium">{t("suscripcion")}</th>
                <th className="px-4 py-3 font-medium">{t("estado")}</th>
                <th className="px-4 py-3 font-medium">{t("acciones")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {visibles.map((fila) => (
                <FilaClub key={fila.id} fila={fila} esAdministrador={esAdministrador} />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
