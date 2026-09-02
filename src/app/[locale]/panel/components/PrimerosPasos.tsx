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

  return (
    <section className="rounded-xl border border-brand-teal/30 bg-brand-teal-light/40 p-5">
      <h2 className="text-base font-semibold text-brand-navy">{t("titulo")}</h2>
      <p className="mt-1 text-sm text-zinc-600">{t("subtitulo")}</p>

      <ol className="mt-4 flex flex-col gap-2">
        {pasos.map((paso, indice) => (
          <li
            key={paso.id}
            className="flex flex-wrap items-center gap-3 rounded-lg border border-white bg-white/70 px-4 py-3"
          >
            <span
              aria-hidden
              className={`flex h-6 w-6 flex-none items-center justify-center rounded-full text-xs font-bold ${
                paso.hecho ? "bg-brand-teal-dark text-white" : "bg-white text-zinc-400 ring-1 ring-zinc-300"
              }`}
            >
              {paso.hecho ? "✓" : indice + 1}
            </span>

            <div className="min-w-0 flex-1">
              <p className={`text-sm font-medium ${paso.hecho ? "text-zinc-400 line-through" : "text-zinc-900"}`}>
                {t(`${paso.id}.titulo`)}
              </p>
              {!paso.hecho && <p className="text-xs text-zinc-500">{t(`${paso.id}.texto`)}</p>}
            </div>

            {indice === indicePendiente && (
              <Link
                href={paso.href}
                className="rounded-lg bg-brand-teal-dark px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-brand-navy"
              >
                {t(`${paso.id}.accion`)}
              </Link>
            )}
          </li>
        ))}
      </ol>
    </section>
  );
}
