import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { Header } from "@/components/Header";
import { MenuDeSecciones, type SeccionDelMenu } from "../components/MenuDeSecciones";
import { SeccionBuscadorEmpresas, SeccionContacto, Tic } from "../components/secciones";

/**
 * Todo lo que una empresa o un colaborador necesita saber.
 *
 * El error que arregla esta página: hasta ahora, el comercio de barrio
 * entraba en una portada que le hablaba a un club y leía "29,90 €/mes"
 * en los primeros diez segundos. Se iba creyendo que le iban a cobrar,
 * cuando para él esto es gratis y ni cuenta necesita.
 *
 * Aquí no aparece el precio ni una sola vez, porque no hay ninguno.
 * Y el orden es el de sus preguntas, no el de las nuestras:
 *
 *   qué es esto → qué puedo ver sin registrarme → cómo contacto → no
 *   tengo presupuesto, ¿sirve otra cosa? → ¿y si me registro?
 *
 * Lo de la cuenta va al final a propósito. Una empresa que entra a
 * mirar y se encuentra un formulario de registro se va; una que ya ha
 * visto tres clubes de su calle se plantea publicar lo que ofrece.
 */
export async function generateMetadata(): Promise<Metadata> {
  const tMeta = await getTranslations("home.paraEmpresas.meta");
  return { title: tMeta("titulo"), description: tMeta("descripcion") };
}

const SECCIONES: SeccionDelMenu[] = [
  { id: "empresas", etiqueta: "Qué puedes patrocinar" },
  { id: "como", etiqueta: "Cómo funciona" },
  { id: "colaborar", etiqueta: "Formas de colaborar" },
  { id: "cuenta", etiqueta: "Cuenta gratuita" },
  { id: "faq", etiqueta: "Preguntas" },
];

export default async function ParaEmpresasPage() {
  const t = await getTranslations("home.paraEmpresas");
  const pasos = t.raw("pasos") as { titulo: string; texto: string }[];
  const formas = t.raw("formas.lista") as string[];
  const ventajas = t.raw("cuenta.ventajas") as { titulo: string; texto: string }[];
  const preguntas = t.raw("faq.preguntas") as { pregunta: string; respuesta: string }[];

  return (
    <div className="flex flex-1 flex-col bg-white">
      <Header />

      <main id="contenido" className="flex-1">
        {/* ============ HERO ============ */}
        <section className="relative overflow-hidden border-b border-zinc-200 bg-gradient-to-b from-zinc-50 to-white px-4 pb-16 pt-10 sm:px-6 sm:pb-20 sm:pt-16">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -right-32 -top-32 h-96 w-96 rounded-full bg-brand-teal/10 blur-3xl"
          />

          <div className="relative mx-auto max-w-3xl text-center">
            <span className="mb-6 inline-flex items-center rounded-full bg-brand-teal-light px-4 py-2 text-xs font-bold tracking-wide text-brand-teal-dark">
              {t("etiqueta")}
            </span>

            <h1 className="text-2xl font-extrabold leading-tight tracking-tight text-brand-navy sm:text-4xl lg:text-5xl">
              {t("titulo")}
            </h1>
            <p className="mx-auto mt-5 max-w-xl text-[15px] leading-relaxed text-zinc-600 sm:text-lg">
              {t("texto")}
            </p>

            <div className="mt-9 flex w-full flex-col items-stretch gap-3 sm:mx-auto sm:w-auto sm:flex-row sm:items-center sm:justify-center">
              <Link
                href="/buscar?busca=patrocinios"
                className="inline-flex items-center justify-center rounded-full bg-brand-teal-dark px-10 py-4 text-lg font-bold text-white shadow-lg shadow-brand-teal/30 transition-colors hover:bg-brand-navy"
              >
                {t("cta")}
              </Link>
              <Link
                href="/buscar?busca=necesidades"
                className="inline-flex items-center justify-center rounded-full border-2 border-amber-300 bg-amber-50 px-8 py-4 text-base font-bold text-amber-900 transition-colors hover:border-amber-400 hover:bg-amber-100"
              >
                {t("ctaNecesidades")}
              </Link>
            </div>
            <p className="mt-4 text-sm font-medium text-zinc-600">{t("gratis")}</p>
          </div>
        </section>

        <MenuDeSecciones secciones={SECCIONES} />

        <SeccionBuscadorEmpresas />

        {/* ============ CÓMO FUNCIONA PARA TI ============ */}
        <section id="como" className="mx-auto max-w-6xl scroll-mt-32 px-4 py-20 sm:px-6 sm:py-28">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-xs font-bold uppercase tracking-wider text-brand-teal-dark">
              {t("comoEyebrow")}
            </p>
            <h2 className="mt-3 text-3xl font-extrabold tracking-tight text-brand-navy sm:text-4xl">
              {t("comoTitulo")}
            </h2>
          </div>

          <ol className="mt-14 grid gap-6 sm:grid-cols-3">
            {pasos.map((paso, indice) => (
              <li key={paso.titulo} className="rounded-3xl border border-zinc-200 bg-white p-7">
                <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-brand-teal-light text-base font-extrabold text-brand-teal-dark">
                  {indice + 1}
                </span>
                <h3 className="mt-4 text-lg font-extrabold leading-snug text-brand-navy">
                  {paso.titulo}
                </h3>
                <p className="mt-3 text-[15px] leading-relaxed text-zinc-600">{paso.texto}</p>
              </li>
            ))}
          </ol>

          <p className="mx-auto mt-10 max-w-2xl text-center text-[15px] leading-relaxed text-zinc-600 sm:text-base">
            {t("comoCierre")}
          </p>
        </section>

        {/* ============ NO HACE FALTA QUE SEA DINERO ============ */}
        {/* La sección que más falta hacía. Por aquí entran tres personas
            distintas y solo una viene con presupuesto de marketing: las
            otras dos —el negocio que puede poner un servicio y el vecino
            que pone 50 €— son las que un club de barrio consigue de
            verdad, y hasta ahora no se les decía en ningún sitio que lo
            suyo también valía. */}
        <section id="colaborar" className="scroll-mt-32 bg-brand-navy px-4 py-20 sm:px-6 sm:py-28">
          <div className="mx-auto max-w-4xl">
            <div className="mx-auto max-w-2xl text-center">
              <p className="text-xs font-bold uppercase tracking-wider text-brand-teal">
                {t("formas.eyebrow")}
              </p>
              <h2 className="mt-3 text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
                {t("formas.titulo")}
              </h2>
              <p className="mt-4 leading-relaxed text-white/70">{t("formas.texto")}</p>
            </div>

            <div className="mt-12 grid grid-cols-2 gap-3 sm:grid-cols-3">
              {formas.map((forma) => (
                <div
                  key={forma}
                  className="rounded-2xl bg-white/[0.07] px-4 py-5 text-center text-sm font-bold text-white sm:text-[15px]"
                >
                  {forma}
                </div>
              ))}
            </div>

            <p className="mt-10 text-center text-[15px] leading-relaxed text-white/70">
              {t("formas.cierre")}
            </p>
          </div>
        </section>

        {/* ============ LA CUENTA, GRATIS ============ */}
        <section id="cuenta" className="mx-auto max-w-6xl scroll-mt-32 px-4 py-20 sm:px-6 sm:py-28">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-xs font-bold uppercase tracking-wider text-brand-teal-dark">
              {t("cuenta.eyebrow")}
            </p>
            <h2 className="mt-3 text-3xl font-extrabold leading-tight tracking-tight text-brand-navy sm:text-4xl">
              {t("cuenta.titulo")}
            </h2>
            <p className="mt-4 leading-relaxed text-zinc-600">{t("cuenta.texto")}</p>
          </div>

          <div className="mt-12 grid gap-5 sm:grid-cols-2">
            {ventajas.map((ventaja) => (
              <div
                key={ventaja.titulo}
                className="flex gap-3.5 rounded-2xl border border-zinc-200 bg-white p-6"
              >
                <Tic className="mt-1 flex-none text-brand-teal" tamano={18} />
                <div>
                  <h3 className="font-extrabold text-brand-navy">{ventaja.titulo}</h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-zinc-600">{ventaja.texto}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-12 flex flex-col items-center gap-3">
            <Link
              href="/registro-empresa"
              className="inline-flex items-center justify-center rounded-full bg-brand-teal-dark px-10 py-4 text-lg font-bold text-white shadow-lg shadow-brand-teal/30 transition-colors hover:bg-brand-navy"
            >
              {t("cuenta.cta")}
            </Link>
            <p className="text-sm text-zinc-500">{t("cuenta.condiciones")}</p>
            <Link
              href="/empresas"
              className="mt-1 text-sm font-semibold text-brand-teal-dark underline decoration-brand-teal/40 underline-offset-4 transition-colors hover:decoration-brand-teal-dark"
            >
              {t("cuenta.directorio")}
            </Link>
          </div>
        </section>

        {/* ============ PREGUNTAS ============ */}
        <section id="faq" className="mx-auto max-w-3xl scroll-mt-32 px-4 py-20 sm:px-6 sm:py-28">
          <h2 className="text-center text-3xl font-extrabold tracking-tight text-brand-navy sm:text-4xl">
            {t("faq.titulo")}
          </h2>

          <div className="mt-12 space-y-3">
            {preguntas.map((item) => (
              <details
                key={item.pregunta}
                className="group rounded-2xl border border-zinc-200 bg-white p-6 open:border-brand-teal/40"
              >
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-semibold text-brand-navy marker:content-none">
                  {item.pregunta}
                  <span className="flex-none text-zinc-500 transition-transform group-open:rotate-45">
                    +
                  </span>
                </summary>
                <p className="mt-3 text-sm leading-relaxed text-zinc-600">{item.respuesta}</p>
              </details>
            ))}
          </div>
        </section>

        {/* ============ CTA FINAL ============ */}
        <section className="relative overflow-hidden bg-gradient-to-br from-brand-navy to-brand-navy-dark px-4 py-24 text-center sm:px-6 sm:py-28">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -right-24 -top-24 h-80 w-80 rounded-full bg-brand-teal/15 blur-3xl"
          />
          <div className="relative mx-auto max-w-2xl">
            <h2 className="text-3xl font-extrabold leading-tight text-white sm:text-4xl">
              {t("cierre.titulo")}
            </h2>
            <p className="mx-auto mt-5 max-w-xl leading-relaxed text-white/70">
              {t("cierre.texto")}
            </p>
            <Link
              href="/buscar"
              className="mt-9 inline-flex items-center justify-center rounded-full bg-brand-teal-dark px-10 py-4 text-lg font-bold text-white shadow-lg shadow-brand-teal/40 transition-colors hover:bg-brand-teal"
            >
              {t("cierre.cta")}
            </Link>
            <p className="mt-4 text-sm text-white/60">{t("gratis")}</p>
          </div>
        </section>

        <SeccionContacto />
      </main>
    </div>
  );
}
