import type { AppLocale } from "@/i18n/routing";
import { LOCALE_CONFIG } from "@/config/locales";

/**
 * Fase 14: formato de moneda, fecha y número según el idioma actual, en
 * vez de instancias de `Intl.NumberFormat("es-ES")` /
 * `Intl.DateTimeFormat("es-ES")` sueltas por el código. Reciben siempre
 * el `locale` explícito (el que da `useLocale()` en componentes, o el
 * `params.locale` de la página/Server Action) para que funcionen igual
 * en cliente y servidor.
 */

export function formatearMoneda(valor: number, locale: AppLocale): string {
  const { intlLocale, currency } = LOCALE_CONFIG[locale];
  return new Intl.NumberFormat(intlLocale, {
    style: "currency",
    currency: currency.code,
    maximumFractionDigits: valor % 1 === 0 ? 0 : 2,
  }).format(valor);
}

export function formatearNumero(valor: number, locale: AppLocale): string {
  return new Intl.NumberFormat(LOCALE_CONFIG[locale].intlLocale).format(valor);
}

export function formatearFecha(
  fecha: string | Date,
  locale: AppLocale,
  opciones: Intl.DateTimeFormatOptions = { day: "numeric", month: "long", year: "numeric" },
): string {
  const { intlLocale, timeZone } = LOCALE_CONFIG[locale];
  return new Intl.DateTimeFormat(intlLocale, { ...opciones, timeZone }).format(
    typeof fecha === "string" ? new Date(fecha) : fecha,
  );
}
