import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { onboardingCompleto, type PasoInicial } from "@/lib/onboarding";

/**
 * "Empieza por aquí", arriba a la derecha del inicio: los cinco pasos
 * del asistente (`lib/onboarding.ts`), con su barra y el botón para
 * hacerlos de uno en uno. Desaparece en cuanto están todos hechos.
 *
 * Cada paso lleva a su pantalla del asistente; el pendiente más antiguo
 * es el que lleva el botón, los demás se ven pero no compiten.
 */
export function PrimerosPasos({ pasos }: { pasos: PasoInicial[] }) {
  const t = useTranslations("panel.primerosPasos");
  const tPasos = useTranslations("panel.empezar.pasos");

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
          <li key={paso.id}>
            <Link
              href={paso.href}
              className={`flex items-center gap-3 rounded-lg border px-4 py-3 transition-colors ${
                indice === indicePendiente
                  ? "border-accion bg-white shadow-sm"
                  : "border-sobre-color bg-white/70 hover:border-zinc-300 hover:bg-white"
              }`}
            >
              <span
                aria-hidden
                className={`flex h-6 w-6 flex-none items-center justify-center rounded-full text-xs font-bold ${
                  paso.hecho ? "bg-brand-teal-dark text-sobre-color" : "bg-white text-zinc-500 ring-1 ring-zinc-300"
                }`}
              >
                {paso.hecho ? "✓" : indice + 1}
              </span>
              <span className="min-w-0 flex-1">
                <span className={`block text-sm font-medium ${paso.hecho ? "text-zinc-500 line-through" : "text-zinc-900"}`}>
                  {tPasos(`${paso.id}.nombre`)}
                </span>
                {indice === indicePendiente && (
                  <span className="mt-0.5 block text-xs text-zinc-600">{tPasos(`${paso.id}.texto`)}</span>
                )}
              </span>
              {!paso.hecho && <span aria-hidden="true" className="text-accion-tinta">→</span>}
            </Link>
          </li>
        ))}
      </ol>

      <Link
        href={pasos[indicePendiente]?.href ?? "/panel/empezar"}
        className="mt-4 inline-flex w-full items-center justify-center rounded-xl bg-accion px-4 py-2.5 text-sm font-bold text-sobre-color shadow-sm transition hover:bg-accion-fuerte"
      >
        {t("pasoAPaso")}
      </Link>
    </section>
  );
}
