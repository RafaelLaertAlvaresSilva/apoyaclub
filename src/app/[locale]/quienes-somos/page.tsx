import type { Metadata } from "next";
import Image from "next/image";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { Header } from "@/components/Header";
import { EntradaAlBajar } from "../components/EntradaAlBajar";
import { FondoDeHeroe } from "../components/secciones";

/**
 * Quiénes somos: la persona que hay detrás de ApoyaClub.
 *
 * Un club que llega desde un anuncio de Instagram no conoce la marca, y
 * antes de dejar sus datos quiere saber con quién está tratando. Aquí lo
 * ve: una cara, de dónde viene (el vestuario, no una agencia), su
 * trayectoria y tres
 * compromisos que se pueden comprobar en el resto de la web (sin
 * comisiones, el club decide, se le escucha).
 *
 * Va en primera persona porque es una sola persona, y prometer un
 * "equipo" que no existe sería lo primero que un club notaría.
 */
export async function generateMetadata(): Promise<Metadata> {
  const tMeta = await getTranslations("home.quienes.meta");
  return { title: tMeta("titulo"), description: tMeta("descripcion") };
}

type Valor = { clave: string; titulo: string; texto: string };
type Etapa = { anos: string; titulo: string; texto: string };
type Logro = { puesto: "oro" | "plata"; texto: string };

/** El color de cada medalla: oro y plata, como en el podio. */
const MEDALLA: Record<Logro["puesto"], string> = {
  oro: "bg-amber-100 text-amber-700",
  plata: "bg-zinc-200 text-zinc-600",
};

/** Un dibujo por compromiso, en la misma línea que los de las herramientas. */
const ICONO_VALOR: Record<string, string> = {
  // Una etiqueta de precio tachada: sin comisiones.
  comision: "M7 7h.01M3 11.5V4a1 1 0 0 1 1-1h7.5l9 9-8.5 8.5-9-9ZM4 20 20 4",
  // Una mano que elige: el club decide.
  club: "M9 11V5a2 2 0 1 1 4 0v6m0-2a2 2 0 1 1 4 0v3m0-1a2 2 0 1 1 4 0v3a7 7 0 0 1-7 7h-1a7 7 0 0 1-6-3.4L4 15a2 2 0 0 1 3.3-2.2L9 15",
  // Un bocadillo de conversación: te escucho.
  escucho: "M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.6A8 8 0 1 1 21 12Z",
};

export default async function QuienesSomosPage() {
  const t = await getTranslations("home.quienes");
  const parrafos = t.raw("historia.parrafos") as string[];
  const valores = t.raw("valores.lista") as Valor[];
  const etapas = t.raw("trayectoria.lista") as Etapa[];
  const logros = t.raw("logros.lista") as Logro[];
  const estudios = t.raw("formacion.lista") as Etapa[];

  return (
    <div className="flex flex-1 flex-col bg-zinc-50">
      <Header />

      <main id="contenido" className="flex-1">
        {/* ============ QUIÉN ============ */}
        <section className="relative overflow-hidden border-b border-zinc-200 bg-gradient-to-b from-white to-zinc-50 px-4 pb-16 pt-10 sm:px-6 sm:pb-20 sm:pt-16">
          <FondoDeHeroe archivo="/fondo-clubes.webp" tono="claro" velo="fuerte" />

          <div className="relative mx-auto grid max-w-6xl items-center gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,24rem)] lg:gap-16">
            <div className="text-center lg:text-left">
              <span className="mb-6 inline-flex items-center rounded-full bg-brand-teal-light px-4 py-2 text-xs font-bold uppercase tracking-wide text-accion-tinta">
                {t("etiqueta")}
              </span>
              <h1 className="text-3xl font-extrabold leading-tight tracking-tight text-titular sm:text-4xl lg:text-5xl">
                {t("titulo")}
              </h1>
              <p className="mx-auto mt-6 max-w-xl text-lg leading-relaxed text-zinc-700 lg:mx-0">{t("intro")}</p>
            </div>

            {/* La foto de estudio, con el polo de ApoyaClub: el logo ya va
                en la camiseta, así que no hace falta ponerlo encima. */}
            <figure className="mx-auto w-full max-w-sm lg:max-w-none">
              <div className="relative overflow-hidden rounded-3xl shadow-2xl shadow-brand-navy/20">
                <Image
                  src="/rafael-alvares-polo.webp"
                  alt={t("fotoAlt")}
                  width={900}
                  height={900}
                  sizes="(min-width: 1024px) 24rem, (min-width: 640px) 24rem, 100vw"
                  priority
                  className="block h-auto w-full"
                />
              </div>
            </figure>
          </div>
        </section>

        {/* ============ POR QUÉ Y TRAYECTORIA ============
            En el ordenador, la historia a la izquierda y la trayectoria a
            la derecha; en el teléfono, una debajo de la otra. */}
        <section className="px-4 py-20 sm:px-6 sm:py-24">
          <div className="mx-auto grid max-w-6xl gap-14 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)] lg:gap-16">
            {/* La historia en una tarjeta blanca con sombra y un borde verde
                suave, para que destaque: es lo más personal de la página.
                En el ordenador se queda a la vista mientras se baja por la
                trayectoria, que es más larga. Texto justificado a partir de la
                tableta; en el teléfono, alineado a la izquierda, porque en
                una columna tan estrecha justificar deja huecos grandes entre
                palabras. */}
            <div className="self-start lg:sticky lg:top-28">
              <div className="rounded-3xl bg-white p-7 shadow-xl shadow-brand-navy/10 ring-1 ring-brand-teal/20 sm:p-10">
                <p className="text-xs font-bold uppercase tracking-wider text-accion-tinta">{t("historia.etiqueta")}</p>
                <h2 className="mt-3 text-3xl font-extrabold tracking-tight text-titular sm:text-4xl">
                  {t("historia.titulo")}
                </h2>
                <div className="mt-6 space-y-5">
                  {parrafos.map((parrafo) => (
                    <p key={parrafo.slice(0, 24)} className="hyphens-auto text-lg leading-relaxed text-zinc-700 sm:text-justify">
                      {parrafo}
                    </p>
                  ))}
                </div>
              </div>
            </div>

            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-accion-tinta">{t("trayectoria.etiqueta")}</p>
              <h2 className="mt-3 text-2xl font-extrabold tracking-tight text-titular sm:text-3xl">
                {t("trayectoria.titulo")}
              </h2>
              <ol className="mt-6 space-y-4">
                {etapas.map((etapa) => (
                  <li key={etapa.titulo} className="rounded-2xl bg-white p-5 shadow-sm">
                    <span className="inline-flex rounded-full bg-brand-teal-light px-3 py-1 text-[13px] font-bold text-accion-tinta">
                      {etapa.anos}
                    </span>
                    <h3 className="mt-2 text-lg font-extrabold leading-snug text-titular">{etapa.titulo}</h3>
                    <p className="mt-1 text-base leading-relaxed text-zinc-600">{etapa.texto}</p>
                  </li>
                ))}
              </ol>
              <p className="mt-5 flex items-start gap-3 rounded-2xl bg-amber-50 p-4 text-base font-semibold leading-snug text-amber-900">
                {/* Una medalla. */}
                <svg aria-hidden="true" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mt-0.5 flex-none">
                  <circle cx="12" cy="15" r="6" />
                  <path d="M8.5 10 5 3h4l3 5 3-5h4l-3.5 7" />
                </svg>
                {t("trayectoria.reconocimiento")}
              </p>
            </div>
          </div>
        </section>

        {/* ============ LOGROS Y FORMACIÓN ============
            Lo que se ha ganado con los equipos (con medalla de oro o de
            plata) y dónde se formó. Se dice "con España" o "con el
            Benidorm": son logros del equipo, en los que estuvo dentro. */}
        <section className="bg-white px-4 py-20 sm:px-6 sm:py-24">
          <div className="mx-auto grid max-w-6xl gap-14 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)] lg:gap-16">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-accion-tinta">{t("logros.etiqueta")}</p>
              <h2 className="mt-3 text-3xl font-extrabold tracking-tight text-titular sm:text-4xl">{t("logros.titulo")}</h2>
              <ul className="mt-6 space-y-3">
                {logros.map((logro) => (
                  <li key={logro.texto} className="flex items-start gap-4 rounded-2xl bg-zinc-50 p-4">
                    <span className={`flex h-10 w-10 flex-none items-center justify-center rounded-full ${MEDALLA[logro.puesto]}`}>
                      <svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="15" r="6" />
                        <path d="M8.5 10 5 3h4l3 5 3-5h4l-3.5 7" />
                      </svg>
                    </span>
                    <p className="pt-2 text-base font-semibold leading-snug text-titular">{logro.texto}</p>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-accion-tinta">{t("formacion.etiqueta")}</p>
              <h2 className="mt-3 text-2xl font-extrabold tracking-tight text-titular sm:text-3xl">{t("formacion.titulo")}</h2>
              <ol className="mt-6 space-y-4">
                {estudios.map((estudio) => (
                  <li key={estudio.titulo} className="rounded-2xl bg-zinc-50 p-5">
                    <span className="inline-flex rounded-full bg-brand-teal-light px-3 py-1 text-[13px] font-bold text-accion-tinta">
                      {estudio.anos}
                    </span>
                    <h3 className="mt-2 text-lg font-extrabold leading-snug text-titular">{estudio.titulo}</h3>
                    <p className="mt-1 text-base leading-relaxed text-zinc-600">{estudio.texto}</p>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        </section>

        {/* ============ CÓMO TRABAJO ============
            El mismo campo azul con tarjetas blancas que las herramientas
            de la portada. */}
        <section className="bg-brand-navy px-4 py-20 sm:px-6 sm:py-24">
          <div className="mx-auto max-w-6xl">
            <div className="mx-auto max-w-2xl text-center">
              <p className="text-xs font-bold uppercase tracking-wider text-brand-teal-light">{t("valores.etiqueta")}</p>
              <h2 className="mt-3 text-3xl font-extrabold tracking-tight text-sobre-color sm:text-4xl">
                {t("valores.titulo")}
              </h2>
            </div>
            <ul className="mt-12 grid gap-5 md:grid-cols-3">
              {valores.map((valor) => (
                <li key={valor.clave} className="rounded-2xl bg-white p-6 sm:p-7">
                  <span className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-brand-teal-light text-accion-tinta">
                    <svg
                      aria-hidden="true"
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d={ICONO_VALOR[valor.clave] ?? ICONO_VALOR.escucho} />
                    </svg>
                  </span>
                  <h3 className="mt-4 text-xl font-extrabold text-titular">{valor.titulo}</h3>
                  <p className="mt-2 text-base leading-relaxed text-zinc-600">{valor.texto}</p>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* ============ CONTACTO ============ */}
        <section className="px-4 py-20 text-center sm:px-6 sm:py-24">
          {/* La frase de cierre, con su firma: lo último que se lee antes
              de escribirle. Habla a los clubes y a las empresas a la vez. */}
          <figure className="mx-auto mb-16 max-w-3xl">
            <blockquote className="text-2xl font-extrabold leading-snug text-titular sm:text-3xl">
              {t("frase")}
            </blockquote>
            <figcaption className="mt-4 text-base font-semibold text-accion-tinta">{t("firma")}</figcaption>
          </figure>
          <div className="mx-auto max-w-xl">
            <h2 className="text-3xl font-extrabold tracking-tight text-titular sm:text-4xl">{t("contacto.titulo")}</h2>
            <p className="mt-4 text-lg leading-relaxed text-zinc-700">
              {t.rich("contacto.texto", {
                correo: (trozo) => (
                  <a
                    href="mailto:info@apoyaclub.com"
                    className="font-bold text-accion-tinta underline decoration-brand-teal/40 underline-offset-4 hover:decoration-brand-teal-dark"
                  >
                    {trozo}
                  </a>
                ),
              })}
            </p>
            <Link
              href="/para-clubes"
              className="mt-8 inline-flex items-center justify-center gap-2 rounded-full bg-brand-teal-dark px-8 py-4 text-base font-bold text-sobre-color shadow-lg shadow-brand-teal/30 transition-colors hover:bg-brand-navy"
            >
              {t("contacto.cta")}
              <span aria-hidden="true">→</span>
            </Link>
          </div>
        </section>
      </main>

      <EntradaAlBajar />
    </div>
  );
}
