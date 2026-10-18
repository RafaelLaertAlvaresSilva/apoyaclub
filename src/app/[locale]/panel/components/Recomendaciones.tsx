import { useTranslations } from "next-intl";
import type { Recomendacion } from "@/lib/recomendaciones";

/**
 * Herramientas de terceros a mano desde el panel del club.
 *
 * Distingue las que el club contrata aparte de las que ya van dentro de
 * su cuota, porque para él no se parecen en nada. Y dice sin rodeos
 * cuándo ApoyaClub cobra comisión: un club que paga una cuota tiene
 * derecho a saber si la recomendación de su proveedor es interesada.
 */
export function Recomendaciones({ recomendaciones }: { recomendaciones: Recomendacion[] }) {
  const t = useTranslations("panel.recomendaciones");
  // Las herramientas conocidas tienen sus textos traducidos en
  // `panel.recomendaciones.herramientas.<id>`; una nueva que todavía no
  // los tenga sale con el texto de `lib/recomendaciones.ts`.
  const texto = (id: string, campo: string, original: string) =>
    t.has(`herramientas.${id}.${campo}`) ? t(`herramientas.${id}.${campo}`) : original;
  if (recomendaciones.length === 0) return null;

  return (
    <section className="tonal tonal-auto rounded-xl border border-(--tono-borde) border-l-[6px] border-l-(--tono-fuerte) bg-white shadow-sm p-5">
      <h2 className="text-base font-semibold text-zinc-900">{t("herramientasTePuedenAyudar")}</h2>
      <p className="mt-1 text-sm text-zinc-500">
        {t("sonOtrasEmpresasNo")}
      </p>

      <ul className="mt-4 space-y-3">
        {recomendaciones.map((recomendacion) => (
          <li key={recomendacion.id} className="rounded-lg border border-zinc-200 p-4">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <p className="font-medium text-zinc-900">{recomendacion.nombre}</p>
              {recomendacion.modo === "incluida" ? (
                <span className="rounded-full bg-teal-50 px-2.5 py-1 text-xs font-semibold text-teal-700">
                  {t("incluidaCuota")}
                </span>
              ) : (
                recomendacion.precio && (
                  <p className="text-sm text-zinc-500">{texto(recomendacion.id, "precio", recomendacion.precio)}</p>
                )
              )}
            </div>

            <p className="mt-1 text-sm text-zinc-600">{texto(recomendacion.id, "queEs", recomendacion.queEs)}</p>
            <p className="mt-2 text-sm text-zinc-700">{texto(recomendacion.id, "paraQue", recomendacion.paraQue)}</p>

            {recomendacion.comoSeActiva && (
              <p className="mt-2 text-sm font-medium text-teal-700">
                {texto(recomendacion.id, "comoSeActiva", recomendacion.comoSeActiva)}
              </p>
            )}

            <div className="mt-3 flex flex-wrap items-center gap-3">
              <a
                href={recomendacion.url}
                target="_blank"
                rel="noreferrer nofollow"
                className="inline-flex items-center gap-2 rounded-lg border border-zinc-300 px-3 py-2 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-100"
              >
                {recomendacion.modo === "incluida" ? t("entrar") : t("ver")} {recomendacion.nombre} ↗
              </a>
              {recomendacion.conComision && (
                <p className="text-xs text-zinc-500">
                  {t("siContratasDesdeEste")}
                </p>
              )}
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
