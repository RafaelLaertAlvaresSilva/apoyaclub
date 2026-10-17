import Image from "next/image";
import { fotoDePortada } from "@/lib/fotos-de-oportunidad";
import { Link } from "@/i18n/navigation";
import { BarraDePlazas } from "@/components/BarraDePlazas";
import { useLocale, useTranslations } from "next-intl";
import { esPorPlazas } from "@/lib/opportunities";
import { etiquetador } from "@/lib/etiquetas-traducidas";
import { formatoDeValor } from "@/lib/format";
import type { AppLocale } from "@/i18n/routing";
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
  const t = useTranslations("club.listado");
  const E = etiquetador(useTranslations("common.etiquetas"));
  const precio = formatoDeValor(useLocale() as AppLocale);

  if (oportunidades.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-zinc-300 bg-white p-8 text-center">
        <p className="font-medium text-zinc-900">
          {esNecesidad ? t("sinNecesidades") : t("sinOportunidades")}
        </p>
        <Link
          href={`/club/${slug}`}
          className="mt-4 inline-block text-sm font-medium text-accion-tinta hover:underline"
        >
          {t("volverASuFicha")}
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
                ? "border-teal-200 bg-teal-50 hover:border-accion-tinta"
                : "border-zinc-200 bg-white hover:border-accion-tinta"
            }`}
          >
            <p className="text-xs font-semibold uppercase tracking-wide text-accion-tinta">
              {esNecesidad
                ? oportunidad.categoriaNecesidad
                  ? E.categoriaNecesidad(oportunidad.categoriaNecesidad)
                  : t("loNecesitamos")
                : E.tipoOportunidad(oportunidad.opportunityType)}
            </p>

            {/* La miniatura, cuando la hay (migración 0052). Sin marco
                gris cuando no: al principio casi ninguna tendrá foto y
                una rejilla de huecos vacíos se ve peor que el texto. */}
            {fotoDePortada(oportunidad.fotos) && (
              <Image
                src={fotoDePortada(oportunidad.fotos)!}
                alt=""
                width={600}
                height={300}
                unoptimized
                className="aspect-[2/1] w-full rounded-lg border border-zinc-200 bg-zinc-50 object-contain"
              />
            )}

            <p className="font-semibold text-zinc-900">{oportunidad.title}</p>

            {/* Lo que recibe la empresa dice mucho más que la
                descripción, así que manda cuando está rellenado. */}
            {oportunidad.beneficios.length > 0 ? (
              <p className="text-sm text-zinc-600">
                {oportunidad.beneficios
                  .slice(0, 3)
                  .map(beneficioEnTexto)
                  .join(" · ")}
                {oportunidad.beneficios.length > 3 && " …"}
              </p>
            ) : (
              oportunidad.description && (
                <p className="line-clamp-3 text-sm text-zinc-600">
                  {oportunidad.description}
                </p>
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
                  {precio.format(oportunidad.value)}
                </span>
              ) : (
                <span />
              )}
              <span className="text-sm font-medium text-accion-tinta">
                {t("verFicha")}
              </span>
            </div>
          </Link>
        </li>
      ))}
    </ul>
  );
}
