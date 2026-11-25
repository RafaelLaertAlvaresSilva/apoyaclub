import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { onboardingCompleto, type PasoInicial } from "@/lib/onboarding";

/**
 * Los tres pasos del primer día, arriba del panel. Desaparece solo en
 * cuanto están los tres hechos: la barra de progreso ya se encarga a
 * partir de ahí.
 *
 * El paso pendiente más antiguo es el que lleva el botón; los demás se
 * ven, pero no compiten por la atención.
 */
export function PrimerosPasos({ pasos }: { pasos: PasoInicial[] }) {
  const t = useTranslations("panel.primerosPasos");

  if (onboardingCompleto(pasos)) return null;

  const indicePendiente = pasos.findIndex((paso) => !paso.hecho);
  const hechos = pasos.filter((paso) => paso.hecho).length;
  const porcentaje = Math.round((hechos / pasos.length) * 100);

  return (
    <section className="rounded-2xl border border-brand-teal/30 bg-brand-teal-light/40 p-5 shadow-sm">
      <div className="flex items-baseline justify-between gap-3">
        <h2 className="text-base font-bold text-titular">{t("titulo")}</h2>
        <p className="text-sm font-bold tabular-nums text-accion-tinta">{t("deTantos", { hechos, total: pasos.length })}</p>
      </div>
      <p className="mt-1 text-sm text-zinc-600">{t("subtitulo")}</p>
      {/* La barra de cuánto queda: con ella, "Empieza por aquí" se lee
          como algo que se termina, no como una lista más. */}
      <div
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={porcentaje}
        aria-label={t("titulo")}
        className="mt-3 h-2 w-full overflow-hidden rounded-full bg-white/80 ring-1 ring-brand-teal/20"
      >
        <div className="h-full rounded-full bg-medidor transition-[width] duration-700" style={{ width: `${porcentaje}%` }} />
      </div>

      <ol className="mt-4 flex flex-col gap-2">
        {pasos.map((paso, indice) => (
          <li
            key={paso.id}
            className="flex flex-wrap items-center gap-3 rounded-lg border border-sobre-color bg-white/70 px-4 py-3"
          >
            <span
              aria-hidden
              className={`flex h-6 w-6 flex-none items-center justify-center rounded-full text-xs font-bold ${
                paso.hecho ? "bg-brand-teal-dark text-sobre-color" : "bg-white text-zinc-500 ring-1 ring-zinc-300"
              }`}
            >
              {paso.hecho ? "✓" : indice + 1}
            </span>

            {/* Al menos todo el ancho menos el círculo: así el botón
                cae debajo del texto en vez de estrujarlo, ahora que la
                lista vive en la columna estrecha de la derecha. */}
            <div className="min-w-0 flex-1 basis-[calc(100%-2.25rem)]">
              <p className={`text-sm font-medium ${paso.hecho ? "text-zinc-500 line-through" : "text-zinc-900"}`}>
                {t(`${paso.id}.titulo`)}
              </p>
              {!paso.hecho && <p className="text-xs text-zinc-500">{t(`${paso.id}.texto`)}</p>}
            </div>

            {indice === indicePendiente &&
              (paso.anclaDelPanel ? (
                // Enlace normal a propósito, no el <Link> de Next: este
                // salto se queda en la misma página, y el <Link> cambia
                // la dirección de una forma que el navegador no anuncia,
                // así que la pestaña no llegaba a abrirse y el botón
                // parecía muerto.
                <a
                  href={`#${paso.anclaDelPanel}`}
                  className="ml-9 rounded-lg bg-brand-teal-dark px-3 py-1.5 text-xs font-semibold text-sobre-color transition-colors hover:bg-brand-navy"
                >
                  {t(`${paso.id}.accion`)}
                </a>
              ) : (
                <Link
                  href={paso.href}
                  className="ml-9 rounded-lg bg-brand-teal-dark px-3 py-1.5 text-xs font-semibold text-sobre-color transition-colors hover:bg-brand-navy"
                >
                  {t(`${paso.id}.accion`)}
                </Link>
              ))}
          </li>
        ))}
      </ol>
    </section>
  );
}
