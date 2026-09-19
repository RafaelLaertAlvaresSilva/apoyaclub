import { Link } from "@/i18n/navigation";
import { BarraDePlazas } from "@/components/BarraDePlazas";
import {
  esPorPlazas,
  ETIQUETA_CATEGORIA_NECESIDAD,
  ETIQUETA_TIPO_OPORTUNIDAD,
  formatoValorOportunidad,
} from "@/lib/opportunities";
import { beneficioEnTexto } from "@/lib/ficha-oportunidad";
import type { Opportunity } from "@/lib/types";

/**
 * Todas las oportunidades de un club, o todo lo que necesita.
 *
 * Cada tarjeta lleva a su propia página. Antes esto vivía solo dentro
 * de la ficha del club, recortado a dos y sin forma de enlazar una en
 * concreto: el club mandaba el enlace de su ficha entera y la empresa
 * tenía que adivinar de cuál le estaban hablando.
 */
export function ListadoDeOportunidades({
  oportunidades,
  slug,
  esNecesidad,
}: {
  oportunidades: Opportunity[];
  slug: string;
  esNecesidad: boolean;
}) {
  if (oportunidades.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-zinc-300 bg-white p-8 text-center">
        <p className="font-medium text-zinc-900">
          {esNecesidad
            ? "Este club no ha publicado nada que necesite."
            : "Este club todavía no ha publicado oportunidades."}
        </p>
        <Link
          href={`/club/${slug}`}
          className="mt-4 inline-block text-sm font-medium text-brand-teal-dark hover:underline"
        >
          Volver a su ficha
        </Link>
      </div>
    );
  }

  return (
    <ul className="grid gap-4 sm:grid-cols-2">
      {oportunidades.map((oportunidad) => (
        <li key={oportunidad.id}>
          <Link
            href={`/club/${slug}/oportunidad/${oportunidad.id}`}
            className={`flex h-full flex-col gap-2 rounded-xl border p-5 transition-colors ${
              esNecesidad
                ? "border-teal-200 bg-teal-50 hover:border-brand-teal-dark"
                : "border-zinc-200 bg-white hover:border-brand-teal-dark"
            }`}
          >
            <p className="text-xs font-semibold uppercase tracking-wide text-brand-teal-dark">
              {esNecesidad
                ? oportunidad.categoriaNecesidad
                  ? ETIQUETA_CATEGORIA_NECESIDAD[oportunidad.categoriaNecesidad]
                  : "Lo necesitamos"
                : ETIQUETA_TIPO_OPORTUNIDAD[oportunidad.opportunityType]}
            </p>

            <p className="font-semibold text-zinc-900">{oportunidad.title}</p>

            {/* Lo que recibe la empresa dice mucho más que la
                descripción, así que manda cuando está rellenado. */}
            {oportunidad.beneficios.length > 0 ? (
              <p className="text-sm text-zinc-600">
                {oportunidad.beneficios.slice(0, 3).map(beneficioEnTexto).join(" · ")}
                {oportunidad.beneficios.length > 3 && " …"}
              </p>
            ) : (
              oportunidad.description && (
                <p className="line-clamp-3 text-sm text-zinc-600">{oportunidad.description}</p>
              )
            )}

            {esPorPlazas(oportunidad) && (
              <BarraDePlazas
                slotsTotal={oportunidad.slotsTotal}
                slotsTaken={oportunidad.slotsTaken}
                etiqueta={esNecesidad ? "colaboradores" : "plazas"}
              />
            )}

            <div className="mt-auto flex items-center justify-between gap-3 pt-2">
              {!esNecesidad && oportunidad.value > 0 ? (
                <span className="font-semibold text-zinc-900">
                  {formatoValorOportunidad.format(oportunidad.value)}
                </span>
              ) : (
                <span />
              )}
              <span className="text-sm font-medium text-brand-teal-dark">Ver ficha →</span>
            </div>
          </Link>
        </li>
      ))}
    </ul>
  );
}
