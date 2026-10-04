import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { Header } from "@/components/Header";

/**
 * La bifurcación del registro.
 *
 * El botón verde de la cabecera —"Crea tu página"— llevaba derecho al
 * formulario del club, y está en todas las páginas, también en las que
 * son para empresas. Una empresa que entraba en /para-empresas y quería
 * darse de alta veía ese botón, lo pulsaba y acababa en un formulario
 * que le pedía el nombre de su club y le hablaba de 29,90 €/mes. Su
 * registro existía desde siempre, pero estaba al final de la página, a
 * cuatro pantallas de scroll.
 *
 * Así que el botón ya no decide por nadie: pregunta. Un clic más para
 * el club, que es el que paga, a cambio de que la empresa no se pierda.
 * Las dos tarjetas dicen el precio en el propio texto, porque la
 * diferencia que importa entre las dos opciones no es a quién van
 * dirigidas, es cuánto cuestan.
 *
 * Los formularios siguen accesibles por su dirección de siempre
 * (/registro-club y /registro-empresa): los enlaces que ya saben a
 * quién llevan —la portada, /para-clubes, el pie— siguen yendo directos
 * y no pasan por aquí.
 */

export const metadata: Metadata = {
  title: "Crea tu cuenta en ApoyaClub",
  description:
    "Elige si eres un club que busca patrocinadores o una empresa que quiere apoyar al deporte de su zona.",
};

const OPCIONES = [
  {
    clave: "club",
    href: "/registro-club",
    icono: (
      <path d="M12 3l7 3v5.5c0 4.3-3 8-7 9.5-4-1.5-7-5.2-7-9.5V6l7-3z" />
    ),
  },
  {
    clave: "empresa",
    href: "/registro-empresa",
    icono: (
      <>
        <path d="M3 21h18M5 21V5a1 1 0 011-1h7a1 1 0 011 1v16M14 21V10h4a1 1 0 011 1v10" />
        <path d="M8 8h2M8 12h2M8 16h2" />
      </>
    ),
  },
] as const;

export default async function RegistroPage() {
  const t = await getTranslations("auth.elegirRegistro");

  return (
    <>
      <Header />

      <main id="contenido" className="flex-1 bg-zinc-50 px-4 py-9 sm:px-6 sm:py-20">
        <div className="mx-auto max-w-4xl">
          <div className="mx-auto max-w-xl text-center">
            <h1 className="text-2xl font-extrabold tracking-tight text-brand-navy sm:text-4xl">
              {t("titulo")}
            </h1>
            <p className="mt-3 leading-relaxed text-zinc-600">{t("subtitulo")}</p>
          </div>

          <div className="mt-7 grid gap-4 sm:gap-5 md:mt-10 md:grid-cols-2">
            {OPCIONES.map((opcion) => (
              <Link
                key={opcion.clave}
                href={opcion.href}
                className="group flex flex-col rounded-2xl border border-zinc-200 bg-white p-5 transition-colors hover:border-brand-teal focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-teal-dark sm:p-7"
              >
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-teal-light text-brand-teal-dark sm:h-12 sm:w-12">
                  <svg
                    aria-hidden="true"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="h-5 w-5 sm:h-6 sm:w-6"
                  >
                    {opcion.icono}
                  </svg>
                </span>

                <h2 className="mt-4 text-lg font-extrabold text-brand-navy sm:mt-5 sm:text-xl">
                  {t(`${opcion.clave}.titulo`)}
                </h2>
                <p className="mt-1 text-sm font-bold text-brand-teal-dark">
                  {t(`${opcion.clave}.precio`)}
                </p>
                <p className="mt-2.5 text-sm leading-relaxed text-zinc-600 sm:text-base">
                  {t(`${opcion.clave}.texto`)}
                </p>

                {/* `mt-auto`: los dos textos no miden lo mismo y sin esto
                    cada botón quedaba a una altura distinta. */}
                <span className="mt-auto pt-5">
                  <span className="inline-flex items-center gap-2 rounded-lg bg-brand-teal-dark px-4 py-2.5 text-sm font-bold text-white transition-colors group-hover:bg-brand-navy sm:text-base">
                    {t(`${opcion.clave}.boton`)}
                    <span aria-hidden="true">→</span>
                  </span>
                </span>
              </Link>
            ))}
          </div>

          <div className="mt-8 space-y-2 text-center text-sm text-zinc-600 sm:mt-10">
            <p>
              {t("mirarAntes")}{" "}
              <Link
                href="/buscar"
                className="font-semibold text-brand-teal-dark underline underline-offset-4"
              >
                {t("mirarAntesEnlace")}
              </Link>
            </p>
            <p>
              {t("yaTienesCuenta")}{" "}
              <Link
                href="/login"
                className="font-semibold text-brand-teal-dark underline underline-offset-4"
              >
                {t("iniciaSesion")}
              </Link>
            </p>
          </div>
        </div>
      </main>
    </>
  );
}
