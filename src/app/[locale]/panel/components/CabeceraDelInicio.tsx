import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";

/**
 * La cabecera del inicio del panel: el escudo, el nombre del club y los
 * dos atajos que más se usan (ver la página y crear una oportunidad).
 *
 * Antes eran dos líneas de texto sueltas encima de la primera caja. Es
 * lo primero que ve quien paga al entrar, y tiene que decir "esto es tu
 * club" con la misma presencia que la portada de la web.
 *
 * El fondo es el degradado de la marca y el texto va en `sobre-color`,
 * que no se invierte en el modo oscuro: los dos tonos del degradado
 * siguen siendo oscuros ahí (ver `--brand-navy` en globals.css). El
 * escudo va sobre la placa clara, como en todo el panel.
 */
export function CabeceraDelInicio({
  nombre,
  logoUrl,
  correo,
  paginaPublica,
  hayFicha,
}: {
  nombre: string;
  logoUrl: string | null;
  /** Solo mientras no hay ficha: es lo único que identifica la cuenta. */
  correo: string | null;
  paginaPublica: string | null;
  hayFicha: boolean;
}) {
  const t = useTranslations("panel.inicio");

  return (
    <section className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-brand-navy via-brand-navy to-brand-teal-dark p-5 shadow-lg shadow-brand-navy/15 sm:p-7">
      {/* Dos círculos de luz, como en la web. */}
      <div aria-hidden="true" className="pointer-events-none absolute -right-16 -top-20 h-64 w-64 rounded-full bg-brand-teal/25 blur-3xl" />
      <div aria-hidden="true" className="pointer-events-none absolute -bottom-24 left-1/3 h-56 w-56 rounded-full bg-sobre-color/5 blur-2xl" />

      <div className="relative flex flex-col gap-5 lg:flex-row lg:items-center">
        <div className="flex min-w-0 flex-1 items-center gap-4 sm:gap-5">
        <span className="flex size-14 flex-none items-center justify-center overflow-hidden rounded-2xl border border-placa-borde bg-placa shadow-md sm:size-20">
          {logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element -- el escudo lo sube el club y puede venir de cualquier tamaño
            <img src={logoUrl} alt="" className="h-full w-full object-contain p-1.5" />
          ) : (
            <span className="text-2xl font-extrabold text-brand-navy sm:text-3xl">{nombre.charAt(0).toUpperCase()}</span>
          )}
        </span>

        <div className="min-w-0 flex-1">
          <p className="text-xs font-bold uppercase tracking-wider text-sobre-color/70">{t("eyebrow")}</p>
          <h1 className="mt-1 line-clamp-2 text-xl font-extrabold leading-tight tracking-tight text-sobre-color sm:text-3xl">{nombre}</h1>
          <p className="mt-1 text-sm text-sobre-color/80">{correo ?? t("saludo")}</p>
        </div>
        </div>

        <div className="grid grid-cols-2 gap-2.5 sm:flex sm:flex-wrap">
          {hayFicha && (
            <Link
              href="/panel/oportunidades"
              className="inline-flex items-center justify-center gap-1.5 whitespace-nowrap rounded-xl bg-placa px-3 py-2.5 text-[13px] sm:gap-2 sm:px-4 sm:text-sm font-bold text-brand-navy shadow-md transition hover:-translate-y-0.5 hover:shadow-lg"
            >
              <span aria-hidden="true" className="text-base leading-none">+</span>
              {t("nuevaOportunidad")}
            </Link>
          )}
          {paginaPublica && (
            <a
              href={paginaPublica}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-1.5 whitespace-nowrap rounded-xl border border-sobre-color/40 px-3 py-2.5 text-[13px] sm:gap-2 sm:px-4 sm:text-sm font-bold text-sobre-color transition hover:bg-sobre-color/10"
            >
              {t("verMiPagina")}
              <span aria-hidden="true">↗</span>
            </a>
          )}
        </div>
      </div>
    </section>
  );
}
