import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { Header } from "@/components/Header";
import { CtaFijoMovil } from "./components/CtaFijoMovil";
import {
  CadenaDelConcepto,
  FuncionesDestacadas,
  SeccionComoFunciona,
  SeccionCtaFinal,
  SeccionPantallas,
  SeccionPrecio,
  SeccionVideo,
} from "./components/secciones";

/**
 * La portada.
 *
 * Hasta la Fase 17 era una sola página larguísima que intentaba
 * convencer a la vez a un club y a un comercio de barrio. Son dos
 * personas con problemas distintos: una quiere dinero y herramientas
 * para conseguirlo, la otra quiere saber a quién puede ayudar cerca de
 * casa. Cada párrafo que le hablaba a una era ruido para la otra, y la
 * letra pequeña del precio hacía que el comercio se fuera creyendo que
 * le iban a cobrar.
 *
 * Así que la portada hace una sola cosa: decir qué es esto y preguntar
 * cuál de los dos eres. El detalle entero vive en `/para-clubes` y
 * `/para-empresas`, que es donde cada uno encuentra todo lo suyo sin
 * tener que saltarse lo del otro.
 *
 * De doce bloques a seis. Lo que se quitó, y a dónde fue:
 *
 *   - El segundo titular del hero decía lo mismo que la línea de
 *     debajo. Fuera: tres frases seguidas diciendo lo mismo se leen
 *     como ninguna.
 *   - "Lo que tu club puede ofrecer", las tres oportunidades de
 *     ejemplo, la página del club, el seguimiento, el dossier, el panel
 *     y las doce herramientas —seis bloques, más de la mitad del texto
 *     de la página— son ahora cuatro pantallas con una frase cada una.
 *     Enteros siguen en /para-clubes.
 *   - Las preguntas frecuentes y el aviso de fiscalidad, a
 *     /para-clubes. Quien tiene dudas fiscales no está en el primer
 *     minuto de la visita.
 *   - El formulario de contacto, al pie y a /para-clubes.
 *   - La barra de índice de secciones. Con seis bloques no hace falta
 *     un mapa: la página se acaba antes de que te pierdas.
 *
 * La regla que queda, y conviene no romperla: se enseña el producto, no
 * se cuenta. Y lo que se enseña existe — los datos de las maquetas son
 * de muestra y se dice; las funciones que aparecen, no.
 */
export async function generateMetadata(): Promise<Metadata> {
  const tMeta = await getTranslations("home.meta");
  return { title: tMeta("titulo"), description: tMeta("descripcion") };
}

export default async function Home() {
  const t = await getTranslations("home");

  return (
    <div className="flex flex-1 flex-col bg-white">
      <Header />

      {/* El hueco de abajo es para el botón fijo del móvil, que si no
          taparía la última línea de la página. */}
      <main id="contenido" className="flex-1 pb-24 sm:pb-0">
        {/* ============ HERO ============ */}
        <section className="relative overflow-hidden border-b border-zinc-200 bg-gradient-to-b from-zinc-50 to-white px-4 pb-16 pt-10 sm:px-6 sm:pb-20 sm:pt-16">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -right-32 -top-32 h-96 w-96 rounded-full bg-brand-teal/10 blur-3xl"
          />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -bottom-40 -left-32 h-96 w-96 rounded-full bg-brand-navy/5 blur-3xl"
          />

          <div className="relative mx-auto max-w-3xl text-center">
            {/* Qué es esto, antes que nada. Quien llega no sabe si
                ApoyaClub es un patrocinador, un intermediario o una
                herramienta, y de las tres solo una es verdad. */}
            <span className="mb-6 inline-flex items-center rounded-full bg-brand-teal-light px-4 py-2 text-xs font-bold tracking-wide text-brand-teal-dark">
              {t("hero.etiqueta")}
            </span>

            {/* El titular, en dos alturas. Arriba lo que le pasa al
                club; debajo, más pequeño, lo que hace ApoyaClub con
                ello. La primera sola es una observación bonita que no
                dice qué es esto; la segunda nombra los dos verbos del
                producto, descubrir y gestionar. */}
            <h1 className="text-3xl font-extrabold leading-tight tracking-tight text-brand-navy sm:text-4xl lg:text-5xl">
              {t("hero.tituloParte1")}
            </h1>
            <p className="mx-auto mt-4 max-w-2xl text-xl font-bold leading-snug text-brand-teal-dark sm:text-2xl">
              {t("hero.tituloParte2")}
            </p>

            <p className="mx-auto mt-5 max-w-xl text-[17px] leading-relaxed text-zinc-600 sm:text-lg">
              {t("hero.resumen")}
            </p>

            {/* La promesa dice para qué sirve; estas cuatro dicen qué
                es. Sin ellas, esto podría ser un listado, una agencia o
                un curso. */}
            <FuncionesDestacadas />
          </div>

          {/* ============ LAS DOS PUERTAS ============ */}
          {/* Lo primero que hay que resolver no es convencer: es saber
              cuál de los dos eres. Hasta que eso no está claro, todo lo
              demás le sobra a la mitad de quien está leyendo. */}
          <div className="relative mx-auto mt-12 grid max-w-5xl gap-5 lg:grid-cols-2">
            <div className="flex flex-col gap-3 rounded-3xl bg-gradient-to-br from-brand-navy to-brand-navy-dark p-8 text-white shadow-xl shadow-brand-navy/20 sm:p-10">
              <p className="text-xs font-bold uppercase tracking-wider text-brand-teal">
                {t("caminos.clubEtiqueta")}
              </p>
              <h2 className="text-2xl font-extrabold sm:text-3xl">{t("caminos.clubTitulo")}</h2>
              <p className="text-[15px] leading-relaxed text-white/80 sm:text-base">
                {t("caminos.clubTexto")}
              </p>

              <div className="mt-5 sm:mt-auto sm:pt-5">
                <Link
                  href="/para-clubes"
                  className="inline-flex w-full items-center justify-center rounded-2xl bg-brand-teal-dark px-6 py-4 text-base font-bold text-white transition-colors hover:bg-brand-teal sm:px-8"
                >
                  {t("caminos.clubCta")}
                </Link>
                <p className="mt-3 text-sm text-white/60">{t("caminos.clubCondiciones")}</p>
                <Link
                  href="/registro-club"
                  className="mt-2 inline-block text-sm font-semibold text-brand-teal underline decoration-brand-teal/40 underline-offset-4 transition-colors hover:decoration-brand-teal"
                >
                  {t("caminos.clubAtajo")}
                </Link>
              </div>
            </div>

            <div className="flex flex-col gap-3 rounded-3xl border border-zinc-200 bg-white p-8 shadow-sm sm:p-10">
              <p className="text-xs font-bold uppercase tracking-wider text-brand-teal-dark">
                {t("caminos.empresaEtiqueta")}
              </p>
              <h2 className="text-2xl font-extrabold text-brand-navy sm:text-3xl">
                {t("caminos.empresaTitulo")}
              </h2>
              <p className="text-[15px] leading-relaxed text-zinc-600 sm:text-base">
                {t("caminos.empresaTexto")}
              </p>

              <div className="mt-5 sm:mt-auto sm:pt-5">
                <Link
                  href="/para-empresas"
                  className="inline-flex w-full items-center justify-center rounded-2xl border-2 border-brand-navy px-6 py-4 text-base font-bold text-brand-navy transition-colors hover:bg-brand-navy hover:text-white sm:px-8"
                >
                  {t("caminos.empresaCta")}
                </Link>
                <p className="mt-3 text-sm text-zinc-500">{t("caminos.empresaGratis")}</p>
                <Link
                  href="/buscar"
                  className="mt-2 inline-block text-sm font-semibold text-brand-teal-dark underline decoration-brand-teal/40 underline-offset-4 transition-colors hover:decoration-brand-teal-dark"
                >
                  {t("caminos.empresaAtajo")}
                </Link>
              </div>
            </div>
          </div>

          {/* CLUB -> OPORTUNIDAD -> EMPRESA. Es el concepto entero de
              ApoyaClub en tres palabras, y por eso está en el hero. */}
          <div className="relative mt-14">
            <CadenaDelConcepto />
          </div>
        </section>

        <SeccionVideo />
        <SeccionComoFunciona />
        <SeccionPantallas />
        <SeccionPrecio compacta />
        <SeccionCtaFinal />
      </main>

      <CtaFijoMovil texto={t("ctaFijo.texto")} condiciones={t("ctaFinal.condiciones")} />
    </div>
  );
}
