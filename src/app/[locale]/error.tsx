"use client";

import { useTranslations } from "next-intl";
import * as Sentry from "@sentry/nextjs";
import { useEffect } from "react";
import { Link } from "@/i18n/navigation";

/**
 * Pantalla de error de la parte pública y de los paneles (Fase 15).
 * Next.js la muestra cuando algo revienta al renderizar dentro de
 * `[locale]`: antes esto era la pantalla en blanco por defecto.
 *
 * `reset()` reintenta el render sin recargar la página entera, que es lo
 * que arregla la mayoría de los fallos temporales (una consulta a
 * Supabase que no respondió a tiempo, por ejemplo).
 *
 * El `digest` es el identificador que Next.js escribe también en los
 * logs del servidor: se enseña en pequeño para que un club pueda
 * copiarlo al escribirnos y podamos encontrar el error exacto.
 */
export default function ErrorEnLaPagina({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const t = useTranslations("common.componentes");
  useEffect(() => {
    // Con SENTRY_DSN configurado llega a Sentry; sin él, solo a la
    // consola (ver `src/lib/sentry-opciones.ts`).
    Sentry.captureException(error);
    console.error("[error]", error);
  }, [error]);

  return (
    <main id="contenido" className="flex flex-1 flex-col items-center justify-center bg-zinc-50 px-6 py-24 text-center">
      <p className="text-sm font-medium text-brand-teal-dark">{t("algoHaFallado")}</p>
      <h1 className="mt-2 text-2xl font-semibold text-zinc-900 sm:text-3xl">{t("noHemosPodidoCargar")}</h1>
      <p className="mt-3 max-w-md text-zinc-600">
        Ha sido un fallo nuestro, no tuyo. Puedes reintentarlo ahora mismo; si vuelve a pasar,
        escríbenos y lo miramos.
      </p>
      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        <button
          type="button"
          onClick={reset}
          className="rounded-lg bg-brand-navy px-6 py-3 font-medium text-white transition-colors hover:bg-brand-navy-dark"
        >{t("reintentar")}</button>
        <Link
          href="/"
          className="rounded-lg border border-zinc-300 bg-white px-6 py-3 font-medium text-zinc-700 transition-colors hover:border-zinc-400"
        >{t("volverAlInicio")}</Link>
      </div>
      {error.digest ? (
        <p className="mt-8 font-mono text-xs text-zinc-500">Referencia del error: {error.digest}</p>
      ) : null}
    </main>
  );
}
