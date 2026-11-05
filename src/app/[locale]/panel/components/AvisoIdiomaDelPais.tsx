"use client";

import { Link, usePathname } from "@/i18n/navigation";
import type { AppLocale } from "@/i18n/routing";
import { LANG_HTML } from "@/config/locales";

/**
 * Un club de Brasil (o de Portugal) que usa el panel en otro idioma.
 *
 * Pasó el 5-11-2026: un club de Brasil se registró desde un enlace en
 * español y usaba el panel con el traductor de Chrome. Leía portugués
 * de traductor ("Proteger identidade" en vez de "Salvar"), y al guardar
 * la página se rompía: el traductor cambia el texto por debajo de React
 * y React no encuentra lo que pintó. Por eso el panel ya no se deja
 * traducir (ver el layout) y, en su lugar, este aviso le ofrece su
 * idioma de verdad, escrito en ese idioma, en la misma página.
 */
export function AvisoIdiomaDelPais({
  idioma,
  texto,
  boton,
}: {
  idioma: AppLocale;
  texto: string;
  boton: string;
}) {
  const ruta = usePathname();
  return (
    <div lang={LANG_HTML[idioma]} className="border-b border-sky-200 bg-sky-50">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-x-4 gap-y-2 px-4 py-2.5 text-sm text-sky-950 sm:px-6">
        <p className="min-w-0 flex-1">{texto}</p>
        <Link
          href={ruta}
          locale={idioma}
          hrefLang={LANG_HTML[idioma]}
          className="rounded-lg bg-accion px-3 py-1.5 font-medium text-sobre-color hover:bg-accion-fuerte"
        >
          {boton}
        </Link>
      </div>
    </div>
  );
}
