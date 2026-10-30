"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";
import { Link, usePathname } from "@/i18n/navigation";
import { routing, type AppLocale } from "@/i18n/routing";
import { LANG_HTML, NOMBRE_DEL_IDIOMA } from "@/config/locales";

/**
 * El cambio de idioma: español, portugués e inglés.
 *
 * Lleva a LA MISMA PÁGINA en el otro idioma, no a la portada: quien
 * llega a la ficha de un club por un enlace y no entiende el español
 * quiere esa ficha, no volver a empezar. Se conservan también los
 * filtros del buscador (`?provincia=...`).
 *
 * Cada idioma va escrito en su propio idioma ("Português", no
 * "Portugués"): quien no lee español no reconocería su idioma escrito
 * en español.
 *
 * Al elegir uno, next-intl guarda la elección en una cookie y la
 * siguiente visita entra directamente en ese idioma.
 *
 * Dos formas: `compacto` (un botón con el código, para la cabecera,
 * donde no cabe más) y la normal (los tres nombres en fila, para el
 * pie).
 */
export function SelectorDeIdioma({ compacto = false }: { compacto?: boolean }) {
  // `useSearchParams` obliga a ir dentro de un Suspense en las páginas
  // que se generan por adelantado. Mientras tanto se pinta el mismo
  // selector sin los filtros, así que nunca desaparece.
  return (
    <Suspense fallback={<Selector compacto={compacto} consulta="" />}>
      <ConLosFiltros compacto={compacto} />
    </Suspense>
  );
}

function ConLosFiltros({ compacto }: { compacto: boolean }) {
  const parametros = useSearchParams();
  return <Selector compacto={compacto} consulta={parametros.toString()} />;
}

function Selector({ compacto, consulta }: { compacto: boolean; consulta: string }) {
  const t = useTranslations("common.idioma");
  const actual = useLocale() as AppLocale;
  const ruta = usePathname();
  const destino = consulta ? `${ruta}?${consulta}` : ruta;

  if (!compacto) {
    return (
      <nav aria-label={t("elegir")} className="flex flex-wrap items-center gap-1">
        {routing.locales.map((locale) => (
          <Link
            key={locale}
            href={destino}
            locale={locale}
            hrefLang={LANG_HTML[locale]}
            aria-current={locale === actual ? "true" : undefined}
            className={`inline-flex min-h-11 items-center rounded-md px-2.5 text-sm sm:min-h-9 ${
              locale === actual
                ? "font-semibold text-sobre-color"
                : "text-sobre-color/55 hover:text-sobre-color"
            }`}
          >
            {NOMBRE_DEL_IDIOMA[locale]}
          </Link>
        ))}
      </nav>
    );
  }

  return <DesplegableDeIdioma actual={actual} destino={destino} etiqueta={t("elegir")} />;
}

function DesplegableDeIdioma({
  actual,
  destino,
  etiqueta,
}: {
  actual: AppLocale;
  destino: string;
  etiqueta: string;
}) {
  const [abierto, setAbierto] = useState(false);
  const caja = useRef<HTMLDivElement>(null);

  // Se cierra al pulsar fuera o con Escape, como cualquier menú.
  useEffect(() => {
    if (!abierto) return;
    const fuera = (evento: MouseEvent) => {
      if (!caja.current?.contains(evento.target as Node)) setAbierto(false);
    };
    const tecla = (evento: KeyboardEvent) => {
      if (evento.key === "Escape") setAbierto(false);
    };
    document.addEventListener("mousedown", fuera);
    document.addEventListener("keydown", tecla);
    return () => {
      document.removeEventListener("mousedown", fuera);
      document.removeEventListener("keydown", tecla);
    };
  }, [abierto]);

  return (
    <div ref={caja} className="relative">
      <button
        type="button"
        onClick={() => setAbierto((antes) => !antes)}
        aria-expanded={abierto}
        aria-label={`${etiqueta}: ${NOMBRE_DEL_IDIOMA[actual]}`}
        className="inline-flex h-10 items-center gap-1 rounded-lg border border-zinc-200 px-2.5 text-sm font-semibold uppercase text-zinc-700 transition-colors hover:bg-zinc-100"
      >
        {actual}
        <svg viewBox="0 0 20 20" fill="currentColor" aria-hidden="true" className="h-4 w-4 text-zinc-400">
          <path
            fillRule="evenodd"
            d="M5.23 7.21a.75.75 0 0 1 1.06.02L10 11.17l3.71-3.94a.75.75 0 1 1 1.08 1.04l-4.25 4.5a.75.75 0 0 1-1.08 0l-4.25-4.5a.75.75 0 0 1 .02-1.06Z"
            clipRule="evenodd"
          />
        </svg>
      </button>

      {abierto && (
        <ul className="absolute right-0 top-full z-50 mt-1 min-w-56 overflow-hidden rounded-lg border border-zinc-200 bg-white py-1 shadow-lg">
          {routing.locales.map((locale) => (
            <li key={locale}>
              <Link
                href={destino}
                locale={locale}
                hrefLang={LANG_HTML[locale]}
                aria-current={locale === actual ? "true" : undefined}
                onClick={() => setAbierto(false)}
                className={`flex min-h-11 items-center justify-between gap-3 px-4 text-sm hover:bg-zinc-50 ${
                  locale === actual ? "font-semibold text-accion-tinta" : "text-zinc-700"
                }`}
              >
                {NOMBRE_DEL_IDIOMA[locale]}
                <span className="text-xs uppercase text-zinc-400">{locale}</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
