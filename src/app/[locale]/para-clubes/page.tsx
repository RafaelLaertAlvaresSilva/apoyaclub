import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { Header } from "@/components/Header";
import { CtaFijoMovil } from "../components/CtaFijoMovil";
import { MenuDeSecciones, type SeccionDelMenu } from "../components/MenuDeSecciones";
import {
  FuncionesDestacadas,
  SeccionComoFunciona,
  SeccionContacto,
  SeccionCtaFinal,
  SeccionDossier,
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

const SECCIONES: SeccionDelMenu[] = [
  { id: "como-funciona", etiqueta: "Cómo funciona" },
  { id: "clubes", etiqueta: "Qué puedes ofrecer" },
  { id: "oportunidades", etiqueta: "Oportunidades" },
  { id: "tu-pagina", etiqueta: "Tu página" },
  { id: "herramientas", etiqueta: "Herramientas" },
  { id: "precio", etiqueta: "Precio" },
  { id: "faq", etiqueta: "Preguntas" },
];

export default async function ParaClubesPage() {
  const t = await getTranslations("home");

  return (
    <div className="flex flex-1 flex-col bg-zinc-50">
      <Header />

      <main id="contenido" className="flex-1 pb-24 sm:pb-0">
        <section className="relative overflow-hidden border-b border-zinc-200 bg-gradient-to-b from-white to-zinc-50 px-4 pb-16 pt-10 sm:px-6 sm:pb-20 sm:pt-16">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -right-32 -top-32 h-96 w-96 rounded-full bg-brand-teal/10 blur-3xl"
          />

          <div className="relative mx-auto max-w-3xl text-center">
            <span className="mb-6 inline-flex items-center rounded-full bg-brand-teal-light px-4 py-2 text-xs font-bold tracking-wide text-brand-teal-dark">
              {t("paraClubes.etiqueta")}
            </span>

            <h1 className="text-2xl font-extrabold leading-tight tracking-tight text-brand-navy sm:text-4xl lg:text-5xl">
              {t("paraClubes.titulo")}
            </h1>
            <p className="mx-auto mt-5 max-w-xl text-[15px] leading-relaxed text-zinc-600 sm:text-lg">
              {t("paraClubes.texto")}
            </p>

            <FuncionesDestacadas />

            <div className="mt-9 flex flex-col items-center gap-3">
              <div className="flex w-full flex-col items-stretch gap-3 sm:w-auto sm:flex-row sm:items-center">
                <Link
                  href="/registro-club"
                  className="inline-flex items-center justify-center rounded-full bg-brand-teal-dark px-10 py-4 text-lg font-bold text-white shadow-lg shadow-brand-teal/30 transition-colors hover:bg-brand-navy"
                >
                  {t("hero.cta")}
                </Link>
                <a
                  href="#como-funciona"
                  className="inline-flex items-center justify-center rounded-full border border-zinc-300 bg-white px-8 py-4 text-base font-bold text-brand-navy transition-colors hover:bg-zinc-50"
                >
                  {t("hero.ctaSecundario")}
                </a>
              </div>
              <p className="text-sm text-zinc-500">{t("hero.condiciones")}</p>
            </div>
          </div>
        </section>

        <MenuDeSecciones secciones={SECCIONES} />

        <SeccionComoFunciona />
        <SeccionQueOfrece />
        <SeccionOportunidades />
        <SeccionPaginaClub />
        <SeccionEmbudo />
        <SeccionDossier />
        <SeccionPanelYHerramientas />
        <SeccionPrecio />
        <SeccionFaq />
        <SeccionCtaFinal />
        <SeccionContacto />
      </main>

      <CtaFijoMovil texto={t("ctaFijo.texto")} condiciones={t("ctaFinal.condiciones")} />
    </div>
  );
}
