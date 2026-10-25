import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Header } from "@/components/Header";
import { Link } from "@/i18n/navigation";
import { MESES_PILOTO, PLAZAS_PILOTO, plazasPilotoLibres } from "@/lib/piloto";
import { createAdminClient } from "@/lib/supabase/admin";
import { FondoDeHeroe } from "../components/secciones";
import { EntradaAlBajar } from "../components/EntradaAlBajar";

/**
 * La página de la campaña de Instagram: el programa piloto (migración
 * 0057). Quien se registra desde aquí tiene 6 meses gratis en vez de
 * uno, mientras queden plazas.
 *
 * Es corta a propósito. Quien llega viene de un anuncio en el móvil y
 * ya sabe más o menos de qué va: aquí solo tiene que entender qué se
 * lleva, qué se le pide a cambio y cuántas plazas quedan. Para lo demás
 * está "Para clubes".
 */
export async function generateMetadata(): Promise<Metadata> {
  const tMeta = await getTranslations("home.piloto.meta");
  return { title: tMeta("titulo"), description: tMeta("descripcion") };
}

// El contador de plazas cambia con cada registro: no se puede servir de
// una página guardada.
export const dynamic = "force-dynamic";

const QUE_TE_LLEVAS = ["pagina", "oportunidades", "dossier", "seguimiento"] as const;
const QUE_PEDIMOS = ["usarla", "opinion", "nadaMas"] as const;
const PASOS = ["paso1", "paso2", "paso3"] as const;

export default async function PilotoPage() {
  const t = await getTranslations("home.piloto");

  let libres: number | null = null;
  try {
    libres = await plazasPilotoLibres(createAdminClient());
  } catch {
    // Sin la clave de servicio (en local) la página se enseña sin contador.
  }
  const completo = libres === 0;
  const destino = completo ? "/registro-club" : "/registro-club?piloto=1";

  const boton = (grande: boolean) => (
    <Link
      href={destino}
      className={`inline-flex items-center justify-center rounded-full bg-brand-teal-dark font-bold text-sobre-color shadow-lg shadow-brand-teal/30 transition-colors hover:bg-brand-navy ${
        grande ? "px-10 py-4 text-lg" : "px-8 py-3 text-base"
      }`}
    >
      {completo ? t("ctaCompleto") : t("cta")}
    </Link>
  );

  return (
    <div className="flex flex-1 flex-col bg-zinc-50">
      <Header />

      <main id="contenido" className="flex-1">
        <section className="relative overflow-hidden border-b border-zinc-200 bg-gradient-to-b from-white to-zinc-50 px-4 pb-14 pt-10 sm:px-6 sm:pb-20 sm:pt-16">
          <FondoDeHeroe archivo="/fondo-clubes.webp" tono="claro" velo="fuerte" />

          <div className="relative mx-auto max-w-3xl text-center">
            <span className="mb-6 inline-flex items-center rounded-full bg-brand-teal-light px-4 py-2 text-xs font-bold uppercase tracking-wide text-accion-tinta">
              {t("etiqueta")}
            </span>

            <h1 className="text-3xl font-extrabold leading-tight tracking-tight text-titular sm:text-5xl">
              {t("titulo", { meses: MESES_PILOTO })}
            </h1>
            <p className="mx-auto mt-5 max-w-2xl text-base leading-relaxed text-zinc-600 sm:text-lg">
              {t("texto", { plazas: PLAZAS_PILOTO, meses: MESES_PILOTO })}
            </p>

            {libres !== null && (
              <p
                className={`mx-auto mt-7 inline-flex items-center gap-2 rounded-full border px-5 py-2 text-sm font-bold ${
                  completo
                    ? "border-amber-300 bg-amber-50 text-amber-900"
                    : "border-teal-300 bg-white text-teal-800 shadow-sm"
                }`}
              >
                {!completo && <span aria-hidden="true" className="h-2.5 w-2.5 rounded-full bg-teal-500" />}
                {completo ? t("completo") : t("plazasQuedan", { n: libres, total: PLAZAS_PILOTO })}
              </p>
            )}

            <div className="mt-8 flex flex-col items-center gap-3">
              {boton(true)}
              <p className="text-sm text-zinc-600">{t("condiciones")}</p>
            </div>
          </div>
        </section>

        <div className="mx-auto flex max-w-5xl flex-col gap-14 px-4 py-14 sm:px-6">
          <section>
            <h2 className="text-center text-2xl font-extrabold text-titular sm:text-3xl">{t("queTeLlevas.titulo")}</h2>
            <div className="mt-8 grid gap-4 sm:grid-cols-2">
              {QUE_TE_LLEVAS.map((clave, indice) => (
                <div key={clave} className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
                  <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-brand-teal-light text-sm font-extrabold text-accion-tinta">
                    {indice + 1}
                  </span>
                  <h3 className="mt-3 text-lg font-bold text-titular">{t(`queTeLlevas.${clave}.titulo`)}</h3>
                  <p className="mt-1 text-base leading-relaxed text-zinc-600">{t(`queTeLlevas.${clave}.texto`)}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-3xl bg-brand-navy px-6 py-10 text-sobre-color sm:px-10">
            <h2 className="text-center text-2xl font-extrabold sm:text-3xl">{t("quePedimos.titulo")}</h2>
            <div className="mt-8 grid gap-4 sm:grid-cols-3">
              {QUE_PEDIMOS.map((clave) => (
                <div key={clave} className="rounded-2xl bg-white/10 p-5">
                  <h3 className="text-base font-bold">{t(`quePedimos.${clave}.titulo`)}</h3>
                  <p className="mt-1 text-[15px] leading-relaxed text-sobre-color/80">{t(`quePedimos.${clave}.texto`)}</p>
                </div>
              ))}
            </div>
          </section>

          <section>
            <h2 className="text-center text-2xl font-extrabold text-titular sm:text-3xl">{t("pasos.titulo")}</h2>
            <ol className="mx-auto mt-8 grid max-w-4xl gap-4 sm:grid-cols-3">
              {PASOS.map((clave, indice) => (
                <li key={clave} className="flex gap-3 rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
                  <span className="flex h-8 w-8 flex-none items-center justify-center rounded-full bg-brand-teal-dark text-sm font-bold text-sobre-color">
                    {indice + 1}
                  </span>
                  <p className="text-[15px] leading-relaxed text-zinc-700">{t(`pasos.${clave}`, { meses: MESES_PILOTO })}</p>
                </li>
              ))}
            </ol>
          </section>

          <section className="mx-auto max-w-3xl rounded-2xl border border-teal-200 bg-teal-50 p-6 text-center">
            <h2 className="text-xl font-extrabold text-titular">{t("despues.titulo", { meses: MESES_PILOTO })}</h2>
            <p className="mt-2 text-base leading-relaxed text-zinc-700">{t("despues.texto")}</p>
          </section>

          <section className="flex flex-col items-center gap-3 text-center">
            {boton(true)}
            <p className="text-sm text-zinc-600">
              {t.rich("dudas", {
                correo: (trozo) => (
                  <a href="mailto:info@apoyaclub.com" className="font-medium text-teal-700 hover:underline">
                    {trozo}
                  </a>
                ),
              })}
            </p>
          </section>
        </div>
      </main>

      <EntradaAlBajar />
    </div>
  );
}
