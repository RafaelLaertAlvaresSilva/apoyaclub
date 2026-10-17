import type { AppLocale } from "@/i18n/routing";

/**
 * Fase 14: datos que dependen del país/idioma, centralizados aquí en vez
 * de escritos sueltos en componentes o páginas. Cuando se añada un
 * idioma/mercado nuevo (p. ej. Portugal), esta es la única tabla que hay
 * que ampliar para que los formatos de moneda, fecha y número — y el
 * día de mañana, catálogos como provincias — cambien solos en toda la
 * aplicación.
 *
 * España es y seguirá siendo el único mercado activo por ahora: no hay
 * ninguna lista fija de provincias ni de categorías deportivas, porque
 * el club las escribe libremente (`ClubProfile.province`, `ClubTeam.sport`)
 * y el buscador las obtiene de los valores reales ya guardados
 * (`lib/search.ts`), no de un catálogo cerrado en el código. Si algún
 * mercado futuro necesitara una lista cerrada (p. ej. un desplegable de
 * provincias en vez de texto libre), su tabla iría aquí, junto a
 * `currency`.
 */
export type LocaleConfig = {
  /** Código de idioma-región para `Intl` (`Intl.NumberFormat`, `Intl.DateTimeFormat`...). */
  intlLocale: string;
  currency: {
    /** Código ISO 4217, para `Intl.NumberFormat` con `style: "currency"`. */
    code: string;
    /** Símbolo mostrado en textos que no pasan por `Intl.NumberFormat` (p. ej. un `input` con sufijo). */
    symbol: string;
  };
  /** Zona horaria por defecto de este mercado, para fechas en emails y PDFs generados en el servidor. */
  timeZone: string;
};

export const LOCALE_CONFIG: Record<AppLocale, LocaleConfig> = {
  es: {
    intlLocale: "es-ES",
    currency: { code: "EUR", symbol: "€" },
    timeZone: "Europe/Madrid",
  },
  // Portugués de Portugal, no de Brasil: es el mercado al que se abre.
  pt: {
    intlLocale: "pt-PT",
    currency: { code: "EUR", symbol: "€" },
    timeZone: "Europe/Lisbon",
  },
  // Inglés de Reino Unido: euros, día antes que mes y hora de Madrid,
  // porque quien lo lee en inglés sigue mirando clubes de España.
  en: {
    intlLocale: "en-GB",
    currency: { code: "EUR", symbol: "€" },
    timeZone: "Europe/Madrid",
  },
};

/** El nombre de cada idioma escrito en ese mismo idioma, que es como lo
 * busca quien no entiende el que está viendo. */
export const NOMBRE_DEL_IDIOMA: Record<AppLocale, string> = {
  es: "Español",
  pt: "Português",
  en: "English",
};

/** Lo que usa Open Graph (`og:locale`), con guion bajo. */
export const LOCALE_OPEN_GRAPH: Record<AppLocale, string> = {
  es: "es_ES",
  pt: "pt_PT",
  en: "en_GB",
};

/**
 * El `intlLocale` de un idioma cualquiera, con el español como red: un
 * valor raro (una cookie vieja, un idioma guardado que ya no existe) no
 * debe romper un formato de número.
 */
export function intlLocaleDe(locale: string | null | undefined): string {
  return (LOCALE_CONFIG as Record<string, LocaleConfig>)[locale ?? ""]?.intlLocale ?? LOCALE_CONFIG.es.intlLocale;
}
