import Image from "next/image";
import { getLocale, getTranslations } from "next-intl/server";
import { Link, redirect } from "@/i18n/navigation";
import { requisitosDelClub } from "@/lib/catalogo-ideas";
import { clubRowToProfile, clubTeamRowToTeam, type ClubRow, type ClubTeamRow } from "@/lib/club-mappers";
import { deporteDeLaLista } from "@/lib/deportes";
import { tieneEjemplo } from "@/lib/ejemplos-club";
import { opportunityRowToOpportunity, type OpportunityRow } from "@/lib/opportunity-mappers";
import { createClient } from "@/lib/supabase/server";
import { EquiposForm } from "../components/EquiposForm";
import { GeneradorDeOportunidades } from "../oportunidades/components/GeneradorDeOportunidades";
import { lineaDeDatosDelClub } from "../oportunidades/linea-de-datos";
import { PasoImagenes } from "./components/PasoImagenes";
import { PasoLoBasico } from "./components/PasoLoBasico";

export async function generateMetadata() {
  const t = await getTranslations("panel.empezar");
  return { title: t("tituloPestana") };
}

/**
 * El asistente de primeros pasos (pedido por Rafael el 27-11-2026).
 *
 * Varios clubes se daban de alta y se quedaban en el 0-20 % de la ficha:
 * el panel les enseñaba todo a la vez (doce apartados, métricas,
 * tareas…) y no sabían por dónde seguir. Aquí van de uno en uno, con lo
 * justo en cada pantalla, y con el club de ejemplo de su deporte al lado
 * para que vean adónde llegan. Rafael quiere que el club lo complete
 * solo, sin que nadie se lo rellene: esto es lo que se lo pone fácil.
 *
 * El paso va en la dirección (`?paso=3`) para que "Atrás", "Seguir" y el
 * botón del navegador funcionen sin más. Cada paso usa los mismos
 * formularios que el resto del panel, salvo el primero, que es la parte
 * mínima de "Identidad" (`guardarLoBasico`).
 */
const PASOS = ["club", "imagenes", "equipos", "oportunidades", "compartir"] as const;
type IdPaso = (typeof PASOS)[number];

export default async function EmpezarPage({ searchParams }: { searchParams: Promise<{ paso?: string | string[] }> }) {
  const t = await getTranslations("panel.empezar");
  const locale = await getLocale();
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return redirect({ href: "/login", locale });

  const [{ data: filaClub }, { data: filasEquipos }, { data: filasOportunidades }, { count: dossiers }] = await Promise.all([
    supabase.from("clubs").select("*").eq("id", user.id).maybeSingle<ClubRow>(),
    supabase.from("club_teams").select("*").eq("club_id", user.id).order("created_at", { ascending: true }).returns<ClubTeamRow[]>(),
    supabase.from("opportunities").select("*").eq("club_id", user.id).order("created_at", { ascending: false }).returns<OpportunityRow[]>(),
    supabase.from("club_dossiers").select("id", { count: "exact", head: true }).eq("id", user.id),
  ]);

  const perfil = filaClub ? clubRowToProfile(filaClub) : null;
  const equipos = (filasEquipos ?? []).map(clubTeamRowToTeam);
  const oportunidades = (filasOportunidades ?? []).map(opportunityRowToOpportunity);
  const publicadas = oportunidades.filter((oportunidad) => !oportunidad.archivedAt).length;

  const hecho: Record<IdPaso, boolean> = {
    club: !!perfil?.name && !!perfil?.description,
    imagenes: !!perfil?.logoUrl && !!perfil?.coverUrl,
    equipos: equipos.length > 0,
    oportunidades: publicadas > 0,
    compartir: (dossiers ?? 0) > 0,
  };
  const hechos = PASOS.filter((id) => hecho[id]).length;

  // Sin ficha guardada solo se puede hacer el primero: los demás guardan
  // sobre la fila del club, que todavía no existe.
  const { paso: pedido } = await searchParams;
  const numeroPedido = Number(Array.isArray(pedido) ? pedido[0] : pedido);
  const primeroPendiente = PASOS.findIndex((id) => !hecho[id]) + 1 || PASOS.length;
  const numero = !perfil ? 1 : numeroPedido >= 1 && numeroPedido <= PASOS.length ? numeroPedido : primeroPendiente;
  const paso = PASOS[numero - 1];

  // El club de ejemplo de su deporte (el de su primer equipo); mientras
  // no tenga ninguno, el de balonmano, que es por donde empezó todo.
  const claveDeporte = equipos.map((equipo) => deporteDeLaLista(equipo.sport)?.clave).find((clave) => tieneEjemplo(clave));
  const ejemplo = claveDeporte ?? "balonmano";
  const portadaEjemplo = ejemplo === "padel" ? "padel-cubierta" : `${ejemplo}-portada`;

  const escondido =
    (filaClub as (ClubRow & { admin_test_mode?: boolean | null; hidden_by_club?: boolean | null }) | null)?.admin_test_mode === true ||
    (filaClub as (ClubRow & { hidden_by_club?: boolean | null }) | null)?.hidden_by_club === true;
  const paginaPublica = perfil?.slug ? (escondido ? `/${locale}/vista-previa` : `/${locale}/club/${perfil.slug}`) : null;

  const botonPrincipal =
    "inline-flex items-center justify-center gap-2 rounded-xl bg-accion px-5 py-3 text-sm font-bold text-sobre-color shadow-sm transition hover:bg-accion-fuerte";
  const botonSecundario =
    "inline-flex items-center justify-center gap-2 rounded-xl border border-zinc-300 bg-white px-5 py-3 text-sm font-semibold text-zinc-700 transition hover:border-accion hover:text-accion-tinta";

  return (
    <div className="flex w-full flex-1 flex-col gap-6 py-6">
      {/* Cabecera con el degradado de la marca, como el inicio. */}
      <section className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-brand-navy via-brand-navy to-brand-teal-dark p-5 shadow-lg shadow-brand-navy/15 sm:p-7">
        <div aria-hidden="true" className="pointer-events-none absolute -right-16 -top-20 h-64 w-64 rounded-full bg-brand-teal/25 blur-3xl" />
        <div className="relative">
          <p className="text-xs font-bold uppercase tracking-wider text-sobre-color/70">{t("etiqueta")}</p>
          <h1 className="mt-1 text-2xl font-extrabold leading-tight tracking-tight text-sobre-color sm:text-3xl">{t("titulo")}</h1>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-sobre-color/85 sm:text-base">{t("subtitulo")}</p>

          <div className="mt-5 flex items-center gap-3">
            <div
              role="progressbar"
              aria-valuemin={0}
              aria-valuemax={PASOS.length}
              aria-valuenow={hechos}
              aria-label={t("deTantos", { hechos, total: PASOS.length })}
              className="h-2.5 flex-1 overflow-hidden rounded-full bg-sobre-color/20"
            >
              <div className="h-full rounded-full bg-medidor transition-[width] duration-700" style={{ width: `${(hechos / PASOS.length) * 100}%` }} />
            </div>
            <p className="text-sm font-bold tabular-nums text-sobre-color">{t("deTantos", { hechos, total: PASOS.length })}</p>
          </div>
        </div>
      </section>

      {/* Los cinco pasos, siempre a la vista: se puede saltar a cualquiera. */}
      <nav aria-label={t("etiqueta")}>
        <ol className="grid grid-cols-5 gap-2">
          {PASOS.map((id, indice) => {
            const activo = id === paso;
            const bloqueado = !perfil && indice > 0;
            const contenido = (
              <>
                <span
                  aria-hidden="true"
                  className={`flex size-8 flex-none items-center justify-center rounded-full text-sm font-bold ${
                    hecho[id]
                      ? "bg-brand-teal-dark text-sobre-color"
                      : activo
                        ? "bg-accion text-sobre-color"
                        : "bg-white text-zinc-500 ring-1 ring-zinc-300"
                  }`}
                >
                  {hecho[id] ? "✓" : indice + 1}
                </span>
                <span className={`sr-only text-xs font-semibold leading-tight xl:not-sr-only xl:block ${activo ? "text-titular" : "text-zinc-600"}`}>
                  {t(`pasos.${id}.nombre`)}
                </span>
              </>
            );
            const clases = `flex h-full flex-col items-center gap-1.5 rounded-xl border px-2 py-3 text-center transition xl:flex-row xl:text-left ${
              activo ? "border-accion bg-white shadow-sm" : "border-zinc-200 bg-white/60 hover:border-zinc-300"
            }`;
            return (
              <li key={id}>
                {bloqueado ? (
                  <span className={`${clases} cursor-not-allowed opacity-50`}>{contenido}</span>
                ) : (
                  <Link href={`/panel/empezar?paso=${indice + 1}`} aria-current={activo ? "step" : undefined} className={clases}>
                    {contenido}
                  </Link>
                )}
              </li>
            );
          })}
        </ol>
      </nav>

      <div className="grid items-start gap-6 lg:grid-cols-3">
        <section className="min-w-0 lg:col-span-2">
          <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm sm:p-7">
            <p className="text-xs font-bold uppercase tracking-wider text-accion-tinta">
              {t("pasoDe", { numero, total: PASOS.length })}
            </p>
            <h2 className="mt-1 text-xl font-extrabold tracking-tight text-titular sm:text-2xl">{t(`pasos.${paso}.titulo`)}</h2>
            <p className="mt-2 text-[15px] leading-relaxed text-zinc-600">{t(`pasos.${paso}.texto`)}</p>

            <div className="mt-6">
              {paso === "club" && (
                <PasoLoBasico
                  nombre={perfil?.name ?? (user.user_metadata?.name as string | undefined) ?? ""}
                  ciudad={perfil?.city ?? ""}
                  provincia={perfil?.province ?? ""}
                  descripcion={perfil?.description ?? ""}
                />
              )}
              {paso === "imagenes" && perfil && (
                <PasoImagenes
                  userId={user.id}
                  logoUrl={perfil.logoUrl ?? null}
                  coverUrl={perfil.coverUrl ?? null}
                  coverPosition={perfil.coverPosition ?? 50}
                />
              )}
              {paso === "equipos" && <EquiposForm equipos={equipos} userId={user.id} />}
              {paso === "oportunidades" && perfil && (
                <div className="flex flex-col gap-3">
                  <GeneradorDeOportunidades
                    perfil={{ topCategoryMalePhoto: perfil.topCategoryMalePhoto, topCategoryFemalePhoto: perfil.topCategoryFemalePhoto }}
                    equipos={equipos}
                    requisitos={[...requisitosDelClub(perfil, equipos)]}
                    existentes={oportunidades.map((oportunidad) => ({
                      title: oportunidad.title,
                      ideaId: oportunidad.ideaId ?? null,
                      esNecesidad: oportunidad.esNecesidad,
                      categoriaNecesidad: oportunidad.categoriaNecesidad,
                    }))}
                    lineaDeDatos={await lineaDeDatosDelClub(supabase, user.id, perfil, equipos)}
                  />
                  {publicadas > 0 && (
                    <p className="rounded-lg bg-teal-50 px-4 py-3 text-sm font-medium text-teal-900">
                      {t("pasos.oportunidades.yaTienes", { n: publicadas })}
                    </p>
                  )}
                  <p className="text-sm text-zinc-600">
                    {t.rich("pasos.oportunidades.aMano", {
                      enlace: (trozo) => (
                        <Link href="/panel/oportunidades" className="font-semibold text-accion-tinta underline underline-offset-2">
                          {trozo}
                        </Link>
                      ),
                    })}
                  </p>
                </div>
              )}
              {paso === "compartir" && (
                <div className="flex flex-col gap-4">
                  <ul className="grid gap-2 sm:grid-cols-2">
                    {PASOS.slice(0, 4).map((id) => (
                      <li key={id} className="flex items-center gap-2 rounded-lg border border-zinc-200 px-3 py-2 text-sm">
                        <span aria-hidden="true" className={hecho[id] ? "text-teal-700" : "text-amber-600"}>
                          {hecho[id] ? "✓" : "•"}
                        </span>
                        <span className={hecho[id] ? "text-zinc-700" : "font-medium text-zinc-900"}>{t(`pasos.${id}.nombre`)}</span>
                        {!hecho[id] && (
                          <Link href={`/panel/empezar?paso=${PASOS.indexOf(id) + 1}`} className="ml-auto text-xs font-semibold text-accion-tinta underline">
                            {t("completar")}
                          </Link>
                        )}
                      </li>
                    ))}
                  </ul>
                  <div className="flex flex-wrap gap-3">
                    {paginaPublica && (
                      <a href={paginaPublica} target="_blank" rel="noopener noreferrer" className={botonPrincipal}>
                        {t("pasos.compartir.verPagina")} ↗
                      </a>
                    )}
                    <Link href="/panel/dossier" className={botonSecundario}>
                      {t("pasos.compartir.dossier")}
                    </Link>
                    <Link href="/panel" className={botonSecundario}>
                      {t("pasos.compartir.inicio")}
                    </Link>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Atrás / Seguir. En el primer paso no va: "Guardar y seguir"
              ya es el botón de seguir. */}
          {perfil && numero > 1 && (
            <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
              <Link href={`/panel/empezar?paso=${numero - 1}`} className={botonSecundario}>
                {t("atras")}
              </Link>
              {numero < PASOS.length && (
                <Link href={`/panel/empezar?paso=${numero + 1}`} className={hecho[paso] ? botonPrincipal : botonSecundario}>
                  {hecho[paso] ? t("seguir") : t("saltar")}
                </Link>
              )}
            </div>
          )}
        </section>

        {/* El club de ejemplo de su deporte, siempre a mano. */}
        <aside className="flex min-w-0 flex-col gap-4">
          <a
            href={`/${locale}/ejemplo/${ejemplo}`}
            target="_blank"
            rel="noopener noreferrer"
            className="group overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm transition hover:shadow-md"
          >
            <div className="relative h-32 overflow-hidden">
              <Image
                src={`/ejemplos-club/${portadaEjemplo}.webp`}
                alt=""
                fill
                sizes="(min-width: 1024px) 30vw, 100vw"
                className="object-cover transition duration-500 group-hover:scale-105"
              />
            </div>
            <div className="p-4">
              <p className="font-bold text-titular">{t("ejemplo.titulo")}</p>
              <p className="mt-1 text-sm leading-relaxed text-zinc-600">{t("ejemplo.texto")}</p>
              <p className="mt-3 text-sm font-semibold text-accion-tinta">{t("ejemplo.boton")}</p>
            </div>
          </a>
          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
            <p className="text-sm font-bold text-amber-900">{t("consejo")}</p>
            <p className="mt-1 text-sm leading-relaxed text-amber-900">{t(`pasos.${paso}.consejo`)}</p>
          </div>
        </aside>
      </div>
    </div>
  );
}
