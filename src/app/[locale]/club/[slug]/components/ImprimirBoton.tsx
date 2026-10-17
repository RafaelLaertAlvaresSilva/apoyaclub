"use client";

import { useTranslations } from "next-intl";

/**
 * "Imprimir ficha": abre el cuadro de imprimir del navegador, que es
 * también donde se elige "Guardar como PDF".
 *
 * No genera un PDF propio a propósito. El navegador ya lo hace bien y
 * en todos los sistemas, y lo que cambia en papel —sin cabecera, sin
 * pie, sin botones, con el QR— lo deciden las clases `print:` de la
 * propia página. Así la hoja impresa y la página son la misma cosa y no
 * pueden contar cosas distintas.
 */
export function ImprimirBoton() {
  const t = useTranslations("club.ficha");
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="inline-flex items-center gap-2 rounded-lg border border-zinc-300 bg-white px-4 py-2.5 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-100"
    >
      <span aria-hidden="true">🖨️</span>
      {t("imprimir")}
    </button>
  );
}
