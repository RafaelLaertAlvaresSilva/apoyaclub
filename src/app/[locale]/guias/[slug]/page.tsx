import type { Metadata } from "next";
import Image from "next/image";
import { getLocale } from "next-intl/server";
import { notFound, permanentRedirect } from "next/navigation";
import { Link } from "@/i18n/navigation";
import { Header } from "@/components/Header";
import { DatosEstructurados } from "@/components/DatosEstructurados";
import { grafoDeGuia, grafoDePreguntas } from "@/lib/datos-estructurados";
import { SITE_URL } from "@/lib/site";
import {
  GUIAS,
  NOMBRE_CATEGORIA,
  fechaLarga,
  guiaPorSlug,
  guiasRelacionadas,
  hayGuiasEn,
  indiceDe,
  minutosDeLectura,
  palabrasDe,
} from "@/lib/guias";
import { BloquesGuia } from "../components/BloquesGuia";
import { TarjetaDeGuia } from "../components/TarjetaDeGuia";

/**
 * Una guía. Ver `src/lib/guias/tipos.ts` para cómo se escriben.
 *
 * El orden de la página sigue lo que pide quien llega desde Google: la
 * respuesta corta arriba ("En resumen"), el índice para saltar a lo que
 * busca, el detalle, las preguntas frecuentes, quién lo firma y qué
 * hacer después.
 */

type Parametros = { params: Promise<{ locale: string; slug: string }> };

export function generateStaticParams() {
  return GUIAS.map((g) => ({ slug: g.slug }));
}

export async function generateMetadata({ params }: Parametros): Promise<Metadata> {
  const { slug } = await params;
  const guia = guiaPorSlug(slug);
  if (!guia) return { robots: { index: false } };
  return {
    title: { absolute: guia.tituloSeo },
    description: guia.descripcion,
    openGraph: {
      type: "article",
      title: guia.titulo,
      description: guia.descripcion,
      images: [{ url: guia.portada, width: 1600, height: 900, alt: guia.portadaAlt }],
      publishedTime: guia.publicada,
      modifiedTime: guia.actualizada,
      authors: ["Rafael Alvares"],
    },
  };
}

export default async function PaginaDeGuia({ params }: Parametros) {
  const { slug } = await params;
  const locale = await getLocale();
  // Solo en español por ahora: desde otro idioma se va a la versión
  // en español en vez de dar un error.
  if (!hayGuiasEn(locale)) permanentRedirect(`/es/guias/${slug}`);

  const guia = guiaPorSlug(slug);
  if (!guia) notFound();

  const indice = indiceDe(guia);
  const minutos = minutosDeLectura(guia);
  const relacionadas = guiasRelacionadas(guia);
  const url = `${SITE_URL}/es/guias/${guia.slug}`;

  return (
    <div className="flex flex-1 flex-col bg-zinc-50">
      <DatosEstructurados
        datos={grafoDeGuia(SITE_URL, {
          url,
          titulo: guia.titulo,
          descripcion: guia.descripcion,
          portada: guia.portada,
          publicada: guia.publicada,
          actualizada: guia.actualizada,
          palabras: palabrasDe(guia),
        })}
      />
      <DatosEstructurados datos={grafoDePreguntas(guia.preguntas)} />
      <Header />

      <main id="contenido" className="flex-1">
        {/* ============ CABECERA DE LA GUÍA ============ */}
        <header className="border-b border-zinc-200 bg-white px-4 pb-10 pt-8 sm:px-6 sm:pt-12">
          <div className="mx-auto max-w-3xl">
            <nav aria-label="Migas de pan" className="text-sm text-zinc-500">
              <ol className="flex flex-wrap items-center gap-1.5">
                <li>
                  <Link href="/" className="hover:text-titular">Inicio</Link>
                </li>
                <li aria-hidden="true">›</li>
                <li>
                  <Link href="/guias" className="hover:text-titular">Guías</Link>
                </li>
                <li aria-hidden="true">›</li>
                <li className="font-medium text-zinc-700">{NOMBRE_CATEGORIA[guia.categoria]}</li>
              </ol>
            </nav>

            <h1 className="mt-5 text-3xl font-extrabold leading-[1.15] tracking-tight text-titular sm:text-[2.6rem]">
              {guia.titulo}
            </h1>
            <p className="mt-5 text-lg leading-relaxed text-zinc-600 sm:text-xl">{guia.entradilla}</p>

            <div className="mt-7 flex flex-wrap items-center gap-x-5 gap-y-3 text-sm text-zinc-500">
              <Link href="/quienes-somos" className="flex items-center gap-3 hover:text-titular">
                <Image
                  src="/rafael-alvares-polo.webp"
                  alt=""
                  width={44}
                  height={44}
                  className="h-11 w-11 rounded-full object-cover ring-2 ring-brand-teal-light"
                />
                <span>
                  <span className="block font-semibold text-titular">Rafael Alvares</span>
                  <span className="block">Fisioterapeuta deportivo y fundador de ApoyaClub</span>
                </span>
              </Link>
              <span className="hidden h-8 w-px bg-zinc-200 sm:block" aria-hidden="true" />
              <span className="whitespace-nowrap">
                Actualizada el <time dateTime={guia.actualizada}>{fechaLarga(guia.actualizada)}</time>
                <span aria-hidden="true"> · </span>
                {minutos} min de lectura
              </span>
            </div>
          </div>

          <div className="mx-auto mt-9 max-w-5xl">
            <div className="relative aspect-[16/9] overflow-hidden rounded-3xl bg-zinc-100 shadow-xl shadow-brand-navy/10">
              <Image
                src={guia.portada}
                alt={guia.portadaAlt}
                fill
                priority
                sizes="(min-width: 1024px) 64rem, 100vw"
                className="object-cover"
              />
            </div>
          </div>
        </header>

        {/* ============ CUERPO ============
            En el ordenador, el índice se queda a la vista a la derecha
            mientras se lee; en el teléfono va plegado antes del texto. */}
        <div className="px-4 py-12 sm:px-6 sm:py-16">
          <div className="mx-auto grid max-w-6xl grid-cols-1 gap-12 lg:grid-cols-[minmax(0,1fr)_17rem] lg:gap-16">
            <article className="mx-auto w-full min-w-0 max-w-[44rem] lg:mx-0 lg:justify-self-end">
              <section aria-labelledby="en-resumen" className="rounded-3xl bg-brand-navy-dark p-6 text-sobre-color shadow-xl shadow-brand-navy/15 sm:p-8">
                <h2 id="en-resumen" className="text-xs font-bold uppercase tracking-wider text-brand-teal">
                  En resumen
                </h2>
                <ul className="mt-4 space-y-3.5">
                  {guia.resumen.map((frase, i) => (
                    <li key={i} className="flex gap-3 text-[1.02rem] leading-relaxed text-sobre-color/90">
                      <span aria-hidden="true" className="mt-2.5 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-teal" />
                      <span>{frase}</span>
                    </li>
                  ))}
                </ul>
              </section>

              <details className="group mt-8 rounded-2xl border border-zinc-200 bg-white p-5 lg:hidden">
                <summary className="flex cursor-pointer list-none items-center justify-between font-bold text-titular">
                  En esta guía
                  <span aria-hidden="true" className="text-zinc-400 transition group-open:rotate-180">⌄</span>
                </summary>
                <ListaDelIndice indice={indice} />
              </details>

              <div className="mt-12">
                <BloquesGuia bloques={guia.cuerpo} />
              </div>

              {/* ============ PREGUNTAS FRECUENTES ============ */}
              <section aria-labelledby="preguntas" className="mt-16 scroll-mt-28" id="preguntas-frecuentes">
                <p className="text-xs font-bold uppercase tracking-wider text-accion-tinta">Dudas</p>
                <h2 id="preguntas" className="mt-2 text-2xl font-extrabold tracking-tight text-titular sm:text-3xl">
                  Preguntas frecuentes
                </h2>
                <div className="mt-6 divide-y divide-zinc-200 overflow-hidden rounded-2xl border border-zinc-200 bg-white">
                  {guia.preguntas.map((p) => (
                    <details key={p.pregunta} className="group p-5 sm:p-6">
                      <summary className="flex cursor-pointer list-none items-start justify-between gap-4 font-semibold leading-snug text-titular">
                        {p.pregunta}
                        <span aria-hidden="true" className="mt-0.5 text-xl leading-none text-accion-tinta transition group-open:rotate-45">
                          +
                        </span>
                      </summary>
                      <p className="mt-3 leading-relaxed text-zinc-600">{p.respuesta}</p>
                    </details>
                  ))}
                </div>
              </section>

              {/* ============ AUTOR ============ */}
              <section aria-label="Sobre el autor" className="mt-14 flex flex-col gap-5 rounded-3xl border border-zinc-200 bg-white p-6 sm:flex-row sm:items-center sm:p-8">
                <Image
                  src="/rafael-alvares-polo.webp"
                  alt="Rafael Alvares, fundador de ApoyaClub"
                  width={112}
                  height={112}
                  className="h-24 w-24 shrink-0 rounded-2xl object-cover sm:h-28 sm:w-28"
                />
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-accion-tinta">Escrito por</p>
                  <p className="mt-1 text-lg font-extrabold text-titular">Rafael Alvares</p>
                  <p className="mt-2 leading-relaxed text-zinc-600">
                    Fisioterapeuta deportivo con más de diez años en el deporte de base: Real Federación Española de
                    Balonmano, Club Balonmano Benidorm, Club Balonmano Guadalajara y Club Rugby Alcalá. Ha visto de
                    cerca lo que cuesta a los clubes encontrar patrocinadores, y por eso creó ApoyaClub.
                  </p>
                  <Link href="/quienes-somos" className="mt-3 inline-flex min-h-11 items-center font-semibold text-accion-tinta hover:underline">
                    Conoce su historia →
                  </Link>
                </div>
              </section>
            </article>

            <aside className="hidden lg:block">
              <div className="sticky top-28 space-y-6">
                <nav aria-label="En esta guía" className="rounded-2xl border border-zinc-200 bg-white p-5">
                  <p className="font-bold text-titular">En esta guía</p>
                  <ListaDelIndice indice={indice} />
                </nav>
                <div className="rounded-2xl bg-brand-teal-light p-5">
                  <p className="font-bold leading-snug text-titular">Consigue tus patrocinadores con ApoyaClub</p>
                  <p className="mt-2 text-sm leading-relaxed text-zinc-700">
                    Página del club, más de 150 ideas, un dossier para cada empresa y el seguimiento de cada patrocinador.
                  </p>
                  <Link
                    href="/6mesesgratis?a=GUIA"
                    className="mt-4 inline-flex min-h-11 items-center rounded-full bg-accion px-5 text-sm font-bold text-sobre-color hover:bg-accion-fuerte"
                  >
                    6 meses gratis →
                  </Link>
                </div>
              </div>
            </aside>
          </div>
        </div>

        {/* ============ LLAMADA FINAL ============ */}
        <section className="bg-brand-navy-dark px-4 py-16 text-center text-sobre-color sm:px-6 sm:py-20">
          <div className="mx-auto max-w-2xl">
            <p className="text-xs font-bold uppercase tracking-wider text-brand-teal">Para clubes deportivos</p>
            <h2 className="mt-3 text-3xl font-extrabold leading-tight tracking-tight sm:text-4xl">
              Pon en práctica esta guía con ApoyaClub
            </h2>
            <p className="mt-4 text-lg leading-relaxed text-sobre-color/75">
              Crea la página de tu club, elige tus oportunidades de patrocinio, prepara un dossier para cada empresa y
              lleva el seguimiento de tus patrocinadores. Los primeros clubes tienen 6 meses gratis.
            </p>
            <Link
              href="/6mesesgratis?a=GUIA"
              className="mt-8 inline-flex min-h-12 items-center rounded-full bg-accion px-8 text-lg font-bold text-sobre-color hover:bg-accion-fuerte"
            >
              Quiero mis 6 meses gratis
            </Link>
          </div>
        </section>

        {/* ============ MÁS GUÍAS ============ */}
        {relacionadas.length > 0 && (
          <section className="px-4 py-16 sm:px-6">
            <div className="mx-auto max-w-6xl">
              <h2 className="text-2xl font-extrabold tracking-tight text-titular">Sigue leyendo</h2>
              <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {relacionadas.map((g) => (
                  <TarjetaDeGuia key={g.slug} guia={g} />
                ))}
              </div>
            </div>
          </section>
        )}
      </main>
    </div>
  );
}

function ListaDelIndice({ indice }: { indice: { id: string; titulo: string }[] }) {
  return (
    <ol className="mt-3 space-y-1">
      {indice.map((apartado, i) => (
        <li key={apartado.id}>
          <a
            href={`#${apartado.id}`}
            className="flex gap-2.5 rounded-lg px-2 py-1.5 text-sm leading-snug text-zinc-600 hover:bg-zinc-50 hover:text-titular"
          >
            <span className="w-4 shrink-0 font-semibold text-accion-tinta">{i + 1}</span>
            {apartado.titulo}
          </a>
        </li>
      ))}
      <li>
        <a
          href="#preguntas-frecuentes"
          className="flex gap-2.5 rounded-lg px-2 py-1.5 text-sm leading-snug text-zinc-600 hover:bg-zinc-50 hover:text-titular"
        >
          <span className="w-4 shrink-0 font-semibold text-accion-tinta">?</span>
          Preguntas frecuentes
        </a>
      </li>
    </ol>
  );
}
