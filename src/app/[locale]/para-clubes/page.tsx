import type { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { Header } from "@/components/Header";
import { CtaFijoMovil } from "../components/CtaFijoMovil";
import { VideoDeLaPortada } from "../components/VideoDeLaPortada";
import { MenuDeSecciones } from "../components/MenuDeSecciones";
import { EntradaAlBajar } from "../components/EntradaAlBajar";
import { FranjaSeisMeses } from "../components/AvisoSeisMeses";
import {
  FondoDeHeroe,
  FuncionesDestacadas,
  SeccionComoFunciona,
  SeccionContacto,
  SeccionCtaFinal,
  SeccionEmbudo,
  SeccionFaq,
  SeccionOportunidades,
  SeccionPaginaClub,
  SeccionPanelYHerramientas,
  SeccionPrecio,
  SeccionQueOfrece,
} from "../components/secciones";

/**
 * Todo lo que un club necesita saber, en un sitio.
 *
 * Es lo que antes era la portada entera. Aquí puede ser larga sin
 * molestar a nadie: quien llega ha pulsado "tengo un club", así que
 * todo lo que hay debajo le habla a él. Nada de esto le sobra a quien
 * se está planteando pagar 29,90 € al mes, porque está comparando con
 * "me lo hago yo con un PDF y una hoja de cálculo" y esa comparación
 * solo se gana enseñando todo lo que hay dentro.
 */
export async function generateMetadata(): Promise<Metadata> {
  const tMeta = await getTranslations("home.paraClubes.meta");
  return { title: tMeta("titulo"), description: tMeta("descripcion") };
}

/* Los nombres de cada apartado están en `home.paraClubes.menu`, por idioma. */
const SECCIONES_IDS = ["como-funciona", "clubes", "oportunidades", "tu-pagina", "herramientas", "precio", "faq"] as const;

/**
 * El vídeo para clubes, con la voz en el idioma de la página.
 */
const VIDEO_PARA_CLUBES: Record<string, string> = {
  es: "/para-clubes-video.mp4",
  en: "/para-clubes-video-en.mp4",
  pt: "/para-clubes-video-pt.mp4",
};

export default async function ParaClubesPage() {
  const locale = await getLocale();
  const tMenu = await getTranslations("home.paraClubes.menu");
  const t = await getTranslations("home");

  return (
    <div className="flex flex-1 flex-col bg-zinc-50">
      <Header />
      <FranjaSeisMeses />

      <main id="contenido" className="flex-1 pb-24 sm:pb-0">
        <section className="relative overflow-hidden border-b border-zinc-200 bg-gradient-to-b from-white to-zinc-50 px-4 pb-16 pt-10 sm:px-6 sm:pb-20 sm:pt-16">
          {/* La misma foto desvanecida que llevan la portada y la
              página de las empresas, en vez de la mancha verde
              difuminada que había aquí: las tres puertas de entrada se
              parecen entre sí. `claro` porque esta foto es un pabellón
              a contraluz, casi blanco, y necesita menos velo encima que
              la oscura de empresas. */}
          <FondoDeHeroe
            archivo="/fondo-clubes.webp"
            tono="claro"
            velo="fuerte"
          />

          {/* Dos columnas igual que la portada: el mensaje a la
              izquierda y el vídeo a la derecha, para que quien entra lea
              y vea a la vez. En móvil y tableta va en una sola columna,
              con el mensaje arriba y el vídeo debajo — al lado, en
              390 px de ancho, no caben ni uno ni otro. */}
          <div className="relative mx-auto grid max-w-6xl items-center gap-10 text-center lg:grid-cols-[minmax(0,1fr)_auto] lg:gap-14 lg:text-left">
            <div className="min-w-0">
              <span className="mb-6 inline-flex items-center rounded-full bg-brand-teal-light px-4 py-2 text-xs font-bold tracking-wide text-accion-tinta">
                {t("paraClubes.etiqueta")}
              </span>

              <h1 className="text-2xl font-extrabold leading-tight tracking-tight text-titular sm:text-4xl lg:text-5xl">
                {t("paraClubes.titulo")}
              </h1>
              <p className="mx-auto mt-5 max-w-xl text-base leading-relaxed text-zinc-600 sm:text-lg lg:mx-0">
                {t("paraClubes.texto")}
              </p>

              {/* `enColumna`: de dos en dos y no de cuatro en fila. En
                  media pantalla, cuatro columnas parten "Más de 100
                  ideas de patrocinio" en cinco líneas. */}
              <FuncionesDestacadas enColumna />

              <div className="mt-9 flex flex-col items-center gap-3 lg:items-start">
                <div className="flex w-full flex-col items-stretch gap-3 sm:w-auto sm:flex-row sm:items-center">
                  <Link
                    href="/registro-club"
                    className="inline-flex items-center justify-center rounded-full bg-brand-teal-dark px-10 py-4 text-lg font-bold text-sobre-color shadow-lg shadow-brand-teal/30 transition-colors hover:bg-brand-navy"
                  >
                    {t("hero.cta")}
                  </Link>
                  <a
                    href="#como-funciona"
                    className="inline-flex items-center justify-center rounded-full border border-zinc-300 bg-white px-8 py-4 text-base font-bold text-titular transition-colors hover:bg-zinc-50"
                  >
                    {t("hero.ctaSecundario")}
                  </a>
                </div>
                <p className="text-sm text-zinc-600">{t("hero.condiciones")}</p>
              </div>
            </div>

            <VideoDeLaPortada
              src={VIDEO_PARA_CLUBES[locale] ?? VIDEO_PARA_CLUBES.es}
              poster="/para-clubes-video-poster.webp"
              etiqueta={t("video.etiquetaParaClubes")}
            />
          </div>
        </section>

        <MenuDeSecciones secciones={SECCIONES_IDS.map((id) => ({ id, etiqueta: tMenu(id) }))} />

        <SeccionComoFunciona />
        <SeccionQueOfrece />
        <SeccionOportunidades />
        <SeccionPaginaClub />
        <SeccionEmbudo />
        <SeccionPanelYHerramientas />
        <SeccionPrecio />
        <SeccionFaq />
        <SeccionCtaFinal />
        <SeccionContacto />
      </main>

      <EntradaAlBajar />
      <CtaFijoMovil
        texto={t("ctaFijo.texto")}
        condiciones={t("ctaFinal.condiciones")}
      />
    </div>
  );
}
