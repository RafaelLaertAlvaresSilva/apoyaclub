import { routing } from "@/i18n/routing";
import { LANG_HTML } from "@/config/locales";

/**
 * La cabecera `Link` que le dice a Google, en cada página pública, cuál
 * es su dirección buena (canónica) y cuáles son sus versiones en los
 * otros idiomas.
 *
 * Search Console avisó el 17-11-2026 de páginas "Duplicadas: el usuario
 * no ha indicado ninguna versión canónica". Dos causas:
 *
 *   - Solo la ficha del club y /patrocinar decían su canónica; el resto
 *     (portada, /para-clubes, /buscar con filtros…) no, y Google veía
 *     `/es/buscar?pais=ES` y `/es/buscar` como páginas repetidas.
 *   - next-intl ponía él solo esta cabecera, pero con "br" como idioma,
 *     que para Google es bretón: /pt y /br le parecían la misma página
 *     en portugués. Aquí va "pt-BR" (`LANG_HTML`), y next-intl ya no la
 *     pone (`alternateLinks: false` en `i18n/routing.ts`).
 *
 * La canónica es siempre la dirección sin parámetros. Coincide con la
 * que ya ponen en su HTML la ficha del club y /patrocinar, así que no
 * hay señales contradictorias.
 */
export function cabeceraLinkSeo(siteUrl: string, pathname: string): string | null {
  const [, idioma, ...resto] = pathname.split("/");
  if (!(routing.locales as readonly string[]).includes(idioma)) return null;
  const ruta = resto.length && resto.join("/") ? `/${resto.join("/")}` : "";
  const url = (locale: string) => `${siteUrl}/${locale}${ruta}`;
  const enlaces = [`<${url(idioma)}>; rel="canonical"`];
  for (const locale of routing.locales) {
    enlaces.push(`<${url(locale)}>; rel="alternate"; hreflang="${LANG_HTML[locale]}"`);
  }
  enlaces.push(`<${url(routing.defaultLocale)}>; rel="alternate"; hreflang="x-default"`);
  return enlaces.join(", ");
}
